<template>
    <div class="flex align-items-center justify-content-center min-h-screen p-4">
        <div class="surface-card p-4 shadow-4 border-round max-w-30rem w-full text-center relative">
            <p v-if="loading" class="font-bold">Buscando dados no sistema...</p>
            <div v-else-if="isBirthday(operator.birth_date)" class="happy-birthday">
                <Rating v-model="operator.rating" class="absolute top-0 right-0 m-3" readonly />
                <Avatar :image="operator.avatar" style="width: 6rem; height: 6rem;" shape="circle" />

                <h1 class="text-2xl font-bold mb-3">{{ operator.codename }}, missão de aniversário autorizada e em
                    curso!
                </h1>
                <div class="text-left border-top-1 border-gray-200">

                    <p class="mt-3 text-sm text-gray-900">
                        Hoje o <strong>Time {{ TEAM_NAME }}</strong> entra em formação para celebrar a vida de um de
                        nossos
                        grandes operadores. Mais do que um integrante em campo, comemoramos a presença de um irmão de
                        armas
                        que compreende o verdadeiro significado de <strong>União, Lealdade e Respeito</strong>.
                    </p>
                    <p class="mt-3 text-sm text-gray-900">No Airsoft, aprendemos que o equipamento e a tática são
                        importantes, mas o que realmente sustenta uma
                        equipe é o caráter e a honra de quem está ao nosso lado na trincheira. No último ano, você
                        demonstrou que vestir o uniforme do {{ TEAM_NAME }} vai além do jogo; é sobre compromisso,
                        resiliência e a
                        disposição de sempre buscar o melhor para o grupo.</p>
                    <p class="mt-3 text-sm text-gray-900">Que este novo ciclo traga muitos avanços, conquistas pessoais
                        e,
                        claro, operações memoráveis. Que sua
                        mira continue precisa, sua conduta permaneça exemplar no fairplay e que a adrenalina de cada
                        partida
                        seja renovada com saúde e felicidade fora dos campos.</p>
                    <p class="mt-3 text-sm text-gray-900">Agradecemos por sua dedicação e por fortalecer nossa história.
                        Que
                        sua jornada seja sempre guiada
                        pela estratégia do sucesso e pela alegria da nossa fraternidade.</p>

                    <h4>Feliz Aniversário, Guerreiro!</h4>
                    <p class="m-0 font-italic text-sm">"No campo de batalha ou na vida: No {{ TEAM_NAME }}, ninguém fica
                        para
                        trás!"
                    </p>
                </div>
            </div>
            <p v-else class="font-bold">Hoje não é o seu aniversário...</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { OperatorService } from '@/services/operator';
import { useRoute } from 'vue-router';
import { isBirthday } from '@/functions/utils';
import { TEAM_NAME } from '@/constants/airsoft';
import type { IOperator } from '@/services/operator';

const route = useRoute();
const operator = ref({} as IOperator);
const loading = ref(true);

onMounted(() => {
    const operatorId = route.params.id as string;

    OperatorService.row(operatorId).then((data) => {
        operator.value = data;
        loading.value = false;
    });
});

</script>