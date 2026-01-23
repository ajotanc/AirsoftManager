<template>
  <div class="grid">
    <div v-for="i in 4" :key="i" class="col-12 md:col-3">
      <div class="card shadow-2 p-3 border-round bg-white h-8rem">
        <Skeleton width="50%" class="mb-2" />
        <Skeleton width="80%" height="2rem" />
      </div>
    </div>
    <div class="col-12 lg:col-8">
      <Skeleton height="350px" class="border-round" />
    </div>
    <div class="col-12 lg:col-4">
      <Skeleton height="350px" class="border-round" />
    </div>
    <div class="col-12">
      <Skeleton height="350px" class="border-round" />
    </div>
  </div>
</template>