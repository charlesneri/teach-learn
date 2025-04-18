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
</script>
<template>
  <v-app id="inspire">
    <!-- App Bar -->
    <v-app-bar flat :color="currentTheme === 'light' ? '#1565c0' : 'grey-darken-4'">
      <v-container class="d-flex align-center justify-space-between">
        <!-- Logo -->
        <div class="d-flex align-center gap-4">
          <v-avatar color="#fff" size="50">
            <v-img src="image/Teach&Learn.png" alt="Logo" />
          </v-avatar>
        </div>

        <!-- Navigation (Desktop) -->
        <div class="d-none d-md-flex align-center justify-center" style="gap: 24px">
          <router-link to="/home" class="text-white text-decoration-none font-weight-medium"
            >Home</router-link
          >
          <router-link to="/about" class="text-white text-decoration-none font-weight-medium"
            >About Us</router-link
          >
          <router-link to="/contact" class="text-white text-decoration-none font-weight-medium"
            >Contact Us</router-link
          >
        </div>

        <!--  Mobile Menu -->
        <v-responsive max-width="240" style="height: 100%">
          <div class="d-flex justify-center align-center">
            <v-menu transition="scale-transition" offset-y>
              <template #activator="{ props }">
                <v-app-bar-nav-icon v-bind="props" class="d-md-none" />
              </template>
              <v-list>
                <v-list-item link>
                  <router-link to="/home" class="text-decoration-none">Home</router-link>
                </v-list-item>
                <v-list-item link>
                  <router-link to="/profile" class="text-decoration-none">My Profile</router-link>
                </v-list-item>
                <v-list-item link>
                  <router-link to="/appointments" class="text-decoration-none"
                    >My Appointments</router-link
                  >
                </v-list-item>
                <v-list-item link>
                  <router-link to="/about" class="text-decoration-none">About Us</router-link>
                </v-list-item>
                <v-list-item link>
                  <router-link to="/contact" class="text-decoration-none">Contact Us</router-link>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item link>
                  <router-link to="/logout" class="text-decoration-none">Logout</router-link>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </v-responsive>
      </v-container>
    </v-app-bar>

    <!-- Main Content -->
    <v-main :class="currentTheme === 'dark' ? 'bg-grey-darken-4 text-white' : 'bg-grey-lighten-3'">
      <v-container fluid class="pa-4 pa-sm-6" style="max-width: 95%; margin: auto">
        <v-row justify="center">
          <v-col cols="12" md="8">
            <v-sheet
              :class="currentTheme === 'dark' ? 'bg-grey-darken-3 text-white' : 'bg-white'"
              class="pa-6 text-center"
              elevation="2"
              rounded="lg"
              style="position: relative"
            >
              <!-- Theme Toggle Button -->
              <v-btn
                icon
                size="small"
                @click="toggleTheme"
                style="position: absolute; top: 16px; right: 16px; z-index: 10"
              >
                <v-icon>
                  {{ currentTheme === 'light' ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}
                </v-icon>
              </v-btn>

              <!-- Profile Picture -->
              <div class="d-flex flex-column align-center mb-4">
                <v-avatar size="120" color="grey-lighten-2">
                  <v-img v-if="profileImage" :src="profileImage" cover />
                  <v-icon v-else size="80" color="grey-darken-1">mdi-account</v-icon>
                </v-avatar>

                <div class="mt-3 d-flex flex-wrap justify-center gap-2">
                  <v-btn size="small" color="primary" @click="$refs.imageInput.click()">
                    <v-icon start>mdi-upload</v-icon>
                  </v-btn>

                  <v-btn
                    v-if="profileImage"
                    size="small"
                    color="red"
                    variant="outlined"
                    @click="removeProfileImage"
                  >
                    <v-icon start>mdi-delete</v-icon>
                  </v-btn>
                </div>

                <input
                  type="file"
                  ref="imageInput"
                  accept="image/*"
                  class="d-none"
                  @change="onImageSelected"
                />
              </div>

              <h3 class="font-weight-medium mb-4">{{ fullName }}</h3>
              <v-btn color="primary" class="mb-3" @click="dialog = true">Apply as Tutor?</v-btn>

              <!-- Confirm Dialog -->
              <v-dialog
                v-model="dialog"
                max-width="500"
                scrollable
                transition="dialog-bottom-transition"
                persistent
              >
                <v-card>
                  <v-card-title class="text-h6 text-start">
                    <v-icon class="me-2">mdi-alert-circle-outline</v-icon>
                    Confirm Application
                  </v-card-title>
                  <v-card-text class="text-start">
                    Your personal information will be public. Do you still wish to proceed?
                  </v-card-text>
                  <v-card-actions class="justify-end">
                    <v-btn
                      color="red"
                      variant="outlined"
                      @click="dialog = false"
                      :disabled="loading"
                      >No</v-btn
                    >
                    <v-btn color="green" @click="proceedWithApplication" :loading="loading"
                      >Yes</v-btn
                    >
                  </v-card-actions>
                </v-card>
              </v-dialog>

              <!-- Snackbar -->
              <v-snackbar v-model="snackbar" timeout="3000" color="success" location="top">
                {{ snackbarMsg }}
                <template #actions>
                  <v-btn variant="text" @click="snackbar = false" icon="mdi-close" />
                </template>
              </v-snackbar>

              <v-divider class="my-4" />

              <!-- Profile Details -->
              <div class="text-start">
                <v-row
                  v-for="(label, key) in {
                    'Given Name:': 'firstName',
                    'Last Name:': 'lastName',
                    'Middle Initial:': 'middleInitial',
                    'Age:': 'age',
                    'Expertise:': 'expertise',
                    'Email:': 'email',
                    'Phone:': 'phone',
                  }"
                  :key="key"
                  class="py-1"
                  dense
                >
                  <v-col cols="6" class="font-weight-medium">{{ label }}</v-col>
                  <v-col cols="6">
                    <div v-if="!isEditing">{{ profile[key] }}</div>
                    <v-text-field
                      v-else
                      v-model="profile[key]"
                      :placeholder="`Enter your ${label.toLowerCase().replace(':', '')}`"
                      density="compact"
                      hide-details
                      :type="key === 'age' ? 'number' : 'text'"
                    />
                  </v-col>
                </v-row>

                <!-- About Me -->
                <v-row class="py-1" dense>
                  <v-col cols="6" class="font-weight-medium">About Me:</v-col>
                  <v-col cols="6">
                    <div v-if="!isEditing">{{ profile.about }}</div>
                    <v-textarea
                      v-else
                      v-model="profile.about"
                      placeholder="Write something about yourself"
                      rows="2"
                      auto-grow
                      density="compact"
                      hide-details
                    />
                  </v-col>
                </v-row>

                <!-- Education -->
                <v-row class="py-1" dense>
                  <v-col cols="6" class="font-weight-medium">Educational Background:</v-col>
                  <v-col cols="6">
                    <div v-if="!isEditing">
                      <div v-for="item in profile.education" :key="item">{{ item }}</div>
                    </div>
                    <div v-else>
                      <v-text-field
                        v-for="(item, index) in profile.education"
                        :key="index"
                        v-model="profile.education[index]"
                        :placeholder="getEducationPlaceholder(index)"
                        density="compact"
                        hide-details
                      />
                    </div>
                  </v-col>
                </v-row>
              </div>

              <v-divider class="my-4" />

              <!-- Action Buttons -->
              <div class="d-flex justify-center gap-2">
                <v-btn
                  v-if="!isEditing"
                  size="small"
                  variant="outlined"
                  color="blue"
                  @click="enableEdit"
                >
                  Edit
                </v-btn>
                <template v-else>
                  <v-btn size="small" variant="text" color="red" @click="cancelEdit">Cancel</v-btn>
                  <v-btn size="small" color="green" @click="saveProfile">Save</v-btn>
                </template>
              </div>
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
