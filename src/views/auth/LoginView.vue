<script setup>
import { requiredValidator, emailValidator } from '@/utils/validators'
import { ref, onMounted, watch } from 'vue'

// Get theme preference from localStorage or system
const getPreferredTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) return savedTheme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref(getPreferredTheme())

// Toggle theme
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

// Save theme change
watch(theme, (val) => {
  localStorage.setItem('theme', val)
})

// Watch for system changes if no saved preference
onMounted(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      theme.value = e.matches ? 'dark' : 'light'
    }
  })
})
//until here
const refVForm = ref()

const onFormSubmit = () => {
  refVform.value?.validate().then(({ valid }) => {
    if (valid) onLogin()
  })
}
/*
const onLogin = () => {
  alert(formData.value.email)
  
  
}*/
const onLogin = () => {
  if (!formData.value.email || !formData.value.password) {
    alert('Please enter email and password')
    return
  }

  alert(`Logged in as: ${formData.value.email}`)
  window.location.href = '/home'
}

const FormDataDefault = {
  email: '',
  password: '',
}
const formData = ref({
  ...FormDataDefault,
})
</script>

<template>
  <v-responsive class="login-wrapper">
    <v-app :theme="theme">
      <v-main class="no-scroll">
        <v-container
          fluid
          class="wrapper"
          :style="{ background: theme === 'light' ? '#1565c0' : '#121212' }"
        >
          <!-- Theme Toggle Button -->
          <v-btn
            :icon="true"
            @click="toggleTheme"
            :color="theme === 'light' ? '#1565c0' : '#ffffff'"
            width="48"
            height="48"
            rounded="circle"
            class="theme-toggle-btn"
          >
            <v-fade-transition mode="out-in">
              <v-icon :key="theme" :color="theme === 'light' ? 'white' : '#121212'">
                {{ theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night' }}
              </v-icon>
            </v-fade-transition>
          </v-btn>

          <!-- Login Card -->
          <v-row>
            <v-col cols="12" sm="10" md="6" lg="4" class="mx-auto">
              <transition name="slide-fade">
                <v-card
                  :class="theme === 'dark' ? 'bg-grey-darken-4 text-white' : ''"
                  class="mx-auto rounded-xl pb-5 hover-card"
                  width="500"
                  style="font-size: 85%; font-weight: 200"
                >
                  <template v-slot:title>
                    <v-img
                      src="image/Teach&Learn.png"
                      :width="150"
                      class="mx-auto"
                      aspect-ratio="13/6"
                      cover
                    ></v-img>
                    <v-divider class="mb-5 mt-4" thickness="3" color="black" />
                    <span class="font-weight-black d-flex justify-center">Login</span>
                  </template>

                  <v-card-text class="p-4">
                    <v-form ref="refVForm" @submit.prevent="onFormSubmit">
                      <v-text-field
                        label="Email"
                        variant="outlined"
                        :color="theme === 'dark' ? 'white' : 'primary'"
                        :rules="[requiredValidator, emailValidator]"
                        v-model="formData.email"
                      />
                      <v-text-field
                        label="Password"
                        type="password"
                        variant="outlined"
                        :color="theme === 'dark' ? 'white' : 'primary'"
                        :rules="[requiredValidator]"
                        v-model="formData.password"
                      />
                      <v-btn
                        color="light-blue-darken-2"
                        class="mt-2 signup-btn"
                        type="submit"
                        prepend-icon="mdi-login"
                        block
                        @click="onLogin()"
                      >
                        Login
                      </v-btn>

                      <v-divider class="my-5" />
                      <p class="text-center text-primary">
                        Don’t have an account yet?
                        <RouterLink class="active-click" to="/register">Register now!</RouterLink>
                      </p>
                    </v-form>
                  </v-card-text>
                </v-card>
              </transition>
            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </v-app>
  </v-responsive>
</template>

<style scoped>
/* Make container fill height and center content */
.wrapper {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

/* Transition animation */
.slide-fade-enter-active {
  transition: all 0.6s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

/* Hover effect for the card */
.hover-card {
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}
.hover-card:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 24px rgba(40, 206, 244, 0.2);
}

/* Theme toggle button */
.theme-toggle-btn {
  position: absolute;
  top: 16px;
  right: 24px;
  z-index: 10;
  transition: background-color 0.3s ease;
}
.theme-toggle-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 10px 3px rgba(87, 209, 223, 0.8);
}

/* Signup button styles */
.signup-btn {
  background-color: #1565c0;
  color: white;
  font-weight: bold;
  letter-spacing: 1px;
  font-size: 16px;
  padding: 12px 24px;
  border-radius: 50px;
  text-transform: uppercase;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
}
.signup-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 18px rgba(33, 150, 243, 0.6);
  background-color: #0d47a1;
}
.signup-btn:active {
  transform: scale(1.02);
  background-color: #0b3c73;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
}
.signup-btn:focus {
  outline: none;
  box-shadow: 0 0 8px rgba(33, 150, 243, 0.8);
}

/* Dark mode card */
.bg-grey-darken-4 {
  background-color: #121212 !important;
}
.text-white {
  color: white !important;
}

/* Remove underline on link */

.active-click{
  color: #0d47a1;
  text-decoration: none;
}
.active-click:active{
  color: #ffffff19;
}
.active-click:hover{
  color: #ffffffd1;
}
@media (max-width: 600px) {
  .wrapper {
    padding: 0 1rem;
    align-items: flex-start;
    padding-top: 3rem;
  }

  .theme-toggle-btn {
    top: 12px;
    right: 12px;
    width: 40px !important;
    height: 40px !important;
  }

  .signup-btn {
    font-size: 14px;
    padding: 10px 20px;
  }

  .hover-card {
    width: 100% !important;
    max-width: 100%;
    margin: 0 auto;
  }

  .v-card-text {
    padding: 16px !important;
  }

  .v-img {
    max-width: 120px;
  }
}
</style>
