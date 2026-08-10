import fs from 'fs';
import path from 'path';

const cloudEndpoint = process.env.VITE_CLOUD_ENDPOINT;
const cloudProjectId = process.env.VITE_CLOUD_PORJECT_ID;
const cloudApiKey = process.env.VITE_CLOUD_API_SECRET;
const cloudDatabaseId = process.env.VITE_CLOUD_DATABASE;

const localEndpoint = process.env.VITE_APPWRITE_ENDPOINT;
const localProjectId = process.env.VITE_APPWRITE_PROJECT_ID;
const localDatabaseId = process.env.VITE_APPWRITE_DATABASE_ID;

// Read cookie from Appwrite CLI prefs.json
const prefsPath = 'C:\\Users\\ajota\\.appwrite\\prefs.json';
const prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
const session = prefs[prefs.current];
const cookieStr = session.cookie.split(';')[0]; // "a_session_console=..."

console.log("Local Auth Cookie:", cookieStr);

async function testLocalWithCookie() {
  try {
    const res = await fetch(`${localEndpoint}/databases/${localDatabaseId}/collections`, {
      headers: {
        'X-Appwrite-Project': localProjectId,
        'Cookie': cookieStr,
        'X-Appwrite-Mode': 'admin'
      }
    });
    const data = await res.json();
    console.log("Local Collections Status (with cookie):", res.status);
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

testLocalWithCookie();
