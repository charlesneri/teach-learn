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
        <v-container
          fluid
          style="min-height: 100vh; background: linear-gradient(140deg, #3b939a, #68cad5)"
        >
          <v-row>
            <v-col cols="12" md="6" class="mx-auto">
              <v-card class="mx-auto rounded-xl pb-5" width="500" style="font-size: 85%" elevation="20 ">
                <v-card-title class="text-h5">Login</v-card-title>

                <template v-slot:title>
                  <v-img
                    src="/nb_logo.png"
                    :width="100"
                    class="mx-auto"
                    aspect-ratio="16/9"
                    cover
                  ></v-img>
                  <span class="font-weight-black d-flex justify-center pt-3">Teach & Learn</span>
                </template>

                <v-card-text class="p-4">
                  <v-form fast-fail @submit.prevent>
                    <v-text-field label="Email" variant="outlined"></v-text-field>

                    <v-text-field
                      label="Password"
                      type="password"
                      variant="outlined"
                    ></v-text-field>

                    <v-btn
                      color="light-blue-darken-2"
                      class="mt-2"
                      type="submit"
                      prepend-icon="mdi-login"
                      block
                    >
                      Login
                    </v-btn>

                    <v-divider class="my-5"></v-divider>
                    <p class="text-center text-primary">
                      Don't account yet? <RouterLink to="/register">Register now</RouterLink>
                    </p>
                  </v-form>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </v-app>
  </v-responsive>
</template>
