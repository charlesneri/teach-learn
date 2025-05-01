<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

/*  THEME  */
const theme = useTheme()
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

/*  ROUTER & UI  */
const router = useRouter()
const drawer = ref(false)
const mini = ref(false)
const isMobile = ref(false)
const showSearch = ref(false)

const toggleDrawer = () => (drawer.value = !drawer.value)
const toggleSearch = () => {
  if (showSearch.value) searchQuery.value = ''
  showSearch.value = !showSearch.value
}
const closeSearch = () => {
  showSearch.value = false
  searchQuery.value = ''
}
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

/*  SNACKBAR & NOTIFICATIONS  */
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('')
const notificationMenu = ref(false)
const notifications = ref([{ id: 1, title: 'No new notifications', time: '' }])
const toggleMenu = () => (notificationMenu.value = !notificationMenu.value)

/*  USER  */
const profileImage = ref('')
const currentUserId = ref(null)
const currentUserProfile = ref({
  firstName: '',
  lastName: '',
  avatarUrl: '',
  isPublicTutor: false,
})

watch(profileImage, (newVal) => {
  if (newVal) localStorage.setItem('profileImage', newVal)
})

/*  LOGOUT  */
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

/*  APPOINTMENTS  */
const searchQuery = ref('')
const selectedSort = ref('')
const appointments = ref([])

const fetchStudentAppointments = async () => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`id, appointment_date, appointment_time, message, status,
             mentor:mentor_id(id, first_name, last_name),
             student:student_id(id, first_name, last_name)`)
    .eq('student_id', currentUserId.value)
    .order('appointment_date', { ascending: true })

  if (error) {
    console.error('Error fetching student appointments:', error)
    return []
  }

  return data || []
}

const fetchMentorAppointments = async () => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`id, appointment_date, appointment_time, message, status,
             mentor:mentor_id(id, first_name, last_name),
             student:student_id(id, first_name, last_name)`)
    .eq('mentor_id', currentUserId.value)
    .order('appointment_date', { ascending: true })

  if (error) {
    console.error('Error fetching mentor appointments:', error)
    return []
  }

  return data || []
}

const fetchAppointments = async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    console.error('Error fetching user:', userError)
    return
  }

  currentUserId.value = userData.user.id

  const [studentAppointments, mentorAppointments] = await Promise.all([
    fetchStudentAppointments(),
    fetchMentorAppointments(),
  ])

  appointments.value = [...studentAppointments, ...mentorAppointments]
}

const filteredAppointments = computed(() => {
  let temp = [...appointments.value]

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    temp = temp.filter((appointment) => {
      const studentName = `${appointment.student?.first_name || ''} ${appointment.student?.last_name || ''}`.toLowerCase()
      const mentorName = `${appointment.mentor?.first_name || ''} ${appointment.mentor?.last_name || ''}`.toLowerCase()
      return studentName.includes(query) || mentorName.includes(query)
    })
  }

  if (selectedSort.value === 'A-Z') {
    temp.sort((a, b) => {
      const nameA = `${a.student?.first_name || ''} ${a.student?.last_name || ''}`.toLowerCase()
      const nameB = `${b.student?.first_name || ''} ${b.student?.last_name || ''}`.toLowerCase()
      return nameA.localeCompare(nameB)
    })
  } else if (selectedSort.value === 'Date') {
    temp.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
  }

  return temp
})

const performSearch = () => {
  if (searchQuery.value.trim()) {
    snackbarMsg.value = `You searched for: "${searchQuery.value}"`
    snackbarColor.value = 'info'
    snackbar.value = true
  }
}

/*  APPOINTMENT DETAILS  */
const selectedAppointment = ref(null)
const selectedStudentProfile = ref(null)
const detailsDialog = ref(false)

const openAppointmentDetails = async (appointment) => {
  selectedAppointment.value = appointment
  selectedStudentProfile.value = null

  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, phone, about, school, degree, year, expertise, avatar_url')
    .eq('id', appointment.student?.id)
    .single()

  if (error) {
    console.error('Error fetching student profile:', error)
  } else {
    selectedStudentProfile.value = data
  }

  detailsDialog.value = true
}

