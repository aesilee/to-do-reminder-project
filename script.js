let tasks = [];
let updateInterval;
let selectedHour = "10";
let selectedMinute = "00";
let selectedAmPm = "AM";
let selectedCategory = "general";

const categories = ['general', 'work', 'personal', 'shopping', 'school', 'home'];

document.addEventListener('DOMContentLoaded', function() {
    updateDate();
    updateGreeting();
    updateStats();
    renderAllViews();
    renderTodaysTasksOverview();
    setupTimeSelectors();
    setupCategorySelector();
    
    startRealTimeUpdates();
});

function startRealTimeUpdates() {
    if (updateInterval) clearInterval(updateInterval);
    
    updateInterval = setInterval(() => {
        updateDate();
        updateGreeting();
        checkTaskActivation();
        checkOverdueTasks();
        updateStats();
        renderAllViews();
        renderTodaysTasksOverview();
    }, 60000); // Check every minute
}

function setupTimeSelectors() {
    // Setup hour picker (1-12)
    const hours = Array.from({length: 12}, (_, i) => (i + 1).toString());
    setupScrollPicker('hourList', hours, selectedHour, (value) => {
        selectedHour = value;
    });
    
    // Setup minute picker (00-59)
    const minutes = Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0'));
    setupScrollPicker('minuteList', minutes, selectedMinute, (value) => {
        selectedMinute = value;
    });
    
    // Setup AM/PM picker
    const ampmOptions = ['AM', 'PM'];
    setupScrollPicker('ampmList', ampmOptions, selectedAmPm, (value) => {
        selectedAmPm = value;
    });
}

function setupCategorySelector() {
    const select = document.getElementById('taskCategory');
    select.value = selectedCategory;
    select.addEventListener('change', (e) => {
        selectedCategory = e.target.value;
    });
}

function setupScrollPicker(containerId, options, defaultValue, onSelect) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const defaultIdx = options.indexOf(defaultValue);
    const scrollIndex = defaultIdx >= 0 ? defaultIdx : 0;
    
    options.forEach((option, idx) => {
        const item = document.createElement('div');
        const isActive = idx === scrollIndex;
        item.className = `scroll-picker-item ${isActive ? 'active' : ''}`;
        item.textContent = option;
        item.dataset.value = option;
        item.dataset.index = idx;
        container.appendChild(item);
    });
    
    const parent = container.parentElement;
    setTimeout(() => {
        const activeItem = container.querySelector('.active') || container.children[scrollIndex];
        if (activeItem) {
            const itemHeight = 40;
            const containerHeight = parent.offsetHeight;
            const scrollTop = activeItem.offsetTop - (containerHeight / 2) + (itemHeight / 2);
            container.scrollTop = scrollTop;
        }
    }, 0);

    // Auto-select on scroll
    let scrollTimeout;
    container.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const itemHeight = 40;
            const containerHeight = parent.offsetHeight;
            const centerY = containerHeight / 2;
            
            let closestItem = null;
            let closestDistance = Infinity;
            
            container.querySelectorAll('.scroll-picker-item').forEach(item => {
                const itemCenterY = item.offsetTop + itemHeight / 2 - container.scrollTop;
                const distance = Math.abs(itemCenterY - centerY);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestItem = item;
                }
            });
            
            if (closestItem) {
                const value = closestItem.dataset.value;
                container.querySelectorAll('.scroll-picker-item').forEach(item => {
                    item.classList.remove('active');
                });
                closestItem.classList.add('active');
                onSelect(value);
            }
        }, 100);
    });
}

function convertTo24Hour(hour, minute, ampm) {
    let hour24 = parseInt(hour);
    if (ampm === 'PM' && hour24 !== 12) {
        hour24 += 12;
    } else if (ampm === 'AM' && hour24 === 12) {
        hour24 = 0;
    }
    return `${hour24.toString().padStart(2, '0')}:${minute}`;
}

function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dateDisplay').textContent = now.toLocaleDateString('en-US', options);
}

function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
}

function getGreetingEmoji() {
    const timeOfDay = getTimeOfDay();
    const emojis = {
        morning: '🌅',
        afternoon: '🌤️',
        evening: '🌙'
    };
    return emojis[timeOfDay];
}

function getGreetingText() {
    const timeOfDay = getTimeOfDay();
    const greetings = {
        morning: 'Good Morning',
        afternoon: 'Good Afternoon',
        evening: 'Good Evening'
    };
    return greetings[timeOfDay];
}

