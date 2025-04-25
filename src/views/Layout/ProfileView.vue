
<script setup>

import { ref, onMounted, watch, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import { useTheme } from 'vuetify'

// Theme
const theme = useTheme()
const currentTheme = ref(localStorage.getItem('theme') || 'light')

function toggleTheme() {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  theme.global.name.value = currentTheme.value
  localStorage.setItem('theme', currentTheme.value)
}

watch(currentTheme, (val) => {
  theme.global.name.value = val
  localStorage.setItem('theme', val)
})

// UI controls
const dialog = ref(false)
const loading = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const isEditing = ref(false)

// Profile data
const profile = ref({
  firstName: '',
  lastName: '',
  middleInitial: '',
  age: '',
  expertise: '',
  email: '',
  phone: '',
  about: '',
  education: ['', '', ''],
})

// Profile image
const profileImage = ref('')
const selectedFile = ref(null)
const maxSizeMB = 2

// Computed full name
const fullName = computed(() => {
  const mid = profile.value.middleInitial ? `${profile.value.middleInitial}. ` : ''
  return `${profile.value.firstName} ${mid}${profile.value.lastName}`
})

// Fetch profile when mounted
onMounted(() => {
  theme.global.name.value = currentTheme.value
  getUserProfile()
})

// Watch profile image changes
watch(profileImage, (newVal) => {
  if (newVal) {
    localStorage.setItem('profileImage', newVal)
  }
})

// Fetch user profile from Supabase
const getUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      profile.value.firstName = data.first_name || ''
      profile.value.lastName = data.last_name || ''
      profile.value.middleInitial = data.middle_initial || ''
      profile.value.age = data.age || ''
      profile.value.expertise = data.expertise || ''
      profile.value.email = data.email || user.email
      profile.value.phone = data.phone || ''
      profile.value.about = data.about || ''
      profile.value.education = data.education || ['', '', '']
      profileImage.value = data.avatar_url || ''
    } else {
      console.error('No user found.')
    }
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Save profile changes to Supabase
const saveProfile = async () => {
  isEditing.value = false
  loading.value = true

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.value.firstName,
          last_name: profile.value.lastName,
          middle_initial: profile.value.middleInitial,
          age: profile.value.age,
          expertise: profile.value.expertise,
          email: profile.value.email,
          phone: profile.value.phone,
          about: profile.value.about,
          education: profile.value.education,
          avatar_url: profileImage.value,
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating profile:', error)
      } else {
        snackbarMsg.value = 'Profile saved!'
        snackbar.value = true
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error)
  } finally {
    loading.value = false
  }
}

// Upload new image to Supabase Storage
const onImageSelected = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    snackbarMsg.value = 'Only JPG and PNG files are allowed.'
    snackbar.value = true
    return
  }

  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > maxSizeMB) {
    snackbarMsg.value = `File size exceeds ${maxSizeMB}MB limit.`
    snackbar.value = true
    return
  }

  selectedFile.value = file

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('No user found')
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}_${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Upload the file to storage
    const { error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      return
    }

    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(filePath)

    const publicUrl = publicUrlData.publicUrl

    // Save the new URL in profile
    profileImage.value = publicUrl

    // Update user profile immediately
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error saving avatar URL:', updateError)
    }

    snackbarMsg.value = 'Profile picture updated!'
    snackbar.value = true

  } catch (error) {
    console.error('Unexpected error uploading image:', error)
  }
}

// Remove profile image (local and database update if needed)
const removeProfileImage = async () => {
  profileImage.value = ''
  localStorage.removeItem('profileImage')

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: '' })
        .eq('id', user.id)

      if (error) {
        console.error('Error clearing avatar URL:', error)
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Other UI actions
function proceedWithApplication() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    dialog.value = false
    snackbarMsg.value = 'Application submitted successfully!'
    snackbar.value = true
  }, 2000)
}

