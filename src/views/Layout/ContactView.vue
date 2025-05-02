<script setup>
/* === Imports === */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

/* === Router === */
const router = useRouter()

/* === Theme === */
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

/* === Responsive Drawer & Mobile === */
const drawer = ref(false)
const mini = ref(false)
const isMobile = ref(false)

const toggleDrawer = () => {
  drawer.value = !drawer.value
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

/* === Snackbar === */
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('')

/* === User Profile === */
const currentUserId = ref(null)
const currentUserProfile = ref({
  firstName: '',
  lastName: '',
  avatarUrl: '',
  isPublicTutor: false,
})

const fetchCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
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

/* === Logout === */
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

/* === Tutors === */
const tutors = ref([])

const fetchTutors = async () => {
  const { data } = await supabase.from('profiles').select('*').eq('is_public_tutor', true)
  tutors.value = data || []
}

/* === Messaging === */
const messageInput = ref('')
const contacts = ref([
  {
    name: 'Charles Q. Neri',
    position: 'Developer',
    email: 'charlesneri0201@gmail.com',
    phone: '+639916474108',
    photo: 'public/image/charles-neri.png',
    description:
      'As a developer, I am in charge of how the platform works behind the scenes. I ensure that everything runs smoothly, from storing data to processing the bookings, so that students can easily schedule their sessions.',
  },
  {
    name: 'Erica Ellazo',
    position: 'Analyst',
    email: '0144mine@gmail.com',
    phone: '+639635680457',
    photo: 'public/image/erica.jpg',
    description:
      'As a data analyst, I look at how students use the platform to find patterns and ways to improve the system. I use data to help make the booking process better, so students can find the right mentor quickly and easily.',
  },
  {
    name: 'Jade C. Collado',
    position: 'Developer',
    email: 'jadecollado8@gmail.com',
    phone: '+639102889791',
    photo: 'public/image/jade.jpg',
    description:
      'As a developer, I work on the look and feel of the platform, making sure it is easy for students to use. I focus on creating a simple, smooth design that helps students book their sessions without any trouble.',
  },
])
/*
const sendMessage = () => {
  console.log('Message sent:', messageInput.value)
  messageInput.value = ''
}*/

/* === Lifecycle Hooks === */
onMounted(async () => {
  theme.global.name.value = currentTheme.value
  checkMobile()
  window.addEventListener('resize', checkMobile)

  await fetchCurrentUser()
  await fetchTutors()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
})

// sending feedback to the supabase
const sendMessage = async () => {
  if (!messageInput.value.trim()) {
    snackbarMsg.value = 'Please enter a message.'
    snackbarColor.value = 'red'
    snackbar.value = true
    return
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    snackbarMsg.value = 'You must be logged in to send feedback.'
    snackbarColor.value = 'red'
    snackbar.value = true
    return
  }

  const { error } = await supabase.from('feedbacks').insert([
    {
      user_id: user.id,
      message: messageInput.value.trim(),
    },
  ])

  if (error) {
    console.error('Insert error:', error.message)
    snackbarMsg.value = 'Failed to send feedback.'
    snackbarColor.value = 'red'
    snackbar.value = true
  } else {
    snackbarMsg.value = 'Feedback sent. Thank you!'
    snackbarColor.value = 'green'
    snackbar.value = true
    messageInput.value = ''
  }
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
        <v-btn icon class="ms-5 d-lg-none" @click="toggleDrawer">
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
    <!-- Main Content -->
    <v-main
      :style="{
        backgroundColor: currentTheme === 'dark' ? '#222222' : '#fefcf9',
        color: currentTheme === 'dark' ? '#ffffff' : '#000000',
      }"
    >
      <v-container fluid class="py-6 px-4 px-sm-6">
        <v-row justify="center">
          <!-- Adjusting the width of the column for responsiveness -->
          <v-col cols="12" sm="10" md="9" lg="8">
            <!-- Wider container, responsive on all screens -->

            <v-sheet
              :style="{
                backgroundColor: currentTheme === 'dark' ? '#424242' : '#fefcf9',
                color: currentTheme === 'dark' ? '#ffffff' : '#000000',
              }"
              class="pa-6 pa-sm-8 text-center"
              elevation="2"
              rounded="lg"
            >
              <h1 class="mb-5">Contact</h1>

              <v-row class="mt-6" justify="center" align="stretch">
                <v-col
                  cols="12"
                  sm="6"
                  md="4"
                  class="mb-6 px-3"
                  v-for="(contact, index) in contacts"
                  :key="index"
                >
                  <v-card
                    :style="{
                      backgroundColor: currentTheme === 'dark' ? '#424242' : '#fefcf9',
                      color: currentTheme === 'dark' ? '#ffffff' : '#000000',
                    }"
                    variant="outlined"
                    class="contact-card"
                  >
                    <v-img :src="contact.photo" height="200" cover class="rounded-t"></v-img>

                    <v-card-title class="font-weight-bold">{{ contact.name }}</v-card-title>
                    <v-card-subtitle>{{ contact.position }}</v-card-subtitle>

                    <v-card-text>
                      <div><strong>Email:</strong> {{ contact.email }}</div>
                      <div><strong>Phone:</strong> {{ contact.phone }}</div>

                      <!-- Contact Description -->
                      <div
                        class="mt-4 mb-2 text-justify"
                        style="
                          min-height: 80px;
                          max-height: 120px;
                          overflow-y: auto;
                          background-color: rgba(0, 0, 0, 0.05);
                          padding: 8px;
                          border-radius: 4px;
                        "
                      >
                        <small>{{ contact.description }}</small>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Single Text Area for Message Input -->
              <v-card
                class="mt-6"
                :style="{
                  backgroundColor: currentTheme === 'dark' ? '#424242' : '#fefcf9',
                  color: currentTheme === 'dark' ? '#ffffff' : '#000000',
                }"
              >
                <v-card-text>
                  <h2 class="text-left ma-2">Feedback</h2>
                  <v-textarea
                    v-model="messageInput"
                    label="Your Message"
                    placeholder="Type your message here..."
                    rows="4"
                    dense
                    color="primary"
                  >
                    <template #append-inner>
                      <v-btn icon size="small" @click="sendMessage">
                        <v-icon>mdi-send</v-icon>
                      </v-btn>
                    </template>
                  </v-textarea>
                </v-card-text>
              </v-card>
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
<style scoped>
/* Remove underline on link */
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
/* Custom styling for heading */
h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1565c0;
  text-align: center;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 2px;
}
h2{
  font-size: 1rem;
  font-weight: 700;
  color: #1565c0;
  text-align: center;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Adjust heading color for dark theme */
body[data-theme='dark'] h1 {
  color: #e3f2fd; /* Lighter color for dark mode */
}
/* Drawer & App Bar */
.v-navigation-drawer {
  transition: all 0.3s ease;
}
.v-main {
  transition: margin-right 0.3s ease;
}

/* Mini Drawer Logic */
.drawer-hidden {
  display: none !important;
}

/* Search Styles */
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

/* Animations */
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
.fade-slide-up-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}
.fade-slide-up-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.fade-slide-up-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.fade-slide-up-move {
  transition: transform 0.3s ease;
}

/* Responsive */
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
