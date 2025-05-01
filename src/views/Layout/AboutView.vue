<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const theme = useTheme()

// Theme
const currentTheme = ref(localStorage.getItem('theme') || 'light')
watch(currentTheme, (val) => {
  theme.global.name.value = val
  localStorage.setItem('theme', val)
})
const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
}

// Profile image from localStorage
const profileImage = ref('')
watch(profileImage, (newVal) => {
  if (newVal) localStorage.setItem('profileImage', newVal)
})

// User info
const currentUserProfile = ref({
  firstName: '',
  lastName: '',
  avatarUrl: '',
  isPublicTutor: false,
})

// Drawer and responsive
const drawer = ref(false)
const mini = ref(false)
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}
const toggleDrawer = () => {
  drawer.value = !drawer.value
}

// Logout
const handleLogoutClick = async () => {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout failed:', error.message)
    snackbarMsg.value = 'Logout failed. Try again.'
    snackbarColor.value = 'red'
    snackbar.value = true
    return
  }

  currentUserProfile.value = {
    firstName: '',
    lastName: '',
    avatarUrl: '',
    isPublicTutor: false,
  }
  localStorage.removeItem('theme')

  snackbarMsg.value = 'Logged out successfully!'
  snackbarColor.value = 'green'
  snackbar.value = true

  setTimeout(() => {
    router.push('/')
  }, 1000)
}

