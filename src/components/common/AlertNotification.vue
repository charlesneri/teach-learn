<script setup>

const props = defineProps(['formSuccessMessage','formErrorMessage']);

</script>

<template>
        <!--Alert-->
        <v-alert
                    v-if="props.formSuccessMessage"
                    :text="props.formSuccessMessage"
                    title="success"
                    type="success"
                    variant="submit"
                    density="compact"
                    border="start"
                    closable
                  >
                  </v-alert>
                  <v-alert
                    v-if="props.formErrorMessage"
                    :text="props.formErrorMessage"
                    title="Ooopps!"
                    variant="tonal"
                    type="error"
                    density="compact"
                    border="start"
                    closable
                  >
                  </v-alert>
</template>