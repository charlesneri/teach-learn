<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, formActionDefault } from '@/utils/supabase'
import { useTheme } from 'vuetify'
import { useDisplay } from 'vuetify'

const display = useDisplay()

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
const showFullImage = ref(false)
const fullImageUrl = ref('')
const confirmCancelPublicTutor = ref(false)

//for viewing profile
const viewFullImage = (url) => {
  if (!url) return
  fullImageUrl.value = url
  showFullImage.value = true
}

// PROFILE STATES
const profile = ref({
  firstname: '',
  lastname: '',
  middleInitial: '',
  age: '',
  expertise: '',
  email: '',
  phone: '',
  about: '',
  education: ['', '', ''],
  is_public_tutor: false,
})
const profileImage = ref('')
const selectedFile = ref(null)

// FIELD MAPPING
/*const fieldMappings = {
  'Given Name': 'firstname',
  'Last Name': 'lastname',
  'Middle Initial': 'middleInitial',
  Age: 'age',
  Expertise: 'expertise',
  Email: 'email',
  Phone: 'phone',
}
*/
const fieldMappings = [
  { label: 'First Name', key: 'firstname' },
  { label: 'Last Name', key: 'lastname' },
  { label: 'Middle Initial', key: 'middleInitial' },
  { label: 'Age', key: 'age' },
  { label: 'Expertise', key: 'expertise' },
  { label: 'Email', key: 'email' },
  { label: 'Phone', key: 'phone' },
]
// COMPUTED
const fullName = computed(() => {
  const mid = profile.value.middleInitial ? `${profile.value.middleInitial}. ` : ''
  return `${profile.value.firstname} ${mid}${profile.value.lastname}`
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
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user?.id) {
      console.error('Error fetching user:', userError)
      return
    }

    console.log('Current Auth User ID:', user.id)

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(
        'firstname, lastname, is_public_tutor, middleinitial, age, expertise, about, school, course, year, phone, avatar_url',
      )
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return
    }

    const fullProfile = {
      firstname: profileData.firstname || '',
      lastname: profileData.lastname || '',
      middleInitial: profileData.middleinitial || '',
      age: profileData.age || '',
      expertise: profileData.expertise || '',
      about: profileData.about || '',
      school: profileData.school || '',
      course: profileData.course || '',
      year: profileData.year || '',
      phone: profileData.phone || '',
      email: user.email, // get from auth
      avatar_url: profileData.avatar_url || '',
      is_public_tutor: profileData.is_public_tutor || false,
      education: [profileData.school || '', profileData.course || '', profileData.year || ''],
    }

    profile.value = fullProfile
    profileImage.value = fullProfile.avatar_url
    localStorage.setItem('userProfile', JSON.stringify(fullProfile))

    console.log('Fetched Profile:', fullProfile)
  } catch (error) {
    console.error('Unexpected error fetching profile:', error)
  }
}

//save profile function
const validateProfile = () => {
  const requiredFields = ['firstname', 'lastname', 'age', 'expertise', 'email', 'phone', 'about']
  for (const field of requiredFields) {
    if (!profile.value[field] || profile.value[field].toString().trim() === '') {
      snackbarMsg.value = `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}.`
      snackbarColor.value = 'red'
      snackbar.value = true
      return false
    }
  }

  // Check education fields
  if (profile.value.education.some((e) => !e || e.toString().trim() === '')) {
    snackbarMsg.value = 'Please complete your educational background.'
    snackbarColor.value = 'red'
    snackbar.value = true
    return false
  }

  return true
}

