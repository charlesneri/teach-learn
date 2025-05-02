<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
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
const snackbarColor = ref('')
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
//drawer function
/* === Responsive Drawer & Mobile === */
const drawer = ref(false)
//const mini = ref(false)
const isMobile = ref(false)

const toggleDrawer = () => {
  drawer.value = !drawer.value
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

/* === User Profile === */
const currentUserId = ref(null)
const currentUserProfile = ref({
  firstName: '',
  lastName: '',
  avatarUrl: '',
  isPublicTutor: false,
})

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

onMounted(async () => {
  theme.global.name.value = currentTheme.value
  checkMobile()
  window.addEventListener('resize', checkMobile)

  const storedImage = localStorage.getItem('profileImage')
  if (storedImage) profileImage.value = storedImage

  await fetchCurrentUser()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <v-app id="inspire">
   <!-- Drawer Sidebar (right, collapsible) -->
   <transi name="fade-slide-up">
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

          <v-list-item :to="'/DeleteHistory'" tag="RouterLink" @click="isMobile && (drawer = false)">
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
    </transi  tion>
    <!-- App Bar -->
    <v-app-bar flat :color="currentTheme === 'light' ? '#1565c0' : 'grey-darken-4'">
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
    <v-main    :style="{
        backgroundColor: currentTheme === 'dark' ? '#424242' : '#fefcf9',
        color: currentTheme === 'dark' ? '#ffffff' : '#000000',
      }">
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
                <h3 v-if="!mini" class="ma-3">{{ currentUserProfile.firstName }} {{ currentUserProfile.lastName }}</h3>


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
/* for the logo*/
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
/*  .v-card-text,
  .v-card-actions {
    padding: 12px !important;
    flex-direction: column;
    gap: 10px;
  }*/
  .v-navigation-drawer {
    width: 100% !important;
  }
 /* .v-main {
    padding-top: 64px;
  }*/
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
}
</style>