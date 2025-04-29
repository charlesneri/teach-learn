<script setup>
import { ref, onMounted, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter, RouterLink } from 'vue-router'
import { supabase } from '@/utils/supabase'

const datePickerOpen = ref(false)
const timePickerOpen = ref(false)

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
const snackbarColor = ref('')
const currentUserId = ref(null)
const currentUserProfile = ref({ firstName: '', lastName: '', avatarUrl: '', isPublicTutor: false })

// FETCH USER
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
  if (!selectedDate.value || !selectedTime.value || !selectedTutor.value || !currentUserId.value) {
    snackbarMsg.value = 'Please complete all fields before booking.'
    snackbarColor.value = 'red'
    snackbar.value = true
    return
  }

  const { error } = await supabase.from('appointments').insert({
    student_id: currentUserId.value,
    mentor_id: selectedTutor.value.id,
    student_name: `${currentUserProfile.firstName} ${currentUserProfile.lastName}`,
    appointment_date: selectedDate.value,
    appointment_time: selectedTime.value,
    message: messageInput.value,
    status: 'Pending',
  })

  snackbar.value = true
  if (error) {
    console.error('Error saving appointment:', error)
    snackbarMsg.value = 'Failed to book appointment. Try again.'
    snackbarColor.value = 'red'
  } else {
    snackbarMsg.value = 'Appointment booked successfully!'
    snackbarColor.value = 'green'

    appointmentDialog.value = false

    setTimeout(() => {
      selectedDate.value = ''
      selectedTime.value = ''
      messageInput.value = ''
      datePickerOpen.value = false
      timePickerOpen.value = false
    }, 300)
  }
}



// MOUNT
onMounted(async () => {
  theme.global.name.value = currentTheme.value
  await fetchCurrentUser()
  await fetchTutors()
})
<<<<<<< HEAD
<<<<<<< HEAD
//for alert
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')  // default color green

const saveAppointment = async () => {
  try {
    if (!selectedTutor.value || !selectedDate.value || !selectedTime.value) {
      snackbarMsg.value = 'Please fill all fields!'
      snackbarColor.value = 'error'    // 🔥 RED if incomplete
      snackbar.value = true
      return
    }

    const { error } = await supabase.from('appointments').insert([
      {
        mentor_id: selectedTutor.value.id,
        student_id: currentUserId.value,
        student_name: currentUserProfile.firstName + ' ' + currentUserProfile.lastName,
        message: messageInput.value,
        appointment_date: selectedDate.value,
        appointment_time: selectedTime.value,
        status: 'pending',
        created_at: new Date()
      }
    ])

    if (error) throw error

    appointmentDialog.value = false
    selectedDate.value = null
    selectedTime.value = null
    messageInput.value = ''

    snackbarMsg.value = 'Appointment request sent successfully!'
    snackbarColor.value = 'success'   // ✅ GREEN if successful
    snackbar.value = true

  } catch (err) {
    console.error('Error saving appointment:', err)
    snackbarMsg.value = 'Failed to send appointment. Try again.'
    snackbarColor.value = 'error'    // 🔥 RED if failed
    snackbar.value = true
  }
}


=======

// a,bot

const appointments = ref([])

const fetchAppointments = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  currentUserId.value = user.id

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('student_id', user.id)
    .order('appointment_date', { ascending: true })

  if (data) {
    appointments.value = data
  } else {
    console.error('Error fetching appointments:', error)
  }
}

>>>>>>> feat/supabase
=======
>>>>>>> development2
</script>

<<<<<<< HEAD
=======
<!-- Your existing template and styles remain unchanged -->

>>>>>>> feat/appointment
<template>
  <v-app id="inspire">
    <v-app-bar flat :color="currentTheme === 'light' ? '#1565c0' : 'grey-darken-4'">