const saveProfile = async () => {
  // Validate the profile before saving
  if (!validateProfile()) return

  isEditing.value = false
  loading.value = true

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) throw new Error('User not authenticated')

    // Update the user's profile information in Supabase
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        firstname: profile.value.firstname,
        lastname: profile.value.lastname,
        middleinitial: profile.value.middleInitial,
        age: profile.value.age,
        phone: profile.value.phone,
        expertise: profile.value.expertise,
        about: profile.value.about,
        school: profile.value.education[0], // School name
        year: profile.value.education[2], // Year level
        avatar_url: profileImage.value, // Update the avatar URL if modified
        is_public_tutor: profile.value.is_public_tutor,
      })
      .eq('id', user.id) // Only update the current user's profile

    if (updateError) throw updateError

    // Save the updated profile data to localStorage
    localStorage.setItem('userProfile', JSON.stringify(profile.value))

    // Show success message
    snackbarMsg.value = 'Profile saved successfully!'
    snackbarColor.value = 'green'
    snackbar.value = true
  } catch (error) {
    console.error('Error saving profile:', error)
    snackbarMsg.value = 'An error occurred while saving. Please try again.'
    snackbarColor.value = 'red'
    snackbar.value = true
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
      error,
    } = await supabase.auth.getUser()
    if (error || !user) throw new Error('User not authenticated')

    // DELETE the existing image if it exists
    if (profileImage.value.includes('avatars/')) {
      try {
        const oldUrl = new URL(profileImage.value)
        const oldPath = decodeURIComponent(
          oldUrl.pathname.replace('/storage/v1/object/public/avatars/', ''),
        )

        const { error: deleteOldError } = await supabase.storage.from('avatars').remove([oldPath])
        if (deleteOldError) {
          console.warn('Failed to delete old image:', deleteOldError.message)
        } else {
          console.log('Old image deleted from bucket:', oldPath)
        }
      } catch (err) {
        console.error('Error parsing old image URL:', err)
      }
    }

    // Upload new image
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

    const profileImageUrl = publicData.publicUrl

    // Update DB
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: profileImageUrl })
      .eq('id', user.id)
    if (updateError) throw updateError

    profileImage.value = profileImageUrl
    profile.value.avatar_url = profileImageUrl
    localStorage.setItem('userProfile', JSON.stringify(profile.value))

    snackbarMsg.value = 'Profile picture updated!'
    snackbarColor.value = 'green'
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

    // ✅ Only delete if image is from your Supabase bucket
    if (profileImage.value.includes('avatars/')) {
      const fileUrl = new URL(profileImage.value)
      const filePath = decodeURIComponent(
        fileUrl.pathname.replace('/storage/v1/object/public/avatars/', ''),
      )

      const { error: deleteError } = await supabase.storage.from('avatars').remove([filePath])
      if (deleteError) throw deleteError
      console.log('Old image deleted:', filePath)
    }

    // ✅ Update profile in Supabase
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: '' })
      .eq('id', user.id)
    if (updateError) throw updateError

    profileImage.value = ''
    profile.value.avatar_url = ''
    localStorage.setItem('userProfile', JSON.stringify(profile.value))

    snackbarMsg.value = 'Profile picture removed!'
    snackbarColor.value = 'green'
    snackbar.value = true
  } catch (error) {
    console.error('Error removing profile image:', error)
    snackbarMsg.value = 'Failed to remove profile image.'
    snackbarColor.value = 'red'
    snackbar.value = true
  } finally {
    imageLoading.value = false
  }
}

// LOGOUT
/*const onLogout = async () => {
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
}*/

// EDIT MODES
const enableEdit = () => {
  isEditing.value = true
}
const cancelEdit = () => {
  isEditing.value = false
}
const getEducationPlaceholder = (index) => {
  if (index === 0) return 'School'
  if (index === 1) return 'Program/degree'
  if (index === 2) return 'Year level'
  return ''
}

//functional for public profile
// Apply as Tutor
const applyAsTutor = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user?.id) return console.error('User error:', userError)

  const toggleStatus = !profile.value.is_public_tutor // Toggle the status

  // Update the tutor status in the database
  const { error } = await supabase
    .from('profiles')
    .update({ is_public_tutor: toggleStatus })
    .eq('id', user.id)

  if (error) return console.error('Error updating tutor status:', error)

  profile.value.is_public_tutor = toggleStatus // Update the local state

  // Persist the state in localStorage
  localStorage.setItem('is_public_tutor', toggleStatus)

  snackbarMsg.value = toggleStatus
    ? 'You are now visible as a public tutor.'
    : 'You have canceled your public tutor status.'
  snackbarColor.value = 'green'
  snackbar.value = true

  // Close the dialog after the action is completed
  dialog.value = false
}

//drawer function
const drawer = ref(false)
//const mini = ref(false)
const isMobile = ref(false)

const toggleDrawer = () => {
  drawer.value = !drawer.value
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
})

/* === User Profile === */
const currentUserId = ref(null)
const currentUserProfile = ref({
  firstname: '',
  lastname: '',
  avatar_url: '',
  is_public_tutor: false,
})

//display profile public nav
const fetchCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    currentUserId.value = user.id
    const { data } = await supabase
      .from('profiles')
      .select('firstname, lastname, avatar_url, is_public_tutor')
      .eq('id', user.id)
      .single()
    if (data) {
      currentUserProfile.value = {
        firstname: data.firstname || '',
        lastname: data.lastname || '', // Ensure 'lastname' is correctly fetched
        avatar_url: data.avatar_url || '',
        is_public_tutor: data.is_public_tutor || false,
      }
    }
  }
}

