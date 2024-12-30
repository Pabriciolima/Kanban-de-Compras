// Seleciona colunas e cartões
const columns = document.querySelectorAll('.column');
let cards = document.querySelectorAll('.card');
let intervals = {}; // Gerencia timers
let taskId = 1; // ID inicial para tarefas
let completedTasks = []; // Lista de tarefas concluídas

// Adiciona eventos aos cartões existentes
cards.forEach((card) => {
    card.dataset.id = `#${String(taskId).padStart(3, '0')}`; // Adiciona ID único
    taskId++;
    card.addEventListener('dragstart', dragStart);
    card.addEventListener('dragend', dragEnd);
    card.addEventListener('dblclick', editCard);
    const deleteButton = card.querySelector('.delete-card');
    deleteButton.addEventListener('click', deleteCard);
    startTimer(card);
    updateCardId(card); // Mostra o ID no cartão
});

// Adiciona eventos às colunas
columns.forEach((column) => {
    column.addEventListener('dragover', dragOver);
    column.addEventListener('dragenter', dragEnter);
    column.addEventListener('dragleave', dragLeave);
    column.addEventListener('drop', dragDrop);
    const addButton = column.querySelector('.add-card');
    if (addButton) {
        addButton.addEventListener('click', addCard);
    }
});

// Evento do botão de dashboard
document.getElementById('dashboard-btn').addEventListener('click', showDashboard);
document.getElementById('close-dashboard').addEventListener('click', () => {
    document.getElementById('dashboard').style.display = 'none';
});

function dragStart() {
    this.classList.add('dragging');
}

function dragEnd() {
    this.classList.remove('dragging');
    columns.forEach((column) => {
        column.classList.remove('hovered');
    });
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
    this.classList.add('hovered');
}

function dragLeave() {
    this.classList.remove('hovered');
}

function dragDrop(e) {
    e.preventDefault();
    this.classList.remove('hovered');
    const draggingCard = document.querySelector('.dragging');
    this.insertBefore(draggingCard, this.querySelector('.add-card'));
    updateCardColor(draggingCard, this);

    // Verifica se o cartão foi movido para "Finalizado"
    if (this.id === 'recebido') {
        stopTimer(draggingCard);
        saveCompletedTask(draggingCard);
    }
}

function updateCardColor(card, column) {
    const columnId = column.id;
    card.classList.remove('nao-iniciado', 'iniciado', 'em-andamento', 'finalizado');

    if (columnId === 'solicitacao') {
        card.classList.add('nao-iniciado');
    } else if (columnId === 'aprovacao') {
        card.classList.add('iniciado');
    } else if (columnId === 'processamento') {
        card.classList.add('em-andamento');
    } else if (columnId === 'recebido') {
        card.classList.add('finalizado');
    }
}

function addCard(e) {
    const column = e.target.closest('.column');
    const card = document.createElement('div');
    card.className = 'card nao-iniciado';
    card.setAttribute('draggable', 'true');
    card.dataset.id = `#${String(taskId).padStart(3, '0')}`;
    card.innerHTML = `
        <span class="card-id">${card.dataset.id}</span>
        <span contenteditable="true" class="task-name">Nova Tarefa</span>
        <span class="delete-card">&times;</span>
        <div class="timer">00:00:00</div>
    `;
    column.insertBefore(card, column.querySelector('.add-card'));
    card.addEventListener('dragstart', dragStart);
    card.addEventListener('dragend', dragEnd);
    card.addEventListener('dblclick', editCard);
    const deleteButton = card.querySelector('.delete-card');
    deleteButton.addEventListener('click', deleteCard);
    startTimer(card);
    taskId++;
}

function deleteCard(e) {
    const card = e.target.closest('.card');
    clearInterval(intervals[card.dataset.id]);
    delete intervals[card.dataset.id];
    card.remove();
}

function editCard(e) {
    const card = e.target;
    const content = card.querySelector('.task-name');
    content.focus();
    content.setAttribute("contenteditable", "true");
    content.classList.add("editing"); // Para diferenciar quando está sendo editado
}

function startTimer(card) {
    const timer = card.querySelector('.timer');
    let seconds = 0;
    intervals[card.dataset.id] = setInterval(() => {
        seconds++;
        const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        timer.textContent = `${hrs}:${mins}:${secs}`;
    }, 1000);
}

function stopTimer(card) {
    const timer = card.querySelector('.timer');
    clearInterval(intervals[card.dataset.id]);
    delete intervals[card.dataset.id];
    // Não reseta o tempo, apenas para a contagem
}

function updateCardId(card) {
    const idSpan = card.querySelector('.card-id');
    idSpan.textContent = card.dataset.id;
}

function showDashboard() {
    const dashboard = document.getElementById('dashboard');
    const tbody = dashboard.querySelector('tbody');
    tbody.innerHTML = '';
    completedTasks.forEach((task) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${task.id}</td>
            <td>${task.name}</td>
            <td>${task.time}</td>
        `;
        tbody.appendChild(row);
    });
    dashboard.style.display = 'block';
}

function saveCompletedTask(card) {
    const task = {
        id: card.dataset.id,
        name: card.querySelector('.task-name').textContent,
        time: card.querySelector('.timer').textContent, // Mantém o tempo final
    };

    completedTasks.push(task);
}
