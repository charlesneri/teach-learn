<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  requiredValidator,
  emailValidator,
  passwordValidator,
  confirmedValidator,
} from '@/utils/validators'

import { supabase, formActionDefault } from '@/utils/supabase.js'
import AlertNotification from '@/components/common/AlertNotification.vue'

//for visible password
const visible = ref(false)
// Theme setup
const getPreferredTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) return savedTheme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
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

// User registration data kang sir jabez
const formDataDefault = {
  firstname: '',
  lastname: '',
  middleinitial: '',
  age: '',
  about: '',
  school: '',
  course: '',
  yearLevel: '',
  email: '',
  password: '',
  confirm_password: '',
}
const formData = ref({
  ...formDataDefault,
})
const formAction = ref({
  ...formDataDefault,
})

const refVForm = ref()

const onFormSubmit = () => {
  refVForm.value?.validate().then(({ valid }) => {
    if (valid) onSubmit()
  })
}


const onSubmit = async () => {
  formAction.value = { ...formActionDefault }
  formAction.value.formProcess = true

  const { data, error } = await supabase.auth.signUp({
    email: formData.value.email,
    password: formData.value.password,
    options: {
      data: {
        firstName: formData.value.firstname,
        lastName: formData.value.lastname,
        middleInitial: formData.value.middleinitial,
        age: formData.value.age,
        about: formData.value.about,
        school: formData.value.school,
        course: formData.value.course,
        yearLevel: formData.value.yearLevel,
      },
    },
  })
  if (error) {
    console.log(error)
    formAction.value.formErrorMessage = error.message
    console.log(formAction.value.formErrorMessage)
    formAction.value.formStatus = error.status
  } else if (data) {
    console.log(data)
    formAction.value.formSuccessMessage = 'Successfully Registered!'
    refVForm.value?.reset()
  }

  formAction.value.formProcess = false
}
</script>

