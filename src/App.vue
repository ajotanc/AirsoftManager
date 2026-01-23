<template>
  <Toast :breakpoints="{ '512px': { width: '92vw', left: '4vw', right: '4vw' } }" />
  <ConfirmDialog :style="{ width: '360px' }"></ConfirmDialog>
  <router-view :key="$route.fullPath" />
</template>

<style>
* {
  box-sizing: border-box;
}

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