/*  LIFECYCLE  */
onMounted(() => {
  fetchAppointments()
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

    <!-- MAIN CONTENT -->
    <v-main :class="currentTheme === 'dark' ? 'bg-grey-darken-4 text-white' : 'bg-grey-lighten-3'">
      <v-container fluid class="py-2 px-2">
        <v-row justify="center">
          <v-col cols="12" sm="11" md="8">
            <v-sheet
              :class="
                currentTheme === 'dark'
                  ? 'bg-grey-darken-4 text-white'
                  : 'bg-white text-grey-darken-4'
              "
              class="pa-3 pa-sm-4 text-center"
              elevation="1"
              rounded="lg"
              style="max-width: 1200px; min-height: 90vh"
            >
              <!-- Title -->
              <h1 class="text-h6 text-sm-h5 font-weight-bold mb-3">Appointments</h1>

              <!-- Search & Sort -->
              <v-row class="mb-3" dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="searchQuery"
                    placeholder="Search"
                    variant="solo-filled"
                    density="comfortable"
                    rounded="lg"
                    flat
                    hide-details
                    single-line
                    append-inner-icon="mdi-magnify"
                    @keydown.enter="performSearch"
                    @click:append-inner="performSearch"
                    class="elevation-0"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="selectedSort"
                    :items="['A-Z', 'Date']"
                    label="Sort"
                    variant="solo-filled"
                    density="comfortable"
                    rounded="lg"
                    flat
                    hide-details
                    class="elevation-0"
                  />
                </v-col>
              </v-row>

              <!-- Appointment Results -->
              <div v-if="filteredAppointments.length > 0" class="appointments-container">
                <v-list class="appointments-list">
                  <v-list-item
                    v-for="appointment in filteredAppointments"
                    :key="appointment.id"
                    class="appointment-item"
                    :class="
                      currentTheme === 'dark'
                        ? 'bg-grey-darken-3 text-white'
                        : 'bg-white text-black'
                    "
                  >
                    <v-list-item-title class="appointment-title">
                      Appointment between
                      <br />
                      <strong
                        >{{ appointment.student?.first_name }}
                        {{ appointment.student?.last_name }}</strong
                      >
                      <br />
                      and
                      <br />
                      <strong
                        >{{ appointment.mentor?.first_name }}
                        {{ appointment.mentor?.last_name }}</strong
                      >
                    </v-list-item-title>

                    <v-list-item-subtitle class="appointment-subtitle">
                      Date: {{ appointment.appointment_date }} at {{ appointment.appointment_time }}
                      <br />
                      Status: {{ appointment.status }}
                    </v-list-item-subtitle>

                    <!-- View Details -->
                    <div >
                      <span
  @click="openAppointmentDetails(appointment)"
  class="text-center text-decoration-none text-primary cursor-pointer"
>
  View Details
</span>
   <v-spacer></v-spacer>
<span
  @click="openAppointmentDetails(appointment)"
  class="text-center text-decoration-none text-primary cursor-pointer"
>
  Delete Appointment
</span>
                    </div>
                
                 
                  </v-list-item>
                </v-list>
                <v-dialog v-model="detailsDialog" max-width="600px" transition="scale-transition">
                  <v-card
                    :class="
                      currentTheme === 'dark'
                        ? 'bg-grey-darken-3 text-white'
                        : 'bg-white text-black'
                    "
                  >
                    <v-card-title class="text-h6 font-weight-bold text-center">
                      Appointment & Student Details
                    </v-card-title>

                    <v-card-text class="text-start">
                    


                      <div v-if="selectedStudentProfile">
                        <h3 class="font-weight-bold mb-2 text-center mt-5 mb-10">Student Profile</h3>

                        <!-- Avatar -->
                        <div class="text-center mb-4">
                          <v-avatar size="100">
                            <v-img
                              v-if="selectedStudentProfile.avatar_url"
                              :src="selectedStudentProfile.avatar_url"
                              cover
                            >
                              <template #error>
                                <v-icon size="80" color="grey-darken-1">mdi-account</v-icon>
                              </template>
                            </v-img>
                            <v-icon v-else size="80" color="grey-darken-1">mdi-account</v-icon>
                          </v-avatar>
                        </div>

                        <!-- Profile Info -->
                        <p class="text-center">
                          <strong >Name:</strong><br> {{ selectedStudentProfile.first_name }}
                          {{ selectedStudentProfile.last_name }}
                        </p class="text-center">
                        <p class="text-center"><strong >Email:</strong><br> {{ selectedStudentProfile.email }}</p>
                        <p class="text-center">
                          <strong>Phone:</strong><br>
                          {{ selectedStudentProfile.phone || 'No phone number' }}
                        </p>
                        <p class="text-center">
                          <strong>Expertise:</strong><br>
                          {{ selectedStudentProfile.expertise || 'Not specified' }}
                        </p>
                        <p class="text-center">
                          <strong>School:</strong><br>
                          {{ selectedStudentProfile.school || 'No school listed' }}
                        </p>
                        <p class="text-center">
                          <strong class="text-center">Degree:</strong><br>
                          {{ selectedStudentProfile.degree || 'No degree listed' }}
                        </p>
                        <p class="text-center">
                          <strong class="text-center">Year:</strong><br>
                          {{ selectedStudentProfile.year || 'No year listed' }}
                        </p>
                        <p class="text-center">
                          <strong class="text-center">About:</strong><br>
                          {{ selectedStudentProfile.about || 'No about info' }}
                        </p>
                      </div>

                      <div v-else class="text-center">
                        <v-progress-circular indeterminate color="primary"></v-progress-circular>
                        <p>Loading student profile...</p>
                      </div>
                      <v-divider class="my-10 wakana"></v-divider>

                      <div v-if="selectedAppointment">
                        <h3 class="font-weight-bold text-center mt-5 mb-10">Appointment Information</h3>
                        <p class="text-center"><strong>Date:</strong> <br>{{ selectedAppointment.appointment_date }}</p>
                        <p class="text-center"><strong>Time:</strong> <br>{{ selectedAppointment.appointment_time }}</p>
                        <p class="text-center"><strong>Status:</strong><br> {{ selectedAppointment.status }}</p>
                        <p class="text-center">
                          <strong>Message:</strong><br>
                          {{ selectedAppointment.message || 'No message provided' }}
                        </p>
                      </div>
                    </v-card-text>

                    
                    <v-card-actions class="justify-center">
                      <v-btn color="primary" @click="detailsDialog = false">Close</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
                <v-divider></v-divider>
              </div>

              <div v-else class="no-appointments">
                <p>No appointments found.</p>
              </div>

              <!-- If No Appointments -->
              <v-alert v-else type="info" variant="tonal" border="start" density="compact">
                No appointments found. Try searching or adjusting the sort option.
              </v-alert>
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
/* Links */
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

/* Appointments Container */
.appointments-container {
  width: 100%;
  max-width: 960px;
  margin: auto;
  padding: 24px;
}

.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Appointment Item */
.appointment-item {
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 28px;
  min-height: 200px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s,
    box-shadow 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.appointment-item:hover {
  transform: translateY(-8px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.appointment-title {
  font-size: 1.4rem;
  font-weight: 800;
  margin-bottom: 12px;
  color: #1565c0;
  text-align: center;
  word-break: break-word;
  line-height: 1.5;
}

.appointment-subtitle {
  font-size: 1rem;
  color: #d3d0d0;
  line-height: 1.6;
  text-align: center;
  word-break: break-word;
}

/* Dialog & Details Styling */
.v-dialog .v-card {
  border-radius: 16px;
}

.v-card-title {
  font-size: 1.6rem;
  font-weight: bold;
  text-align: center;
}

.v-card-text p {
  margin: 6px 0;
  font-size: 1rem;
}

/* Profile Avatar */
.v-avatar {
  margin: auto;
}

/* Fade Slide Up Animation for Dialog */
.fade-slide-up-enter-active,
.fade-slide-up-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.fade-slide-up-enter-from,
.fade-slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Responsive for Mobile */
@media (max-width: 600px) {
  .appointments-container {
    padding: 16px;
  }

  .appointment-item {
    padding: 20px;
    min-height: 160px;
  }
  .appointment-title {
    font-size: 1.1rem;
    line-height: 1.4;
  }

  .appointment-subtitle {
    font-size: 0.95rem;
  }
  .v-dialog {
    max-width: 90%;
    margin: 0 auto;
  }

  .v-card-title {
    font-size: 1.4rem;
  }

  .v-card-text p {
    font-size: 0.95rem;
  }

  .v-avatar {
    width: 80px;
    height: 80px;
  }

  /* Text inside appointment readable on small screens */
  .appointment-item {
    word-break: break-word;
    text-align: center;
  }
}
</style>
