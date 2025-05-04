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
const showFullImage = ref(false)
const fullImageUrl = ref('')

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
const fieldMappings = {
  'Given Name': 'firstname',
  'Last Name': 'lastname',
  'Middle Initial': 'middleInitial',
  Age: 'age',
  Expertise: 'expertise',
  Email: 'email',
  Phone: 'phone',
}

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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      console.error('Error fetching user:', userError);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('firstname, lastname, is_public_tutor, middleinitial, age, expertise, about, school, course, year, phone, avatar_url') 
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    const email = user.email; 

    const profileData = {
      firstname: data.firstname || '', 
      lastname: data.lastname || '',   
      middleInitial: data.middleinitial || '',
      age: data.age || '',
      expertise: data.expertise || '',
      about: data.about || '',
      school: data.school || '',      
      course: data.course || '',      
      year: data.year || '',         
      phone: data.phone || '',       
      email: email,                  
      is_public_tutor: data.is_public_tutor || false,  // Get public tutor status
      education: [data.school || '', data.course || '', data.year || ''],
     avatar_url: data.avatar_url || '', 
    };

    // Store the fetched profile data in localStorage
    localStorage.setItem('userProfile', JSON.stringify(profileData));

    profile.value = profileData;

    profileImage.value = data.avatar_url || ''; 

    console.log('Populated profile data:', profile.value.firstname, profile.value.lastname);
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
};


//save profile function
const validateProfile = () => {
  const requiredFields = ['firstname', 'lastname', 'age', 'expertise', 'email', 'phone', 'about'];
  for (const field of requiredFields) {
    if (!profile.value[field] || profile.value[field].toString().trim() === '') {
      snackbarMsg.value = `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}.`;
      snackbarColor.value = 'red';
      snackbar.value = true;
      return false;
    }
  }

  // Check education fields
  if (profile.value.education.some(e => !e || e.toString().trim() === '')) {
    snackbarMsg.value = 'Please complete your educational background.';
    snackbarColor.value = 'red';
    snackbar.value = true;
    return false;
  }

  return true;
};

const saveProfile = async () => {
  // Validate the profile before saving
  if (!validateProfile()) return;

  isEditing.value = false;
  loading.value = true;

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('User not authenticated');

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
      .eq('id', user.id); // Only update the current user's profile

    if (updateError) throw updateError;

    // Save the updated profile data to localStorage
    localStorage.setItem('userProfile', JSON.stringify(profile.value));

    // Show success message
    snackbarMsg.value = 'Profile saved successfully!';
    snackbarColor.value = 'green';
    snackbar.value = true;
  } catch (error) {
    console.error('Error saving profile:', error);
    snackbarMsg.value = 'An error occurred while saving. Please try again.';
    snackbarColor.value = 'red';
    snackbar.value = true;
  } finally {
    loading.value = false;
  }
};

const onImageSelected = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  selectedFile.value = file;
  imageLoading.value = true;

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;

    // Upload the image to the Supabase Storage bucket
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });
    if (uploadError) throw uploadError;

    // Get the public URL of the uploaded image
    const { data: publicData, error: publicUrlError } = await supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    if (publicUrlError || !publicData?.publicUrl) throw publicUrlError;

    const profileImageUrl = publicData.publicUrl;

    // Update the user's profile image URL in the profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: profileImageUrl })
      .eq('id', user.id);
    if (updateError) throw updateError;

    // Save the profile image URL in the profile state and update UI
    profileImage.value = profileImageUrl;

    snackbarMsg.value = 'Profile picture updated!';
    snackbar.value = true;
  } catch (error) {
    console.error('Error uploading profile image:', error);
  } finally {
    imageLoading.value = false;
  }
};


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
  if (index === 0) return 'School or university';
  if (index === 1) return 'Course or degree';
  if (index === 2) return 'Year level';
  return '';
};

// MOUNTED
onMounted(() => {
  theme.global.name.value = currentTheme.value;
  checkAuth(); // This checks if the user is logged in
  getUserProfile(); // Fetch the user profile from auth.user metadata

  // Retrieve the is_public_tutor state from localStorage
  const storedPublicTutorStatus = localStorage.getItem('is_public_tutor');
  if (storedPublicTutorStatus !== null) {
    profile.value.is_public_tutor = JSON.parse(storedPublicTutorStatus);
  }
});


//functional for public profile
// Apply as Tutor
const applyAsTutor = async () => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.id) return console.error('User error:', userError);

  const toggleStatus = !profile.value.is_public_tutor; // Toggle the status

  // Update the tutor status in the database
  const { error } = await supabase
    .from('profiles')
    .update({ is_public_tutor: toggleStatus })
    .eq('id', user.id);

  if (error) return console.error('Error updating tutor status:', error);

  profile.value.is_public_tutor = toggleStatus; // Update the local state
  
  // Persist the state in localStorage
  localStorage.setItem('is_public_tutor', toggleStatus);

  snackbarMsg.value = toggleStatus
    ? 'You are now visible as a public tutor.'
    : 'You have canceled your public tutor status.';
  snackbarColor.value = 'green';
  snackbar.value = true;

  // Close the dialog after the action is completed
  dialog.value = false;
};





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
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    currentUserId.value = user.id
    const { data } = await supabase
      .from('profiles')
      .select('firstname, lastname, is_public_tutor')
      .eq('id', user.id)
      .single()
    if (data) {
      currentUserProfile.value = {
        firstname: data.firstname || '',
        lastname: data.lastname || '',  // Ensure 'lastname' is correctly fetched
        avatar_url: data.avatar_url || '',
        is_public_tutor: data.is_public_tutor || false,
      }
    }
  }
}

