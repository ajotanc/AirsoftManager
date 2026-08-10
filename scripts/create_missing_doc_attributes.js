import fs from 'fs';
import { Client, Databases, Query } from 'appwrite';

const cloudEndpoint = process.env.VITE_CLOUD_ENDPOINT;
const cloudProjectId = process.env.VITE_CLOUD_PORJECT_ID;
const cloudApiKey = process.env.VITE_CLOUD_API_SECRET;
const cloudDatabaseId = process.env.VITE_CLOUD_DATABASE;

const localEndpoint = process.env.VITE_APPWRITE_ENDPOINT;
const localProjectId = process.env.VITE_APPWRITE_PROJECT_ID;
const localDatabaseId = process.env.VITE_APPWRITE_DATABASE_ID;

const prefsPath = 'C:\\Users\\ajota\\.appwrite\\prefs.json';
const prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
const session = prefs[prefs.current];
const localCookie = session.cookie.split(';')[0];

const cloudClient = new Client()
  .setEndpoint(cloudEndpoint)
  .setProject(cloudProjectId);
cloudClient.headers['X-Appwrite-Key'] = cloudApiKey;
const cloudDb = new Databases(cloudClient);

const cloudHeaders = {
  'X-Appwrite-Project': cloudProjectId,
  'X-Appwrite-Key': cloudApiKey,
  'Content-Type': 'application/json'
};

const localHeaders = {
  'X-Appwrite-Project': localProjectId,
  'Cookie': localCookie,
  'X-Appwrite-Mode': 'admin',
  'Content-Type': 'application/json'
};

const SYSTEM_KEYS = new Set([
  '$id', '$sequence', '$createdAt', '$updatedAt', '$permissions', '$databaseId', '$collectionId'
]);

function inferType(val) {
  if (Array.isArray(val)) {
    return { type: 'string', array: true };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { type: 'integer', array: false };
    return { type: 'float', array: false };
  }
  if (typeof val === 'boolean') {
    return { type: 'boolean', array: false };
  }
  if (typeof val === 'string') {
    // Check if ISO datetime string
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
      return { type: 'datetime', array: false };
    }
    return { type: 'string', array: false };
  }
  return { type: 'string', array: false };
}

async function getLocalAttributes(collectionId) {
  const res = await fetch(`${localEndpoint}/databases/${localDatabaseId}/collections/${collectionId}/attributes`, { headers: localHeaders });
  if (!res.ok) return new Set();
  const json = await res.json();
  return new Set((json.attributes || []).map(a => a.key));
}

async function createLocalAttribute(collectionId, key, typeInfo) {
  const endpoint = `${localEndpoint}/databases/${localDatabaseId}/collections/${collectionId}/attributes/${typeInfo.type}`;
  const body = {
    key: key,
    required: false,
    default: null,
    array: typeInfo.array
  };

  if (typeInfo.type === 'string') {
    body.size = 1000;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: localHeaders,
    body: JSON.stringify(body)
  });

  if (res.ok) {
    console.log(`    + Successfully created attribute '${key}' (${typeInfo.type}${typeInfo.array ? '[]' : ''}) in '${collectionId}'`);
    return true;
  }

  const err = await res.json();
  if (res.status === 409 || err.type === 'attribute_already_exists') {
    return true;
  }
  console.error(`    ❌ Failed to create '${key}' in '${collectionId}': ${res.status}`, err.message || err);
  return false;
}

async function run() {
  console.log("==================================================");
  console.log("🔍 SCANNING CLOUD DOCUMENTS FOR MISSING ATTRIBUTES");
  console.log("==================================================\n");

  const cloudColRes = await fetch(`${cloudEndpoint}/databases/${cloudDatabaseId}/collections?limit=100`, { headers: cloudHeaders });
  const cloudColData = await cloudColRes.json();
  const collections = cloudColData.collections || [];

  let totalNewAttributesCreated = 0;

  for (const col of collections) {
    console.log(`Scanning collection '${col.name}' (${col.$id})...`);
    const localKeys = await getLocalAttributes(col.$id);

    // Fetch sample documents to collect all actual keys
    const docRes = await cloudDb.listDocuments(cloudDatabaseId, col.$id, [Query.limit(50)]);
    const docs = docRes.documents || [];

    if (docs.length === 0) {
      console.log(`   ℹ️ No documents found to inspect.\n`);
      continue;
    }

    // Aggregate all unique keys and infer their types
    const inferredTypes = {};
    for (const doc of docs) {
      for (const [key, val] of Object.entries(doc)) {
        if (!SYSTEM_KEYS.has(key) && val !== null && val !== undefined) {
          if (!inferredTypes[key]) {
            inferredTypes[key] = inferType(val);
          } else if (Array.isArray(val)) {
            inferredTypes[key].array = true;
          }
        }
      }
    }

    const missingKeys = Object.keys(inferredTypes).filter(k => !localKeys.has(k));

    if (missingKeys.length === 0) {
      console.log(`   ✅ Local schema has all ${Object.keys(inferredTypes).length} document attributes.\n`);
      continue;
    }

    console.log(`   ⚠️ Found ${missingKeys.length} missing document attributes:`, missingKeys);
    let createdCount = 0;

    for (const key of missingKeys) {
      const typeInfo = inferredTypes[key];
      const success = await createLocalAttribute(col.$id, key, typeInfo);
      if (success) createdCount++;
    }

    totalNewAttributesCreated += createdCount;
    console.log(`   ✅ Created ${createdCount} missing attributes for '${col.name}'.\n`);
  }

  console.log("==================================================");
  console.log(`🎉 ATTRIBUTE DISCOVERY & CREATION COMPLETE! Total created: ${totalNewAttributesCreated}`);
  console.log("==================================================\n");
}

run();
