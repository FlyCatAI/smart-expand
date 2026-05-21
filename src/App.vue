<template>
  <HistoryPerformance v-if="currentRoute === '/history-performance'" />
  <AcquiringWorkbench v-else />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import AcquiringWorkbench from './pages/acquiring-workbench/AcquiringWorkbench.vue';
import HistoryPerformance from './pages/history-performance/HistoryPerformance.vue';

const currentRoute = ref(window.location.pathname);

function syncRoute() {
  currentRoute.value = window.location.pathname;
}

onMounted(() => {
  window.addEventListener('popstate', syncRoute);
  window.addEventListener('hzy:navigation', syncRoute);
});

onBeforeUnmount(() => {
  window.removeEventListener('popstate', syncRoute);
  window.removeEventListener('hzy:navigation', syncRoute);
});
</script>
