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

async function updateAllConfigJson() {
  console.log("=== FULL SYNC OF appwrite.config.json WITH LOCAL APPWRITE ===");

  const configPath = 'd:\\Arquivos de Programas\\Apps\\AirsoftManager\\appwrite.config.json';
  if (!fs.existsSync(configPath)) {
    console.error("Config file not found:", configPath);
    return;
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const collections = config.collections || config.tables || [];

  const localColsRes = await fetch(`${localEndpoint}/databases/${localDatabaseId}/collections?limit=100`, { headers: localHeaders });
  const localColsData = await localColsRes.json();
  const localCollections = localColsData.collections || [];

  for (const localCol of localCollections) {
    const attrRes = await fetch(`${localEndpoint}/databases/${localDatabaseId}/collections/${localCol.$id}/attributes`, { headers: localHeaders });
    const attrData = await attrRes.json();
    const localAttrs = attrData.attributes || [];

    const colInConfig = collections.find(c => c.$id === localCol.$id || c.name === localCol.name);
    if (colInConfig) {
      colInConfig.attributes = localAttrs.map(a => ({
        key: a.key,
        type: a.type,
        status: a.status || 'available',
        required: a.required ?? false,
        array: a.array ?? false,
        size: a.size || null,
        default: a.default ?? null,
        elements: a.elements || null
      }));
      console.log(` ✅ Updated '${localCol.name}' (${localAttrs.length} attributes)`);
    }
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  console.log("\n🎉 appwrite.config.json fully updated and synchronized!");
}

updateAllConfigJson();
