<template>
  <Dialog v-model:visible="visible" :header="`Estatuto e Conduta - ${TEAM_NAME}`" modal :closable="false"
    :style="{ width: '90vw', maxWidth: '667px' }">
    <div class="flex flex-column gap-2">
      <ScrollPanel @scroll.capture="handleScroll" class="border-1 border-gray-400 border-round p-3"
        style="height: 15rem;">
        <p class="m-0 line-height-2 font-bold">
          TERMO DE CIÊNCIA E ACEITE – ESTATUTO INTEGRAL E CÓDIGO DE CONDUTA
        </p>
        <p class="line-height-2">
          Ao prosseguir, declaro que li, compreendo e aceito integralmente os termos estabelecidos no Estatuto
          Integral e Código de Conduta do Êxodo Airsoft, comprometendo-me a seguir as diretrizes abaixo descritas:
        </p>
        <p class="line-height-2">
          <strong>IDENTIDADE E COMPROMISSO:</strong> Compreendo que o uso do Patch da unidade é um privilégio que
          implica na
          aceitação total deste estatuto. Comprometo-me a zelar pela imagem da equipe, agindo com honra e respeito
          em qualquer evento, treino ou operação.
        </p>
        <p class="line-height-2">
          <strong>SEGURANÇA E PROTEÇÃO:</strong> Declaro ciência de que a segurança é o pilar inegociável. É
          terminantemente proibida a retirada da proteção ocular em "Zona Quente". Reconheço que o descumprimento de normas
          de segurança básica ou conduta de risco facultará à liderança a minha expulsão imediata da atividade ou da unidade.
        </p>
        <p class="line-height-2">
          <strong>LEGALIDADE DO EQUIPAMENTO:</strong> Certifico que meu equipamento de airsoft (AEG/GBB) está em
          conformidade com a legislação vigente, possuindo obrigatoriamente a ponta laranja ou vermelha e a devida nota fiscal
          de compra. Assumo total responsabilidade pelo transporte e porte do equipamento conforme as normas do Exército Brasileiro.
        </p>
        <p class="line-height-2">
          <strong>DOUTRINA E FAIR PLAY:</strong> Aceito os pilares de União, Lealdade e Respeito. Comprometo-me com
          a honestidade nas eliminações, combatendo o "Highlanderismo" (não marcar o acerto). Entendo que o Airsoft é um jogo
          de honra e que minha conduta reflete em todo o grupo.
        </p>
        <p class="line-height-2">
          <strong>REGIME DISCIPLINAR:</strong> Estou ciente de que qualquer desvio de conduta, ato de insubordinação
          ou comportamento antidesportivo me sujeitará ao conselho disciplinar da unidade, podendo resultar em advertência,
          suspensão ou exclusão definitiva, sem prejuízo de responsabilidades civis.
        </p>
        <p class="line-height-2">
          <strong>CONFIDENCIALIDADE:</strong> Comprometo-me a manter sigilo sobre táticas, comunicações internas e
          estratégias da Unidade Êxodo, respeitando a hierarquia e a organização estabelecida pela liderança.
        </p>
        <p class="line-height-2">
          Declaro ser maior de idade (ou possuir autorização legal) e estar em pleno gozo de minhas capacidades
          físicas e mentais para a prática do esporte, isentando a Unidade Êxodo de responsabilidade por incidentes
          decorrentes do descumprimento destas normas.
        </p>
      </ScrollPanel>
      <Message v-if="!canAccept" size="small" variant="simple">
        <span class="font-bold">Role até o final para liberar o botão de aceite.</span>
      </Message>
    </div>
    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button label="Recusar" severity="danger" text @click="handleRefuse" />
        <Button label="Li e Aceito os Termos" icon="pi pi-check" :disabled="!canAccept" @click="handleAccept" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Dialog from "primevue/dialog";
import ScrollPanel from "primevue/scrollpanel";
import Message from "primevue/message";
import Button from "primevue/button";
import { TEAM_NAME } from "@/constants/airsoft";

const visible = defineModel<boolean>("visible", { default: false });

const emit = defineEmits<{
  (e: "accept"): void;
  (e: "refuse"): void;
}>();

const canAccept = ref(false);

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  const bottomReached = target.scrollTop + target.clientHeight >= target.scrollHeight - 5;
  canAccept.value = bottomReached;
};

const handleAccept = () => {
  emit("accept");
  visible.value = false;
};

const handleRefuse = () => {
  emit("refuse");
  visible.value = false;
};
</script>
