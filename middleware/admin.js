import { useSupabaseUser } from '#imports'

export default defineNuxtRouteMiddleware((to, from) => {
  const user = useSupabaseUser()
  const adminId = 'd04dad76-47de-468b-ba95-b5269b1d5385'

  if (!user.value) {
    return navigateTo('/login')
  }

  if (user.value.id !== adminId) {
    return navigateTo('/')
  }
}) 