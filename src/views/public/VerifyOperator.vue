<template>
  <div class="flex align-items-center justify-content-center flex-1 surface-ground px-4">
    <div v-if="loading">Buscando dados no sistema...</div>

    <div v-else-if="operator" class="surface-card p-4 shadow-4 border-round max-w-30rem w-full gap-3">
      <Avatar :image="operator.avatar" :icon="!operator.avatar ? 'pi-user' : undefined" class="w-6rem h-6rem"
        shape="circle" />
      <h1 class="text-xl font-bold uppercase m-0 mt-2">{{ operator.name }}</h1>
      <div class="flex flex-column gap-1">
        <span><strong>Codinome:</strong> {{ operator.codename }}</span>
        <span><strong>CPF:</strong> {{ formatCpf(operator.identity!, { pad: true }) }}</span>
        <span><strong>Tipo Sanguíneo:</strong> {{ operator.blood_type }}</span>
      </div>
      <Tag :value="operator.status ? 'Ativo' : 'Inativo'" :severity="operator.status ? 'success' : 'danger'"
        class="text-sm mt-2" />

      <Divider />

      <div class="flex flex-column gap-2">
        <span class="font-bold uppercase text-sm text-red-500">Contato de Emergência</span>
        <div class="flex flex-column gap-1">
          <span>{{ operator.emergency_contact }}</span>
          <div class="flex gap-2">
            <span><a class="no-underline" :href="`tel:${operator.emergency_contact_phone}`">{{
              formatPhone(operator.emergency_contact_phone!, { mask: 'nanp' }) }}</a></span>
            <a :href="`https://wa.me/${operator.emergency_contact_phone}`" class="text-sm text-green-500"
              target="_blank"><i class="pi pi-whatsapp"></i></a>
          </div>
        </div>
      </div>

      <Divider />

      <div class="flex flex-column align-items-start gap-3 w-full">
        <div class="flex flex-column gap-1">
          <span class="font-bold uppercase text-sm text-red-500">Ficha Médica</span>
          <span><strong>Doador de Sangue?</strong> {{ operator.health_plan_name ? 'Sim' : 'Não' }}</span>
        </div>
        <div v-if="operator.health_plan" class="flex flex-column gap-1">
          <span class="font-bold uppercase text-sm text-red-500">Plano de Saúde</span>
          <span><strong>Nome:</strong> {{ operator.health_plan_name || 'Planserv' }}</span>
          <span><strong>Número:</strong> {{ operator.health_plan_number || '00000000000000' }}</span>
        </div>
      </div>

      <div v-if="operator.allergies && operator.allergies.length > 0" class="flex flex-column gap-1 w-full">
        <Divider />
        <span class="font-bold uppercase text-sm text-red-500">Alergia(s)</span>
        <div class="flex gap-2">
          <template v-for="(allergy, index) in operator.allergies" :key="index">
            <Chip :label="allergy" class="text-sm font-bold" />
          </template>
        </div>
      </div>

      <div v-if="operator.continuous_medication" class="flex flex-column gap-2 w-full">
        <Divider />
        <span class="font-bold uppercase text-sm text-red-500">Medicação Contínua</span>
        <div class="flex gap-2">
          <template v-for="(medication, index) in operator.medication_details" :key="index">
            <Chip :label="medication" class="text-sm font-bold" />
          </template>
        </div>
      </div>
    </div>
    <div v-else class="text-red-500 font-bold">
      Operador não encontrado ou QR Code inválido.
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { formatCpf, formatPhone } from '@brazilian-utils/brazilian-utils';
import { OperatorService, type IOperator } from '@/services/operator';

const route = useRoute();
const operator = ref<IOperator>({} as IOperator);
const loading = ref(true);

onMounted(async () => {
  const operatorId = route.params.id as string;

  try {
    const response = await OperatorService.row(operatorId);
    operator.value = response;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

</script>