/* === Logout === */
const handleLogoutClick = async () => {
  const { error } = await supabase.auth.signOut()

  // Clear localStorage
  localStorage.removeItem('userProfile')
  localStorage.removeItem('is_public_tutor')
  if (error) {
    snackbarMsg.value = 'An error occurred. Please try again.'
    snackbarColor.value = 'red'
    snackbar.value = true
  } else {
    snackbarMsg.value = 'Profile updated successfully.'
    snackbarColor.value = 'green'
    snackbar.value = true
  }

  // Reset the profile data
  profile.value = {
    firstname: '',
    lastname: '',
    middleInitial: '',
    age: '',
    expertise: '',
    email: '',
    phone: '',
    about: '',
    education: ['', '', ''],
    is_public_tutor: false,
  }
  profileImage.value = ''

  snackbarMsg.value = 'Logged out successfully!'
  snackbarColor.value = 'green'
  snackbar.value = true

  setTimeout(() => {
    router.push('/')
  }, 1000)
}
onMounted(async () => {
  await checkAuth() // Make sure the user is logged in
  await getUserProfile() // Always get the latest info from Supabase
  await fetchCurrentUser() // For sidebar display
  checkMobile()
  window.addEventListener('resize', checkMobile)

  // Optional: Update theme after mount
  theme.global.name.value = currentTheme.value
})
</script>

