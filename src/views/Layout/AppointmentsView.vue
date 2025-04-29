<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTheme } from 'vuetify'
import { supabase } from '@/utils/supabase'

// THEME
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

// USER & APPOINTMENTS
const currentUserId = ref(null)
const appointments = ref([])

const searchQuery = ref('')
const selectedSort = ref('Date')
const notificationMenu = ref(false)
const notifications = ref([{ id: 1, title: 'No new notifications', time: '' }])
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

const selectedAppointment = ref(null)
const selectedStudentProfile = ref(null)
const detailsDialog = ref(false)

const fetchCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    console.error('Error fetching user:', error)
    return
  }
  currentUserId.value = user.id
}

const fetchAppointments = async () => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('student_id', currentUserId.value)
    .eq('status', 'accepted')
    .order('appointment_date', { ascending: true })

  appointments.value = data || []
}

const filteredAppointments = computed(() => {
  let filtered = [...appointments.value]

  if (searchQuery.value.trim()) {
    const term = searchQuery.value.toLowerCase()
    filtered = filtered.filter(a =>
      a.student_name?.toLowerCase().includes(term) ||
      a.message?.toLowerCase().includes(term)
    )
  }

  if (selectedSort.value === 'A-Z') {
    filtered.sort((a, b) => a.student_name.localeCompare(b.student_name))
  } else if (selectedSort.value === 'Date') {
    filtered.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
  }

  return filtered
})

const cancelAppointment = async (id) => {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) {
    snackbarMsg.value = 'Failed to cancel appointment.'
    snackbarColor.value = 'error'
  } else {
    snackbarMsg.value = 'Appointment cancelled.'
    snackbarColor.value = 'success'
    await fetchAppointments()
  }
  snackbar.value = true
}

const openAppointmentDetails = async (appointment) => {
  selectedAppointment.value = appointment

  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, phone, about, school, degree, year, expertise, avatar_url')
    .eq('id', appointment.student_id)
    .single()

  if (error) {
    console.error('Error fetching student profile:', error)
  } else {
    selectedStudentProfile.value = data
  }
  detailsDialog.value = true
}

onMounted(async () => {
  theme.global.name.value = currentTheme.value
  await fetchCurrentUser()
  await fetchAppointments()
})
</script>

<template>
  <v-app id="inspire">
    <!-- App Bar -->
    <v-app-bar :color="currentTheme === 'light' ? '#1565c0' : 'grey-darken-4'" flat>
      <v-container class="d-flex align-center justify-space-between">
        <v-avatar color="#fff" size="50">
          <v-img src="/image/Teach&Learn.png" alt="Logo" />
        </v-avatar>

        <v-spacer />

        <div class="d-none d-md-flex align-center" style="gap: 24px">
          <RouterLink to="/home" class="active-click text-white">Home</RouterLink>
          <RouterLink to="/about" class="active-click text-white">About Us</RouterLink>
          <RouterLink to="/contact" class="active-click text-white">Contact Us</RouterLink>
        </div>

        <v-spacer />

        <div class="d-flex align-center gap-2">
          <v-menu v-model="notificationMenu" offset-y>
            <template #activator="{ props }">
              <v-btn icon v-bind="props">
                <v-icon>mdi-bell</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item v-for="notification in notifications" :key="notification.id">
                <v-list-item-title>{{ notification.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-menu transition="scale-transition" offset-y>
            <template #activator="{ props }">
              <v-app-bar-nav-icon v-bind="props" class="d-md-none" />
            </template>
            <v-list>
              <v-list-item link><RouterLink to="/home" class="active-click">Home</RouterLink></v-list-item>
              <v-list-item link><RouterLink to="/profile" class="active-click">Profile</RouterLink></v-list-item>
              <v-list-item link><RouterLink to="/appointments" class="active-click">Appointments</RouterLink></v-list-item>
              <v-divider />
              <v-list-item link><RouterLink to="/" class="active-click">Logout</RouterLink></v-list-item>
            </v-list>
          </v-menu>
        </div>
      </v-container>
    </v-app-bar>

    <!-- Main Content -->
    <v-main :class="currentTheme === 'dark' ? 'bg-grey-darken-4 text-white' : 'bg-grey-lighten-3'">
      <v-container>
        <h1 class="text-center my-6">My Appointments</h1>

        <!-- Search and Sort -->
        <v-row class="mb-4">
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="searchQuery"
              placeholder="Search..."
              variant="solo-filled"
              hide-details
              append-inner-icon="mdi-magnify"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="selectedSort"
              :items="['A-Z', 'Date']"
              label="Sort by"
              variant="solo-filled"
              hide-details
            />
          </v-col>
        </v-row>

        <!-- Appointment Cards -->
        <v-row>
          <v-col cols="12" md="4" v-for="appointment in filteredAppointments" :key="appointment.id">
            <v-card>
              <v-card-title>{{ appointment.student_name }}</v-card-title>
              <v-card-subtitle>
                {{ appointment.appointment_date }} @ {{ appointment.appointment_time }}
              </v-card-subtitle>
              <v-card-text>
                {{ appointment.message || 'No message' }}
              </v-card-text>
              <v-card-actions>
                <v-btn text color="primary" @click="openAppointmentDetails(appointment)">Details</v-btn>
                <v-btn text color="error" @click="cancelAppointment(appointment.id)">Cancel</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- No Appointments -->
        <v-alert v-if="filteredAppointments.length === 0" type="info" class="mt-10">
          No accepted appointments found.
        </v-alert>

        <!-- Details Dialog -->
        <v-dialog v-model="detailsDialog" max-width="600">
          <v-card>
            <v-card-title>Appointment Details</v-card-title>
            <v-card-text>
              <div v-if="selectedStudentProfile">
                <p><strong>Name:</strong> {{ selectedStudentProfile.first_name }} {{ selectedStudentProfile.last_name }}</p>
                <p><strong>Email:</strong> {{ selectedStudentProfile.email }}</p>
                <p><strong>Phone:</strong> {{ selectedStudentProfile.phone || 'N/A' }}</p>
                <p><strong>School:</strong> {{ selectedStudentProfile.school || 'N/A' }}</p>
                <p><strong>Degree:</strong> {{ selectedStudentProfile.degree || 'N/A' }}</p>
                <p><strong>Year:</strong> {{ selectedStudentProfile.year || 'N/A' }}</p>
                <p><strong>Expertise:</strong> {{ selectedStudentProfile.expertise || 'N/A' }}</p>
              </div>
              <div v-else>
                <v-progress-circular indeterminate color="primary" />
                Loading...
              </div>
            </v-card-text>
            <v-card-actions>
              <v-btn color="primary" @click="detailsDialog = false">Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Snackbar -->
        <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
          {{ snackbarMsg }}
        </v-snackbar>

      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.active-click {
  font-weight: bold;
  text-decoration: none;
  transition: color 0.3s;
}
.active-click:hover {
  color: #ff9800;
}
.text-white {
  color: white !important;
}
.bg-grey-darken-4 {
  background-color: #212121 !important;
}
.bg-grey-lighten-3 {
  background-color: #f5f5f5 !important;
}
</style>