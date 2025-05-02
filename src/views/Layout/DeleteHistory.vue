<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

// Theme
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

// Router & UI
const router = useRouter()
const drawer = ref(false)
const mini = ref(false)
const isMobile = ref(false)
const toggleDrawer = () => (drawer.value = !drawer.value)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// Snackbar
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('')

// User
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
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) return console.error('Error fetching user:', error)
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

// Logout
const handleLogoutClick = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
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

// Deleted variables
const deletedAppointments = ref([])
const selectedAppointment = ref(null)
const selectedStudentProfile = ref(null)
const detailsDialog = ref(false)

const fetchDeletedAppointments = async () => {
  const { data, error } = await supabase
    .from('deleted_appointments') // ✅ correct
    .select(
      `
      *,
      mentor:mentor_id(first_name, last_name),
      student:student_id(first_name, last_name)
    `,
    )
    .eq('deleted_by', currentUserId.value)
    .order('deleted_at', { ascending: false })

  if (error) {
    console.error('Error fetching deleted appointments:', error)
    return
  }

  deletedAppointments.value = data || []
}
//open details before deletion
const openAppointmentDetails = async (appointment) => {
  selectedAppointment.value = appointment
  selectedStudentProfile.value = null

  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, phone, about, school, degree, year, expertise, avatar_url')
    .eq('id', appointment.student_id) // FIXED: use student_id directly
    .single()

  if (error) {
    console.error('Error fetching student profile:', error)
  } else {
    selectedStudentProfile.value = data
  }

  detailsDialog.value = true
}

// Delete Permanently
const deleteDialog = ref(false)
const appointmentToDelete = ref(null)
const confirmDeleteAppointment = (appointment) => {
  console.log('Preparing to delete appointment:', appointment)
  appointmentToDelete.value = appointment
  deleteDialog.value = true
}

//delete history logic
const deleteAppointment = async () => {
  if (!appointmentToDelete.value?.id) return

  const { data, error } = await supabase
    .from('deleted_appointments')
    .delete()
    .eq('id', appointmentToDelete.value.id)

  // Add this line right here:
  console.log('Delete response:', { data, error })

  if (error) {
    snackbarMsg.value = 'Failed to permanently delete appointment.'
    snackbarColor.value = 'red'
    snackbar.value = true
    return
  }

  snackbarMsg.value = 'Appointment permanently deleted.'
  snackbarColor.value = 'green'
  snackbar.value = true

  await fetchDeletedAppointments()
  deleteDialog.value = false
}

