<template>
  <div class="flex flex-column gap-3 p-3">
    <div v-if="isLoading" class="flex flex-column gap-3">
      <Skeleton width="100%" height="4rem" class="border-round-xl" />
      <div class="grid">
        <div class="col-12 md:col-6 lg:col-4" v-for="i in manuals.length" :key="i">
          <Skeleton width="100%" height="15rem" class="border-round-xl" />
        </div>
      </div>
    </div>

    <div v-else class="flex flex-column gap-4">
      <div class="flex flex-column md:flex-row md:align-items-center justify-content-between gap-3">
        <div class="flex flex-column">
          <h1 class="text-2xl font-bold m-0 text-500">Escola Êxodo - {{ semesterInfo.label }}</h1>
          <p class="text-500 m-0 mt-1">{{ semesterDescription }}</p>
        </div>
        <div class="flex align-items-center gap-3">
          <div class="text-left md:text-right">
            <span class="text-xs text-500 uppercase font-bold">Progresso Geral</span>
            <div class="text-xl font-bold text-primary uppercase">{{ approvedModules }}/{{ modules.length }} Módulos
            </div>
          </div>
        </div>
      </div>

      <div class="grid">
        <div v-for="module in modules" :key="module.category" class="col-12 md:col-6 lg:col-4">
          <Card class="h-full shadow-3 border-round-xl flex flex-column">

            <template #title>
              <div class="flex justify-content-between align-items-center">
                <div class="flex align-items-center gap-1">
                  <i :class="['text-2xl', module.icon]"></i>
                  <span class="text-2xl font-bold text-800">{{ module.label }}</span>
                </div>
                <Tag :value="module.statusLabel" :severity="module.statusSeverity" rounded />
              </div>
            </template>

            <template #subtitle>
              <div class="min-h-3rem text-sm text-500 line-height-3">
                {{ module.description }}
              </div>
            </template>

            <template #content>
              <div class="flex flex-column gap-2 mt-2">
                <div class="flex align-items-start justify-content-between text-sm text-600">
                  <div class="flex flex-column gap-2">
                    <span class="font-bold text-800">Material de Estudo:</span>
                    <div class="flex flex-column">
                      <span class="text-600 cursor-pointer py-1" @click="openDrive">
                        <i class="ri-movie-line text-lg"></i> <span>Cursos</span>
                      </span>
                      <span @click="openManual(module.url!)" class="text-600 cursor-pointer py-1">
                        <i class="ri-file-pdf-2-line text-lg"></i> <span>Manual</span>
                      </span>
                    </div>
                  </div>

                  <div v-if="module.attemptNumber > 0" class="flex align-items-center gap-2 text-primary font-bold">
                    <span>Tentativas: {{ module.attemptNumber }}</span>
                  </div>
                </div>

                <div class="mt-2">
                  <div class="flex justify-content-between align-items-end text-700 mb-1">
                    <span class="text-xs font-bold">Nota da Avaliação</span>
                    <span class="text-xs font-bold uppercase"
                      :class="module.progress >= 70 ? 'text-green-500' : !module.progress ? 'text-600' : 'text-red-500'">
                      {{ module.progress }}% ({{ module.correct }}/{{ module.questionsCount }}) Acertos
                    </span>
                  </div>

                  <ProgressBar :value="module.progress" :showValue="false" :max="10" style="height: 0.5rem" :pt="{
                    value: {
                      style: {
                        backgroundColor: module.progress >= 70 ? 'var(--p-green-500)' : 'var(--p-red-500)'
                      }
                    }
                  }" />
                </div>
              </div>
            </template>

            <template #footer>
              <div class="flex gap-2 w-full pt-3">

                <Button v-if="module.canTakeTest"
                  :label="readiness.force ? 'Recuperação Bloqueada' : module.buttonLabel"
                  :icon="readiness.force ? 'ri-lock-line' : 'ri-edit-2-line'" class="flex-grow-1"
                  :severity="readiness.color" :disabled="readiness.force" @click="openTest(module.category)" />

                <Button v-else label="Prova" icon="ri-medal-line" severity="success" class="flex-grow-1"
                  @click="openTest(module.category, module.id)" />

                <Button icon="ri-book-read-line" severity="secondary" outlined v-tooltip.top="'Ler Manual'"
                  :disabled="!module.url" @click="openManual(module.url!)" />

                <Button v-if="module.attemptNumber > 0" icon="ri-history-line" severity="secondary" outlined
                  v-tooltip.top="'Ver Histórico'" @click="openHistory(module.category)" />
              </div>
            </template>

          </Card>
        </div>
      </div>

    </div>
  </div>

  <Dialog v-model:visible="historyDialog" :header="`Histórico`" modal :style="{ width: '90vw', maxWidth: '375px' }">
    <div class="flex flex-column gap-2">
      <div v-for="item in history" :key="item.$id" @click="openTest(item.category, item.$id)"
        class="flex justify-content-between align-items-center p-3 border-round surface-100 cursor-pointer hover:surface-200 transition-all transition-duration-400">
        <div class="flex flex-column gap-1">
          <span class="font-bold">Tentativa #{{ item.attempt_number }}</span>
          <span class="text-xs text-500">{{ dayjs(item.completed_at).format("DD/MM/YYYY") }}</span>
        </div>
        <Tag :value="`${item?.percentage}%`" :severity="item?.percentage! >= 70 ? 'success' : 'danger'" rounded />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";
import { Card, Tag, Button, ProgressBar, Skeleton } from "primevue";
import { navItems } from "@/constants/navigation";
import { useOperator } from "@/composables/useOperator";
import { SchoolService, type IReadinessLevel, type ISchoolAnswer, type ISemester, SCHOOL_CATEGORIES } from "@/services/school";

