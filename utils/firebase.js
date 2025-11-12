// utils/firebase.js
import {initializeApp, getApps, getApp} from 'firebase/app'
import {getMessaging, getToken as getMessagingToken} from 'firebase/messaging'

let firebaseApp
let messagingInstance

export function initializeFirebase(config) {
  try {
    if (!getApps().length) {
      firebaseApp = initializeApp(config)
    } else {
      firebaseApp = getApp()
    }
    return firebaseApp
  } catch (error) {
    console.error("Erreur lors de l'initialisation de Firebase:", error)
    return null
  }
}

export function getFirebaseApp() {
  if (!firebaseApp && typeof window !== 'undefined') {
    throw new Error(
      'Firebase app not initialized. Call initializeFirebase first.'
    )
  }
  return firebaseApp
}

export function getMessagingInstance() {
  if (!messagingInstance && typeof window !== 'undefined') {
    try {
      const app = getFirebaseApp()
      if (!app) {
        throw new Error('Firebase app not initialized')
      }
      messagingInstance = getMessaging(app)
    } catch (error) {
      console.error('Error initializing messaging:', error)
      return null
    }
  }
  return messagingInstance
}
