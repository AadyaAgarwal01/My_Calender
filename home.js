const sidebarToggle = document.querySelector(".sidebar-toggle");
const sidebar = document.getElementById("sidebar");
sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});
let tasks = [];
let editingTaskId = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

const taskList = document.getElementById("taskList");
const addTaskBtn = document.getElementById("addTaskBtn");
const modalBg = document.getElementById("modalBg");
const taskForm = document.getElementById("taskForm");
const modalTitle = document.getElementById("modalTitle");
const calendarGrid = document.getElementById("calendarGrid");
const calendarMonth = document.getElementById("calendarMonth");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const progressBar = document.getElementById("progress");
const taskTitle = document.getElementById("taskTitle");
const taskCategory = document.getElementById("taskCategory");
const taskDueDate = document.getElementById("taskDueDate");
const taskPriority = document.getElementById("taskPriority");
const cancelBtn = document.getElementById("cancelBtn");

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}
function loadTasks() {
  const stored = localStorage.getItem("tasks");
  if (stored) tasks = JSON.parse(stored);
}
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
function getTodayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function getMonthName(month, year) {
  return new Date(year, month).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}
function renderTasks() {
  taskList.innerHTML = "";
  tasks.sort(
    (a, b) =>
      a.completed - b.completed || new Date(a.dueDate) - new Date(b.dueDate)
  );
  for (const task of tasks) {
    const li = document.createElement("li");
    li.className = "task" + (task.completed ? " completed" : "");
    li.setAttribute("draggable", true);
    li.setAttribute("data-id", task.id);
    li.setAttribute("data-category", task.category);

    li.innerHTML = `
        <div class="info">
          <div class="title">${task.title}</div>
          <div class="meta">${formatDate(
            task.dueDate
          )} | <span style="color:var(--${task.category})">${
      task.category
    }</span> | <span style="text-transform:capitalize">${
      task.priority
    }</span></div>
        </div>
        <div class="actions">
          <button title="Edit" onclick="editTask('${task.id}')">&#9998;</button>
          <button title="Delete" onclick="deleteTask('${
            task.id
          }')">&#128465;</button>
          <button title="Complete" onclick="toggleComplete('${task.id}')">${
      task.completed ? "&#10004;" : "&#9711;"
    }</button>
        </div>
      `;
    li.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", task.id);
    });
    taskList.appendChild(li);
  }
  renderProgress();
}

function renderProgress() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  progressBar.style.width = percent + "%";
}

function renderCalendar() {
  calendarMonth.textContent = getMonthName(currentMonth, currentYear);
  calendarGrid.innerHTML = "";
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  for (let i = 0; i < startDay; i++) {
    const div = document.createElement("div");
    div.className = "calendar-day";
    calendarGrid.appendChild(div);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
    const div = document.createElement("div");
    div.className = "calendar-day";
    if (dateStr === getTodayStr()) div.classList.add("today");
    div.setAttribute("data-date", dateStr);

    div.innerHTML = `<div class="date">${day}</div><div class="calendar-tasks"></div>`;
    div.addEventListener("dragover", (e) => {
      e.preventDefault();
      div.classList.add("dragover");
    });
    div.addEventListener("dragleave", () => div.classList.remove("dragover"));
    div.addEventListener("drop", (e) => {
      e.preventDefault();
      div.classList.remove("dragover");
      const taskId = e.dataTransfer.getData("text/plain");
      moveTaskToDate(taskId, dateStr);
    });
    const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
    const ct = div.querySelector(".calendar-tasks");
    for (const t of dayTasks) {
      const span = document.createElement("div");
      span.className = "calendar-task" + (t.completed ? " completed" : "");
      span.setAttribute("draggable", true);
      span.setAttribute("data-id", t.id);
      span.setAttribute("data-category", t.category);
      span.textContent = t.title;
      span.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", t.id);
      });
      ct.appendChild(span);
    }
    calendarGrid.appendChild(div);
  }
}
function openModal(editing = false, task = {}) {
  modalBg.classList.add("active");
  modalTitle.textContent = editing ? "Edit Task" : "Add Task";
  taskTitle.value = task.title || "";
  taskCategory.value = task.category || "work";
  taskDueDate.value = task.dueDate || getTodayStr();
  taskPriority.value = task.priority || "medium";
  editingTaskId = editing ? task.id : null;
}
function closeModal() {
  modalBg.classList.remove("active");
  taskForm.reset();
  editingTaskId = null;
}
addTaskBtn.onclick = () => openModal();
cancelBtn.onclick = closeModal;
modalBg.onclick = (e) => {
  if (e.target === modalBg) closeModal();
};

taskForm.onsubmit = function (e) {
  e.preventDefault();
  const newTask = {
    id: editingTaskId || Math.random().toString(36).slice(2, 9),
    title: taskTitle.value.trim(),
    category: taskCategory.value,
    dueDate: taskDueDate.value,
    priority: taskPriority.value,
    completed: false,
  };
  if (editingTaskId) {
    const idx = tasks.findIndex((t) => t.id === editingTaskId);
    if (idx > -1) tasks[idx] = { ...tasks[idx], ...newTask };
  } else {
    tasks.push(newTask);
  }
  saveTasks();
  renderTasks();
  renderCalendar();
  closeModal();
};

window.editTask = function (id) {
  const t = tasks.find((t) => t.id === id);
  if (t) openModal(true, t);
};
window.deleteTask = function (id) {
  if (confirm("Delete this task?")) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    renderTasks();
    renderCalendar();
  }
};
window.toggleComplete = function (id) {
  const t = tasks.find((t) => t.id === id);
  if (t) t.completed = !t.completed;
  saveTasks();
  renderTasks();
  renderCalendar();
};
function moveTaskToDate(id, dateStr) {
  const t = tasks.find((t) => t.id === id);
  if (t) t.dueDate = dateStr;
  saveTasks();
  renderTasks();
  renderCalendar();
}
prevMonthBtn.onclick = () => {
  if (currentMonth === 0) {
    currentMonth = 11;
    currentYear--;
  } else currentMonth--;
  renderCalendar();
};
nextMonthBtn.onclick = () => {
  if (currentMonth === 11) {
    currentMonth = 0;
    currentYear++;
  } else currentMonth++;
  renderCalendar();
};
function init() {
  loadTasks();
  renderTasks();
  renderCalendar();
}
init();
