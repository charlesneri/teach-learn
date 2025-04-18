<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()
const currentTheme = ref(localStorage.getItem('theme') || 'light')

const dialog = ref(false)
const loading = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const isEditing = ref(false)

const profileImage = ref('')
const selectedFile = ref(null)
const maxSizeMB = 2

const searchQuery = ref('')

function performSearch() {
  if (searchQuery.value.trim()) {
    snackbarMsg.value = `You searched for: "${searchQuery.value}"`
    snackbar.value = true
  }
}

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

function toggleTheme() {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  theme.global.name.value = currentTheme.value
  localStorage.setItem('theme', currentTheme.value)
}

watch(currentTheme, (val) => {
  theme.global.name.value = val
  localStorage.setItem('theme', val)
})

onMounted(() => {
  theme.global.name.value = currentTheme.value
  const storedImage = localStorage.getItem('profileImage')
  if (storedImage) profileImage.value = storedImage
})

watch(profileImage, (newVal) => {
  if (newVal) localStorage.setItem('profileImage', newVal)
})

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
function saveProfile() {
  isEditing.value = false
  snackbarMsg.value = 'Profile saved!'
  snackbar.value = true
}

function onImageSelected(event) {
  const file = event.target.files[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    snackbarMsg.value = 'Only JPG and PNG files are allowed.'
    snackbar.value = true
    return
  }

  const sizeMB = file.size / 1024 / 1024
  if (sizeMB > maxSizeMB) {
    snackbarMsg.value = `File size exceeds ${maxSizeMB}MB limit.`
    snackbar.value = true
    return
  }

  selectedFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    profileImage.value = e.target.result
  }
  reader.readAsDataURL(file)
}

function removeProfileImage() {
  profileImage.value = ''
  localStorage.removeItem('profileImage')
}

const fullName = computed(() => {
  return `${profile.value.firstName} ${profile.value.middleInitial}. ${profile.value.lastName}`
})

function getEducationPlaceholder(index) {
  if (index === 0) return 'Enter your school/university'
  if (index === 1) return 'Enter your course or degree'
  if (index === 2) return 'Enter your year level'
  return 'Enter educational info'
}
</script>
<template>
  <v-app id="inspire">
    <!-- App Bar -->
    <v-app-bar flat :color="currentTheme === 'light' ? '#1565c0' : 'grey-darken-4'">
      <v-container class="d-flex align-center justify-space-between">
        <!-- Logo -->
        <div class="d-flex align-center gap-4">
          <v-avatar color="#fff" size="50">
            <v-img src="image/Teach&Learn.png" alt="Logo" />
          </v-avatar>
        </div>

        <!-- Navigation (Desktop) -->
        <div class="d-none d-md-flex align-center justify-center" style="gap: 24px">
          <router-link to="/home" class="text-white text-decoration-none font-weight-medium"
            >Home</router-link
          >
          <router-link to="/about" class="text-white text-decoration-none font-weight-medium"
            >About Us</router-link
          >
          <router-link to="/contact" class="text-white text-decoration-none font-weight-medium"
            >Contact Us</router-link
          >
        </div>

        <!--  Mobile Menu -->
        <v-responsive max-width="240" style="height: 100%">
          <div class="d-flex align-center search-wrapper" style="max-width: 400px; width: 100%">
              <v-text-field
                v-model="searchQuery"
                placeholder="Search..."
                variant="solo-filled"
                density="compact"
                rounded="lg"
                flat
                hide-details
                single-line
                class="search-input flex-grow-1"
                @keydown.enter="performSearch"
                append-inner-icon="mdi-magnify"
                @click:append-inner="performSearch"
              />
            </div>
            <div class="d-flex justify-center align-center">
            <v-menu transition="scale-transition" offset-y>
              <template #activator="{ props }">
                <v-app-bar-nav-icon v-bind="props" class="d-md-none" />
              </template>
              <v-list>
                <v-list-item link>
                  <router-link to="/home" class="text-decoration-none">Home</router-link>
                </v-list-item>
                <v-list-item link>
                  <router-link to="/profile" class="text-decoration-none">My Profile</router-link>
                </v-list-item>
                <v-list-item link>
                  <router-link to="/appointments" class="text-decoration-none"
                    >My Appointments</router-link
                  >
                </v-list-item>
                <v-list-item link>
                  <router-link to="/about" class="text-decoration-none">About Us</router-link>
                </v-list-item>
                <v-list-item link>
                  <router-link to="/contact" class="text-decoration-none">Contact Us</router-link>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item link>
                  <router-link to="/logout" class="text-decoration-none">Logout</router-link>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </v-responsive>
      </v-container>
    </v-app-bar>

    <!-- Main Content -->
    <v-main :class="currentTheme === 'dark' ? 'bg-grey-darken-4 text-white' : 'bg-grey-lighten-3'">
      <v-container fluid class="pa-4 pa-sm-6" style="max-width: 95%; margin: auto">
        <v-row justify="center">
          <v-col cols="12" md="8">
            <v-sheet
              :class="currentTheme === 'dark' ? 'bg-grey-darken-3 text-white' : 'bg-white'"
              class="pa-6 text-center"
              elevation="2"
              rounded="lg"
              style="position: relative"
            >
              <!-- Theme Toggle Button -->
              <h1>appointment</h1>
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
