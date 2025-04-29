<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useTheme } from 'vuetify'
import { supabase } from '@/utils/supabase'

// THEME SETUP
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

// SEARCH + SORT
const searchQuery = ref('')
const selectedSort = ref('')

// SNACKBAR
const snackbar = ref(false)
const snackbarMsg = ref('')

// NOTIFICATIONS
const notificationMenu = ref(false)
const notifications = ref([{ id: 1, title: 'No new notifications', time: '' }])

const toggleMenu = () => {
  notificationMenu.value = !notificationMenu.value
}

// USER + APPOINTMENTS
const currentUserId = ref(null)
const appointments = ref([])

// Fetch Student Appointments
const fetchStudentAppointments = async () => {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      `
      id,
      appointment_date,
      appointment_time,
      message,
      status,
      mentor:mentor_id(id, first_name, last_name),
      student:student_id(id, first_name, last_name)
    `,
    )
    .eq('student_id', currentUserId.value)
    .order('appointment_date', { ascending: true })

  if (error) {
    console.error('Error fetching student appointments:', error)
    return []
  }
  return data || []
}

// Fetch Mentor Appointments
const fetchMentorAppointments = async () => {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      `
      id,
      appointment_date,
      appointment_time,
      message,
      status,
      mentor:mentor_id(id, first_name, last_name),
      student:student_id(id, first_name, last_name)
    `,
    )
    .eq('mentor_id', currentUserId.value)
    .order('appointment_date', { ascending: true })

  if (error) {
    console.error('Error fetching mentor appointments:', error)
    return []
  }
  return data || []
}

// Fetch Both (Student and Mentor) Appointments
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

// Computed: Sorted and Filtered Appointments
const filteredAppointments = computed(() => {
  let temp = [...appointments.value]

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    temp = temp.filter((appointment) => {
      const studentName =
        `${appointment.student?.first_name || ''} ${appointment.student?.last_name || ''}`.toLowerCase()
      const mentorName =
        `${appointment.mentor?.first_name || ''} ${appointment.mentor?.last_name || ''}`.toLowerCase()
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

// Perform Search
const performSearch = () => {
  if (searchQuery.value.trim()) {
    snackbarMsg.value = `You searched for: "${searchQuery.value}"`
    snackbar.value = true
  }
}

// LIFECYCLE: Mounted
onMounted(() => {
  fetchAppointments()
})

//clickable view more button
// Add these states
const selectedAppointment = ref(null)
const selectedStudentProfile = ref(null)
const detailsDialog = ref(false)

// When you click "View Details"
const openAppointmentDetails = async (appointment) => {
  selectedAppointment.value = appointment
  selectedStudentProfile.value = null // reset first

  // Fetch student profile from Supabase
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'first_name, last_name, email, phone, about, school, degree, year, expertise, avatar_url',
    )
    .eq('id', appointment.student?.id)
    .single()

  if (error) {
    console.error('Error fetching student profile:', error)
  } else {
    selectedStudentProfile.value = data
  }

  detailsDialog.value = true
}
</script>

<template>
  <v-app id="inspire">
    <!-- APP BAR -->
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

        <v-spacer />

        <!-- Desktop Links -->
        <div class="d-none d-md-flex align-center me-5" style="gap: 24px">
          <RouterLink
            to="/home"
            class="active-click text-white text-decoration-none font-weight-medium"
            >Home</RouterLink
          >
          <RouterLink
            to="/about"
            class="active-click text-white text-decoration-none font-weight-medium"
            >About Us</RouterLink
          >
          <RouterLink
            to="/contact"
            class="active-click text-white text-decoration-none font-weight-medium"
            >Contact Us</RouterLink
          >
        </div>

        <v-spacer />

        <!-- Bell + Mobile Menu -->
        <div class="d-flex align-center gap-2">
          <!-- Notification Bell -->
          <v-menu
            v-model="notificationMenu"
            offset-y
            close-on-content-click
            transition="scale-transition"
          >
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

          <!-- Mobile Hamburger Menu -->
          <v-menu transition="scale-transition" offset-y>
            <template #activator="{ props }">
              <v-app-bar-nav-icon v-bind="props" class="d-md-none" />
            </template>
            <v-list>
              <v-list-item link
                ><RouterLink
                  to="/home"
                  :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']"
                  >Home</RouterLink
                ></v-list-item
              >
              <v-list-item link
                ><RouterLink
                  to="/profile"
                  :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']"
                  >My Profile</RouterLink
                ></v-list-item
              >
              <v-list-item link
                ><RouterLink
                  to="/appointments"
                  :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']"
                  >My Appointment</RouterLink
                ></v-list-item
              >
              <v-list-item link
                ><RouterLink
                  to="/about"
                  :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']"
                  >About Us</RouterLink
                ></v-list-item
              >
              <v-list-item link
                ><RouterLink
                  to="/contact"
                  :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']"
                  >Contact Us</RouterLink
                ></v-list-item
              >
              <v-divider></v-divider>
              <v-list-item link
                ><RouterLink to="/" :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']"
                  >Logout</RouterLink
                ></v-list-item
              >
            </v-list>
          </v-menu>
        </div>
      </v-container>
    </v-app-bar>

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
              <h1 class="text-h6 text-sm-h5 font-weight-bold mb-3">Deleted appointments</h1>

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
  Delete Permanently
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
