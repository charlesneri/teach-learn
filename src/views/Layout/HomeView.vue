<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter, RouterLink } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { useDisplay } from 'vuetify'
const router = useRouter()
const theme = useTheme()

// === Theme Setup ===
const currentTheme = ref(localStorage.getItem('theme') || 'light')

const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  theme.global.name.value = currentTheme.value
  localStorage.setItem('theme', currentTheme.value)
}

watch(currentTheme, (val) => {
  theme.global.name.value = val
  localStorage.setItem('theme', val)
})

//
const display = useDisplay()
const isIcon = computed(() => display.smAndDown.value)

// === Drawer & Layout ===
const drawer = ref(false)
const mini = ref(false)
const isMobile = ref(false)

const toggleDrawer = () => {
  drawer.value = !drawer.value
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// === Snackbar ===
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('')

// === Auth & User Profile ===
const currentUserId = ref(null)
const currentUserProfile = ref({
  firstName: '',
  lastName: '',
  avatarUrl: '',
  isPublicTutor: false,
})

const handleLogoutClick = async () => {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout failed:', error.message)
    snackbarMsg.value = 'Logout failed. Try again.'
    snackbarColor.value = 'red'
    snackbar.value = true
    return
  }

  currentUserId.value = null
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
const fetchCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) {
    console.error('Error fetching user:', error.message)
    return
  }

  if (user) {
    // Assign the user ID and email
    currentUserId.value = user.id
    const { data, error } = await supabase
      .from('profiles')
      .select('firstname,lastname,avatar_url,is_public_tutor')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
    }

    if (data) {
      currentUserProfile.value = {
        firstName: data.firstname || '',
        lastName: data.lastname || '',
        avatarUrl: data.avatar_url || '',
        isPublicTutor: data.is_public_tutor || false,
        email: user.email || 'No email available', // Adding email from user metadata
      }
    }
  }
}

// === Tutors & Appointment State ===
const tutors = ref([])
const selectedTutor = ref(null)
const profileDialog = ref(false)
const appointmentDialog = ref(false)
const selectedDate = ref('')
const selectedTime = ref('')
const messageInput = ref('')
const datePickerOpen = ref(false)
const timePickerOpen = ref(false)

// === Tutor Actions ===
const fetchTutors = async () => {
  const { data } = await supabase.from('profiles').select('*').eq('is_public_tutor', true)
  tutors.value = data || []
}

const viewTutor = (tutor) => {
  selectedTutor.value = tutor
  profileDialog.value = true
}
//appointment
const openAppointment = (tutor) => {
  selectedTutor.value = tutor
  appointmentDialog.value = true
}

const saveAppointment = async () => {
  try {
    if (!selectedTutor.value || !selectedDate.value || !selectedTime.value) {
      snackbarMsg.value = 'Please fill all fields!'
      snackbarColor.value = 'red'
      snackbar.value = true
      return
    }

    // continue with logic...
    // e.g., await supabase insert logic
  } catch (error) {
    console.error('Error saving appointment:', error)
    snackbarMsg.value = 'Failed to save appointment.'
    snackbarColor.value = 'red'
    snackbar.value = true
    return
  }

  const { error } = await supabase.from('appointments').insert({
    student_id: currentUserId.value,
    mentor_id: selectedTutor.value.id,
    student_name: `${currentUserProfile.value.firstName} ${currentUserProfile.value.lastName}`,
    appointment_date: selectedDate.value,
    appointment_time: selectedTime.value,
    message: messageInput.value,
  })

  snackbar.value = true
  if (error) {
    console.error('Error saving appointment:', error)
    snackbarMsg.value = 'Failed to book appointment. Try again.'
    snackbarColor.value = 'red'
  } else {
    snackbarMsg.value = 'Appointment booked successfully!'
    snackbarColor.value = 'green'
    appointmentDialog.value = false

    setTimeout(() => {
      selectedDate.value = ''
      selectedTime.value = ''
      messageInput.value = ''
      datePickerOpen.value = false
      timePickerOpen.value = false
    }, 300)
  }
}

// === Search ===
const showSearch = ref(false)
const searchQuery = ref('')

