const cloudEndpoint = process.env.VITE_CLOUD_ENDPOINT;
const cloudProjectId = process.env.VITE_CLOUD_PORJECT_ID;
const cloudApiKey = process.env.VITE_CLOUD_API_SECRET;
const cloudDatabaseId = process.env.VITE_CLOUD_DATABASE;

const localEndpoint = process.env.VITE_APPWRITE_ENDPOINT;
const localProjectId = process.env.VITE_APPWRITE_PROJECT_ID;
const localDatabaseId = process.env.VITE_APPWRITE_DATABASE_ID;

console.log("Cloud Config:", { cloudEndpoint, cloudProjectId, cloudDatabaseId });
console.log("Local Config:", { localEndpoint, localProjectId, localDatabaseId });

async function testCloud() {
  try {
    const res = await fetch(`${cloudEndpoint}/databases/${cloudDatabaseId}/collections`, {
      headers: {
        'X-Appwrite-Project': cloudProjectId,
        'X-Appwrite-Key': cloudApiKey,
      }
    });
    const data = await res.json();
    console.log("Cloud Collections Status:", res.status);
    if (res.status === 200) {
      console.log(`Found ${data.total} collections in Cloud Database:`);
      data.collections.forEach(c => console.log(` - Collection: ${c.name} (ID: ${c.$id})`));
    } else {
      console.error("Cloud Error:", data);
    }
  } catch (err) {
    console.error("Fetch Cloud Error:", err);
  }
}

async function testLocal() {
  try {
    const res = await fetch(`${localEndpoint}/databases/${localDatabaseId}/collections`, {
      headers: {
        'X-Appwrite-Project': localProjectId,
        'X-Appwrite-Key': cloudApiKey,
      }
    });
    const data = await res.json();
    console.log("Local Collections Status:", res.status);
    if (res.status === 200) {
      console.log(`Found ${data.total} collections in Local Database:`);
      data.collections.forEach(c => console.log(` - Collection: ${c.name} (ID: ${c.$id})`));
    } else {
      console.error("Local Error:", data);
    }
  } catch (err) {
    console.error("Fetch Local Error:", err);
  }
}

async function run() {
  console.log("--- Testing Cloud ---");
  await testCloud();
  console.log("\n--- Testing Local ---");
  await testLocal();
}

run();
