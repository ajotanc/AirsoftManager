<template>
  <div class="flex align-items-center justify-content-center min-h-screen px-2 py-2">
    <div class="surface-card p-4 shadow-3 border-round w-full lg:w-12">
      <div class="flex justify-content-center align-items-center mb-3">
        <div class="avatar-wrapper cursor-pointer" @click="triggerFileInput">
          <Avatar :image="operator.avatar" :icon="!operator.avatar ? 'pi pi-user' : undefined"
            class="text-xl bg-gray-200" size="xlarge" shape="circle" :style="loadingAvatar ? 'opacity: 0.5' : ''" />

          <div class="avatar-overlay">
            <i class="pi pi-camera text-white text-xl"></i>
          </div>

          <div v-if="loadingAvatar" class="avatar-loading">
            <i class="pi pi-spin pi-spinner text-white text-2xl font-bold"></i>
          </div>
          <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleUpdateAvatar" />
        </div>
      </div>

      <Message v-if="!authStore.isProfileComplete" severity="error" class="mb-3" closable>
        <strong>Complete seu perfil para acessar todas as funcionalidades do sistema.</strong>
      </Message>

      <VisitorProfileForm v-if="authStore.isVisitor" :loading="loading" @submit="handleUpdateProfile" />
      <OperatorProfileForm v-else :loading="loading" @submit="handleUpdateProfile" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import Avatar from "primevue/avatar";
import Message from "primevue/message";

import { useOperator } from "@/composables/useOperator";
import { OperatorService, type IOperator } from "@/services/operator";
import { BadgeService } from "@/services/badge";
import VisitorProfileForm from "@/components/profile/VisitorProfileForm.vue";
import OperatorProfileForm from "@/components/profile/OperatorProfileForm.vue";

const { updateState, operator, authStore } = useOperator();

const router = useRouter();
const toast = useToast();

const loading = ref(false);
const loadingAvatar = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const handleUpdateProfile = async ({ valid, values }: { valid: boolean; values: Partial<IOperator> }) => {
  if (!valid) return;

  try {
    loading.value = true;

    if (authStore.isVisitor) {
      values.status = valid;
    }

    const operatorUpdated = await OperatorService.update(operator.value.$id, values);
    const opWithBadges = await BadgeService.syncOperatorBadges(operatorUpdated);

    await updateState(opWithBadges);

    toast.add({
      severity: "success",
      summary: "Sucesso",
      detail: "Dados salvos com sucesso!",
      life: 3000,
    });

    router.push("/dashboard");
  } catch (error) {
    const err = error as Error;
    console.error("Erro ao atualizar perfil:", err);
    toast.add({
      severity: "error",
      summary: "Erro",
      detail: err.message || "Falha ao salvar dados do perfil.",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleUpdateAvatar = async (event: Event) => {
  const input = event.target as HTMLInputElement;

  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  if (!file) return;

  try {
    loadingAvatar.value = true;

    const operatorUpdated = await OperatorService.changeAvatar(
      operator.value,
      file
    );

    if (operator.value) {
      await updateState(operatorUpdated);
    }

    toast.add({
      severity: "success",
      summary: "Sucesso",
      detail: "Foto de perfil atualizada!",
      life: 3000,
    });
  } catch (error) {
    console.error("Erro no processo de avatar:", error);
    toast.add({
      severity: "error",
      summary: "Erro",
      detail: "Falha ao processar a imagem.",
      life: 3000,
    });
  } finally {
    loadingAvatar.value = false;
  }
};
</script>

<style scoped>
.avatar-wrapper {
  position: relative;
  display: inline-block;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  aspect-ratio: 1;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 20;
  border-radius: 50%;
}
</style>