function enableEdit() {
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

function getEducationPlaceholder(index) {
  if (index === 0) return 'Enter your school/university'
  if (index === 1) return 'Enter your course or degree'
  if (index === 2) return 'Enter your year level'
  return 'Enter educational info'
}


//sir javbez code
// logout functionality
/*const onLogout = async () => {
  formAction.value = {...formActionDefault}
  formAction.value.formProcess = true

  const {error} = await supabase.auth.signOut()
  if(error){
    console.error('Error during logout: ', error)
    return
  }
  formAction.value.formProcess = false
  router.replace('/')
}

//getting user functionality
const getUser = async() =>{

  const{
    data:{
      user:{user_metadata:metadata}
    }
  } =await supabase.auth.getUser()

  useData.value.email = metadata.email
  userData.value.fullname = metadata.firstname + '' +metadata.lastname

}
//load functions during component rendering
onMounted(() => {
  getUser()
})*/
</script>

<template>
  <v-app id="inspire">
    <!-- App Bar -->
    <v-app-bar flat :color="currentTheme === 'light' ? '#1565c0' : 'grey-darken-4'">
      <v-container class="d-flex align-center justify-space-between pa-2">
        <!-- Logo -->
        <div class="d-flex align-center gap-2">
          <v-avatar color="#fff" size="44">
            <v-img src="image/Teach&Learn.png" alt="Logo" />
          </v-avatar>
        </div>

        <!-- Desktop Navigation -->
        <v-spacer />

        <!-- Centered Navigation Links (Desktop only) -->
        <div class="d-none d-md-flex align-center" style="gap: 24px">
          <RouterLink to="/home" class="text-white text-decoration-none font-weight-medium">Home</RouterLink>
          <RouterLink to="/about" class="text-white text-decoration-none font-weight-medium">About Us</RouterLink>
          <RouterLink to="/contact" class="text-white text-decoration-none font-weight-medium">Contact Us</RouterLink>
        </div>

        <!-- Spacer after center links -->
        <v-spacer />

        <!-- Mobile Menu -->
        <v-menu transition="scale-transition" offset-y theme="light">
          <template #activator="{ props }">
            <v-app-bar-nav-icon v-bind="props" class="d-md-none" />
          </template>
          <v-list>
            <v-list-item link><RouterLink to="/home" class="text-decoration-none">Home</RouterLink></v-list-item>
            <v-list-item link><RouterLink to="/profile" class="text-decoration-none">My Profile</RouterLink></v-list-item>
            <v-list-item link><RouterLink to="/appointments" class="text-decoration-none">My Appointments</RouterLink></v-list-item>
            <v-list-item link><RouterLink to="/about" class="text-decoration-none">About Us</RouterLink></v-list-item>
            <v-list-item link><RouterLink to="/contact" class="text-decoration-none">Contact Us</RouterLink></v-list-item>
            <v-divider></v-divider>
            <!-- Logout button -->
            <v-list-item link @click="onLogout">
              <v-btn text class="text-decoration-none">Logout</v-btn>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-container>
    </v-app-bar>

    <!-- Main Content -->
    <v-main :class="currentTheme === 'dark' ? 'bg-grey-darken-4 text-white' : 'bg-grey-lighten-3'">
      <v-container fluid class="py-6 px-4 px-sm-6">
        <v-row justify="center">
          <v-col cols="12" sm="10" md="10" lg="10">
            <v-sheet :class="currentTheme === 'dark' ? 'bg-grey-darken-3 text-white' : 'bg-white'"
              class="fade-slide-up pa-4 pa-sm-6 text-sm-center" elevation="2" rounded="lg">
              
              <!-- Theme Toggle -->
              <v-btn icon size="small" @click="toggleTheme" class="position-absolute" style="top: 16px; right: 16px; z-index: 10">
                <v-icon>{{ currentTheme === 'light' ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}</v-icon>
              </v-btn>

              <!-- Profile Image -->
              <div class="d-flex flex-column align-center mb-4">
                <v-avatar :size="$vuetify.display.smAndDown ? 100 : 120" color="grey-lighten-2">
                  <v-img v-if="profileImage" :src="profileImage" cover />
                  <v-icon v-else size="80" color="grey-darken-1">mdi-account</v-icon>
                </v-avatar>

                <div class="mt-3 d-flex flex-wrap justify-center gap-2">
                  <v-btn size="small" color="primary" @click="$refs.imageInput.click()">
                    <v-icon start>mdi-upload</v-icon>
                  </v-btn>
                  <v-btn v-if="profileImage" size="small" color="red" variant="outlined" @click="removeProfileImage">
                    <v-icon start>mdi-delete</v-icon>
                  </v-btn>
                </div>
                <input type="file" ref="imageInput" accept="image/*" class="d-none" @change="onImageSelected" />
              </div>

              <!-- Full Name -->
              <div class="d-flex flex-column align-center">
                <h3 class="font-weight-medium mb-4">{{ fullName }}</h3>
                <v-btn color="primary" class="mb-3" @click="dialog = true">Apply as Tutor?</v-btn>
              </div>

              <!-- Confirm Dialog -->
              <v-dialog v-model="dialog" max-width="500" scrollable transition="dialog-bottom-transition" persistent>
                <v-card>
                  <v-card-title class="text-h6 text-start">
                    <v-icon class="me-2">mdi-alert-circle-outline</v-icon> Confirm Application
                  </v-card-title>
                  <v-card-text class="text-start">Your personal information will be public. Do you still wish to proceed?</v-card-text>
                  <v-card-actions class="justify-end">
                    <v-btn color="red" variant="outlined" @click="dialog = false" :disabled="loading">No</v-btn>
                    <v-btn color="green" @click="proceedWithApplication" :loading="loading">Yes</v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>

              <!-- Snackbar -->
              <v-snackbar v-model="snackbar" timeout="3000" color="success" location="top">
                {{ snackbarMsg }}
                <template #actions>
                  <v-btn variant="text" @click="snackbar = false" icon="mdi-close" />
                </template>
              </v-snackbar>

              <v-divider class="my-4" />

              <!-- Profile Form -->
              <div class="text-start">
                <v-row v-for="(label, key) in { 'Given Name:': 'firstName', 'Last Name:': 'lastName', 'Middle Initial:': 'middleInitial', 'Age:': 'age', 'Expertise:': 'expertise', 'Email:': 'email', 'Phone:': 'phone' }"
                  :key="key" class="py-1" dense>
                  <v-col cols="12" sm="6" class="font-weight-medium">{{ label }}</v-col>
                  <v-col cols="12" sm="6">
                    <div v-if="!isEditing">{{ profile[key] }}</div>
                    <v-text-field v-else v-model="profile[key]" :placeholder="`Enter your ${label.toLowerCase().replace(':', '')}`"
                      density="compact" hide-details :type="key === 'age' ? 'number' : 'text'" />
                  </v-col>
                </v-row>

                <!-- About Me -->
                <v-row class="py-1" dense>
                  <v-col cols="12" sm="6" class="font-weight-medium">About Me:</v-col>
                  <v-col cols="12" sm="6">
                    <div v-if="!isEditing">{{ profile.about }}</div>
                    <v-textarea v-else v-model="profile.about" placeholder="Write something about yourself" rows="2" auto-grow
                      density="compact" hide-details />
                  </v-col>
                </v-row>

                <!-- Education -->
                <v-row class="py-1" dense>
                  <v-col cols="12" sm="6" class="font-weight-medium">Educational Background:</v-col>
                  <v-col cols="12" sm="6">
                    <div v-if="!isEditing">
                      <div v-for="item in profile.education" :key="item">{{ item }}</div>
                    </div>
                    <div v-else>
                      <v-text-field v-for="(item, index) in profile.education" :key="index" v-model="profile.education[index]"
                        :placeholder="getEducationPlaceholder(index)" density="compact" hide-details />
                    </div>
                  </v-col>
                </v-row>
              </div>

              <v-divider class="my-4" />

              <!-- Edit / Save Buttons -->
              <div class="d-flex flex-wrap justify-center gap-2">
                <v-btn v-if="!isEditing" size="small" variant="outlined" color="blue" @click="enableEdit">Edit</v-btn>
                <template v-else>
                  <v-btn size="small" variant="text" color="red" @click="cancelEdit">Cancel</v-btn>
                  <v-btn size="small" color="green" @click="saveProfile">Save</v-btn>
                </template>
              </div>
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped >
.fade-slide-up {
  animation: fadeSlideUp 1.6s ease-in both;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>