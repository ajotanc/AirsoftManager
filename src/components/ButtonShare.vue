<template>
  <Button v-bind="$attrs" @click="shareNative" />
</template>

<script setup lang="ts">
import { EVENT_TYPES, TEAM_NAME, TEAM_TAG } from '@/constants/airsoft';
import { cleanHtml, formatDate, limitWords } from '@/functions/utils';
import type { IEvent, IParticipation, IGuestParticipation } from '@/services/event';
import type { IOperator } from '@/services/operator';
import type { IGuest } from '@/services/guest';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';

defineOptions({
  inheritAttrs: false
});

const { event, share } = defineProps<{
  event: IEvent;
  share?: boolean;
}>();

const toast = useToast();

const shareNative = async () => {
  const baseUrl = window.location.origin;
  const { $id, description, location, location_url, date, type, minimum_effective, startTime, endTime, thumbnail, rule, is_finished, allow_visitors, ...eventData } = event;
  const url = `${baseUrl}/events/${$id}?t=${Date.now()}`;

  const title = eventData.title.toUpperCase();

  const participations = eventData.participations as IParticipation<IOperator>[];
  const operators = participations.map(({ checked_in, operator: { codename, role, team } }, i) => {
    const index = (i + 1).toString().padStart((participations.length.toString().length), '0');

    const displayName = role === 'visitor'
      ? `${codename.trim()} (${team})`
      : allow_visitors ?
        `${codename.trim()} (${TEAM_TAG}) 🦅` :
        codename.trim();

    if (is_finished) {
      if (checked_in) {
        return `✅ ${index}. ${displayName}`;
      } else {
        return `❎ ${index}. ~${displayName}~`;
      }
    } else {
      return `${index}. ${displayName}`;
    }
  }).join('\n');

  const guest_participations = eventData.guest_participations as IGuestParticipation<IGuest>[];
  const guests = guest_participations.map(({ checked_in, guest: { codename, team } }, i) => {
    const index = (i + 1).toString().padStart((guest_participations.length.toString().length), '0');

    const displayName = `${codename.trim()} (${team})`;

    if (is_finished) {
      if (checked_in) {
        return `✅ ${index}. ${displayName}`;
      } else {
        return `❎ ${index}. ~${displayName}~`;
      }
    } else {
      return `${index}. ${displayName}`;
    }
  }).join('\n');

  const effective = participations.length + guest_participations.length;
  const newDescription = limitWords(cleanHtml(description), 60);

  const medicalItem = rule && rule.toUpperCase() === "SAR" ? "- 4 Ataduras (12cm, 15cm ou 20cm x 1,80m)" : "- 4 Ataduras / Torniquetes"

  const header = `*${title}*\n-------------------------------------------------`;
  const checkin = `🔗 *Briefing / Check-in:*\n${newDescription}\n\n*Aperte no link acima e confirme a sua presença!*\n${url}`;
  const info = `-------------------------------------------------\n⚠️ *Tipo:* ${EVENT_TYPES[type as keyof typeof EVENT_TYPES]}\n⚠️ *Efetivo Mínimo:* ${minimum_effective}\n⚠️ *Efetivo Atual:* ${effective}/${minimum_effective}`;
  const eventRule = rule ? `⚠️ *Regra:* ${rule}` : null;
  const forbidden = '-------------------------------------------------\n🚫 *Proibido:*\n- O uso de fardas de instituições militares ou forças de segurança.';
  const eventFinished = is_finished ? "-------------------------------------------------\n🎖️ *MISSÃO FINALIZADA!*" : null;
  const details = `-------------------------------------------------\n📅 *Data:* ${formatDate(date).toLocaleDateString('pt-BR')}\n⏰ *Horário:* ${startTime} às ${endTime}\n📍 *Local:* ${location}\n🗾 *Maps:* ${location_url}\n-------------------------------------------------`;

  const visitor = `🚸 *Visitante?* Faça sua inscrição e participe do evento! Acesse o link abaixo:\n${baseUrl}/visitor-registration`;
  const motto = `\n> _"No campo de batalha ou na vida: No *${TEAM_NAME}*, ninguém fica para trás!"_`;

  let mandatoryText = `-------------------------------------------------\n📢 *Obrigatório:*\n- AEG (ponta vermelha/laranja)\n- Pano vermelho\n${medicalItem}\n- Óculos de proteção\n- Apito\n- Braçadeiras (Azul/Amarelo)`;

  if (startTime > "18:00") {
    mandatoryText += '\n- Luz vermelha / Lanterna';
  }

  if (rule && rule.toUpperCase() === "SAR") {
    mandatoryText += `\n- 1-10 Real/Low/Mid Cap\n- 2 Fita Hellermann\n- 2 Braçadeiras de metal\n- 2 Bandagem Israelense (Médico)\n- 1 Alicate/Tesoura (Engenheiro)\n- 1 Bússola (Navegador)`;
  }

  const messageBlocks = [
    header,
    checkin,
    info,
    eventRule,
    operators ? `\n🪖 *Lista de Operadores:*\n${operators}` : null,
    guests ? `\n🪖 *Lista de Convidados:*\n${guests}` : null,
    mandatoryText,
    forbidden,
    eventFinished,
    details,
    allow_visitors ? visitor : null,
    motto
  ];

  const text = messageBlocks.filter(Boolean).join('\n').concat('\n\n');

  if (share && thumbnail && navigator.share) {
    try {
      const response = await fetch(thumbnail);
      const blob = await response.blob();
      const file = new File([blob], `${Date.now()}-thumbnail.webp`, { type: 'image/webp' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return await navigator.share({ files: [file], title, text });
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error("Erro no share de arquivo:", e);
    }
  }

  if (share && navigator.share) {
    try {
      return await navigator.share({
        title,
        text
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') console.error('Erro no share de texto:', error);
    }
  }

  await copyToClipboard(text.trim());
};

const copyToClipboard = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content);
    toast.add({ severity: 'success', summary: 'Copiado', detail: 'Convite copiado para o clipboard.', life: 3000 });
  } catch (err) {
    console.error("Erro ao copiar:", err);
  }
};
</script>