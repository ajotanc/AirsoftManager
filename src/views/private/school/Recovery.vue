<template>
  <div class="flex flex-column align-items-center p-3">
    <div v-if="loading" class="flex justify-content-center align-items-center">
      <ProgressSpinner />
    </div>

    <template v-else>
      <div class="w-full mb-4 text-left">
        <h1 class="text-4xl font-black uppercase m-0 text-primary tracking-tight">
          Avaliação de Recuperação
        </h1>

        <div class="flex flex-column gap-2 mt-2">
          <p class="text-700 m-0 line-height-3">
            Esta avaliação abrange <strong>{{ questions.length }} questões</strong> ({{ questionsCategory }} de FTA,
            {{ questionsCategory }} de SAR e {{ questionsCategory }} de RESCOM).
            Você precisa atingir no mínimo <strong>70% de aproveitamento ({{ Math.ceil(questions.length * 0.7) }}
              acertos)</strong> para regularizar e liberar
            seu acesso ao sistema.
          </p>
          <SchoolBadges class="mt-2" />
          <q class="font-italic p-1 mt-1 border-left-3 border-400 text-400 text-sm">O conhecimento da regra é a maior
            arma que o ser humano pode obter.</q>
        </div>
      </div>

      <div v-if="isFinished" class="w-full mb-3 p-4 border-round-xl text-white shadow-3 text-center"
        :class="isApproved ? 'bg-green-600' : 'bg-red-600'">
        <h2 class="m-0 text-2xl font-bold">
          {{ isApproved ? 'Aprovado na Recuperação! 🎉' : 'Nota Insuficiente' }}
        </h2>
        <div class="text-4xl font-black my-2">Nota: {{ finalGrade.toFixed(1) }}</div>
        <p class="m-0 text-lg">Você acertou {{ correctCount }} de {{ questions.length }} questões ({{ percentageScore
        }}%)</p>
        <p v-if="!isApproved" class="mt-2 mb-0 text-sm opacity-90">
          É necessário acertar no mínimo 70% das questões para ser aprovado.
        </p>

        <div class="mt-4 flex flex-column md:flex-row justify-content-center gap-2">
          <Button v-if="isApproved" label="Sair" icon="pi pi-home" severity="secondary"
            @click="$router.push('/dashboard')" />
          <Button v-else label="Tentar Novamente" icon="pi pi-refresh" severity="secondary" @click="loadServices" />
        </div>
      </div>

      <div class="w-full card shadow-3 p-0 overflow-hidden border-round-xl">
        <Stepper v-model:value="activeStep">
          <StepPanels>
            <StepPanel v-for="(question, index) in questions" :key="question.$id || index" :value="index">
              <div class="p-3 bg-card">
                <div class="flex flex-wrap md:flex-row justify-content-between align-items-center gap-2 mb-3">
                  <div class="flex align-items-center gap-2">
                    <Tag :value="`Questão ${index + 1} de ${questions.length}`"
                      :severity="difficulty[question.difficulty]" class="uppercase font-bold" />
                    <Tag :value="question.category.toUpperCase()" severity="info" class="uppercase font-bold" />
                  </div>
                  <Tag :value="question.type" :severity="difficulty[question.difficulty]" class="uppercase" />
                </div>

                <div class="text-xl font-bold line-height-3 text-900 white-space-pre-line my-3">
                  {{ question.text }}
                </div>

                <div v-for="(option, optionIndex) in question.options" :key="optionIndex"
                  class="flex align-items-center p-3 mb-2 border-1 border-round-lg transition-all" :class="[
                    !isFinished && answers[index] === option ? 'border-primary bg-primary-100 cursor-pointer' : '',
                    !isFinished ? 'hover:surface-100 hover:text-primary cursor-pointer border-300' : 'cursor-default',
                    isFinished && option === question.correct_option ? 'correct bg-green-100 border-green-500 text-green-900' : '',
                    isFinished && option !== question.correct_option && answers[index] === option ? 'incorrect bg-red-100 border-red-500 text-red-900' : '',
                    isFinished && option !== question.correct_option && answers[index] !== option ? 'opacity-50 border-300' : ''
                  ]" @click="handleClick(index, option)">

                  <RadioButton :inputId="`Q${index}O${optionIndex}`" :disabled="isFinished" :value="option"
                    :modelValue="answers[index]" />

                  <label :for="`Q${index}O${optionIndex}`" class="ml-2 flex-1 text-lg cursor-pointer">{{ option
                  }}</label>
                </div>

                <div class="flex justify-content-between pt-3">
                  <Button label="Voltar" v-if="index > 0" severity="secondary" icon="pi pi-arrow-left"
                    @click="activeStep--" />
                  <div v-else></div>

                  <Button v-if="index < questions.length - 1" label="Próxima" icon="pi pi-arrow-right" iconPos="right"
                    @click="activeStep++" />

                  <Button v-else label="Finalizar Recuperação" icon="pi pi-check" severity="success"
                    @click="saveRecovery"
                    :disabled="!answers[index] || answeredCount !== questions.length || isFinished" />
                </div>
              </div>
            </StepPanel>
          </StepPanels>
        </Stepper>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import dayjs from 'dayjs';
