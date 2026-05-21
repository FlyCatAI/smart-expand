<template>
  <IncomeDetails v-if="currentPath === '/income-details'" />
  <AcquiringWorkbench v-else />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import AcquiringWorkbench from './pages/acquiring-workbench/AcquiringWorkbench.vue';
import IncomeDetails from './pages/income-details/IncomeDetails.vue';

function normalizePath(pathname: string) {
  return pathname === '/' ? '/' : pathname.replace(/\/$/, '');
}

const currentPath = ref(normalizePath(window.location.pathname));

function syncRoute() {
  currentPath.value = normalizePath(window.location.pathname);
}

onMounted(() => {
  window.addEventListener('popstate', syncRoute);
  window.addEventListener('hzy:route-changed', syncRoute);
});

onBeforeUnmount(() => {
  window.removeEventListener('popstate', syncRoute);
  window.removeEventListener('hzy:route-changed', syncRoute);
});
</script>
