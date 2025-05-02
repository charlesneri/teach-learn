<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

// THEME
const theme = useTheme()
const currentTheme = ref(localStorage.getItem('theme') || 'light')
watch(currentTheme, (val) => {
  theme.global.name.value = val
  localStorage.setItem('theme', val)
})
const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  theme.global.name.value = currentTheme.value
  localStorage.setItem('theme', currentTheme.value)
}

// ROUTER & UI
const router = useRouter()
const drawer = ref(false)
const mini = ref(false)
const isMobile = ref(false)
const showSearch = ref(false)
const toggleDrawer = () => (drawer.value = !drawer.value)
const toggleSearch = () => {
  if (showSearch.value) searchQuery.value = ''
  showSearch.value = !showSearch.value
}
const closeSearch = () => {
  showSearch.value = false
  searchQuery.value = ''
}
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// SNACKBAR & NOTIFICATIONS
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('')
const toggleMenu = () => (notificationMenu.value = !notificationMenu.value)

// USER
const profileImage = ref('')
const currentUserId = ref(null)
const currentUserProfile = ref({
  firstName: '',
  lastName: '',
  avatarUrl: '',
  isPublicTutor: false,
})
watch(profileImage, (newVal) => {
  if (newVal) localStorage.setItem('profileImage', newVal)
})

const fetchCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error fetching user:', error)
    return
  }
  if (user) {
    currentUserId.value = user.id
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, is_public_tutor')
      .eq('id', user.id)
      .single()
    if (profileError) {
      console.error('Error fetching profile:', profileError)
    } else if (data) {
      currentUserProfile.value = {
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        avatarUrl: data.avatar_url || '',
        isPublicTutor: data.is_public_tutor || false,
      }
    }
  }
}

// LOGOUT
const handleLogoutClick = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Logout failed:', error.message)
    snackbarMsg.value = 'Logout failed. Try again.'
    snackbarColor.value = 'red'
    snackbar.value = true
    return
  }
  currentUserId.value = null
  currentUserProfile.value = {
    firstName: '',
    lastName: '',
    avatarUrl: '',
    isPublicTutor: false,
  }
  localStorage.removeItem('theme')
  snackbarMsg.value = 'Logged out successfully!'
  snackbarColor.value = 'green'
  snackbar.value = true
  setTimeout(() => {
    router.push('/')
  }, 1000)
}

// APPOINTMENTS
const searchQuery = ref('')
const selectedSort = ref('')
const appointments = ref([])

const fetchStudentAppointments = async () => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`id, appointment_date, appointment_time, message, created_at,
         mentor:mentor_id(id, first_name, last_name),
         student:student_id(id, first_name, last_name)`)
    .eq('student_id', currentUserId.value)
    .order('appointment_date', { ascending: true })
  if (error) {
    console.error('Error fetching student appointments:', error)
    return []
  }
  return data || []
}

//for the new entry label
const isNewAppointment = (createdAt) => {
  if (!createdAt) return false
  const now = new Date()
  const created = new Date(createdAt)
  return (now - created) < 1000 * 60 * 60 * 24 // within 24 hours
}
//until here
const fetchMentorAppointments = async () => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`id, appointment_date, appointment_time, message, 
             mentor:mentor_id(id, first_name, last_name),
             student:student_id(id, first_name, last_name)`)
    .eq('mentor_id', currentUserId.value)
    .order('appointment_date', { ascending: true })
  if (error) {
    console.error('Error fetching mentor appointments:', error)
    return []
  }
  return data || []
}

const fetchAppointments = async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    console.error('Error fetching user:', userError)
    return
  }
  currentUserId.value = userData.user.id
  const [studentAppointments, mentorAppointments] = await Promise.all([
    fetchStudentAppointments(),
    fetchMentorAppointments(),
  ])
  appointments.value = [...studentAppointments, ...mentorAppointments]
}

