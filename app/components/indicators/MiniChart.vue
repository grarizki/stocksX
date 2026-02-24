<script setup lang="ts">
const props = defineProps<{
  values: number[]
  positive?: boolean // controls line color
}>()

const W = 80
const H = 32

const path = computed(() => {
  const vals = props.values
  if (!vals || vals.length < 2) return ''
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W
    const y = H - ((v - min) / range) * H
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return `M${pts.join('L')}`
})

const fillPath = computed(() => {
  const vals = props.values
  if (!vals || vals.length < 2) return ''
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W
    const y = H - ((v - min) / range) * H
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return `M${pts.join('L')}L${W},${H}L0,${H}Z`
})

const color = computed(() => props.positive !== false ? '#22c55e' : '#ef4444')
const fillId = computed(() => `fill-${Math.random().toString(36).slice(2)}`)
</script>

<template>
  <svg
    :width="W"
    :height="H"
    :viewBox="`0 0 ${W} ${H}`"
    fill="none"
    aria-hidden="true"
    class="overflow-visible"
  >
    <defs>
      <linearGradient :id="fillId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.2" />
        <stop offset="100%" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path :d="fillPath" :fill="`url(#${fillId})`" />
    <path :d="path" :stroke="color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>
