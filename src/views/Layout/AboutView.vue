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
    <v-app-bar
      flat
      :color="currentTheme === 'light' ? '#1565c0' : 'grey-darken-4'"
      class="px-2 px-md-4"
    >
    <v-container fluid class="d-flex align-center justify-space-between pa-0">
  <!-- Logo -->
  <v-avatar color="#fff" size="44" class="mr-2">
    <v-img src="image/Teach&Learn.png" alt="Logo" />
  </v-avatar>

  <!-- Spacer -->
  <v-spacer />

  <!-- Centered Desktop Links -->
  <div class="d-none d-md-flex align-center me-5" style="gap: 24px">
    <RouterLink to="/home" class="text-white text-decoration-none font-weight-medium">Home</RouterLink>
    <RouterLink to="/about" class="text-white text-decoration-none font-weight-medium">About Us</RouterLink>
    <RouterLink to="/contact" class="text-white text-decoration-none font-weight-medium">Contact Us</RouterLink>
  </div>

  <!-- Spacer -->
  <v-spacer />

  <!-- Notification Bell + Mobile Menu together -->
  <div class="d-flex align-center gap-2">
    
    <!-- Notification Bell -->
    <v-menu v-model="notificationMenu" offset-y close-on-content-click transition="scale-transition">
      <template #activator="{ props }">
        <v-btn icon v-bind="props" @click="toggleMenu">
          <v-icon>mdi-bell</v-icon>
        </v-btn>
      </template>
      <v-card min-width="300">
        <v-list density="compact">
          <v-list-item v-for="notification in notifications" :key="notification.id">
            <v-list-item-content>
              <v-list-item-title>{{ notification.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ notification.time }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item>
            <v-list-item-title class="text-center">
              <v-btn text small @click="notifications = []">Clear All</v-btn>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>

    <!-- Mobile Menu (only shows in mobile) -->
    <v-menu transition="scale-transition" offset-y>
      <template #activator="{ props }">
        <v-app-bar-nav-icon v-bind="props" class="d-md-none" />
      </template>
      <v-list>
        <v-list-item link>
          <RouterLink to="/" :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']">Home</RouterLink>
        </v-list-item>
        <v-list-item link>
          <RouterLink to="/profile" :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']">My Profile</RouterLink>
        </v-list-item>
        <v-list-item link>
          <RouterLink to="/appointments" :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']">My Appointment</RouterLink>
        </v-list-item>
        <v-list-item link>
          <RouterLink to="/about" :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']">About Us</RouterLink>
        </v-list-item>
        <v-list-item link>
          <RouterLink to="/contact" :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']">Contact Us</RouterLink>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item link>
          <RouterLink to="/" :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']">Logout</RouterLink>
        </v-list-item>
      </v-list>
    </v-menu>

  </div>
</v-container>

    </v-app-bar>

    <!-- Main Content -->
    <v-main :class="currentTheme === 'dark' ? 'bg-grey-darken-4 text-white' : 'bg-grey-lighten-3'">
    <v-container fluid class="py-10 px-4 px-sm-6">
      <v-row justify="center">
        <v-col cols="12" sm="10" md="10" lg="10">
          <v-sheet
            :class="currentTheme === 'dark' ? 'bg-grey-darken-3 text-white' : 'bg-white text-black'"
            class="pa-6"
            elevation="2"
            rounded="lg"
          >
            <!-- Header -->
            <div class="text-center mb-8">
              <v-responsive class="mb-4">
                <h1 class="text-h4 font-weight-bold">About Teach & Learn</h1>
              </v-responsive>
              <v-responsive>
                <p class="text-body-1">
                  It is a platform built to connect learners and educators in a simple, efficient, and inspiring way.
                </p>
              </v-responsive>
            </div>

            <!-- Divider -->
            <div class="text-center mb-6">
              <v-divider class="my-4"></v-divider>
              <h2 class="text-h6 font-weight-medium">How It Works</h2>
              <v-divider class="my-4"></v-divider>
            </div>

            <!-- Steps -->
            <v-row dense>
              <!-- Step 1 -->
              <v-col cols="12" sm="6" md="4" class="mb-4 d-flex">
                <v-card class="pa-4 flex-grow-1 fade-in" variant="outlined" rounded="lg">
                  <v-icon size="32" class="mb-2" color="primary">mdi-account-plus</v-icon>
                  <v-card-title class="text-subtitle-1 font-weight-bold">Step 1: Create Your Profile</v-card-title>
                  <v-card-text class="text-body-2">
                    Add your details and a profile photo to connect with tutors or learners.
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Step 2 -->
              <v-col cols="12" sm="6" md="4" class="mb-4 d-flex">
                <v-card class="pa-4 flex-grow-1 fade-in" variant="outlined" rounded="lg">
                  <v-icon size="32" class="mb-2" color="primary">mdi-magnify</v-icon>
                  <v-card-title class="text-subtitle-1 font-weight-bold">Step 2: Search and Connect</v-card-title>
                  <v-card-text class="text-body-2">
                    Find others by subject or expertise and start chatting.
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Step 3 -->
              <v-col cols="12" sm="6" md="4" class="mb-4 d-flex">
                <v-card class="pa-4 flex-grow-1 fade-in" variant="outlined" rounded="lg">
                  <v-icon size="32" class="mb-2" color="primary">mdi-calendar-clock</v-icon>
                  <v-card-title class="text-subtitle-1 font-weight-bold">Step 3: Book an Appointment</v-card-title>
                  <v-card-text class="text-body-2">
                    Pick a time and confirm your session. Get reminders automatically.
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Step 4 -->
              <v-col cols="12" sm="6" md="4" class="mb-4 d-flex">
                <v-card class="pa-4 flex-grow-1 fade-in" variant="outlined" rounded="lg">
                  <v-icon size="32" class="mb-2" color="primary">mdi-school</v-icon>
                  <v-card-title class="text-subtitle-1 font-weight-bold">Step 4: Attend & Learn</v-card-title>
                  <v-card-text class="text-body-2">
                    Join the session, engage actively, and take notes.
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Step 5 -->
              <v-col cols="12" sm="6" md="4" class="mb-4 d-flex">
                <v-card class="pa-4 flex-grow-1 fade-in" variant="outlined" rounded="lg">
                  <v-icon size="32" class="mb-2" color="primary">mdi-star-check</v-icon>
                  <v-card-title class="text-subtitle-1 font-weight-bold">Step 5: Review and Continue</v-card-title>
                  <v-card-text class="text-body-2">
                    Reflect on what you learned, give feedback, and book your next session.
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- CTA Button -->
            <div class="text-center mt-6">
              <v-btn color="primary" size="large" elevation="1" class="text-none" to="/home">
                Get Started Now
              </v-btn>
            </div>
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
  </v-app>
</template>
<style scoped>

/* Remove underline on link */
.active-click {
  font-weight: 700;
  text-decoration: none;
  transition: color 0.3s;
}
.active-click:active {
  color: #d34b4b;
}
.active-click:hover {
  color: #2196f3;
}
.fade-in {
  animation: fadeIn 0.6s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}</style>