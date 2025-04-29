<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, formActionDefault } from '@/utils/supabase'
import { useTheme } from 'vuetify'

// THEME
const theme = useTheme()
const currentTheme = ref(localStorage.getItem('theme') || 'light')
watch(currentTheme, (val) => {
  theme.global.name.value = val
  localStorage.setItem('theme', val)
})
const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
}

// ROUTER
const router = useRouter()

// UI STATES
const dialog = ref(false)
const confirmRemove = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const isEditing = ref(false)
const loading = ref(false)
const imageLoading = ref(false)

// PROFILE STATES
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
  isPublicTutor: false, 
})
const profileImage = ref('')
const selectedFile = ref(null)

// FIELD MAPPING
const fieldMappings = {
  'Given Name': 'firstName',
  'Last Name': 'lastName',
  'Middle Initial': 'middleInitial',
  Age: 'age',
  Expertise: 'expertise',
  Email: 'email',
  Phone: 'phone',
}

// COMPUTED
const fullName = computed(() => {
  const mid = profile.value.middleInitial ? `${profile.value.middleInitial}. ` : ''
  return `${profile.value.firstName} ${mid}${profile.value.lastName}`
})

// FUNCTIONS
const checkAuth = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) router.push('/login')
}

const getUserProfile = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (error) throw error

    profile.value = {
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      middleInitial: data.middle_initial || '',
      age: data.age || '',
      expertise: data.expertise || '',
      email: data.email || user.email,
      phone: data.phone || '',
      about: data.about || '',
      education: [data.school || '', data.degree || '', data.year || ''],
      isPublicTutor: data.is_public_tutor || false, // <-- ADD THIS
    }
    profileImage.value = data.avatar_url || ''
  } catch (error) {
    console.error('Error fetching profile:', error)
  }
}

const saveProfile = async () => {
  isEditing.value = false
  loading.value = true

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: profile.value.firstName,
        last_name: profile.value.lastName,
        middle_initial: profile.value.middleInitial,
        age: profile.value.age,
        expertise: profile.value.expertise,
        email: profile.value.email,
        phone: profile.value.phone,
        about: profile.value.about,
        school: profile.value.education[0],
        degree: profile.value.education[1],
        year: profile.value.education[2],
        avatar_url: profileImage.value,
      })
      .eq('id', user.id)

    if (error) throw error

    snackbarMsg.value = 'Profile saved successfully!'
    snackbar.value = true
  } catch (error) {
    console.error('Error saving profile:', error)
  } finally {
    loading.value = false
  }
}

const onImageSelected = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  selectedFile.value = file
  imageLoading.value = true

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    })
    if (uploadError) throw uploadError

    const { data: publicData, error: publicUrlError } = await supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)
    if (publicUrlError || !publicData?.publicUrl) throw publicUrlError

    profileImage.value = publicData.publicUrl

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: profileImage.value })
      .eq('id', user.id)
    if (updateError) throw updateError

    snackbarMsg.value = 'Profile picture updated!'
    snackbar.value = true
  } catch (error) {
    console.error('Error uploading profile image:', error)
  } finally {
    imageLoading.value = false
  }
}

const confirmRemoveImage = () => {
  confirmRemove.value = true
}

const removeProfileImage = async () => {
  if (!profileImage.value) return

  confirmRemove.value = false
  imageLoading.value = true

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const fileUrl = new URL(profileImage.value)
    const filePath = decodeURIComponent(
      fileUrl.pathname.replace('/storage/v1/object/public/avatars/', ''),
    )

    const { error: deleteError } = await supabase.storage.from('avatars').remove([filePath])
    if (deleteError) throw deleteError

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: '' })
      .eq('id', user.id)
    if (updateError) throw updateError

    profileImage.value = ''

    snackbarMsg.value = 'Profile picture removed!'
    snackbar.value = true
  } catch (error) {
    console.error('Error removing profile image:', error)
  } finally {
    imageLoading.value = false
  }
}

