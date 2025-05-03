<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase.js'
import { requiredValidator, emailValidator } from '@/utils/validators.js'
import AlertNotification from '@/components/common/AlertNotification.vue'

const router = useRouter()
const visible = ref(false)
const refVForm = ref()

// Theme Setup
const getPreferredTheme = () => {
  const saved = localStorage.getItem('theme')
  return saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}
const theme = ref(getPreferredTheme())

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}
watch(theme, (val) => localStorage.setItem('theme', val))

onMounted(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      theme.value = e.matches ? 'dark' : 'light'
    }
  })
})

// Form Data
const formData = ref({
  email: '',
  password: '',
})

// Form State
const formAction = ref({
  formProcess: false,
  formErrorMessage: '',
  formSuccessMessage: '',
})

// Login Logic
const onLogin = async () => {
  formAction.value.formProcess = true
  formAction.value.formErrorMessage = ''
  formAction.value.formSuccessMessage = ''

  const email = formData.value.email.trim()
  const password = formData.value.password.trim()

  if (!email || !password) {
    formAction.value.formErrorMessage = 'Please enter both email and password.'
    formAction.value.formProcess = false
    return
  }

  //  Check if email exists in your `profiles` table
  const { data: profileMatch, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (profileError) {
    formAction.value.formErrorMessage = 'Something went wrong while verifying your email.'
    formAction.value.formProcess = false
    return
  }

  if (!profileMatch) {
    formAction.value.formErrorMessage = 'Account not found. Please register first.'
    formAction.value.formProcess = false
    return
  }

  //  Email exists, now try to sign in
  const { data, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (loginError) {
    formAction.value.formErrorMessage = 'Incorrect password. Please try again.'
    formAction.value.formProcess = false
    return
  }

  // : Check if user was returned
  const user = data?.user
  if (!user) {
    formAction.value.formErrorMessage = 'Authentication failed. Try again.'
    formAction.value.formProcess = false
    return
  }

  //  Successful login
  formAction.value.formSuccessMessage = 'Successfully Logged In!'
  formAction.value.formProcess = false
  setTimeout(() => {
    router.replace('/home')
  }, 1500)
}

// Form submit handler
const onFormSubmit = () => {
  refVForm.value?.validate().then(({ valid }) => {
    if (valid) onLogin()
  })
}
</script>

<template>
  <v-responsive class="login-wrapper">
    <v-app :theme="theme">
      <v-main class="no-scroll">
        <v-container
          fluid
          class="wrapper"
          style="min-height: 100vh; padding: 32px"
          :style="{ backgroundColor: theme === 'light' ? '#1565c0' : '#121212' }"
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
                  :style="{ backgroundColor: theme === 'light' ? '#fefcf9' : '#222222' }"
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
                  <AlertNotification
                    :form-success-message="formAction.formSuccessMessage"
                    :form-error-message="formAction.formErrorMessage"
                  ></AlertNotification>
                  <v-card-text class="p-4">
                    <v-form ref="refVForm" @submit.prevent="onFormSubmit">
                      <v-text-field
                        label="Email"
                        variant="filled"
                        :color="theme === 'dark' ? 'white' : 'primary'"
                        :rules="[requiredValidator, emailValidator]"
                        v-model="formData.email"
                      />
                      <v-text-field
                        :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                        :type="visible ? 'text' : 'password'"
                        label="Password"
                        @click:append-inner="visible = !visible"
                        variant="filled"
                        :color="theme === 'dark' ? 'white' : 'primary'"
                        :rules="[requiredValidator]"
                        v-model="formData.password"
                      />
                      <v-col cols="12" class="d-flex justify-center">
                        <v-btn
                          color="light-blue-darken-2"
                          class="mt-2 signup-btn"
                          type="submit"
                          prepend-icon="mdi-login"
                        >
                          Login
                        </v-btn>
                      </v-col>

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
  transform: scale(1.05);
  box-shadow: 0 6px 18px rgba(33, 150, 243, 0.6);
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
  max-width: 160px;
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

/* Base link style */
.active-click {
  text-decoration: none;
  transition: color 0.3s ease;
}

/* Light mode: default + hover */
body:not(.dark) .active-click {
  color: #0d47a1;
}
body:not(.dark) .active-click:hover {
  color: #002171;
}

/* Dark mode: default + hover */
body.dark .active-click {
  color: #90caf9;
}
body.dark .active-click:hover {
  color: #ffffff;
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
  .signup-btn {
    font-size: 14px;
    padding: 10px 20px;
    max-width: 100%; /* fill available width */
  }
}
</style>
