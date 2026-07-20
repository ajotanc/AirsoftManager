import { Client, Databases, ID, Query } from 'node-appwrite';

export default async function (context) {
  const client = new Client();
  const databases = new Databases(client);

  client
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;

  const OPERATORS_COLLECTION_ID = 'operators';
  const PAYMENTS_COLLECTION_ID = 'payments';

  const now = new Date();
  const reference = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
  const description = `Mensalidade · ${reference}`;

  try {
    const operators = await databases.listDocuments(
      DATABASE_ID,
      OPERATORS_COLLECTION_ID,
      [
        Query.equal('status', true),
        Query.notEqual('role', 'recruit'),
        Query.notEqual('role', 'visitor')
      ]
    );

    context.log(`Iniciando geração de ${operators.total} mensalidades.`);

    const details = await Promise.all(operators.documents.map(async ({ $id, codename, }) => {
      const existing = await databases.listDocuments(
        DATABASE_ID,
        PAYMENTS_COLLECTION_ID,
        [
          Query.equal('operator', $id),
          Query.equal('reference', reference)
        ]
      );

      if (existing.total > 0) {
        return `Operador ${codename}: Já possui cobrança para ${reference}.`;
      }

      const due_date = new Date(now.getFullYear(), now.getMonth(), Number.parseInt(process.env.DUE_DATE, 10), 23, 59, 59).toISOString();
      const amount = process.env.MONTHLY_FEE;

      await databases.createDocument(
        DATABASE_ID,
        PAYMENTS_COLLECTION_ID,
        ID.unique(),
        {
          operator: $id,
          amount: Number.parseFloat(amount),
          status: 'created',
          category: 'monthly_fee',
          reference,
          due_date,
          description
        }
      );

      return `Operador ${codename}: Mensalidade gerada com sucesso.`;
    }));

    context.log('Processamento concluído com sucesso.');

    return context.res.json({
      message: 'Processamento de mensalidades finalizado.',
      details
    });

  } catch (err) {
    context.error(`Erro crítico na execução: ${err.message}`);
    return context.res.json({
      error: 'Falha ao processar mensalidades.',
      message: err.message
    }, 500);
  }
}