<<<<<<< HEAD
  <v-container class="d-flex align-center justify-space-between">

    <!-- Logo -->
    <div class="d-flex align-center gap-4">
      <v-avatar color="#fff" size="50">
        <v-img src="image/Teach&Learn.png" alt="Logo" />
      </v-avatar>
    </div>

    <v-spacer />

    <!-- Desktop Links -->
    <div class="d-none d-md-flex align-center" style="gap: 24px">
      <RouterLink to="/home" class="text-white text-decoration-none font-weight-medium">Home</RouterLink>
      <RouterLink to="/about" class="text-white text-decoration-none font-weight-medium">About Us</RouterLink>
      <RouterLink to="/contact" class="text-white text-decoration-none font-weight-medium">Contact Us</RouterLink>
    </div>

    <v-spacer />

    <!-- Mobile Search + Notification + Hamburger Menu -->
    <v-responsive max-width="300">
      <div class="d-flex align-center gap-2">

        <!-- Search Bar -->
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

        <!-- Notification Bell -->
        <v-menu v-model="notificationMenu" offset-y close-on-content-click>
          <template #activator="{ props }">
            <v-btn icon v-bind="props">
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
            <v-list-item link>
              <RouterLink to="/home" :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']">Home</RouterLink>
            </v-list-item>
            <v-list-item link>
              <RouterLink to="/profile" :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']">My Profile</RouterLink>
            </v-list-item>
            <v-list-item link>
              <RouterLink to="/appointments" :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']">Appointments</RouterLink>
            </v-list-item>
            <v-list-item link>
              <RouterLink to="/about" :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']">About Us</RouterLink>
            </v-list-item>
            <v-list-item link>
              <RouterLink to="/contact" :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']">Contact Us</RouterLink>
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item link>
              <RouterLink to="/" :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']">Logout</RouterLink>
            </v-list-item>
          </v-list>
        </v-menu>

      </div> <!-- end flex -->
    </v-responsive>

  </v-container>
</v-app-bar>

=======
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
<<<<<<< HEAD
=======

            <!-- Mobile Search and Menu -->
>>>>>>> feat/appointment
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
<<<<<<< HEAD
=======
                  <v-list-item link>
                    <RouterLink
                      to="/appointments"
                      :class="[
                        'active-click text-decoration-none',
                        currentTheme === 'dark' ? 'text-white' : 'text-black',
                      ]"
                    >
                     Deleted Appointments
                    </RouterLink>
                  </v-list-item>

>>>>>>> feat/appointment
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
<<<<<<< HEAD
>>>>>>> feat/supabase
=======
    <v-snackbar
      v-model="snackbar"
      timeout="3000"
      :color="snackbarColor"
      location="top center"
      style="top: 80px"
    >
      {{ snackbarMsg }}
    </v-snackbar>
>>>>>>> development2

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
<<<<<<< HEAD
=======
                  <v-list-item
                    link
                    :to="'/DeletedAppointments'"
                    tag="RouterLink"
                    :class="[
                      'active-click text-decoration-none',
                      currentTheme === 'dark' ? 'text-white' : 'text-black',
                    ]"
                  >
                    <v-list-item-title>Deleted Apointments</v-list-item-title>
                  </v-list-item>

>>>>>>> feat/appointment
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
<<<<<<< HEAD
=======

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


<<<<<<< HEAD
        <!-- Time Picker (only after date selected) -->
        <v-time-picker
          v-if="selectedDate"
          v-model="selectedTime"
          format="12hr"
          color="primary"
          class="mx-auto"
          style="max-width: 300px;"
          :disabled="!selectedDate"
          @change="onTimeSelect"
        ></v-time-picker>

        <!-- Message Input -->
        <v-textarea
          v-if="selectedDate"
          v-model="messageInput"
          label="Your Message"
          placeholder="Type your message here..."
          rows="3"
          density="compact"
          hide-details
          style="max-width: 300px;"
        ></v-textarea>
      </div>
    </v-card-text>

    <v-card-actions class="justify-center pb-4">
      <v-btn color="grey" variant="outlined" @click="appointmentDialog = false" class="font-weight-bold">
        CANCEL
      </v-btn>
      <v-btn color="primary" @click="saveAppointment" class="font-weight-bold">
        SAVE
      </v-btn>
      <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000" location="top">
  {{ snackbarMsg }}
  <template #actions>
    <v-btn icon="mdi-close" variant="text" @click="snackbar = false" />
  </template>
</v-snackbar>

    </v-card-actions>
  </v-card>
</v-dialog>
=======
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
>>>>>>> feat/supabase

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
>>>>>>> feat/appointment
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
