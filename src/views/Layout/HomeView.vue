<script setup>
const links = ['Mentor', 'About us', 'Contact']
</script>

<template>
  <v-app id="inspire">
    <!-- App Bar -->
    <v-app-bar flat>
      <v-container class="d-flex align-center justify-space-between">
        <!-- Left: Logo + Menu -->
        <div class="d-flex align-center gap-2">
          <!-- Logo Avatar -->
          <v-avatar style="border-width: 1px; color: #000" size="32">
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
              <v-list-item link title="My attict Profile"></v-list-item>
              <v-list-item link title="My Appointment"></v-list-item>
              <v-divider></v-divider>
              <v-list-item link> <router-link to="/">Logout</router-link></v-list-item>
            </v-list>
          </v-menu>
        </div>

        <!-- Center: Page Links -->
        <div class="d-flex align-center gap-2">
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
            <v-btn color="light-blue-darken-2" icon rounded="lg" class="elevation-1">
              <v-icon>mdi-magnify</v-icon>
            </v-btn>
          </div>
        </v-responsive>
      </v-container>
    </v-app-bar>

    <!-- Main Content -->
    <v-main class="bg-grey-lighten-3">
      <v-container>
        <v-row>
          <!-- Optional Left Column -->
          <v-col cols="2">
            <v-sheet rounded="lg" class="pa-4 text-center">
              <v-avatar class="mx-auto mb-2" style="border-width: 1px; color: #000" size="50">
                <v-img src="image/Teach&Learn.png" alt="User" />
              </v-avatar>
              <v-list rounded="lg" density="compact">
                <v-list-item link title="My Profile"></v-list-item>
                <v-list-item link title="My Appointment"></v-list-item>
                <v-divider class="my-2"></v-divider>
                <v-list-item link title="Logout"></v-list-item>
              </v-list>
            </v-sheet>
          </v-col>

          <!-- Main Section -->
          <v-col>
            <v-sheet min-height="70vh" rounded="lg" class="pa-4">
              <!-- Your content goes here -->
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
