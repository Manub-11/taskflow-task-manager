const kanbanSections = document.querySelectorAll(".kanban-section");
const btnAdd = document.querySelector(".btn-add");
const btnSave = document.querySelector(".btn-save");
const taskModal = document.querySelector(".task-modal");
const modalOverlay = document.querySelector(".modal-overlay");
const dataClose = document.querySelectorAll("[data-close]");
const toDoSection = document.querySelector(".todo");
const inputTitle = document.querySelector("#taskTitle");
const inputDescription = document.querySelector("#taskDescription");
const inputCategory = document.querySelector("#taskCategory");
const suggestionTags = document.querySelectorAll(".suggestion-tag");
const filterSelected = document.querySelector("#filter-selected");
const filterOptions = document.querySelector("#filter-options");
const filterOptionItems = document.querySelectorAll(".filter-option");
const searchInput = document.querySelector("#search-input");
const formError = document.querySelector("#formError");

// STATE

const placeholder = document.createElement("div");
placeholder.classList.add("task-placeholder");

let taskBeingEdited = null;
let currentFilter = "all";

// LOCAL STORAGE

function getTasks() {
  return JSON.parse(localStorage.getItem("tasks")) || [];
}

function saveTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
  const tasks = getTasks();

  // Filter out corrupted data
  const validTasks = tasks.filter((task) => task && task.id && task.title);

  // Clean localStorage if corrupted tasks found
  if (validTasks.length !== tasks.length) {
    saveTasks(validTasks);
  }

  validTasks.forEach((task) => {
    createTaskFromData(task);
  });
}

// MODAL

function openModal() {
  taskModal.classList.add("show");
  modalOverlay.classList.add("show");
}

function closeModal() {
  taskModal.classList.remove("show");
  modalOverlay.classList.remove("show");
}

// TASK CREATION HELPERS

function createCheckElement() {
  const checkEl = document.createElement("div");
  checkEl.classList.add("check-el");

  const checkIcon = document.createElement("div");
  checkIcon.innerHTML = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      width="20"
      height="20"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="m4.5 12.75 6 6 9-13.5"
      />
    </svg>
  `;

  checkIcon.classList.add("check-icon");
  checkEl.addEventListener("click", completeTask);
  checkEl.appendChild(checkIcon);
  return checkEl;
}

function createCategoryTag(category) {
  if (!category) return null;
  const tag = document.createElement("span");
  tag.textContent = category;
  tag.classList.add("tag", `tag-${category}`);
  return tag;
}

function createTaskActions(task) {
  const actions = document.createElement("div");
  actions.classList.add("task-actions");

  const menu = document.createElement("div");
  menu.classList.add("task-menu");
  menu.style.display = "none";

  // Edit action
  const editTaskAction = document.createElement("div");
  editTaskAction.classList.add("task-action", "edit-action");

  const editActionTitle = document.createElement("span");
  editActionTitle.classList.add("action-btn");
  editActionTitle.textContent = "Edit";

  const editBtn = document.createElement("button");
  editBtn.classList.add("action-edit-btn");
  editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20"> 
    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
  </svg>`;

  editTaskAction.addEventListener("click", () => {
    if (task.classList.contains("completed")) return;
    editTask(task);
    menu.style.display = "none";
  });

  editTaskAction.append(editActionTitle, editBtn);

  // Divider
  const divider = document.createElement("div");
  divider.classList.add("menu-divider");

  // Delete action
  const deleteTaskAction = document.createElement("div");
  deleteTaskAction.classList.add("task-action", "delete-action");

  const deleteActionTitle = document.createElement("span");
  deleteActionTitle.classList.add("action-btn");
  deleteActionTitle.textContent = "Delete";

  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("action-delete-btn");
  deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>`;

  deleteTaskAction.addEventListener("click", () => {
    const taskId = task.dataset.id;
    const tasks = getTasks().filter((t) => t.id !== taskId);
    saveTasks(tasks);
    task.remove();
  });

  deleteTaskAction.append(deleteActionTitle, deleteBtn);
  menu.append(editTaskAction, divider, deleteTaskAction);

  // Menu toggle button
  const dotsBtn = document.createElement("button");
  dotsBtn.classList.add("task-menu-btn");
  dotsBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20"> 
    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
  </svg>`;

  dotsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (task.classList.contains("completed")) return;
    closeAllMenus();
    const isCurrentlyOpen = menu.style.display === "block";
    menu.style.display = isCurrentlyOpen ? "none" : "block";
  });

  // Close menu on outside click
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".task-actions")) {
      closeAllMenus();
    }
  });

  actions.append(dotsBtn, menu);
  return actions;
}

// TASK CRUD OPERATIONS

function validateTaskForm() {
  const title = inputTitle.value.trim();
  return !!title;
}

