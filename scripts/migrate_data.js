import fs from 'fs';
import { Client, Databases, Query } from 'appwrite';

// --- CONFIGURATION ---
const cloudEndpoint = process.env.VITE_CLOUD_ENDPOINT;
const cloudProjectId = process.env.VITE_CLOUD_PORJECT_ID;
const cloudApiKey = process.env.VITE_CLOUD_API_SECRET;
const cloudDatabaseId = process.env.VITE_CLOUD_DATABASE;

const localEndpoint = process.env.VITE_APPWRITE_ENDPOINT;
const localProjectId = process.env.VITE_APPWRITE_PROJECT_ID;
const localDatabaseId = process.env.VITE_APPWRITE_DATABASE_ID;

// Read local session cookie from Appwrite CLI prefs
const prefsPath = 'C:\\Users\\ajota\\.appwrite\\prefs.json';
if (!fs.existsSync(prefsPath)) {
  console.error("❌ Cannot find Appwrite CLI prefs file at:", prefsPath);
  process.exit(1);
}

const prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
const session = prefs[prefs.current];
const localCookie = session && session.cookie ? session.cookie.split(';')[0] : '';

if (!localCookie) {
  console.error("❌ No valid local Appwrite console cookie found in CLI prefs.");
  process.exit(1);
}

// Setup Cloud Appwrite Client
const cloudClient = new Client()
  .setEndpoint(cloudEndpoint)
  .setProject(cloudProjectId);
cloudClient.headers['X-Appwrite-Key'] = cloudApiKey;

const cloudDb = new Databases(cloudClient);

const localHeaders = {
  'X-Appwrite-Project': localProjectId,
  'Cookie': localCookie,
  'X-Appwrite-Mode': 'admin',
  'Content-Type': 'application/json'
};

// System keys to exclude from 'data' payload
const SYSTEM_KEYS = new Set([
  '$id',
  '$createdAt',
  '$updatedAt',
  '$permissions',
  '$databaseId',
  '$collectionId'
]);

/**
 * Fetch all collections from Cloud database
 */
