<template>
    <div v-if="installPrompt" class="install-banner">
        <Message severity="info" :sticky="true">
            <div class="flex align-items-center gap-3">
                <span>Deseja instalar o <strong>Êxodo Airsoft</strong> no seu celular?</span>
                <Button label="Instalar" severity="success" size="small" @click="clickInstall" />
                <Button icon="pi pi-times" text @click="installPrompt = null" />
            </div>
        </Message>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import Message from 'primevue/message'

const installPrompt = ref(null)

onMounted(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        installPrompt.value = e
    })

    window.addEventListener('appinstalled', () => {
        installPrompt.value = null
        console.log('PWA instalado com sucesso!')
    })
})

const clickInstall = async () => {
    if (!installPrompt.value) return

    installPrompt.value.prompt()

    const { outcome } = await installPrompt.value.userChoice
    console.log(`Usuário escolheu: ${outcome}`)

    installPrompt.value = null
}
</script>

<style scoped>
.install-banner {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    width: 90%;
    max-width: 500px;
}
</style>