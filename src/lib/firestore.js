import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// Users
export function getUserDoc(uid) {
  return getDoc(doc(db, 'users', uid))
}

export function createUserDoc(uid, data) {
  return setDoc(doc(db, 'users', uid), {
    ...data,
    createdAt: serverTimestamp(),
    isActive: true,
  })
}

export function updateUserDoc(uid, data) {
  return updateDoc(doc(db, 'users', uid), data)
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// Universities
export async function getUniversities() {
  const snap = await getDocs(collection(db, 'universities'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export function createUniversity(data) {
  return addDoc(collection(db, 'universities'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export function updateUniversity(id, data) {
  return updateDoc(doc(db, 'universities', id), data)
}

// Faculties
export async function getFacultiesByUniversity(universityId) {
  const q = query(collection(db, 'faculties'), where('universityId', '==', universityId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getAllFaculties() {
  const snap = await getDocs(collection(db, 'faculties'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export function createFaculty(data) {
  return addDoc(collection(db, 'faculties'), data)
}

// Step Templates
export async function getStepTemplates() {
  const snap = await getDocs(collection(db, 'stepTemplates'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export function createStepTemplate(data) {
  return addDoc(collection(db, 'stepTemplates'), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export function updateStepTemplate(id, data) {
  return updateDoc(doc(db, 'stepTemplates', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export function deleteStepTemplate(id) {
  return deleteDoc(doc(db, 'stepTemplates', id))
}

// Orders
export function createOrder(data) {
  return addDoc(collection(db, 'orders'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function updateOrder(orderId, data) {
  return updateDoc(doc(db, 'orders', orderId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export function subscribeToOrder(orderId, callback) {
  return onSnapshot(doc(db, 'orders', orderId), callback)
}

export function subscribeToOrders(filters, callback) {
  let q = collection(db, 'orders')
  const constraints = [orderBy('createdAt', 'desc')]

  if (filters.universityId) {
    constraints.unshift(where('universityId', '==', filters.universityId))
  }
  if (filters.status) {
    constraints.unshift(where('status', '==', filters.status))
  }

  q = query(q, ...constraints)
  return onSnapshot(q, callback)
}

// Activity log
export function addActivity(orderId, data) {
  return addDoc(collection(db, 'orders', orderId, 'activity'), {
    ...data,
    timestamp: serverTimestamp(),
  })
}

export function subscribeToActivity(orderId, callback) {
  const q = query(
    collection(db, 'orders', orderId, 'activity'),
    orderBy('timestamp', 'desc')
  )
  return onSnapshot(q, callback)
}

export { serverTimestamp, Timestamp }
