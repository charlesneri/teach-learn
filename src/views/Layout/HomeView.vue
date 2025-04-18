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

        <!-- Navigation Links -->
        <v-spacer />

        <!-- Centered Navigation Links (Desktop only) -->
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
            <div class="d-flex align-center search-wrapper" style="max-width: 400px; width: 100%">
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
            </div>

            <!-- Mobile Menu -->
            <v-menu transition="scale-transition" offset-y theme="light">
              <template #activator="{ props }">
                <v-app-bar-nav-icon v-bind="props" class="d-md-none" />
              </template>
              <v-list>
                <v-list-item link
                  ><RouterLink to="/home" class="text-decoration-none"
                    >Home</RouterLink
                  ></v-list-item
                >
                <v-list-item link
                  ><RouterLink to="/profile" class="text-decoration-none"
                    >My Profile</RouterLink
                  ></v-list-item
                >
                <v-list-item link
                  ><RouterLink to="/appointments" class="text-decoration-none"
                    >My Appointments</RouterLink
                  ></v-list-item
                >
                <v-list-item link
                  ><RouterLink to="/about" class="text-decoration-none"
                    >About us</RouterLink
                  ></v-list-item
                >
                <v-list-item link
                  ><RouterLink to="/contact" class="text-decoration-none"
                    >Contact us</RouterLink
                  ></v-list-item
                >
                <v-divider></v-divider>
                <v-list-item link
                  ><RouterLink to="/" class="text-decoration-none"
                    >Logout</RouterLink
                  ></v-list-item
                >
              </v-list>
            </v-menu>
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
                <RouterLink to="/profile" class="text-decoration-none">My Name</RouterLink>
              </span>
              <v-divider> </v-divider>
              <!-- Theme Toggle Button (Icon Only) -->
              <v-btn icon @click="toggleTheme" size="35" class="ma-3">
                <v-icon>
                  {{ currentTheme === 'light' ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}
                </v-icon>
              </v-btn>
              <!-- Sidebar Menu -->
              <v-list density="compact" nav>
                <v-list-item link>
                  <v-list-item-title
                    ><RouterLink to="/profile">My Profile</RouterLink></v-list-item-title
                  >
                </v-list-item>
                <v-list-item link>
                  <v-list-item-title
                    ><RouterLink to="/appointments">My Appointments</RouterLink></v-list-item-title
                  >
                </v-list-item>
                <v-divider class="my-2" />
                <v-list-item link>
                  <RouterLink to="/login" class="text-decoration-none">
                    <v-list-item-title>Logout</v-list-item-title>
                  </RouterLink>
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
              <!-- Your content goes here -->
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
