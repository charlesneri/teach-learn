import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)


//form action defaults
export const formActionDefault = {
  formProcess: false,
  formStatus: 200,
  formErrorMessage: '',
  formSuccessMessage: '',
}
/*
//retrieve adata
export const getUserInfo = async() =>{

  const{
    data:{
      user:{user_metadata}
    }
  } =await supabase.auth.getUser()
return user_metadata
 
}*/
/*
export const getUserInfo = async () => {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Error getting user info:', error)
    return null
  }

  if (!data || !data.user) {
    console.error('No user logged in')
    return null
  }

  return data.user.user_metadata
}*/
