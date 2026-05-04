<template>
  <div class="flex flex-column align-items-center p-3">
    <div v-if="loading" class="flex justify-content-center align-items-center">
      <ProgressSpinner />
    </div>

    <template v-else>
      <div class="w-full mb-4 text-left">
        <h1 class="text-4xl font-black uppercase m-0 text-primary tracking-tight">
          Recuperação: {{ category }}
        </h1>

        <div class="flex flex-column gap-2">
          <p class="text-700 m-0 line-height-3">
            Esta etapa valida a sua prontidão técnica e garante o alinhamento com os padrões da nossa unidade.
            Para assegurar a integridade da certificação, dispõe de <strong>duas oportunidades</strong> para atingir a
            pontuação necessária.
            Siga ao seu ritmo e boa sorte.
          </p>
          <q class="font-italic p-1 mt-1 border-left-3 border-400 text-400 text-sm">O conhecimento da regra é a maior
            arma que o ser humano pode obter.</q>
        </div>
      </div>

      <div v-if="isFinished" class="w-full mb-3 p-3 border-round-xl bg-primary text-white shadow-3 text-center">
        <h2 class="m-0 text-2xl">Avaliação Concluída!</h2>
        <div class="text-4xl font-bold my-2">Nota: {{ finalGrade.toFixed(1) }}</div>
        <p class="m-0">Você acertou {{ correctCount }} de {{ questions.length }} questões</p>

        <div class="mt-3 flex flex-column md:flex-row justify-content-center gap-2">
          <Button label="Sair" icon="pi pi-home" severity="secondary" @click="$router.push('/administrative/school')" />
        </div>
      </div>

      <div class="w-full card shadow-3 p-0 overflow-hidden border-round-xl">
        <Stepper v-model:value="activeStep">
          <StepPanels>
            <StepPanel v-for="(question, index) in questions" :key="question.$id" :value="index">
              <div class="p-3 bg-card">
                <div
                  class="flex flex-column md:flex-row md:justify-content-between align-items-start md:align-items-center gap-2">
                  <Tag :value="`Questão ${index + 1} de ${questions.length}`"
                    :severity="difficulty[question.difficulty]" class="uppercase" />
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

                  <label :for="`Q${index}O${optionIndex}`" class="ml-2 flex-1 text-lg">{{ option }}</label>
                </div>

                <div class="flex justify-content-between pt-3">
                  <Button label="Voltar" v-if="index > 0" severity="secondary" icon="pi pi-arrow-left"
                    @click="activeStep--" />
                  <div v-else></div>

                  <Button v-if="index < questions.length - 1" label="Próxima" icon="pi pi-arrow-right" iconPos="right"
                    @click="activeStep++" />

                  <Button v-else label="Finalizar" icon="pi pi-check" severity="success" @click="saveQuiz"
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
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import dayjs from 'dayjs';
import { SchoolService, type ISchoolAnswer, type ISchoolQuestion, type SchoolCategory } from '@/services/school';
import { useOperator } from '@/composables/useOperator';
import { useToast } from 'primevue';

const route = useRoute();
const toast = useToast();
const { operator } = useOperator();

const category = ref(route.params.category as SchoolCategory);

const loading = ref(true);
const isFinished = ref(false);

const attempts = ref(0);
const activeStep = ref(0);

const questions = ref<ISchoolQuestion[]>([]);

const finalGrade = ref(0);
const correctCount = ref(0);

const selectedAnswer = ref<ISchoolAnswer>({} as ISchoolAnswer);
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
  try {
    const rowId = route.params.id as string;

    if (rowId) {
      selectedAnswer.value = await SchoolService.getAnswer(rowId);

      answers.value = selectedAnswer.value.answers as string[];
      questions.value = selectedAnswer.value.questions as ISchoolQuestion[];
      attempts.value = selectedAnswer.value.attempt_number;

      const { correct, score } = SchoolService.calculateScore(selectedAnswer.value);
      correctCount.value = correct;
      finalGrade.value = score;
      isFinished.value = true;
    } else {
      questions.value = await SchoolService.getRandomQuestions(category.value, 10);
      isFinished.value = false;
      answers.value = [];
    }
  } catch (error) {
    console.error("Erro ao carregar:", error);
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

const saveQuiz = async () => {
  const hits = checkAnswers(answers.value);
  correctCount.value = hits;
  finalGrade.value = (hits / questions.value.length) * 10;
  isFinished.value = true;
  activeStep.value = 0;

  try {
    const payload = {
      category: category.value,
      answers: answers.value,
      attempt_number: attempts.value + 1,
      operator: operator.value.$id,
      questions: questions.value,
      completed_at: dayjs().toISOString(),
    } as ISchoolAnswer;

    selectedAnswer.value = await SchoolService.create(payload);
    attempts.value++;

    toast.add({ severity: "success", summary: "Sucesso!", detail: "Prova salva.", life: 3000 });
  } catch (error) {
    console.error("Erro ao salvar:", error);
    toast.add({ severity: "error", summary: "Erro", detail: "Falha ao registrar.", life: 3000 });
  }
};

const checkAnswers = (answersArray: string[]): number => {
  return questions.value.reduce((hits, q, index) => {
    return answersArray[index] === q.correct_option ? hits + 1 : hits;
  }, 0);
};

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