<template>
  <v-app id="inspire">
    <!-- Drawer Sidebar-->
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
          <v-avatar
            :size="display.smAndDown ? 80 : 100"
            class="mb-3"
            @click="profileImage && viewFullImage(profileImage)"
          >
            <v-img v-if="profileImage" :src="profileImage" cover style="cursor: pointer" />
            <v-icon v-else size="60" color="grey-darken-1">mdi-account</v-icon>
          </v-avatar>

          <h3 class="responsive-title">
            {{ currentUserProfile.firstname }} {{ currentUserProfile.lastname }}
          </h3>
        </v-sheet>

        <v-divider class="my-2" />

        <v-list nav dense>
          <v-list-item :to="'/home'" tag="RouterLink" @click="isMobile && (drawer = false)">
            <div class="d-flex align-center" style="gap: 8px; width: 100%">
              <v-icon size="30" style="margin-left: 15px">mdi-home-outline</v-icon>
              <span v-if="!mini" class="icon-mdi">Home</span>
            </div>
          </v-list-item>

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
              <span v-if="!mini" class="icon-mdi">Deleted Appointments</span>
            </div>
          </v-list-item>

          <v-divider class="my-2" />
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

      <!--logo-->
      <v-avatar
        class="logo responsive-logo ml-auto me-5"
        :style="{
          backgroundColor: currentTheme === 'dark' ? '#1565c0' : '#ffffff',
          color: currentTheme === 'dark' ? '#ffffff' : '#000000',
        }"
      >
        <v-img src="image/Teach&Learn.png" alt="Logo" />
      </v-avatar>
    </v-app-bar>

    <v-snackbar
      v-model="snackbar"
      timeout="3000"
      :color="snackbarColor || 'success'"
      location="top"
    >
      {{ snackbarMsg }}
      <template #actions>
        <v-btn icon="mdi-close" variant="text" @click="snackbar = false" />
      </template>
    </v-snackbar>

    <!-- MAIN CONTENT -->
    <v-main
      :style="{
        backgroundColor: currentTheme === 'dark' ? '#222222' : '#fefcf9',
        color: currentTheme === 'dark' ? '#ffffff' : '#000000',
      }"
    >
      <v-container fluid class="py-4 px-3 px-sm-6">
        <v-row justify="center">
          <v-col cols="12" sm="10" md="8" lg="10" xl="5">
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
                <v-avatar size="100" class="mb-3">
                  <component
                    :is="profileImage ? 'v-img' : 'v-icon'"
                    v-bind="
                      profileImage
                        ? { src: profileImage, cover: true, style: 'cursor: pointer' }
                        : { size: '80', color: 'grey-darken-1' }
                    "
                    @click="profileImage && viewFullImage(profileImage)"
                  >
                    <template v-if="!profileImage">mdi-account</template>
                  </component>
                </v-avatar>
                <h3>{{ currentUserProfile.firstname }} {{ currentUserProfile.lastname }}</h3>

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
                  :color="profile.is_public_tutor ? 'red' : 'primary'"
                  @click="
                    profile.is_public_tutor ? (confirmCancelPublicTutor = true) : (dialog = true)
                  "
                  :loading="loading"
                >
                  {{ profile.is_public_tutor ? 'Cancel Apply' : 'Apply as Tutor?' }}
                </v-btn>
              </div>

              <!-- Confirm Dialog: Apply as Tutor -->
              <v-dialog v-model="dialog" max-width="500" persistent transition="fade-transition">
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

              <v-dialog
                v-model="confirmCancelPublicTutor"
                max-width="500"
                persistent
                transition="fade-transition"
              >
                <v-card>
                  <v-card-title class="text-h6">
                    <v-icon class="me-2">mdi-alert-circle-outline</v-icon> Confirm Visibility Change
                  </v-card-title>
                  <v-card-text>
                    By canceling, your profile will be hidden from the public. Do you want to
                    continue?
                  </v-card-text>
                  <v-card-actions class="justify-end">
                    <v-btn
                      color="grey"
                      variant="outlined"
                      @click="confirmCancelPublicTutor = false"
                      :disabled="loading"
                    >
                      No
                    </v-btn>
                    <v-btn
                      color="red"
                      @click="
                        () => {
                          applyAsTutor()
                          confirmCancelPublicTutor = false
                        }
                      "
                      :loading="loading"
                    >
                      Yes, Hide Profile
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

              <v-divider class="my-4" />

              <v-card
                variant="outlined"
                class="pa-6"
                rounded="xl"
                :class="
                  currentTheme === 'dark' ? 'bg-grey-darken-4 text-white' : 'bg-grey-lighten-5'
                "
              >
                <!-- PERSONAL INFORMATION SECTION -->
                <v-sheet
                  class="pa-4 mb-6 text-start"
                  elevation="1"
                  rounded="lg"
                  :class="currentTheme === 'dark' ? 'bg-grey-darken-3' : 'bg-white'"
                >
                  <v-card-title class="mb-2 d-flex align-start text-start responsive-heading">
                    <v-icon class="me-2" color="primary">mdi-account</v-icon>
                    Personal Information
                  </v-card-title>
                  <v-divider class="mb-4" />

                  <v-row
                    v-for="field in fieldMappings"
                    :key="field.key"
                    class="pb-2 text-start"
                    dense
                  >
                    <v-col cols="12" sm="6" class="field-label text-start">
                      {{ field.label }}:
                    </v-col>
                    <v-col cols="12" sm="6" class="text-start">
                      <div v-if="!isEditing" class="py-1 profile-value">
                        {{ profile[field.key] }}
                      </div>
                      <v-text-field
                        v-else
                        v-model="profile[field.key]"
                        :placeholder="`Enter your ${field.label}`"
                        density="compact"
                        hide-details
                        variant="outlined"
                        :type="field.key === 'age' ? 'number' : 'text'"
                        class="text-start"
                      />
                    </v-col>
                  </v-row>
                </v-sheet>

                <!-- ABOUT ME SECTION -->
                <v-sheet
                  class="pa-4 mb-6 text-start"
                  elevation="1"
                  rounded="lg"
                  :class="currentTheme === 'dark' ? 'bg-grey-darken-3' : 'bg-white'"
                >
                  <v-card-title class="responsive-heading mb-2 d-flex align-start text-start">
                    <v-icon class="me-2" color="primary">mdi-text-box-outline</v-icon>
                    About Me
                  </v-card-title>
                  <v-divider class="mb-4" />

                  <v-row>
                    <v-col cols="12" class="text-start">
                      <div v-if="!isEditing" class="py-1">{{ profile.about }}</div>
                      <v-textarea
                        v-else
                        v-model="profile.about"
                        auto-grow
                        density="compact"
                        hide-details
                        variant="outlined"
                        placeholder="Write something about yourself"
                        class="text-start"
                      />
                    </v-col>
                  </v-row>
                </v-sheet>

                <!-- EDUCATIONAL BACKGROUND SECTION -->

                <v-sheet
                  class="pa-4 text-start"
                  elevation="1"
                  rounded="lg"
                  :class="currentTheme === 'dark' ? 'bg-grey-darken-3' : 'bg-white'"
                >
                  <v-card-title class="responsive-heading mb-2 d-flex align-start text-start">
                    <v-icon class="me-2" color="primary">mdi-school-outline</v-icon>
                    Educational Background
                  </v-card-title>
                  <v-divider class="mb-4" />

                  <v-row>
                    <v-col cols="12" class="text-start">
                      <!-- View Mode -->
                      <div v-if="!isEditing">
                        <div v-for="(item, index) in profile.education" :key="index" class="py-1">
                          <div class="edu-label">{{ getEducationPlaceholder(index) }}:</div>
                          <div class="edu-value">
                            {{ item }}
                          </div>
                        </div>
                      </div>

                      <!-- Edit Mode -->
                      <div v-else>
                        <v-text-field
                          v-for="(item, index) in profile.education"
                          :key="index"
                          v-model="profile.education[index]"
                          :label="getEducationPlaceholder(index)"
                          density="compact"
                          hide-details
                          variant="outlined"
                          class="mb-3 text-start edu-input"
                        />
                      </div>
                    </v-col>
                  </v-row>
                </v-sheet>
              </v-card>

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
        <!--for dialog for image viewing-->
        <v-dialog v-model="showFullImage" max-width="600">
          <v-card class="pa-2" rounded="lg">
            <v-img :src="fullImageUrl" aspect-ratio="1" class="rounded-lg" cover />
            <v-card-actions class="justify-end">
              <v-btn color="primary" @click="showFullImage = false">Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
