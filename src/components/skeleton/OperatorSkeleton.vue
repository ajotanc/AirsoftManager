<template>
  <div class="col-12 md:col-4">
    <div class="flex flex-column align-items-center gap-3 py-3 border-round surface-card mb-3">
      <Skeleton shape="circle" size="6rem" />
      <div class="flex flex-column align-items-center gap-2">
        <Skeleton width="10rem" height="2rem" />
        <Skeleton width="6rem" height="1rem" />
      </div>
      <div class="w-full px-4 mt-2">
        <Skeleton width="100%" height="8px" />
      </div>
      <div class="flex flex-column align-items-center gap-2 mt-2">
        <Skeleton width="8rem" height="1.5rem" />
        <Skeleton width="12rem" height="1rem" />
      </div>
    </div>

    <div class="card p-3">
      <div class="flex gap-3 mb-4 justify-content-center">
        <Skeleton width="3rem" height="2rem" />
        <Skeleton width="3rem" height="2rem" />
        <Skeleton width="3rem" height="2rem" />
      </div>

      <div class="flex flex-column align-items-center gap-3 py-5">
        <Skeleton shape="circle" size="3rem" />
        <Skeleton width="10rem" height="1rem" />
      </div>
    </div>
  </div>
</template>