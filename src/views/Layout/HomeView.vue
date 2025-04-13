<script setup>
const links = ['Mentor', 'About us', 'Contact']
</script>

<template>
  <v-app id="inspire">
    <!-- App Bar -->
    <v-app-bar flat color="#1565c0">
      <v-container class="d-flex align-center justify-space-between">
        <!-- Left: Logo + Menu -->
        <div class="d-flex align-center gap-5">
          <!-- Logo Avatar -->
          <v-avatar style="border-width: 1px" color="#fff" size="50">
            <v-img src="image/Teach&Learn.png" alt="Logo" />
          </v-avatar>

          <!-- Menu Dropdown -->
          <v-menu transition="scale-transition" offset-y>
            <template #activator="{ props }">
              <v-btn icon v-bind="props">
                <v-icon>mdi-menu</v-icon>
              </v-btn>
            </template>

            <v-list>
              <v-list-item link title="My Profile"></v-list-item>
              <v-list-item link title="My Appointment"></v-list-item>
              <v-divider></v-divider>
              <v-list-item link> <router-link to="/">Logout</router-link></v-list-item>
            </v-list>
          </v-menu>
        </div>

        <!-- Center: Page Links -->
        <div class="profile-container d-flex align-center gap-2">
          <v-btn
            v-for="link in links"
            :key="link"
            :text="link"
            variant="text"
            class="text-none"
          ></v-btn>
        </div>

        <!-- Right: Search -->
        <v-responsive max-width="220">
          <div class="d-flex align-center gap-2">
            <v-text-field
              density="compact"
              label="Search"
              rounded="lg"
              variant="solo-filled"
              flat
              hide-details
              single-line
              class="flex-grow-1"
            ></v-text-field>
            <v-btn color="#fff" icon rounded="lg" class="elevation-1" style="border: 10px">
              <v-icon>mdi-magnify</v-icon>
            </v-btn>
          </div>
        </v-responsive>
      </v-container>
    </v-app-bar>

    <!-- Main Content -->
    <v-main class="bg-grey-lighten-3">
      <v-container fluid class="pa-0" style="max-width: 1400px; margin: auto">
        <v-row>
          <!-- Wider Left Column -->
          <v-col cols="3">
            <v-sheet rounded="lg" class="pa-4 text-center" style="width: 100%; height: 100%">
              <v-avatar class="mb-3" style="border-width: 1px; color: #000" size="100">
                <v-img src="image/Teach&Learn.png" alt="User" />
              </v-avatar>
              <span class="d-block font-weight-medium mx-auto">My Name</span>
              <!-- Full-width Divider -->
              <v-divider class="ma-0 pa-0" style="width: 100%; display: block"></v-divider>
              <span class="text-left d-block"><b>My Appointments</b></span>
            </v-sheet>
          </v-col>

          <!-- Main Content Column -->
          <v-col cols="9">
            <v-sheet min-height="70vh" rounded="lg" class="pa-4" style="width: 100%">
              <!-- Your content goes here -->
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
    <v-footer></v-footer>
  </v-app>
</template>