// Lifecycle
onMounted(() => {
  theme.global.name.value = currentTheme.value
  checkMobile()
  window.addEventListener('resize', checkMobile)

  const storedImage = localStorage.getItem('profileImage')
  if (storedImage) profileImage.value = storedImage
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <v-app id="inspire">
    <!-- Drawer Sidebar (right, collapsible) -->
    <transition name="fade-slide-up">
      <v-navigation-drawer
        v-if="drawer"
        :temporary="isMobile"
        :permanent="!isMobile"
        :width="isMobile ? '100%' : 280"
        right
        app
        :scrim="isMobile"
        :style="{
          backgroundColor: currentTheme === 'dark' ? '#424242' : '',
          color: currentTheme === 'dark' ? '#ffffff' : '#000000',
        }"
      >
        <!-- Menu Icon that toggles drawer size -->
        <v-btn icon class="ms-5 d-lg-none" @click="toggleDrawer">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
        <!-- Profile -->
        <v-sheet
          class="pa-4 text-center"
          rounded="lg"
          :style="{
            backgroundColor: currentTheme === 'dark' ? '#424242' : '',
            color: currentTheme === 'dark' ? '#ffffff' : '#000000',
          }"
        >
          <v-avatar size="100" class="mb-3">
            <v-img v-if="currentUserProfile.avatarUrl" :src="currentUserProfile.avatarUrl" cover />
            <v-icon v-else size="80">mdi-account</v-icon>
          </v-avatar>
          <h3 v-if="!mini">{{ currentUserProfile.firstName }} {{ currentUserProfile.lastName }}</h3>
        </v-sheet>

        <v-divider class="my-2" />

        <v-list nav dense>
          <v-list-item :to="'/home'" tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-home-outline</v-icon>
              <span v-if="!mini" class="icon-mdi">Home</span>
            </div>
          </v-list-item>

          <v-list-item :to="'/about'" tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-information-outline</v-icon>
              <span v-if="!mini" class="icon-mdi">About Us</span>
            </div>
          </v-list-item>

          <v-list-item :to="'/contact'" tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-phone-outline</v-icon>
              <span v-if="!mini" class="icon-mdi">Contact Us</span>
            </div>
          </v-list-item>

          <v-divider class="my-2" />

          <v-list-item :to="'/profile'" tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-account-outline</v-icon>
              <span v-if="!mini" class="icon-mdi">My Profile</span>
            </div>
          </v-list-item>

          <v-list-item :to="'/appointments'" tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-calendar</v-icon>
              <span v-if="!mini" class="icon-mdi">My Appointments</span>
            </div>
          </v-list-item>

          <v-list-item :to="'/appointments'" tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px"> mdi-delete-outline</v-icon>
              <span v-if="!mini" class="icon-mdi">Delete History</span>
            </div>
          </v-list-item>

          <v-divider class="my-2" />
          <v-list-item @click="handleLogoutClick">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-logout</v-icon>
              <span v-if="!mini" class="icon-mdi">Logout</span>
            </div>
          </v-list-item>
          <!-- Theme toggle -->
          <div class="text-center mt-4">
            <v-btn icon @click="toggleTheme">
              <v-icon>{{
                currentTheme === 'light' ? 'mdi-weather-night' : 'mdi-white-balance-sunny'
              }}</v-icon>
            </v-btn>
          </div>
        </v-list>
      </v-navigation-drawer>
    </transition>
    <!-- App Bar -->
    <v-app-bar flat :color="currentTheme === 'light' ? '#1565c0' : 'grey-darken-4'">
      <!-- Menu Icon that toggles drawer size -->
      <v-btn icon class="ms-5" @click="toggleDrawer">
        <v-icon>mdi-menu</v-icon>
      </v-btn>
      <v-container
        class="d-flex align-center pa-0"
        :class="{
          'transition-all': !isMobile,
          'no-transition': isMobile,
        }"
      >
        <div class="search-wrapper">
          <!--logo-->

          <v-avatar color="#fff" size="50" class="logo me-6">
            <v-img src="image/Teach&Learn.png" alt="Logo" />
          </v-avatar>
        </div>
      </v-container>
    </v-app-bar>

    <!-- Main Content -->
    <v-main
      :style="{
        backgroundColor: currentTheme === 'dark' ? '#424242' : '#fefcf9',
        color: currentTheme === 'dark' ? '#ffffff' : '#000000',
      }"
    >
      <v-container fluid class="py-10 px-4 px-sm-6">
        <v-row justify="center">
          <v-col cols="12" sm="10" md="10" lg="10">
            <v-sheet
              :style="{
                backgroundColor: currentTheme === 'dark' ? '#424242' : '#fefcf9',
                color: currentTheme === 'dark' ? '#ffffff' : '#000000',
              }"
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
                    It is a platform built to connect learners and educators in a simple, efficient,
                    and inspiring way.
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
                    <v-card-title class="text-subtitle-1 font-weight-bold"
                      >Step 1: Create Your Profile</v-card-title
                    >
                    <v-card-text class="text-body-2">
                      Add your details and a profile photo to connect with tutors or learners.
                    </v-card-text>
                  </v-card>
                </v-col>

                <!-- Step 2 -->
                <v-col cols="12" sm="6" md="4" class="mb-4 d-flex">
                  <v-card class="pa-4 flex-grow-1 fade-in" variant="outlined" rounded="lg">
                    <v-icon size="32" class="mb-2" color="primary">mdi-magnify</v-icon>
                    <v-card-title class="text-subtitle-1 font-weight-bold"
                      >Step 2: Search and Connect</v-card-title
                    >
                    <v-card-text class="text-body-2">
                      Find others by subject or expertise and start chatting.
                    </v-card-text>
                  </v-card>
                </v-col>

                <!-- Step 3 -->
                <v-col cols="12" sm="6" md="4" class="mb-4 d-flex">
                  <v-card class="pa-4 flex-grow-1 fade-in" variant="outlined" rounded="lg">
                    <v-icon size="32" class="mb-2" color="primary">mdi-calendar-clock</v-icon>
                    <v-card-title class="text-subtitle-1 font-weight-bold"
                      >Step 3: Book an Appointment</v-card-title
                    >
                    <v-card-text class="text-body-2">
                      Pick a time and confirm your session. Get reminders automatically.
                    </v-card-text>
                  </v-card>
                </v-col>

                <!-- Step 4 -->
                <v-col cols="12" sm="6" md="4" class="mb-4 d-flex">
                  <v-card class="pa-4 flex-grow-1 fade-in" variant="outlined" rounded="lg">
                    <v-icon size="32" class="mb-2" color="primary">mdi-school</v-icon>
                    <v-card-title class="text-subtitle-1 font-weight-bold"
                      >Step 4: Attend & Learn</v-card-title
                    >
                    <v-card-text class="text-body-2">
                      Join the session, engage actively, and take notes.
                    </v-card-text>
                  </v-card>
                </v-col>

                <!-- Step 5 -->
                <v-col cols="12" sm="6" md="4" class="mb-4 d-flex">
                  <v-card class="pa-4 flex-grow-1 fade-in" variant="outlined" rounded="lg">
                    <v-icon size="32" class="mb-2" color="primary">mdi-star-check</v-icon>
                    <v-card-title class="text-subtitle-1 font-weight-bold"
                      >Step 5: Review and Continue</v-card-title
                    >
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
/* Drawer & App Bar */
.v-navigation-drawer {
  transition: all 0.3s ease;
}
.v-main {
  transition: margin-right 0.3s ease;
}

/* Mini Drawer Logic */
.drawer-hidden {
  display: none !important;
}

/* Search Styles */
.search-wrapper {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  z-index: 10;
  max-width: none;
  flex-wrap: nowrap;
}
.search-input {
  width: 240px;
  max-width: none;
  transition: width 0.3s ease;
}
.logo {
  width: 50px;
  height: 50px;
}
.large-icon ::v-deep(.v-field__append-inner .v-icon) {
  font-size: 28px !important;
}

/* Animations */
.fade-slide-up-enter-active {
  animation: fadeSlideUp 0.6s ease;
}
@keyframes fadeSlideUp {
  0% {
    opacity: 0;
    transform: translateY(24px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.fade-slide-move {
  transition: transform 0.3s ease;
}

/* Responsive */
@media (max-width: 600px) {
  .v-dialog__content {
    padding: 8px !important;
  }
  .v-card-text,
  .v-card-actions {
    padding: 12px !important;
    flex-direction: column;
    gap: 10px;
  }
  .v-navigation-drawer {
    width: 100% !important;
  }
  .v-main {
    padding-top: 64px;
  }
  .search-input {
    width: 150px;
    max-width: 100%;
  }
  .search-wrapper {
    right: 12px;
    gap: 8px;
  }
  .logo {
    width: 40px;
    height: 40px;
  }
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
}
</style>
