// Simple date helpers
function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
function compareDate(d1, d2) {
  // returns -1,0,1 for d1<d2, equal, d1>d2
  const a = new Date(d1), b = new Date(d2);
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

// State
let currentUser = null;
let tasks = []; // { id, title, dueDate(YYYY-MM-DD|""), priority, recurring, completed }

// Storage keys
function tasksKey(user) { return `tasks_${user}`; }
const userKey = "currentUser";

// DOM
const loginContainer = document.querySelector(".login-container");
const loginBtn = document.getElementById("loginBtn");
const usernameInput = document.getElementById("username");

const sidebar = document.querySelector(".sidebar");
const addTaskSidebarBtn = document.getElementById("addTaskSidebarBtn");

const app = document.querySelector(".app-container");
const logoutBtn = document.getElementById("logoutBtn");

// Sections
const overdueList = document.getElementById("overdueList");
const todayList = document.getElementById("todayList");
const upcomingList = document.getElementById("upcomingList");
const inboxList = document.getElementById("inboxList");
const completedList = document.getElementById("completedList");
const inboxCount = document.getElementById("inboxCount");

// Modal
const modalBackdrop = document.getElementById("taskModalBackdrop");
const confirmAddTaskBtn = document.getElementById("confirmAddTaskBtn");
const cancelAddTaskBtn = document.getElementById("cancelAddTaskBtn");

const taskInput = document.getElementById("taskInput");
const dueDateInput = document.getElementById("dueDate");
const prioritySelect = document.getElementById("priority");
const recurringSelect = document.getElementById("recurring");

// Init
window.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  restoreSession();
});

function bindEvents() {
  if (loginBtn) loginBtn.addEventListener("click", loginUser);
  if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);
  if (addTaskSidebarBtn) addTaskSidebarBtn.addEventListener("click", openAddTaskModal);

  if (confirmAddTaskBtn) confirmAddTaskBtn.addEventListener("click", addTaskFromModal);
  if (cancelAddTaskBtn) cancelAddTaskBtn.addEventListener("click", closeAddTaskModal);

  // Sidebar filters (optional view focus)
  document.querySelectorAll(".nav-links li").forEach(li => {
    li.addEventListener("click", () => focusView(li.getAttribute("data-view")));
  });
}

// Session
function restoreSession() {
  const saved = localStorage.getItem(userKey);
  if (saved) {
    currentUser = saved;
    showApp();
    loadTasks();
    renderAllSections();
  } else {
    showLogin();
  }
}
function loginUser() {
  const name = usernameInput.value.trim();
  if (!name) { alert("Please enter a username!"); return; }
  currentUser = name;
  localStorage.setItem(userKey, currentUser);
  showApp();
  loadTasks(); // load existing or init
  renderAllSections();
}
function logoutUser() {
  localStorage.removeItem(userKey);
  currentUser = null;
  tasks = [];
  hideApp();
  showLogin();
}

// UI toggles
function showLogin() {
  loginContainer.style.display = "block";
  sidebar.style.display = "none";
  app.style.display = "none";
}
function showApp() {
  loginContainer.style.display = "none";
  sidebar.style.display = "block";
  app.style.display = "block";
}
function hideApp() {
  sidebar.style.display = "none";
  app.style.display = "none";
}

// Tasks storage
function loadTasks() {
  const raw = localStorage.getItem(tasksKey(currentUser));
  if (raw) {
    tasks = JSON.parse(raw);
  } else {
    tasks = [];
    localStorage.setItem(tasksKey(currentUser), JSON.stringify(tasks));
  }
}
function saveTasks() {
  localStorage.setItem(tasksKey(currentUser), JSON.stringify(tasks));
}

// Modal
function openAddTaskModal() {
  clearModalInputs();
  modalBackdrop.style.display = "flex";
  modalBackdrop.setAttribute("aria-hidden", "false");
}
function closeAddTaskModal() {
  modalBackdrop.style.display = "none";
  modalBackdrop.setAttribute("aria-hidden", "true");
}
function clearModalInputs() {
  taskInput.value = "";
  dueDateInput.value = "";
  prioritySelect.value = "";
  recurringSelect.value = "";
}
function addTaskFromModal() {
  const title = taskInput.value.trim();
  const dueDate = (dueDateInput.value || "").trim();
  const priority = prioritySelect.value || "";
  const recurring = recurringSelect.value || "";

  if (!title) { alert("Please enter a task name."); return; }

  const newTask = {
    id: cryptoRandomId(),
    title,
    dueDate,
    priority,
    recurring,
    completed: false
  };
  tasks.push(newTask);
  saveTasks();
  renderAllSections();

  // ✅ Always close modal
  closeAddTaskModal();
}


