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
          <h1 class="text-2xl font-bold m-0 text-500">Escola {{ NAME }} - {{ semesterInfo.label }}</h1>
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
                      <span class="text-600 cursor-pointer py-1" @click="openLink('courses')">
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
              </div>
            </template>

          </Card>
        </div>
      </div>

      <!-- Histórico de Avaliações por Semestre -->
      <div v-if="history.length > 0" class="flex flex-column gap-3 mt-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-2">
            <i class="ri-history-line text-2xl text-primary"></i>
            <h2 class="text-xl font-bold m-0 text-700">Histórico de Avaliações por Semestre</h2>
          </div>
        </div>

        <Card class="shadow-3 border-round-xl">
          <template #content>
            <div class="flex flex-column gap-4">
              <div v-for="(group, semesterLabel) in groupedHistory" :key="semesterLabel" class="flex flex-column gap-3">
                <div class="flex align-items-center gap-2 pb-2 border-bottom-1 border-200">
                  <i class="ri-calendar-event-line text-lg text-primary"></i>
                  <span class="font-bold text-lg text-700">Semestre {{ semesterLabel }}</span>
                  <Tag :value="`${group.length} Prova(s)`" severity="secondary" rounded class="text-xs" />
                </div>

                <div class="grid">
                  <div v-for="item in group" :key="item.$id" class="col-12 md:col-6 lg:col-4">
                    <div @click="openTest(item.category, item.$id)"
                      class="flex justify-content-between align-items-center p-3 border-round border-1 border-200 surface-card hover:border-primary cursor-pointer transition-all transition-duration-300 shadow-1">
                      <div class="flex flex-column gap-1">
                        <div class="flex align-items-center gap-2">
                          <span class="font-bold text-800">{{ getModuleLabel(item.category) }}</span>
                          <span class="text-xs text-500">Tentativa #{{ item.attempt_number || 1 }}</span>
                        </div>
                        <span class="text-xs text-500"><i class="ri-time-line"></i> {{ dayjs(item.completed_at).format("DD/MM/YYYY HH:mm") }}</span>
                      </div>
                      <div class="flex align-items-center gap-2">
                        <Tag :value="`${item.percentage ?? 0}%`" :severity="(item.percentage ?? 0) >= 70 ? 'success' : 'danger'" rounded />
                        <i class="ri-arrow-right-s-line text-xl text-500"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";
import { Card, Tag, Button, ProgressBar, Skeleton } from "primevue";
import { findNavItemByKey, openLink } from "@/constants/navigation";
import { useOperator } from "@/composables/useOperator";
import { SchoolService, type IReadinessLevel, type ISchoolAnswer, type ISemester, SCHOOL_CATEGORIES, type SchoolCategory } from "@/services/school";
import { NAME } from "@/constants/airsoft";

const router = useRouter();
const { operator } = useOperator();

const isLoading = ref(true);
const semesterInfo = ref<ISemester>({} as ISemester);
const readiness = ref<IReadinessLevel>({ color: 'secondary', message: '', force: false });

const userAnswers = ref<ISchoolAnswer[]>([]);
const history = ref<ISchoolAnswer[]>([]);

const getAttemptSemester = (completedAt?: string | Date | null): string => {
  if (!completedAt) return semesterInfo.value.label;
  return SchoolService.getSemesterInfo(completedAt).label;
};

const groupedHistory = computed(() => {
  const groups: Record<string, ISchoolAnswer[]> = {};
  for (const item of history.value) {
    const sem = getAttemptSemester(item.completed_at);
    if (!groups[sem]) groups[sem] = [];
    groups[sem].push(item);
  }
  return groups;
});

const getModuleLabel = (category: SchoolCategory) => {
  return modules.value.find(m => m.category === category)?.label;
};

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

const manuals = computed(() => findNavItemByKey("manuals"));

const modules = computed(() => {
  const PASSING_SCORE = 70;

  return manuals.value.map(({ category, label, icon, url, description }) => {
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
      progressInfo.questionsCount = answer.questions?.length || 0;
      progressInfo.score = answer.score || 0;
      progressInfo.correct = answer.correct ?? Math.round((percentage / 100) * (answer.questions?.length || 10));

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
      description,
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

</script>

<style scoped>
:deep(.p-progressbar-danger .p-progressbar-value) {
  background-color: var(--red-500) !important;
}
</style>