const taskList = document.getElementById("taskList");
const taskInput = document.getElementById("taskInput");
const dueDateInput = document.getElementById("dueDate");
const priorityInput = document.getElementById("priority");

// Add Task
function addTask() {
  const taskText = taskInput.value.trim();
  const dueDate = dueDateInput.value;
  const priority = priorityInput.value;

  if (taskText === "") return; // only block empty text

  const li = document.createElement("li");

  // Build task content
  let taskContent = taskText;
  if (dueDate) taskContent += ` <small>(Due: ${dueDate})</small>`;
  if (priority) taskContent += ` <small>[${priority}]</small>`;

  li.innerHTML = `
    <span>${taskContent}</span>
    <div class="task-actions">
      <button class="edit" onclick="editTask(this)">Edit</button>
      <button class="delete" onclick="deleteTask(this)">Delete</button>
    </div>
  `;

  li.dataset.dueDate = dueDate || "";
  li.dataset.priority = priority || "";

  // Add priority styling
  if (priority === "High") li.classList.add("priority-high");
  if (priority === "Medium") li.classList.add("priority-medium");
  if (priority === "Low") li.classList.add("priority-low");

  taskList.appendChild(li);

  taskInput.value = "";
  dueDateInput.value = "";
  priorityInput.value = "";
  checkReminders();
}

// Edit Task
function editTask(button) {
  const li = button.parentElement.parentElement;
  const span = li.querySelector("span");
  const currentText = span.textContent.split(" (Due:")[0].split(" [")[0];
  const currentDate = li.dataset.dueDate;
  const currentPriority = li.dataset.priority;

  // Replace span with input fields and wrap them in a div
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
    </div>
  `;

  // Replace buttons with Save and Delete
  const actions = button.parentElement;
  actions.innerHTML = `
    <button class="save" onclick="saveTask(this)">Save</button>
    <button class="delete" onclick="deleteTask(this)">Delete</button>
  `;
}

// Save Edited Task
function saveTask(button) {
  const li = button.parentElement.parentElement;
  const inputs = li.querySelectorAll("input, select");
  const newText = inputs[0].value.trim();
  const newDate = inputs[1].value;
  const newPriority = inputs[2].value;

  let taskContent = newText;
  if (newDate) taskContent += ` <small>(Due: ${newDate})</small>`;
  if (newPriority) taskContent += ` <small>[${newPriority}]</small>`;

  inputs[0].outerHTML = `<span>${taskContent}</span>`;
  inputs[1].remove();
  inputs[2].remove();

  li.dataset.dueDate = newDate || "";
  li.dataset.priority = newPriority || "";

  // Reset priority styling
  li.classList.remove("priority-high", "priority-medium", "priority-low");
  if (newPriority === "High") li.classList.add("priority-high");
  if (newPriority === "Medium") li.classList.add("priority-medium");
  if (newPriority === "Low") li.classList.add("priority-low");

  button.textContent = "Edit";
  button.className = "edit";
  button.setAttribute("onclick", "editTask(this)");
  checkReminders();
}

// Delete Task
function deleteTask(button) {
  const li = button.parentElement.parentElement;
  taskList.removeChild(li);
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

setInterval(checkReminders, 60000);
