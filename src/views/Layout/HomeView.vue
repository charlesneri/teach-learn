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
    <!-- App Bar -->
    <v-app-bar flat :color="currentTheme === 'light' ? '#1565c0' : 'grey-darken-4'">
      <v-container class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-4">
          <v-avatar color="#fff" size="50">
            <v-img src="image/Teach&Learn.png" alt="Logo" />
          </v-avatar>
        </div>
        <v-spacer />
        <div class="d-none d-md-flex align-center" style="gap: 24px">
          <RouterLink to="/home" class="text-white text-decoration-none font-weight-medium"
            >Home</RouterLink
          >
          <RouterLink to="/about" class="text-white text-decoration-none font-weight-medium"
            >About Us</RouterLink
          >
          <RouterLink to="/contact" class="text-white text-decoration-none font-weight-medium"
            >Contact Us</RouterLink
          >
        </div>
        <v-spacer />
        <!-- Search & Mobile Menu -->
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
            <!-- Mobile Search and Menu -->
            <div class="d-flex align-center gap-2">
              <!-- Mobile Menu Button -->
              <v-menu transition="scale-transition" offset-y>
                <template #activator="{ props }">
                  <v-app-bar-nav-icon v-bind="props" class="d-md-none" />
                </template>
                <v-list>
                  <v-list-item link>
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

                  <v-list-item link>
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

                  <v-list-item link>
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

                  <v-list-item link>
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
<<<<<<< HEAD
                </v-list-item>
                <v-list-item link>
                  <v-list-item-title
                    ><RouterLink to="/appointments">My Appointments</RouterLink></v-list-item-title
                  >
                </v-list-item>
                <v-divider class="my-2" />
                <v-list-item link>
                  <RouterLink to="/" class="text-decoration-none">
                    <v-list-item-title>Logout</v-list-item-title>
                  </RouterLink>
                </v-list-item>
              </v-list>
            </v-sheet>
          </v-col>
=======
                    <v-list-item-title>My Profile</v-list-item-title>
                  </v-list-item>
>>>>>>> feat/supabase

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
                              color="primary"
                              class="mx-auto"
                              style="max-width: 300px"
                              @input="onDateSelect"
                            ></v-date-picker>

                            <!-- Time Picker (only after date selected) -->
                            <v-time-picker
                              v-if="selectedDate"
                              v-model="selectedTime"
                              format="12hr"
                              color="primary"
                              class="mx-auto"
                              style="max-width: 300px"
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

.v-dialog__content {
  padding: 24px;
}

/* Heading Style */
h1 {
  font-size: 2.4rem;
  font-weight: 800;
  color: #1565c0;
  text-align: center;
  margin-bottom: 24px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* Dark mode heading */
body[data-theme='dark'] h1 {
  color: #e3f2fd;
}

/* Mentor Card Hover */
.mentor-card {
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 12px;
  width: 260px;
}
.mentor-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

/* Buttons */
.v-btn {
  transition: transform 0.3s ease;
}
.v-btn:hover {
  transform: scale(1.05);
}

/* Fade and Slide Animation */
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

/* Active Click */
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

/* Text Field Enhancement */
.v-text-field {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

/* Dialog Card */
.v-card {
  border-radius: 16px;
}

/* Dialog Transition */
.v-dialog {
  transition: all 0.3s ease;
}

/* Smooth layout padding */
.v-container {
  padding: 16px;
}
</style>
