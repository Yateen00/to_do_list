"use strict";
import "./header.css";
import "./main.css";
import "./common.css";
//index in array= userOrder =id
function updateOrderArray(arr, ogindex, newindex) {
  //Update the userOrder or starOrder of tasks in the array
  //ogindex is the tasks current inded or userOrder, newindex is the new index or userOrder after which the task should be placed
  //if -1, it is first element. if > arr.length, it is last element
  //it updates userOrder of all tasks in the array
  //if ogindex===newindex, functions as fixing userorder if there was a gap
  if (newindex < 0) newindex = 0;
  if (newindex >= arr.length) newindex = arr.length - 1;
  if (ogindex < 0 || ogindex >= arr.length) {
    return arr; // If ogindex is out of bounds, do nothing
  }
  const task = arr[ogindex];

  arr.splice(ogindex, 1); // Remove the task from its old position
  arr.splice(newindex, 0, task); // Insert it at the new position
  arr.forEach((task, index) => {
    task.updateUserOrder(index); // Update userOrder for all tasks
  });
  return arr;
}

function sortBasedOn(arr, key, recur = true) {
  // Returns a sorted deep copy of the array and its children based on the given key
  return arr
    .slice()
    .sort((a, b) => {
      if (key === "userOrder" || key === "starOrder") {
        return a[key] - b[key];
      } else if (key === "name") {
        return a.name.localeCompare(b.name);
      } else if (key === "createdAt" || key === "updatedAt") {
        return new Date(a[key]) - new Date(b[key]);
      } else if (key === "dueDate") {
        return (
          (a.dueDate ? new Date(a.dueDate) : 0) -
          (b.dueDate ? new Date(b.dueDate) : 0)
        );
      } else if (key === "priority") {
        return a.priority - b.priority;
      }
      return 0;
    })
    .map((task) => {
      if (recur && Array.isArray(task.subtasks) && task.subtasks.length > 0) {
        // Recursively sort subtasks if recur is true
        return {
          ...task,
          subtasks: sortBasedOn(task.subtasks, key, true),
        };
      }
      return task;
    });
}
// function filterStarred(tasks) {
//     // Returns a new array containing only starred tasks and their parents and subtasks but not siblings
//     throw new Error("Not implemented");
//     // return tasks.filter(
//     //     (task) => task.starred || task.subtasks.some((sub) => sub.starred)
//     // );
// }
function createTask(id, name, note = "", priority = 0, dueDate = null) {
  let userOrder = Number(id);
  let starOrder = userOrder;
  let completed = false;
  let starred = false;
  let createdAt = new Date();
  dueDate = dueDate ? new Date(dueDate) : null;
  let starredAt = null;
  let updatedAt = new Date();
  const subtasks = [];
  let taskIndex = 0;
  return {
    name,
    get userOrder() {
      return userOrder;
    },
    get starOrder() {
      return starOrder;
    },
    get completed() {
      return completed;
    },
    get starred() {
      return starred;
    },
    get createdAt() {
      return createdAt;
    },
    get dueDate() {
      return dueDate;
    },
    get priority() {
      return priority;
    },
    get note() {
      return note;
    },
    get updatedAt() {
      return updatedAt;
    },
    get starredAt() {
      return starredAt;
    },
    get subtasks() {
      return subtasks;
    },
    toggleStarred() {
      starred = !starred;
      starredAt = starred ? new Date() : null;
      updatedAt = new Date();
      return this;
    },
    toggleCompleted() {
      completed = !completed;
      updatedAt = new Date();
      return this;
    },
    updateUserOrder(newOrder) {
      userOrder = newOrder;
      updatedAt = new Date();
      return this;
    },
    updateStarOrder(newOrder) {
      starOrder = newOrder;
      updatedAt = new Date();
      return this;
    },
    updateDueDate(newDate) {
      dueDate = newDate ? new Date(newDate) : null;
      updatedAt = new Date();
      return this;
    },
    updatePriority(newPriority) {
      priority = newPriority;
      updatedAt = new Date();
      return this;
    },
    updateNote(newNote) {
      note = newNote;
      updatedAt = new Date();
      return this;
    },
    addSubtask(name, note, priority = 0, dueDate = null) {
      const subid = Number(taskIndex++);
      const subtask = createTask(subid, name, note, priority, dueDate);
      subtasks.push(subtask);
      updatedAt = new Date();
      return subtask;
    },
    removeSubtask(index) {
      updatedAt = new Date();
      if (index < 0 || index >= subtasks.length) {
        throw new Error("Subtask index out of bounds");
      }
      subtasks.splice(index, 1);
      updateOrderArray(subtasks, subtasks.length - 1, subtasks.length - 1); //fixes the gap
      taskIndex = subtasks.length - 1; // Update childIndex to the last subtask
      return this;
    },
    removeAllSubtasks() {
      subtasks.clear();
      updatedAt = new Date();
      return this;
    },
    getSubtask(index) {
      return subtasks[index];
    },
  };
}

