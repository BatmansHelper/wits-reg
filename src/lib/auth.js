import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { auth, firebaseConfig } from './firebase'

export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function signOut() {
  return firebaseSignOut(auth)
}

export function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email)
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

export async function createAuthUser(email) {
  // Use a secondary app so the current super_admin session is not disrupted
  const secondaryAppName = 'UserCreation'
  const existing = getApps().find(a => a.name === secondaryAppName)
  const secondaryApp = existing ?? initializeApp(firebaseConfig, secondaryAppName)
  const secondaryAuth = getAuth(secondaryApp)

  // Create with a random temp password — user will set their own via the reset email
  const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, tempPassword)
  const uid = cred.user.uid

  // Send password-set email immediately
  await sendPasswordResetEmail(secondaryAuth, email)
  await firebaseSignOut(secondaryAuth)

  return uid
}
