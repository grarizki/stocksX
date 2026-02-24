<template>
  <div class="min-h-screen bg-background">
    <!-- Skip to main content for keyboard users -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:rounded focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Skip to main content
    </a>

    <LayoutAppHeader />

    <div class="flex">
      <!-- Desktop Sidebar -->
      <LayoutAppSidebar class="hidden lg:flex" />

      <!-- Main Content -->
      <main id="main-content" class="min-w-0 flex-1 pb-20 lg:pb-6">
        <div class="mx-auto max-w-2xl px-4 py-4 lg:max-w-3xl lg:px-6">
          <slot />
        </div>
      </main>
    </div>

    <!-- Mobile Bottom Navigation -->
    <LayoutAppBottomNav class="lg:hidden" />
  </div>
</template>
