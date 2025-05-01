<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter, RouterLink } from 'vue-router'
import { supabase } from '@/utils/supabase'

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
  } = await supabase.auth.getUser()
  if (user) {
    currentUserId.value = user.id
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, is_public_tutor')
      .eq('id', user.id)
      .single()
    if (data) {
      currentUserProfile.value = {
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        avatarUrl: data.avatar_url || '',
        isPublicTutor: data.is_public_tutor || false,
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

// === Tutor Actions ===
const fetchTutors = async () => {
  const { data } = await supabase.from('profiles').select('*').eq('is_public_tutor', true)
  tutors.value = data || []
}

const viewTutor = (tutor) => {
  selectedTutor.value = tutor
  profileDialog.value = true
}

const openAppointment = (tutor) => {
  selectedTutor.value = tutor
  appointmentDialog.value = true
}

const saveAppointment = async () => {
  if (!selectedDate.value || !selectedTime.value || !selectedTutor.value || !currentUserId.value) {
    snackbarMsg.value = 'Please complete all fields before booking.'
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
    status: 'Pending',
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

const filteredTutors = computed(() => {
  if (!searchQuery.value.trim()) return tutors.value

  const keyword = searchQuery.value.trim().toLowerCase()
  return tutors.value.filter((tutor) => {
    const fullName =
      `${tutor.first_name || ''} ${tutor.middle_initial || ''} ${tutor.last_name || ''}`.toLowerCase()
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
          <!-- Search Input -->
          <v-text-field
            v-if="showSearch"
            v-model="searchQuery"
            placeholder="Search..."
            density="compact"
            hide-details
            flat
            clearable
            class="search-input large-icon"
            append-inner-icon="mdi-magnify"
            @blur="closeSearch"
            autofocus
          />
          <!-- Toggle Button -->
          <v-btn icon @click="toggleSearch">
            <v-icon>{{ showSearch ? 'mdi-close' : 'mdi-magnify' }}</v-icon>
          </v-btn>
          <v-avatar color="#fff" size="50" class="logo me-6">
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
          backgroundColor: currentTheme === 'dark' ? '#424242' : '#fefcf9',
          color: currentTheme === 'dark' ? '#ffffff' : '#000000',
        }"
      >
        <v-container fluid class="pa-0" style="max-width: 100%; margin: auto">
          <v-row justify="center">
            <!-- Main Area -->
            <v-col cols="12" md="10">
              <div class="floating-wrapper">
                <v-sheet
                  max-width="1500"
                  width="100%"
                  rounded="lg"
                  class="pa-6"
                  :style="{
                    backgroundColor: currentTheme === 'dark' ? '#424242' : '#fefcf9',
                    color: currentTheme === 'dark' ? '#ffffff' : '#000000',
                  }"
                >
                  <h1 class="head">Mentors</h1>
                  <v-divider class="divider" :thickness="3"></v-divider>

                  <!-- Profile Container -->
                  <div class="profile-container">
                    <div
                      v-if="tutors.length"
                      class="profile-container"
                      style="flex-wrap: wrap; gap: 24px"
                    >
                      <v-row
                        :justify="filteredTutors.length < 3 ? 'center' : 'start'"
                        align="stretch"
                        class="gx-4 gy-4"
                      >
                        <v-col
                          v-for="tutor in filteredTutors"
                          :key="tutor.id"
                          cols="12"
                          sm="6"
                          md="3"
                          lg="3"
                        >
                          <v-fade-transition>
                            <div
                              class="mentor-card fade-in pa-4 d-flex flex-column align-center"
                              :style="{
                                minWidth: '260px',
                                maxWidth: '100%',
                                width: '100%',
                                backgroundColor: currentTheme === 'dark' ? '#424242' : '#fff',
                                color: currentTheme === 'dark' ? '#fff' : '#000',
                              }"
                            >
                              <!-- Avatar -->
                              <v-avatar size="100" class="mb-3">
                                <v-img v-if="tutor?.avatar_url" :src="tutor.avatar_url" cover>
                                  <template #error>
                                    <v-icon size="60" color="grey-darken-1">mdi-account</v-icon>
                                  </template>
                                </v-img>
                                <v-icon v-else size="60" color="grey-darken-1">mdi-account</v-icon>
                              </v-avatar>

                              <!-- Name -->
                              <h3 class="user-name font-weight-medium mb-2">
                                <b>
                                  {{ tutor?.first_name || 'First' }}
                                  {{ tutor?.middle_initial || '' }}
                                  {{ tutor?.last_name || 'Last' }}
                                </b>
                              </h3>

                              <!-- Expertise -->
                              <p class="text-caption mb-3">
                                {{ tutor?.expertise || 'No expertise listed' }}
                              </p>

                              <!-- View More -->
                              <span @click="viewTutor(tutor)" class="link-text cursor-pointer mb-2">
                                View More
                              </span>

                              <!-- Set Appointment -->
                              <span
                                v-if="tutor?.id !== currentUserId"
                                @click="openAppointment(tutor)"
                                class="link-text cursor-pointer"
                              >
                                Set an Appointment
                              </span>
                              <span v-else class="text-grey text-caption"> (My profile) </span>
                            </div>
                          </v-fade-transition>
                        </v-col>
                      </v-row>
                    </div>

                    <div v-else class="text-center mt-6">
                      <v-icon size="60">mdi-account-search</v-icon>
                      <p>No mentors available yet.</p>
                    </div>

                    <v-container>
                      <!-- View More (Profile Details) Dialog -->
                      <v-dialog
                        v-model="profileDialog"
                        max-width="500px"
                        transition="scale-transition"
                      >
                        <v-card
                          :class="
                            currentTheme === 'dark'
                              ? 'bg-grey-darken-3 text-white'
                              : 'bg-white text-black'
                          "
                        >
                          <v-card-text class="text-center py-6 px-4">
                            <h2 class="font-weight-bold mb-4">
                              {{ selectedTutor?.first_name }} {{ selectedTutor?.middle_initial }}
                              {{ selectedTutor?.last_name }}
                            </h2>

                            <v-avatar size="120" class="mb-4 mx-auto">
                              <v-img
                                v-if="selectedTutor?.avatar_url"
                                :src="selectedTutor?.avatar_url"
                                cover
                              >
                                <template #error>
                                  <v-icon size="80" color="grey-darken-1">mdi-account</v-icon>
                                </template>
                              </v-img>
                              <v-icon v-else size="80" color="grey-darken-1">mdi-account</v-icon>
                            </v-avatar>

                            <div class="text-start" style="margin: 0 auto; max-width: 300px">
                              <p>
                                <strong>Expertise:</strong>
                                {{ selectedTutor?.expertise || 'No expertise listed' }}
                              </p>
                              <p>
                                <strong>Email:</strong>
                                {{ selectedTutor?.email || 'No email provided' }}
                              </p>
                              <p>
                                <strong>Phone:</strong>
                                {{ selectedTutor?.phone || 'No phone number' }}
                              </p>
                              <p>
                                <strong>About:</strong>
                                {{ selectedTutor?.about || 'No description' }}
                              </p>
                              <p>
                                <strong>School:</strong>
                                {{ selectedTutor?.school || 'No school listed' }}
                              </p>
                              <p>
                                <strong>Degree:</strong>
                                {{ selectedTutor?.degree || 'No degree listed' }}
                              </p>
                              <p>
                                <strong>Year:</strong>
                                {{ selectedTutor?.year || 'No year provided' }}
                              </p>
                            </div>
                          </v-card-text>

                          <v-card-actions class="justify-center pb-4">
                            <v-btn
                              color="primary"
                              @click="profileDialog = false"
                              class="font-weight-bold"
                              >CLOSE</v-btn
                            >
                          </v-card-actions>
                        </v-card>
                      </v-dialog>

                      <!-- Appointment Dialog -->
                      <v-dialog
                        v-model="appointmentDialog"
                        max-width="500px"
                        transition="scale-transition"
                      >
                        <v-card
                          :class="
                            currentTheme === 'dark'
                              ? 'bg-grey-darken-3 text-white'
                              : 'bg-white text-black'
                          "
                        >
                          <v-card-text class="text-center py-6 px-4">
                            <h2 class="font-weight-bold mb-4">
                              Appointment with {{ selectedTutor?.first_name || 'Mentor' }}
                            </h2>

                            <div class="d-flex flex-column align-center" style="gap: 20px">
                              <!-- Date Picker -->

                              <v-date-picker
                                v-model="selectedDate"
                                v-model:dialog="datePickerOpen"
                                color="primary"
                                class="mx-auto"
                                style="max-width: 300px"
                              />

                              <!-- Time Picker -->
                              <v-time-picker
                                v-if="selectedDate"
                                v-model="selectedTime"
                                v-model:dialog="timePickerOpen"
                                format="12hr"
                                color="primary"
                                class="mx-auto"
                                style="max-width: 300px"
                                :disabled="!selectedDate"
                              />

                              <!-- Message Input -->
                              <v-textarea
                                v-if="selectedDate"
                                v-model="messageInput"
                                label="Your Message"
                                placeholder="Type your message here..."
                                rows="3"
                                density="compact"
                                hide-details
                                style="max-width: 300px"
                              ></v-textarea>
                            </div>
                          </v-card-text>

                          <v-card-actions class="justify-center pb-4">
                            <v-btn
                              color="grey"
                              variant="outlined"
                              @click="appointmentDialog = false"
                              class="font-weight-bold"
                            >
                              CANCEL
                            </v-btn>
                            <v-btn
                              color="primary"
                              @click="saveAppointment"
                              class="font-weight-bold"
                            >
                              SAVE
                            </v-btn>
                          </v-card-actions>
                        </v-card>
                      </v-dialog>
                    </v-container>
                  </div>
                </v-sheet>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </transition>
  </v-app>
</template>
<style scoped>
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
h1.head {
  font-family: 'Ubuntu', sans-serif;
  font-size: 2.4rem;
  font-weight: 800;
  color: #1565c0;
  text-align: center;
  margin-bottom: 24px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.user-name {
  font-family: 'Roboto', sans-serif;
  letter-spacing: 1px;
  font-size: 20px;
}
.icon-mdi {
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
}
.link-text {
  color: rgb(90, 90, 220);
  font-family: 'Inter', 'Roboto', sans-serif;
  font-size: 13px;
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
.v-text-field {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
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

  h1.head {
    font-size: 1.8rem;
    letter-spacing: 0.2rem;
  }

  /*mobile responsive search matching apppear*/
  .mentor-card {
    width: 100% !important;
    max-width: 100% !important;
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
</style>
