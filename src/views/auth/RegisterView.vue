<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase, formActionDefault } from '@/utils/supabase'
import AlertNotification from '@/components/common/AlertNotification.vue'
import {
  requiredValidator,
  emailValidator,
  passwordValidator,
  confirmedValidator,
} from '@/utils/validators'

import { useRouter } from 'vue-router'
const router = useRouter()

// Theme setup
const theme = ref(localStorage.getItem('theme') || 'light')
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
}
onMounted(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      theme.value = e.matches ? 'dark' : 'light'
    }
  })
})
watch(theme, (val) => localStorage.setItem('theme', val))

// Form State
const visible = ref(false)
const refVForm = ref()
const formData = ref({
  firstname: '',
  lastname: '',
  middleinitial: '',
  age: '',
  phone: '',
  expertise: '',
  about: '',
  school: '',
  course: '',
  yearLevel: '',
  email: '',
  password: '',
  confirm_password: '',
})

const formAction = ref({ ...formActionDefault })

// Submit Handler
const onFormSubmit = () => {
  refVForm.value?.validate().then(({ valid }) => {
    if (valid) {
      onSubmit()
    }
  })
}

// Main Submit Function
const onSubmit = async () => {
  formAction.value.formProcess = true
  formAction.value.formErrorMessage = ''
  formAction.value.formSuccessMessage = ''

  const { data, error } = await supabase.auth.signUp({
    email: formData.value.email,
    password: formData.value.password,
    options: {
      data: {
        firstName: formData.value.firstname,
        lastName: formData.value.lastname,
        middleInitial: formData.value.middleinitial,
        age: Number(formData.value.age),
        phone: formData.value.phone,
        expertise: formData.value.expertise,
        about: formData.value.about,
        school: formData.value.school,
        course: formData.value.course,
        yearLevel: Number(formData.value.yearLevel),
      },
    },
  })

  if (error) {
    console.error(error)
    formAction.value.formErrorMessage = error.message
    formAction.value.formStatus = error.status
  } else if (data && data.user) {
    console.log('Auth signup success:', data.user)

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      first_name: formData.value.firstname,
      last_name: formData.value.lastname,
      middle_initial: formData.value.middleinitial,
      age: Number(formData.value.age),
      email: formData.value.email,
      phone: formData.value.phone,
      expertise: formData.value.expertise,
      about: formData.value.about,
      school: formData.value.school,
      degree: formData.value.course,
      year: Number(formData.value.yearLevel),
      avatar_url: '',
    })

    if (profileError) {
      console.error('Error inserting into profiles table:', profileError)
      formAction.value.formErrorMessage = 'Profile creation failed!'
      formAction.value.formStatus = 500
    } else {
      formAction.value.formSuccessMessage = 'Successfully Registered!'
      refVForm.value?.reset()
      showDialog.value = true
    }
  }

  formAction.value.formProcess = false
}


//direct login yes or no after register
const showDialog = ref(false)

const handleDialogConfirm = () => {
  showDialog.value = false
  router.push('/home') // or '/login'
}

const handleDialogCancel = () => {
  showDialog.value = false
}
</script>

