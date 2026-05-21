<template>
  <IncomeDetails v-if="currentRoute === '/income-details'" />
  <HistoryPerformance v-else-if="currentRoute === '/history-performance'" />
  <DynamicMessages v-else-if="currentRoute === '/dynamic-messages'" />
  <NoticeDetail v-else-if="currentRoute === '/notice-detail'" />
  <AcquiringWorkbench v-else />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import AcquiringWorkbench from './pages/acquiring-workbench/AcquiringWorkbench.vue';
import DynamicMessages from './pages/dynamic-messages/DynamicMessages.vue';
import HistoryPerformance from './pages/history-performance/HistoryPerformance.vue';
import IncomeDetails from './pages/income-details/IncomeDetails.vue';
import NoticeDetail from './pages/dynamic-messages/NoticeDetail.vue';

function normalizePath(pathname: string) {
  return pathname === '/' ? '/' : pathname.replace(/\/$/, '');
}

const currentRoute = ref(normalizePath(window.location.pathname));

function syncRoute() {
  currentRoute.value = normalizePath(window.location.pathname);
}

onMounted(() => {
  window.addEventListener('popstate', syncRoute);
  window.addEventListener('hzy:route-changed', syncRoute);
  window.addEventListener('hzy:navigation', syncRoute);
});

onBeforeUnmount(() => {
  window.removeEventListener('popstate', syncRoute);
  window.removeEventListener('hzy:route-changed', syncRoute);
  window.removeEventListener('hzy:navigation', syncRoute);
});
</script>

<style>
@import './styles/hzy-theme.css';
</style>
