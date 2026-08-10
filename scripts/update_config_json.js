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

async function updateConfigJson() {
  console.log("=== UPDATING appwrite.config.json WITH LATEST SCHEMAS ===");

  const configPath = 'd:\\Arquivos de Programas\\Apps\\AirsoftManager\\appwrite.config.json';
  if (!fs.existsSync(configPath)) {
    console.error("Config file not found:", configPath);
    return;
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const collections = config.collections || config.tables || [];

  const localRes = await fetch(`${localEndpoint}/databases/${localDatabaseId}/collections/operators/attributes`, { headers: localHeaders });
  const localData = await localRes.json();
  const localAttrs = localData.attributes || [];

  console.log(`Fetched ${localAttrs.length} attributes from local Appwrite for 'operators'.`);

  // Find operators collection in appwrite.config.json
  const opCol = collections.find(c => c.$id === 'operators' || c.name === 'operators' || c.key === 'operators');

  if (opCol) {
    opCol.attributes = localAttrs.map(a => ({
      key: a.key,
      type: a.type,
      status: a.status || 'available',
      required: a.required ?? false,
      array: a.array ?? false,
      size: a.size || null,
      default: a.default ?? null,
      elements: a.elements || null
    }));

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log(` ✅ Updated appwrite.config.json with all ${localAttrs.length} attributes for 'operators'!`);
  } else {
    console.log("Collection 'operators' not found by $id in appwrite.config.json");
  }
}

updateConfigJson();