// LOGOUT
const onLogout = async () => {
  formActionDefault.formProcess = true
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    snackbarMsg.value = 'Logged out successfully!'
    snackbar.value = true
    setTimeout(() => router.push('/login'), 1000)
  } catch (error) {
    console.error('Error during logout:', error)
  } finally {
    formActionDefault.formProcess = false
  }
}

// EDIT MODES
const enableEdit = () => {
  isEditing.value = true
}
const cancelEdit = () => {
  isEditing.value = false
}

const getEducationPlaceholder = (index) => {
  if (index === 0) return 'Enter your school/university'
  if (index === 1) return 'Enter your course or degree'
  if (index === 2) return 'Enter your year level'
  return ''
}

// MOUNTED
onMounted(() => {
  theme.global.name.value = currentTheme.value
  checkAuth()
  getUserProfile()
})

//functional for public profile
// Apply as Tutor
const applyAsTutor = async () => {
  loading.value = true
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('profiles')
      .update({ is_public_tutor: !profile.value.isPublicTutor }) // Toggle apply/cancel
      .eq('id', user.id)

    if (error) throw error

    profile.value.isPublicTutor = !profile.value.isPublicTutor // Update frontend state

    snackbarMsg.value = profile.value.isPublicTutor
      ? 'You are now listed as a tutor!'
      : 'You have canceled your tutor application.'

    snackbar.value = true
    dialog.value = false

    await fetchTutors() // Refresh mentor list in HomeView
  } catch (error) {
    console.error('Error applying as tutor:', error)
    snackbarMsg.value = 'Failed to apply/cancel. Please try again.'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <v-app id="inspire">
    <!-- APP BAR -->
    <v-app-bar flat :color="currentTheme === 'light' ? '#1565c0' : 'grey-darken-4'">
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

    <!-- MAIN CONTENT -->
    <v-main :class="currentTheme === 'dark' ? 'bg-grey-darken-4 text-white' : 'bg-grey-lighten-3'">
      <v-container fluid class="py-6 px-4 px-sm-6">
        <v-row justify="center">
          <v-col cols="12" sm="10" md="8" lg="8">
            <v-sheet
              :class="currentTheme === 'dark' ? 'bg-grey-darken-3 text-white' : 'bg-white'"
              class="fade-slide-up pa-4 pa-sm-6 text-sm-center"
              elevation="2"
              rounded="lg"
            >
              <!-- Theme Toggle Button -->
              <v-btn
                icon
                size="small"
                @click="toggleTheme"
                class="position-absolute"
                style="top: 16px; right: 16px"
              >
                <v-icon>{{
                  currentTheme === 'light' ? 'mdi-weather-night' : 'mdi-white-balance-sunny'
                }}</v-icon>
              </v-btn>

              <!-- Profile Avatar -->
              <div class="d-flex flex-column align-center mb-4">
                <v-avatar :size="$vuetify.display.smAndDown ? 100 : 120" class="bg-grey-lighten-2">
                  <v-img v-if="profileImage" :src="profileImage" cover>
                    <template #error>
                      <v-icon size="80" color="grey-darken-1">mdi-account</v-icon>
                    </template>
                  </v-img>
                  <v-icon v-else size="80" color="grey-darken-1">mdi-account</v-icon>
                </v-avatar>

                <!-- Upload & Remove Buttons -->
                <div class="mt-3 d-flex flex-wrap justify-center gap-2">
                  <v-btn
                    size="small"
                    color="primary"
                    @click="$refs.imageInput.click()"
                    :loading="imageLoading"
                    :disabled="imageLoading"
                  >
                    <v-icon start>mdi-upload</v-icon> Upload
                  </v-btn>
                  <v-btn
                    v-if="profileImage"
                    size="small"
                    color="red"
                    variant="outlined"
                    @click="confirmRemoveImage"
                    :loading="imageLoading"
                    :disabled="imageLoading"
                  >
                    <v-icon start>mdi-delete</v-icon> Remove
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

              <!-- button for apply as tutor or cancel -->
              <div class="d-flex justify-center mb-3">
  <v-btn
    :color="profile.isPublicTutor ? 'red' : 'primary'"
    @click="dialog = true"
    :loading="loading"
  >
    {{ profile.isPublicTutor ? 'Cancel Apply' : 'Apply as Tutor?' }}
  </v-btn>
</div>
           
              <!-- Confirm Dialog: Apply as Tutor -->
              <v-dialog v-model="dialog" max-width="500" persistent>
                <v-card>
                  <v-card-title class="text-h6">
                    <v-icon class="me-2">mdi-alert-circle-outline</v-icon> Confirm Application
                  </v-card-title>
                  <v-card-text>
                    Your personal information will be public. Do you still wish to proceed?
                  </v-card-text>
                  <v-card-actions class="justify-end">
                    <v-btn
                      color="grey"
                      variant="outlined"
                      @click="dialog = false"
                      :disabled="loading"
                      >No</v-btn
                    >
                    <v-btn color="green" @click="applyAsTutor" :loading="loading">
                      Yes, Apply
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>

              <!-- Confirm Dialog: Remove Profile Image -->
              <v-dialog v-model="confirmRemove" max-width="400" persistent>
                <v-card>
                  <v-card-title class="text-h6">
                    <v-icon class="me-2">mdi-alert</v-icon> Confirm Deletion
                  </v-card-title>
                  <v-card-text> Are you sure you want to delete your profile picture? </v-card-text>
                  <v-card-actions class="justify-end">
                    <v-btn
                      color="grey"
                      variant="outlined"
                      @click="confirmRemove = false"
                      :disabled="imageLoading"
                      >Cancel</v-btn
                    >
                    <v-btn color="red" @click="removeProfileImage" :loading="imageLoading"
                      >Delete</v-btn
                    >
                  </v-card-actions>
                </v-card>
              </v-dialog>

              <!-- Snackbar -->
              <v-snackbar v-model="snackbar" timeout="3000" color="success" location="top">
                {{ snackbarMsg }}
                <template #actions>
                  <v-btn icon="mdi-close" variant="text" @click="snackbar = false" />
                </template>
              </v-snackbar>

              <v-divider class="my-4" />

              <!-- Profile Fields -->
              <div class="text-start">
                <v-row
                  v-for="(fieldKey, label) in fieldMappings"
                  :key="fieldKey"
                  class="py-1"
                  dense
                >
                  <v-col cols="12" sm="6" class="font-weight-medium">{{ label }}:</v-col>
                  <v-col cols="12" sm="6">
                    <div v-if="!isEditing">{{ profile[fieldKey] }}</div>
                    <v-text-field
                      v-else
                      v-model="profile[fieldKey]"
                      :placeholder="`Enter your ${label}`"
                      density="compact"
                      hide-details
                      :type="fieldKey === 'age' ? 'number' : 'text'"
                    />
                  </v-col>
                </v-row>

                <!-- About Me -->
                <v-row class="py-1" dense>
                  <v-col cols="12" sm="6" class="font-weight-medium">About Me:</v-col>
                  <v-col cols="12" sm="6">
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

                <!-- Educational Background -->
                <v-row class="py-1" dense>
                  <v-col cols="12" sm="6" class="font-weight-medium">Educational Background:</v-col>
                  <v-col cols="12" sm="6">
                    <div v-if="!isEditing">
                      <div v-for="(item, index) in profile.education" :key="index">{{ item }}</div>
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

              <!-- Edit / Save / Cancel Buttons -->
              <div class="d-flex flex-wrap justify-center gap-2">
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
                  <v-btn size="small" variant="text" color="red" @click="cancelEdit">
                    Cancel
                  </v-btn>
                  <v-btn size="small" color="green" @click="saveProfile" :loading="loading">
                    Save
                  </v-btn>
                </template>
              </div>
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.fade-slide-up {
  animation: fadeSlideUp 1.6s ease-in both;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>