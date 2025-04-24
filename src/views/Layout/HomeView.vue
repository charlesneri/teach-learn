<script setup>
import { ref, watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { RouterLink } from 'vue-router'

const theme = useTheme()
const searchQuery = ref('')

// Handle search
const performSearch = () => {
  if (searchQuery.value.trim()) {
    console.log('Searching for:', searchQuery.value)
    // Replace with actual logic (API, emit, router, etc.)
  }
}

// Manage theme toggle and persistence
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

onMounted(() => {
  theme.global.name.value = currentTheme.value
})
//for calendar

const dialog = ref(false) // Control the visibility of the dialog
const selectedDate = ref(null) // Store selected date
const selectedTime = ref(null) // Store selected time
const isAMSelected = ref(false) // Track if AM is selected
const isPMSelected = ref(false) // Track if PM is selected

// Validator for time input (e.g., 12-hour format with AM/PM or 24-hour format)
const timeValidator = (value) => {
  const regex24hr = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/ // For 24-hour format
  const regex12hr = /^([0-1]?[0-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/ // For 12-hour format

  if (regex24hr.test(value) || regex12hr.test(value)) {
    return true
  }
  return 'Please enter a valid time (HH:mm AM/PM or HH:mm)'
}

// Handle when a date is selected from the calendar
const onDateSelect = (date) => {
  selectedDate.value = date // Update selected date when user clicks on a date
}

// Handle when a time is selected
const onTimeSelect = (time) => {
  selectedTime.value = time // Update selected time when user selects a time
}

// Select AM and update the time accordingly
const selectAM = () => {
  isAMSelected.value = true
  isPMSelected.value = false
  if (selectedTime.value) {
    selectedTime.value += ' AM' // Append AM to the selected time
  }
}

// Select PM and update the time accordingly
const selectPM = () => {
  isPMSelected.value = true
  isAMSelected.value = false
  if (selectedTime.value) {
    selectedTime.value += ' PM' // Append PM to the selected time
  }
}

// Save the appointment
const saveAppointment = () => {
  if (selectedDate.value && selectedTime.value) {
    alert(`Appointment saved for ${selectedDate.value} at ${selectedTime.value}`)
    dialog.value = false // Close the dialog after saving
  } else {
    alert('Please select both a date and a time.')
  }
}
</script>

<template>
  <v-app id="inspire">
    <!-- App Bar -->
    <v-app-bar flat :color="currentTheme === 'light' ? '#1565c0' : 'grey-darken-4'">
      <v-container class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-4">
          <v-avatar color="#fff" size="50">
            <v-img src="image/Teach&Learn.png" alt="Logo" />
          </v-avatar>
        </div>
        <v-spacer />
        <div class="d-none d-md-flex align-center" style="gap: 24px">
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
        <!-- Search & Mobile Menu -->
        <v-responsive max-width="240">
          <div class="d-flex">
            <v-text-field
              v-model="searchQuery"
              placeholder="Search..."
              variant="solo-filled"
              density="compact"
              rounded="lg"
              flat
              hide-details
              single-line
              class="search-input flex-grow-1"
              @keydown.enter="performSearch"
              append-inner-icon="mdi-magnify"
              @click:append-inner="performSearch"
            />
            <!-- Mobile Search and Menu -->
            <div class="d-flex align-center gap-2">
              <!-- Mobile Menu Button -->
              <v-menu transition="scale-transition" offset-y>
                <template #activator="{ props }">
                  <v-app-bar-nav-icon v-bind="props" class="d-md-none" />
                </template>
                <v-list>
                  <v-list-item link>
                    <RouterLink
                      to="/"
                      :class="[
                        'active-click text-decoration-none',
                        currentTheme === 'dark' ? 'text-white' : 'text-black',
                      ]"
                    >
                      Home
                    </RouterLink>
                  </v-list-item>

                  <v-list-item link>
                    <RouterLink
                      to="/profile"
                      :class="[
                        'active-click text-decoration-none',
                        currentTheme === 'dark' ? 'text-white' : 'text-black',
                      ]"
                    >
                      My Profile
                    </RouterLink>
                  </v-list-item>

                  <v-list-item link>
                    <RouterLink
                      to="/appointments"
                      :class="[
                        'active-click text-decoration-none',
                        currentTheme === 'dark' ? 'text-white' : 'text-black',
                      ]"
                    >
                      My Appointment
                    </RouterLink>
                  </v-list-item>

                  <v-list-item link>
                    <RouterLink
                      to="/about"
                      :class="[
                        'active-click text-decoration-none',
                        currentTheme === 'dark' ? 'text-white' : 'text-black',
                      ]"
                    >
                      About Us
                    </RouterLink>
                  </v-list-item>

                  <v-list-item link>
                    <RouterLink
                      to="/contact"
                      :class="[
                        'active-click text-decoration-none',
                        currentTheme === 'dark' ? 'text-white' : 'text-black',
                      ]"
                    >
                      Contact Us
                    </RouterLink>
                  </v-list-item>

                  <v-divider></v-divider>

                  <v-list-item link>
                    <RouterLink
                      to="/"
                      :class="[
                        'active-click text-decoration-none',
                        currentTheme === 'dark' ? 'text-white' : 'text-black',
                      ]"
                    >
                      Logout
                    </RouterLink>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>
        </v-responsive>
      </v-container>
    </v-app-bar>

    <!-- Main -->
    <v-main :class="currentTheme === 'dark' ? 'bg-grey-darken-4 text-white' : 'bg-grey-lighten-3'">
      <v-container fluid class="pa-0" style="max-width: 95%; margin: auto">
        <v-row>
          <!-- Sidebar -->
          <v-col cols="12" md="3" class="d-none d-md-flex">
            <v-sheet
              :class="currentTheme === 'dark' ? 'bg-grey-darken-3 text-white' : ''"
              rounded="lg"
              class="pa-4 text-center"
              style="height: 100%; width: 100%"
            >
              <v-avatar class="mb-3" color="#FFFFFF" size="100">
                <v-img src="image/Teach&Learn.png" alt="User" />
              </v-avatar>
              <span class="d-block font-weight-medium mb-3">
                <RouterLink
                  to="/profile"
                  :class="[
                    'text-decoration-none active-click',
                    currentTheme === 'dark' ? 'text-white' : 'text-black',
                  ]"
                >
                  My Name
                </RouterLink>
              </span>
              <v-divider> </v-divider>
              <!-- Theme Toggle Button -->
              <v-btn icon @click="toggleTheme" size="35" class="ma-3">
                <v-icon>{{
                  currentTheme === 'light' ? 'mdi-weather-night' : 'mdi-white-balance-sunny'
                }}</v-icon>
              </v-btn>
              <!-- Sidebar Menu -->
              <v-list density="compact" nav>
                <v-list-item
                  link
                  :to="'/profile'"
                  tag="RouterLink"
                  :class="[
                    'active-click text-decoration-none',
                    currentTheme === 'dark' ? 'text-white' : 'text-black',
                  ]"
                >
                  <v-list-item-title>My Profile</v-list-item-title>
                </v-list-item>

                <v-list-item
                  link
                  :to="'/appointments'"
                  tag="RouterLink"
                  :class="[
                    'active-click text-decoration-none',
                    currentTheme === 'dark' ? 'text-white' : 'text-black',
                  ]"
                >
                  <v-list-item-title>My Appointments</v-list-item-title>
                </v-list-item>

                <v-divider class="my-2" />

                <v-list-item
                  link
                  :to="'/'"
                  tag="RouterLink"
                  :class="[
                    'active-click text-decoration-none',
                    currentTheme === 'dark' ? 'text-white' : 'text-black',
                  ]"
                >
                  <v-list-item-title>Logout</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-sheet>
          </v-col>

          <!-- Main Area -->
          <v-col cols="12" md="9">
            <v-sheet
              min-height="100vh"
              rounded="lg"
              class="pa-4"
              :class="currentTheme === 'dark' ? 'bg-grey-darken-2 text-white' : ''"
            >
              <h1>Mentors List</h1>
              <v-divider></v-divider>

              <!-- Profile Container -->
              <div class="profile-container">
                <v-container>
                  <!-- Set Appointment Button -->
                  <v-btn @click="dialog = true" color="primary">Set an Appointment</v-btn>

                  <!-- Appointment Dialog -->
                  <v-dialog v-model="dialog" max-width="600px">
                    <v-card>
                      <v-card-title class="headline">Select Appointment Date & Time</v-card-title>

                      <v-card-text>
                        <!-- Full Calendar (v-date-picker) -->
                        <v-date-picker
                          v-model="selectedDate"
                          color="primary"
                          locale="en"
                          class="mb-4"
                          @input="onDateSelect"
                          elevation="24"
                        ></v-date-picker>

                        <!-- Time Picker with clock-like spinner (24hr format) -->
                        <v-time-picker
                          v-if="selectedDate"
                          v-model="selectedTime"
                          format="12hr"
                          color="primary"
                          class="mb-4"
                          :disabled="!selectedDate"
                          @change="onTimeSelect"
                          full-width
                        ></v-time-picker>
                      </v-card-text>

                      <v-card-actions>
                        <!-- Cancel Button -->
                        <v-btn color="grey darken-1" @click="dialog = false">Cancel</v-btn>
                        <!-- Save Button -->
                        <v-btn color="primary" @click="saveAppointment">Save</v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-dialog>
                </v-container>
              </div>
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.profile-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.v-dialog__content {
  padding: 20px;
}

/* Custom styling for heading */
h1 {
  font-size: 2.5rem; /* Make it bigger */
  font-weight: 700; /* Bold text */
  color: #1565c0; /* Primary color */
  text-align: center; /* Center the heading */
  margin-bottom: 20px; /* Space below the heading */
  text-transform: uppercase; /* Capitalize the text */
  letter-spacing: 1px; /* Add some spacing between letters */
}

/* Adjust heading color for dark theme */
body[data-theme='dark'] h1 {
  color: #e3f2fd; /* Lighter color for dark mode */
}

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
</style>