import { SchoolService, type ISchoolAnswer, type ISchoolQuestion, SCHOOL_CATEGORIES } from '@/services/school';
import { useOperator } from '@/composables/useOperator';
import { useAuthStore } from '@/stores/auth';
import { useToast, ProgressSpinner, Stepper, StepPanels, StepPanel, Tag, RadioButton, Button } from 'primevue';
import SchoolBadges from '@/components/school/SchoolBadges.vue';

const toast = useToast();
const { operator } = useOperator();
const authStore = useAuthStore();

const loading = ref(true);
const isFinished = ref(false);
const isApproved = ref(false);

const activeStep = ref(0);
const questions = ref<ISchoolQuestion[]>([]);

const finalGrade = ref(0);
const correctCount = ref(0);
const percentageScore = ref(0);

const answers = ref<string[]>([]);

const answeredCount = computed(() => Object.keys(answers.value).length);

const difficulty = {
  easy: "success",
  medium: "warn",
  hard: "danger"
} as { [key: string]: string };

onMounted(() => {
  loadServices();
});

const loadServices = async () => {
  loading.value = true;
  isFinished.value = false;
  isApproved.value = false;
  activeStep.value = 0;
  answers.value = [];

  try {
    questions.value = await SchoolService.getRecoveryQuestions();
  } catch (error) {
    console.error("Erro ao carregar prova de recuperação:", error);
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao carregar questões de recuperação.", life: 3000 });
  } finally {
    loading.value = false;
  }
};

const handleClick = (questionIndex: number, optionValue: string) => {
  if (isFinished.value) return;

  answers.value[questionIndex] = optionValue;

  if (questionIndex < questions.value.length - 1) {
    setTimeout(() => {
      if (activeStep.value === questionIndex) {
        activeStep.value++;
      }
    }, 250);
  }
};

const saveRecovery = async () => {
  const hits = checkAnswers(answers.value);
  correctCount.value = hits;
  finalGrade.value = Math.ceil((hits / questions.value.length) * 10);
  percentageScore.value = finalGrade.value * 10;
  isFinished.value = true;
  isApproved.value = percentageScore.value >= 70;
  activeStep.value = 0;

  try {
    const now = dayjs().toISOString();

    const savePromises = SCHOOL_CATEGORIES.map(cat => {
      const catQuestions: ISchoolQuestion[] = [];
      const catAnswers: string[] = [];

      questions.value.forEach((q, idx) => {
        if (q.category === cat) {
          catQuestions.push(q);
          catAnswers.push(answers.value[idx] || '');
        }
      });

      const catHits = catQuestions.reduce((acc, q, i) => acc + (catAnswers[i] === q.correct_option ? 1 : 0), 0);
      const catPct = catQuestions.length ? Math.round((catHits / catQuestions.length) * 100) : 0;
      const finalCategoryPct = isApproved.value ? Math.max(70, catPct) : catPct;

      const payload = {
        category: cat,
        answers: catAnswers,
        attempt_number: 1,
        operator: operator.value.$id,
        questions: catQuestions,
        completed_at: now,
        percentage: finalCategoryPct,
        score: finalCategoryPct / 10,
        correct: catHits
      } as ISchoolAnswer;

      return SchoolService.create(payload);
    });

    await Promise.all(savePromises);

    const { all } = await SchoolService.getAnswers(operator.value.$id, SCHOOL_CATEGORIES);
    authStore.operator.school_answers = all;

    if (isApproved.value) {
      toast.add({
        severity: "success",
        summary: "Aprovado na Recuperação!",
        detail: "Sua prova foi registrada com sucesso e seu acesso foi liberado.",
        life: 5000
      });
    } else {
      toast.add({
        severity: "warn",
        summary: "Nota Insuficiente",
        detail: "Você precisa de no mínimo 70% de acertos para regularizar seu acesso.",
        life: 5000
      });
    }
  } catch (error) {
    console.error("Erro ao salvar recuperação:", error);
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao registrar prova de recuperação.", life: 3000 });
  }
};

const checkAnswers = (answersArray: string[]): number => {
  return questions.value.reduce((hits, q, index) => {
    return answersArray[index] === q.correct_option ? hits + 1 : hits;
  }, 0);
};

const questionsCategory = computed(() => Math.floor(questions.value.length / SCHOOL_CATEGORIES.length));
</script>

<style scoped>
:deep(.correct .p-radiobutton-checked .p-radiobutton-box) {
  background-color: var(--p-green-300) !important;
}

:deep(.incorrect .p-radiobutton-checked .p-radiobutton-box) {
  background-color: var(--p-red-300) !important;
}

:deep(.correct .p-radiobutton-checked .p-radiobutton-icon) {
  background-color: var(--p-green-900) !important;
  border-radius: 50%;
}

:deep(.incorrect .p-radiobutton-icon) {
  background-color: var(--p-red-900) !important;
  border-radius: 50%;
}
</style>