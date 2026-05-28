import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import {
  firebaseConfig,
  getMissingConfigFields,
  hasFirebaseConfig,
} from "./firebase-config.js";

const blockOptions = [
  "MH-1",
  "MH-2",
  "MH-3",
  "MH-4",
  "MH-5",
  "MH-6",
  "MH-7",
  "MH-8",
  "LH-1",
  "LH-2",
  "LH-3",
  "LH-4",
  "LH-5",
];

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const registerBlock = document.getElementById("registerBlock");
const registerMessage = document.getElementById("registerMessage");
const loginMessage = document.getElementById("loginMessage");
const switchLinks = document.querySelectorAll(".link-btn");
const panels = document.querySelectorAll(".panel");
const pageTitle = document.querySelector("h1");
const pageSubtext = document.querySelector(".subtext");

let auth = null;
let db = null;
let isRegisterFlow = false;

function populateBlocks() {
  blockOptions.forEach((block) => {
    const option = document.createElement("option");
    option.value = block;
    option.textContent = block;
    registerBlock.appendChild(option);
  });
}

function setMessage(element, text, type) {
  element.textContent = text;
  element.className = `message ${type}`;
}

function clearMessages() {
  registerMessage.textContent = "";
  registerMessage.className = "message";
  loginMessage.textContent = "";
  loginMessage.className = "message";
}

function normalizeRegNo(value) {
  return value.trim().toUpperCase();
}

function regNoToEmail(regNo) {
  const safeRegNo = regNo.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  return `${safeRegNo}@hostelconnect.app`;
}

function showPanel(panelId, shouldClearMessages = true) {
  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === panelId);
  });

  if (panelId === "loginPanel") {
    pageTitle.textContent = "Login";
    pageSubtext.textContent = "Use your registration number and password.";
  } else {
    pageTitle.textContent = "Create Account";
    pageSubtext.textContent = "Enter your details to create a new account.";
  }

  if (shouldClearMessages) {
    clearMessages();
  }
}

function mapFirebaseError(error) {
  const messages = {
    "auth/email-already-in-use": "This registration number already has an account.",
    "auth/invalid-email": "Registration number format is not accepted.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/invalid-credential": "Invalid registration number or password.",
    "auth/user-not-found": "Invalid registration number or password.",
    "auth/wrong-password": "Invalid registration number or password.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
  };

  return messages[error.code] || error.message || "Something went wrong.";
}

async function loadUserProfile(user) {
  const profileRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) {
    return {
      name: user.displayName || "User",
      regNo: "-",
      block: "-",
    };
  }

  return snapshot.data();
}

async function accountExistsByRegNo(regNo) {
  const email = regNoToEmail(regNo);
  const usersQuery = query(
    collection(db, "users"),
    where("email", "==", email)
  );
  const snapshot = await getDocs(usersQuery);
  return !snapshot.empty;
}

function initializeFirebase() {
  if (!hasFirebaseConfig(firebaseConfig)) {
    const missingFields = getMissingConfigFields(firebaseConfig);
    console.error(`Firebase config is incomplete. Missing: ${missingFields.join(", ")}`);
    return false;
  }

  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  return true;
}

switchLinks.forEach((button) => {
  button.addEventListener("click", () => {
    showPanel(button.dataset.target);
  });
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!auth || !db) {
    setMessage(registerMessage, "Service is not ready right now.", "error");
    return;
  }

  const payload = {
    regNo: normalizeRegNo(document.getElementById("registerRegNo").value),
    name: document.getElementById("registerName").value.trim(),
    password: document.getElementById("registerPassword").value.trim(),
    block: registerBlock.value,
  };

  if (!payload.regNo || !payload.name || !payload.password || !payload.block) {
    setMessage(registerMessage, "Please fill all fields.", "error");
    return;
  }

  try {
    isRegisterFlow = true;
    const email = regNoToEmail(payload.regNo);
    const userCredential = await createUserWithEmailAndPassword(auth, email, payload.password);

    await updateProfile(userCredential.user, {
      displayName: payload.name,
    });

    await setDoc(doc(db, "users", userCredential.user.uid), {
      regNo: payload.regNo,
      name: payload.name,
      block: payload.block,
      email,
      createdAt: serverTimestamp(),
    });

    await signOut(auth);
    registerForm.reset();
    document.getElementById("loginRegNo").value = payload.regNo;
    showPanel("loginPanel");
    setMessage(loginMessage, "Account created. Login now.", "success");
  } catch (error) {
    setMessage(registerMessage, mapFirebaseError(error), "error");
  } finally {
    isRegisterFlow = false;
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!auth || !db) {
    setMessage(loginMessage, "Service is not ready right now.", "error");
    return;
  }

  const payload = {
    regNo: normalizeRegNo(document.getElementById("loginRegNo").value),
    password: document.getElementById("loginPassword").value.trim(),
  };

  if (!payload.regNo || !payload.password) {
    setMessage(loginMessage, "Please enter registration number and password.", "error");
    return;
  }

  try {
    const email = regNoToEmail(payload.regNo);
    const userCredential = await signInWithEmailAndPassword(auth, email, payload.password);
    const profile = await loadUserProfile(userCredential.user);
    setMessage(loginMessage, `Login successful. Welcome ${profile.name}.`, "success");
    loginForm.reset();
    window.location.href = "./HomeSection/index.html";
  } catch (error) {
    const hasAccount = await accountExistsByRegNo(payload.regNo);

    if (!hasAccount) {
      setMessage(loginMessage, "Account not found.", "warning");
      return;
    }

    setMessage(loginMessage, "Wrong credentials.", "error");
  }
});

populateBlocks();

if (initializeFirebase()) {
  onAuthStateChanged(auth, async (user) => {
    if (isRegisterFlow) {
      return;
    }

    if (!user) {
      return;
    }

    try {
      const profile = await loadUserProfile(user);
      showPanel("loginPanel", false);
      window.location.href = "./HomeSection/index.html";
    } catch (error) {
      setMessage(loginMessage, "Signed in, but profile could not be loaded.", "error");
    }
  });
}
