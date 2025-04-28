<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useTheme } from 'vuetify'
import { supabase } from '@/utils/supabase'

// THEME
const theme = useTheme()
const currentTheme = ref(localStorage.getItem('theme') || 'light')

watch(currentTheme, (val) => {
  theme.global.name.value = val
  localStorage.setItem('theme', val)
})

const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  theme.global.name.value = currentTheme.value
  localStorage.setItem('theme', currentTheme.value)
}

// STATES
const currentUserId = ref(null)
const appointments = ref([])

const searchQuery = ref('')
const selectedSort = ref('Date') // Default sort

// Fetch current user
const fetchCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    currentUserId.value = user.id
  }
}

// Fetch accepted appointments where user is the student
const fetchAppointments = async () => {
  if (!currentUserId.value) return

  const { data } = await supabase
    .from('appointments')
    .select('*')
    .eq('student_id', currentUserId.value)
    .eq('status', 'accepted')
    .order('appointment_date', { ascending: true })

  appointments.value = data || []
}

// COMPUTED: Filtered and Sorted Appointments
const filteredAppointments = computed(() => {
  let filtered = [...appointments.value]

  if (searchQuery.value.trim()) {
    const term = searchQuery.value.toLowerCase()
    filtered = filtered.filter((a) =>
      a.student_name.toLowerCase().includes(term) ||
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

// Cancel appointment
const cancelAppointment = async (appointmentId) => {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId)

    if (error) throw error

    await fetchAppointments()
  } catch (error) {
    console.error('Error cancelling appointment:', error)
  }
}

// MOUNT
onMounted(async () => {
  theme.global.name.value = currentTheme.value
  await fetchCurrentUser()
  await fetchAppointments()
})
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
  <div class="d-flex align-center gap-2 ">
    
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
          <RouterLink to="/home" :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']">Home</RouterLink>
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
    <v-main :class="currentTheme === 'dark' ? 'bg-grey-darken-4 text-white' : 'bg-grey-lighten-3'">
      <v-container fluid class="py-6 px-4">
        <v-row justify="center">
          <v-col cols="12" sm="11" md="8">
            <v-sheet
              :class="currentTheme === 'dark' ? 'bg-grey-darken-3 text-white' : 'bg-white text-black'"
              class="pa-4 text-center"
              elevation="1"
              rounded="lg"
              style="max-width: 1200px; min-height: 90vh;"
            >
              <h1 class="text-h6 text-sm-h5 font-weight-bold mb-4">My Appointments</h1>
  
              <!-- Search and Sort -->
              <v-row class="mb-4" dense>
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
                    @keydown.enter.prevent
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
  
              <!-- Appointments Cards -->
              <v-row v-if="filteredAppointments.length > 0" dense>
                <v-col
                  v-for="appointment in filteredAppointments"
                  :key="appointment.id"
                  cols="12" sm="6" md="4"
                >
                  <v-card
                    elevation="2"
                    class="pa-4 d-flex flex-column justify-space-between"
                    :class="currentTheme === 'dark' ? 'bg-grey-darken-3 text-white' : 'bg-white text-black'"
                  >
                    <div>
                      <v-card-title class="text-h6">{{ appointment.student_name }}</v-card-title>
                      <v-card-subtitle>{{ appointment.appointment_date }} at {{ appointment.appointment_time }}</v-card-subtitle>
                      <v-card-text>
                        <p v-if="appointment.message"><strong>Message:</strong> {{ appointment.message }}</p>
                      </v-card-text>
                    </div>
                    <v-card-actions class="justify-center mt-4">
                      <v-btn
                        color="red"
                        variant="outlined"
                        size="small"
                        @click="cancelAppointment(appointment.id)"
                      >
                        Cancel Appointment
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>
  
              <!-- If No Appointments -->
              <v-row v-else>
                <v-col cols="12" class="text-center">
                  <v-alert
                    type="info"
                    variant="tonal"
                    border="start"
                    density="compact"
                    class="mt-6"
                  >
                    No accepted appointments found. Book an appointment or wait for approval.
                  </v-alert>
                </v-col>
              </v-row>
  
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
}</style>