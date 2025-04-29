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

// STATES
const searchQuery = ref('')
const selectedSort = ref('Date')
const notificationMenu = ref(false)
const notifications = ref([{ id: 1, title: 'No new notifications', time: '' }])

const currentUserId = ref(null)
const appointments = ref([])
const snackbar = ref(false)
const snackbarMsg = ref('')

// Fetch Current User
const fetchCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    currentUserId.value = user.id
  }
}

// Fetch Appointments (accepted only)
const fetchAppointments = async () => {
  if (!currentUserId.value) return

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('student_id', currentUserId.value)
    .eq('status', 'accepted')
    .order('appointment_date', { ascending: true })

  if (error) {
    console.error('Error fetching appointments:', error)
  } else {
    appointments.value = data || []
  }
}

// Computed: Filtered + Sorted Appointments
const filteredAppointments = computed(() => {
  let temp = [...appointments.value]

  if (searchQuery.value.trim()) {
    const term = searchQuery.value.toLowerCase()
    temp = temp.filter(a =>
      a.student_name?.toLowerCase().includes(term) ||
      a.message?.toLowerCase().includes(term)
    )
  }

  if (selectedSort.value === 'A-Z') {
    temp.sort((a, b) => (a.student_name || '').localeCompare(b.student_name || ''))
  } else if (selectedSort.value === 'Date') {
    temp.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
  }

  return temp
})

// Cancel Appointment
const cancelAppointment = async (id) => {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (error) throw error

    snackbarMsg.value = 'Appointment cancelled.'
    snackbar.value = true
    await fetchAppointments()
  } catch (error) {
    console.error('Error cancelling:', error)
    snackbarMsg.value = 'Failed to cancel.'
    snackbar.value = true
  }
}

// Perform search manually
const performSearch = () => {
  snackbarMsg.value = `You searched: "${searchQuery.value}"`
  snackbar.value = true
}

// ON MOUNT
onMounted(async () => {
  theme.global.name.value = currentTheme.value
  await fetchCurrentUser()
  await fetchAppointments()
})
</script>
<template>
  <v-app id="inspire">
    <!-- App Bar -->
    <v-app-bar flat :color="currentTheme === 'light' ? '#1565c0' : 'grey-darken-4'" class="px-4">
      <v-container class="d-flex align-center justify-space-between pa-0">
        <v-avatar color="white" size="44">
          <v-img src="image/Teach&Learn.png" alt="Logo" />
        </v-avatar>

        <v-spacer />

        <div class="d-none d-md-flex align-center" style="gap: 24px">
          <RouterLink to="/home" class="nav-link">Home</RouterLink>
          <RouterLink to="/about" class="nav-link">About Us</RouterLink>
          <RouterLink to="/contact" class="nav-link">Contact Us</RouterLink>
        </div>

        <v-spacer />

        <!-- Notifications + Mobile Menu -->
        <v-menu v-model="notificationMenu" offset-y>
          <template #activator="{ props }">
            <v-btn icon v-bind="props">
              <v-icon>mdi-bell</v-icon>
            </v-btn>
          </template>
          <v-card min-width="300">
            <v-list density="compact">
              <v-list-item v-for="notif in notifications" :key="notif.id">
                <v-list-item-content>
                  <v-list-item-title>{{ notif.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{ notif.time }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>

        <v-menu transition="scale-transition" offset-y>
          <template #activator="{ props }">
            <v-app-bar-nav-icon v-bind="props" class="d-md-none" />
          </template>
          <v-list>
            <v-list-item link><RouterLink to="/home" class="nav-link">Home</RouterLink></v-list-item>
            <v-list-item link><RouterLink to="/profile" class="nav-link">Profile</RouterLink></v-list-item>
            <v-list-item link><RouterLink to="/appointments" class="nav-link">Appointments</RouterLink></v-list-item>
            <v-list-item link><RouterLink to="/about" class="nav-link">About Us</RouterLink></v-list-item>
            <v-list-item link><RouterLink to="/contact" class="nav-link">Contact Us</RouterLink></v-list-item>
            <v-divider />
            <v-list-item link><RouterLink to="/" class="nav-link">Logout</RouterLink></v-list-item>
          </v-list>
        </v-menu>
      </v-container>
    </v-app-bar>

    <!-- Main Content -->
    <v-main :class="currentTheme === 'dark' ? 'bg-grey-darken-4 text-white' : 'bg-grey-lighten-3'">
      <v-container fluid class="py-6 px-4">
        <v-row justify="center">
          <v-col cols="12" md="10" lg="8">
            <v-sheet class="pa-4" rounded="lg" elevation="2">
              <h2 class="font-weight-bold mb-4 text-center">My Appointments</h2>

              <!-- Search + Sort -->
              <v-row dense class="mb-4">
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="searchQuery"
                    placeholder="Search..."
                    append-inner-icon="mdi-magnify"
                    @keydown.enter="performSearch"
                    @click:append-inner="performSearch"
                    solo-filled
                    rounded
                    dense
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="selectedSort"
                    :items="['A-Z', 'Date']"
                    label="Sort by"
                    solo-filled
                    rounded
                    dense
                  />
                </v-col>
              </v-row>

              <!-- Appointment Cards -->
              <v-row dense>
                <template v-if="filteredAppointments.length > 0">
                  <v-col
                    v-for="appointment in filteredAppointments"
                    :key="appointment.id"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card class="pa-4" :class="currentTheme === 'dark' ? 'bg-grey-darken-2' : ''" outlined>
                      <v-card-title>{{ appointment.student_name }}</v-card-title>
                      <v-card-subtitle>{{ appointment.appointment_date }} at {{ appointment.appointment_time }}</v-card-subtitle>
                      <v-card-text>
                        <div><strong>Message:</strong> {{ appointment.message || 'No message' }}</div>
                      </v-card-text>
                      <v-card-actions>
                        <v-btn color="red" variant="outlined" size="small" @click="cancelAppointment(appointment.id)">
                          Cancel
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-col>
                </template>

                <template v-else>
                  <v-col cols="12" class="text-center">
                    <v-alert type="info" variant="tonal">
                      No appointments found.
                    </v-alert>
                  </v-col>
                </template>
              </v-row>
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" timeout="3000" color="info">
      {{ snackbarMsg }}
    </v-snackbar>
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
