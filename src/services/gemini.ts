import { DUE_DATE, TEAM_MOTTO, TEAM_NAME } from '@/constants/airsoft';

export type BroadcastPromptType = 'school_reminder' | 'recovery_reminder' | 'birthday_reminder' | 'monthly_fee_reminder' | 'custom';

export interface GenerateBroadcastParams {
  promptType: BroadcastPromptType;
  operatorName?: string;
  codename?: string;
  operatorId?: string;
  extraContext?: string;
}

export const GeminiService = {
  async generateBroadcast(params: GenerateBroadcastParams): Promise<string> {
    const baseUrl = window.location.origin;

    let linkText = '';

    if (params.promptType === 'school_reminder') {
      linkText = `\n\n🔗 *Acesse para realizar sua prova:*\n${baseUrl}/administrative/school`;
    } else if (params.promptType === 'recovery_reminder') {
      linkText = `\n\n🚨 *Acesse para regularizar na Recuperação:*\n${baseUrl}/administrative/school/recovery`;
    } else if (params.promptType === 'birthday_reminder') {
      const linkUrl = params.operatorId ? `${baseUrl}/happy-birthday/${params.operatorId}` : `${baseUrl}/dashboard`;
      linkText = `\n\n🎂 *Acesse o link:*\n${linkUrl}`;
    } else if (params.promptType === 'monthly_fee_reminder') {
      linkText = `\n\n💳 *Acesse para realizar a prestação de contas e pagamento:*\n${baseUrl}/finance/payments`;
    }

    try {
      const response = await fetch('/api/generate-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.text) {
          return `${data.text}${linkText}`;
        }
      }
    } catch (error) {
      console.warn("Edge function indisponível. Utilizando modelo fallback.", error);
    }

    return `${this.getFallbackMessage(params)}${linkText}`;
  },

  getFallbackMessage(params: GenerateBroadcastParams): string {
    const nameStr = params.codename || params.operatorName || 'Operador';

    switch (params.promptType) {
      case 'school_reminder':
        return `🪖 *CONVOCAÇÃO TÁTICA ESCOLA ${TEAM_NAME.toUpperCase()}* 📜🎯\n\nAtenção equipe! O prazo para renovação das certificações semestrais está ativo.\n\n_Mantenha seu conhecimento afiado e garanta seu acesso às próximas missões._ ⚡\n\n⏱️ *Tempo estimado:* 3 a 5 min\n🏆 *Recompensa:* +250 XP por matéria (+750 XP total)`;
      case 'recovery_reminder':
        return `🚨 *ALERTA DE RECUPERAÇÃO TÁTICA* ⚠️⚔️\n\nAtenção Operadores! O período de recuperação da Escola ${TEAM_NAME} está aberto.\n\n_Regularize suas matérias pendentes o quanto antes para liberar seu acesso ao sistema. ${TEAM_MOTTO}!_ 🛡️💪`;
      case 'birthday_reminder':
        return `🎂 *FELIZ ANIVERSÁRIO, OPERADOR ${nameStr.toUpperCase()}!* 🥳🎉\n\nHoje é dia de celebrar mais um ano de vida do nosso irmão de farda *${nameStr}*!\n\n_Que sua jornada seja repleta de honra, saúde, vitórias e muitos combates memoráveis!_ ⚔️🎖️\n\nParabéns, guerreiro! 🎉🪖⚡👊`;
      case 'monthly_fee_reminder':
        return `💳 *LEMBRETE DE MENSALIDADE DA EQUIPE* 💰🛡️\n\nAtenção Operadores! Lembrete do vencimento da mensalidade do time no dia *${DUE_DATE}*.\n\n_Mantenha suas obrigações em dia para podermos investir em melhorias para a nossa equipe!_ 🦅🔥`;
      default:
        return `📢 *COMUNICADO DA COMANDÂNCIA ${TEAM_NAME.toUpperCase()}* 🪖🚩\n\nAtenção operadores, mantenham a disciplina, o equipamento pronto e a prontidão tática para nossas próximas instruções!\n\n_União, lealdade e respeito!_ 💪🛡️⚔️`;
    }
  }
};
