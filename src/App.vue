<template>
  <Toast />
  <ConfirmDialog :style="{ width: '360px' }"></ConfirmDialog>
  <router-view :key="$route.fullPath" />
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: var(--font-family);
  background-color: var(--p-content-background);
  color: var(--text-color);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>