const filteredAppointments = computed(() => {
  let temp = [...appointments.value]
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    temp = temp.filter((appointment) => {
      const studentName = `${appointment.student?.first_name || ''} ${appointment.student?.last_name || ''}`.toLowerCase()
      const mentorName = `${appointment.mentor?.first_name || ''} ${appointment.mentor?.last_name || ''}`.toLowerCase()
      return studentName.includes(query) || mentorName.includes(query)
    })
  }
  if (selectedSort.value === 'A-Z') {
    temp.sort((a, b) => {
      const nameA = `${a.student?.first_name || ''} ${a.student?.last_name || ''}`.toLowerCase()
      const nameB = `${b.student?.first_name || ''} ${b.student?.last_name || ''}`.toLowerCase()
      return nameA.localeCompare(nameB)
    })
  } else if (selectedSort.value === 'Date') {
    temp.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
  }
  return temp
})

const performSearch = () => {
  if (searchQuery.value.trim()) {
    snackbarMsg.value = `You searched for: "${searchQuery.value}"`
    snackbarColor.value = 'info'
    snackbar.value = true
  }
}

const selectedAppointment = ref(null)
const selectedStudentProfile = ref(null)
const detailsDialog = ref(false)
const mentorAverageRating = ref(null)

//appointment
const openAppointmentDetails = async (appointment) => {
  selectedAppointment.value = appointment
  selectedStudentProfile.value = null

  // Get mentor's average rating
  const avg = await getAverageRatingForMentor(appointment.mentor?.id)
  mentorAverageRating.value = avg

  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, phone, about, school, degree, year, expertise, avatar_url')
    .eq('id', appointment.student?.id)
    .single()

  if (error) {
    console.error('Error fetching student profile:', error)
  } else {
    selectedStudentProfile.value = data
  }

  detailsDialog.value = true
}

onMounted(async () => {
  await fetchAppointments()
  await fetchCurrentUser()
  await fetchUserRatings()
  theme.global.name.value = currentTheme.value
  checkMobile()
  window.addEventListener('resize', checkMobile)
  const storedImage = localStorage.getItem('profileImage')
  if (storedImage) profileImage.value = storedImage
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
})
// tating dialog
const ratingDialog = ref(false)
const userRating = ref(0)
const ratingMentorId = ref(null)

const openRatingDialog = (appointment) => {
  selectedAppointment.value = appointment
  userRating.value = 0
  ratingDialog.value = true
}
//submit ratings
const submitRating = async () => {
  if (
    !selectedAppointment.value?.id ||
    !selectedAppointment.value?.mentor?.id ||
    !currentUserId.value ||
    !userRating.value
  ) {
    snackbarMsg.value = 'Please complete the rating information.'
    snackbarColor.value = 'red'
    snackbar.value = true
    return
  }

  const payload = {
    appointment_id: selectedAppointment.value.id,
    mentor_id: selectedAppointment.value.mentor.id,
    student_id: currentUserId.value,
    rating: userRating.value,
  }

  console.log('Submitting rating payload:', payload)

  const { error } = await supabase.from('ratings').upsert(payload)

  if (error) {
    console.error('Rating error:', error)
    snackbarMsg.value = 'Sorry, You can only rate once per session.'
    snackbarColor.value = 'red'
  } else {
    snackbarMsg.value = 'Rating submitted successfully!'
    snackbarColor.value = 'green'
    ratingDialog.value = false
  }

  snackbar.value = true
}

//for delete function
const deleteDialog = ref(false)
const appointmentToDelete = ref(null)

const confirmDeleteAppointment = (appointment) => {
  appointmentToDelete.value = appointment
  deleteDialog.value = true
}

