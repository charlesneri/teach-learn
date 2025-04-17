<script setup>
import { ref, onMounted, watch, computed } from 'vue'

const dialog = ref(false)
const loading = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const isEditing = ref(false)

const profileImage = ref('')
const selectedFile = ref(null)
const maxSizeMB = 2

const profile = ref({
  firstName: 'Jane',
  lastName: 'Doe',
  middleInitial: 'J',
  age: '25',
  expertise: 'J',
  email: 'jane.doe@example.com',
  phone: '+63 912 345 6789',
  about: 'lem',
  education: ['Caraga State University', 'BS in Information Systems', 'Year level: 3'],
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

// Persist image locally (for UI testing purposes)
onMounted(() => {
  const storedImage = localStorage.getItem('profileImage')
  if (storedImage) profileImage.value = storedImage
})
watch(profileImage, (newVal) => {
  if (newVal) localStorage.setItem('profileImage', newVal)
})

//for the name
const fullName = computed(() => {
  return `${profile.value.firstName} ${profile.value.middleInitial}. ${profile.value.lastName}`
})
</script>

<template>
  <v-app id="inspire">
    <!-- App Bar -->
    <v-app-bar flat color="#1565c0">
      <v-container class="d-flex align-center justify-space-between">
        <!-- Left: Logo -->
        <div class="d-flex align-center gap-4">
          <v-avatar color="#fff" size="50" style="border-width: 1px">
            <v-img src="image/Teach&Learn.png" alt="Logo" />
          </v-avatar>
        </div>

        <!-- Center: Desktop Navigation -->
        <div class="d-none d-md-flex" style="gap: 24px">
          <router-link to="/" class="text-white text-decoration-none font-weight-medium">
            Home
          </router-link>

          <router-link to="/about" class="text-white text-decoration-none font-weight-medium">
            About us
          </router-link>

          <router-link to="/contact" class="text-white text-decoration-none font-weight-medium">
            Contact us
          </router-link>
        </div>

        <!-- Right: Search Bar -->
        <v-responsive max-width="240">
          <div class="d-flex gap-2">
            <v-text-field
              density="compact"
              label="Search"
              rounded="lg"
              variant="solo-filled"
              flat
              hide-details
              single-line
              class="flex-grow-1"
            />
            <v-btn color="#fff" icon rounded="lg" class="elevation-1">
              <v-icon>mdi-magnify</v-icon>
            </v-btn>
            <!-- Mobile Menu -->
            <v-menu transition="scale-transition" offset-y>
              <template #activator="{ props }">
                <v-app-bar-nav-icon v-bind="props" class="d-md-none" />
              </template>
              <v-list>
                <v-list-item link
                  ><router-link to="/home" class="text-decoration-none"
                    >Home</router-link
                  ></v-list-item
                >
                <v-list-item link
                  ><router-link to="/home" class="text-decoration-none"
                    >My profile</router-link
                  ></v-list-item
                ><v-list-item link
                  ><router-link to="/home" class="text-decoration-none"
                    >My appointments</router-link
                  ></v-list-item
                >
                <v-list-item link
                  ><router-link to="/about" class="text-decoration-none"
                    >About Us</router-link
                  ></v-list-item
                >

                <v-list-item link
                  ><router-link to="/contact" class="text-decoration-none"
                    >Contact Us</router-link
                  ></v-list-item
                >
                <v-divider></v-divider>
                <v-list-item link
                  ><router-link to="/about" class="text-decoration-none"
                    >Logout</router-link
                  ></v-list-item
                >
              </v-list>
            </v-menu>
          </div>
        </v-responsive>
      </v-container>
    </v-app-bar>

    <v-main class="bg-grey-lighten-3">
      <v-container fluid class="pa-4 pa-sm-6" style="max-width: 95%; margin: auto">
        <v-row justify="center">
          <v-col cols="12" md="8">
            <v-sheet class="pa-6 text-center" elevation="2" rounded="lg">
              <!-- Profile Picture & Upload -->
              <v-avatar
                class="mb-4 mx-auto"
                size="120"
                color="grey-lighten-2"
                style="cursor: pointer"
                @click="$refs.imageInput.click()"
              >
                <v-img v-if="profileImage" :src="profileImage" cover></v-img>
                <v-icon v-else size="80" color="grey-darken-1">mdi-account</v-icon>
              </v-avatar>

              <!-- Hidden File Input -->
              <input
                type="file"
                ref="imageInput"
                accept="image/*"
                class="d-none"
                @change="onImageSelected"
              />

              <h3 class="font-weight-medium mb-4">
                {{ fullName }}
              </h3>

              <!-- Apply Button -->
              <v-btn color="primary" class="mb-3" @click="dialog = true">Apply as tutor?</v-btn>

              <!-- Dialog Modal -->
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
                    >
                      No
                    </v-btn>
                    <v-btn color="green" @click="proceedWithApplication" :loading="loading">
                      Yes
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>

              <!-- Snackbar -->
              <v-snackbar v-model="snackbar" timeout="3000" color="success" location="top">
                Application submitted successfully!
                <template #actions>
                  <v-btn variant="text" @click="snackbar = false" icon="mdi-close"></v-btn>
                </template>
              </v-snackbar>

              <v-divider class="my-4"></v-divider>

              <!-- Profile Info -->
              <div class="text-start">
                <v-row class="py-1" dense>
                  <v-col cols="6" class="font-weight-medium">Given Name:</v-col>
                  <v-col cols="6">
                    <div v-if="!isEditing">{{ profile.firstName }}</div>
                    <v-text-field
                      v-else
                      v-model="profile.firstName"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                </v-row>
                <v-row class="py-1" dense>
                  <v-col cols="6" class="font-weight-medium">Last Name:</v-col>
                  <v-col cols="6">
                    <div v-if="!isEditing">{{ profile.lastName }}</div>
                    <v-text-field
                      v-else
                      v-model="profile.lastName"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                </v-row>
                <v-row class="py-1" dense>
                  <v-col cols="6" class="font-weight-medium">Middle Initial:</v-col>
                  <v-col cols="6">
                    <div v-if="!isEditing">{{ profile.middleInitial }}</div>
                    <v-text-field
                      v-else
                      v-model="profile.middleInitial"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                </v-row>
                <v-row class="py-1" dense>
                  <v-col cols="6" class="font-weight-medium">Age:</v-col>
                  <v-col cols="6">
                    <div v-if="!isEditing">{{ profile.age }}</div>
                    <v-text-field
                      v-else
                      v-model="profile.age"
                      type="number"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                </v-row>
                <v-row class="py-1" dense>
                  <v-col cols="6" class="font-weight-medium">Expertise:</v-col>
                  <v-col cols="6">
                    <div v-if="!isEditing">{{ profile.expertise }}</div>
                    <v-text-field
                      v-else
                      v-model="profile.expertise"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                </v-row>
                <v-row class="py-1" dense>
                  <v-col cols="6" class="font-weight-medium">Email:</v-col>
                  <v-col cols="6">
                    <div v-if="!isEditing">{{ profile.email }}</div>
                    <v-text-field v-else v-model="profile.email" density="compact" hide-details />
                  </v-col>
                </v-row>
                <v-row class="py-1" dense>
                  <v-col cols="6" class="font-weight-medium">Phone:</v-col>
                  <v-col cols="6">
                    <div v-if="!isEditing">{{ profile.phone }}</div>
                    <v-text-field v-else v-model="profile.phone" density="compact" hide-details />
                  </v-col>
                </v-row>
                <v-row class="py-1" dense>
                  <v-col cols="6" class="font-weight-medium">About Me:</v-col>
                  <v-col cols="6">
                    <div v-if="!isEditing">{{ profile.about }}</div>
                    <v-textarea
                      v-else
                      v-model="profile.about"
                      rows="2"
                      auto-grow
                      density="compact"
                      hide-details
                    />
                  </v-col>
                </v-row>
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
                        density="compact"
                        hide-details
                      />
                    </div>
                  </v-col>
                </v-row>
              </div>

              <v-divider class="my-4"></v-divider>

              <!-- Action Buttons -->
              <div class="d-flex justify-center gap-2">
                <v-btn
                  v-if="!isEditing"
                  size="small"
                  variant="outlined"
                  color="blue"
                  @click="enableEdit"
                  >Edit</v-btn
                >
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