/* === Logout === */
const handleLogoutClick = async () => {
  const { error } = await supabase.auth.signOut()

  if (error) {
  snackbarMsg.value = 'An error occurred. Please try again.';
  snackbarColor.value = 'red';
  snackbar.value = true;
} else {
  snackbarMsg.value = 'Profile updated successfully.';
  snackbarColor.value = 'green';
  snackbar.value = true;
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

onMounted(() => {
  // Check if profile data exists in localStorage
  const storedProfile = localStorage.getItem('userProfile');
  if (storedProfile) {
    profile.value = JSON.parse(storedProfile);
  } else {
    getUserProfile(); // If no profile in localStorage, fetch from Supabase
  }

  theme.global.name.value = currentTheme.value;
  checkAuth(); // This checks if the user is logged in
  fetchCurrentUser(); // Fetch the current user profile
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <v-app id="inspire">
   <!-- Drawer Sidebar-->
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
      <v-avatar size="100" class="mb-3" v-if="profileImage">
  <v-img
    :src="profileImage"
    cover  style="cursor: pointer"
  >
    <template #error>
      <v-icon size="80" color="grey-darken-1">mdi-account</v-icon>
    </template>
  </v-img>
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
        <div class="logo-wrapper">
       
          <v-avatar color="#fff" size="50" class="logo me-6">
            <v-img src="image/Teach&Learn.png" alt="Logo" />
          </v-avatar>
        </div>
      </v-container>

    </v-app-bar>
    <!--pop up alert
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
</v-snackbar>-->
<v-snackbar v-model="snackbar" timeout="3000" :color="snackbarColor || 'success'" location="top">
  {{ snackbarMsg }}
  <template #actions>
    <v-btn icon="mdi-close" variant="text" @click="snackbar = false" />
  </template>
</v-snackbar>




    <!-- MAIN CONTENT -->
    <v-main    :style="{
        backgroundColor: currentTheme === 'dark' ? '#222222' : '#fefcf9',
        color: currentTheme === 'dark' ? '#ffffff' : '#000000',
      }">
      <v-container fluid class="py-6 px-4 px-sm-6">
        <v-row justify="center">
          <v-col cols="12" sm="10" md="11" lg="11">
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
                <v-avatar size="100" class="mb-3" v-if="profileImage">
  <v-img
    :src="profileImage"
    cover
    @click="viewFullImage(profileImage)"
    style="cursor: pointer"
  >
    <template #error>
      <v-icon size="80" color="grey-darken-1">mdi-account</v-icon>
    </template>
  </v-img>
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
  @click="dialog = true"
  :loading="loading"
>
  {{ profile.is_public_tutor ? 'Cancel Apply' : 'Apply as Tutor?' }}
</v-btn>

</div>
           
              <!-- Confirm Dialog: Apply as Tutor -->
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
  :class="currentTheme === 'dark' ? 'bg-grey-darken-4 text-white' : 'bg-grey-lighten-5'"
>

  <!-- PERSONAL INFORMATION SECTION -->
  <v-sheet
    class="pa-4 mb-6 text-start"
    elevation="1"
    rounded="lg"
    :class="currentTheme === 'dark' ? 'bg-grey-darken-3' : 'bg-white'"
  >
    <v-card-title class="text-h6 mb-2 d-flex align-start text-start">
      <v-icon class="me-2" color="primary">mdi-account</v-icon>
      Personal Information
    </v-card-title>
    <v-divider class="mb-4" />

    <v-row
      v-for="(fieldKey, label) in fieldMappings"
      :key="fieldKey"
      class="pb-2 text-start"
      dense
    >
      <v-col cols="12" sm="6" class="font-weight-medium text-start">{{ label }}:</v-col>
      <v-col cols="12" sm="6" class="text-start">
        <div v-if="!isEditing" class="py-1">{{ profile[fieldKey] }}</div>
        <v-text-field
          v-else
          v-model="profile[fieldKey]"
          :placeholder="`Enter your ${label}`"
          density="compact"
          hide-details
          variant="outlined"
          :type="fieldKey === 'age' ? 'number' : 'text'"
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
    <v-card-title class="text-h6 mb-2 d-flex align-start text-start">
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
  <v-card-title class="text-h6 mb-2 d-flex align-start text-start">
    <v-icon class="me-2" color="primary">mdi-school-outline</v-icon>
    Educational Background
  </v-card-title>
  <v-divider class="mb-4" />

  <v-row>
    <v-col cols="12" class="text-start">
      <!-- View Mode -->
      <div v-if="!isEditing">
        <div
          v-for="(item, index) in profile.education"
          :key="index"
          class="py-1"
        >
          <div class="text-subtitle-2 font-weight-medium">
            {{ getEducationPlaceholder(index) }}:
          </div>
          <div>{{ item }}</div>
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
          class="mb-3 text-start"
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
  h1 {
    font-size: 1.8rem;
    letter-spacing: 0.2rem;
  }
}
</style>