<template>
  <v-responsive class="app-wrapper">
    <v-app :theme="theme">
      <v-main>
        <v-container
          fluid
          class="d-flex justify-center align-center container-bg"
          style="min-height: 100vh; padding: 32px"
          :style="{ backgroundColor: theme === 'light' ? '#1565c0' : '#121212' }"
        >
          <!-- Theme Toggle -->
          <v-btn
            icon
            @click="toggleTheme"
            class="theme-toggle"
            width="48"
            height="48"
            rounded="circle"
          >
            <v-icon>{{ theme === 'light' ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
          </v-btn>

          <!-- Registration Card -->
          <v-row>
            <v-col cols="12" md="10" lg="10" xl="9" class="mx-auto">
              <div class="d-flex flex-column justify-center" style="height: 100%">
                <transition name="slide-fade">
                  <v-card
                    class="mx-auto rounded-xl pb-5 hover-card"
                    max-width="1500"
                    width="100%"
                    :style="{ backgroundColor: theme === 'light' ? '#fefcf9' : '#222222' }"
                  >
                    <template v-slot:title>
                      <v-img
                        src="/image/Teach&Learn.png"
                        width="150"
                        class="mx-auto"
                        aspect-ratio="16/9"
                        cover
                      />
                      <v-divider class="mb-5 mt-4" thickness="3" color="black" />
                      <span class="text-font font-weight-black d-flex justify-center"
                        >Register Now!</span
                      >
                    </template>

                    <AlertNotification
                      :form-success-message="formAction.formSuccessMessage"
                      :form-error-message="formAction.formErrorMessage"
                    />

                    <v-card-text class="pt-4">
                      <v-sheet
                        class="mx-auto"
                        :style="{ backgroundColor: theme === 'light' ? '#fefcf9' : '#222222' }"
                      >
                        <v-form ref="refVForm" fast-fail @submit.prevent="onFormSubmit">
                          <v-row dense>
                            <v-col cols="12" md="6" lg="4">
                              <v-text-field
                                v-model="formData.firstname"
                                label="First Name"
                                variant="filled"
                                :hide-details="true"
                                :rules="[requiredValidator]"
                                 :color="theme === 'dark' ? 'white' : 'primary'"
                              />
                            </v-col>
                            <v-col cols="12" md="6" lg="4">
                              <v-text-field
                                v-model="formData.lastname"
                                label="Last Name"
                                variant="filled"
                               :color="theme === 'dark' ? 'white' : 'primary'"
                                :rules="[requiredValidator]"
                              />
                            </v-col>
                            <v-col cols="12" md="6" lg="4">
                              <v-text-field
                                v-model="formData.middleinitial"
                                label="Middle Initial (optional)"
                                variant="filled"
                               :color="theme === 'dark' ? 'white' : 'primary'"
                              />
                            </v-col>
                            <v-col cols="12" md="6" lg="4">
                              <v-text-field
                                v-model="formData.age"
                                label="Age"
                                type="number"
                                variant="filled"
                               :color="theme === 'dark' ? 'white' : 'primary'"
                                :rules="[requiredValidator]"
                              />
                            </v-col>
                            <v-col cols="12" md="6" lg="4">
                              <v-text-field
                                v-model="formData.phone"
                                label="Phone"
                                variant="filled"
                               :color="theme === 'dark' ? 'white' : 'primary'"
                                :rules="[requiredValidator]"
                              />
                            </v-col>
                            <v-col cols="12" md="6" lg="4">
                              <v-text-field
                                v-model="formData.expertise"
                                label="Expertise"
                                variant="filled"
                               :color="theme === 'dark' ? 'white' : 'primary'"
                              />
                            </v-col>
                            <v-col cols="12 pa-4">
                              <v-textarea
                                v-model="formData.about"
                                label="About Me"
                                variant="filled"
                               :color="theme === 'dark' ? 'white' : 'primary'"
                                :rules="[requiredValidator]"
                                auto-grow
                                rows="3"
                              ></v-textarea>
                            </v-col>
                            <v-col cols="12" md="6" lg="4">
                              <v-text-field
                                v-model="formData.school"
                                label="School"
                                variant="filled"
                               :color="theme === 'dark' ? 'white' : 'primary'"
                                :rules="[requiredValidator]"
                              />
                            </v-col>
                            <v-col cols="12" md="6" lg="4">
                              <v-text-field
                                v-model="formData.course"
                                label="Course"
                                variant="filled"
                               :color="theme === 'dark' ? 'white' : 'primary'"
                                :rules="[requiredValidator]"
                              />
                            </v-col>
                            <v-col cols="12" md="6" lg="4">
                              <v-text-field
                                v-model="formData.yearLevel"
                                label="Year Level"
                                type="number"
                                variant="filled"
                               :color="theme === 'dark' ? 'white' : 'primary'"
                                :rules="[requiredValidator]"
                              />
                            </v-col>
                            <v-col cols="12" md="6" lg="4">
                              <v-text-field
                                v-model="formData.email"
                                label="Email"
                                variant="filled"
                               :color="theme === 'dark' ? 'white' : 'primary'"
                                :rules="[requiredValidator, emailValidator]"
                              />
                            </v-col>
                            <v-col cols="12" md="6" lg="4">
                              <v-text-field
                                v-model="formData.password"
                                label="Password"
                                variant="filled"
                               :color="theme === 'dark' ? 'white' : 'primary'"
                                :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                                :type="visible ? 'text' : 'password'"
                                @click:append-inner="visible = !visible"
                                :rules="[requiredValidator, passwordValidator]"
                              />
                            </v-col>
                            <v-col cols="12" md="6" lg="4">
                              <v-text-field
                                v-model="formData.confirm_password"
                                label="Confirm Password"
                                variant="filled"
                               :color="theme === 'dark' ? 'white' : 'primary'"
                                :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                                :type="visible ? 'text' : 'password'"
                                @click:append-inner="visible = !visible"
                                :rules="[
                                  requiredValidator,
                                  confirmedValidator(formData.confirm_password, formData.password),
                                ]"
                              />
                            </v-col>

                            <!-- Sign Up Button & Login Text at the Bottom Center -->
                            <v-col cols="12" class="d-flex justify-center">
                              <v-btn
                                class="signup-btn"
                                type="submit"
                                prepend-icon="mdi-account-plus"
                                :disabled="formAction.formProcess"
                                :loading="formAction.formProcess"
                              >
                                Signup
                              </v-btn>
                            </v-col>

                            <v-col cols="12">
                              <v-divider class="my-5" />
                              <p class="text-center text-primary">
                                Already have an account?
                                <RouterLink class="active-click" to="/"
                                  ><b>Login now!</b></RouterLink
                                >
                              </p>
                            </v-col>
                          </v-row>
                        </v-form>
                        <v-dialog
                          v-model="showDialog"
                          max-width="400"
                          location="top"
                          scrim="false"
                          persistent
                        >
                          <v-card class="mt-6">
                            <v-card-title class="text-h6">Registration Successful!</v-card-title>
                            <v-card-text>Do you want to proceed to login?</v-card-text>
                            <v-card-actions class="justify-end">
                              <v-btn text color="primary" @click="handleDialogCancel">No</v-btn>
                              <v-btn color="primary" @click="handleDialogConfirm">Yes</v-btn>
                            </v-card-actions>
                          </v-card>
                        </v-dialog>
                      </v-sheet>
                    </v-card-text>
                  </v-card>
                </transition>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </v-app>
  </v-responsive>
</template>

-
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
  transform: scale(1.05);
  box-shadow: 0 6px 18px rgba(33, 150, 243, 0.6);
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
  max-width: 200px;
  width: 100%;
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
body.dark .signup-btn {
  background-color: #2196f3;
}

body.dark .signup-btn:hover {
  background-color: #1565c0;
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
  text-decoration: none;
  transition: color 0.3s ease;
}

body.dark .active-click {
  color: #90caf9; /* default text in dark */
}

body.dark .active-click:hover {
  color: #ffffff; /* hover in dark mode */
}

body:not(.dark) .active-click {
  color: #1565c0; /* default text in light */
}

body:not(.dark) .active-click:hover {
  color: #0d47a1; /* hover in light mode */
}

/*/register now */
.text-font {
  font-size: 20px;
  font-family: 'Ubuntu', sans-serif;
  letter-spacing: 2px;
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
