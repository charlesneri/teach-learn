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
          style="min-height: 100vh; background: #1565c0"
          class="wrapper overflow-hidden"
        >
          <v-row>
            <v-col cols="12" md="6" class="mx-auto">
              <v-card
                class="mx-auto rounded-xl pb-5 login-card"
                width="500"
                elevation="20"
                style="font-size: 85%; font-weight: 200"
              >
                <v-card-title class="text-h5">Login</v-card-title>

                <template v-slot:title>
                  <v-img
                    src="/image/Teach&Learn.png"
                    :width="200"
                    class="mx-auto"
                    aspect-ratio="13/6"
                    cover
                  ></v-img>
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
                      Don't have account yet? <RouterLink to="/register">Register now!</RouterLink>
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
<style lang="css" scoped>
* {
  overflow: hidden;
}
</style>
