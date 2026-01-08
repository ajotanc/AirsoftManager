<template>
    <div class="flex justify-content-center">
        <QrcodeVue :value="props.id" :size="230" level="H" background="#ffffff" foreground="#000000"
            class="p-2 bg-white" />
    </div>
</template>

<script setup lang="ts">
import QrcodeVue from 'qrcode.vue';

const props = defineProps({
    id: {
        required: false,
        type: String,
        default: '',
    },
});

console.log('QR Code ID:', props);
</script>