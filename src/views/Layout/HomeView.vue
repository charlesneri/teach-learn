// FULLY CLEANED + FIXED HomeView.vue

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter, RouterLink } from 'vue-router'
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
const tutors = ref([])
const selectedTutor = ref(null)
const profileDialog = ref(false)
const appointmentDialog = ref(false)
const selectedDate = ref('')
const selectedTime = ref('')
const messageInput = ref('')
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')
const currentUserId = ref(null)
const currentUserProfile = ref({ firstName: '', lastName: '', avatarUrl: '', isPublicTutor: false })
const notificationMenu = ref(false)
const notifications = ref([{ id: 1, title: 'No new notifications', time: '' }])

// FETCH USER
const fetchCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    currentUserId.value = user.id
    const { data } = await supabase.from('profiles').select('first_name, last_name, avatar_url, is_public_tutor').eq('id', user.id).single()
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

// FETCH TUTORS
const fetchTutors = async () => {
  const { data } = await supabase.from('profiles').select('*').eq('is_public_tutor', true)
  tutors.value = data || []
}

// ACTIONS
const viewTutor = (tutor) => {
  selectedTutor.value = tutor
  profileDialog.value = true
}

const openAppointment = (tutor) => {
  selectedTutor.value = tutor
  appointmentDialog.value = true
}

const saveAppointment = async () => {
  try {
    if (!selectedTutor.value || !selectedDate.value || !selectedTime.value) {
      snackbarMsg.value = 'Please fill all fields!'
      snackbarColor.value = 'error'
      snackbar.value = true
      return
    }

    const { error } = await supabase.from('appointments').insert({
      mentor_id: selectedTutor.value.id,
      student_id: currentUserId.value,
      student_name: `${currentUserProfile.firstName} ${currentUserProfile.lastName}`,
      message: messageInput.value,
      appointment_date: selectedDate.value,
      appointment_time: selectedTime.value,
      status: 'pending',
      created_at: new Date()
    })

    if (error) throw error

    appointmentDialog.value = false
    selectedDate.value = ''
    selectedTime.value = ''
    messageInput.value = ''

    snackbarMsg.value = 'Appointment request sent successfully!'
    snackbarColor.value = 'success'
    snackbar.value = true

  } catch (err) {
    console.error('Error saving appointment:', err)
    snackbarMsg.value = 'Failed to send appointment. Try again.'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

onMounted(async () => {
  theme.global.name.value = currentTheme.value
  await fetchCurrentUser()
  await fetchTutors()
})
</script>

<template>
<v-app id="inspire">
  <!-- AppBar -->
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
            append-inner-icon="mdi-magnify"
          />
        </div>
      </v-responsive>
    </v-container>
  </v-app-bar>

  <v-snackbar v-model="snackbar" timeout="3000" :color="snackbarColor" location="top center">
    {{ snackbarMsg }}
  </v-snackbar>

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
            <v-btn icon @click="toggleTheme">
              <v-icon>{{ currentTheme === 'light' ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}</v-icon>
            </v-btn>
          </v-sheet>
        </v-col>

        <!-- Main Content -->
        <v-col cols="12" md="9">
          <v-sheet rounded="lg" class="pa-4" :class="currentTheme === 'dark' ? 'bg-grey-darken-2 text-white' : ''">
            <h1>Mentors List</h1>
            <v-divider />
            <div v-if="tutors.length" class="profile-container">
              <div v-for="tutor in tutors" :key="tutor.id" class="mentor-card">
                <v-avatar size="100" class="mb-3">
                  <v-img v-if="tutor.avatar_url" :src="tutor.avatar_url" cover />
                  <v-icon v-else size="60">mdi-account</v-icon>
                </v-avatar>
                <h3>{{ tutor.first_name }} {{ tutor.middle_initial }} {{ tutor.last_name }}</h3>
                <p>{{ tutor.expertise || 'No expertise listed' }}</p>
                <span class="text-primary" @click="viewTutor(tutor)">View More</span>
                <span v-if="tutor.id !== currentUserId" class="text-primary" @click="openAppointment(tutor)">Set Appointment</span>
                <span v-else class="text-grey text-caption">(My Profile)</span>
              </div>
            </div>
            <div v-else class="text-center">
              <v-icon size="60">mdi-account-search</v-icon>
              <p>No mentors available yet.</p>
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
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
  margin-top: 32px;
}

.mentor-card {
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 12px;
  width: 260px;
  text-align: center;
  transition: all 0.3s ease;
}
.mentor-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

h1 {
  text-align: center;
  font-weight: bold;
  margin-bottom: 24px;
}
</style>
