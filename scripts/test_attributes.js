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
};

const localHeaders = {
  'X-Appwrite-Project': localProjectId,
  'Cookie': localCookie,
  'X-Appwrite-Mode': 'admin',
};

async function checkAttributes(collectionId) {
  console.log(`Checking attributes for '${collectionId}'...`);
  
  const cloudRes = await fetch(`${cloudEndpoint}/databases/${cloudDatabaseId}/collections/${collectionId}/attributes`, { headers: cloudHeaders });
  const cloudData = await cloudRes.json();
  const cloudAttrs = (cloudData.attributes || []).map(a => `${a.key} (${a.type}${a.array ? '[]' : ''})`);

  const localRes = await fetch(`${localEndpoint}/databases/${localDatabaseId}/collections/${collectionId}/attributes`, { headers: localHeaders });
  const localData = await localRes.json();
  const localAttrs = (localData.attributes || []).map(a => `${a.key} (${a.type}${a.array ? '[]' : ''})`);

  console.log("Cloud Attrs:", cloudAttrs);
  console.log("Local Attrs:", localAttrs);

  const missingInLocal = (cloudData.attributes || []).filter(ca => !(localData.attributes || []).some(la => la.key === ca.key));
  console.log("Missing in Local:", missingInLocal.map(a => a.key));
}

checkAttributes('operators');
