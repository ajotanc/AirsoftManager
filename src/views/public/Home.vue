<template>
  <div class="surface-ground min-h-screen overflow-x-hidden flex flex-column">

    <div class="relative flex flex-column align-items-center justify-content-center"
      style="min-height: 100vh; background: url('/images/background.webp') center/cover no-repeat; background-attachment: fixed;">
      <div class="absolute top-0 left-0 w-full h-full bg-black-alpha-70 z-1"></div>

      <div class="z-2 text-center px-4 w-full max-w-7xl flex flex-column align-items-center gap-6">

        <Image src="/images/exd.webp" imageClass="w-16rem h-16rem" />

        <div class="flex flex-column align-items-center gap-3">
          <Tag severity="warn" variant="outlined" class="p-2 px-3 uppercase font-bold">
            <div class="flex align-items-center gap-2">
              <i class="ri-radar-line blink animation-duration-1000 animation-iteration-infinite"></i>
              <span>Sistema de Gestão Tática Ativo</span>
            </div>
          </Tag>
          <div>
            <h1 class="text-4xl md:text-8xl font-bold text-white m-0 uppercase">
              {{ TEAM_NAME }}
            </h1>
            <p class="md:text-2xl text-white max-w-3xl line-height-3 font-light m-0" style="letter-spacing: 0.05em;">
              Onde a estratégia encontra a irmandade. O comando absoluto do seu <span
                class="text-yellow-500 font-bold">arsenal</span> e da sua <span
                class="text-yellow-500 font-bold">honra</span> em campo.
            </p>
          </div>
        </div>

        <div class="flex flex-column sm:flex-row justify-content-center align-items-center gap-3 w-auto">
          <Button :label="registration.label" :icon="registration.icon" :disabled="registration.disabled"
            :severity="registration.severity" class="text-yellow-900 uppercase shadow-4 w-20rem"
            @click="router.push('/register')" />

          <Button label="ÁREA DO OPERADOR" icon="ri-shield-keyhole-line" severity="warn" outlined
            class="uppercase shadow-4 w-20rem text-yellow-500 border-yellow-500 hover:text-yellow-900 hover:border-yellow-900 hover:bg-yellow-500"
            @click="router.push('/login')" />
        </div>
      </div>
    </div>

    <div class="relative z-5 px-4 md:px-8 mt-5">
      <div class="surface-card p-4 md:p-5 border-round-xl grid text-center shadow-4 border-1 surface-border">
        <div class="col-12 md:col-4 border-bottom-1 md:border-bottom-none md:border-right-1 surface-border py-3">
          <i class="ri-team-line text-4xl text-primary mb-2"></i>
          <h3 class="text-3xl font-bold m-0 text-900">IRMANDADE</h3>
          <q class="text-600 uppercase text-xs font-bold">{{ TEAM_MOTTO }}</q>
        </div>
        <div class="col-12 md:col-4 border-bottom-1 md:border-bottom-none md:border-right-1 surface-border py-3">
          <i class="ri-medal-2-line text-4xl text-primary mb-2"></i>
          <h3 class="text-3xl font-bold m-0 text-900">DOUTRINA</h3>
          <span class="text-600 uppercase text-xs font-bold">União, Lealdade e Respeito</span>
        </div>
        <div class="col-12 md:col-4 py-3">
          <i class="ri-map-pin-line text-4xl text-primary mb-2"></i>
          <h3 class="text-3xl font-bold m-0 text-900">SALVADOR/BA</h3>
          <span class="text-600 uppercase text-xs font-bold">Base de Operações</span>
        </div>
      </div>
    </div>

    <div class="py-8 px-4 md:px-8 mt-5">
      <div class="flex flex-column align-items-center mb-7 text-center">
        <span class="text-primary font-bold uppercase mb-2 text-sm"><i class="ri-terminal-window-line mr-2"></i>Módulos
          do Sistema</span>
        <h2 class="text-4xl md:text-5xl font-bold text-900 m-0 uppercase" style="letter-spacing: -0.05em;">Tecnologia em
          Campo</h2>
      </div>

      <div class="grid justify-content-center gap-4 md:gap-0 max-w-7xl mx-auto">
        <div class="col-12 md:col-4 p-3">
          <Card
            class="surface-card h-full shadow-3 hover:shadow-6 transition-all transition-duration-300 hover:-translate-y-1 border-1 surface-border">
            <template #title>
              <div class="flex flex-column align-items-start gap-2">
                <div class="bg-yellow-300 inline-flex p-3 mb-2" style="border-radius: 0.5rem">
                  <i class="ri-calendar-check-fill text-4xl text-yellow-900"></i>
                </div>
                <span class="text-2xl font-bold text-900 uppercase">Painel de Missões</span>
              </div>
            </template>
            <template #content>
              <p class="text-700 m-0 line-height-3 text-lg">
                Briefing completo, confirmação de efetivo, gestão de caronas e Check-in dinâmico via QR Code no ponto de
                encontro.
              </p>
            </template>
          </Card>
        </div>

        <div class="col-12 md:col-4 p-3">
          <Card
            class="surface-card h-full shadow-3 hover:shadow-6 transition-all transition-duration-300 hover:-translate-y-1 border-1 surface-border">
            <template #title>
              <div class="flex flex-column align-items-start gap-2">
                <div class="bg-yellow-300 inline-flex p-3 mb-2" style="border-radius: 0.5rem">
                  <i class="ri-sword-fill text-4xl text-yellow-900"></i>
                </div>
                <span class="text-2xl font-bold text-900 uppercase">Armaria & Loadout</span>
              </div>
            </template>
            <template #content>
              <p class="text-700 m-0 line-height-3 text-lg">
                Inventário digitalizado das suas plataformas (AEG/GBB) e equipamentos táticos. Controle exigido pelo
                comando.
              </p>
            </template>
          </Card>
        </div>

        <div class="col-12 md:col-4 p-3">
          <Card
            class="surface-card h-full shadow-3 hover:shadow-6 transition-all transition-duration-300 hover:-translate-y-1 border-1 surface-border">
            <template #title>
              <div class="flex flex-column align-items-start gap-2">
                <div class="bg-yellow-300 inline-flex p-3 mb-2" style="border-radius: 0.5rem">
                  <i class="ri-medal-fill text-4xl text-yellow-900"></i>
                </div>
                <span class="text-2xl font-bold text-900 uppercase">Dossiê do Operador</span>
              </div>
            </template>
            <template #content>
              <p class="text-700 m-0 line-height-3 text-lg">
                Métricas de engajamento, conquistas de Badges de mérito, ficha médica e histórico da sua carreira no
                pelotão.
              </p>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <div class="py-8 px-4 md:px-8 surface-section border-top-1 border-bottom-1 surface-border">
      <div class="grid align-items-center max-w-7xl mx-auto">
        <div class="col-12">
          <span
            class="text-primary font-bold uppercase mb-2 text-sm inline-block border-bottom-1 border-primary pb-1">Diretriz
            Operacional</span>
          <h2 class="text-4xl md:text-6xl font-bold text-900 mb-4 uppercase line-height-1"
            style="letter-spacing: -0.05em;">
            "{{ TEAM_MOTTO }}"</h2>
          <p class="text-700 line-height-3 text-xl mb-4 font-light">
            O {{ TEAM_NAME }} não é um time de fim de semana. Somos uma estrutura forjada na dedicação e no respeito
            mútuo.
            Nossa doutrina nos acompanha em qualquer campo.
          </p>
          <div
            class="surface-ground surface-border border-1 border-round flex flex-column md:flex-row text-center md:text-left align-items-center gap-3 p-3 mt-4 text-gray-700">
            <img src="/images/fbda_black.webp" alt="FBDA" class="h-4rem" />
            <div>
              <h4 class="text-base font-bold m-0 uppercase">Esporte Legalizado</h4>
              <p class="text-sm m-0 mt-2 md:mt-0 line-height-3">
                Incentivamos a prática legal do Airsoft. Orientamos e exigimos que nossos operadores busquem a
                regularização
                junto à <strong>FBDA</strong>.
              </p>
            </div>
          </div>
          <p class="m-0 mt-4 text-sm text-gray-700 line-height-3 font-light">A legitimidade operacional fundamenta-se no
            estrito
            cumprimento da
            legislação
            brasileira. O Airsoft é
            uma
            modalidade esportiva regulamentada pela <a class="no-underline text-primary font-bold"
              href="https://mariz.eti.br/Portaria%2002_10-CoLog%20-%20Simulacro.pdf" target="_blank" noreferrer>Portaria
              nº
              002-COLOG (26/02/2010)</a> e pelo <a class="no-underline text-primary font-bold"
              href="https://www2.camara.leg.br/legin/fed/decret/2019/decreto-10030-30-setembro-2019-789175-publicacaooriginal-159118-pe.html"
              target="_blank" noreferrer>Decreto Federal nº 10.030
              (30/09/2019)</a>, o atual <b class="font-bold">R-105</b>. Tais dispositivos, em conjunto com o seu <b
              class="font-bold">Anexo I</b>,
            classificam
            nossos
            equipamentos
            como Produtos Controlados pelo <b class="font-bold">Exército (PCE)</b>, estabelecendo as diretrizes
            mandatórias
            para sua
            posse
            e
            utilização.</p>
        </div>
      </div>
    </div>

    <div class="py-8 px-4 md:px-8 surface-section surface-border">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-6">
          <span class="text-primary font-bold uppercase mb-2 text-sm"><i
              class="ri-map-pin-2-fill mr-2"></i>Localização</span>
          <h2 class="text-4xl md:text-5xl font-bold text-900 m-0 uppercase" style="letter-spacing: -0.05em;">Base
            de
            Operações</h2>
        </div>

        <div class="border-round overflow-hidden shadow-4 border-1 surface-border" style="height: 400px;">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4653.956354439633!2d-38.3188768!3d-12.890397799999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x71617004427c87f%3A0xdaab4516ec4dc77d!2sArena%20Nego%20Bom!5e1!3m2!1spt-BR!2sbr!4v1775841685770!5m2!1spt-BR!2sbr"
            width="100%" height="100%" style="border:0;" allowfullscreen loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
      </div>
    </div>

    <footer class="grid bg-gray-900 flex align-items-center justify-content-between h-15rem p-4">
      <div class="col-12 md:col-4">
        <div class="flex flex-column align-items-center justify-content-center">
          <Image src="/images/exd.webp" imageClass="w-5rem" />
          <span class="text-gray-500 text-sm uppercase font-bold"> {{ TEAM_NAME }}</span>
          <span class="text-gray-500 text-xs uppercase"> {{ TEAM_MOTTO }}</span>
        </div>
      </div>
      <div class="col-12 md:col-4">
        <div class="flex align-items-center justify-content-center">
          <span class="text-gray-500 text-sm">AJOTA {{ year }} &copy; {{ description }}</span>
        </div>
      </div>
      <div class="col-12 md:col-4">
        <div class="flex align-items-center justify-content-center gap-2">
          <a target="_blank" noreferrer href="https://instragram.com/exodoairsoft">
            <i
              class="ri-instagram-line text-2xl text-gray-500 hover:text-gray-300 transition-colors transition-duration-300"></i>
          </a>
          <a target="_blank" noreferrer href="https://wa.me/5571999999999">
            <i
              class="ri-whatsapp-line text-2xl text-gray-500 hover:text-gray-300 transition-colors transition-duration-300"></i>
          </a>
          <a target="_blank" noreferrer href="https://tiktok.com/exodoairsoft">
            <i
              class="ri-tiktok-line text-2xl text-gray-500 hover:text-gray-300 transition-colors transition-duration-300"></i>
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import Button from "primevue/button";
import Card from "primevue/card";
import Tag from "primevue/tag";
import { TEAM_NAME, TEAM_MOTTO } from "@/constants/airsoft";
import { checkRegistrationPeriod } from "@/functions/utils";

const router = useRouter();

const registration = computed(() => {
  const isOpen = checkRegistrationPeriod();

  return {
    label: isOpen ? 'ALISTAR-SE AGORA' : 'RECRUTAMENTO ENCERRADO',
    severity: isOpen ? 'warn' : 'contrast',
    icon: isOpen ? 'ri-arrow-right-line' : 'ri-lock-2-line',
    disabled: !isOpen
  };
});

const year = new Date().getFullYear();
const description = import.meta.env.VITE_TITLE;

</script>

<style scoped>
:deep(.p-button-label) {
  font-weight: bold;
}
</style>