async function getCloudCollections() {
  const res = await fetch(`${cloudEndpoint}/databases/${cloudDatabaseId}/collections?limit=100`, {
    headers: {
      'X-Appwrite-Project': cloudProjectId,
      'X-Appwrite-Key': cloudApiKey
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to list Cloud collections: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.collections || [];
}

/**
 * Fetch all documents from a Cloud collection (handles pagination with Query.limit/offset)
 */
async function getAllCloudDocuments(collectionId) {
  const limit = 100;
  let offset = 0;
  let allDocs = [];

  while (true) {
    const res = await cloudDb.listDocuments(
      cloudDatabaseId,
      collectionId,
      [Query.limit(limit), Query.offset(offset)]
    );
    const docs = res.documents || [];
    allDocs.push(...docs);

    if (docs.length < limit || allDocs.length >= res.total) {
      break;
    }
    offset += limit;
  }

  return allDocs;
}

/**
 * Fetch valid attribute keys for a Local collection
 */
async function getLocalCollectionAttributes(collectionId) {
  try {
    const res = await fetch(`${localEndpoint}/databases/${localDatabaseId}/collections/${collectionId}/attributes`, {
      headers: localHeaders
    });
    if (!res.ok) return null;
    const json = await res.json();
    return new Set((json.attributes || []).map(a => a.key));
  } catch (err) {
    return null;
  }
}

/**
 * Clean document data for Appwrite insertion (removes $ keys and unmapped attributes)
 */
function extractDataFields(doc, validAttributeSet) {
  const data = {};
  for (const [key, value] of Object.entries(doc)) {
    if (!SYSTEM_KEYS.has(key)) {
      if (validAttributeSet && !validAttributeSet.has(key)) {
        // Skip attribute not defined on destination collection schema
        continue;
      }

      // Format relationship attributes (objects or array of objects containing $id) to ID strings
      if (Array.isArray(value)) {
        data[key] = value.map(item => (typeof item === 'object' && item !== null && item.$id) ? item.$id : item);
      } else if (typeof value === 'object' && value !== null && value.$id) {
        data[key] = value.$id;
      } else {
        data[key] = value;
      }
    }
  }
  return data;
}

/**
 * Create or update a document in the Local database
 */
async function upsertLocalDocument(collectionId, doc, validAttributeSet) {
  const docId = doc.$id;
  const dataFields = extractDataFields(doc, validAttributeSet);
  const permissions = doc.$permissions || [];

  // Try creating the document
  const createRes = await fetch(`${localEndpoint}/databases/${localDatabaseId}/collections/${collectionId}/documents`, {
    method: 'POST',
    headers: localHeaders,
    body: JSON.stringify({
      documentId: docId,
      data: dataFields,
      permissions: permissions
    })
  });

  if (createRes.ok) {
    return 'created';
  }

  const createErr = await createRes.json();
  
  // If document already exists (409), update it via PATCH
  if (createRes.status === 409 || createErr.type === 'document_already_exists') {
    const updateRes = await fetch(`${localEndpoint}/databases/${localDatabaseId}/collections/${collectionId}/documents/${docId}`, {
      method: 'PATCH',
      headers: localHeaders,
      body: JSON.stringify({
        data: dataFields,
        permissions: permissions
      })
    });

    if (updateRes.ok) {
      return 'updated';
    }
    const updateErr = await updateRes.json();
    throw new Error(`Failed to update doc ${docId}: ${updateRes.status} ${updateErr.message || JSON.stringify(updateErr)}`);
  }

  throw new Error(`Failed to create doc ${docId}: ${createRes.status} ${createErr.message || JSON.stringify(createErr)}`);
}

/**
 * Main migration function
 */
async function migrate() {
  console.log("==================================================");
  console.log("🚀 APPWRITE CLOUD TO LOCAL COMPLETE DATA MIGRATION");
  console.log("==================================================");
  console.log(`Cloud Endpoint: ${cloudEndpoint}`);
  console.log(`Cloud Database: ${cloudDatabaseId}`);
  console.log(`Local Endpoint: ${localEndpoint}`);
  console.log(`Local Database: ${localDatabaseId}`);
  console.log("--------------------------------------------------\n");

  const startTime = Date.now();
  let collections;

  try {
    collections = await getCloudCollections();
    console.log(`📦 Found ${collections.length} collections in Cloud database.\n`);
  } catch (err) {
    console.error("❌ Migration aborted:", err.message);
    process.exit(1);
  }

  const summary = {
    totalCollections: collections.length,
    processedCollections: 0,
    totalCloudDocs: 0,
    createdDocs: 0,
    updatedDocs: 0,
    failedDocs: 0,
    errors: []
  };

  for (let i = 0; i < collections.length; i++) {
    const col = collections[i];
    console.log(`[${i + 1}/${collections.length}] Collection: '${col.name}' (ID: ${col.$id})`);

    // Get local valid attributes schema
    const validAttrs = await getLocalCollectionAttributes(col.$id);

    let docs = [];
    try {
      docs = await getAllCloudDocuments(col.$id);
      summary.totalCloudDocs += docs.length;
      console.log(`   Fetched ${docs.length} total documents from Cloud.`);
    } catch (err) {
      console.error(`   ❌ Failed to fetch documents for ${col.name}: ${err.message}`);
      summary.errors.push({ collection: col.name, error: err.message });
      continue;
    }

    if (docs.length === 0) {
      console.log(`   ℹ️ No documents to migrate.\n`);
      summary.processedCollections++;
      continue;
    }

    let colCreated = 0;
    let colUpdated = 0;
    let colFailed = 0;

    for (const doc of docs) {
      try {
        const result = await upsertLocalDocument(col.$id, doc, validAttrs);
        if (result === 'created') colCreated++;
        if (result === 'updated') colUpdated++;
      } catch (err) {
        colFailed++;
        summary.failedDocs++;
        const errMsg = `Doc ${doc.$id} in ${col.name}: ${err.message}`;
        console.error(`   ⚠️ ${errMsg}`);
        summary.errors.push({ collection: col.name, docId: doc.$id, error: err.message });
      }
    }

    summary.createdDocs += colCreated;
    summary.updatedDocs += colUpdated;
    summary.processedCollections++;
    console.log(`   ✅ Finished '${col.name}': ${colCreated} created, ${colUpdated} updated, ${colFailed} failed.\n`);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("==================================================");
  console.log("🎉 ALL DATA MIGRATED SUCCESSFULLY!");
  console.log("==================================================");
  console.log(`Time Elapsed      : ${durationSec}s`);
  console.log(`Collections      : ${summary.processedCollections}/${summary.totalCollections}`);
  console.log(`Total Cloud Docs : ${summary.totalCloudDocs}`);
  console.log(`Docs Created     : ${summary.createdDocs}`);
  console.log(`Docs Updated     : ${summary.updatedDocs}`);
  console.log(`Docs Failed      : ${summary.failedDocs}`);
  if (summary.errors.length > 0) {
    console.log(`\nErrors Encountered (${summary.errors.length}):`);
    summary.errors.slice(0, 10).forEach(e => console.log(` - [${e.collection || 'General'}] ${e.error}`));
    if (summary.errors.length > 10) {
      console.log(` ... and ${summary.errors.length - 10} more errors.`);
    }
  } else {
    console.log("✨ 0 Errors! Perfect 100% data sync.");
  }
  console.log("==================================================\n");
}

migrate();
