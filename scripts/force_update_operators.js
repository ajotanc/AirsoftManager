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

const localHeaders = {
  'X-Appwrite-Project': localProjectId,
  'Cookie': localCookie,
  'X-Appwrite-Mode': 'admin',
  'Content-Type': 'application/json'
};

const SYSTEM_KEYS = new Set([
  '$id', '$sequence', '$createdAt', '$updatedAt', '$permissions', '$databaseId', '$collectionId'
]);

async function forceUpdateOperators() {
  console.log("=== FORCE UPDATING OPERATORS DATA FROM CLOUD ===");

  const cloudDocsRes = await cloudDb.listDocuments(cloudDatabaseId, 'operators', [Query.limit(100)]);
  const cloudDocs = cloudDocsRes.documents || [];
  console.log(`Fetched ${cloudDocs.length} operators from Cloud.`);

  for (const doc of cloudDocs) {
    const dataFields = {};
    for (const [k, v] of Object.entries(doc)) {
      if (!SYSTEM_KEYS.has(k)) {
        dataFields[k] = v;
      }
    }

    const res = await fetch(`${localEndpoint}/databases/${localDatabaseId}/collections/operators/documents/${doc.$id}`, {
      method: 'PATCH',
      headers: localHeaders,
      body: JSON.stringify({
        data: dataFields,
        permissions: doc.$permissions || []
      })
    });

    if (res.ok) {
      console.log(` ✅ Updated operator ${doc.$id} (${doc.codename} - Name: ${doc.name})`);
    } else {
      const err = await res.json();
      console.error(` ❌ Failed operator ${doc.$id}: ${res.status}`, err.message || err);
    }
  }
}

forceUpdateOperators();
