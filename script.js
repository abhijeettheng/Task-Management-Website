const taskList = document.getElementById("taskList");
const taskInput = document.getElementById("taskInput");
const dueDateInput = document.getElementById("dueDate");
const priorityInput = document.getElementById("priority");
const recurringInput = document.getElementById("recurring");

// --- Login & Personalization ---
function login(username) {
  localStorage.setItem("currentUser", username);

  // Check if user has existing tasks
  const existingTasks = localStorage.getItem(`tasks_${username}`);
  if (!existingTasks) {
    // First-time user — initialize empty task list
    localStorage.setItem(`tasks_${username}`, JSON.stringify([]));
  }

  loadTasks(username);
}


function loginUser() {
  const username = document.getElementById("username").value.trim();
  if (username) {
    login(username);
    document.querySelector(".login-container").style.display = "none";
    document.querySelector(".app-container").style.display = "block";
  } else {
    alert("Please enter a username!");
  }
}

function logoutUser() {
  localStorage.removeItem("currentUser");
  taskList.innerHTML = ""; // clear tasks from view
  document.querySelector(".app-container").style.display = "none";
  document.querySelector(".login-container").style.display = "block";
}

function saveTasks(username, tasks) {
  localStorage.setItem(`tasks_${username}`, JSON.stringify(tasks));
}

function loadTasks(username) {
  const tasks = JSON.parse(localStorage.getItem(`tasks_${username}`)) || [];
  renderTasks(tasks);
}

function renderTasks(tasks) {
  taskList.innerHTML = tasks.join("");
}

// --- Task Management ---
function addTask() {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) return alert("Please log in first!");

  const taskText = taskInput.value.trim();
  const dueDate = dueDateInput.value;
  const priority = priorityInput.value;
  const recurring = recurringInput.value;

  if (taskText === "") return;

  const li = document.createElement("li");

  // Build task content
  let taskContent = `${taskText}`;
  if (dueDate) taskContent += ` <small>(Due: ${dueDate})</small>`;

  if (priority) {
    let badgeClass = "";
    if (priority === "High") badgeClass = "priority-badge priority-high";
    if (priority === "Medium") badgeClass = "priority-badge priority-medium";
    if (priority === "Low") badgeClass = "priority-badge priority-low";
    taskContent += ` <span class="${badgeClass}">${priority}</span>`;
  }

  if (recurring) {
    taskContent += ` <span class="recurring-badge">${recurring}</span>`;
  }

  li.innerHTML = `
    <span>${taskContent}</span>
    <div class="task-actions">
      <button class="edit" onclick="editTask(this)">Edit</button>
      <button class="delete" onclick="deleteTask(this)">Delete</button>
    </div>
  `;

  li.dataset.dueDate = dueDate || "";
  li.dataset.priority = priority || "";
  li.dataset.recurring = recurring || "";

  taskList.appendChild(li);

  // Save updated tasks AFTER adding
  const tasks = Array.from(taskList.querySelectorAll("li")).map(li => li.outerHTML);
  saveTasks(currentUser, tasks);

  taskInput.value = "";
  dueDateInput.value = "";
  priorityInput.value = "";
  recurringInput.value = "";
  checkReminders();
}

// Edit Task
function editTask(button) {
  const li = button.parentElement.parentElement;
  const span = li.querySelector("span");
  const currentText = span.textContent.split(" (Due:")[0].split(" [")[0];
  const currentDate = li.dataset.dueDate;
  const currentPriority = li.dataset.priority;
  const currentRecurring = li.dataset.recurring;

  span.outerHTML = `
    <div class="edit-fields">
      <input type="text" value="${currentText}" />
      <input type="date" value="${currentDate}" />
      <select>
        <option value="">Priority (optional)</option>
        <option value="High" ${currentPriority === "High" ? "selected" : ""}>High 🔴</option>
        <option value="Medium" ${currentPriority === "Medium" ? "selected" : ""}>Medium 🟡</option>
        <option value="Low" ${currentPriority === "Low" ? "selected" : ""}>Low 🟢</option>
      </select>
      <select>
        <option value="">Recurring</option>
        <option value="Daily" ${currentRecurring === "Daily" ? "selected" : ""}>Daily</option>
        <option value="Weekly" ${currentRecurring === "Weekly" ? "selected" : ""}>Weekly</option>
        <option value="Monthly" ${currentRecurring === "Monthly" ? "selected" : ""}>Monthly</option>
      </select>
    </div>
  `;

  const actions = button.parentElement;
  actions.innerHTML = `
    <button class="save" onclick="saveTask(this)">Save</button>
    <button class="delete" onclick="deleteTask(this)">Delete</button>
  `;
}

