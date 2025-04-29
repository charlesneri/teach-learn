<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()
const currentTheme = ref(localStorage.getItem('theme') || 'light')

const dialog = ref(false)
const loading = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const isEditing = ref(false)

const profileImage = ref('')
const selectedFile = ref(null)
const maxSizeMB = 2

const searchQuery = ref('')

function performSearch() {
  if (searchQuery.value.trim()) {
    snackbarMsg.value = `You searched for: "${searchQuery.value}"`
    snackbar.value = true
  }
}

const profile = ref({
  firstName: '',
  lastName: '',
  middleInitial: '',
  age: '',
  expertise: '',
  email: '',
  phone: '',
  about: '',
  education: ['', '', ''],
})

function toggleTheme() {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  theme.global.name.value = currentTheme.value
  localStorage.setItem('theme', currentTheme.value)
}

watch(currentTheme, (val) => {
  theme.global.name.value = val
  localStorage.setItem('theme', val)
})

onMounted(() => {
  theme.global.name.value = currentTheme.value
  const storedImage = localStorage.getItem('profileImage')
  if (storedImage) profileImage.value = storedImage
})

watch(profileImage, (newVal) => {
  if (newVal) localStorage.setItem('profileImage', newVal)
})

function proceedWithApplication() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    dialog.value = false
    snackbarMsg.value = 'Application submitted successfully!'
    snackbar.value = true
  }, 2000)
}

function enableEdit() {
  isEditing.value = true
}
function cancelEdit() {
  isEditing.value = false
}
function saveProfile() {
  isEditing.value = false
  snackbarMsg.value = 'Profile saved!'
  snackbar.value = true
}

function onImageSelected(event) {
  const file = event.target.files[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    snackbarMsg.value = 'Only JPG and PNG files are allowed.'
    snackbar.value = true
    return
  }

  const sizeMB = file.size / 1024 / 1024
  if (sizeMB > maxSizeMB) {
    snackbarMsg.value = `File size exceeds ${maxSizeMB}MB limit.`
    snackbar.value = true
    return
  }

  selectedFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    profileImage.value = e.target.result
  }
  reader.readAsDataURL(file)
}

function removeProfileImage() {
  profileImage.value = ''
  localStorage.removeItem('profileImage')
}

const fullName = computed(() => {
  return `${profile.value.firstName} ${profile.value.middleInitial}. ${profile.value.lastName}`
})

function getEducationPlaceholder(index) {
  if (index === 0) return 'Enter your school/university'
  if (index === 1) return 'Enter your course or degree'
  if (index === 2) return 'Enter your year level'
  return 'Enter educational info'
}

// Set up  contacts

// Reactive state variables
const messageInput = ref('') // Single input field for messages
const contacts = ref([
  {
    name: 'Erica Ellazo',
    position: 'Developer',
    email: '0144mine@gmail.com',
    phone: '+639635680457',
    photo: 'public/image/erica.jpg',
    description:
      'As a developer, I work on the look and feel of the platform, making sure it is easy for students to use. I focus on creating a simple, smooth design that helps students book their sessions without any trouble.',
    newMessage: '',
  },
  {
    name: 'Charles Q. Neri',
    position: 'Analyst',
    email: 'charlesneri0201@gmail.com',
    phone: '',
    photo: 'public/image/neri.png',
    description:
      'As a data analyst, I look at how students use the platform to find patterns and ways to improve the system. I use data to help make the booking process better, so students can find the right mentor quickly and easily.',
    newMessage: '',
  },
  {
    name: 'Jade C. Collado',
    position: 'Developer',
    email: 'jadecollado8@gmail.com',
    phone: '+639102889791',
    photo: 'public/image/jade.jpg',
    description:
      'As a developer, I am in charge of how the platform works behind the scenes. I ensure that everything runs smoothly, from storing data to processing the bookings, so that students can easily schedule their sessions.',
    newMessage: '',
  },
])