const sortKeyMap = {
  Custom: "userOrder",
  Name: "name",
  "Date Created": "createdAt",
  "Date Updated": "updatedAt",
  "Due Date": "dueDate",
  "Starred At": "starredAt",
  Priority: "priority",
  "Star Order": "starOrder",
};

// --- To Do Factory ---
function toDo() {
  const toDos = [];
  //structure of toDos:
  // [
  //   taskObject={
  //    name: "List 1",
  //    userOrder: 0, // ID of the list
  //    subtasks: [taskObject, taskObject, ...], // Tasks in the list
  // }, // List 1
  //   taskObject, // List 2
  //   ]
  // so basically array of tree, where root node is the list and children are tasks
  let listID = 0;
  function findParentTask(parentTask, ids) {
    //given a list of topmost tasks and a ids array, where ids[0] is child task id and ids[1] is parent task id, find the parent task. if ids[0] is a parent task, return parentTask
    //id= UserOrder of the task= index in the tasks array
    //returns the parent task if found, else null
    if (ids.length <= 1) return parentTask;
    for (let i = ids.length - 1; i >= 1; i--) {
      parentTask = parentTask.getSubtask(ids[i]);
      if (!parentTask) return null; // If any parent task is not found, return null
    }
    return parentTask;
  }
  return {
    get toDos() {
      return toDos;
    },
    addList(name) {
      const list = createTask(listID++, name);
      toDos.push(list);

      return Number(listID - 1);
    },
    removeList(id) {
      if (id < 0 || id >= toDos.length) {
        throw new Error("List ID out of bounds");
      }
      toDos.splice(id, 1);
      updateOrderArray(toDos, toDos.length - 1, toDos.length - 1); // Fixes the gap
      listID = toDos.length - 1; // Update listID to the last list
      return this;
    },
    getList(id, ancestoryArray = null) {
      if (ancestoryArray) {
        return findParentTask(toDos[id], ancestoryArray);
      } else {
        return toDos[id];
      }
    },
  };
}

