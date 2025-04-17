<script setup>
import { RouterLink } from 'vue-router'
import { ref } from 'vue'

const searchQuery = ref('')

// This will run when user presses Enter or clicks the search button
const performSearch = () => {
  if (searchQuery.value.trim()) {
    console.log('Searching for:', searchQuery.value)
    // You can replace this with your actual search logic, e.g. emit, API call, or router push
  }
}
</script>

<template>
  <v-app id="inspire">
    <!-- App Bar -->
    <v-app-bar flat color="#1565c0">
      <v-container class="d-flex align-center justify-space-between">
        <!-- Left: Logo -->
        <div class="d-flex align-center gap-4">
          <v-avatar color="#fff" size="50" style="border-width: 1px">
            <v-img src="image/Teach&Learn.png" alt="Logo" />
          </v-avatar>
        </div>

        <!-- Center: Desktop Navigation -->
        <div class="d-none d-md-flex" style="gap: 24px">
          <RouterLink to="/" class="text-white text-decoration-none font-weight-medium">
            Home
          </RouterLink>

          <RouterLink to="/about" class="text-white text-decoration-none font-weight-medium">
            About us
          </RouterLink>

          <RouterLink to="/contact" class="text-white text-decoration-none font-weight-medium">
            Contact us
          </RouterLink>
        </div>

        <!-- Right: Search Bar -->
        <v-responsive max-width="240">
          <div class="d-flex gap-2">
            <div class="d-flex align-center search-wrapper">
              <v-text-field
                v-model="searchQuery"
                density="compact"
                label="Search"
                rounded="lg"
                variant="solo-filled"
                flat
                hide-details
                single-line
                class="flex-grow-1 search-input"
                @keydown.enter="performSearch"
              />
              <v-btn
                color="#fff"
                icon
                rounded="lg"
                class="elevation-1 search-btn"
                @click="performSearch"
              >
                <v-icon>mdi-magnify</v-icon>
              </v-btn>
            </div>
            <!-- Mobile Menu -->
            <v-menu transition="scale-transition" offset-y>
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
                  ><RouterLink to="/home" class="text-decoration-none"
                    >My profile</RouterLink
                  ></v-list-item
                ><v-list-item link
                  ><RouterLink to="/home" class="text-decoration-none"
                    >My appointments</RouterLink
                  ></v-list-item
                >
                <v-list-item link
                  ><RouterLink to="/about" class="text-decoration-none"
                    >About Us</RouterLink
                  ></v-list-item
                >

                <v-list-item
                  ><RouterLink to="/contact" class="text-decoration-none"
                    >Contact Us</RouterLink
                  ></v-list-item
                >
                <v-divider></v-divider>
                <v-list-item
                  ><RouterLink to="/about" class="text-decoration-none"
                    >Logout</RouterLink
                  ></v-list-item
                >
              </v-list>
            </v-menu>
          </div>
        </v-responsive>
      </v-container>
    </v-app-bar>

    <!-- Main Content -->
    <v-main class="bg-grey-lighten-3">
      <v-container fluid class="pa-0" style="max-width: 95%; margin: auto">
        <v-row>
          <!-- Sidebar -->
          <v-col cols="12" md="3" class="d-none d-md-flex">
            <v-sheet rounded="lg" class="pa-4 text-center" style="height: 100%; width: 100%">
              <v-avatar class="mb-3" color="#fff" size="100" style="border-width: 1px">
                <v-img src="image/Teach&Learn.png" alt="User" />
              </v-avatar>
              <span class="d-block font-weight-medium mb-3"
                ><RouterLink to="/profile">My Name</RouterLink>
              </span>
              <v-divider class="mb-3"></v-divider>

              <v-list density="compact" nav>
                <v-list-item link>
                  <v-list-item-title
                    ><RouterLink to="/profile"> My Profile</RouterLink></v-list-item-title
                  >
                </v-list-item>

                <v-list-item link>
                  <v-list-item-title
                    ><RouterLink to="/appointments"> My Appoitnments</RouterLink></v-list-item-title
                  >
                </v-list-item>

                <v-divider class="my-2" />

                <v-list-item link>
                  <RouterLink to="/" class="text-decoration-none">
                    <v-list-item-title>Logout</v-list-item-title>
                  </RouterLink>
                </v-list-item>
              </v-list>
            </v-sheet>
          </v-col>

          <!-- Main Area -->
          <v-col cols="12" md="9">
            <v-sheet min-height="100vh" rounded="lg" class="pa-4">
              <!-- Your content goes here -->
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-footer app padless></v-footer>
  </v-app>
</template>
<style scoped>
.search-wrapper {
  gap: 8px;
  max-width: 300px;
  width: 100%;
}

.search-input {
  min-height: 40px;
  font-size: 15px;
}

.search-btn {
  width: 48px;
  height: 48px;
  transition: all 0.3s ease;
}

.search-btn .v-icon {
  font-size: 24px;
}

@media (max-width: 600px) {
  .search-wrapper {
    max-width: 100%;
    gap: 6px;
  }

  .search-btn {
    width: 40px;
    height: 40px;
  }

  .search-btn .v-icon {
    font-size: 20px;
  }

  .search-input {
    font-size: 14px;
  }
}
</style>
