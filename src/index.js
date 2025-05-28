"use strict";
import "./header.css";
import "./main.css";
import "./common.css";
//index in array= userOrder =id
function updateOrderArray(
  arr,
  ogindex,
  newindex,
  updateOrderCallback = (task, index) => task.updateUserOrder(index)
) {
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
    updateOrderCallback(task, index); // Update userOrder for all tasks
  });
  return arr;
}

function updateStarOrderArray(arr, ogindex, newindex) {
  console.log(`initial indexes`);
  arr.forEach((task, index) => {
    console.log(` og array task: ${task.name}, ogindex: ${index}`);
  });
  const sortedArray = sortBasedOn(arr, sortKeyMap["Star"], false); // Sort the array by "Star"
  sortedArray.forEach((task, index) => {
    console.log(`after sorting task: ${task.name}, newindex: ${index}`);
  });
  ogindex = arr[ogindex]?.starOrder;
  newindex = arr[newindex]?.starOrder;
  if (ogindex === undefined || newindex === undefined) {
    console.warn("Invalid ogindex or newindex for starOrder update.");
    return sortedArray; // If ogindex or newindex is invalid, return the sorted array
  }
  updateOrderArray(sortedArray, ogindex, newindex, (task, index) =>
    task.updateStarOrder(index)
  );
  console.log(`updated indexes`);
  sortedArray.forEach((task, index) => {
    console.log(` updated array task: ${task.name}, newindex: ${index}`);
  });
  return sortedArray;
}
function sortBasedOn(arr, key, recur = true, ascending = true) {
  // Returns a sorted deep copy of the array and its children based on the given key
  return arr
    .slice()
    .sort((a, b) => {
      let comparison = 0;

      if (key === "starOrder") {
        // Prioritize starred elements and push non-starred elements to the end
        if (a.starred - b.starred !== 0) {
          comparison = b.starred - a.starred; // Starred elements come first
        } else {
          comparison = a[key] - b[key]; // Sort by starOrder if both are starred or not starred
        }
      } else if (key === "userOrder" || key === "priority") {
        comparison = a[key] - b[key];
      } else if (key === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (key === "createdAt" || key === "updatedAt") {
        comparison = new Date(a[key]) - new Date(b[key]);
      } else if (key === "dueDate") {
        comparison =
          (a.dueDate ? new Date(a.dueDate) : 0) -
          (b.dueDate ? new Date(b.dueDate) : 0);
      }

      // Reverse comparison for descending order (except for starOrder)
      return key === "starOrder"
        ? comparison
        : ascending
        ? comparison
        : -comparison;
    })
    .map((task) => {
      if (recur && Array.isArray(task.subtasks) && task.subtasks.length > 0) {
        // Recursively sort subtasks if recur is true
        return {
          ...task,
          subtasks: sortBasedOn(task.subtasks, key, true, ascending),
        };
      }
      return task;
    });
}
function filterStarred(tasks) {
  return tasks
    .filter(
      (task) =>
        task.starred || // Include starred tasks
        (task.subtasks && task.subtasks.some((sub) => sub.starred)) // Include parents of starred subtasks
    )
    .map((task) => ({
      ...task,
      subtasks: filterStarred(task.subtasks || []), // Recursively filter subtasks
    }));
}

// page will attach it to todo
let saveAllLists = () => {
  console.warn("saveAllLists called before initialization!");
};

function createTask(
  id,
  name,
  note = "",
  priority = 0,
  dueDate = null,
  starred = false,
  data = {}
) {
  name = data["name"] || name;
  id = data["id"] || Number(id);
  let userOrder = data["userOrder"] || Number(id);
  let starOrder = data["starOrder"] || userOrder;
  let completed = data["completed"] || false;
  starred = data["starred"] || starred || false;
  let createdAt = data["createdAt"] ? new Date(data["createdAt"]) : new Date();
  dueDate = data["dueDate"]
    ? new Date(data["dueDate"])
    : dueDate
    ? new Date(dueDate)
    : null;
  let starredAt = data["starredAt"] ? new Date(data["starredAt"]) : null;
  let updatedAt = data["updatedAt"] ? new Date(data["updatedAt"]) : new Date();
  const subtasks =
    data["subtasks"]?.map((subtask) =>
      createTask(
        subtask.userOrder,
        subtask.name,
        subtask.note,
        subtask.priority,
        subtask.dueDate,
        subtask.starred,
        subtask
      )
    ) || [];
  let taskIndex = data["taskIndex"] || subtasks.length; // Start taskIndex from the length of subtasks
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
      saveAllLists();
      return this;
    },
    toggleCompleted() {
      completed = !completed;
      updatedAt = new Date();
      saveAllLists();
      return this;
    },
    updateUserOrder(newOrder) {
      userOrder = newOrder;
      updatedAt = new Date();
      saveAllLists();
      return this;
    },
    updateStarOrder(newOrder) {
      starOrder = newOrder;
      updatedAt = new Date();
      saveAllLists();
      return this;
    },
    updateDueDate(newDate) {
      dueDate = newDate ? new Date(newDate) : null;
      updatedAt = new Date();
      saveAllLists();
      return this;
    },
    updatePriority(newPriority) {
      priority = newPriority;
      updatedAt = new Date();
      saveAllLists();
      return this;
    },
    updateNote(newNote) {
      note = newNote;
      updatedAt = new Date();
      saveAllLists();
      return this;
    },
    addSubtask(name, note, priority = 0, dueDate = null, starred = false) {
      const subid = Number(taskIndex++);
      const subtask = createTask(subid, name, note, priority, dueDate, starred);
      subtasks.push(subtask);
      console.log(`added task is starred: ${subtask.starred}`);
      updatedAt = new Date();
      saveAllLists();
      return subtask;
    },
    removeSubtask(index) {
      updatedAt = new Date();
      if (index < 0 || index >= subtasks.length) {
        throw new Error("Subtask index out of bounds");
      }
      subtasks.splice(index, 1);
      taskIndex--; // Update childIndex to reflect new length
      updateOrderArray(subtasks, taskIndex - 1, taskIndex - 1); //fixes the gap
      updateStarOrderArray(subtasks, taskIndex - 1, taskIndex - 1); // Fixes the gap in starOrder

      saveAllLists();
      return this;
    },
    removeAllSubtasks() {
      subtasks.clear();
      updatedAt = new Date();
      saveAllLists();
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
  Star: "starOrder",
};

// --- To Do Factory ---
function toDo(todos_data = []) {
  const toDos = todos_data.map((todo) =>
    createTask(
      todo.userOrder,
      todo.name,
      todo.note,
      todo.priority,
      todo.dueDate,
      todo.starred,
      todo
    )
  );
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
  let listID = toDos.length; // Start listID from the length of toDos
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
      console.log(`list id before addition: ${listID}`);
      const list = createTask(listID++, name);
      toDos.push(list);

      console.log(`list id after addition: ${listID}`);
      saveAllLists();
      return Number(listID - 1);
    },
    removeList(id) {
      if (id < 0 || id >= toDos.length) {
        throw new Error("List ID out of bounds");
      }
      console.log(`Removing list with ID: ${id}`);
      console.log(`list id before removal: ${listID}`);
      toDos.splice(id, 1);
      updateOrderArray(toDos, toDos.length - 1, toDos.length - 1); // Fixes the gap
      listID--; // Update listID to the last list
      saveAllLists();
      console.log(`list id after removal: ${listID}`);
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
function Header(
  toDo,
  onListSelect,
  _selected = null,
  sortBy = "Date Created",
  _starred = false,
  ascending = true
) {
  let starred = false;
  let selected = null;
  console.log(
    `Header initialized with selected: ${selected}, sortBy: ${sortBy}, starred: ${_starred}`
  );
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
          <button class="sort-toggle" title="Toggle Ascending/Descending">⬆️</button>
        </li>
        <li class="list-controls">
        <button class="rename-list">Rename List</button>
        <button class="remove-list">Remove List</button>
        <button class="add-list">Add List</button>
        </li>
        </ul>
    `;

  /* Header helper functions */
  document.body.prepend(nav);
  // After creating nav and setting innerHTML:
  const sortDropdown = nav.querySelector(".sort-select");
  const renameBtn = nav.querySelector(".rename-list");
  const removeBtn = nav.querySelector(".remove-list");
  let selectedNode = selected !== null ? toDo.getList(selected) : null;
  nav.querySelector("select").value = sortBy; // Set initial sort value
  // for localstorage
  function save() {
    console.log(
      `Updating localStorage with selected: ${selected} and sortBy: ${sortDropdown.value}`
    );
    localStorage.setItem("ascendingHeader", ascending);
    localStorage.setItem("selectedListID", selected);
    localStorage.setItem("sortByHeader", sortDropdown.value);
    localStorage.setItem("starred", starred);
  }

  function createListButton(name, userOrder) {
    const button = document.createElement("button");
    button.textContent = name;
    button.dataset.id = userOrder; // Use userOrder as the ID
    button.className = "list-button";
    button.draggable = true; // Make the button draggable
    // button.style.order = userOrder; // Set the order based on userOrder, not really needed as we are appending in order
    return button;
  }
  function updateHighlight(new_selected = null, star = false) {
    // cases: new_selected and old is same => 1) null or out of bounds: select first list. if first list doesnt exist, set null. if prev wasnt null, call onlistselect 3) same: do nothing
    // diff but new_selected is null or out of bounds => stay on the same if selected is valid, else do above thing
    // else select the new_selected
    // simplified as use buttons not numbers directly
    // so, prev, curr. => (null,null),(a,a),(a,null),(a,b),(null,a)
    // Determine which button to select
    // below uses same logic as above
    if (star) {
      console.log("Starred mode activated, showing starred tasks.");
      selected = null; // Reset selected if in starred mode
      selectedNode = null; // Reset selected node

      if (toDo.toDos.length === 0) {
        sortDropdown.classList.add("hidden");
        sortToggleButton.classList.add("hidden");
      } else {
        sortDropdown.classList.remove("hidden");
        sortToggleButton.classList.remove("hidden");
      }
      renameBtn.classList.add("hidden");
      removeBtn.classList.add("hidden");
      if (starred !== star) {
        starred = true;
        onListSelect(selected, starred);
        save();
      }
      return;
    }
    starred = false; // Reset starred mode
    let selectedButton = listsContainer.querySelector(
      `.list-button[data-id="${selected}"]`
    );
    const prevSelectedNode = selectedNode;
    const prevSelectedButton = selectedButton;
    let newSelectedButton = listsContainer.querySelector(
      `.list-button[data-id="${new_selected}"]`
    );
    console.log(
      `old button: ${prevSelectedButton?.textContent} (ID: ${selected})`
    );
    console.log(
      `New selected button: ${newSelectedButton?.textContent} (ID: ${new_selected})`
    );
    if (newSelectedButton) {
      selected = new_selected;
      selectedButton = newSelectedButton;
      console.log(
        `Selecting new list: ${selectedButton.textContent} (ID: ${selected})`
      );
    }
    if (!selectedButton) {
      // If no valid list is selected, try to select the first list
      selectedButton = listsContainer.querySelector(".list-button");
      selected = selectedButton ? Number(selectedButton.dataset.id) : null;
    }
    if (!selectedButton) {
      // If no valid list is selected, hide controls and return
      sortDropdown.classList.add("hidden");
      sortToggleButton.classList.add("hidden");
      renameBtn.classList.add("hidden");
      removeBtn.classList.add("hidden");
      console.log("No lists available, hiding controls.");
      selected = null; // Reset selected if no valid list
      selectedNode = null;
    } else {
      sortDropdown.classList.remove("hidden");
      renameBtn.classList.remove("hidden");
      sortToggleButton.classList.remove("hidden");
      removeBtn.classList.remove("hidden");
      prevSelectedButton?.classList?.remove("selected");
      selectedButton.classList.add("selected");
      selectedNode = toDo.getList(selected);
    }
    if (prevSelectedNode !== selectedNode) {
      onListSelect(selected); //null needed as if last list was removed, buttons will both be null, but update was made
      save(); // Update localStorage with the new selected list ID and sort option
    }
  }
  function renderLists(new_selected = null, star = false) {
    const sort_by = sortSelect.value;
    listsContainer.innerHTML = "";
    const arr = sortBasedOn(toDo.toDos, sortKeyMap[sort_by], false, ascending);
    arr.forEach((list) => {
      listsContainer.appendChild(createListButton(list.name, list.userOrder));
    });
    updateHighlight(new_selected, star);
    save(); // Update localStorage with the new list order
  }

  /*Header listeners */

  // when a list is selected
  const listsContainer = nav.querySelector(".lists");
  listsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("list-button")) {
      console.log("List button clicked:", e.target.dataset.id);
      updateHighlight(Number(e.target.dataset.id));
    }
  });

  // sort lists
  const sortSelect = nav.querySelector(".sort-select");
  sortSelect.onchange = () => {
    renderLists(selected, starred);
  };

  // Toggle sort order button
  const sortToggleButton = nav.querySelector(".sort-toggle");
  sortToggleButton.textContent = ascending ? "⬆️" : "⬇️";
  sortToggleButton.onclick = () => {
    ascending = !ascending;
    sortToggleButton.textContent = ascending ? "⬆️" : "⬇️";
    console.log(
      `Sorting order changed to: ${ascending ? "Ascending" : "Descending"}`
    );
    renderLists(selected, starred); // Re-render lists with the new sort order
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
          renderLists(selected, starred);
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
          renderLists(selected, starred);
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
          renderLists(selected - 1, starred); // select the previous list after removal
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
      renderLists(selected, starred); // Re-render lists after reordering
    }
    draggedListId = null;
  });
  const starredButton = nav.querySelector(".starred-btn");
  starredButton.addEventListener("click", () => {
    console.log("Navigating to Starred Page");
    renderLists(null, true); // Call renderMain in "Starred Page" mode
  });
  //initial render
  renderLists(_selected, _starred);
  return nav;
}
function Main(
  toDo,
  _selected = null,
  sortBy = "Date Created",
  _starredMode = false,
  ascending = true
) {
  let selected = null; //not using directly as leads to visual bugs coz reloading only happen on change
  let starredMode = false;
  console.log(
    `Main initialized with selected: ${_selected}, sortBy: ${sortBy}, starredMode: ${_starredMode}`
  );
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
        <button class="sort-toggle" title="Toggle Ascending/Descending">⬆️</button>
        
        <button class="add-task">Add Task</button>
      </div>
      <section class="tasks-section"></section>
    `;
  document.body.appendChild(main);
  const msg = document.createElement("p");
  main.after(msg);
  msg.className = "no-list-selected-msg";
  msg.textContent = "No list selected.";

  let selectedNode = selected !== null ? toDo.getList(selected) : null;
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

  //save to locastorage
  function save() {
    localStorage.setItem("selectedListID", selected);
    localStorage.setItem("ascendingMain", ascending);
    localStorage.setItem("sortByMain", sortSelect.value);
    localStorage.setItem("starred", starredMode);
  }
  //render title
  const titleElement = main.querySelector(".list-title");
  // hide if no list selected and add or remove <p>
  // render tasks section and their heading
  function generateTaskElement(task) {
    const taskElement = document.createElement("div");
    taskElement.className = "task";
    taskElement.dataset.id = task.userOrder;
    taskElement.draggable = true; // Enable drag-and-drop for tasks
    taskElement.innerHTML = `
           <div class="task-header">
            <div class="task-controls">
              <button class="add-subtask">＋</button>
              <button class="remove-task">🗑️</button>
              <button class="update-task">✏️</button>
            </div>
            <h3 class="task-title">${task.name}</h3>
          </div>
            <div class="task-meta">
                <p class="task-due">Due: <span>${
                  task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "N/A"
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
                <button class="toggle-starred">${
                  task.starred ? "🌟" : "☆"
                }</button>
              </div>
                
          `;
    return taskElement;
  }

  //render tasks
  function renderTasks() {
    let sort_by = sortSelect.value;
    var list = starredMode
      ? filterStarred(toDo.toDos)
      : toDo.getList(selected).subtasks;
    console.log(
      `Rendering tasks for list ID: ${selected}, Starred Mode: ${starredMode}`
    );
    console.log("the list is:");
    console.log(toDo.toDos);
    console.log(filterStarred(toDo.toDos));
    tasksSection.innerHTML = ""; // Clear previous tasks
    if (list.length === 0) {
      console.log("No tasks available to render.");
      tasksSection.innerHTML =
        '<p class="no-list-selected-msg">No tasks available</p>';
      return;
    }
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
    if (!starredMode) {
      list = sortBasedOn(list, sortKeyMap[sort_by], true, ascending);

      renderTasksRecursiveHelper(list, tasksSection);
    } else {
      sort_by = sort_by === "Custom" ? "Star" : sort_by; // Use starOrder for Custom sort in starred mode

      const transformedList = list.map((sublist) => ({
        ...sublist, // Keep all other properties of the top-level task
        subtasks: sortBasedOn(
          sublist.subtasks,
          sortKeyMap[sort_by],
          true,
          ascending
        ), // Sort the subtasks
      }));

      console.log("Transformed list with sorted subtasks:", transformedList);

      if (sort_by !== "Star") {
        // Step 2: Temporarily swap the values of the given key with the value of the 0th child
        transformedList.forEach((sublist) => {
          if (sublist.subtasks.length > 0) {
            let temp = sublist[sortKeyMap[sort_by]];
            sublist[sortKeyMap[sort_by]] =
              sublist.subtasks[0][sortKeyMap[sort_by]];
            sublist.subtasks[0][sortKeyMap[sort_by]] = temp;
          }
        });
      }

      // Step 3: Sort the list using sortBasedOn with recursion turned off
      const sortedList = sortBasedOn(
        transformedList,
        sortKeyMap[sort_by],
        false,
        ascending
      );

      if (sort_by !== "Star") {
        // Step 4: Swap the values back to their original state
        sortedList.forEach((sublist) => {
          if (sublist.subtasks.length > 0) {
            let temp = sublist[sortKeyMap[sort_by]];
            sublist[sortKeyMap[sort_by]] =
              sublist.subtasks[0][sortKeyMap[sort_by]];
            sublist.subtasks[0][sortKeyMap[sort_by]] = temp;
          }
        });
      }

      console.log("Final sorted list:", sortedList);

      sortedList.forEach((lis) => {
        const listContainer = document.createElement("div");
        listContainer.className = "list-container";
        listContainer.dataset.id = lis.userOrder; // Use userOrder as the ID
        listContainer.innerHTML = `<h2 class="list-name">${lis.name}</h2>
          <button class="add-task">Add Task</button>
        `;
        listContainer.draggable = true; // Make the list container draggable

        renderTasksRecursiveHelper(lis.subtasks, listContainer);
        tasksSection.appendChild(listContainer);
      });
    }
    save();
  }

  //render both title and tasks
  function renderMain(new_selected = null, starred = false) {
    if (starred) {
      selectedNode = null;
      selected = null; // Reset selected if in starred mode
      main.classList.remove("hidden");
      msg.classList.add("hidden");
      addTaskButton.classList.add("hidden"); // Hide "Add Task" button in "Starred Page" mode
      titleElement.textContent = "Starred Tasks";
      titleElement.dataset.id = null;
      if (starred !== starredMode) {
        starredMode = true;
        renderTasks();
      }
      return;
    }
    starredMode = false; // Reset starred mode
    addTaskButton.classList.remove("hidden");
    const prevSelectedNode = selectedNode;
    if (new_selected !== null && new_selected < toDo.toDos.length) {
      selected = new_selected;
      selectedNode = toDo.getList(selected);
    }
    if (selected === null || selected >= toDo.toDos.length) {
      main.classList.add("hidden");
      msg.classList.remove("hidden");
      selected = null; // Reset selected if no valid list
      selectedNode = null; // Reset selected node for drag and drop
      return;
    } else {
      main.classList.remove("hidden");
      msg.classList.add("hidden");
    }
    console.log(
      `Rendering main for list ID: ${selected} , Node: ${selectedNode?.name}. Previous Node: ${prevSelectedNode?.name}`
    );
    //we need node as index can stay the same but the node position can change
    if (prevSelectedNode !== selectedNode) {
      let list = toDo.getList(selected);
      titleElement.textContent = list.name;
      titleElement.dataset.id = list.userOrder; // Use userOrder as the ID
      renderTasks();
    }
    save();
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
  sortSelect.value = sortBy; // Set initial sort value
  sortSelect.onchange = () => {
    renderTasks();
  };
  // Toggle sort order button
  const sortToggleButton = main.querySelector(".sort-toggle");
  sortToggleButton.textContent = ascending ? "⬆️" : "⬇️";
  sortToggleButton.onclick = () => {
    ascending = !ascending;
    sortToggleButton.textContent = ascending ? "⬆️" : "⬇️";
    console.log(
      `Sorting order changed to: ${ascending ? "Ascending" : "Descending"}`
    );
    renderTasks();
  };

  // Add task button top level
  const addTaskButton = main.querySelector(".task-controls-bar .add-task");
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
    const containerButton = starredMode
      ? e.target.closest(".list-container")
      : null;

    if (starredMode && !containerButton) return;

    const index = containerButton
      ? Number(containerButton.dataset.id)
      : selected;

    const btnClass = taskElement
      ? [
          "remove-task",
          "update-task",
          "toggle-completed",
          "toggle-starred",
          "add-subtask",
        ].find((cls) => e.target.classList.contains(cls))
      : starredMode && e.target.classList.contains("add-task")
      ? "add-task"
      : null;

    if (!btnClass) return;

    console.log(`Button clicked: ${btnClass}`);

    const taskId = taskElement ? Number(taskElement.dataset.id) : null;
    const ancestryArray = taskElement
      ? getTaskAncestryArray(taskElement)
      : null;

    const list =
      !starredMode || ancestryArray ? toDo.getList(index, ancestryArray) : null;

    const task = list
      ? list.getSubtask(taskId)
      : starredMode
      ? toDo.getList(index)
      : null;
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
      case "add-task": //bubble down
      case "add-subtask":
        showTaskForm({
          title: "Add Subtask",
          onSave: ({ name, note, priority, dueDate }) => {
            console.log(`added subtask is starred: ${starredMode}`);
            task.addSubtask(name, note, priority, dueDate, starredMode);
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
    const containerButton = starredMode
      ? e.target.closest(".list-container")
      : null;

    if (starredMode && !containerButton) return;
    if (!starredMode && !taskElement) return;

    // Determine source index
    const sourceToDoIdx = containerButton
      ? Number(containerButton.dataset.id)
      : selected;
    // Store ancestry and index for the dragged task
    const ancestry = taskElement ? getTaskAncestryArray(taskElement) : null;
    const fromIdx = ancestry ? ancestry[0] : null;
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ ancestry, fromIdx, sourceToDoIdx })
    );
    taskElement?.classList?.add("dragging");
    console.log(
      `Dragging task with ancestry: ${ancestry}, from index: ${fromIdx}, sourceToDoIdx: ${sourceToDoIdx}`
    );
  });

  tasksSection.addEventListener("dragend", (e) => {
    const taskElement =
      e.target.closest(".task") || e.target.closest(".list-container");
    if (taskElement) {
      taskElement.classList.remove("dragging");
      tasksSection
        .querySelectorAll(".drag-over")
        .forEach((el) => el.classList.remove("drag-over"));
    }
  });

  tasksSection.addEventListener("dragover", (e) => {
    const taskElement =
      e.target.closest(".task") || e.target.closest(".list-container");
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
    const containerButton = starredMode
      ? e.target.closest(".list-container")
      : null;

    if (starredMode && !containerButton) return;
    if (!starredMode && !targetTask) return;

    e.preventDefault();
    targetTask?.classList?.remove("drag-over");

    const destToDoIdx = containerButton
      ? Number(containerButton.dataset.id)
      : selected;

    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    const { ancestry, fromIdx, sourceToDoIdx } = JSON.parse(data);
    const toIdx = targetTask ? Number(targetTask.dataset.id) : null;

    // Only allow drop if ancestry matches (i.e., same parent array) and not dropping on itself
    const targetAncestry = targetTask ? getTaskAncestryArray(targetTask) : null;
    console.log("Target Ancestry Array:", targetAncestry);
    console.log("From Index:", fromIdx, "To Index:", toIdx);
    console.log("Ancestry:", ancestry);
    console.log(
      `Source ToDo Index: ${sourceToDoIdx}, Destination ToDo Index: ${destToDoIdx}`
    );
    const idx = starredMode ? sourceToDoIdx : selected;
    if (
      (!starredMode || (ancestry !== null && null !== targetAncestry)) &&
      JSON.stringify(ancestry.slice(1)) ===
        JSON.stringify(targetAncestry.slice(1)) &&
      fromIdx !== toIdx
    ) {
      // Find the parent array
      let parent = toDo.getList(idx, ancestry);
      if (fromIdx !== -1 && toIdx !== -1) {
        if (starredMode) {
          updateStarOrderArray(parent.subtasks, fromIdx, toIdx); //note: idx is of userorder one not star
        } else {
          updateOrderArray(parent.subtasks, fromIdx, toIdx);
        }
        renderTasks();
      }
    } else if (
      starredMode &&
      ancestry === targetAncestry &&
      ancestry === null &&
      sourceToDoIdx !== destToDoIdx
    ) {
      updateStarOrderArray(toDo.toDos, sourceToDoIdx, destToDoIdx);
      renderTasks();
      // 1) both ancestory null : top level swap
      // cases: 1) both diff val :invalid
      // both same: same as above
    }
  });
  renderMain(_selected, _starredMode); // Initial render of main content
  //send renderMain to Header
  return {
    renderMain,
    main,
  };
}

function Page() {
  const todos_data = JSON.parse(localStorage.getItem("toDos")) || [];
  const selected = JSON.parse(localStorage.getItem("selectedListID")) || null;
  const sortByMain = localStorage.getItem("sortByMain") || "Date Created";
  const ascendingMain = localStorage.getItem("ascendingMain") === "true";

  const sortByHeader = localStorage.getItem("sortByHeader") || "Date Created";
  const ascendingHeader = localStorage.getItem("ascendingHeader") === "true";
  const starred = JSON.parse(localStorage.getItem("starred")) || false;
  console.log(`loaded things:
    selected: ${selected}, sortByMain: ${sortByMain}, sortByHeader: ${sortByHeader}, starred: ${starred}`);
  const allLists = toDo(todos_data);

  const { renderMain } = Main(
    allLists,
    selected,
    sortByMain,
    starred,
    ascendingMain
  );

  saveAllLists = () => {
    localStorage.setItem("toDos", JSON.stringify(allLists.toDos));
  };

  Header(
    allLists,
    renderMain,
    selected,
    sortByHeader,
    starred,
    ascendingHeader
  );
}
Page();

//left: starred page
//take priority as input and update for list . not done as kinda wierd to see. perhaps if i move it to left side instead of header.
//asceding and descing buttons
