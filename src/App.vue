<template>
  <DynamicMessages v-if="currentRoute === '/dynamic-messages'" />
  <NoticeDetail v-else-if="currentRoute === '/notice-detail'" />
  <AcquiringWorkbench v-else />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import AcquiringWorkbench from './pages/acquiring-workbench/AcquiringWorkbench.vue';
import DynamicMessages from './pages/dynamic-messages/DynamicMessages.vue';
import NoticeDetail from './pages/dynamic-messages/NoticeDetail.vue';

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

<style>
@import './styles/hzy-theme.css';
</style>
