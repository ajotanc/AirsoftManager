<template>
    <Toast position="bottom-right" group="pwa">
        <template #message="slotProps">
            <div class="flex flex-column align-items-start" style="flex: 1">
                <div class="flex align-items-center gap-2">
                    <i class="pi pi-refresh" style="font-size: 1.2rem"></i>
                    <span class="font-bold">{{ slotProps.message.summary }}</span>
                </div>
                <div class="font-medium text-sm my-2">{{ slotProps.message.detail }}</div>
                <Button label="Atualizar agora" size="small" severity="success" @click="updateServiceWorker()" />
            </div>
        </template>
    </Toast>
</template>

<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { useToast } from 'primevue/usetoast'
import { watch } from 'vue'

const toast = useToast()
const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW()

watch(needRefresh, (newValue) => {
    if (newValue) {
        toast.add({
            severity: 'info',
            summary: 'Nova Versão!',
            detail: 'Uma atualização do Airsoft Manager está disponível.',
            group: 'pwa',
            life: 0 // Mantém o aviso na tela até o usuário clicar
        })
    }
})

watch(offlineReady, (newValue) => {
    if (newValue) {
        toast.add({
            severity: 'success',
            summary: 'App Pronto',
            detail: 'O sistema agora pode ser usado offline!',
            life: 3000
        })
    }
})
</script>