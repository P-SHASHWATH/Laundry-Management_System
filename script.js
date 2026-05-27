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

// Connect your future backend here.
// The frontend should call an API, and that API should save/read from AWS RDS.
// Expected register payload: { regNo, name, password, block }
// Expected login payload: { regNo, password }
// Example login response: { name: "Student Name" }
const API_CONFIG = {
  baseUrl: "http://localhost:3000/api",
  registerPath: "/register",
  loginPath: "/login",
};

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const registerBlock = document.getElementById("registerBlock");
const registerMessage = document.getElementById("registerMessage");
const loginMessage = document.getElementById("loginMessage");
const switchLinks = document.querySelectorAll(".link-btn");
const panels = document.querySelectorAll(".panel");
const pageTitle = document.querySelector("h1");
const pageSubtext = document.querySelector(".subtext");

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

function showPanel(panelId) {
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

  clearMessages();
}

async function postJson(path, payload) {
  const response = await fetch(`${API_CONFIG.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data = {};

  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

switchLinks.forEach((button) => {
  button.addEventListener("click", () => {
    showPanel(button.dataset.target);
  });
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

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
    await postJson(API_CONFIG.registerPath, payload);
    registerForm.reset();
    document.getElementById("loginRegNo").value = payload.regNo;
    showPanel("loginPanel");
    setMessage(loginMessage, "Account created. Login now.", "success");
  } catch (error) {
    setMessage(
      registerMessage,
      `${error.message} Connect this form to your AWS backend when ready.`,
      "error"
    );
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    regNo: normalizeRegNo(document.getElementById("loginRegNo").value),
    password: document.getElementById("loginPassword").value.trim(),
  };

  if (!payload.regNo || !payload.password) {
    setMessage(loginMessage, "Please enter registration number and password.", "error");
    return;
  }

  try {
    const data = await postJson(API_CONFIG.loginPath, payload);
    const name = data.name || "User";
    setMessage(loginMessage, `Login successful. Welcome ${name}.`, "success");
    loginForm.reset();
  } catch (error) {
    setMessage(
      loginMessage,
      `${error.message} Connect this form to your AWS backend when ready.`,
      "error"
    );
  }
});

populateBlocks();
