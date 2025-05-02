<script setup>
import { ref, watch } from 'vue'

const props = defineProps(['formSuccessMessage', 'formErrorMessage'])

const showSuccess = ref(false)
const showError = ref(false)

// Auto-dismiss logic
watch(
  () => props.formSuccessMessage,
  (msg) => {
    if (msg) {
      showSuccess.value = true
      setTimeout(() => {
        showSuccess.value = false
      }, 4000) // auto-hide after 4s
    }
  }
)

watch(
  () => props.formErrorMessage,
  (msg) => {
    if (msg) {
      showError.value = true
      setTimeout(() => {
        showError.value = false
      }, 2000) 
    }
  }
)
</script>

<template>
  <v-alert
    v-if="showSuccess"
    :text="props.formSuccessMessage"
    title="Success"
    type="success"
    variant="tonal"
    density="compact"
    border="start"
    closable
    @click:close="showSuccess = false"
  />

  <v-alert
    v-if="showError"
    :text="props.formErrorMessage"
    title="Oops!"
    type="error"
    variant="tonal"
    density="compact"
    border="start"
    closable
    @click:close="showError = false"
  />
</template>