function addTask() {
  const title = inputTitle.value.trim();
  const description = inputDescription.value.trim();
  const category = inputCategory.value.toLowerCase().trim();

  if (!title) return null;

  // Save to localStorage
  const tasks = getTasks();
  const newTask = {
    id: crypto.randomUUID(),
    title,
    description,
    category,
    status: "todo",
  };
  tasks.push(newTask);
  saveTasks(tasks);

  // Create DOM element
  const task = document.createElement("div");
  task.classList.add("task");
  task.draggable = true;
  task.dataset.id = newTask.id;

  task.appendChild(createCheckElement());

  const taskContent = document.createElement("div");
  taskContent.classList.add("task-content");
  task.appendChild(taskContent);

  const taskHeader = document.createElement("div");
  taskHeader.classList.add("task-header");
  taskContent.appendChild(taskHeader);

  const titleEl = document.createElement("h4");
  titleEl.classList.add("task-title");
  titleEl.textContent = title;
  taskHeader.appendChild(titleEl);
  taskHeader.appendChild(createTaskActions(task));

  if (description) {
    const descriptionEl = document.createElement("p");
    descriptionEl.classList.add("task-description");
    descriptionEl.textContent = description;
    taskContent.appendChild(descriptionEl);
  }

  const tag = createCategoryTag(category);
  if (tag) {
    taskContent.appendChild(tag);
  }

  toDoSection.appendChild(task);
  resetForm();
}

function createTaskFromData(taskData) {
  const task = document.createElement("div");
  task.classList.add("task");
  task.dataset.id = taskData.id;
  task.draggable = true;

  // Apply completed state
  if (taskData.status === "done") {
    task.classList.add("completed");
  }

  task.appendChild(createCheckElement());

  const taskContent = document.createElement("div");
  taskContent.classList.add("task-content");
  task.appendChild(taskContent);

  const taskHeader = document.createElement("div");
  taskHeader.classList.add("task-header");
  taskContent.appendChild(taskHeader);

  const titleEl = document.createElement("h4");
  titleEl.classList.add("task-title");
  titleEl.textContent = taskData.title;
  taskHeader.appendChild(titleEl);
  taskHeader.appendChild(createTaskActions(task));

  if (taskData.description) {
    const descriptionEl = document.createElement("p");
    descriptionEl.classList.add("task-description");
    descriptionEl.textContent = taskData.description;
    taskContent.appendChild(descriptionEl);
  }

  if (taskData.category) {
    const tag = createCategoryTag(taskData.category);
    taskContent.appendChild(tag);
  }

  // Append to correct column
  const container =
    taskData.status === "done"
      ? document.querySelector(".done")
      : document.querySelector(".todo");

  container.appendChild(task);
}

function updateTask(task) {
  const title = inputTitle.value.trim();
  const description = inputDescription.value.trim();
  const category = inputCategory.value.toLowerCase().trim();

  if (!title) return null;

  const taskContent = task.querySelector(".task-content");
  taskContent.querySelector(".task-title").textContent = title;

  // Update or remove description
  let descriptionEl = taskContent.querySelector(".task-description");
  if (description) {
    if (descriptionEl) {
      descriptionEl.textContent = description;
    } else {
      descriptionEl = document.createElement("p");
      descriptionEl.classList.add("task-description");
      descriptionEl.textContent = description;
      const tagEl = taskContent.querySelector(".tag");
      if (tagEl) {
        taskContent.insertBefore(descriptionEl, tagEl);
      } else {
        taskContent.appendChild(descriptionEl);
      }
    }
  } else if (descriptionEl) {
    descriptionEl.remove();
  }

  // Update or remove category tag
  let tag = taskContent.querySelector(".tag");
  if (category) {
    if (tag) {
      tag.textContent = category;
      tag.className = `tag tag-${category}`;
    } else {
      tag = createCategoryTag(category);
      taskContent.appendChild(tag);
    }
  } else if (tag) {
    tag.remove();
  }

  // Update localStorage
  const taskId = task.dataset.id;
  const tasks = getTasks();
  const taskData = tasks.find((t) => t.id === taskId);
  if (taskData) {
    taskData.title = title;
    taskData.description = description;
    taskData.category = category;
    saveTasks(tasks);
  }

  btnSave.textContent = "Save";
  resetForm();
}

function editTask(task) {
  taskBeingEdited = task;

  inputTitle.value = task.querySelector(".task-title").textContent;

  const descriptionEl = task.querySelector(".task-description");
  inputDescription.value = descriptionEl ? descriptionEl.textContent : "";

  const tagEl = task.querySelector(".tag");
  inputCategory.value = tagEl ? tagEl.textContent : "";

  btnSave.textContent = "Update task";
  openModal();
}

function completeTask(e) {
  const task = e.currentTarget.closest(".task");

  task.classList.add("completing");

  setTimeout(() => {
    task.classList.remove("completing");
    task.classList.add("completed");

    document.querySelector(".done").appendChild(task);
    limitDoneTasks();
  }, 200);

  // Update localStorage
  const taskId = task.dataset.id;
  const tasks = getTasks();
  const taskData = tasks.find((t) => t.id === taskId);
  if (taskData) {
    taskData.status = "done";
    saveTasks(tasks);
  }
}