// Methods
const sendMessage = () => {
  // Handle the logic to send a message
  console.log('Message sent:', messageInput.value)
  messageInput.value = '' // Clear the input after sending the message
}
</script>
<template>
  <v-app id="inspire">
    <!-- App Bar -->
    <v-app-bar
      flat
      :color="currentTheme === 'light' ? '#1565c0' : 'grey-darken-4'"
      class="px-2 px-md-4"
    >
    <v-container fluid class="d-flex align-center justify-space-between pa-0">
  <!-- Logo -->
  <v-avatar color="#fff" size="44" class="mr-2">
    <v-img src="image/Teach&Learn.png" alt="Logo" />
  </v-avatar>

  <!-- Spacer -->
  <v-spacer />

  <!-- Centered Desktop Links -->
  <div class="d-none d-md-flex align-center me-5" style="gap: 24px">
    <RouterLink to="/home" class="text-white text-decoration-none font-weight-medium">Home</RouterLink>
    <RouterLink to="/about" class="text-white text-decoration-none font-weight-medium">About Us</RouterLink>
    <RouterLink to="/contact" class="text-white text-decoration-none font-weight-medium">Contact Us</RouterLink>
  </div>

  <!-- Spacer -->
  <v-spacer />

  <!-- Notification Bell + Mobile Menu together -->
  <div class="d-flex align-center gap-2">
    
    <!-- Notification Bell -->
    <v-menu v-model="notificationMenu" offset-y close-on-content-click transition="scale-transition">
      <template #activator="{ props }">
        <v-btn icon v-bind="props" @click="toggleMenu">
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

    <!-- Mobile Menu (only shows in mobile) -->
    <v-menu transition="scale-transition" offset-y>
      <template #activator="{ props }">
        <v-app-bar-nav-icon v-bind="props" class="d-md-none" />
      </template>
      <v-list>
        <v-list-item link>
          <RouterLink to="/" :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']">Home</RouterLink>
        </v-list-item>
        <v-list-item link>
          <RouterLink to="/profile" :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']">My Profile</RouterLink>
        </v-list-item>
        <v-list-item link>
          <RouterLink to="/appointments" :class="[currentTheme === 'dark' ? 'text-white' : 'text-black']">My Appointment</RouterLink>
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

  </div>
</v-container>

    </v-app-bar>

    <!-- Main Content -->
    <v-main :class="currentTheme === 'dark' ? 'bg-grey-darken-4 text-white' : 'bg-grey-lighten-3'">
      <v-container fluid class="py-6 px-4 px-sm-6">
        <v-row justify="center">
          <!-- Adjusting the width of the column for responsiveness -->
          <v-col cols="12" sm="10" md="9" lg="8">
            <!-- Wider container, responsive on all screens -->

            <v-sheet
              :class="currentTheme === 'dark' ? 'bg-grey-darken-3 text-white' : 'bg-white'"
              class="pa-6 pa-sm-8 text-center"
              elevation="2"
              rounded="lg"
            >
              <h1 class="font-weight-bold mb-5">Contact</h1>

              <v-row dense class="mt-6" justify="center" align="stretch">
                <v-col cols="12" sm="6" md="4" v-for="(contact, index) in contacts" :key="index">
                  <v-card
                    :class="currentTheme === 'dark' ? 'bg-grey-darken-2 text-white' : 'bg-white'"
                    elevation="5"
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
              <v-card class="mt-6">
                <v-card-text>
                  <v-textarea
                    v-model="messageInput"
                    label="Your Message"
                    placeholder="Type your message here..."
                    rows="4"
                    dense
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
  font-size: 2.5rem; /* Make it bigger */
  font-weight: 700; /* Bold text */
  color: #1565c0; /* Primary color */
  text-align: center; /* Center the heading */
  margin-bottom: 20px; /* Space below the heading */
  text-transform: uppercase; /* Capitalize the text */
  letter-spacing: 1px; /* Add some spacing between letters */
}

/* Adjust heading color for dark theme */
body[data-theme='dark'] h1 {
  color: #e3f2fd; /* Lighter color for dark mode */
}
</style>