const router = useRouter();
const { operator } = useOperator();

const isLoading = ref(true);
const historyDialog = ref(false);
const semesterInfo = ref<ISemester>({} as ISemester);
const readiness = ref<IReadinessLevel>({ color: 'secondary', message: '', force: false });

const userAnswers = ref<ISchoolAnswer[]>([]);
const history = ref<ISchoolAnswer[]>([]);

onMounted(async () => {
  try {
    isLoading.value = true;

    const info = SchoolService.getSemesterInfo();
    semesterInfo.value = info;

    const { latest, all } = await SchoolService.getAnswers(operator.value.$id, SCHOOL_CATEGORIES);
    userAnswers.value = latest;
    history.value = all;

    const missingCount = SCHOOL_CATEGORIES.length - userAnswers.value.length;
    const hasCompletedAll = missingCount === 0;

    readiness.value = SchoolService.getIReadinessLevel(info.daysRemaining, hasCompletedAll, info.isRecoveryPeriod);
  } catch (error) {
    console.error("Erro ao carregar dados da Academia:", error);
  } finally {
    isLoading.value = false;
  }
});

const semesterDescription = computed(() => {
  const info = semesterInfo.value;

  if (!info.label) return "Carregando informações do ciclo...";

  if (info.daysRemaining > 0) {
    const diaString = info.daysRemaining === 1 ? 'dia' : 'dias';
    return `Faltam ${info.daysRemaining} ${diaString} para o encerramento das avaliações do ${info.semester}º semestre.`;
  }

  if (info.daysRemaining === 0) {
    return `Atenção: Hoje é o último dia do ${info.semester}º semestre!`;
  }

  return `O ciclo de avaliações do ${info.semester}º semestre foi encerrado.`;
});

const approvedModules = computed(() => {
  return modules.value.filter(m => m.statusLabel === 'Aprovado').length;
})

const manuals = computed(() =>
  navItems.value
    .find(i => i.label === "Ajuda")?.items
    ?.find(i => i.label === "Manuais")?.items ?? []
);

const descriptions: Record<string, string> = {
  fta: "Esta avaliação valida o conhecimento do operador sobre as normas fundamentais de segurança e convivência, abrangendo desde limites técnicos de potência e distâncias até as condutas éticas e a legislação vigente. O objetivo é garantir a compreensão total sobre as regras de funcionamento das missões e os princípios de honra que sustentam o esporte.",
  sar: "O foco desta etapa é a capacidade de orientação e apoio logístico em ambientes hostis, tratando de situações onde a navegação precisa e a sinalização correta são vitais para o resgate de aliados. A prova contextualiza o uso de ferramentas de direção e protocolos de auxílio, assegurando a localização e extração de componentes isolados em qualquer terreno.",
  rescom: "Aqui é testado o entendimento sobre os protocolos de atendimento e o comportamento realista ao ser atingido, focando na correta utilização dos sistemas de curativos e na postura ética durante o estado de baixa. A avaliação reforça os padrões de imersão tática, validando a conduta do ferido e os procedimentos de socorro que mantêm o realismo em combate."
};

const modules = computed(() => {
  const PASSING_SCORE = 70;

  return manuals.value.map(({ category, label, icon, url }) => {
    const answer = userAnswers.value.find(a => a.category === category);

    const progressInfo = {
      progress: 0,
      statusLabel: "Pendente",
      statusSeverity: "warning",
      canTakeTest: true,
      buttonLabel: "Iniciar Prova",
      hasTakenTest: false,
      attemptNumber: 0,
      questionsCount: 0,
      score: 0,
      correct: 0
    };

    if (answer) {
      const percentage = answer.percentage || 0;
      progressInfo.hasTakenTest = true;
      progressInfo.attemptNumber = answer.attempt_number || 1;
      progressInfo.progress = percentage;
      progressInfo.questionsCount = answer.questions.length;
      progressInfo.score = answer.score || 0;
      progressInfo.correct = answer.correct ?? Math.round((percentage / 100) * answer.questions.length);

      if (percentage >= PASSING_SCORE) {
        progressInfo.statusLabel = "Aprovado";
        progressInfo.statusSeverity = "success";
        progressInfo.canTakeTest = false;
      } else {
        progressInfo.statusLabel = "Reprovado";
        progressInfo.statusSeverity = "danger";
        progressInfo.canTakeTest = true;
        progressInfo.buttonLabel = "Refazer Prova";
      }
    } else if (readiness.value.force) {
      progressInfo.statusLabel = "Bloqueado";
      progressInfo.statusSeverity = "danger";
      progressInfo.canTakeTest = false;
    }

    return {
      id: answer?.$id,
      category,
      label,
      icon,
      description: descriptions[category],
      url,
      ...progressInfo
    };
  });
});

const openManual = (url: string) => {
  if (typeof url === "string") window.open(url, "_blank");
};

const openTest = (category: string, id?: string) => {
  router.push({
    name: 'school-quiz',
    params: { category, id }
  });
};

const openHistory = async (category: string) => {
  historyDialog.value = true;
  history.value = history.value.filter(h => h.category === category);
};

const openDrive = () => {
  window.open('https://drive.google.com/drive/folders/1p3iEL5luK2QF7wT7DxRhqJOW_v1UwzNO?usp=sharing', '_blank');
};
</script>

<style scoped>
:deep(.p-progressbar-danger .p-progressbar-value) {
  background-color: var(--red-500) !important;
}
</style>