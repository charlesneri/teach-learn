<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useTheme } from 'vuetify'
import { supabase } from '@/utils/supabase'

// THEME SETUP
const theme = useTheme()
const currentTheme = ref(localStorage.getItem('theme') || 'light')

function toggleTheme() {
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

// NOTIFICATIONS (for bell)
const notificationMenu = ref(false)
const notifications = ref([{ id: 1, title: 'No new notifications', time: '' }])
const toggleMenu = () => {
  notificationMenu.value = !notificationMenu.value
}

// APPOINTMENTS FETCHING
const currentUserId = ref(null)
const appointments = ref([])
const fetchAppointments = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  currentUserId.value = user.id

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('student_id', currentUserId.value)
    // 👉 Remove .eq('status', 'accepted')
    .order('appointment_date', { ascending: true })

  if (data) {
    appointments.value = data
  } else {
    console.error('Error fetching appointments:', error)
  }
}

onMounted(() => {
  fetchAppointments()
})

// SORTED + SEARCHED APPOINTMENTS (computed)
const filteredAppointments = computed(() => {
  let temp = [...appointments.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    temp = temp.filter((appointment) => appointment.student_name.toLowerCase().includes(query))
  }

  if (selectedSort.value === 'A-Z') {
    temp.sort((a, b) => a.student_name.localeCompare(b.student_name))
  } else if (selectedSort.value === 'Date') {
    temp.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
  }

  return temp
})

function performSearch() {
  if (searchQuery.value.trim()) {
    snackbarMsg.value = `You searched for: "${searchQuery.value}"`
    snackbar.value = true
  }
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
          <RouterLink to="/home" class="text-white text-decoration-none font-weight-medium"
            >Home</RouterLink
          >
          <RouterLink to="/about" class="text-white text-decoration-none font-weight-medium"
            >About Us</RouterLink
          >
          <RouterLink to="/contact" class="text-white text-decoration-none font-weight-medium"
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
              <div v-if="appointments.length > 0">
  <v-list>
    <v-list-item v-for="appointment in appointments" :key="appointment.id">
      <v-list-item-title>
        Appointment with mentor ID {{ appointment.mentor_id }}
      </v-list-item-title>
      <v-list-item-subtitle>
        {{ appointment.appointment_date }} - {{ appointment.appointment_time }}
      </v-list-item-subtitle>
    </v-list-item>
  </v-list>
</div>

<div v-else>
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
</style>
