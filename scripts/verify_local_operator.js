import fs from 'fs';

const localEndpoint = process.env.VITE_APPWRITE_ENDPOINT;
const localProjectId = process.env.VITE_APPWRITE_PROJECT_ID;
const localDatabaseId = process.env.VITE_APPWRITE_DATABASE_ID;

const prefsPath = 'C:\\Users\\ajota\\.appwrite\\prefs.json';
const prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
const session = prefs[prefs.current];
const localCookie = session.cookie.split(';')[0];

const localHeaders = {
  'X-Appwrite-Project': localProjectId,
  'Cookie': localCookie,
  'X-Appwrite-Mode': 'admin',
};

async function verifyLocalOperator() {
  const res = await fetch(`${localEndpoint}/databases/${localDatabaseId}/collections/operators/documents?limit=2`, { headers: localHeaders });
  const data = await res.json();
  const doc = (data.documents || [])[0];
  
  console.log("=== LOCAL OPERATOR SAMPLE DOCUMENT ===");
  console.log("Doc ID:", doc.$id);
  console.log("Codename:", doc.codename);
  console.log("Name (Nome):", doc.name);
  console.log("XP:", doc.xp);
  console.log("Level:", doc.level);
  console.log("Badges count:", doc.badges?.length);
  console.log("Courses count:", doc.courses?.length);
  console.log("Instagram:", doc.instagram);
  console.log("Shirt Size:", doc.shirt_size);
  console.log("Quote:", doc.quote);
  console.log("Profession:", doc.profession);
  console.log("Availability:", doc.availability);
  console.log("Full Doc Keys:", Object.keys(doc));
}

verifyLocalOperator();
