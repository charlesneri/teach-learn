<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, formActionDefault } from '@/utils/supabase'
import {
  requiredValidator,
  emailValidator,
  passwordValidator,
  confirmedValidator,
} from '@/utils/validators'
import AlertNotification from '@/components/common/AlertNotification.vue'

const router = useRouter()
const theme = ref(localStorage.getItem('theme') || 'light')

// Theme toggle function
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
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

const visible = ref(false)
const refVForm = ref()
const showDialog = ref(false)

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
  year: '',
  email: '',
  password: '',
  confirm_password: '',
})

const formAction = ref({ ...formActionDefault })

const handleDialogConfirm = () => {
  showDialog.value = false
  router.push('/home')
}
const handleDialogCancel = () => {
  showDialog.value = false
}

const onFormSubmit = () => {
  refVForm.value?.validate().then(({ valid }) => {
    if (valid) onSubmit()
  })
}
const onSubmit = async () => {
  formAction.value = { ...formActionDefault, formProcess: true }

  // Validate required fields (age, year)
  if (!formData.value.age || !formData.value.year) {
    formAction.value.formErrorMessage = "Age and Year are required fields!"
    formAction.value.formProcess = false
    return
  }

  // Validate that all fields are provided
  if (!formData.value.firstname || !formData.value.lastname || !formData.value.email) {
    formAction.value.formErrorMessage = "Please fill out all required fields!"
    formAction.value.formProcess = false
    return
  }

  // Create the user in Supabase Auth
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
        year: Number(formData.value.year),
      },
    },
  })

  if (error) {
    formAction.value.formErrorMessage = error.message
  } else if (data?.user) {
    // Insert into profiles table
    const { user } = data
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([{
        id: user.id, // Use the Supabase Auth user ID
        firstname: formData.value.firstname,
        lastname: formData.value.lastname,
        middleinitial: formData.value.middleinitial,
        age: Number(formData.value.age),
        phone: formData.value.phone,
        expertise: formData.value.expertise,
        about: formData.value.about,
        school: formData.value.school,
        course: formData.value.course,
        year: Number(formData.value.year),
      }])
      if (insertError) {
  console.log(insertError)  // Log the error for debugging
  formAction.value.formErrorMessage = 'Failed to insert profile data!'
} else {
  formAction.value.formSuccessMessage = 'Successfully Registered!'
  refVForm.value?.reset()
  showDialog.value = true

  setTimeout(() => {
    formAction.value.formSuccessMessage = ''
  }, 4000)
}

  }

  setTimeout(() => {
    formAction.value.formErrorMessage = ''
  }, 4000)

  formAction.value.formProcess = false
}


</script>