// Lifecycle
onMounted(async () => {
  await fetchCurrentUser()
  await fetchDeletedAppointments()
  theme.global.name.value = currentTheme.value
  checkMobile()
  window.addEventListener('resize', checkMobile)
  const storedImage = localStorage.getItem('profileImage')
  if (storedImage) profileImage.value = storedImage
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>
<template>
  <v-app id="inspire">
    <!-- Drawer Sidebar -->
    <transition name="fade-slide-up">
      <v-navigation-drawer
        v-model="drawer"
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
        <v-btn icon class="ms-5 d-lg-none" @click="toggleDrawer">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
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
              <span v-if="!mini">Home</span>
            </div>
          </v-list-item>

          <v-list-item :to="'/about'" tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-information-outline</v-icon>
              <span v-if="!mini">About Us</span>
            </div>
          </v-list-item>

          <v-list-item :to="'/contact'" tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-phone-outline</v-icon>
              <span v-if="!mini">Contact Us</span>
            </div>
          </v-list-item>

          <v-divider class="my-2" />

          <v-list-item :to="'/profile'" tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-account-outline</v-icon>
              <span v-if="!mini">My Profile</span>
            </div>
          </v-list-item>

          <v-list-item :to="'/appointments'" tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-calendar</v-icon>
              <span v-if="!mini">My Appointments</span>
            </div>
          </v-list-item>

          <v-list-item @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-delete-outline</v-icon>
              <span v-if="!mini">Delete History</span>
            </div>
          </v-list-item>

          <v-divider class="my-2" />
          <v-list-item @click="handleLogoutClick">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-logout</v-icon>
              <span v-if="!mini">Logout</span>
            </div>
          </v-list-item>

          <div class="text-center mt-4">
            <v-btn icon @click="toggleTheme">
              <v-icon>
                {{ currentTheme === 'light' ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}
              </v-icon>
            </v-btn>
          </div>
        </v-list>
      </v-navigation-drawer>
    </transition>

    <!-- App Bar -->
    <v-app-bar flat :color="currentTheme === 'light' ? '#1565c0' : '#000000'">
      <v-btn icon class="ms-5" @click="toggleDrawer">
        <v-icon>mdi-menu</v-icon>
      </v-btn>
      <v-avatar color="#fff" size="50" class="ms-auto me-4">
        <v-img src="image/Teach&Learn.png" alt="Logo" />
      </v-avatar>
    </v-app-bar>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar"
      timeout="3000"
      :color="snackbarColor"
      location="top center"
      style="top: 80px"
    >
      {{ snackbarMsg }}
    </v-snackbar>

    <!-- Main Content -->
    <v-main
      :style="{
        backgroundColor: currentTheme === 'dark' ? '#222222' : '#fefcf9',
        color: currentTheme === 'dark' ? '#ffffff' : '#000000',
      }"
    >
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
              <h1 class="mb-3">Deleted History</h1>

              <div v-if="deletedAppointments.length > 0" class="Delete-container">
                <v-list class="Delete-list">
                  <v-list-item
                    v-for="appointment in deletedAppointments"
                    :key="appointment.id"
                    class="appointment-item"
                    :class="
                      currentTheme === 'dark'
                        ? 'bg-grey-darken-3 text-white'
                        : 'bg-white text-black'
                    "
                  >
                    <v-list-item-title class="appointment-title">
                      Appointment between<br />
                      <strong
                        >{{ appointment.student?.first_name }}
                        {{ appointment.student?.last_name }}</strong
                      ><br />
                      and<br />
                      <strong
                        >{{ appointment.mentor?.first_name }}
                        {{ appointment.mentor?.last_name }}</strong
                      >
                    </v-list-item-title>

                    <div
                      class="d-flex justify-center align-center mt-4"
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
                        Delete permanently
                      </v-btn>
                    </div>
                  </v-list-item>
                </v-list>

                <!-- Details Dialog -->
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
                    <v-card-text>
                      <div v-if="selectedStudentProfile" class="text-center">
                        <!-- Student Profile -->
                        <v-avatar size="100" class="mb-4">
                          <v-img
                            v-if="selectedStudentProfile.avatar_url"
                            :src="selectedStudentProfile.avatar_url"
                            cover
                          />
                          <v-icon v-else size="80" color="grey-darken-1">mdi-account</v-icon>
                        </v-avatar>
                        <p>
                          <strong>Name:</strong><br />{{ selectedStudentProfile.first_name }}
                          {{ selectedStudentProfile.last_name }}
                        </p>
                        <p><strong>Email:</strong><br />{{ selectedStudentProfile.email }}</p>
                        <p>
                          <strong>Phone:</strong><br />{{
                            selectedStudentProfile.phone || 'No phone number'
                          }}
                        </p>
                        <p>
                          <strong>Expertise:</strong><br />{{
                            selectedStudentProfile.expertise || 'Not specified'
                          }}
                        </p>
                        <p>
                          <strong>School:</strong><br />{{
                            selectedStudentProfile.school || 'No school listed'
                          }}
                        </p>
                        <p>
                          <strong>Degree:</strong><br />{{
                            selectedStudentProfile.degree || 'No degree listed'
                          }}
                        </p>
                        <p>
                          <strong>Year:</strong><br />{{
                            selectedStudentProfile.year || 'No year listed'
                          }}
                        </p>
                        <p>
                          <strong>About:</strong><br />{{
                            selectedStudentProfile.about || 'No about info'
                          }}
                        </p>
                      </div>

                      <!-- Divider -->
                      <v-divider class="my-6"></v-divider>

                      <!-- Deleted Appointment Info -->
                      <div v-if="selectedAppointment" class="text-center">
                        <h3 class="font-weight-bold mb-4">Deleted Appointment Info</h3>
                        <p>
                          <strong>Date:</strong><br />{{ selectedAppointment.appointment_date }}
                        </p>
                        <p>
                          <strong>Time:</strong><br />{{ selectedAppointment.appointment_time }}
                        </p>
                        <p>
                          <strong>Message:</strong><br />{{
                            selectedAppointment.message || 'No message provided'
                          }}
                        </p>
                        <p>
                          <strong>Mentor:</strong><br />{{
                            selectedAppointment.mentor?.first_name
                          }}
                          {{ selectedAppointment.mentor?.last_name }}
                        </p>
                      </div>
                    </v-card-text>

                    <v-card-actions class="justify-center">
                      <v-btn color="primary" @click="detailsDialog = false">Close</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </div>

              <v-alert v-else type="info" variant="tonal" border="start" density="compact">
                No Delete found.
              </v-alert>
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Confirm Delete Dialog -->
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
  </v-app>
</template>

<style scoped>
h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1565c0;
  text-align: center;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.Delete-container {
  max-width: 960px;
  margin: auto;
  padding: 24px;
}

.Delete-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.appointment-item {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

.appointment-item:hover {
  transform: translateY(-8px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.appointment-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #1565c0;
  text-align: center;
  line-height: 1.5;
}

/* Mobile adjustments */
@media (max-width: 600px) {
  .Delete-container {
    padding: 16px;
  }

  .appointment-title {
    font-size: 1.1rem;
  }

  .v-dialog {
    max-width: 90%;
  }

  .v-card-text p {
    font-size: 0.95rem;
  }

  .v-avatar {
    width: 80px;
    height: 80px;
  }
  h1 {
    font-size: 1.5rem;
    letter-spacing: 0.2rem;
  }
}
</style>
