<template>
    <div class="install-banner">
        <Message severity="info" :sticky="true">
            <div class="flex align-items-center gap-2">
                <Image src="/exd.webp" imageClass="w-5rem"/>
                <span>Deseja instalar o <strong>{{ TEAM_NAME }}</strong> no seu celular?</span>
                <Button class="absolute top-0 right-0" icon="pi pi-times" text @click="installPrompt = null" />
                <Button label="Instalar" severity="success" size="small" @click="clickInstall" />
            </div>
        </Message>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { TEAM_NAME } from '@/constants/airsoft.ts'

const installPrompt = ref(null)
const visible = ref(true);

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
    bottom: 0;
    left: 0;
    z-index: 9999;
    width: calc(100% - 2.5rem);
    margin: 1rem;
}
</style>