<template>
  <v-responsive class="app-wrapper">
    <v-app :theme="theme">
      <v-main>
        <!-- Container Background -->
        <v-container
          fluid
          class="d-flex align-center justify-center container-bg"
          :style="{ backgroundColor: theme === 'light' ? '#1565c0' : '#121212' }"
        >
          <!-- Theme Toggle Button -->
          <v-btn
            :icon="true"
            @click="toggleTheme"
            :color="theme === 'light' ? '#1565c0' : '#ffffff'"
            class="theme-toggle"
            width="48"
            height="48"
            rounded="circle"
          >
            <v-fade-transition mode="out-in">
              <v-icon :key="theme" :color="theme === 'light' ? 'white' : '#121212'">
                {{ theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night' }}
              </v-icon>
            </v-fade-transition>
          </v-btn>

          <!-- Registration Card -->
          <v-row>
            <v-col cols="12" md="6" class="mx-auto">
              <transition name="slide-fade">
                <v-card
                  :class="theme === 'dark' ? 'bg-grey-darken-4 text-white' : ''"
                  class="mx-auto rounded-xl pb-5 hover-card"
                  width="500"
                  style="font-size: 85%; font-weight: 200"
                >
                  <template v-slot:title>
                    <v-img
                      src="/image/Teach&Learn.png"
                      :width="150"
                      class="mx-auto"
                      aspect-ratio="16/9"
                      cover
                    ></v-img>
                    <v-divider class="mb-5 mt-4" thickness="3" color="black" />
                    <span class="font-weight-black d-flex justify-center">Register Now!</span>
                  </template>
                  <AlertNotification
                    :form-success-message="formAction.formSuccessMessage"
                    :form-error-message="formAction.formErrorMessage"
                  ></AlertNotification>

                  <v-card-text class="pt-4">
                    <v-sheet class="mx-auto" width="300">
                      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
                        <v-text-field
                          v-model="formData.firstname"
                          label="First Name"
                          variant="outlined"
                          :color="theme === 'dark' ? 'white' : 'primary'"
                          :rules="[requiredValidator]"
                        />
                        <v-text-field
                          v-model="formData.lastname"
                          label="Last Name"
                          variant="outlined"
                          :color="theme === 'dark' ? 'white' : 'primary'"
                          :rules="[requiredValidator]"
                        />
                        <v-text-field
                          v-model="formData.middleinitial"
                          label="Middle Initial (optional)"
                          variant="outlined"
                          :color="theme === 'dark' ? 'white' : 'primary'"
                        />
                        <v-text-field
                          v-model="formData.age"
                          label="Age"
                          type="number"
                          variant="outlined"
                          :color="theme === 'dark' ? 'white' : 'primary'"
                          :rules="[requiredValidator]"
                        />
                        <v-text-field
                          v-model="formData.about"
                          label="About Me"
                          variant="outlined"
                          :color="theme === 'dark' ? 'white' : 'primary'"
                          :rules="[requiredValidator]"
                        />
                        <v-text-field
                          v-model="formData.school"
                          label="School / University"
                          variant="outlined"
                          :color="theme === 'dark' ? 'white' : 'primary'"
                          :rules="[requiredValidator]"
                        />
                        <v-text-field
                          v-model="formData.course"
                          label="Course / Degree"
                          variant="outlined"
                          :color="theme === 'dark' ? 'white' : 'primary'"
                          :rules="[requiredValidator]"
                        />
                        <v-text-field
                          v-model="formData.yearLevel"
                          label="Year Level"
                          type="number"
                          variant="outlined"
                          :color="theme === 'dark' ? 'white' : 'primary'"
                          :rules="[requiredValidator]"
                        />
                        <v-text-field
                          v-model="formData.email"
                          label="Email"
                          variant="outlined"
                          :color="theme === 'dark' ? 'white' : 'primary'"
                          :rules="[requiredValidator, emailValidator]"
                        />
                        <v-text-field
                          v-model="formData.password"
                          :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                          :type="visible ? 'text' : 'password'"
                          label="Password"
                          @click:append-inner="visible = !visible"
                          type="password"
                          variant="outlined"
                          :color="theme === 'dark' ? 'white' : 'primary'"
                          :rules="[requiredValidator, passwordValidator]"
                        />
                        <v-text-field
                          v-model="formData.confirm_password"
                          label="Confirm Password"
                          :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                          :type="visible ? 'text' : 'password'"
                          @click:append-inner="visible = !visible"
                          type="password"
                          variant="outlined"
                          :color="theme === 'dark' ? 'white' : 'primary'"
                          :rules="[
                            requiredValidator,
                            confirmedValidator(formData.confirm_password, formData.password),
                          ]"
                        />

                        <v-btn
                          class="mt-2 signup-btn"
                          type="submit"
                          prepend-icon="mdi-account-plus"
                          block
                          :disabled="formAction.formProcess"
                          :loading="formAction.formProcess"
                        >
                          Signup
                        </v-btn>

                        <v-divider class="my-5" />
                        <p class="text-center text-primary">
                          Already have an account?
                          <RouterLink class="active-click" to="/">Login now!</RouterLink>
                        </p>
                      </v-form>
                    </v-sheet>
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
/* Entrance animation */
.slide-fade-enter-active {
  transition: all 0.6s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

/* Card hover */
.hover-card,
.theme-toggle {
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}
.hover-card:hover {
  transform: scale(1.03);
  box-shadow: 0 0 30px 10px rgba(87, 209, 223, 0.8);
}

/* Theme toggle transition */
.theme-toggle {
  position: absolute;
  top: 16px;
  right: 24px;
  z-index: 10;
  transition: background-color 0.3s ease;
}

.theme-toggle:hover {
  transform: scale(1.03);
  box-shadow: 0 0 10px 3px rgba(87, 209, 223, 0.8);
}
/* Container background per theme */
.container-bg {
  min-height: 100vh;
  transition: background 0.3s ease;
}

/* Optional: Hide scrollbars */
::-webkit-scrollbar {
  display: none;
}
body {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
/* Full Styling for the Submit Button */
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

/* Hover effect: slightly scale up and change background */
.signup-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 18px rgba(33, 150, 243, 0.6);
  background-color: #0d47a1;
}

/* Active effect: scale down and change background */
.signup-btn:active {
  transform: scale(1.02);
  background-color: #0b3c73;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
}

.signup-btn:focus {
  outline: none;
  box-shadow: 0 0 8px rgba(33, 150, 243, 0.8);
}

/* Remove underline on link */

.active-click {
  color: #0d47a1;
  text-decoration: none;
}
.active-click:active {
  color: #ffffff19;
}
.active-click:hover {
  color: #1c1717d1;
}
@media (max-width: 600px) {
  /* Reduce padding around card */
  .container-bg {
    padding: 1rem;
    align-items: flex-start;
    padding-top: 3rem;
  }

  /* Adjust card width and prevent overflow */
  .hover-card {
    width: 100% !important;
    max-width: 100%;
    margin: 0 auto;
  }

  /* Reduce toggle button size on small screens */
  .theme-toggle {
    top: 12px;
    right: 12px;
    width: 40px !important;
    height: 40px !important;
  }

  /* Scale image and reduce top margin */
  .v-img {
    max-width: 120px !important;
    margin-top: 8px !important;
  }

  /* Adjust signup button size and font */
  .signup-btn {
    font-size: 14px;
    padding: 10px 20px;
  }

  /* Make v-sheet full width on mobile */
  .v-sheet {
    width: 100% !important;
  }
}
</style>