function updateGreeting() {
    const today = new Date().toDateString();
    
    const todaysTasks = tasks.filter(t => 
        !t.completed && 
        !t.overdue &&
        new Date(t.date).toDateString() === today
    );

    const greeting = getGreetingText();
    const emoji = getGreetingEmoji();
    
    let display = `${greeting}! ${emoji}`;
    let taskDisplay = '';

    if (todaysTasks.length > 0) {
        const categories = [...new Set(todaysTasks.map(task => task.category))];
        if (categories.length === 1) {
            taskDisplay = `You have ${categories[0]} tasks today`;
        } else {
            taskDisplay = `You have ${todaysTasks.length} tasks today`;
        }
    } else {
        taskDisplay = `✨ Enjoy your free time today!`;
    }

    document.getElementById('greeting').textContent = display;
    document.getElementById('taskDisplay').textContent = taskDisplay;
}

function isTaskActive(task, now) {
    if (!task.date) return true;
    
    const taskDate = new Date(task.date).toDateString();
    const today = new Date(now).toDateString();
    
    if (taskDate !== today) return false;
    
    // Check if task time has arrived
    if (task.time) {
        const taskDateTime = new Date(`${task.date}T${task.time}`);
        return taskDateTime <= now;
    }
    
    return true;
}

function checkTaskActivation() {
    const now = new Date();
    let needsUpdate = false;

    tasks.forEach(task => {
        if (!task.completed && !task.active && task.date && task.time) {
            const taskDate = new Date(task.date).toDateString();
            const today = new Date(now).toDateString();
            
            if (taskDate === today) {
                const taskDateTime = new Date(`${task.date}T${task.time}`);
                if (taskDateTime <= now) {
                    task.active = true;
                    needsUpdate = true;
                }
            }
        }
    });

    if (needsUpdate) {
        saveTasks();
    }
}

function checkOverdueTasks() {
    const now = new Date();
    let needsUpdate = false;

    tasks.forEach(task => {
        if (!task.completed && !task.overdue && task.date) {
            const taskDate = new Date(task.date);
            const today = new Date(now);
            
            // Set time to start of day for comparison
            today.setHours(0, 0, 0, 0);
            
            // Task is overdue if date has passed and it's not active
            if (taskDate < today && !task.active) {
                task.overdue = true;
                needsUpdate = true;
            }
        }
    });

    if (needsUpdate) {
        saveTasks();
    }
}

function showView(viewName) {
    document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
    const viewId = viewName === 'completedTasks' ? 'completedTasksView' : viewName + 'View';
    document.getElementById(viewId).classList.add('active');
    window.scrollTo(0, 0);
}

function openModal() {
    document.getElementById('taskModal').classList.add('active');
    document.getElementById('taskDate').valueAsDate = new Date();
    setupTimeSelectors();
    setupCategorySelector();
}

function closeModal() {
    document.getElementById('taskModal').classList.remove('active');
    document.getElementById('taskForm').reset();
}

function addTask(e) {
    e.preventDefault();
    const category = document.getElementById('taskCategory').value;
    const time24 = convertTo24Hour(selectedHour, selectedMinute, selectedAmPm);
    
    const task = {
        id: Date.now(),
        title: document.getElementById('taskTitle').value,
        date: document.getElementById('taskDate').value,
        time: time24,
        displayTime: `${selectedHour}:${selectedMinute} ${selectedAmPm}`,
        category: category,
        notes: document.getElementById('taskNotes').value,
        completed: false,
        completedAt: null,
        overdue: false,
        active: false // Task becomes active when its time arrives
    };
    
    // Check if task should be active immediately
    const now = new Date();
    const taskDate = new Date(task.date).toDateString();
    const today = new Date(now).toDateString();
    
    if (taskDate === today) {
        const taskDateTime = new Date(`${task.date}T${task.time}`);
        if (taskDateTime <= now) {
            task.active = true;
        }
    }
    
    tasks.push(task);
    saveTasks();
    checkOverdueTasks();
    updateStats();
    updateGreeting();
    renderAllViews();
    renderTodaysTasksOverview();
    closeModal();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        saveTasks();
        updateStats();
        updateGreeting();
        renderAllViews();
        renderTodaysTasksOverview();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    updateStats();
    updateGreeting();
    renderAllViews();
    renderTodaysTasksOverview();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const stored = localStorage.getItem('tasks');
    if (stored) {
        tasks = JSON.parse(stored);
    }
}

function updateStats() {
    checkTaskActivation();
    checkOverdueTasks();
    const now = new Date();
    const today = new Date().toDateString();
    
    const todayTasks = tasks.filter(t => {
        if (t.completed || t.overdue) return false;
        const taskDate = new Date(t.date).toDateString();
        return taskDate === today;
    });
    
    const scheduledTasks = tasks.filter(t => {
        if (t.completed || t.overdue) return false;
        const taskDate = new Date(t.date);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate > todayDate;
    });
    
    const allTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);
    const overdueTasks = tasks.filter(t => !t.completed && t.overdue);

    document.getElementById('todayNum').textContent = todayTasks.length;
    document.getElementById('scheduledNum').textContent = scheduledTasks.length;
    document.getElementById('allNum').textContent = allTasks.length;
    document.getElementById('completedNum').textContent = completedTasks.length;
    document.getElementById('overdueNum').textContent = overdueTasks.length;
}

