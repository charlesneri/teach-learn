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

const userRatingsMap = computed(() => {
  const map = {}
  for (const rating of userRatings.value) {
    map[rating.appointment_id] = rating.rating
  }
  return map
})
// SNACKBAR & NOTIFICATIONS
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('')
const toggleMenu = () => (notificationMenu.value = !notificationMenu.value)

// USER
const profileImage = ref('')
const currentUserId = ref(null)
const currentUserProfile = ref({
  firstname: '',
  lastname: '',
  avatar_url: '',
  is_public_tutor: false,
})
watch(profileImage, (newVal) => {
  if (newVal) localStorage.setItem('profileImage', newVal)
})

const fetchCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) {
    console.error('Error fetching user:', error)
    return
  }
  if (user) {
    currentUserId.value = user.id
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('firstname,lastname, avatar_url, is_public_tutor')
      .eq('id', user.id)
      .single()
    if (profileError) {
      console.error('Error fetching profile:', profileError)
    } else if (data) {
      currentUserProfile.value = {
        firstname: data.firstname || '',
        lastname: data.lastname || '',
        avatar_url: data.avatar_url || '',
        is_public_tutor: data.is_public_tutor || false,
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
    firstname: '',
    lastname: '',
    avatar_url: '',
    is_public_tutor: false,
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

//live searching
watch(searchQuery, () => {
  snackbar.value = false // Hide any previous search message
})
const fetchStudentAppointments = async () => {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      `id, appointment_date, appointment_time, message, created_at,
         mentor:mentor_id(id, firstname, lastname),
         student:student_id(id, firstname, lastname)`,
    )
    .eq('student_id', currentUserId.value)
    .order('appointment_date', { ascending: true })
  if (error) {
    console.error('Error fetching student appointments:', error)
    return []
  }
  return data || []
}
//
const selectedMentorProfile = ref(null)

const viewedProfile = computed(() => {
  return selectedStudentProfile.value || selectedMentorProfile.value
})

//for the new entry label
const isNewAppointment = (createdAt) => {
  if (!createdAt) return false
  const now = new Date()
  const created = new Date(createdAt)
  return now - created < 1000 * 60 * 60 * 24 // 24 hours
}
const viewedAppointments = ref(
  new Set(JSON.parse(localStorage.getItem('viewedAppointments') || '[]')),
)

//until here
const fetchMentorAppointments = async () => {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      `id, appointment_date, appointment_time, message, 
             mentor:mentor_id(id, firstname, lastname),
             student:student_id(id, firstname, lastname)`,
    )
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

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    temp = temp.filter((appointment) => {
      const studentName =
        `${appointment.student?.firstname || ''} ${appointment.student?.lastname || ''}`.toLowerCase()
      const mentorName =
        `${appointment.mentor?.firstname || ''} ${appointment.mentor?.lastname || ''}`.toLowerCase()
      return studentName.includes(query) || mentorName.includes(query)
    })
  }

  // Sort by A-Z or Date
  if (selectedSort.value === 'A-Z') {
    temp.sort((a, b) => {
      const nameA = `${a.student?.firstname || ''} ${a.student?.lastname || ''}`.toLowerCase()
      const nameB = `${b.student?.firstname || ''} ${b.student?.lastname || ''}`.toLowerCase()
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
  selectedMentorProfile.value = null

  // Get mentor's average rating
  const result = await getAverageRatingForMentor(appointment.mentor?.id)
  mentorAverageRating.value = result

  // Determine which profile to show based on who is logged in
  const isCurrentUserStudent = currentUserId.value === appointment.student?.id
  const profileIdToFetch = isCurrentUserStudent ? appointment.mentor?.id : appointment.student?.id

  const { data, error } = await supabase
    .from('profiles')
    .select('firstname, lastname, email, phone, about, school, course, year, expertise, avatar_url')
    .eq('id', profileIdToFetch)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
  } else {
    if (isCurrentUserStudent) {
      selectedMentorProfile.value = data
    } else {
      selectedStudentProfile.value = data
    }
  }

  detailsDialog.value = true
  if (appointment.id && !viewedAppointments.value.has(appointment.id)) {
    viewedAppointments.value.add(appointment.id)
    localStorage.setItem('viewedAppointments', JSON.stringify([...viewedAppointments.value]))
  }
}
//helperfunctions for toe viewed label
const isViewedByUser = (appointmentId) => {
  return viewedAppointments.value.has(appointmentId)
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
// rating dialog
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

  // Check if the user has already rated this appointment
  if (hasRatedAppointment(selectedAppointment.value.id)) {
    snackbarMsg.value = 'You can only rate this session once.'
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
    snackbarMsg.value = 'Error submitting rating.'
    snackbarColor.value = 'red'
  } else {
    snackbarMsg.value = 'Rating submitted successfully!'
    snackbarColor.value = 'green'
    ratingDialog.value = false

    // Update the userRatings state after submission
    userRatings.value.push(payload) // Add the newly rated appointment to the state

    // Refresh the appointment list or ratings list to reflect the changes
    await fetchUserRatings() // You can re-fetch the ratings after submitting
  }

  snackbar.value = true
}

//for rating rule
const canRateAppointment = (appointment) => {
  return currentUserId.value === appointment.student?.id && !hasRatedAppointment(appointment.id)
}

//for delete function
const deleteDialog = ref(false)
const appointmentToDelete = ref(null)

const confirmDeleteAppointment = (appointment) => {
  appointmentToDelete.value = appointment
  deleteDialog.value = true
}

const deleteAppointment = async () => {
  if (!appointmentToDelete.value?.id) return

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
  }

  const { error: insertError } = await supabase.from('deleted_appointments').insert(deletedPayload)

  if (insertError) {
    console.error('Failed to insert deleted appointment:', insertError)
    snackbarMsg.value = 'Failed to log deletion.'
    snackbarColor.value = 'red'
    snackbar.value = true
    return
  }

  // DELETE from appointments
  const { error: deleteError } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentToDelete.value.id)

  if (deleteError) {
    console.error('Error deleting appointment:', deleteError)
    snackbarMsg.value = 'Failed to delete appointment.'
    snackbarColor.value = 'red'
  } else {
    snackbarMsg.value = 'Appointment deleted and logged.'
    snackbarColor.value = 'green'
    await fetchAppointments() // refresh list
  }

  deleteDialog.value = false
  snackbar.value = true
}

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
  const found = userRatings.value.find((r) => r.appointment_id === appointmentId)
  return found ? found.rating : null
}
// adding the ratings and get avg
const getAverageRatingForMentor = async (mentorId) => {
  const { data, error } = await supabase.from('ratings').select('rating').eq('mentor_id', mentorId)

  if (error || !data || data.length === 0) {
    console.error('Error fetching ratings:', error)
    return { average: null, count: 0 }
  }

  const total = data.reduce((sum, entry) => sum + entry.rating, 0)
  const average = (total / data.length).toFixed(1)
  return {
    average,
    count: data.length,
  }
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
// For checking if the user has already rated the appointment
const hasRatedAppointment = (appointmentId) => {
  // Check if the user has already rated the appointment
  const existingRating = userRatings.value.find((rating) => rating.appointment_id === appointmentId)
  return existingRating !== undefined
}

//display time and date
const formatAppointmentDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return ''
  const date = new Date(`${dateStr}T${timeStr}`)
  const options = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  return date.toLocaleString(undefined, options)
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
          <!--avatar display-->
          <v-avatar size="100" class="mb-3">
            <v-img
              v-if="currentUserProfile.avatar_url"
              :src="currentUserProfile.avatar_url"
              cover
            />
            <v-icon v-else size="80">mdi-account</v-icon>
          </v-avatar>
          <h3>{{ currentUserProfile.firstname }} {{ currentUserProfile.lastname }}</h3>
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

          <v-list-item
            :to="'/DeleteHistory'"
            tag="RouterLink"
            @click="isMobile && (drawer = false)"
          >
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
          <v-avatar  :style="{
                backgroundColor: currentTheme === 'dark' ? '#1565c0' : '#ffffff',
                color: currentTheme === 'dark' ? '#ffffff' : '#000000',
              }" size="50" class="logo me-6">
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
    <v-main
      :style="{
        backgroundColor: currentTheme === 'dark' ? '#222222' : '#fefcf9',
        color: currentTheme === 'dark' ? '#ffffff' : '#000000',
      }"
    >
      <v-container fluid class="py-2 px-2">
        <v-row justify="center">
          <v-col cols="12" sm="11" md="8">
            <transition name="slide-fade-scale">
            <v-sheet
              class="pa-3 pa-sm-4 text-center mt-5"
              elevation="1"
              rounded="lg"
              style="max-width: 1200px; min-height: 90vh"
              :style="{
                backgroundColor: currentTheme === 'dark' ? '#424242' : '',
                color: currentTheme === 'dark' ? '#ffffff' : '#000000',
              }"
            >
              <!-- Title -->
              <h1 class="mb-3">Appointments</h1>
           

              <!-- Search & Sort -->
              <v-row class="mb-3" dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="searchQuery"
                    placeholder="Search by name"
                    variant="solo-filled"
                    density="comfortable"
                    rounded="lg"
                    hide-details
                    class="elevation-2 search-box"
                    append-inner-icon="mdi-magnify"
                    @keydown.enter="performSearch"
                    @click:append-inner="performSearch"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="selectedSort"
                    :items="[
                      { title: 'Name (A-Z)', value: 'A-Z' },
                      { title: 'Date', value: 'Date' },
                    ]"
                    item-title="title"
                    item-value="value"
                    label="Sort By"
                    variant="solo-filled"
                    density="comfortable"
                    rounded="lg"
                    flat
                    hide-details
                    class="elevation-2 sort-box"
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
                    <!-- "New" badge  for the new and viewed-->
                    <v-list-item-title class="appointment-title">
                      <div class="d-flex flex-column align-center">
                        <v-chip
                          v-if="
                            !isViewedByUser(appointment.id) &&
                            isNewAppointment(appointment.created_at)
                          "
                          color="green"
                          size="small"
                          label
                          class="mb-2"
                        >
                          NEW
                        </v-chip>
                        <v-chip
                          v-else-if="isViewedByUser(appointment.id)"
                          color="grey"
                          size="small"
                          label
                          class="mb-2"
                        >
                          VIEWED
                        </v-chip>

                        <div class="text-center">
                          <span class="text-caption text-grey">Appointment between</span><br />

                          <span class="role-label">
                            <span>Client:</span>
                            {{ appointment.student?.firstname }} {{ appointment.student?.lastname }}
                          </span>
                          <br />

                          <span class="role-label">
                            <span>Mentor:</span>
                            {{ appointment.mentor?.firstname }} {{ appointment.mentor?.lastname }}
                          </span>

                          <br />
                          <!--display time and date-->
                          <span class="text-caption text-grey mt-2">
                            {{
                              formatAppointmentDateTime(
                                appointment.appointment_date,
                                appointment.appointment_time,
                              )
                            }}
                          </span>
                        </div>
                      </div>
                    </v-list-item-title>

                    <v-list-item-subtitle class="appointment-subtitle text-center mt-2">
                      <div v-if="getRatingForAppointment(appointment.id)">
                        <v-rating
                          v-model="userRatingsMap[appointment.id]"
                          readonly
                          color="amber"
                          background-color="grey lighten-2"
                          density="compact"
                          half-increments
                          size="22"
                          class="mx-auto"
                        />
                      </div>
                    </v-list-item-subtitle>

                    <!-- View Details -->
                    <div
                      class="d-flex justify-center align-center"
                      style="gap: 16px; flex-wrap: wrap"
                    >
                      <v-btn
                        size="small"
                        color="primary"
                        variant="text"
                        @click="openAppointmentDetails(appointment)"
                      >
                        View Details
                      </v-btn>
                      <v-btn
                        size="small"
                        color="error"
                        variant="text"
                        @click="confirmDeleteAppointment(appointment)"
                      >
                        Delete
                      </v-btn>
                      <v-btn
                        v-if="canRateAppointment(appointment)"
                        size="small"
                        color="amber"
                        variant="text"
                        @click="openRatingDialog(appointment)"
                      >
                        Rate
                      </v-btn>

                      <v-btn
                        size="small"
                        color="success"
                        variant="text"
                        @click="openEditDialog(appointment)"
                      >
                        Edit Appointment
                      </v-btn>
                    </div>
                  </v-list-item>
                </v-list>
                <v-dialog v-model="detailsDialog" max-width="500px" transition="scale-transition">
                  <v-card
                    :class="
                      currentTheme === 'dark'
                        ? 'bg-grey-darken-3 text-white'
                        : 'bg-white text-black'
                    "
                    class="ma-5 d-flex"
                  >
                    <v-card-title class="text-h6 font-weight-bold text-center">
                      Appointment & {{ selectedStudentProfile ? 'Student' : 'Mentor' }} Details
                    </v-card-title>

                    <v-card-text>
                      <div
                        v-if="selectedStudentProfile || selectedMentorProfile"
                        class="d-flex justify-start"
                      >
                        <!-- Avatar Section -->
                        <div class="text-center mr-4">
                          <v-avatar size="100">
                            <v-img
                              v-if="viewedProfile?.avatar_url"
                              :src="viewedProfile.avatar_url"
                              cover
                            >
                              <template #error>
                                <v-icon size="80" color="grey-darken-1">mdi-account</v-icon>
                              </template>
                            </v-img>
                            <v-icon v-else size="80" color="grey-darken-1">mdi-account</v-icon>
                          </v-avatar>
                        </div>

                        <!-- Profile Info Section -->
                        <div class="d-flex flex-column">
                          <p>
                            <strong>Name:</strong> {{ viewedProfile?.firstname }}
                            {{ viewedProfile?.lastname }}
                          </p>
                          <p><strong>Email:</strong> {{ viewedProfile?.email }}</p>
                          <p>
                            <strong>Phone:</strong> {{ viewedProfile?.phone || 'No phone number' }}
                          </p>
                          <p></p>
                          <p>
                            <strong>Expertise:</strong>
                            {{ viewedProfile?.expertise || 'Not specified' }}
                          </p>
                          <p>
                            <strong>School/University:</strong>
                            {{ viewedProfile?.school || 'No school listed' }}
                          </p>
                          <p>
                            <strong>Course/Degree:</strong>
                            {{ viewedProfile?.course || 'No course listed' }}
                          </p>
                          <p>
                            <strong>Year:</strong> {{ viewedProfile?.year || 'No year listed' }}
                          </p>
                          <p>
                            <strong>About:</strong> {{ viewedProfile?.about || 'No about info' }}
                          </p>
                          <v-divider class="my-4"></v-divider>
                          <h4 class="text-subtitle-1 font-weight-bold mb-2">Appointment Details</h4>
                          <p><strong>Date:</strong> {{ selectedAppointment?.appointment_date }}</p>
                          <p><strong>Time:</strong> {{ selectedAppointment?.appointment_time }}</p>
                          <p>
                            <strong>Message:</strong>
                            {{ selectedAppointment?.message || 'No message provided' }}
                          </p>
                        </div>
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
            </transition>

          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
  <v-dialog v-model="ratingDialog" max-width="400px">
    <v-card
      :class="currentTheme === 'dark' ? 'bg-grey-darken-3 text-white' : 'bg-white text-black'"
    >
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
    <v-card
      :class="currentTheme === 'dark' ? 'bg-grey-darken-3 text-white' : 'bg-white text-black'"
    >
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
    <v-card
      :class="currentTheme === 'dark' ? 'bg-grey-darken-3 text-white' : 'bg-white text-black'"
    >
      <v-card-title class="text-h6 font-weight-bold text-center">Edit Appointment</v-card-title>
      <v-card-text>
        <v-text-field v-model="editedAppointment.appointment_date" label="Date" type="date" dense />
        <v-text-field v-model="editedAppointment.appointment_time" label="Time" type="time" dense />
        <v-textarea v-model="editedAppointment.message" label="Message" rows="3" dense />
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
/**add style for sort */

.sort-box:hover {
  border-color: #64b5f6;
  box-shadow: 0 2px 12px rgba(100, 181, 246, 0.3);
}

.sort-box .v-select__selection {
  font-size: 16px;
  padding-left: 10px;
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
/* Enhanced Slide + Fade + Scale on Enter */
.slide-fade-scale-enter-active {
  animation: slideFadeScaleIn 0.6s ease-out;
}
.slide-fade-scale-leave-active {
  animation: slideFadeScaleOut 0.4s ease-in forwards;
}
@keyframes slideFadeScaleIn {
  0% {
    opacity: 0;
    transform: translateY(40px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes slideFadeScaleOut {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
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

/*add style for live search */

.search-box input {
  font-size: 16px;
  padding: 10px 12px;
}

.search-box:hover {
  border-color: #64b5f6;
  box-shadow: 0 2px 12px rgba(100, 181, 246, 0.3);
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
/*for chip*/
.v-chip--label.green {
  box-shadow: 0 0 8px #4caf50;
}
.role-label {
  font-size: 15px;
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
