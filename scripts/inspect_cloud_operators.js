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

async function inspectOperators() {
  console.log("=== INSPECTING OPERATORS COLLECTION ===");

  // 1. Cloud Collection Attributes
  const cloudAttrRes = await fetch(`${cloudEndpoint}/databases/${cloudDatabaseId}/collections/operators/attributes`, { headers: cloudHeaders });
  const cloudAttrData = await cloudAttrRes.json();
  const cloudAttributes = cloudAttrData.attributes || [];
  console.log(`\nCloud Attribute Count: ${cloudAttributes.length}`);
  console.log("Cloud Attributes:", cloudAttributes.map(a => `${a.key} (${a.type})`));

  // 2. Cloud Sample Documents to see what fields exist on actual documents
  const cloudDocRes = await fetch(`${cloudEndpoint}/databases/${cloudDatabaseId}/collections/operators/documents?limit=5`, { headers: cloudHeaders });
  const cloudDocData = await cloudDocRes.json();
  const sampleDocs = cloudDocData.documents || [];
  console.log(`\nSample Cloud Documents count: ${sampleDocs.length}`);
  if (sampleDocs.length > 0) {
    console.log("Sample Document #1 keys:", Object.keys(sampleDocs[0]));
    console.log("Sample Document #1 content:", JSON.stringify(sampleDocs[0], null, 2));
  }

  // 3. Local Collection Attributes
  const localAttrRes = await fetch(`${localEndpoint}/databases/${localDatabaseId}/collections/operators/attributes`, { headers: localHeaders });
  const localAttrData = await localAttrRes.json();
  const localAttributes = localAttrData.attributes || [];
  console.log(`\nLocal Attribute Count: ${localAttributes.length}`);
  console.log("Local Attributes:", localAttributes.map(a => `${a.key} (${a.type})`));

  // 4. Find differences
  const cloudKeys = new Set(cloudAttributes.map(a => a.key));
  const localKeys = new Set(localAttributes.map(a => a.key));

  const inCloudNotLocal = [...cloudKeys].filter(k => !localKeys.has(k));
  const inLocalNotCloud = [...localKeys].filter(k => !cloudKeys.has(k));

  console.log("\n--- DIFFERENCES IN ATTRIBUTES ---");
  console.log("In Cloud but missing in Local:", inCloudNotLocal);
  console.log("In Local but missing in Cloud:", inLocalNotCloud);

  // Check actual document keys vs local attributes
  if (sampleDocs.length > 0) {
    const docKeys = Object.keys(sampleDocs[0]).filter(k => !k.startsWith('$'));
    const unmappedDocKeys = docKeys.filter(k => !localKeys.has(k));
    console.log("\nFields in actual Cloud Document objects missing in Local Schema:", unmappedDocKeys);
  }
}

inspectOperators();
