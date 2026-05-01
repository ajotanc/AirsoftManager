<template>
  <div class="operator-item">
    <span>{{ op.codename || op.name }}</span>
    <div class="match-actions">
      <Button :label="stat?.kills?.toString() ?? '0'" class="button-icon" severity="secondary" size="small" outlined
        readonly />
      <Button :label="stat?.deaths?.toString() ?? '0'" class="button-icon" severity="danger" size="small" outlined
        readonly />
      <template v-if="isAdmin">
        <Button class="button-icon" icon="ri-crosshair-2-line" size="small" :disabled="disabled"
          @click="emit('kill', op)" />
        <Button class="button-icon" icon="ri-skull-line" size="small" :disabled="disabled" severity="danger"
          @click="emit('death', op)" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IOperator } from '@/services/operator'
import type { ITournamentOperatorStat } from '@/services/stats'

defineProps<{
  op: IOperator
  stat: ITournamentOperatorStat | undefined
  isAdmin: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'kill', op: IOperator): void
  (e: 'death', op: IOperator): void
}>()
</script>