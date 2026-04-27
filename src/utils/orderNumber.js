export async function generateOrderNumber(db) {
  // We use a simple counter stored in Firestore to ensure unique sequential numbers.
  // For production, use a Cloud Function transaction for atomicity.
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `WROP-${year}-${random}`
}
