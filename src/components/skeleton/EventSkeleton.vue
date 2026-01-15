<template>
  <div class="p-4">
    <div class="border-bottom-1 border-black-alpha-20 pb-4 mb-4">
      <div class="grid">
        <div class="col-12">
          <Skeleton width="60%" height="3rem" class="mb-2" />
        </div>
        <div class="col-12">
          <div class="flex justify-content-between align-items-center">
            <Skeleton width="80px" height="1.5rem" border-radius="2rem" />
            <div class="flex flex-column align-items-end">
              <Skeleton width="40px" height="2.5rem" class="mb-1" />
              <Skeleton width="60px" height="0.8rem" />
            </div>
          </div>
        </div>
        <div class="col-12">
          <div class="flex gap-3">
            <Skeleton width="200px" height="1.2rem" />
            <Skeleton width="150px" height="1.2rem" />
          </div>
        </div>
        <div class="col-12">
          <div class="flex gap-3">
            <Skeleton width="180px" height="3rem" />
            <Skeleton width="180px" height="3rem" />
          </div>
        </div>
      </div>
    </div>

    <div class="grid">
      <div class="col-12 md:col-8">
        <div class="surface-card p-4 border-round border-1 border-black-alpha-10 mb-4">
          <Skeleton width="100%" height="300px" class="mb-4" />
          <Skeleton width="40%" height="2rem" class="mb-3" />
          <div class="flex flex-column gap-2">
            <Skeleton width="100%" height="1rem" />
            <Skeleton width="95%" height="1rem" />
            <Skeleton width="98%" height="1rem" />
            <Skeleton width="40%" height="1rem" />
          </div>
        </div>

        <div class="surface-card p-4 border-round border-1 border-white-alpha-10 bg-blue-900">
          <Skeleton width="30%" height="1.5rem" class="mb-3" />
          <div class="p-3 border-round bg-gray-800 flex justify-content-between">
            <Skeleton width="60%" height="1.2rem" />
            <Skeleton width="100px" height="1.2rem" />
          </div>
          <Skeleton width="100%" height="300px" class="mt-3 border-round" />
        </div>
      </div>

      <div class="col-12 md:col-4">
        <div class="surface-card p-4 border-round border-1 border-white-alpha-10 bg-blue-900 mb-4">
          <Skeleton width="50%" height="1.2rem" class="mb-4" />
          <div class="flex flex-column gap-2 mb-4">
            <Skeleton width="100%" height="3rem" />
            <Skeleton width="100%" height="3rem" />
          </div>
          <div class="flex gap-2 mb-3 border-bottom-1 border-white-alpha-10 pb-2">
            <Skeleton width="80px" height="2rem" />
            <Skeleton width="80px" height="2rem" />
          </div>
          <div v-for="n in 5" :key="n" class="flex align-items-center gap-3 mb-3">
            <Skeleton shape="circle" size="2rem" />
            <Skeleton width="60%" height="1rem" />
          </div>
        </div>

        <div class="surface-card p-4 border-round border-1 border-white-alpha-10 bg-blue-900">
          <Skeleton width="100%" height="10rem" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Skeleton } from 'primevue';
</script>