function renderAllViews() {
    renderTodayTasks();
    renderScheduledTasks();
    renderAllTasks();
    renderCompletedTasks();
    renderOverdueTasks();
}

function renderTodayTasks() {
    const today = new Date().toDateString();
    const todayTasks = tasks.filter(t => {
        if (t.completed || t.overdue) return false;
        const taskDate = new Date(t.date).toDateString();
        return taskDate === today;
    });
    
    // Sort by time (tasks with no time go to the end)
    todayTasks.sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        
        // Convert time strings to comparable format
        const [aHour, aMin] = a.time.split(':').map(Number);
        const [bHour, bMin] = b.time.split(':').map(Number);
        
        if (aHour !== bHour) return aHour - bHour;
        return aMin - bMin;
    });
    
    renderTasks('todayTasks', todayTasks);
}

function renderScheduledTasks() {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    const scheduledTasks = tasks.filter(t => {
        if (t.completed || t.overdue) return false;
        const taskDate = new Date(t.date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate > todayDate;
    });
    
    // Sort by date then time
    scheduledTasks.sort((a, b) => {
        const dateCompare = new Date(a.date) - new Date(b.date);
        if (dateCompare !== 0) return dateCompare;
        
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        
        // Convert time strings to comparable format
        const [aHour, aMin] = a.time.split(':').map(Number);
        const [bHour, bMin] = b.time.split(':').map(Number);
        
        if (aHour !== bHour) return aHour - bHour;
        return aMin - bMin;
    });
    
    renderTasks('scheduledTasks', scheduledTasks);
}

function renderAllTasks() {
    const allTasks = tasks.filter(t => !t.completed);
    renderTasks('allTasks', allTasks);
}

function renderCompletedTasks() {
    const completedTasks = tasks.filter(t => t.completed);
    renderTasks('completedTasksList', completedTasks);
}

function renderOverdueTasks() {
    const overdueTasks = tasks.filter(t => !t.completed && t.overdue);
    renderTasks('overdueTasks', overdueTasks);
}

function renderTodaysTasksOverview() {
    const today = new Date().toDateString();
    const todaysTasks = tasks.filter(t => {
        if (t.completed || t.overdue) return false;
        const taskDate = new Date(t.date).toDateString();
        return taskDate === today;
    });
    
    // Sort by time (tasks with no time go to the end)
    todaysTasks.sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        
        // Convert time strings to comparable format
        const [aHour, aMin] = a.time.split(':').map(Number);
        const [bHour, bMin] = b.time.split(':').map(Number);
        
        if (aHour !== bHour) return aHour - bHour;
        return aMin - bMin;
    });
    
    const container = document.getElementById('todaysTasksOverview');
    const countElement = document.getElementById('todayTaskCount');
    
    countElement.textContent = `${todaysTasks.length} ${todaysTasks.length === 1 ? 'task' : 'tasks'}`;
    
    if (todaysTasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No tasks for today. Enjoy your free time!</p></div>';
        return;
    }
    
    const now = new Date();
    container.innerHTML = todaysTasks.map(task => createTaskElement(task, now)).join('');
}

function renderTasks(containerId, taskList) {
    const container = document.getElementById(containerId);
    if (taskList.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No tasks here</p></div>';
        return;
    }
    const now = new Date();
    container.innerHTML = taskList.map(task => createTaskElement(task, now)).join('');
}

function createTaskElement(task, now) {
    const taskDate = new Date(task.date);
    const today = new Date().toDateString();
    const taskDateStr = taskDate.toDateString();
    
    let statusClass = '';
    if (task.completed) {
        statusClass = 'completed';
    } else if (task.overdue) {
        statusClass = 'overdue';
    }
    
    let dateText = task.date ? taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date';
    let timeText = task.displayTime ? `⏰ ${task.displayTime}` : '';
    let titleDisplay = task.title;
    
    if (task.overdue) {
        titleDisplay = `❗ ${task.title} ❗`;
    }

    return `
        <div class="task-card ${statusClass}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
            <div class="task-content">
                <div class="task-title">${titleDisplay}</div>
                <div class="task-meta">
                    <span class="task-date">📍 ${dateText}</span>
                    ${timeText ? `<span class="task-time">${timeText}</span>` : ''}
                    <span class="task-category ${task.category}">${task.category}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        </div>
    `;
}

window.onclick = function(event) {
    const modal = document.getElementById('taskModal');
    if (event.target === modal) {
        closeModal();
    }
}

loadTasks();
document.addEventListener('DOMContentLoaded', function() {
    checkTaskActivation();
    checkOverdueTasks();
    updateStats();
    renderAllViews();
});