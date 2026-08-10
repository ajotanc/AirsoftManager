import fs from 'fs';

const cloudEndpoint = process.env.VITE_CLOUD_ENDPOINT;
const cloudProjectId = process.env.VITE_CLOUD_PORJECT_ID;
const cloudApiKey = process.env.VITE_CLOUD_API_SECRET;
const cloudDatabaseId = process.env.VITE_CLOUD_DATABASE;

const localEndpoint = process.env.VITE_APPWRITE_ENDPOINT;
const localProjectId = process.env.VITE_APPWRITE_PROJECT_ID;
const localDatabaseId = process.env.VITE_APPWRITE_DATABASE_ID;

// Read local session cookie from Appwrite CLI prefs
const prefsPath = 'C:\\Users\\ajota\\.appwrite\\prefs.json';
const prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
const session = prefs[prefs.current];
const localCookie = session.cookie ? session.cookie.split(';')[0] : '';

console.log("=== APPWRITE MIGRATION PRE-CHECK ===");
console.log("Cloud Endpoint:", cloudEndpoint, "Project:", cloudProjectId);
console.log("Local Endpoint:", localEndpoint, "Project:", localProjectId);

async function runCheck() {
  // 1. Cloud Collections
  console.log("\n[1/2] Checking Cloud Collections & Document Counts...");
  const cloudRes = await fetch(`${cloudEndpoint}/databases/${cloudDatabaseId}/collections?limit=100`, {
    headers: {
      'X-Appwrite-Project': cloudProjectId,
      'X-Appwrite-Key': cloudApiKey,
    }
  });
  
  if (cloudRes.status !== 200) {
    console.error("Cloud check failed:", cloudRes.status, await cloudRes.text());
    return;
  }

  const cloudData = await cloudRes.json();
  console.log(`Cloud Database has ${cloudData.collections.length} collections.`);
  
  const collectionStats = [];
  for (const col of cloudData.collections) {
    const docRes = await fetch(`${cloudEndpoint}/databases/${cloudDatabaseId}/collections/${col.$id}/documents?limit=1`, {
      headers: {
        'X-Appwrite-Project': cloudProjectId,
        'X-Appwrite-Key': cloudApiKey,
      }
    });
    const docData = await docRes.json();
    collectionStats.push({ name: col.name, id: col.$id, cloudDocs: docData.total ?? 0 });
  }

  console.table(collectionStats);

  // 2. Local Collections
  console.log("\n[2/2] Checking Local Collections...");
  const localRes = await fetch(`${localEndpoint}/databases/${localDatabaseId}/collections?limit=100`, {
    headers: {
      'X-Appwrite-Project': localProjectId,
      'Cookie': localCookie,
      'X-Appwrite-Mode': 'admin'
    }
  });

  if (localRes.status !== 200) {
    console.error("Local check failed with cookie:", localRes.status, await localRes.text());
  } else {
    const localData = await localRes.json();
    console.log(`Local Database has ${localData.collections.length} collections.`);
  }
}

runCheck();
