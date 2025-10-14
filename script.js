let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

document.addEventListener('DOMContentLoaded', function() {
    updateDate();
    updateGreeting();
    updateStats();
    renderAllViews();
    renderTodaysTasksOverview();
});

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
    const now = new Date();
    const today = new Date().toDateString();
    
    // Get today's tasks
    const todaysTasks = tasks.filter(t => 
        !t.completed && 
        new Date(t.date).toDateString() === today
    );

    const greeting = getGreetingText();
    const emoji = getGreetingEmoji();
    
    let display = `${greeting}! ${emoji}`;
    let taskDisplay = '';

    if (todaysTasks.length > 0) {
        // Get unique categories for today's tasks
        const categories = [...new Set(todaysTasks.map(task => task.category))];
        if (categories.length === 1) {
            taskDisplay = `You have ${categories[0]} today`;
        } else {
            taskDisplay = `You have ${todaysTasks.length} tasks today`;
        }
    } else {
        taskDisplay = `✨ Enjoy your free time today!`;
    }

    document.getElementById('greeting').textContent = display;
    document.getElementById('taskDisplay').textContent = taskDisplay;
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
}

function closeModal() {
    document.getElementById('taskModal').classList.remove('active');
    document.getElementById('taskForm').reset();
}

function addTask(e) {
    e.preventDefault();
    const task = {
        id: Date.now(),
        title: document.getElementById('taskTitle').value,
        date: document.getElementById('taskDate').value,
        time: document.getElementById('taskTime').value,
        category: document.getElementById('taskCategory').value,
        notes: document.getElementById('taskNotes').value,
        completed: false,
        completedAt: null
    };
    tasks.push(task);
    saveTasks();
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

function updateStats() {
    const today = new Date().toDateString();
    const todayTasks = tasks.filter(t => !t.completed && new Date(t.date).toDateString() === today);
    const scheduledTasks = tasks.filter(t => !t.completed && new Date(t.date) > new Date() && new Date(t.date).toDateString() !== today);
    const allTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);
    const overdueTasks = tasks.filter(t => !t.completed && new Date(t.date) < new Date());

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
    const todayTasks = tasks.filter(t => !t.completed && new Date(t.date).toDateString() === today);
    renderTasks('todayTasks', todayTasks);
}

function renderScheduledTasks() {
    const scheduledTasks = tasks.filter(t => !t.completed && new Date(t.date) > new Date());
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
    const overdueTasks = tasks.filter(t => !t.completed && new Date(t.date) < new Date());
    renderTasks('overdueTasks', overdueTasks);
}

function renderTodaysTasksOverview() {
    const today = new Date().toDateString();
    const todaysTasks = tasks.filter(t => !t.completed && new Date(t.date).toDateString() === today);
    const container = document.getElementById('todaysTasksOverview');
    const countElement = document.getElementById('todayTaskCount');
    
    // Update task count
    countElement.textContent = `${todaysTasks.length} ${todaysTasks.length === 1 ? 'task' : 'tasks'}`;
    
    if (todaysTasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No tasks for today. Enjoy your free time!</p></div>';
        return;
    }
    
    container.innerHTML = todaysTasks.map(task => createTaskElement(task)).join('');
}

function renderTasks(containerId, taskList) {
    const container = document.getElementById(containerId);
    if (taskList.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No tasks here</p></div>';
        return;
    }
    container.innerHTML = taskList.map(task => createTaskElement(task)).join('');
}

function createTaskElement(task) {
    const taskDate = new Date(task.date);
    const today = new Date();
    const isOverdue = taskDate < today && !task.completed;
    
    let dateText = task.date ? taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date';
    if (task.time) dateText += ` • ${task.time}`;

    return `
        <div class="task-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    <span class="task-date">📍 ${dateText}</span>
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