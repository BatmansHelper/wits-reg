import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from './firebase'

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