const deleteAppointment = async () => {
  if (!appointmentToDelete.value?.id) return;

  // INSERT INTO deleted_appointments
  const deletedPayload = {
    original_appointment_id: appointmentToDelete.value.id,
    deleted_by: currentUserId.value,
    appointment_date: appointmentToDelete.value.appointment_date,
    appointment_time: appointmentToDelete.value.appointment_time,
    mentor_id: appointmentToDelete.value.mentor?.id,
    student_id: appointmentToDelete.value.student?.id,
    message: appointmentToDelete.value.message,
    deleted_at: new Date().toISOString(),
  };

  const { error: insertError } = await supabase
    .from('deleted_appointments')
    .insert(deletedPayload);

  if (insertError) {
    console.error('Failed to insert deleted appointment:', insertError);
    snackbarMsg.value = 'Failed to log deletion.';
    snackbarColor.value = 'red';
    snackbar.value = true;
    return;
  }

  // DELETE from appointments
  const { error: deleteError } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentToDelete.value.id);

  if (deleteError) {
    console.error('Error deleting appointment:', deleteError);
    snackbarMsg.value = 'Failed to delete appointment.';
    snackbarColor.value = 'red';
  } else {
    snackbarMsg.value = 'Appointment deleted and logged.';
    snackbarColor.value = 'green';
    await fetchAppointments(); // refresh list
  }

  deleteDialog.value = false;
  snackbar.value = true;
};

//fetch appointments
const userRatings = ref([])

const fetchUserRatings = async () => {
  const { data, error } = await supabase
    .from('ratings')
    .select('appointment_id, rating')
    .eq('student_id', currentUserId.value)

  if (error) {
    console.error('Error fetching ratings:', error)
    return
  }

  userRatings.value = data || []
}
const getRatingForAppointment = (appointmentId) => {
  const found = userRatings.value.find(r => r.appointment_id === appointmentId)
  return found ? found.rating : null
}
// adding the ratings and get avg
const getAverageRatingForMentor = async (mentorId) => {
  const { data, error } = await supabase
    .from('ratings')
    .select('rating')
    .eq('mentor_id', mentorId)

  if (error || !data) {
    console.error('Error fetching average rating:', error)
    return null
  }

  if (data.length === 0) return null

  const total = data.reduce((sum, entry) => sum + entry.rating, 0)
  return (total / data.length).toFixed(1)
}

//for edit appointments
const editDialog = ref(false)
const editedAppointment = ref({
  id: '',
  appointment_date: '',
  appointment_time: '',
  message: '',
})
const openEditDialog = (appointment) => {
  editedAppointment.value = { ...appointment }
  editDialog.value = true
}
const updateAppointment = async () => {
  const { error } = await supabase
    .from('appointments')
    .update({
      appointment_date: editedAppointment.value.appointment_date,
      appointment_time: editedAppointment.value.appointment_time,
      message: editedAppointment.value.message,
    })
    .eq('id', editedAppointment.value.id)

  if (error) {
    snackbarMsg.value = 'Failed to update appointment.'
    snackbarColor.value = 'red'
  } else {
    snackbarMsg.value = 'Appointment updated successfully!'
    snackbarColor.value = 'green'
    editDialog.value = false
    await fetchAppointments()
  }
  snackbar.value = true
}

</script>

<template>
  <v-app id="inspire">
  
