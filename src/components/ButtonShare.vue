<template>
  <Button v-bind="$attrs" @click="shareNative" />
</template>

<script setup lang="ts">
import { EVENT_TYPES, TEAM_NAME } from '@/constants/airsoft';
import { cleanHtml, formatDate, limitWords } from '@/functions/utils';
import type { IEvent, IParticipation, IVisitorParticipation } from '@/services/event';
import type { IOperator } from '@/services/operator';
import type { IVisitor } from '@/services/visitor';
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
  const { $id, description, location, location_url, date, type, minimum_effective, startTime, endTime, thumbnail, rule, is_finished, ...eventData } = event;
  const url = `${baseUrl}/events/${$id}?t=${Date.now()}`;

  const title = eventData.title.toUpperCase();

  const participations = eventData.participations as IParticipation<IOperator>[];
  const operators = participations.map(({ checked_in, operator: { codename } }, i) => {
    const index = (i + 1).toString().padStart((participations.length.toString().length), '0');
    const name = codename.trim();

    if (is_finished) {
      if (checked_in) {
        return `✅ ${index}. ${name}`;
      } else {
        return `❎ ${index}. ~${name}~`;
      }
    } else {
      return `${index}. ${name}`;
    }
  }).join('\n');

  const visitor_participations = eventData.visitor_participations as IVisitorParticipation<IVisitor>[];
  const visitors = visitor_participations.map(({ checked_in, visitor: { codename, team } }, i) => {
    const index = (i + 1).toString().padStart((visitor_participations.length.toString().length), '0');
    const name = codename.trim();

    if (is_finished) {
      if (checked_in) {
        return `✅ ${index}. ${name} (${team})`;
      } else {
        return `❎ ${index}. ~${name} (${team})~`;
      }
    } else {
      return `${index}. ${name} (${team})`;
    }
  }).join('\n');

  const effective = participations.length + visitor_participations.length;
  const newDescription = limitWords(cleanHtml(description), 60);

  const header = `*${title}*\n-------------------------------------------------`;
  const checkin = `🔗 *Briefing / Check-in:*\n${newDescription}\n\n${url}\n*Aperte no link acima e confirme a sua presença!*`;
  const info = `-------------------------------------------------\n⚠️ *Tipo:* ${EVENT_TYPES[type as keyof typeof EVENT_TYPES]}\n⚠️ *Efetivo Mínimo:* ${minimum_effective}\n⚠️ *Efetivo Atual:* ${effective}/${minimum_effective}`;
  const eventRule = rule ? `⚠️ *Regra:* ${rule}` : null;
  const required = `-------------------------------------------------\n📢 *Obrigatório:*\n- Pano vermelho\n- 4 ataduras / torniquetes\n- Óculos de proteção\n- Apito`;
  const eventFinished = is_finished ? "-------------------------------------------------\n🎖️ *MISSÃO FINALIZADA!*" : null;
  const footer = `-------------------------------------------------\n📅 *Data:* ${formatDate(date).toLocaleDateString('pt-BR')}\n⏰ *Horário:* ${startTime} às ${endTime}\n📍 *Local:* ${location}\n🗾 *Maps:* ${location_url}\n-------------------------------------------------\n\n> _"No campo de batalha ou na vida: No *${TEAM_NAME}*, ninguém fica para trás!"_`;

  const messageBlocks = [
    header,
    checkin,
    info,
    eventRule,
    operators ? `\n🪖 *Lista de Operadores:*\n${operators}` : null,
    visitors ? `\n🪖 *Lista de Visitantes:*\n${visitors}` : null,
    required,
    eventFinished,
    footer,
  ];

  const text = messageBlocks.filter(Boolean).join('\n').concat('\n\n');

  if (share && thumbnail && navigator.share) {
    try {
      const response = await fetch(thumbnail);
      const blob = await response.blob();
      const file = new File([blob], `${Date.now()}-thumbnail.webp`, { type: 'image/webp' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return await navigator.share({ files: [file], title, text: text.concat('\n@todos') });
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