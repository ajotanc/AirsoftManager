import { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const { promptType, operatorName, codename, extraContext } = await request.json();
    const apiKey = Netlify.env.get("VITE_GEMINI_API_KEY");
    const teamName = Netlify.env.get("VITE_TEAM_NAME");
    const teamMotto = Netlify.env.get("VITE_TEAM_MOTTO");
    const dueDate = Netlify.env.get("VITE_DUE_DATE");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Gemini API Key não configurada no servidor." }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const systemPrompt = `Você é o assistente tático do time de ${teamName}, com o lema "${teamMotto}". Crie mensagens vibrantes, dinâmicas e motivacionais em tom militar/tático de Airsoft para grupos de WhatsApp. Lembre-se do lema "${teamMotto}".
Use a formatação nativa do WhatsApp da seguinte forma:
- Use *negrito* para títulos, nomes e destaques (*CONVOCAÇÃO*, *ALERTA TÁTICO*).
- Use _itálico_ para lemas, frases de efeito e observações (_Honra, Lealdade e Missão_).
- Use bastante emojis táticos e expressivos de Airsoft/Militar (🪖, 🎯, 🚨, 🎂, 💳, ⚡, 💪, 🛡️, 🎖️, ⚔️, 📜, 🏆, 🔥, 📻, 🚩, 🦅, 👊, ⏱️, 🤝).
NÃO utilize blocos de código (\`\`\`) e NÃO utilize marcadores de citação (>). Mantenha o texto direto, motivador e com no máximo 2 a 3 parágrafos. Não inclua aspas externas no início e fim da resposta.`;

    let userPrompt = "";

    if (promptType === "school_reminder") {
      userPrompt = `Crie uma convocação curta e empolgante para que todos os operadores realizem a avaliação semestral da Escola ${teamName} e fiquem em dia com as regras táticas.`;
    } else if (promptType === "recovery_reminder") {
      userPrompt = "Crie um comunicado de alerta tático urgente convocando os operadores que estão em Modo Recuperação a realizarem a Prova de Recuperação para liberar o acesso ao sistema.";
    } else if (promptType === "birthday_reminder") {
      const nameStr = codename || operatorName || "Guerreiro";
      userPrompt = `Crie uma homenagem de feliz aniversário muito animada e tática de Airsoft para o operador ${nameStr}, desejando muitos combates, honra, vida longa e vitórias.`;
    } else if (promptType === "monthly_fee_reminder") {
      userPrompt = `Crie um lembrete tático motivacional avisando a equipe sobre o vencimento da mensalidade do time no dia ${dueDate}. Incentive o pagamento pontual com honra e espírito de equipe.`;
    } else {
      userPrompt = extraContext || "Crie um comunicado motivacional de alinhamento, união, lealdade e respeito para a equipe de Airsoft.";
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `Gemini API error: ${errText}` }), {
        status: response.status,
        headers: { "content-type": "application/json" },
      });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(JSON.stringify({ text: generatedText.trim() }), {
      headers: { "content-type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || "Erro interno no servidor." }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};

export const config = { path: "/api/generate-broadcast" };