<!-- Drawer Sidebar (right, collapsible) -->
    <transition name="fade-slide-up">
      <v-navigation-drawer
        v-if="drawer"
        :temporary="isMobile"
        :permanent="!isMobile"
        :width="isMobile ? '100%' : 280"
        right
        app
        :scrim="isMobile"
        :style="{
            backgroundColor: currentTheme === 'dark' ? '#424242' : '',
            color: currentTheme === 'dark' ? '#ffffff' : '#000000',
          }"
      >
        <!-- Menu Icon that toggles drawer size -->
        <v-btn icon class="ms-5 mt-5 d-lg-none" @click="toggleDrawer">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
        <!-- Profile -->
        <v-sheet
          class="pa-4 text-center"
          rounded="lg"
          :style="{
            backgroundColor: currentTheme === 'dark' ? '#424242' : '',
            color: currentTheme === 'dark' ? '#ffffff' : '#000000',
          }"  
        >
          <v-avatar size="100" class="mb-3">
            <v-img v-if="currentUserProfile.avatarUrl" :src="currentUserProfile.avatarUrl" cover />
            <v-icon v-else size="80">mdi-account</v-icon>
          </v-avatar>
          <h3 v-if="!mini">{{ currentUserProfile.firstName }} {{ currentUserProfile.lastName }}</h3>
        </v-sheet>

        <v-divider class="my-2" />

        <v-list nav dense>
          <v-list-item :to="'/home'" tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-home-outline</v-icon>
              <span v-if="!mini" class="icon-mdi">Home</span>
            </div>
          </v-list-item>

          <v-list-item :to="'/about'" tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-information-outline</v-icon>
              <span v-if="!mini" class="icon-mdi">About Us</span>
            </div>
          </v-list-item>

          <v-list-item :to="'/contact'" tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-phone-outline</v-icon>
              <span v-if="!mini" class="icon-mdi">Contact Us</span>
            </div>
          </v-list-item>

          <v-divider class="my-2" />

          <v-list-item :to="'/profile'" tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-account-outline</v-icon>
              <span v-if="!mini" class="icon-mdi">My Profile</span>
            </div>
          </v-list-item>

          <v-list-item :to="'/appointments'" tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-calendar</v-icon>
              <span v-if="!mini" class="icon-mdi">My Appointments</span>
            </div>
          </v-list-item>

          <v-list-item :to="'/DeleteHistory'"  tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px"> mdi-delete-outline</v-icon>
              <span v-if="!mini" class="icon-mdi">Delete History</span>
            </div>
          </v-list-item>

          <v-divider class="my-2" />
          <v-list-item @click="handleLogoutClick">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-logout</v-icon>
              <span v-if="!mini" class="icon-mdi">Logout</span>
            </div>
          </v-list-item>
          <!-- Theme toggle -->
          <div class="text-center mt-4">
            <v-btn icon @click="toggleTheme">
              <v-icon>{{
                currentTheme === 'light' ? 'mdi-weather-night' : 'mdi-white-balance-sunny'
              }}</v-icon>
            </v-btn>
          </div>
        </v-list>
      </v-navigation-drawer>
    </transition>
    <!-- App Bar -->
    <v-app-bar flat :color="currentTheme === 'light' ? '#1565c0' : '#000000'">
      <!-- Menu Icon that toggles drawer size -->
      <v-btn icon class="ms-5" @click="toggleDrawer">
        <v-icon>mdi-menu</v-icon>
      </v-btn>
      <v-container
        class="d-flex align-center pa-0"
        :class="{
          'transition-all': !isMobile,
          'no-transition': isMobile,
        }"
      >
        <div class="search-wrapper">
         
          <v-avatar color="#fff" size="50" class="logo me-6">
            <v-img src="image/Teach&Learn.png" alt="Logo" />
          </v-avatar>
        </div>
      </v-container>

    </v-app-bar>
    <!--pop up alert-->
    <v-snackbar
      v-model="snackbar"
      timeout="3000"
      :color="snackbarColor"
      location="top center"
      style="top: 80px"
    >
      {{ snackbarMsg }}
    </v-snackbar>

    <!-- MAIN CONTENT -->
    <v-main       :style="{
        backgroundColor: currentTheme === 'dark' ? '#222222' : '#fefcf9',
        color: currentTheme === 'dark' ? '#ffffff' : '#000000',
      }">
      <v-container fluid class="py-2 px-2">
        <v-row justify="center">
          <v-col cols="12" sm="11" md="8">
            <v-sheet
       
              class="pa-3 pa-sm-4 text-center"
              elevation="1"
              rounded="lg"
              style="max-width: 1200px; min-height: 90vh"
              :style="{
            backgroundColor: currentTheme === 'dark' ? '#424242' : '',
            color: currentTheme === 'dark' ? '#ffffff' : '#000000',
          }"
            >
              <!-- Title -->
              <h1 class=" mb-3">Appointments</h1>

              <!-- Search & Sort -->
              <v-row class="mb-3" dense>
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

              <!-- Appointment Results -->
              <div v-if="filteredAppointments.length > 0" class="appointments-container">
                <v-list class="appointments-list">
                  <v-list-item
                    v-for="appointment in filteredAppointments"
                    :key="appointment.id"
                    class="appointment-item"
                    :class="
                      currentTheme === 'dark'
                        ? 'bg-grey-darken-3 text-white'
                        : 'bg-white text-black'
                    "
                  >
                    <v-list-item-title class="appointment-title">
                      Appointment between
                      <br />
                      <strong
                        >{{ appointment.student?.first_name }}
                        {{ appointment.student?.last_name }}</strong
                      >
                      <br />
                      and
                      <br />
                      <strong
                        >{{ appointment.mentor?.first_name }}
                        {{ appointment.mentor?.last_name }}</strong
                      >
                    </v-list-item-title>

                    <v-list-item-subtitle class="appointment-subtitle">
                      <div v-if="getRatingForAppointment(appointment.id)" class="text-center mt-2">
                      <v-rating
                        v-model="userRatingsMap[appointment.id]"
                        readonly
                        color="amber"
                        background-color="grey lighten-1"
                        dense
                        half-increments
                        size="20"
                      />
                      <small class="text-grey">You rated this session</small>
                    </div>

                    </v-list-item-subtitle>

                    <!-- View Details -->
                                      <div class="d-flex justify-center align-center" style="gap: 16px; flex-wrap: wrap;">
                    <v-btn size="small" color="primary" variant="text" @click="openAppointmentDetails(appointment)">
                      View Details
                    </v-btn>
                    <v-btn size="small" color="error" variant="text" @click="confirmDeleteAppointment(appointment)">
                      Delete
                    </v-btn>
                    <v-btn size="small" color="amber" variant="text" @click="openRatingDialog(appointment)">
                      Rate
                    </v-btn>
                    <v-btn size="small" color="success" variant="text" @click="openEditDialog(appointment)">
                    Edit Appointment
                  </v-btn>
                  </div>
                
                 
                  </v-list-item>
                </v-list>
                <v-dialog v-model="detailsDialog" max-width="600px" transition="scale-transition">
                  <v-card
                    :class="
                      currentTheme === 'dark'
                        ? 'bg-grey-darken-3 text-white'
                        : 'bg-white text-black'
                    "
                  >
                    <v-card-title class="text-h6 font-weight-bold text-center">
                      Appointment & Student Details
                    </v-card-title>

                    <v-card-text class="text-start">
                    


                      <div v-if="selectedStudentProfile">
                        <h3 class="font-weight-bold mb-2 text-center mt-5 mb-10">Student Profile</h3>

                        <!-- Avatar -->
                        <div class="text-center mb-4">
                          <v-avatar size="100">
                            <v-img
                              v-if="selectedStudentProfile.avatar_url"
                              :src="selectedStudentProfile.avatar_url"
                              cover
                            >
                              <template #error>
                                <v-icon size="80" color="grey-darken-1">mdi-account</v-icon>
                              </template>
                            </v-img>
                            <v-icon v-else size="80" color="grey-darken-1">mdi-account</v-icon>
                          </v-avatar>
                        </div>

                        <!-- Profile Info -->
                        <p class="text-center">
                          <strong >Name:</strong><br> {{ selectedStudentProfile.first_name }}
                          {{ selectedStudentProfile.last_name }}
                        </p class="text-center">
                        <p class="text-center"><strong >Email:</strong><br> {{ selectedStudentProfile.email }}</p>
                        <p class="text-center">
                          <strong>Phone:</strong><br>
                          {{ selectedStudentProfile.phone || 'No phone number' }}
                        </p>
                        <p class="text-center">
                          <strong>Expertise:</strong><br>
                          {{ selectedStudentProfile.expertise || 'Not specified' }}
                        </p>
                        <p class="text-center">
                          <strong>School:</strong><br>
                          {{ selectedStudentProfile.school || 'No school listed' }}
                        </p>
                        <p class="text-center">
                          <strong class="text-center">Degree:</strong><br>
                          {{ selectedStudentProfile.degree || 'No degree listed' }}
                        </p>
                        <p class="text-center">
                          <strong class="text-center">Year:</strong><br>
                          {{ selectedStudentProfile.year || 'No year listed' }}
                        </p>
                        <p class="text-center">
                          <strong class="text-center">About:</strong><br>
                          {{ selectedStudentProfile.about || 'No about info' }}
                        </p>
                      </div>

                      <div v-else class="text-center">
                        <v-progress-circular indeterminate color="primary"></v-progress-circular>
                        <p>Loading student profile...</p>
                      </div>
                      <v-divider class="my-10 wakana"></v-divider>

                      <div v-if="selectedAppointment">
                        <h3 class="font-weight-bold text-center mt-5 mb-10">Appointment Information</h3>
                        <p class="text-center"><strong>Date:</strong> <br>{{ selectedAppointment.appointment_date }}</p>
                        <p class="text-center"><strong>Time:</strong> <br>{{ selectedAppointment.appointment_time }}</p>
                        <p class="text-center">
                          <strong>Message:</strong><br>
                          {{ selectedAppointment.message || 'No message provided' }}
                        </p>
                      </div>
                    </v-card-text>

                    
                    <v-card-actions class="justify-center">
                      <v-btn color="primary" @click="detailsDialog = false">Close</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
                <v-divider></v-divider>
              </div>

              <div v-else class="no-appointments">
                <p>No appointments found.</p>
              </div>

              <!-- If No Appointments -->
              <v-alert v-else type="info" variant="tonal" border="start" density="compact">
                No appointments found. Try searching or adjusting the sort option.
              </v-alert>
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
  <v-dialog v-model="ratingDialog" max-width="400px">
  <v-card :class="currentTheme === 'dark' ? 'bg-grey-darken-3 text-white' : 'bg-white text-black'">
    <v-card-title class="text-h6 font-weight-bold text-center">Rate this Mentor</v-card-title>
    <v-card-text class="d-flex justify-center">
      <v-rating
        v-model="userRating"
        length="5"
        color="amber"
        background-color="grey lighten-1"
        size="36"
        half-increments
        hover
      />
    </v-card-text>
    <v-card-actions class="justify-center">
      <v-btn variant="text" @click="ratingDialog = false">Cancel</v-btn>
      <v-btn color="primary" @click="submitRating">Submit</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
