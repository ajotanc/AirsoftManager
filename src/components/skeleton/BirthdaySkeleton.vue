<template>
  <div class="max-w-30rem w-full">
    <div class="w-full text-center relative">
      <div class="flex justify-content-center mb-4">
        <Skeleton shape="circle" size="6rem" />
      </div>
      <div class="flex flex-column align-items-center gap-2 mb-5">
        <Skeleton width="70%" height="2.5rem" />
        <Skeleton width="40%" height="2.5rem" />
      </div>
      <div class="text-left border-top-1 border-gray-200 pt-4 w-full">
        <div v-for="n in 3" :key="n" class="mb-4 w-full">
          <Skeleton width="100%" height="0.8rem" class="mb-2" />
          <Skeleton width="98%" height="0.8rem" class="mb-2" />
          <Skeleton width="92%" height="0.8rem" class="mb-2" />
          <Skeleton width="35%" height="0.8rem" />
        </div>
        <div class="mt-5">
          <Skeleton width="50%" height="1.8rem" class="mb-3" />
          <Skeleton width="100%" height="1rem" border-radius="2rem" />
        </div>
      </div>
    </div>
  </div>
</template>