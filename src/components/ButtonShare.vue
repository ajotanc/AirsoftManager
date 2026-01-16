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
  const url = `${baseUrl}/events/${event.$id}?t=${Date.now()}`;

  const title = event.title.toUpperCase();

  const participations = event.participations as IParticipation<IOperator>[];
  const operators = participations.map(({ operator }, i) =>
    `${(i + 1).toString().padStart(2, '0')}. ${operator.codename}`
  ).join('\n');

  const visitor_participations = event.visitor_participations as IVisitorParticipation<IVisitor>[];
  const visitors = visitor_participations.map(({ visitor }, i) =>
    `${(i + 1).toString().padStart(2, '0')}. ${visitor.codename}`
  ).join('\n');

  const effective = participations.length + visitor_participations.length;

  const header = `*${title}*\n-------------------------------------------------`;
  const checkin = `🔗 *Briefing / Check-in:*\n${url}\n\n*Aperte no link acima e confirme a sua presença!*`;
  const info = `-------------------------------------------------\n⚠️ *Tipo:* ${EVENT_TYPES[event.type as keyof typeof EVENT_TYPES]}\n⚠️ *Efetivo Mínimo:* ${event.minimum_effective}\n⚠️ *Efetivo Atual:* ${effective}/${event.minimum_effective}`;
  const footer = `-------------------------------------------------\n📅 *Data:* ${formatDate(event.date, true)}\n⏰ *Horário:* ${event.startTime} às ${event.endTime}\n📍 *Local:* ${event.location}\n🗾 *Maps:* ${event.location_url}\n-------------------------------------------------\n\n> _"No campo de batalha ou na vida: No *${TEAM_NAME}*, ninguém fica para trás!"_`;

  const messageBlocks = [
    header,
    checkin,
    info,
    operators ? `\n🪖 *Lista de Operadores:*\n${operators}` : null,
    visitors ? `\n🪖 *Lista de Visitantes:*\n${visitors}` : null,
    footer
  ];

  const text = messageBlocks.filter(Boolean).join('\n').trim();

  if (navigator.share) {
    try {
      await navigator.share({ title, text });
    } catch (err) {
      console.log('Compartilhamento cancelado!');
    }
  } else {
    try {
      await navigator.clipboard.writeText(text);

      toast.add({
        severity: 'success',
        summary: 'Convite Copiado',
        detail: 'O conteúdo do convite está no seu clipboard.',
        life: 3000
      });
    } catch (err) {
      console.error("Falha ao copiar:", err);
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível copiar para o clipboard.',
        life: 3000
      });
    }
  }
};
</script>