// Rendering
function renderAllSections() {
  // Clear lists
  [todayList, completedList].forEach(ul => ul.innerHTML = "");

  const todayItems = [];
  const completed = [];

  tasks.forEach(t => {
    if (t.completed) {
      completed.push(t);
    } else {
      todayItems.push(t); // ✅ everything else goes to Today
    }
  });

  todayItems.forEach(t => todayList.appendChild(taskCard(t)));
  completed.forEach(t => completedList.appendChild(taskCard(t)));

  inboxCount.textContent = 0; // no inbox count needed anymore
}


  // Render helpers
  overdue.forEach(t => overdueList.appendChild(taskCard(t)));
  todayItems.forEach(t => todayList.appendChild(taskCard(t)));
  upcoming.forEach(t => upcomingList.appendChild(taskCard(t)));
  inbox.forEach(t => inboxList.appendChild(taskCard(t)));
  completed.forEach(t => completedList.appendChild(taskCard(t)));

  inboxCount.textContent = inbox.length;


function taskCard(t) {
  const li = document.createElement("li");
  li.className = "task-card";

  //Highlight overdue tasks
  const today = todayStr();
  if (!t.completed && t.dueDate && compareDate(t.dueDate, today) < 0) {
    li.classList.add("overdue");
  }

  const main = document.createElement("div");
  main.className = "task-main";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = !!t.completed;
  checkbox.addEventListener("change", () => {
    t.completed = checkbox.checked;
    saveTasks();
    renderAllSections();
  });
  const title = document.createElement("span");
  title.className = "task-title";
  title.textContent = t.title;

  main.appendChild(checkbox);
  main.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "task-meta";

  if (t.priority) {
    const p = document.createElement("span");
    p.className =
      t.priority === "High" ? "badge priority-high" :
      t.priority === "Medium" ? "badge priority-medium" :
      "badge priority-low";
    p.textContent = t.priority;
    meta.appendChild(p);
  }

  if (t.recurring) {
    const r = document.createElement("span");
    r.className = "badge recurring-badge";
    r.textContent = t.recurring;
    meta.appendChild(r);
  }

  if (t.dueDate) {
    const d = document.createElement("span");
    d.className = "due-date";
    d.textContent = `Due: ${t.dueDate}`;
    meta.appendChild(d);
  }

  const actions = document.createElement("div");
  actions.className = "task-actions";
  const editBtn = document.createElement("button");
  editBtn.className = "edit";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => editTask(t.id));

  const delBtn = document.createElement("button");
  delBtn.className = "delete";
  delBtn.textContent = "Delete";
  delBtn.addEventListener("click", () => deleteTask(t.id));

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  li.appendChild(main);
  li.appendChild(actions);
  li.appendChild(meta);

  return li;
}

function editTask(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  // Pre-fill modal
  taskInput.value = t.title;
  dueDateInput.value = t.dueDate || "";
  prioritySelect.value = t.priority || "";
  recurringSelect.value = t.recurring || "";

  modalBackdrop.style.display = "flex";
  modalBackdrop.setAttribute("aria-hidden", "false");

  // Temporarily change confirm handler to save edit
  const originalHandler = addTaskFromModal;
  confirmAddTaskBtn.removeEventListener("click", addTaskFromModal);
  const saveEdit = () => {
    t.title = taskInput.value.trim();
    t.dueDate = (dueDateInput.value || "").trim();
    t.priority = prioritySelect.value || "";
    t.recurring = recurringSelect.value || "";
    saveTasks();
    renderAllSections();
    closeAddTaskModal();
    // restore original handler
    confirmAddTaskBtn.removeEventListener("click", saveEdit);
    confirmAddTaskBtn.addEventListener("click", originalHandler);
  };
  confirmAddTaskBtn.addEventListener("click", saveEdit);
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderAllSections();
}

// Focus view (optional: scroll to section)
function focusView(view) {
  const map = {
    inbox: "inboxSection",
    today: "todaySection",
    upcoming: "upcomingSection",
    completed: "completedSection"
  };
  const targetId = map[view];
  if (!targetId) return;
  const el = document.getElementById(targetId);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Utils
function cryptoRandomId() {
  // Fallback for environments without crypto
  if (window.crypto && crypto.getRandomValues) {
    const arr = new Uint32Array(2);
    crypto.getRandomValues(arr);
    return `t_${arr[0].toString(16)}${arr[1].toString(16)}`;
  }
  return `t_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}
