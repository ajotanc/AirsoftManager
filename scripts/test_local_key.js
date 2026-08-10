import fs from 'fs';

const localEndpoint = "http://localhost:8090/v1";
const localProjectId = process.env.VITE_APPWRITE_PROJECT_ID;
const localDatabaseId = process.env.VITE_APPWRITE_DATABASE_ID;

const apiKey = "standard_1c81d9a82d73ff1fd17b37c78a034d78c3cb9c88d4dff12797d7edb0b1a041a70a42f80f971813ef368518d364b085b4c60731768497812587df269d9e857cab9a35c2dfefa8f970e9be0183fe50d8eea014400e5497cfab382a2f4e82f8270b6336df5f258e67baaf80b079330a92d463be158e92f27df5638dfb3866f8509f";

async function testLocalWithApiKey() {
  try {
    const res = await fetch(`${localEndpoint}/databases/${localDatabaseId}/collections`, {
      headers: {
        'X-Appwrite-Project': localProjectId,
        'X-Appwrite-Key': apiKey,
      }
    });
    const data = await res.json();
    console.log("Local Collections Status (with API Key on http://localhost:8090/v1):", res.status);
    if (res.status === 200) {
      console.log(`Found ${data.total} collections in Local Database:`);
      data.collections.forEach(c => console.log(` - ${c.name} (${c.$id})`));
    } else {
      console.error("Local Error:", data);
    }
  } catch (err) {
    console.error("Fetch Local Error:", err);
  }
}

testLocalWithApiKey();