<v-dialog v-model="deleteDialog" max-width="400px">
  <v-card :class="currentTheme === 'dark' ? 'bg-grey-darken-3 text-white' : 'bg-white text-black'">
    <v-card-title class="text-h6 font-weight-bold text-center">Confirm Deletion</v-card-title>
    <v-card-text class="text-center">
      Are you sure you want to delete this appointment?
    </v-card-text>
    <v-card-actions class="justify-center">
      <v-btn text @click="deleteDialog = false">Cancel</v-btn>
      <v-btn color="error" @click="deleteAppointment">Yes, Delete</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
<!--for appointment edit-->
<v-dialog v-model="editDialog" max-width="500px">
  <v-card :class="currentTheme === 'dark' ? 'bg-grey-darken-3 text-white' : 'bg-white text-black'">
    <v-card-title class="text-h6 font-weight-bold text-center">Edit Appointment</v-card-title>
    <v-card-text>
      <v-text-field
        v-model="editedAppointment.appointment_date"
        label="Date"
        type="date"
        dense
      />
      <v-text-field
        v-model="editedAppointment.appointment_time"
        label="Time"
        type="time"
        dense
      />
      <v-textarea
        v-model="editedAppointment.message"
        label="Message"
        rows="3"
        dense
      />
    </v-card-text>
    <v-card-actions class="justify-center">
      <v-btn text @click="editDialog = false">Cancel</v-btn>
      <v-btn color="primary" @click="updateAppointment">Save Changes</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

