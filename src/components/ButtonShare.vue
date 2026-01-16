<template>
  <Button v-bind="$attrs" @click="shareNative" />
</template>

<script setup lang="ts">
import { EVENT_TYPES, TEAM_NAME } from '@/constants/airsoft';
import { formatDate } from '@/functions/utils';
import type { IEvent, IParticipation, IVisitorParticipation } from '@/services/event';
import type { IOperator } from '@/services/operator';
import type { IVisitor } from '@/services/visitor';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';

defineOptions({
  inheritAttrs: false
});

const { event } = defineProps<{
  event: IEvent;
}>();

const toast = useToast();

const shareNative = async () => {
  const baseUrl = window.location.origin;
  const { $id, location, location_url, date, type, minimum_effective, startTime, endTime, thumbnail, ...eventData } = event;
  const url = `${baseUrl}/events/${$id}?t=${Date.now()}`;

  const title = eventData.title.toUpperCase();

  const participations = eventData.participations as IParticipation<IOperator>[];
  const operators = participations.map(({ operator }, i) =>
    `${(i + 1).toString().padStart(2, '0')}. ${operator.codename}`
  ).join('\n');

  const visitor_participations = eventData.visitor_participations as IVisitorParticipation<IVisitor>[];
  const visitors = visitor_participations.map(({ visitor }, i) =>
    `${(i + 1).toString().padStart(2, '0')}. ${visitor.codename}`
  ).join('\n');

  const effective = participations.length + visitor_participations.length;

  const header = `*${title}*\n-------------------------------------------------`;
  const checkin = `🔗 *Briefing / Check-in:*\n${url}\n\n*Aperte no link acima e confirme a sua presença!*`;
  const info = `-------------------------------------------------\n⚠️ *Tipo:* ${EVENT_TYPES[type as keyof typeof EVENT_TYPES]}\n⚠️ *Efetivo Mínimo:* ${minimum_effective}\n⚠️ *Efetivo Atual:* ${effective}/${minimum_effective}`;
  const footer = `-------------------------------------------------\n📅 *Data:* ${formatDate(date, true)}\n⏰ *Horário:* ${startTime} às ${endTime}\n📍 *Local:* ${location}\n🗾 *Maps:* ${location_url}\n-------------------------------------------------\n\n> _"No campo de batalha ou na vida: No *${TEAM_NAME}*, ninguém fica para trás!"_`;

  const messageBlocks = [
    header,
    checkin,
    info,
    operators ? `\n🪖 *Lista de Operadores:*\n${operators}` : null,
    visitors ? `\n🪖 *Lista de Visitantes:*\n${visitors}` : null,
    footer
  ];

  const text = messageBlocks.filter(Boolean).join('\n').concat('\n\n');

  try {
    if (thumbnail && navigator.canShare) {
      const response = await fetch(thumbnail);
      const blob = await response.blob();
      const file = new File([blob], `${title}.png`, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title,
          text
        });
        return;
      }
    }

    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url
      });
    } else {
      await copyToClipboard(text);
    }

  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Erro ao compartilhar:', error);
    }
  }
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