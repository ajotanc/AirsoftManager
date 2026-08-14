import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Query } from 'appwrite';

// Load .env if running standalone
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const cloudEndpoint = process.env.VITE_CLOUD_ENDPOINT;
const cloudProjectId = process.env.VITE_CLOUD_PORJECT_ID;
const cloudApiKey = process.env.VITE_CLOUD_API_SECRET;
const cloudDatabaseId = process.env.VITE_CLOUD_DATABASE;

const localEndpoint = process.env.VITE_APPWRITE_ENDPOINT;
const localProjectId = process.env.VITE_APPWRITE_PROJECT_ID;
const localDatabaseId = process.env.VITE_APPWRITE_DATABASE_ID;

// Read local session cookie from Appwrite CLI prefs
const prefsPath = 'C:\\Users\\ajota\\.appwrite\\prefs.json';
let localCookie = '';
if (fs.existsSync(prefsPath)) {
  try {
    const prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
    const session = prefs[prefs.current];
    localCookie = session && session.cookie ? session.cookie.split(';')[0] : '';
  } catch (err) {
    console.warn("⚠️ Não foi possível ler o cookie de sessão do CLI local:", err.message);
  }
}

async function fetchDocuments(endpoint, projectId, databaseId, headers, collectionId = 'school_answers') {
  let allDocs = [];
  let offset = 0;
  const pageSize = 100;

  while (true) {
    const params = new URLSearchParams();
    params.append('queries[]', Query.limit(pageSize));
    params.append('queries[]', Query.offset(offset));

    const url = `${endpoint}/databases/${databaseId}/collections/${collectionId}/documents?${params.toString()}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Falha ao listar documentos: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    const docs = data.documents || [];
    console.log(`  📥 [${collectionId}] Offset ${offset}: obtidos ${docs.length} de ${data.total} documentos`);
    allDocs.push(...docs);

    if (docs.length === 0 || allDocs.length >= data.total) {
      break;
    }
    offset += docs.length;
  }

  return allDocs;
}

async function updateDocument(endpoint, projectId, databaseId, headers, collectionId, docId, dataPayload) {
  const url = `${endpoint}/databases/${databaseId}/collections/${collectionId}/documents/${docId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: dataPayload
    })
  });

  if (!res.ok) {
    throw new Error(`Falha ao atualizar doc ${docId}: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

async function runMigrationForTarget(name, endpoint, projectId, databaseId, headers) {
  console.log(`\n========================================`);
  console.log(`🚀 Iniciando Migração no Ambiente: ${name.toUpperCase()}`);
  console.log(`Endpoint: ${endpoint} | Project: ${projectId}`);
  console.log(`========================================`);

  try {
    const docs = await fetchDocuments(endpoint, projectId, databaseId, headers, 'school_answers');
    console.log(`📋 Total de respostas encontradas em school_answers: ${docs.length}`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const doc of docs) {
      const op2 = doc.operator2;
      const currentOp = doc.operator;

      // Obter o ID do operador vindo de operator2
      const targetOpId = typeof op2 === 'object' && op2 !== null ? op2.$id : (op2 ? String(op2) : null);
      const currentOpId = typeof currentOp === 'object' && currentOp !== null ? currentOp.$id : (currentOp ? String(currentOp) : null);

      if (!targetOpId || targetOpId === currentOpId) {
        skippedCount++;
        continue;
      }

      try {
        await updateDocument(endpoint, projectId, databaseId, headers, 'school_answers', doc.$id, {
          operator: targetOpId
        });
        console.log(`  ✅ [${doc.$id}] Vinculado operator2 (${targetOpId}) -> operator`);
        updatedCount++;
      } catch (err) {
        console.error(`  ❌ [${doc.$id}] Erro:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Resumo da Migração (${name.toUpperCase()}):`);
    console.table({
      'Total de Registros': docs.length,
      'Atualizados': updatedCount,
      'Já atualizados / Sem op2': skippedCount,
      'Erros': errorCount
    });
  } catch (error) {
    console.error(`❌ Erro no ambiente ${name}:`, error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const target = args.find(a => a.startsWith('--env='))?.split('=')[1] || 'all';

  if (target === 'local' || target === 'all') {
    if (!localCookie) {
      console.warn("⚠️ Sem cookie local do Appwrite CLI. Pulando local.");
    } else {
      const localHeaders = {
        'X-Appwrite-Project': localProjectId,
        'Cookie': localCookie,
        'X-Appwrite-Mode': 'admin'
      };
      await runMigrationForTarget('local', localEndpoint, localProjectId, localDatabaseId, localHeaders);
    }
  }

  if (target === 'cloud' || target === 'all') {
    if (!cloudApiKey) {
      console.warn("⚠️ Sem API Key do Cloud no .env. Pulando cloud.");
    } else {
      const cloudHeaders = {
        'X-Appwrite-Project': cloudProjectId,
        'X-Appwrite-Key': cloudApiKey
      };
      await runMigrationForTarget('cloud', cloudEndpoint, cloudProjectId, cloudDatabaseId, cloudHeaders);
    }
  }

  console.log("\n✨ Processo finalizado com sucesso!");
}

main();