</template>

<style scoped>
h1 {
  font-size: 2.5rem; 
  font-weight: 700;
  color: #1565c0; 
  text-align: center; 
  margin-bottom: 20px; 
  text-transform: uppercase; 
  letter-spacing: 2px; 
}
/* Links */
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

/* Appointments Container */
.appointments-container {
  width: 100%;
  max-width: 960px;
  margin: auto;
  padding: 24px;
}

.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Appointment Item */
.appointment-item {
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 28px;
  min-height: 200px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s,
    box-shadow 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.appointment-item:hover {
  transform: translateY(-8px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.appointment-title {
  font-size: 1.4rem;
  font-weight: 800;
  margin-bottom: 12px;
  color: #1565c0;
  text-align: center;
  word-break: break-word;
  line-height: 1.5;
}

.appointment-subtitle {
  font-size: 1rem;
  color: #d3d0d0;
  line-height: 1.6;
  text-align: center;
  word-break: break-word;
}

/* Dialog & Details Styling */
.v-dialog .v-card {
  border-radius: 16px;
}

.v-card-title {
  font-size: 1.6rem;
  font-weight: bold;
  text-align: center;
}

.v-card-text p {
  margin: 6px 0;
  font-size: 1rem;
}

/* Profile Avatar */
.v-avatar {
  margin: auto;
}

/* Fade Slide Up Animation for Dialog */
.fade-slide-up-enter-active,
.fade-slide-up-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.fade-slide-up-enter-from,
.fade-slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Responsive for Mobile */
@media (max-width: 600px) {
  .appointments-container {
    padding: 16px;
  }

  .appointment-item {
    padding: 20px;
    min-height: 160px;
  }
  .appointment-title {
    font-size: 1.1rem;
    line-height: 1.4;
  }

  .appointment-subtitle {
    font-size: 0.95rem;
  }
  .v-dialog {
    max-width: 90%;
    margin: 0 auto;
  }

  .v-card-title {
    font-size: 1.4rem;
  }

  .v-card-text p {
    font-size: 0.95rem;
  }

  .v-avatar {
    width: 80px;
    height: 80px;
  }

  /* Text inside appointment readable on small screens */
  .appointment-item {
    word-break: break-word;
    text-align: center;
  }
}

/*sa drawer*/


/* General Styling */
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

/* Fade Animation */
.fade-in {
  animation: fadeIn 0.6s ease-in;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Drawer & App Bar */
.v-navigation-drawer {
  transition: all 0.3s ease;
}
.v-main {
  transition: margin-right 0.3s ease;
}
.drawer-hidden {
  display: none !important;
}

/* Search Bar Styling */
.search-wrapper {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  z-index: 10;
  max-width: none;
  flex-wrap: nowrap;
}
.search-input {
  width: 240px;
  max-width: none;
  transition: width 0.3s ease;
}
.logo {
  width: 50px;
  height: 50px;
}
.large-icon ::v-deep(.v-field__append-inner .v-icon) {
  font-size: 28px !important;
}

/* Drawer Animation */
.fade-slide-up-enter-active {
  animation: fadeSlideUp 0.6s ease;
}
@keyframes fadeSlideUp {
  0% {
    opacity: 0;
    transform: translateY(24px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Transition for Lists */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.fade-slide-move {
  transition: transform 0.3s ease;
}

/* Mobile Responsiveness */
@media (max-width: 600px) {
  .v-dialog__content {
    padding: 8px !important;
  }
  .v-card-text,
  .v-card-actions {
    padding: 12px !important;
    flex-direction: column;
    gap: 10px;
  }
  .v-navigation-drawer {
    width: 100% !important;
  }
  .v-main {
    padding-top: 64px;
  }
  .search-input {
    width: 150px;
    max-width: 100%;
  }
  .search-wrapper {
    right: 12px;
    gap: 8px;
  }
  .logo {
    width: 40px;
    height: 40px;
  }
  h1 {
    font-size: 1.8rem;
    letter-spacing: 0.2rem;
  }
}
</style>