function limitDoneTasks(limit = 10) {
  const doneTasks = document.querySelectorAll(".done .task");

  if (doneTasks.length > limit) {
    const taskToRemove = doneTasks[0];
    const taskId = taskToRemove.dataset.id;

    taskToRemove.remove();

    const tasks = getTasks().filter((t) => t.id !== taskId);
    saveTasks(tasks);
  }
}

// FORM HELPERS

function resetForm() {
  inputTitle.value = "";
  inputDescription.value = "";
  inputCategory.value = "";
  inputTitle.focus();
}

function closeAllMenus() {
  document.querySelectorAll(".task-menu").forEach((m) => {
    m.style.display = "none";
  });
}

// FILTERING & SEARCH

function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const allTasks = document.querySelectorAll(".task");

  allTasks.forEach((task) => {
    const taskTitle = task
      .querySelector(".task-title")
      .textContent.toLowerCase();
    const taskDescription = task.querySelector(".task-description");
    const descriptionText = taskDescription
      ? taskDescription.textContent.toLowerCase()
      : "";
    const taskTag = task.querySelector(".tag");
    const taskCategory = taskTag ? taskTag.textContent.toLowerCase() : "";

    const matchesSearch =
      searchTerm === "" ||
      taskTitle.includes(searchTerm) ||
      descriptionText.includes(searchTerm);

    const matchesCategory =
      currentFilter === "all" || taskCategory === currentFilter;

    task.style.display = matchesSearch && matchesCategory ? "flex" : "none";
  });
}

// DRAG AND DROP

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(".task:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }

      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

// EVENT LISTENERS

// Modal controls
dataClose.forEach((btn) => {
  btn.addEventListener("click", closeModal);
});

btnAdd.addEventListener("click", openModal);

btnSave.addEventListener("click", () => {
  if (!validateTaskForm()) {
    formError.style.display = "block";
    inputTitle.classList.add("error");
    return;
  }

  formError.style.display = "none";
  inputTitle.classList.remove("error");

  if (taskBeingEdited) {
    updateTask(taskBeingEdited);
    taskBeingEdited = null;
  } else {
    addTask();
  }

  closeModal();
});

inputTitle.addEventListener("input", () => {
  if (inputTitle.value.trim()) {
    formError.style.display = "none";
    inputTitle.classList.remove("error");
  }
});

// Category suggestions
suggestionTags.forEach((tag) => {
  tag.addEventListener("click", () => {
    inputCategory.value = tag.dataset.value;
  });
});

// Filter dropdown
filterSelected.addEventListener("click", (e) => {
  e.stopPropagation();
  filterSelected.classList.toggle("active");
  filterOptions.classList.toggle("show");
});

filterOptionItems.forEach((option) => {
  option.addEventListener("click", () => {
    const value = option.dataset.value;
    const text = option.textContent;

    filterSelected.querySelector(".filter-text").textContent = text;

    filterOptionItems.forEach((opt) => opt.classList.remove("selected"));
    option.classList.add("selected");

    filterSelected.classList.remove("active");
    filterOptions.classList.remove("show");

    currentFilter = value;
    applyFilters();
  });
});

// Close filter on outside click
document.addEventListener("click", (e) => {
  if (!e.target.closest(".filter-dropdown")) {
    filterSelected.classList.remove("active");
    filterOptions.classList.remove("show");
  }
});

// Search functionality
searchInput.addEventListener("input", applyFilters);

// Drag and drop events
document.addEventListener("dragstart", (e) => {
  if (e.target.classList.contains("task")) {
    e.target.classList.add("dragging");
  }
});

document.addEventListener("dragend", (e) => {
  if (e.target.classList.contains("task")) {
    e.target.classList.remove("dragging");
  }
});

document.addEventListener("dragover", (e) => {
  const column = e.target.closest(".kanban-section");
  const draggingTask = document.querySelector(".dragging");

  if (!column || !draggingTask) return;

  e.preventDefault();

  const afterElement = getDragAfterElement(column, e.clientY);
  if (afterElement == null) {
    column.appendChild(placeholder);
  } else {
    column.insertBefore(placeholder, afterElement);
  }
});

document.addEventListener("drop", (e) => {
  const draggingTask = document.querySelector(".dragging");
  if (!draggingTask) return;

  const column = e.target.closest(".kanban-section");
  if (!column) return;

  placeholder.replaceWith(draggingTask);
  draggingTask.classList.add("drop-animate");

  // Update task status based on column
  const taskId = draggingTask.dataset.id;
  const tasks = getTasks();
  const taskData = tasks.find((t) => t.id === taskId);

  if (column.classList.contains("done")) {
    draggingTask.classList.add("completed");
    if (taskData) {
      taskData.status = "done";
    }
    limitDoneTasks();
  } else if (column.classList.contains("todo")) {
    draggingTask.classList.remove("completed");
    if (taskData) {
      taskData.status = "todo";
    }
  }

  setTimeout(() => {
    draggingTask.classList.remove("drop-animate");
  }, 250);

  saveTasks(tasks);
});

document.addEventListener("DOMContentLoaded", loadTasks);