/* Responsive logo avatar size */

.responsive-logo {
  width: 50px !important;
  height: 50px !important;
  border-radius: 50%;
  overflow: hidden;
}

.fade-slide-up {
  animation: fadeSlideUp 1.6s ease-in both;
}
/* for the logo*/

.logo-wrapper {
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
.logo-input {
  width: 240px;
  max-width: none;
  transition: width 0.3s ease;
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

.responsive-title {
  font-size: clamp(1rem, 2.5vw, 1.8rem);
}
.responsive-heading {
  font-size: clamp(1rem, 2vw, 1.6rem);
}
.field-label,
.edu-label {
  font-size: clamp(0.85rem, 2.5vw, 1rem);
  font-weight: 600;
  line-height: 1.3;
}
/* Displayed values when not editing */
.profile-value,
.edu-value {
  font-size: clamp(0.85rem, 2.5vw, 1rem);
  word-break: break-word; /* ensures long emails or words wrap */
  line-height: 1.4;
}
.text-start {
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
}
.v-sheet,
.v-card {
  max-width: 100%;
  padding-left: clamp(1rem, 4vw, 2rem);
  padding-right: clamp(1rem, 4vw, 2rem);
}
/*for educ background*/

.edu-input input {
  font-size: 0.95rem;
  font-family: 'Segoe UI', sans-serif;
  padding: 10px;
}

.edu-input .v-label {
  font-size: 0.85rem;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 600px) {
  .v-sheet,
  .v-card {
    padding: 1rem !important;
  }
  .d-flex.flex-wrap.justify-center.gap-2 .v-btn {
    width: 100%;
    justify-content: center;
  }

  .v-btn {
    font-size: 0.85rem;
  }
  .v-dialog__content {
    padding: 8px !important;
  }

  .v-dialog {
    max-width: 100% !important;
    margin: 0 !important;
  }
  .v-dialog .v-card {
    border-radius: 0 !important;
  }
  .v-navigation-drawer {
    width: 100% !important;
  }

  .logo-input {
    width: 150px;
    max-width: 100%;
  }
  .logo-wrapper {
    right: 12px;
    gap: 8px;
  }
  .logo {
    width: 40px;
    height: 40px;
  }
  .responsive-title {
    font-size: 1rem;
  }
  .responsive-heading {
    font-size: 1rem;
  }
  .field-label {
    font-size: 0.85rem;
    font-weight: 600;
  }
  .edu-label,
  .edu-value {
    font-size: 0.85rem;
  }

  .edu-input input {
    font-size: 0.85rem;
    padding: 8px;
  }
  .edu-input input,
  .v-text-field input,
  .v-textarea textarea {
    font-size: clamp(0.85rem, 2vw, 1rem);
    padding: 10px;
  }
  .responsive-heading,
  .responsive-title,
  .edu-label,
  .edu-value,
  .profile-value {
    font-size: 0.9rem !important;
  }
  .v-textarea textarea {
    font-size: clamp(0.85rem, 2vw, 1rem);
  }

  .edu-input .v-label {
    font-size: 0.75rem;
  }
  .responsive-logo {
    width: 30px;
    height: 30px;
  }
}

@media (max-width: 960px) {
  .responsive-title {
    font-size: 1.2rem;
  }
  .responsive-logo {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 400px) {
  .responsive-title,
  .responsive-heading {
    font-size: 1rem;
  }

  .field-label,
  .profile-value,
  .edu-label,
  .edu-value {
    font-size: 0.85rem;
  }
}
</style>
