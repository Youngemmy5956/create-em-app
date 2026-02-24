/**
 * Convert a Firebase error code into a human-readable message.
 */
export function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    "auth/user-not-found":         "No account found with this email.",
    "auth/wrong-password":         "Incorrect password.",
    "auth/email-already-in-use":   "An account with this email already exists.",
    "auth/invalid-email":          "Please enter a valid email address.",
    "auth/weak-password":          "Password must be at least 6 characters.",
    "auth/too-many-requests":      "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "permission-denied":           "You don't have permission to do that.",
    "not-found":                   "The requested resource was not found.",
  };
  return messages[code] ?? "Something went wrong. Please try again.";
}
