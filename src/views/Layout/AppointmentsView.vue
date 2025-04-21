<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()
const currentTheme = ref(localStorage.getItem('theme') || 'light')

const snackbar = ref(false)
const snackbarMsg = ref('')

//search
const searchQuery = ref('')

function performSearch() {
  if (searchQuery.value.trim()) {
    snackbarMsg.value = `You searched for: "${searchQuery.value}"`
    snackbar.value = true
  }
}

//dark and light theme
function toggleTheme() {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  theme.global.name.value = currentTheme.value
  localStorage.setItem('theme', currentTheme.value)
}

watch(currentTheme, (val) => {
  theme.global.name.value = val
  localStorage.setItem('theme', val)
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
        <v-avatar color="#fff" size="44" class="ms-2">
          <v-img src="image/Teach&Learn.png" alt="Logo" />
        </v-avatar>

        <!-- Desktop Navigation -->
        <div class="d-none d-md-flex align-center" style="gap: 20px">
          <router-link to="/home" class="text-white font-weight-medium">Home</router-link>
          <router-link to="/about" class="text-white font-weight-medium">About Us</router-link>
          <router-link to="/contact" class="text-white font-weight-medium">Contact Us</router-link>
        </div>

        <!-- Mobile Search and Menu -->
        <div class="d-flex align-center gap-2">
          <!-- Mobile Menu Button -->
          <v-menu transition="scale-transition" offset-y>
            <template #activator="{ props }">
              <v-app-bar-nav-icon v-bind="props" class="d-md-none" />
            </template>
            <v-list>
              <v-list-item>
                <router-link to="/home" class="text-decoration-none">Home</router-link>
              </v-list-item>
              <v-list-item>
                <router-link to="/profile" class="text-decoration-none">My Profile</router-link>
              </v-list-item>
              <v-list-item>
                <router-link to="/appointments" class="text-decoration-none"
                  >My Appointments</router-link
                >
              </v-list-item>
              <v-list-item>
                <router-link to="/about" class="text-decoration-none">About Us</router-link>
              </v-list-item>
              <v-list-item>
                <router-link to="/contact" class="text-decoration-none">Contact Us</router-link>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item>
                <router-link to="/" class="text-decoration-none">Logout</router-link>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </v-container>
    </v-app-bar>

    <!-- Main Content -->
    <v-main :class="currentTheme === 'dark' ? 'bg-grey-darken-4 text-white' : 'bg-grey-lighten-3'">
      <v-container fluid class="py-2 px-2">
  <v-row justify="center">
    <v-col cols="12" sm="11" md="8">
      <v-sheet
        :class="currentTheme === 'dark' ? 'bg-grey-darken-4 text-white' : 'bg-white text-grey-darken-4'"
        class="pa-3 pa-sm-4 text-center"
        elevation="1"
        rounded="lg"
         style="max-width: 1200px; min-height: 90vh;"
      >
        <!-- Title -->
        <h1 class="text-h6 text-sm-h5 font-weight-bold mb-3">Appointment</h1>

        <!-- Search & Sort as equal width in responsive row -->
        <v-row class="mb-3" dense>
          <!-- Search Input -->
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

          <!-- Sort Select -->
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

        <!-- Placeholder or Results -->
        <v-alert
          type="info"
          variant="tonal"
          border="start"
          density="compact"
        >
          No appointments found. Try searching or adjusting the sort option.
        </v-alert>
      </v-sheet>
    </v-col>
  </v-row>
</v-container>

    </v-main>
  </v-app>
</template>
