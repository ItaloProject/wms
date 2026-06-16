<template>
  <router-view v-slot="{ Component }">
    <transition name="slide" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style>
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  font-family: 'Inter', 'Roboto', -apple-system, 'Segoe UI', sans-serif;
  margin: 0;
  background: #091644;
  color: white;
  color-scheme: dark;
}

/* Saída: colapsa para cima rapidamente */
.slide-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
  pointer-events: none;
}
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.99);
}

/* Entrada: sobe suavemente com leve overshoot */
.slide-enter-active {
  transition: opacity 0.18s ease, transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
}
.slide-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.99);
}
</style>
