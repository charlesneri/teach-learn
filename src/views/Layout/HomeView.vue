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

            <!-- Mobile Search and Menu -->
            <div class="d-flex align-center gap-2">
              <!-- Mobile Menu Button -->
              <v-menu transition="scale-transition" offset-y>
                <template #activator="{ props }">
                  <v-app-bar-nav-icon v-bind="props" class="d-md-none" />
                </template>
                <v-list>
                  <v-list-item >
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

                  <v-list-item >
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

                  <v-list-item >
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
                

                  <v-list-item >
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
    <v-snackbar
      v-model="snackbar"
      timeout="3000"
      :color="snackbarColor"
      location="top center"
      style="top: 80px"
    >
      {{ snackbarMsg }}
    </v-snackbar>

    <!-- Main -->
    <transition name="fade-slide-up">
      <v-main
        :class="currentTheme === 'dark' ? 'bg-grey-darken-4 text-white' : 'bg-grey-lighten-3'"
      >
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
                <v-sheet
                  class="pa-4 text-center"
                  :class="currentTheme === 'dark' ? 'bg-grey-darken-3' : ''"
                  rounded="lg"
                >
                  <v-avatar size="100" class="mb-3">
                    <v-img
                      v-if="currentUserProfile.avatarUrl"
                      :src="currentUserProfile.avatarUrl"
                      cover
                    />
                    <v-icon v-else size="80">mdi-account</v-icon>
                  </v-avatar>
                  <h3>{{ currentUserProfile.firstName }} {{ currentUserProfile.lastName }}</h3>
                </v-sheet>
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
                  <div
                    v-if="tutors.length"
                    class="profile-container"
                    style="flex-wrap: wrap; gap: 24px"
                  >
                    <div v-for="tutor in tutors" :key="tutor.id">
                      <Transition name="fade-slide-up">
                        <div
                          class="mentor-card pa-4 d-flex flex-column align-center"
                          style="border: 1px solid #ccc; border-radius: 12px; width: 250px"
                          :class="
                            currentTheme === 'dark'
                              ? 'bg-grey-darken-3 text-white'
                              : 'bg-white text-black'
                          "
                        >
                          <!-- Your card content here -->
                          <v-avatar size="100" class="mb-3">
                            <v-img :src="tutor.avatar_url" v-if="tutor.avatar_url" cover>
                              <template #error
                                ><v-icon size="60" color="grey-darken-1"
                                  >mdi-account</v-icon
                                ></template
                              >
                            </v-img>
                            <v-icon v-else size="60" color="grey-darken-1">mdi-account</v-icon>
                          </v-avatar>

                          <h3 class="font-weight-medium mb-2">
                            {{ tutor.first_name }} {{ tutor.middle_initial }} {{ tutor.last_name }}
                          </h3>
                          <p class="text-caption mb-3">
                            {{ tutor.expertise || 'No expertise listed' }}
                          </p>

                          <!-- View More: always visible -->
                          <span
                            @click="viewTutor(tutor)"
                            class="text-primary text-decoration-underline cursor-pointer mb-2"
                          >
                            View More
                          </span>

                          <!-- Set an Appointment: only if not your own profile -->
                          <span
                            v-if="tutor.id !== currentUserId"
                            @click="openAppointment(tutor)"
                            class="text-primary text-decoration-underline cursor-pointer"
                          >
                            Set an Appointment
                          </span>

                          <!-- (Optional) Greyed text if it's your own profile -->
                          <span v-else class="text-grey text-caption"> (My profile) </span>
                        </div>
                      </Transition>
                    </div>
                  </div>

                  <div v-else class="text-center mt-6">
                    <v-icon size="60">mdi-account-search</v-icon>
                    <p>No mentors available yet.</p>
                  </div>

                  <v-container>
                    <!-- View More (Profile Details) Dialog -->
                    <v-dialog
                      v-model="profileDialog"
                      max-width="500px"
                      transition="scale-transition"
                    >
                      <v-card
                        :class="
                          currentTheme === 'dark'
                            ? 'bg-grey-darken-3 text-white'
                            : 'bg-white text-black'
                        "
                      >
                        <v-card-text class="text-center py-6 px-4">
                          <h2 class="font-weight-bold mb-4">
                            {{ selectedTutor?.first_name }} {{ selectedTutor?.middle_initial }}
                            {{ selectedTutor?.last_name }}
                          </h2>

                          <v-avatar size="120" class="mb-4 mx-auto">
                            <v-img
                              v-if="selectedTutor?.avatar_url"
                              :src="selectedTutor?.avatar_url"
                              cover
                            >
                              <template #error>
                                <v-icon size="80" color="grey-darken-1">mdi-account</v-icon>
                              </template>
                            </v-img>
                            <v-icon v-else size="80" color="grey-darken-1">mdi-account</v-icon>
                          </v-avatar>

                          <div class="text-start" style="margin: 0 auto; max-width: 300px">
                            <p>
                              <strong>Expertise:</strong>
                              {{ selectedTutor?.expertise || 'No expertise listed' }}
                            </p>
                            <p>
                              <strong>Email:</strong>
                              {{ selectedTutor?.email || 'No email provided' }}
                            </p>
                            <p>
                              <strong>Phone:</strong>
                              {{ selectedTutor?.phone || 'No phone number' }}
                            </p>
                            <p>
                              <strong>About:</strong> {{ selectedTutor?.about || 'No description' }}
                            </p>
                            <p>
                              <strong>School:</strong>
                              {{ selectedTutor?.school || 'No school listed' }}
                            </p>
                            <p>
                              <strong>Degree:</strong>
                              {{ selectedTutor?.degree || 'No degree listed' }}
                            </p>
                            <p>
                              <strong>Year:</strong> {{ selectedTutor?.year || 'No year provided' }}
                            </p>
                          </div>
                        </v-card-text>

                        <v-card-actions class="justify-center pb-4">
                          <v-btn
                            color="primary"
                            @click="profileDialog = false"
                            class="font-weight-bold"
                            >CLOSE</v-btn
                          >
                        </v-card-actions>
                      </v-card>
                    </v-dialog>

                    <!-- Appointment Dialog -->
                    <v-dialog
                      v-model="appointmentDialog"
                      max-width="500px"
                      transition="scale-transition"
                    >
                      <v-card
                        :class="
                          currentTheme === 'dark'
                            ? 'bg-grey-darken-3 text-white'
                            : 'bg-white text-black'
                        "
                      >
                        <v-card-text class="text-center py-6 px-4">
                          <h2 class="font-weight-bold mb-4">
                            Appointment with {{ selectedTutor?.first_name || 'Mentor' }}
                          </h2>

                          <div class="d-flex flex-column align-center" style="gap: 20px">
                            <!-- Date Picker -->
                     
<v-date-picker
  v-model="selectedDate"
  v-model:dialog="datePickerOpen"
  color="primary"
  class="mx-auto"
  style="max-width: 300px"
/>

<!-- Time Picker -->
<v-time-picker
  v-if="selectedDate"
  v-model="selectedTime"
  v-model:dialog="timePickerOpen"
  format="12hr"
  color="primary"
  class="mx-auto"
  style="max-width: 300px"
  :disabled="!selectedDate"
/>


                            <!-- Message Input -->
                            <v-textarea
                              v-if="selectedDate"
                              v-model="messageInput"
                              label="Your Message"
                              placeholder="Type your message here..."
                              rows="3"
                              density="compact"
                              hide-details
                              style="max-width: 300px"
                            ></v-textarea>
                          </div>
                        </v-card-text>

                        <v-card-actions class="justify-center pb-4">
                          <v-btn
                            color="grey"
                            variant="outlined"
                            @click="appointmentDialog = false"
                            class="font-weight-bold"
                          >
                            CANCEL
                          </v-btn>
                          <v-btn color="primary" @click="saveAppointment" class="font-weight-bold">
                            SAVE
                          </v-btn>
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
    </transition>
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