<template>
  <v-app :theme="theme">
    <v-main>
      <v-container
        fluid
        class="d-flex justify-center py-10 container-bg"
        :style="{ backgroundColor: theme === 'light' ? '#1565c0' : '#121212', minHeight: '100vh' }"
      >
        <v-btn
          icon
          @click="toggleTheme"
          class="theme-toggle"
          width="35"
          height="35"
          rounded="circle"
        >
          <v-icon>{{ theme === 'light' ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
        </v-btn>

        <v-card
          class="rounded-xl hover-card"
          max-width="800"
          width="100%"
          :style="{
          
            backgroundColor: theme === 'light' ? '#fefcf9' : '#222222',
       
          }"
        >
          <template #title>
            <v-img src="/image/Teach&Learn.png" width="150" class="mx-auto" cover />
            <v-divider class="my-4" thickness="3" color="black" />
            <p class="text-font text-center">Register Now!</p>
          </template>

          <AlertNotification
            :form-success-message="formAction.formSuccessMessage"
            :form-error-message="formAction.formErrorMessage"
          />
               <v-card-text>
            <v-form ref="refVForm" fast-fail @submit.prevent="onFormSubmit">
              <v-row dense>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.firstname"
                    label="First Name"
                    :rules="[requiredValidator]"
                    variant="filled"
                    :color="theme === 'dark' ? 'white' : 'primary'"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.lastname"
                    label="Last Name"
                    :rules="[requiredValidator]"
                    variant="filled"
                    :color="theme === 'dark' ? 'white' : 'primary'"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="formData.middleinitial"
                    label="Middle Initial"
                    variant="filled"
                    :color="theme === 'dark' ? 'white' : 'primary'"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="formData.age"
                    label="Age"
                    type="number"
                    :rules="[requiredValidator]"
                    variant="filled"
                    :color="theme === 'dark' ? 'white' : 'primary'"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="formData.phone"
                    label="Phone"
                    :rules="[requiredValidator]"
                    variant="filled"
                    :color="theme === 'dark' ? 'white' : 'primary'"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="formData.school"
                    label="School"
                    :rules="[requiredValidator]"
                    variant="filled"
                    :color="theme === 'dark' ? 'white' : 'primary'"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="formData.course"
                    label="Course"
                    :rules="[requiredValidator]"
                    variant="filled"
                    :color="theme === 'dark' ? 'white' : 'primary'"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="formData.year"
                    label="Year Level"
                    type="number"
                    :rules="[requiredValidator]"
                    variant="filled"
                    :color="theme === 'dark' ? 'white' : 'primary'"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-textarea
                    v-model="formData.expertise"
                    label="Expertise"
                    variant="filled"
                    rows="3"
                    :color="theme === 'dark' ? 'white' : 'primary'"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-textarea
                    v-model="formData.about"
                    label="About Me"
                    auto-grow
                    rows="3"
                    :rules="[requiredValidator]"
                    variant="filled"
                    :color="theme === 'dark' ? 'white' : 'primary'"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="formData.email"
                    label="Email"
                    :rules="[requiredValidator]"
                    variant="filled"
                    :color="theme === 'dark' ? 'white' : 'primary'"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="formData.password"
                    :type="visible ? 'text' : 'password'"
                    label="Password"
                    :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="visible = !visible"
                    :rules="[requiredValidator]"
                    variant="filled"
                    :color="theme === 'dark' ? 'white' : 'primary'"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="formData.confirm_password"
                    :type="visible ? 'text' : 'password'"
                    label="Confirm Password"
                    :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="visible = !visible"
                    :rules="[requiredValidator]"
                    variant="filled"
                    :color="theme === 'dark' ? 'white' : 'primary'"
                  />
                </v-col>

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
                    <RouterLink class="active-click" to="/">Login now!</RouterLink>
                  </p>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>

        <v-dialog v-model="showDialog" max-width="400" location="top" scrim="false" persistent>
          <v-card>
            <v-card-title class="text-h6">Registration Successful!</v-card-title>
            <v-card-text>Do you want to proceed to login?</v-card-text>
            <v-card-actions class="justify-end">
              <v-btn text color="primary" @click="handleDialogCancel">No</v-btn>
              <v-btn color="primary" @click="handleDialogConfirm">Yes</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.theme-toggle {
  position: absolute;
  top: 16px;
  right: 24px;
}
.hover-card:hover {
  transform: scale(1.01);
  box-shadow: 0 6px 18px rgba(33, 150, 243, 0.6);
}
.signup-btn {
  background-color: #1565c0;
  color: white;
  max-width: 200px;
  width: 100%;
  font-weight: bold;
  text-transform: uppercase;
  padding: 12px 24px;
  border-radius: 50px;
  font-size: 16px;
  transition: 0.3s ease;
}
.signup-btn:hover {
  background-color: #0d47a1;
  transform: scale(1.05);
}
.active-click {
  text-decoration: none;
  transition: color 0.3s ease;
  color: #1565c0;
}
.active-click:hover {
  color: #0d47a1;
}
body.dark .active-click {
  color: #90caf9;
}
body.dark .active-click:hover {
  color: #ffffff;
}
.text-font {
  font-size: 20px;
  font-family: 'Ubuntu', sans-serif;
  letter-spacing: 2px;
}
@media (max-width: 600px) {
  .signup-btn {
    font-size: 14px;
    padding: 10px 20px;
  }
  .theme-toggle {
    width: 40px;
    height: 40px;
    top: 12px;
    right: 12px;
  }
  .v-img {
    max-width: 120px;
    margin-top: 8px;
  }
}
</style>