const toggleSearch = () => {
  if (showSearch.value) searchQuery.value = ''
  showSearch.value = !showSearch.value
}
const closeSearch = () => {
  showSearch.value = false
  searchQuery.value = ''
}
const filteredTutors = computed(() => {
  if (!searchQuery.value.trim()) return tutors.value

  const keyword = searchQuery.value.trim().toLowerCase()
  return tutors.value.filter((tutor) => {
    const fullName = `${tutor.firstname || ''} ${tutor.lastname || ''}`.toLowerCase()
    const expertise = (tutor.expertise || '').toLowerCase()
    return fullName.includes(keyword) || expertise.includes(keyword)
  })
})

// === Mount Lifecycle ===
onMounted(async () => {
  theme.global.name.value = currentTheme.value
  checkMobile()
  window.addEventListener('resize', checkMobile)
  await fetchCurrentUser()
  await fetchTutors()
  await fetchRatings()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
})

// for rating code
const ratingsMap = ref({})

const fetchRatings = async () => {
  const { data, error } = await supabase.from('ratings').select('mentor_id, rating')

  if (error) {
    console.error('Error fetching ratings:', error)
    return
  }

  const totals = {}
  const counts = {}

  data.forEach(({ mentor_id, rating }) => {
    totals[mentor_id] = (totals[mentor_id] || 0) + rating
    counts[mentor_id] = (counts[mentor_id] || 0) + 1
  })

  const result = {}
  Object.keys(totals).forEach((id) => {
    result[id] = {
      average: (totals[id] / counts[id]).toFixed(1),
      count: counts[id],
    }
  })

  ratingsMap.value = result
}
const getDialogWidth = computed(() => {
  if (window.innerWidth < 500) return '95%'       // mobile
  if (window.innerWidth < 768) return '80%'       // tablet
  return '600px'                                   // default desktop
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
          backgroundColor: currentTheme === 'dark' ? '#424242' : '#ffffff',
          color: currentTheme === 'dark' ? '#ffffff' : '#000000',
        }"
      >
        <!-- Menu Icon that toggles drawer size -->
        <v-btn v-if="isIcon" icon class="ms-5 mt-5" @click="toggleDrawer">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
        <!-- Profile -->
        <v-sheet
          class="pa-4 text-center"
          rounded="lg"
          :style="{
            backgroundColor: currentTheme === 'dark' ? ' #424242' : '#ffffff',
            color: currentTheme === 'dark' ? '#ffffff' : '#000000',
          }"
        >
          <v-avatar size="100" class="mb-3">
            <!-- Display the user avatar -->
            <v-img v-if="currentUserProfile.avatarUrl" :src="currentUserProfile.avatarUrl" cover>
              <template #error>
                <v-icon size="80" color="grey-darken-1">mdi-account</v-icon>
              </template>
            </v-img>
            <v-icon v-else size="80" color="grey-darken-1">mdi-account</v-icon>
          </v-avatar>

          <!-- Display the user full name -->
          <h3 class="text-h6">
            {{ currentUserProfile.firstName }} {{ currentUserProfile.lastName }}
          </h3>
        </v-sheet>

        <v-divider class="my-2" />

        <v-list nav dense>
          <v-list-item :to="'/home'" tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-home-outline</v-icon>
              <span v-if="!mini" class="icon-mdi">Home</span>
            </div>
          </v-list-item>

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

          <v-list-item
            :to="'/DeleteHistory'"
            tag="RouterLink"
            @click="isMobile && (drawer = false)"
          >
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px"> mdi-delete-outline</v-icon>
              <span v-if="!mini" class="icon-mdi">Deleted Appointments</span>
            </div>
          </v-list-item>

          <v-divider class="my-2" />
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
    <v-app-bar flat :color="currentTheme === 'light' ? '#1565c0' : '#000000'">
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
          <!-- Search Input -->
          <!-- Always show input on desktop, toggle on mobile -->
          <template v-if="!isIcon">
            <v-text-field
              v-model="searchQuery"
              placeholder="Search by name or expertise..."
              density="compact"
              hide-details
              flat
              clearable
              class="search-input large-icon"
              append-inner-icon="mdi-magnify"
            />
          </template>

          <template v-else>
            <v-text-field
              v-if="showSearch"
              v-model="searchQuery"
              placeholder="Search by name or expertise..."
              density="compact"
              hide-details
              flat
              clearable
              class="search-input large-icon"
              append-inner-icon="mdi-close"
              @click:append-inner="toggleSearch"
              autofocus
            />
            <v-btn v-else icon @click="toggleSearch">
              <v-icon>mdi-magnify</v-icon>
            </v-btn>
          </template>

          <v-avatar
            :style="{
              backgroundColor: currentTheme === 'dark' ? '#1565c0' : '#ffffff',
              color: currentTheme === 'dark' ? '#ffffff' : '#000000',
            }"
            size="50"
            class="logo me-6"
          >
            <v-img src="image/Teach&Learn.png" alt="Logo" />
          </v-avatar>
        </div>
      </v-container>
    </v-app-bar>

    <!--pop up alert-->
    <v-snackbar
      v-model="snackbar"
      timeout="3000"
      :color="snackbarColor"
      location="top center"
      style="top: 80px"
    >
      {{ snackbarMsg }}
    </v-snackbar>

    <!-- Main -->
    <transition name="fade-slide-up">
      <v-main
        :style="{
          backgroundColor: currentTheme === 'dark' ? '#222222' : '#fefcf9',
          color: currentTheme === 'dark' ? '#ffffff' : '#000000',
        }"
      >
        <v-container fluid class="" style="max-width: 100%; margin: auto">
          <v-row justify="center">
            <v-col cols="12" md="9" lg="9" class="mt-5">
              <v-sheet
                elevation="3"
                rounded="lg"
                class="pa-6 ma-auto"
                style="min-height: 100vh; height: auto"
                :style="{
                  backgroundColor: currentTheme === 'dark' ? '#424242' : '#ffffff',
                  color: currentTheme === 'dark' ? '#ffffff' : '#000000',
                }"
              >
                <!-- Header -->
                <h1 class="mb-6" style="color: #1565c0">Mentors</h1>
                <v-divider :thickness="2" class="mb-6"></v-divider>

                <!-- Mentor Grid -->
                <v-row
                  v-if="filteredTutors.length"
                  class="gx-6 gy-6"
                  :justify="filteredTutors.length < 3 ? 'center' : 'start'"
                >
                  <v-col
                    v-for="tutor in filteredTutors"
                    :key="tutor.id"
                    cols="12"
                    sm="6"
                    md="4"
                    lg="3"
                  >
                    <v-fade-transition>
                      <v-card
                        variant="outlined"
                        class="pa-5 d-flex flex-column align-center text-center"
                        rounded="xl"
                        :style="{
                          backgroundColor: currentTheme === 'dark' ? '#424242' : '#ffffff',
                          color: currentTheme === 'dark' ? '#fff' : '#000',
                        }"
                      >
                        <!-- Avatar -->
                        <v-avatar size="80" class="mb-3">
                          <v-img v-if="tutor.avatar_url" :src="tutor.avatar_url" cover>
                            <template #error>
                              <v-icon size="60" color="grey-darken-1">mdi-account</v-icon>
                            </template>
                          </v-img>
                          <v-icon v-else size="60" color="grey-darken-1">mdi-account</v-icon>
                        </v-avatar>

                        <!-- Name & Expertise -->
                        <h3 class="text-subtitle-1 font-weight-bold mb-2">
                          {{ tutor?.firstname || 'First' }} {{ tutor?.lastname || 'Last' }}
                        </h3>

                        <!-- Action Links -->
                        <!-- View More -->
                        <v-btn
                          variant="text"
                          color="primary"
                          @click="viewTutor(tutor)"
                          style="text-transform: none"
                        >
                          View More
                        </v-btn>

                        <!-- Set Appointment / My Profile -->
                        <div style="min-height: 40px" class="d-flex align-center justify-center">
                          <v-btn
                            v-if="tutor?.id !== currentUserId"
                            variant="text"
                            color="primary"
                            @click="openAppointment(tutor)"
                            style="text-transform: none"
                          >
                            Set an Appointment
                          </v-btn>
                          <span v-else class="text-caption text-grey" style="line-height: 36px">
                            (My profile)
                          </span>
                        </div>

                        <!-- Rating -->
                        <div class="mt-3">
                          <v-icon color="amber" size="18">mdi-star</v-icon>
                          <span v-if="ratingsMap[tutor.id]">
                            <strong>{{ ratingsMap[tutor.id].average }}</strong>
                            <span class="text-caption text-grey ms-1">
                              ({{ ratingsMap[tutor.id].count }} review{{
                                ratingsMap[tutor.id].count > 1 ? 's' : ''
                              }})
                            </span>
                          </span>
                          <span v-else class="text-caption text-grey">Not rated yet</span>
                        </div>
                        <v-spacer></v-spacer>
                      </v-card>
                    </v-fade-transition>
                  </v-col>
                </v-row>

                <!-- Empty State -->
                <div v-else class="text-center mt-10">
                  <v-icon size="64" color="grey">mdi-account-search</v-icon>
                  <p class="mt-2 text-subtitle-2">No mentors available yet.</p>
                </div>
              </v-sheet>
            </v-col>
          </v-row>
        </v-container>
        <!--for the view more -->
        <v-dialog v-model="profileDialog" :max-width="getDialogWidth">
          <v-card>
            <!-- Title -->
            <v-card-title class="text-h6 font-weight-bold justify-center py-4">
              Mentors' Profile
            </v-card-title>

            <!-- Avatar and Name -->
            <v-card-text class="text-center pb-0">
              <v-avatar size="100" class="mb-4">
                <v-img :src="selectedTutor.avatar_url" cover>
                  <template #error>
                    <v-icon size="80" color="grey-darken-1">mdi-account</v-icon>
                  </template>
                </v-img>
              </v-avatar>

              <div class="text-h6 font-weight-bold mb-1">
                {{ selectedTutor.firstname }} {{ selectedTutor.lastname }}
              </div>
            </v-card-text>

            <v-divider class="my-2" />

            <!-- Details -->
            <v-card-text>
              <v-row dense>
                <!-- Display First Name and Last Name -->
                <v-col cols="12" sm="6">
                  <strong>Age:</strong><br />
                  <span>{{ selectedTutor.age }}</span>
                </v-col>

                <!-- Display School -->
                <v-col cols="12" sm="6">
                  <strong>School/University:</strong><br />
                  <span>{{ selectedTutor.school || 'N/A' }}</span>
                </v-col>

                <!-- Display Course -->
                <v-col cols="12" sm="6">
                  <strong>Course/Degree:</strong><br />
                  <span>{{ selectedTutor.course || 'N/A' }}</span>
                </v-col>

                <!-- Display Year -->
                <v-col cols="12" sm="6">
                  <strong>Year:</strong><br />
                  <span>{{ selectedTutor.year || 'N/A' }}</span>
                </v-col>

                <!-- Display Expertise -->
                <v-col cols="12" sm="6">
                  <strong>Expertise:</strong><br />
                  <span>{{ selectedTutor.expertise || 'N/A' }}</span>
                </v-col>

                <!-- Display About -->
                <v-col cols="12" sm="6">
                  <strong>About me:</strong><br />
                  <span>{{ selectedTutor.about || 'N/A' }}</span>
                </v-col>
              </v-row>
            </v-card-text>

            <!-- Actions -->
            <v-card-actions class="justify-center pb-4">
              <v-btn color="primary" @click="profileDialog = false">Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!--set appointment-->
        <v-dialog v-model="appointmentDialog" max-width="500px">
          <v-card>
            <v-card-title class="text-h6 text-center">Set Appointment</v-card-title>
            <v-card-text>
              <p v-if="selectedTutor">
                Booking with:
                <strong>{{ selectedTutor.first_name }} {{ selectedTutor.last_name }}</strong>
              </p>
              <v-text-field v-model="selectedDate" label="Date" type="date" dense />
              <v-text-field v-model="selectedTime" label="Time" type="time" dense />
              <v-textarea v-model="messageInput" label="Message" rows="3" dense />
            </v-card-text>
            <v-card-actions class="justify-center">
              <v-btn text @click="appointmentDialog = false">Cancel</v-btn>
              <v-btn color="primary" @click="saveAppointment">Book</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-main>
    </transition>
  </v-app>
