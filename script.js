
// TODO: fix flashing of empty placeholder text on load 'hmm here's nothing to do'
// TODO: general file cleanup

// --------------------------------------------------------
//			global variables & event listeners
// --------------------------------------------------------
const data = (localStorage.getItem('taskList')) ? JSON.parse(localStorage.getItem('taskList')) : { // pull data from local storage into data object immediately on load
	openTasks: [],
	doneTasks: []
};
const taskToggle = document.getElementById('task-toggle');
const doneToggle = document.getElementById('done-toggle');
const taskList = document.getElementById('task-list');
const doneList = document.getElementById('done-list');
const newTaskButton = document.getElementById('add-new-task-button');
const shortcutsLink = document.getElementById('shortcuts-link');
const shortcutsModal = document.getElementById('shortcuts-modal');
const animationTime = 300;

taskToggle.addEventListener('click', function(){ toggleTaskList(); });
doneToggle.addEventListener('click', function(){ toggleDoneList(); });
shortcutsLink.addEventListener('click', (e) => {
	e.preventDefault();
	openModal();
});
// document.addEventListener('keydown', function(e) {
// 	console.log(e);
// });
document.addEventListener('keydown', function(e) {
	if (e.ctrlKey && e.code === 'Slash') {
		e.preventDefault();
		openModal();
	}
});
newTaskButton.addEventListener('click', function(){ 
	if (taskList.childElementCount === 0 || !taskList.firstElementChild.classList.contains('new')) { // prevent executing if existing new task draft present
		showTaskDraft();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};
});
document.addEventListener('keydown', function(e) {
	if (e.code === 'KeyN' && e.target.tagName !== 'INPUT') {
		e.preventDefault();
		showTaskDraft();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
});
document.addEventListener('keydown', function(e) {
	if (e.code === 'KeyT' && e.target.tagName !== 'INPUT') {
		e.preventDefault();
		toggleTaskList();
		setTimeout(() => {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}, 100);
	}
});
document.addEventListener('keydown', function(e) {
	if (e.code === 'KeyD' && e.target.tagName !== 'INPUT') {
		e.preventDefault();
		toggleDoneList();
		setTimeout(() => {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}, 100);
	}
});
document.addEventListener('keydown', function(e) {
	if (e.code === 'Escape') {
		if (document.getElementById('task-text-entry')) {
			deleteNewTaskDraft();
		}
		closeModal();
	}
});
shortcutsModal.addEventListener('click', (e) => {
	if (e.target === shortcutsModal) {
		closeModal();
	}
});
document.addEventListener('keydown', function(e) {
	if (e.code === 'KeyR' || e.code === 'Backspace' || e.code === 'Delete') {
		if (document.activeElement.hasAttribute('data-index')) {
		deleteTask(e, true);
		}
	}
});
document.addEventListener('keydown', function(e) {
	if (e.code === 'KeyC' || e.code === 'Enter' || e.code === 'Return') {
		if (document.activeElement.hasAttribute('data-index')) {
		completeTaskToggle(e, true);
		}
	}
});

// --------------------------------------------------------
//			display existing tasks from saved data
// --------------------------------------------------------

displaySavedData();

function displaySavedData() {
	// if both the data.openTasks and data.doneTasks arrays are empty, do nothing
	if (!data.openTasks.length && !data.doneTasks.length) return;
	// if either of the data.openTasks and data.doneTasks arrays are not empty...
	// loop through the data.openTasks array and add all tasks to the to taskList html
	for (let i = 0; i < data.openTasks.length; i++) {
		let taskText = data.openTasks[i]['task text'];
		let dueDate = data.openTasks[i]['due date'];
		let dateObject = new Date(data.openTasks[i]['due date object']);
		data.openTasks[i]['due date object'] = dateObject;
		let id = data.openTasks[i]['unique id'];
		buildTaskHtmlFromSavedData(taskText, dueDate, dateObject, id, false);
	};
	setTaskToggleDotColor();
	// loop through the data.doneTasks array and add all tasks to the to doneList html
	for (let j = 0; j < data.doneTasks.length; j++) {
		let taskText = data.doneTasks[j]['task text'];
		let dueDate = data.doneTasks[j]['due date'];
		let dateObject = new Date(data.doneTasks[j]['due date object']);
		let id = data.doneTasks[j]['unique id'];
		buildTaskHtmlFromSavedData(taskText, dueDate, dateObject, id, true);
	};
};

// overwrites local storage 'trackList' with data object
function updateLocalStorage() {
	// convert data object to JSON, because local storage can't store JS
	localStorage.setItem('taskList', JSON.stringify(data));
};

// --------------------------------------------------------
//			switching between taskList and doneList
// --------------------------------------------------------

function toggleTaskList() {
	if (!taskList.classList.contains('state-visible')) {
		taskList.classList.remove('state-hidden');
		taskList.classList.add('state-visible');
		doneToggle.classList.remove('active');
		taskToggle.classList.add('active');
		doneList.classList.remove('state-visible');
		doneList.classList.add('state-hidden');
		newTaskButton.classList.remove('state-hidden');
	}
};

function toggleDoneList() {
	if (!doneList.classList.contains('state-visible')) {
		doneList.classList.remove('state-hidden');
		doneList.classList.add('state-visible');
		taskToggle.classList.remove('active');
		doneToggle.classList.add('active');
		taskList.classList.remove('state-visible');
		taskList.classList.add('state-hidden');
		newTaskButton.classList.add('state-hidden');
	}
};

// --------------------------------------------------------
//			helper functions
// --------------------------------------------------------

// remove the new task draft when nothing is entered and user clicks away
function deleteNewTaskDraft() {
	let taskInput = document.getElementById('task-text-entry');
	taskInput.parentElement.remove();
};

// build task object
function buildTaskObject(task, dueDate) {
	let dueDateObject = createDateObject(dueDate); //create date object
	// create unique id
	const allTasks = data.openTasks.concat(data.doneTasks);
	let id;
	let isUnique;
	do {
		isUnique = true;
		id = Math.floor(Math.random()*1000000001);
		for (const task of allTasks) {
			if (task['unique id'] === id) {
				isUnique = false;
				break;
			};
		};
	} while (!isUnique);
	return {
		'task text': task,
		'due date': dueDate,
		'due date object': dueDateObject,
		'due date fancy': createFancyDueDate(dueDateObject),
		'unique id': id
	};
};

// returns a date object from a date string
function createDateObject(dateString) {
	let dateComponents = dateString.split('-').map(Number);
	let dateObject = new Date(dateComponents[0], dateComponents[1] - 1, dateComponents[2]);
	dateObject.setHours(0, 0, 0, 0); // zero out/nomralize time
	return dateObject;
};

// returns today's date as a string
function todaysDateString() {
	let today = new Date();
	let year = today.getFullYear();
	let month = String(today.getMonth() + 1).padStart(2, '0');
	let day = String(today.getDate()).padStart(2, '0');
	let todaysDate = `${year}-${month}-${day}`;
	return todaysDate;
}

// returns a colloquial time reference (e.g. today, tomorrow) or a more pretty date
function createFancyDueDate(dateObject) {
	let todayObject = new Date();
	todayObject.setHours(0, 0, 0, 0);
	let yesterdayObject = new Date();
	yesterdayObject.setHours(0, 0, 0, 0);
	yesterdayObject.setDate(yesterdayObject.getDate() - 1);
	let tomorrowObject = new Date();
	tomorrowObject.setHours(0, 0, 0, 0);
	tomorrowObject.setDate(tomorrowObject.getDate() + 1);

	if (dateObject.getTime() === todayObject.getTime()) {
		return 'TODAY';
	} else if (dateObject.getTime() == yesterdayObject.getTime()) {
		return 'YESTERDAY';
	} else if (dateObject.getTime() == tomorrowObject.getTime()) {
		return 'TOMORROW';
	} else {
		const day = dateObject.getDate();
		const month = dateObject.getMonth() + 1; // months are zero-based, so add 1
		const year = dateObject.getFullYear().toString().slice(-2); // get the last 2 digits of the year
		const formattedDate = `${month}/${day.toString()}/${year}`;
		return formattedDate;
	}
};

// check task due date to see if it's past due, due today, or due in the future. returns the appropriate css class as a string
function returnOverdueClass(dateString) {
	// first create date object for today's date to compare due date against
	let todayObject = new Date();
	todayObject.setHours(0, 0, 0, 0); // zero out/nomralize time
	// create date object for input due date
	let dueDateObject = createDateObject(dateString);
	if (dueDateObject < todayObject ) {
		return "overdue";
	} else if (dueDateObject > todayObject) {
		return "future";
	} else {
		return "";
	}
};

// sorts tasks in one of the data object arrays only. doesn't affect html. takes data.openTasks or data.doneTasks as arguments
function sortTasksByDueDate(taskArray) {
	return taskArray.sort((a, b) => {
		let dateA = new Date(a['due date']);
		let dateB = new Date(b['due date']);

		return dateA - dateB;
	});
};

// inserts a task into the taskList or doneList in its sorted position
function insertTaskSorted(taskElement, dueDate, isCompleting) {
	let dueDateObject = createDateObject(dueDate);
	let targetList = (!isCompleting) ? taskList : doneList; // html list the task is being inserted into
	let targetListArray = Array.from(targetList.children);
	let targetDataArray = (!isCompleting) ? data.openTasks : data.doneTasks;
	let taskInserted = false;
	for (let i = 0; i < targetListArray.length; i++ ) {
		if (!targetListArray[i].classList.contains('new')) {
			let listItemDueDate = createDateObject(targetListArray[i].getAttribute('due-date'));
			if (dueDateObject < listItemDueDate) {
				targetList.insertBefore(taskElement, targetListArray[i]);
				taskElement.classList.remove('fade-out');
				taskInserted = true;
				break;
			}
		}
	}
	if (!taskInserted) {
		targetList.appendChild(taskElement);
		taskElement.classList.remove('fade-out');
	};
	sortTasksByDueDate(targetDataArray);
};

function setTaskToggleDotColor() {
	if (data.openTasks.length > 0) {
		let hasOverdue = false;
		let index = 0;
		do {
			let task = data.openTasks[index];
			let overdueStatus = returnOverdueClass(task['due date']);
			if (overdueStatus === 'overdue') {
				hasOverdue = true;
				break;
			};
			index++;
		} while (index < data.openTasks.length);
		if (hasOverdue) {
			taskToggle.setAttribute('overdue-status', 'overdue');
		} else {
			taskToggle.setAttribute('overdue-status', '');
		}
	} else {
		taskToggle.setAttribute('overdue-status', '')
	}
};

// removes task from html only. used to remove a task from its current list when completing an item, and when permanently deleting a task from the data object
function removeTaskFromDom(event, isTaskItem) {
	let taskElement = (isTaskItem) ? event.target : event.target.parentElement;
	taskElement.classList.add('fade-out');
	setTimeout(() => {
		taskElement.remove();
	}, animationTime);
};

// complete task
function completeTaskToggle(event, isTaskItem) {
	let taskElement = (isTaskItem) ? event.target : event.target.parentElement;
	let dataIndex = parseInt(taskElement.getAttribute('data-index'),10);
	let dueDate = taskElement.getAttribute('due-date');
	let isCompleting = (taskElement.parentElement.id == 'task-list') ? true : false;
	let fromArray = (isCompleting) ? data.openTasks : data.doneTasks;
	let toArray = (isCompleting) ? data.doneTasks : data.openTasks;
	// recreate task in the other list
	removeTaskFromDom(event, isTaskItem); // first remove task html from the dom only
	setTimeout(() => {
		let uniqueId = fromArray.findIndex(task => task['unique id'] === dataIndex);
		if (uniqueId !== -1) { // if completeing task was found in the data.openTask array
			let task = fromArray.splice(uniqueId, 1)[0]; // remove completed task from data.openTask array
			toArray.push(task); // adds completed task to data.doneTask array
			insertTaskSorted(taskElement, dueDate, isCompleting);
		} else {
			console.log('error: task not found in task list');
		}
		setTaskToggleDotColor();
		updateLocalStorage();
	}, animationTime);
};

// delete task
function deleteTask(event, isTaskItem) {
	let taskElement = (isTaskItem) ? event.target : event.target.parentElement;
	let parent = taskElement.parentElement;
	let dataIndex = parseInt(taskElement.getAttribute('data-index'),10);
	removeTaskFromDom(event, isTaskItem); // remove html
	// remove task from data.openTasks
	if (parent.id == 'task-list') {
		let uniqueId = data.openTasks.findIndex(task => task['unique id'] === dataIndex);
		data.openTasks.splice(uniqueId, 1);
	// remove task from data.doneTasks
	} else {
		let uniqueId = data.doneTasks.findIndex(task => task['unique id'] === dataIndex);
		data.doneTasks.splice(uniqueId, 1);
	};
	setTaskToggleDotColor();
	updateLocalStorage();
};

const openModal = () => {
	shortcutsModal.classList.add('active');
};

  const closeModal = () => {
	shortcutsModal.classList.remove('active');
};

// --------------------------------------------------------
//			adding the new task draft
// --------------------------------------------------------

// when the +task button is clicked, show the task draft as html and append it to the taskList
function showTaskDraft() {
	// create the html first and then append to the dom
	// task container
	let taskDraft = document.createElement('div');
	taskDraft.className = 'task-item new';
	// status light
	let statusLight = document.createElement('div');
	statusLight.className = 'status-light';
	taskDraft.appendChild(statusLight);
	// task text input
	let taskInput = document.createElement('input');
	taskInput.className = 'task';
	taskInput.type = 'text';
	taskInput.name = 'task-text';
	taskInput.id= 'task-text-entry';
	taskInput.required = true;
	taskInput.placeholder = 'ENTER TASK...';
	taskInput.addEventListener('input', function() {taskInput.value = taskInput.value.toUpperCase();})
	taskDraft.appendChild(taskInput);
	// due date input
	let dueDateInput = document.createElement('input');
	dueDateInput.className = 'due-date';
	dueDateInput.type = 'date';
	dueDateInput.name = 'task-due-date';
	dueDateInput.id = 'task-due-date-entry';
	dueDateInput.required = true;
	dueDateInput.pattern = '\\d{4}-\\d{2}-\\d{2}';
	dueDateInput.value = todaysDateString();
	taskDraft.appendChild(dueDateInput);
	// confirm task button
	let confirmNewTaskButton = document.createElement('div');
	confirmNewTaskButton.className = 'no-select confirm-new-task';
	confirmNewTaskButton.textContent = '✓';
	taskDraft.appendChild(confirmNewTaskButton);
	// create confirm call back function
	function confirmTask() { 
		if (taskInput.value && dueDateInput.value ) {
			buildNewTaskHtml(taskInput.value, dueDateInput.value);
			taskDraft.remove();
		}; 
	};
	// confirming new task acceptance
	taskInput.addEventListener('keydown', function(e) {
		if (e.code === 'Enter' || e.code === 'Return') {
			confirmTask();
		}
	});
	dueDateInput.addEventListener('keydown', function(e) {
		if (e.code === 'Enter' || e.code === 'Return') {
			confirmTask();
		}
	});
	confirmNewTaskButton.addEventListener('click', confirmTask);
	// add new task draft to dom
	if (taskList.firstElementChild) {
		taskList.insertBefore(taskDraft, taskList.firstElementChild);
	} else {
		taskList.appendChild(taskDraft);
	};
	// usability
	taskInput.focus(); // adds text entry cursor to enter task text
	taskInput.addEventListener('blur', function() { 
		if (taskInput.value === '' || taskInput.value === null) {
			deleteNewTaskDraft();
		}
	}); // monitor if user clicks away from new task draft input
};

// --------------------------------------------------------
//			adding a new task to the taskList html
// --------------------------------------------------------

function buildTaskHtmlFromSavedData(text, dueDate, dateObject, id, done) {
	// build html element for task
	// task container
	let newTaskElement = document.createElement('div');
	newTaskElement.setAttribute('tabindex', 0);
	newTaskElement.setAttribute('data-index', id);
	newTaskElement.setAttribute('overdue-status', returnOverdueClass(dueDate));
	newTaskElement.setAttribute('due-date', dueDate);
	newTaskElement.className = 'task-item';
	// status light
	let taskStatus = document.createElement('div');
	taskStatus.classList.add('status-light');
	taskStatus.addEventListener('click', completeTaskToggle);
	newTaskElement.appendChild(taskStatus);
	// task text
	let taskText = document.createElement('div');
	taskText.className ='task';
	taskText.textContent = text;
	newTaskElement.appendChild(taskText);
	let taskDate = document.createElement('div');
	// due date
	let fancyDueDate = createFancyDueDate(dateObject);
	// taskDate.textContent = dueDate;
	taskDate.textContent = (fancyDueDate !== '') ? fancyDueDate : dueDate;
	taskDate.className = 'due-date';
	newTaskElement.appendChild(taskDate);
	// delete button
	let taskDelete = document.createElement('div');
	taskDelete.className = 'no-select delete';
	taskDelete.textContent = '✖';
	taskDelete.addEventListener('click', deleteTask);
	newTaskElement.appendChild(taskDelete);
	// add task to appropriate task list and sort the list
	if (done) {
		doneList.appendChild(newTaskElement);
		sortTasksByDueDate(data.doneTasks);
	} else {
		taskList.appendChild(newTaskElement);
		sortTasksByDueDate(data.openTasks);
	};
}

function buildNewTaskHtml(text, dueDate) {
	// update data object and local storage
	let newTask = buildTaskObject(text, dueDate);
	data.openTasks.push(newTask);
	updateLocalStorage();
	// build html element for new task
	// task container
	let newTaskElement = document.createElement('div');
	newTaskElement.setAttribute('tabindex', 0);
	newTaskElement.setAttribute('data-index', newTask['unique id']);
	newTaskElement.setAttribute('overdue-status', returnOverdueClass(dueDate));
	newTaskElement.setAttribute('due-date', dueDate);
	newTaskElement.className = 'task-item';
	// status light
	let taskStatus = document.createElement('div');
	taskStatus.classList.add('status-light');
	taskStatus.addEventListener('click', completeTaskToggle);
	newTaskElement.appendChild(taskStatus);
	// task text
	let taskText = document.createElement('div');
	taskText.className ='task';
	taskText.textContent = text.toUpperCase();
	newTaskElement.appendChild(taskText);
	// due date
	let taskDate = document.createElement('div');
	taskDate.textContent = (newTask['due date fancy'] !== '') ? newTask['due date fancy'] : dueDate;
	taskDate.className = 'due-date';
	newTaskElement.appendChild(taskDate);
	// delete task button
	let taskDelete = document.createElement('div');
	taskDelete.className = 'no-select delete';
	taskDelete.textContent = '✖';
	taskDelete.addEventListener('click', deleteTask);
	newTaskElement.appendChild(taskDelete);
	// insert new task into its sorted position in the taskList html
	insertTaskSorted(newTaskElement, dueDate, false);
	setTaskToggleDotColor();
};