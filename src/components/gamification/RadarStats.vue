<template>
  <div :style="{ position: 'relative', height, width }">
    <Radar :data="chartConfig" :options="RADAR_OPTIONS" />
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
  width: {
    type: String,
    default: '300px'
  },
  height: {
    type: String,
    default: '300px'
  },
  stats: {
    type: Object,
    required: true,
    default: () => ({})
  }
});

const chartConfig = computed(() => getRadarChartData(props.stats));
</script>