// Save Edited Task
function saveTask(button) {
  const li = button.parentElement.parentElement;
  const editFields = li.querySelector(".edit-fields");
  const inputs = editFields.querySelectorAll("input, select");

  const newText = inputs[0].value.trim();
  const newDate = inputs[1].value;
  const newPriority = inputs[2].value;
  const newRecurring = inputs[3] ? inputs[3].value : "";

  // Build task content
  let taskContent = newText;
  if (newDate) taskContent += ` <small>(Due: ${newDate})</small>`;

  if (newPriority) {
    let badgeClass = "";
    if (newPriority === "High") badgeClass = "priority-badge priority-high";
    if (newPriority === "Medium") badgeClass = "priority-badge priority-medium";
    if (newPriority === "Low") badgeClass = "priority-badge priority-low";
    taskContent += ` <span class="${badgeClass}">${newPriority}</span>`;
  }

  if (newRecurring) {
    taskContent += ` <span class="recurring-badge">${newRecurring}</span>`;
  }

  editFields.outerHTML = `<span>${taskContent}</span>`;

  li.dataset.dueDate = newDate || "";
  li.dataset.priority = newPriority || "";
  li.dataset.recurring = newRecurring || "";

  const actions = li.querySelector(".task-actions");
  actions.innerHTML = `
    <button class="edit" onclick="editTask(this)">Edit</button>
    <button class="delete" onclick="deleteTask(this)">Delete</button>
  `;

  // Save updated tasks
  const currentUser = localStorage.getItem("currentUser");
  if (currentUser) {
    const tasks = Array.from(taskList.querySelectorAll("li")).map(li => li.outerHTML);
    saveTasks(currentUser, tasks);
  }

  checkReminders();
}

// Delete Task
function deleteTask(button) {
  const li = button.parentElement.parentElement;
  taskList.removeChild(li);

  const currentUser = localStorage.getItem("currentUser");
  if (currentUser) {
    const tasks = Array.from(taskList.querySelectorAll("li")).map(li => li.outerHTML);
    saveTasks(currentUser, tasks);
  }
}

// Reminder Check
function checkReminders() {
  const today = new Date().toISOString().split("T")[0];
  const tasks = taskList.querySelectorAll("li");

  tasks.forEach((li) => {
    const dueDate = li.dataset.dueDate;
    if (dueDate && dueDate < today) {
      li.classList.add("overdue");
    } else {
      li.classList.remove("overdue");
    }
  });
}

// Handle Recurring Tasks
function handleRecurringTasks() {
  const today = new Date();
  const tasks = taskList.querySelectorAll("li");

  tasks.forEach((li) => {
    const recurring = li.dataset.recurring;
    const dueDate = li.dataset.dueDate;

    if (!recurring || !dueDate) return;

    const taskDate = new Date(dueDate);
    const todayStr = today.toISOString().split("T")[0];

    if (dueDate === todayStr) {
      let nextDate = new Date(taskDate);
      if (recurring === "Daily") nextDate.setDate(taskDate.getDate() + 1);
      if (recurring === "Weekly") nextDate.setDate(taskDate.getDate() + 7);
      if (recurring === "Monthly") nextDate.setMonth(taskDate.getMonth() + 1);

      const newTask = li.cloneNode(true);
      newTask.dataset.dueDate = nextDate.toISOString().split("T")[0];
      newTask.querySelector("span").innerHTML = li.querySelector("span").innerHTML.replace(
        `(Due: ${dueDate})`,
        `(Due: ${newTask.dataset.dueDate})`
      );
      taskList.appendChild(newTask);
    }
  });
} // ✅ This closing brace was missing
setInterval(handleRecurringTasks, 60000);
setInterval(checkReminders, 60000);