// --- Header (List Navigation) ---
function Header(toDo, onListSelect) {
  const nav = document.createElement("nav");
  nav.innerHTML = `
      <ul>
        <li><button class="starred-btn">Starred</button></li>
        <li><div class="lists"></div></li>
        <li>
          <select class="sort-select">
            <option>Name</option>
            <option selected>Date Created</option>
            <option>Date Updated</option>
            <option>Due Date</option>
            <option>Custom</option>
          </select>
        </li>
        <li class="list-controls">
        <button class="rename-list">Rename List</button>
        <button class="remove-list">Remove List</button>
        <button class="add-list">Add List</button>
        </li>
        </ul>
    `;

  let selected = null; // Track selected list ID
  /* Header helper functions */
  document.body.prepend(nav);
  // After creating nav and setting innerHTML:
  const sortDropdown = nav.querySelector(".sort-select");
  const renameBtn = nav.querySelector(".rename-list");
  const removeBtn = nav.querySelector(".remove-list");

  // Store their default display styles
  function createListButton(name, userOrder) {
    const button = document.createElement("button");
    button.textContent = name;
    button.dataset.id = userOrder; // Use userOrder as the ID
    button.className = "list-button";
    button.draggable = true; // Make the button draggable
    // button.style.order = userOrder; // Set the order based on userOrder, not really needed as we are appending in order
    return button;
  }
  function updateHighlight(new_selected = null) {
    const prevSelected = selected;
    // Determine which button to select
    let buttonToSelect = listsContainer.querySelector(
      `.list-button[data-id="${new_selected}"]`
    );

    if (
      new_selected !== null &&
      new_selected < toDo.toDos.length &&
      buttonToSelect
    ) {
      selected = new_selected;
    } else {
      // Fallback: select the first button if available
      buttonToSelect = listsContainer.querySelector(".list-button");
      selected =
        prevSelected ||
        (buttonToSelect ? Number(buttonToSelect.dataset.id) : null);
    }
    console.log("Selected list ID:", selected);
    console.log("Previous selected ID:", prevSelected);
    if (selected === null || selected >= toDo.toDos.length) {
      sortDropdown.classList.add("hidden");
      renameBtn.classList.add("hidden");
      removeBtn.classList.add("hidden");
      return;
    } else {
      sortDropdown.classList.remove("hidden");
      renameBtn.classList.remove("hidden");
      removeBtn.classList.remove("hidden");
    }
    // Only update highlight and call onListSelect if selection changed
    if (buttonToSelect && selected !== prevSelected) {
      // Remove highlight from any currently selected button
      console.log("Updating highlight for:", buttonToSelect);
      if (prevSelected)
        listsContainer
          .querySelectorAll(".list-button.selected")
          .forEach((btn) => {
            btn.classList.remove("selected");
          });
      buttonToSelect.classList.add("selected");
      onListSelect(selected);
    }
  }
  function renderLists(new_selected = null) {
    const sort_by = sortSelect.value;
    listsContainer.innerHTML = "";
    const arr = sortBasedOn(toDo.toDos, sortKeyMap[sort_by], false);
    arr.forEach((list) => {
      listsContainer.appendChild(createListButton(list.name, list.userOrder));
    });
    updateHighlight(new_selected);
  }

  /*Header listeners */

  // when a list is selected
  const listsContainer = nav.querySelector(".lists");
  listsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("list-button")) {
      updateHighlight(Number(e.target.dataset.id));
    }
  });

  // sort lists
  const sortSelect = nav.querySelector(".sort-select");
  sortSelect.onchange = () => {
    renderLists();
  };

  // Handle Add, Rename, Remove List
  const listControls = nav.querySelector(".list-controls");
  listControls.addEventListener("click", (e) => {
    const btnClass = ["add-list", "rename-list", "remove-list"].find((cls) =>
      e.target.classList.contains(cls)
    );

    console.log(btnClass);
    switch (btnClass) {
      case "add-list": {
        const listName = prompt("Enter list name");
        if (listName) {
          toDo.addList(listName);
          renderLists();
        }
        break;
      }
      case "rename-list": {
        if (selected === null) {
          alert("Select a list to rename.");
          return;
        }
        const currentList = toDo.getList(selected);
        const newName = prompt("Enter new list name", currentList.name);
        if (newName && newName !== currentList.name) {
          currentList.name = newName;
          renderLists();
        }
        break;
      }
      case "remove-list": {
        if (selected === null) {
          alert("Select a list to remove.");
          return;
        }
        if (confirm("Are you sure you want to delete this list?")) {
          toDo.removeList(selected);
          selected = null; // Reset selected after removal
          renderLists();
        }
        break;
      }
    }
  });

  // handle drag and drop of lists

  let draggedListId = null;

  listsContainer.addEventListener("dragstart", (e) => {
    const btn = e.target.closest(".list-button");
    if (!btn) return;
    draggedListId = Number(btn.dataset.id);
    btn.classList.add("dragging");
  });

  listsContainer.addEventListener("dragend", (e) => {
    const btn = e.target.closest(".list-button");
    if (btn) btn.classList.remove("dragging");
    listsContainer
      .querySelectorAll(".drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
    draggedListId = null;
  });

  listsContainer.addEventListener("dragover", (e) => {
    const btn = e.target.closest(".list-button");
    if (!btn) return;
    e.preventDefault();
    btn.classList.add("drag-over");
  });

  listsContainer.addEventListener("dragleave", (e) => {
    const btn = e.target.closest(".list-button");
    if (btn) btn.classList.remove("drag-over");
  });

  listsContainer.addEventListener("drop", (e) => {
    if (sortSelect.value !== "Custom") {
      console.warn("Drag and drop only works when sorting by Custom");
      return;
    }
    const btn = e.target.closest(".list-button");
    if (!btn || draggedListId === null) return;
    e.preventDefault();
    btn.classList.remove("drag-over");
    const toId = Number(btn.dataset.id);

    // Find indices in the toDos array
    const arr = toDo.toDos;
    if (draggedListId !== -1 && toId !== -1 && draggedListId !== toId) {
      updateOrderArray(arr, draggedListId, toId);
      renderLists(selected);
    }
    draggedListId = null;
  });

  //initial render
  renderLists();
  return nav;
}
function Main(toDo) {
  // Create main content area and header
  const main = document.createElement("main");
  main.innerHTML = `
      <h1 class="list-title"></h1>
      <div class="task-controls-bar">
        <select class="sort-select">
          <option>Name</option>
          <option selected>Date Created</option>
          <option>Date Updated</option>
          <option>Due Date</option>
          <option>Starred At</option>
          <option>Priority</option>
          <option>Custom</option>
        </select>
        <button class="add-task">Add Task</button>
      </div>
      <section class="tasks-section"></section>
    `;
  document.body.appendChild(main);
  const msg = document.createElement("p");
  main.after(msg);
  msg.className = "no-list-selected-msg";
  msg.textContent = "No list selected.";
  let selected = null; // Track selected list ID

  //form modal
  const modal = document.createElement("div");
  modal.id = "task-modal";
  modal.style.display = "none";
  modal.innerHTML = `
    <div class="modal-bg"></div>
    <form class="task-form">
      <h2 class="form-title"></h2>
      <label>Name: <input name="name" required></label>
      <label>Note: <textarea name="note"></textarea></label>
      <label>Priority: <input name="priority" type="number" min="0" max="5" value="0"></label>
      <label>Due Date: <input name="dueDate" type="date"></label>
      <div class="form-actions">
        <button type="submit">Save</button>
        <button type="button" class="cancel-btn">Cancel</button>
      </div>
    </form>
  `;
  const form = modal.querySelector(".task-form");
  document.body.appendChild(modal);

  // Modal close logic
  modal.querySelector(".modal-bg").onclick = () =>
    (modal.style.display = "none");
  modal.querySelector(".cancel-btn").onclick = () =>
    (modal.style.display = "none");

  //render title
  const titleElement = main.querySelector(".list-title");
  function renderTitle(list) {
    titleElement.textContent = list.name;
    titleElement.dataset.id = list.userOrder; // Use userOrder as the ID
  }

  // hide if no list selected and add or remove <p>
  // render tasks section and their heading
  function generateTaskElement(task) {
    const taskElement = document.createElement("div");
    taskElement.className = "task";
    taskElement.dataset.id = task.userOrder;
    taskElement.draggable = true; // Enable drag-and-drop for tasks
    taskElement.innerHTML = `
            <div class="task-controls">
              <button class="add-subtask">＋</button>
              <button class="remove-task">🗑️</button>
              <button class="update-task">✏️</button>
            </div>
            <h3 class="task-title">${task.name}</h3>
            <div class="task-meta">
                <p class="task-due">Due: <span>${
                  task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"
                }</span></p>
                <p class="task-note-label">Note: <span class="task-note">${
                  task.note
                }</span></p>
                <p class="task-priority">Priority: <span>${
                  task.priority ?? 0
                }</span></p>
                <p class="task-created">Created: <span>${
                  task.createdAt
                    ? new Date(task.createdAt).toLocaleDateString()
                    : "N/A"
                }</span></p>
                <p class="task-updated">Updated: <span>${
                  task.updatedAt
                    ? new Date(task.updatedAt).toLocaleDateString()
                    : "N/A"
                }</span></p>
              </div>
              <div class="task-actions">
                <button class="toggle-completed">${
                  task.completed ? "✅" : "❌"
                }</button>
                <button class="toggle-starred">${task.starred ? "🌟" : "☆"}</button>
              </div>
                
          `;
    return taskElement;
  }

  //render tasks
  function renderTasks() {
    const sort_by = sortSelect.value;
    var list = toDo.getList(selected).subtasks;
    tasksSection.innerHTML = ""; // Clear previous tasks
    if (list.length === 0) {
      tasksSection.innerHTML =
        '<p class="no-list-selected-msg">No tasks available</p>';
      return;
    }
    list = sortBasedOn(list, sortKeyMap[sort_by], true);
    function renderTasksRecursiveHelper(arr, parentContainer) {
      arr.forEach((task) => {
        const taskElement = generateTaskElement(task);
        // Handle subtasks recursively
        if (Array.isArray(task.subtasks) && task.subtasks.length > 0) {
          const subtasksContainer = document.createElement("div");
          subtasksContainer.className = "subtasks";
          renderTasksRecursiveHelper(task.subtasks, subtasksContainer);
          taskElement.appendChild(subtasksContainer);
        }

        parentContainer.appendChild(taskElement);
      });
    }
    renderTasksRecursiveHelper(list, tasksSection);
  }

  //render both title and tasks
  function renderMain(new_selected = null) {
    if (new_selected !== null && new_selected < toDo.toDos.length) {
      selected = new_selected;
    }
    if (selected === null || selected >= toDo.toDos.length) {
      main.classList.add("hidden");
      msg.classList.remove("hidden");
      return;
    } else {
      main.classList.remove("hidden");
      msg.classList.add("hidden");
    }
    let list = toDo.getList(selected);
    renderTitle(list);
    renderTasks();
  }

  //form for task add, update
  function showTaskForm({ title, initial = {}, onSave }) {
    modal.querySelector(".form-title").textContent = title;
    form.name.value = initial.name || "";
    form.note.value = initial.note || "";
    form.priority.value = initial.priority ?? 0;
    form.dueDate.value = initial.dueDate
      ? new Date(initial.dueDate).toISOString().slice(0, 10)
      : "";

    modal.style.display = "block";
    form.onsubmit = (e) => {
      e.preventDefault();
      modal.style.display = "none";
      onSave({
        name: form.name.value,
        note: form.note.value,
        priority: Number(form.priority.value),
        dueDate: form.dueDate.value ? form.dueDate.value : null,
      });
    };
  }

  // Returns an array of IDs: [clickedId, parentId, grandparentId, ...]
  function getTaskAncestryArray(taskElement) {
    const ids = [];
    let current = taskElement;
    while (current && current.classList.contains("task")) {
      ids.push(Number(current.dataset.id));
      // Move up to the parent .task (if any)
      current = current.parentElement.closest(".task");
    }
    return ids; // [clicked, parent, grandparent, ...]
  }

  /* listeners */

  // sort button
  const sortSelect = main.querySelector(".sort-select");
  sortSelect.onchange = () => {
    renderTasks();
  };

  // Add task button top level
  const addTaskButton = main.querySelector(".add-task");
  addTaskButton.onclick = () => {
    showTaskForm({
      title: "Add Task",
      onSave: ({ name, note, priority, dueDate }) => {
        toDo.getList(selected).addSubtask(name, note, priority, dueDate);
        renderTasks();
      },
    });
  };

  // handle task button interactions
  const tasksSection = main.querySelector(".tasks-section");
  tasksSection.addEventListener("click", (e) => {
    const taskElement = e.target.closest(".task");
    if (!taskElement) return;
    const btnClass = [
      "remove-task",
      "update-task",
      "toggle-completed",
      "toggle-starred",
      "add-subtask",
    ].find((cls) => e.target.classList.contains(cls));
    if (!btnClass) return;
    const taskId = Number(taskElement.dataset.id);
    const ancestryArray = getTaskAncestryArray(taskElement);
    const list = toDo.getList(selected, ancestryArray);
    console.log("Task ID:", taskId);
    console.log("Task Ancestry Array:", ancestryArray);

    const task = list.getSubtask(taskId);
    console.log("Task:", task);

    switch (btnClass) {
      case "remove-task":
        list.removeSubtask(taskId);
        renderTasks();
        break;
      case "update-task":
        showTaskForm({
          title: "Update Task",
          initial: {
            name: task.name,
            note: task.note,
            priority: task.priority,
            dueDate: task.dueDate
              ? new Date(task.dueDate).toISOString().slice(0, 10)
              : "",
          },
          onSave: ({ name, note, priority, dueDate }) => {
            task.name = name;
            task.updateNote(note);
            task.updatePriority(priority);
            task.updateDueDate(dueDate);
            renderTasks();
          },
        });
        break;
      case "toggle-completed":
        task.toggleCompleted();
        renderTasks();
        break;
      case "toggle-starred":
        task.toggleStarred();
        renderTasks();
        break;
      case "add-subtask":
        showTaskForm({
          title: "Add Subtask",
          onSave: ({ name, note, priority, dueDate }) => {
            task.addSubtask(name, note, priority, dueDate);
            renderTasks();
          },
        });
        break;
    }
  });

  //drag and drop support
  //only need arr,ogindex, newindex and call updateOrderArray and render
  tasksSection.addEventListener("dragstart", (e) => {
    const taskElement = e.target.closest(".task");
    if (!taskElement) return;
    // Store ancestry and index for the dragged task
    const ancestry = getTaskAncestryArray(taskElement);
    const fromIdx = ancestry[0];
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ ancestry, fromIdx })
    );
    taskElement.classList.add("dragging");
  });

  tasksSection.addEventListener("dragend", (e) => {
    const taskElement = e.target.closest(".task");
    if (taskElement) {
      taskElement.classList.remove("dragging");
      tasksSection
        .querySelectorAll(".drag-over")
        .forEach((el) => el.classList.remove("drag-over"));
    }
  });

  tasksSection.addEventListener("dragover", (e) => {
    const taskElement = e.target.closest(".task");
    if (!taskElement) return;
    e.preventDefault();
    taskElement.classList.add("drag-over");
  });

  tasksSection.addEventListener("dragleave", (e) => {
    const taskElement = e.target.closest(".task");
    if (taskElement) taskElement.classList.remove("drag-over");
  });

  tasksSection.addEventListener("drop", (e) => {
    if (sortSelect.value !== "Custom") {
      console.warn("Drag and drop only works when sorting by Custom");
      return;
    }
    const targetTask = e.target.closest(".task");
    if (!targetTask) return;
    e.preventDefault();
    targetTask.classList.remove("drag-over");

    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    const { ancestry, fromIdx } = JSON.parse(data);
    const toIdx = Number(targetTask.dataset.id);

    // Only allow drop if ancestry matches (i.e., same parent array) and not dropping on itself
    const targetAncestry = getTaskAncestryArray(targetTask);
    console.log("Target Ancestry Array:", targetAncestry);
    console.log("From Index:", fromIdx, "To Index:", toIdx);
    console.log("Ancestry:", ancestry);
    if (
      JSON.stringify(ancestry.slice(1)) ===
        JSON.stringify(targetAncestry.slice(1)) &&
      fromIdx !== toIdx
    ) {
      // Find the parent array
      let parent = toDo.getList(selected, ancestry);
      if (fromIdx !== -1 && toIdx !== -1) {
        updateOrderArray(parent.subtasks, fromIdx, toIdx);
        renderTasks();
      }
    }
  });
  renderMain(); // Initial render of main content
  //send renderMain to Header
  return {
    renderMain,
    main,
  };
}

function Page() {
  const allLists = toDo();
  const { renderMain } = Main(allLists);

  Header(allLists, renderMain);
}
Page();

//left: starred page
//understand drag and drop working exactly
//add styling
// perhaps use localstorage
//take priority as input and update for list
