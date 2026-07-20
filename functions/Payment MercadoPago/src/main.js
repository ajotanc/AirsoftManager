import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { Client, Databases, ID } from 'node-appwrite';
import crypto from 'crypto';

// 1. Inicializa o Mercado Pago com o seu Access Token
const clientMP = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const preferenceM = new Preference(clientMP);
const paymentMP = new Payment(clientMP);

export default async ({ req, res, log, error }) => {
  const client = new Client()
    // .setEndpoint("http://host.docker.internal:8090/v1")
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

  const databases = new Databases(client);

  // ==========================================
  // ROTA A: WEBHOOK (IPN / Notificações)
  // ==========================================
  // O Mercado Pago envia notificações via query string (ex: ?topic=payment&id=123)
  const topic = req.query.topic || req.body.type || req.body.topic;
  const resourceId = req.query.id || req.body?.data?.id || req.body?.resource;
  const dataId = String(req.body?.data?.id || req.body?.resource || resourceId);

  if (topic && topic !== 'payment') {
    log(`Topic ignorado: ${topic}`);
    return res.json({ ignored: true });
  }

  if (topic === 'payment' && resourceId) {
    log(`--- Processando Webhook para o Pagamento: ${resourceId} ---`);

    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-request-id'];

    const secret = process.env.MP_WEBHOOK_SECRET;

    // pula verificação se não tiver secret configurado (dev local)
    /*
    if (secret) {
      const parts = xSignature.split(',');
      const ts = parts.find(p => p.trim().startsWith('ts=')).split('=')[1].trim();
      const hash = parts.find(p => p.trim().startsWith('v1=')).split('=')[1].trim();

      const dataId = String(req.body?.data?.id || resourceId);
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(manifest);
      const sha = hmac.digest('hex');

      if (sha !== hash) {
        error(`❌ Assinatura inválida. sha:${sha} hash:${hash}`);
        return res.json({ error: 'Signature failed' }, 403);
      }
      log('✅ Assinatura verificada.');
    } else {
      log('⚠️ MP_WEBHOOK_SECRET não configurado — verificação pulada (dev).');
    }
    */

    try {
      const paymentData = await paymentMP.get({ id: dataId });

      if (paymentData.status === 'approved') {
        const paymentDocId = paymentData.metadata.id; // Recuperamos o ID do Appwrite que enviamos na criação

        const feeAmount = paymentData.charges_details?.reduce((acc, charge) => {
          return acc + (charge.amounts?.original || 0);
        }, 0) ?? 0;

        const fee = feeAmount.toFixed(2).toString();

        // 1. Busca o documento de pagamento original para pegar os valores e relacionamentos
        const payment = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID,
          'payments',
          paymentDocId
        );

        // Evita processar duas vezes (Idempotência)
        if (payment.status === 'paid') {
          return res.json({ message: 'Pagamento já processado.' });
        }

        // 2. Atualiza status do pagamento
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID,
          'payments',
          paymentDocId,
          { status: 'paid' }
        );

        // 3. Atualiza Meta (Goal)
        if (payment.goal) {
          const goal = payment.goal;
          await databases.updateDocument(
            process.env.APPWRITE_DATABASE_ID,
            'goals',
            goal.$id,
            { current_amount: goal.current_amount + payment.amount }
          );
        }

        // 4. Registra no Fluxo de Caixa (Calculando a taxa aproximada se quiser)
        // O MP traz taxas detalhadas em paymentData.charges_details se precisar do valor exato
        const now = new Date();

        await databases.createDocument(
          process.env.APPWRITE_DATABASE_ID,
          'cashflow',
          ID.unique(),
          {
            description: payment.description,
            amount: payment.amount,
            fee,
            type: "income",
            category: payment.category,
            reference: payment.reference,
            date: now.toISOString(),
            payment: payment.$id,
          }
        );

        // 5. Ativa o Operador (caso seja matrícula/mensalidade)
        if (payment.category === "enrollment") {
          await databases.updateDocument(
            process.env.APPWRITE_DATABASE_ID,
            'operators',
            payment.operator.$id,
            { status: true, role: "operator" }
          );
        }

        log(`💰 Sucesso! Pagamento ${resourceId} integrado ao sistema Êxodo.`);
      }
      return res.json({ received: true });
    } catch (err) {
      error("Erro no processamento do Webhook MP: " + err.message);
      return res.json({ error: 'Erro interno no Webhook' }, 500);
    }
  }

  // ==========================================
  // ROTA B: CRIAÇÃO DE CHECKOUT (PREFERENCE)
  // ==========================================
  if (req.method === 'POST') {
    log("💳 Gerando link de Checkout Pro...");
    
    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, unit_price, title, description, email } = payload;

      const baseUrl = process.env.FRONTEND_URL;

      const body = {
        items: [
          {
            id,
            title,
            description,
            quantity: 1,
            unit_price,
            currency_id: 'BRL'
          }
        ],
        payer: {
          email
        },
        back_urls: {
          success: `${baseUrl}/administrative/finance/payments?status=success`,
          failure: `${baseUrl}/administrative/finance/payments?status=error`,
          pending: `${baseUrl}/administrative/finance/payments?status=pending`
        },
        notification_url: process.env.MP_WEBHOOK_URL || 'https://boxing-bit-ease-displays.trycloudflare.com',
        // auto_return: 'approved',
        metadata: {
          id
        },
        // Opcional: Define métodos de pagamento permitidos
        payment_methods: {
          excluded_payment_types: [
            { id: 'ticket' } // Remove boleto se quiser apenas Pix/Cartão
          ],
          installments: 1 // Força pagamento à vista como você pediu
        }
      };

      const result = await preferenceM.create({ body });

      log(`Checkout gerado com sucesso: ${result.init_point}`);

      // Retornamos a URL para o seu Vue.js fazer o redirecionamento
      return res.json({ url: result.init_point });

    } catch (err) {
      error("Erro ao criar preferência MP: " + err.message);
      return res.json({ error: err.message }, 500);
    }
  }

  return res.json({ error: 'Nenhuma rota correspondente' }, 404);
};
