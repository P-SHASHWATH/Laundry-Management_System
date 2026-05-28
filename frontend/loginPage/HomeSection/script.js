import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { firebaseConfig, hasFirebaseConfig } from "../firebase-config.js";

const welcomeName = document.getElementById("welcomeName");
const welcomeMeta = document.getElementById("welcomeMeta");
const logoutBtn = document.getElementById("logoutBtn");
const statusMessage = document.getElementById("statusMessage");
const openButtons = document.querySelectorAll(".open-btn");

function showMessage(text) {
  statusMessage.textContent = text;
}

if (!hasFirebaseConfig(firebaseConfig)) {
  showMessage("Service is not ready right now.");
  throw new Error("Firebase config is incomplete.");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function loadProfile(user) {
  const snapshot = await getDoc(doc(db, "users", user.uid));

  if (!snapshot.exists()) {
    return {
      name: user.displayName || "User",
      regNo: "-",
      block: "-",
    };
  }

  return snapshot.data();
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../index.html";
    return;
  }

  try {
    const profile = await loadProfile(user);
    welcomeName.textContent = `Welcome, ${profile.name || "User"}`;
    welcomeMeta.textContent = `${profile.regNo || "-"} | ${profile.block || "-"}`;
  } catch (error) {
    showMessage("Could not load account details.");
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "../index.html";
});

openButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showMessage(`${button.dataset.section} will be added next.`);
  });
});
