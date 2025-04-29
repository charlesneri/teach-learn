<script setup>
import { ref, onMounted, watch } from 'vue'
import { useTheme } from 'vuetify'
import { RouterLink } from 'vue-router'
import { supabase } from '@/utils/supabase'

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

const searchQuery = ref('')
const tutors = ref([])
const selectedTutor = ref(null)
const profileDialog = ref(false)
const appointmentDialog = ref(false)
const selectedDate = ref(null)
const selectedTime = ref(null)
const messageInput = ref('')
const currentUserId = ref(null)
const currentUserProfile = ref({ firstName: '', lastName: '', avatarUrl: '', isPublicTutor: false })

const performSearch = () => {}

const fetchCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    currentUserId.value = user.id
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, is_public_tutor')
      .eq('id', user.id)
      .single()
    if (data) {
      currentUserProfile.value = {
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        avatarUrl: data.avatar_url || '',
        isPublicTutor: data.is_public_tutor || false,
      }
    }
  }
}

const fetchTutors = async () => {
  const { data } = await supabase.from('profiles').select('*').eq('is_public_tutor', true)
  tutors.value = data || []
}

const applyOrCancelTutor = async () => {
  const newStatus = !currentUserProfile.value.isPublicTutor
  await supabase
    .from('profiles')
    .update({ is_public_tutor: newStatus })
    .eq('id', currentUserId.value)
  currentUserProfile.value.isPublicTutor = newStatus
  await fetchTutors()
}

const viewTutor = (tutor) => {
  selectedTutor.value = tutor
  profileDialog.value = true
}
const openAppointment = (tutor) => {
  selectedTutor.value = tutor
  appointmentDialog.value = true
}

onMounted(async () => {
  theme.global.name.value = currentTheme.value
  await fetchCurrentUser()
  await fetchTutors()
})
</script>

<template>
  <v-app id="inspire">
    <v-app-bar flat :color="currentTheme === 'light' ? '#1565c0' : 'grey-darken-4'">
      <v-container class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-4">
          <v-avatar color="#fff" size="50">
            <v-img src="image/Teach&Learn.png" alt="Logo" />
          </v-avatar>
        </div>
        <v-spacer />
        <div class="d-none d-md-flex align-center" style="gap: 24px">
          <RouterLink to="/home" class="text-white text-decoration-none font-weight-medium">Home</RouterLink>
          <RouterLink to="/about" class="text-white text-decoration-none font-weight-medium">About Us</RouterLink>
          <RouterLink to="/contact" class="text-white text-decoration-none font-weight-medium">Contact Us</RouterLink>
        </div>
        <v-spacer />
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
            <div class="d-flex align-center gap-2">
              <v-menu transition="scale-transition" offset-y>
                <template #activator="{ props }">
                  <v-app-bar-nav-icon v-bind="props" class="d-md-none" />
                </template>
                <v-list>
                  <v-list-item link>
                    <RouterLink to="/" class="active-click">Home</RouterLink>
                  </v-list-item>
                  <v-list-item link>
                    <RouterLink to="/profile" class="active-click">My Profile</RouterLink>
                  </v-list-item>
                  <v-list-item link>
                    <RouterLink to="/appointments" class="active-click">My Appointment</RouterLink>
                  </v-list-item>
                  <v-list-item link>
                    <RouterLink to="/about" class="active-click">About Us</RouterLink>
                  </v-list-item>
                  <v-list-item link>
                    <RouterLink to="/contact" class="active-click">Contact Us</RouterLink>
                  </v-list-item>
                  <v-divider />
                  <v-list-item link>
                    <RouterLink to="/" class="active-click">Logout</RouterLink>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>
        </v-responsive>
      </v-container>
    </v-app-bar>

    <transition name="fade-slide-up">
      <v-main :class="currentTheme === 'dark' ? 'bg-grey-darken-4 text-white' : 'bg-grey-lighten-3'">
        <v-container fluid class="pa-0" style="max-width: 95%; margin: auto">
          <v-row>
            <!-- Sidebar -->
            <v-col cols="12" md="3" class="d-none d-md-flex">
              <v-sheet rounded="lg" class="pa-4 text-center" :class="currentTheme === 'dark' ? 'bg-grey-darken-3 text-white' : ''">
                <v-avatar size="100" class="mb-3">
                  <v-img v-if="currentUserProfile.avatarUrl" :src="currentUserProfile.avatarUrl" cover />
                  <v-icon v-else size="80">mdi-account</v-icon>
                </v-avatar>
                <h3>{{ currentUserProfile.firstName }} {{ currentUserProfile.lastName }}</h3>
                <v-divider class="my-3" />
                <v-btn icon @click="toggleTheme" size="35" class="ma-3">
                  <v-icon>{{ currentTheme === 'light' ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}</v-icon>
                </v-btn>
                <v-list density="compact" nav>
                  <v-list-item link :to="'/profile'" tag="RouterLink">
                    <v-list-item-title>My Profile</v-list-item-title>
                  </v-list-item>
                  <v-list-item link :to="'/appointments'" tag="RouterLink">
                    <v-list-item-title>My Appointments</v-list-item-title>
                  </v-list-item>
                  <v-divider class="my-2" />
                  <v-list-item link :to="'/'" tag="RouterLink">
                    <v-list-item-title>Logout</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-sheet>
            </v-col>

            <!-- Main Content Area -->
            <v-col cols="12" md="9">
              <v-sheet min-height="100vh" rounded="lg" class="pa-4" :class="currentTheme === 'dark' ? 'bg-grey-darken-2 text-white' : ''">
                <h1>Mentors List</h1>
                <v-divider></v-divider>

                <div class="profile-container">
                  <template v-if="tutors.length">
                    <div v-for="tutor in tutors" :key="tutor.id">
                      <Transition name="fade-slide-up">
                        <div class="mentor-card pa-4 d-flex flex-column align-center">
                          <v-avatar size="100" class="mb-3">
                            <v-img v-if="tutor.avatar_url" :src="tutor.avatar_url" cover>
                              <template #error><v-icon size="60" color="grey-darken-1">mdi-account</v-icon></template>
                            </v-img>
                            <v-icon v-else size="60" color="grey-darken-1">mdi-account</v-icon>
                          </v-avatar>
                          <h3 class="font-weight-medium mb-2">{{ tutor.first_name }} {{ tutor.middle_initial }} {{ tutor.last_name }}</h3>
                          <p class="text-caption mb-3">{{ tutor.expertise || 'No expertise listed' }}</p>
                          <span @click="viewTutor(tutor)" class="text-primary text-decoration-underline cursor-pointer mb-2">View More</span>
                          <span v-if="tutor.id !== currentUserId" @click="openAppointment(tutor)" class="text-primary text-decoration-underline cursor-pointer">Set an Appointment</span>
                          <span v-else class="text-grey text-caption">(My profile)</span>
                        </div>
                      </Transition>
                    </div>
                  </template>
                  <div v-else class="text-center mt-6">
                    <v-icon size="60">mdi-account-search</v-icon>
                    <p>No mentors available yet.</p>
                  </div>
                </div>

              </v-sheet>
            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </transition>
  </v-app>
</template>

<style scoped>
/* (your styles unchanged) */
</style>
