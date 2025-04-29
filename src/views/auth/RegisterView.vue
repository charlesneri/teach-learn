<script setup>
import { ref, onMounted, watch } from 'vue'
<<<<<<< HEAD
import { supabase, formActionDefault } from '@/utils/supabase'
import AlertNotification from '@/components/common/AlertNotification.vue'
import {
  requiredValidator,
  emailValidator,
  passwordValidator,
  confirmedValidator,
} from '@/utils/validators'

import { useRouter } from 'vue-router'
=======
import { useRouter } from 'vue-router'

>>>>>>> development
const router = useRouter()

// Theme setup
const theme = ref(localStorage.getItem('theme') || 'light')
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
}
<<<<<<< HEAD
=======
watch(theme, (val) => localStorage.setItem('theme', val))

>>>>>>> development
onMounted(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      theme.value = e.matches ? 'dark' : 'light'
    }
  })
})
watch(theme, (val) => localStorage.setItem('theme', val))

<<<<<<< HEAD
// Form State
const visible = ref(false)
const refVForm = ref()
const formData = ref({
  firstname: '',
  lastname: '',
  middleinitial: '',
=======
// Registration form data
const userProfile = ref({
  firstName: '',
  lastName: '',
  middleInitial: '',
>>>>>>> development
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

<<<<<<< HEAD
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

    // Insert into profiles table
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
      avatar_url: '', // No image uploaded yet
    })

    if (profileError) {
      console.error('Error inserting into profiles table:', profileError)
      formAction.value.formErrorMessage = 'Profile creation failed!'
      formAction.value.formStatus = 500
    } else {
      console.log('Profile inserted successfully')
      formAction.value.formSuccessMessage = 'Successfully Registered!'
      refVForm.value?.reset()
      // Optionally: router.push('/login')
    }
  }

  formAction.value.formProcess = false
=======
// Form submit logic
const handleSubmit = () => {
  if (
    userProfile.value.password !== userProfile.value.confirmPassword ||
    !userProfile.value.firstName ||
    !userProfile.value.lastName ||
    !userProfile.value.email
  ) {
    alert('Please complete all required fields and ensure passwords match.')
    return
  }

  // Save only the fields needed for profile
  const formattedProfile = {
    firstName: userProfile.value.firstName,
    lastName: userProfile.value.lastName,
    middleInitial: userProfile.value.middleInitial,
    age: userProfile.value.age,
    phone: userProfile.value.phone,
    expertise: userProfile.value.expertise,
    about: userProfile.value.about,
    email: userProfile.value.email,
    education: [
      userProfile.value.school,
      userProfile.value.course,
      userProfile.value.yearLevel,
    ],
  }

  localStorage.setItem('userProfile', JSON.stringify(formattedProfile))
  alert('Registration successful!')

  // Optional redirect to profile
  // router.push('/profile')
>>>>>>> development
}
</script>

<template>
  <v-responsive class="app-wrapper">
    <v-app :theme="theme">
      <v-main>
        <v-container
          fluid
          class="d-flex align-center justify-center"
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
            <v-col cols="12" md="6" class="mx-auto">
              <transition name="slide-fade">
                <v-card
                  :class="theme === 'dark' ? 'bg-grey-darken-4 text-white' : ''"
                  class="mx-auto rounded-xl pb-5 hover-card"
                  width="500"
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
                    <span class="font-weight-black d-flex justify-center">Register Now!</span>
                  </template>

                  <AlertNotification
                    :form-success-message="formAction.formSuccessMessage"
                    :form-error-message="formAction.formErrorMessage"
                  />

                  <v-card-text class="pt-4">
                    <v-sheet class="mx-auto" width="300">
                      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
                        <v-text-field
                          v-model="formData.firstname"
                          label="First Name"
                          variant="outlined"
                          :rules="[requiredValidator]"
                        />
                        <v-text-field
                          v-model="formData.lastname"
                          label="Last Name"
                          variant="outlined"
                          :rules="[requiredValidator]"
                        />
                        <v-text-field
                          v-model="formData.middleinitial"
                          label="Middle Initial (optional)"
                          variant="outlined"
                        />
                        <v-text-field
                          v-model="formData.age"
                          label="Age"
                          type="number"
                          variant="outlined"
                          :rules="[requiredValidator]"
                        />

                        <!-- ✅ New Field: Phone Number -->
                        <v-text-field
                          v-model="userProfile.phone"
                          label="Phone Number"
                          type="tel"
                          variant="outlined"
                          :color="theme === 'dark' ? 'white' : 'primary'"
                        />

                        <!-- ✅ New Field: Expertise -->
                        <v-text-field
                          v-model="userProfile.expertise"
                          label="Expertise / Field"
                          variant="outlined"
                          :color="theme === 'dark' ? 'white' : 'primary'"
                        />

                        <v-text-field
                          v-model="formData.phone"
                          label="Phone"
                          variant="outlined"
                          :rules="[requiredValidator]"
                        />
                        <v-text-field
                          v-model="formData.expertise"
                          label="Expertise"
                          variant="outlined"
                        />

                        <v-text-field
                          v-model="formData.about"
                          label="About Me"
                          variant="outlined"
                          :rules="[requiredValidator]"
                        />
                        <v-text-field
                          v-model="formData.school"
                          label="School"
                          variant="outlined"
                          :rules="[requiredValidator]"
                        />
                        <v-text-field
                          v-model="formData.course"
                          label="Course"
                          variant="outlined"
                          :rules="[requiredValidator]"
                        />
                        <v-text-field
                          v-model="formData.yearLevel"
                          label="Year Level"
                          type="number"
                          variant="outlined"
                          :rules="[requiredValidator]"
                        />
                        <v-text-field
                          v-model="formData.email"
                          label="Email"
                          variant="outlined"
                          :rules="[requiredValidator, emailValidator]"
                        />
                        <v-text-field
                          v-model="formData.password"
                          label="Password"
                          variant="outlined"
                          :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                          :type="visible ? 'text' : 'password'"
                          @click:append-inner="visible = !visible"
                          :rules="[requiredValidator, passwordValidator]"
                        />
                        <v-text-field
                          v-model="formData.confirm_password"
                          label="Confirm Password"
                          variant="outlined"
                          :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                          :type="visible ? 'text' : 'password'"
                          @click:append-inner="visible = !visible"
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