</template>

<style scoped>

:root {
  --font-xs: clamp(0.75rem, 0.9vw, 0.875rem);
  --font-sm: clamp(0.875rem, 1vw, 1rem);
  --font-md: clamp(1rem, 1.5vw, 1.25rem);
  --font-lg: clamp(1.25rem, 2vw, 1.5rem);
}
.text-caption {
  font-size: var(--font-xs);
}
/* Layout Wrappers */
.floating-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
}
.wrapper {
  margin: 0;
}
.profile-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
  margin-top: 32px;
}

/* Mentor Card */
.mentor-card {
  border: 1px solid #ccc;
  border-radius: 12px;
  width: 100%;
  height: 100%;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1500px;
}

.mentor-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

/* Text Styles */
h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1565c0;
  text-align: center;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 2px;
}
.user-name {
  font-size: clamp(1rem, 1.5vw, 1.25rem);
  font-family: 'Roboto', sans-serif;
  letter-spacing: 1px;
}

.icon-mdi {
  font-size: clamp(0.8rem, 1.2vw, 1rem);
}
.link-text {
  color: rgb(90, 90, 220);
  font-family: 'Inter', 'Roboto', sans-serif;
  font-size: clamp(0.8rem, 1.2vw, 0.95rem);
  cursor: pointer;
}
.link-text:hover,
.link-text:active {
  color: rgb(12, 11, 11);
}
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
.drawer-hidden {
  display: none !important;
}

