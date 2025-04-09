<script setup>
import { ref } from 'vue'
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
        <v-container fluid style="min-height: 100vh; background: #1565c0">
          <v-hover>
            <v-row>
              <v-col cols="12" md="6" class="mx-auto">
                <v-card
                  class="mx-auto rounded-xl pb-5"
                  width="500"
                  elevation="20"
                  style="font-size: 85%; font-weight: 200"
                >
                  <template v-slot:title>
                    <v-img
                      src="/image/Teach&Learn.png"
                      :width="200"
                      class="mx-auto"
                      aspect-ratio="16/9"
                      cover
                    ></v-img>
                    <v-divider my-4 class="mb-5" thickness="3" color="black"></v-divider>
                    <span class="font-weight-black d-flex justify-center">Register Now!</span>
                  </template>

                  <v-card-text class="pt-4">
                    <v-sheet class="mx-auto" width="300">
                      <v-form fast-fail @submit.prevent>
                        <v-text-field label="first name" variant="outlined"></v-text-field>
                        <v-text-field label="Last name" variant="outlined"></v-text-field>

                        <v-text-field label="Email" variant="outlined"></v-text-field>

                        <v-text-field
                          label="Password"
                          type="password"
                          variant="outlined"
                        ></v-text-field>
                        <v-text-field
                          label="Confirm Password"
                          type="password"
                          variant="outlined"
                        ></v-text-field>

                        <v-btn
                          color="light-blue-darken-2"
                          class="mt-2"
                          type="submit"
                          prepend-icon="mdi-account-plus"
                          block
                        >
                          Signup
                        </v-btn>

                        <v-divider class="my-5"></v-divider>
                        <p class="text-center text-primary">
                          Already have account? <RouterLink to="/">Login now!</RouterLink>
                        </p>
                      </v-form>
                    </v-sheet>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-hover>
        </v-container>
      </v-main>
    </v-app>
  </v-responsive>
</template>
