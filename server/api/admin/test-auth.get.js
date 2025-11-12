// server/api/admin/test-auth.get.js
export default defineEventHandler(async (event) => {
  try {
    const response = await $fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_ROLE_KEY
      }
    })

    return {
      success: true,
      message: 'Auth test passed',
      supabaseUrl: process.env.SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_ROLE_KEY
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
})