.transition-all {
  transition:
    margin-right 0.3s ease,
    transform 0.3s ease;
}
.no-transition {
  transition: none !important;
}
/* Components Enhancements */

.v-btn {
  transition: transform 0.3s ease;
}
.v-btn:hover {
  transform: scale(1.05);
}
.v-card {
  border-radius: 16px;
}
.v-dialog {
  transition: all 0.3s ease;
}
.v-dialog__content {
  padding: 24px;
}

/* App Layout & Transitions */
.v-container {
  padding: 16px;
}
.v-main {
  transition: margin-right 0.3s ease;
}
.transition-all {
  transition:
    margin-right 0.3s ease,
    transform 0.3s ease;
}
.shift-app-bar {
  margin-right: 72px;
}
.shift-mini {
  margin-right: 240px;
}
/*search */
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
  width: 300px;
  max-width: none;
  transition: width 0.3s ease;
}
.search-input ::v-deep(input::placeholder) {
  font-size: 14px;
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
/*animation or transition of search*/
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.fade-slide-enter-active {
  transition: all 0.4s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.fade-slide-move {
  transition: transform 0.3s ease;
}

/*for the search bar*/
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
.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
/*for large screen */
@media (min-width: 768px) {
  .mentor-card.single-card {
    width: 250px !important;
    min-height: 340px;
  }

  .d-flex.flex-wrap.justify-center {
    justify-content: start; /* optional, to align left like default Vuetify v-row behavior */
  }
}

/* Responsive Styles for mobile */
@media (max-width: 600px) {
  .v-card .v-btn {
    width: 100% !important;
    font-size: 13px !important;
    padding: 6px 12px !important;
    margin: 6px 0 !important;
    justify-content: center !important;
  }

  .v-card .text-caption {
    font-size: 12px !important;
    text-align: center;
  }

  .v-card .d-flex.align-center.justify-center {
    flex-direction: column !important;
    align-items: center !important;
  }
  .mentor-card .v-btn {
    width: 100%;
    font-size: 13px !important;
    padding: 6px 12px !important;
    margin: 4px 0 !important;
    justify-content: center;
  }

  .mentor-card .text-caption {
    text-align: center;
    font-size: 12px !important;
    display: block;
  }

  .v-dialog__content {
    padding: 12px !important;
  }
  .v-card-title,
  .v-card-text {
    font-size: clamp(0.9rem, 2.5vw, 1.1rem);
    text-align: center;
  }
  .v-card-text,
  .v-card-actions {
    padding: 12px !important;
    flex-direction: column;
    gap: 10px;
  }
  .v-text-field input,
  .v-textarea textarea {
    font-size: clamp(0.9rem, 2.5vw, 1rem);
  }
  .v-navigation-drawer {
    width: 100% !important;
  }
  .v-main {
    padding-top: 64px;
  }
  .search-input {
    width: 190px !important;
    max-width: 100% !important;
    min-width: 0 !important;
    flex: none !important;
  }
  .search-input ::v-deep(input::placeholder) {
  font-size: 11px;
}

  .search-wrapper {
    right: 12px;
    gap: 8px;
  }

  .logo {
    width: 40px;
    height: 40px;
  }

  h1 {
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 700;
  color: #1565c0;
  text-align: center;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 2px;
}


  /*mobile responsive search matching apppear*/
  .mentor-card {
    flex-direction: column !important;
    align-items: stretch !important;
    text-align: center;
  }
  .profile-container {
    justify-content: center;
    padding: 0 16px;
    width: 100%;
  }

  .d-flex.flex-wrap.justify-center {
    width: 100%;
  }
}
@media (max-width: 500px) {
  .v-text-field,
  .v-textarea {
    width: 100% !important;
  }
}
@media (min-width: 601px) and (max-width: 960px) {
  .mentor-card .v-btn {
    font-size: 14px;
    padding: 8px 12px;
  }
}
</style>
