<template>
  <div style="position: relative; height: 100%; width: 100%;">
    <Radar :data="chartConfig" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'vue-chartjs';
import { getRadarChartData, RADAR_OPTIONS } from '@/constants/airsoft';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const props = defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({})
  }
});

const chartConfig = computed(() => getRadarChartData(props.stats));
const chartOptions = RADAR_OPTIONS;
</script>