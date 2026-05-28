export const firebaseConfig = {
  apiKey: "AIzaSyA9qIUUlXMMMNbg77jG2jR7tA7aDl9FUGU",
  authDomain: "laundrymanagementsystem-d1490.firebaseapp.com",
  projectId: "laundrymanagementsystem-d1490",
  storageBucket: "laundrymanagementsystem-d1490.firebasestorage.app",
  messagingSenderId: "1071297410099",
  appId: "1:1071297410099:web:0fc1070de6fd68c8291f46",
  measurementId: "G-TL3Q3LZCE1"
};

const requiredFields = ["apiKey", "authDomain", "projectId", "messagingSenderId", "appId"];

export function getMissingConfigFields(config) {
  return requiredFields.filter((field) => {
    const value = config[field];
    return typeof value !== "string" || value.trim() === "" || value.startsWith("PASTE_");
  });
}

export function hasFirebaseConfig(config) {
  return getMissingConfigFields(config).length === 0;
}
