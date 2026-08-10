import fs from 'fs';

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

/**
 * Fetch all attributes for a collection from Cloud
 */
async function getCloudAttributes(collectionId) {
  const res = await fetch(`${cloudEndpoint}/databases/${cloudDatabaseId}/collections/${collectionId}/attributes`, { headers: cloudHeaders });
  if (!res.ok) return [];
  const json = await res.json();
  return json.attributes || [];
}

/**
 * Fetch all attributes for a collection from Local
 */
async function getLocalAttributes(collectionId) {
  const res = await fetch(`${localEndpoint}/databases/${localDatabaseId}/collections/${collectionId}/attributes`, { headers: localHeaders });
  if (!res.ok) return [];
  const json = await res.json();
  return json.attributes || [];
}

/**
 * Create an attribute on Local Appwrite
 */
async function createLocalAttribute(collectionId, attr) {
  const typeMap = {
    string: 'string',
    integer: 'integer',
    float: 'float',
    boolean: 'boolean',
    datetime: 'datetime',
    email: 'email',
    url: 'url',
    ip: 'ip',
    enum: 'enum'
  };

  const attrType = typeMap[attr.type] || 'string';
  let endpoint = `${localEndpoint}/databases/${localDatabaseId}/collections/${collectionId}/attributes/${attrType}`;

  const body = {
    key: attr.key,
    required: attr.required ?? false,
    default: attr.default ?? null,
    array: attr.array ?? false
  };

  if (attrType === 'string') {
    body.size = attr.size || 1000;
  } else if (attrType === 'enum') {
    body.elements = attr.elements || [];
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: localHeaders,
    body: JSON.stringify(body)
  });

  if (res.ok) {
    return true;
  }

  const err = await res.json();
  // If already exists, ignore
  if (res.status === 409 || err.type === 'attribute_already_exists') {
    return true;
  }
  console.error(`❌ Failed to create attribute ${attr.key} (${attrType}) in ${collectionId}: ${res.status}`, err.message || err);
  return false;
}

async function syncAllSchemas() {
  console.log("==================================================");
  console.log("🛠️ SYNCING SCHEMA ATTRIBUTES (CLOUD -> LOCAL)");
  console.log("==================================================\n");

  const cloudColRes = await fetch(`${cloudEndpoint}/databases/${cloudDatabaseId}/collections?limit=100`, { headers: cloudHeaders });
  const cloudColData = await cloudColRes.json();
  const collections = cloudColData.collections || [];

  let totalAdded = 0;

  for (const col of collections) {
    console.log(`Checking schema for collection '${col.name}' (${col.$id})...`);
    const cloudAttrs = await getCloudAttributes(col.$id);
    const localAttrs = await getLocalAttributes(col.$id);

    const localKeySet = new Set(localAttrs.map(a => a.key));
    const missingInLocal = cloudAttrs.filter(ca => !localKeySet.has(ca.key));

    if (missingInLocal.length === 0) {
      console.log(`   ✅ Up to date (${localAttrs.length} attributes).`);
      continue;
    }

    console.log(`   Found ${missingInLocal.length} missing attributes in Local schema. Creating...`);
    let addedCount = 0;

    for (const attr of missingInLocal) {
      console.log(`    + Adding '${attr.key}' (${attr.type}${attr.array ? '[]' : ''})...`);
      const success = await createLocalAttribute(col.$id, attr);
      if (success) addedCount++;
    }

    totalAdded += addedCount;
    console.log(`   ✅ Added ${addedCount} attributes to '${col.name}'.\n`);
  }

  console.log("==================================================");
  console.log(`🎉 SCHEMA SYNC COMPLETE! Total new attributes added: ${totalAdded}`);
  console.log("==================================================\n");
}

syncAllSchemas();
