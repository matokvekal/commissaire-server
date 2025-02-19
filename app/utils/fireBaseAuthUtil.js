import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync(new URL("../../serviceAccountKey.json", import.meta.url))
);

import admin from "firebase-admin";

const project_id = "upwize-app";

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${project_id}.firebaseio.com`
});

/**
 * Verifies the Firebase ID token and decodes it to get user data.
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<object>} - Decoded token data
 */
const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return { valid: true, decodedToken };
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return { valid: false, error };
  }
};

/**
 * Extracts user data from the decoded token.
 * @param {object} decodedToken - Decoded token from Firebase
 * @returns {object} - User data including email, uid, name, and picture
 */
const getUserData = (decodedToken) => {
  const { email, uid, name, picture, phone_number } = decodedToken;
  return { email, uid, name, picture, phone_number };
};

export { verifyIdToken, getUserData };
