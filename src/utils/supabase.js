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
//retrieve adata
/*export const getUserInfo = async() =>{

  const{
    data:{
      user:{user_metadata}
    }
  } =await supabase.auth.getUser()
return user_metadata
 
}*/