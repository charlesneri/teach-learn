<script setup>
import { ref } from 'vue'

const theme = ref('light')

function onClick() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}
</script>

<template>
    <v-responsive class="border rounded">
      <v-app :theme="theme">
        <v-app-bar class="px-3">
          <v-spacer></v-spacer>
  
          <v-btn
            :prepend-icon="theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night'"
            text=""
            slim
            @click="onClick"
          ></v-btn>
        </v-app-bar>
  
        <v-main>
          <v-container>
            <slot name=""></slot>
          </v-container>
          </v-main>
      </v-app>
    </v-responsive>
    </template>