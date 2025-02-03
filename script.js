// Simulação de armazenamento local para usuários
let users = JSON.parse(localStorage.getItem('users')) || [];
let intervals = {};
let timers = {};
let taskId = localStorage.getItem('taskId') ? parseInt(localStorage.getItem('taskId')) : 1; // Recupera o taskId ou começa de 1
let completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];
let cards = JSON.parse(localStorage.getItem('cards')) || [];
const columns = document.querySelectorAll('.column');

// Alterna para a tela de cadastro
document.getElementById('signup-btn').addEventListener('click', () => {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('signup-container').style.display = 'block';
});

// Evento para processar cadastro
document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const newUsername = document.getElementById('new-username').value.trim();
    const newPassword = document.getElementById('new-password').value.trim();

    if (!newUsername || !newPassword) {
        alert('Preencha todos os campos para se cadastrar.');
        return;
    }

    const userExists = users.some((user) => user.username === newUsername);

    if (userExists) {
        alert('Usuário já existe. Escolha outro nome de usuário.');
    } else {
        users.push({ username: newUsername, password: newPassword });
        localStorage.setItem('users', JSON.stringify(users)); // Salva usuários no localStorage
        alert('Cadastro realizado com sucesso! Você pode fazer login agora.');
        document.getElementById('signup-container').style.display = 'none';
        document.getElementById('login-container').style.display = 'block';
    }

    document.getElementById('signup-form').reset();
});

// Processa login
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    const user = users.find((user) => user.username === username && user.password === password);

    if (user) {
        alert(`Bem-vindo, ${username}!`);
        localStorage.setItem('loggedInUser', username); // Salva o usuário logado no localStorage
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('kanban-container').style.display = 'block';
    } else {
        alert('Login ou senha inválidos. Tente novamente.');
    }

    document.getElementById('login-form').reset();
});

// Verificar se o usuário está logado ao carregar a página
const loggedInUser = localStorage.getItem('loggedInUser');
if (loggedInUser) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('kanban-container').style.display = 'block';
}

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
    
    // Verifica se o card tem um nome de tarefa e se o nome não é o texto padrão
    const taskName = draggingCard.querySelector('.task-name').textContent.trim();
    if (!taskName || taskName === "Digite o nome da tarefa...") {
        alert("Por favor, escreva o nome da tarefa antes de mover o card.");
        return; // Impede o movimento do card se a tarefa não for escrita
    }

    // Agora permite mover o card para a coluna de "Iniciado" sem exigir analista
    if (this.id === 'aprovacao' && !draggingCard.querySelector('.analyst-name')) {
        // Se o card não tem analista, apenas move sem impedir
    }

    this.insertBefore(draggingCard, this.querySelector('.add-card'));
    updateCardColor(draggingCard, this);

    // Inicia o contador apenas se a tarefa for solta na coluna "Iniciado"
    if (this.id === 'aprovacao' && !timers[draggingCard.dataset.id]) {
        trackCard(draggingCard);
    }

    if (this.id === 'recebido') {
        stopTimer(draggingCard);
        saveCompletedTask(draggingCard);
    }

    saveCardsToLocalStorage(); // Salva as alterações de cards no localStorage
}

function updateCardColor(card, column) {
    const columnId = column.id;
    card.classList.remove('nao-iniciado', 'iniciado', 'em-andamento', 'finalizado');

    if (columnId === 'solicitacao') {
        card.classList.add('nao-iniciado');
    } else if (columnId === 'aprovacao') {
        card.classList.add('iniciado');
        // Verificar se já existe um analista atribuído antes de chamar a função
        if (!card.querySelector('.analyst-name') && !card.querySelector('select')) {
            assignAnalyst(card);
        }
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
    card.dataset.id = `task-${taskId}`;
    card.innerHTML = 
        `<div class="card-header">
            <span>${card.dataset.id}</span>
            <button class="delete-btn">X</button>
        </div>
        <div class="task-name" contenteditable="true">Digite o nome da tarefa...</div>
        <div class="timer">00:00:00</div>`;
    column.insertBefore(card, column.querySelector('.add-card'));
    card.addEventListener('dragstart', dragStart);
    card.addEventListener('dragend', dragEnd);
    card.querySelector('.delete-btn').addEventListener('click', () => deleteCard(card));

    taskId++; // Incrementa o taskId após adicionar um novo card
    localStorage.setItem('taskId', taskId); // Salva o novo taskId no localStorage

    // Salva a tarefa recém-criada no localStorage
    saveCardsToLocalStorage();  // Chama a função que salva todas as tarefas no localStorage
    
    // Lógica para o comportamento do placeholder
    const taskName = card.querySelector('.task-name');

    taskName.addEventListener('focus', () => {
        if (taskName.textContent === "Digite o nome da tarefa...") {
            taskName.textContent = "";
        }
    });

    taskName.addEventListener('blur', () => {
        if (taskName.textContent === "") {
            taskName.textContent = "Digite o nome da tarefa...";
        }
    });
}


function deleteCard(card) {
    // Confirma a exclusão
    const confirmDelete = confirm("Você tem certeza que deseja excluir esta tarefa?");
    if (confirmDelete) {
        card.remove();
        // Remover tarefa da lista de completadas, caso já tenha sido completada
        const taskIndex = completedTasks.findIndex(task => task.id === card.dataset.id);
        if (taskIndex !== -1) {
            completedTasks.splice(taskIndex, 1);
        }
        // Remover também o timer se existirem
        stopTimer(card);
        saveCardsToLocalStorage(); // Salva as alterações dos cards no localStorage
        localStorage.setItem('completedTasks', JSON.stringify(completedTasks)); // Atualiza o localStorage
    }
}

function trackCard(card) {
    let timeElapsed = 0;
    const timerElement = card.querySelector('.timer');
    timers[card.dataset.id] = setInterval(() => {
        timeElapsed++;
        const hrs = String(Math.floor(timeElapsed / 3600)).padStart(2, '0');
        const mins = String(Math.floor((timeElapsed % 3600) / 60)).padStart(2, '0');
        const secs = String(timeElapsed % 60).padStart(2, '0');
        timerElement.textContent = `${hrs}:${mins}:${secs}`;

        if (timeElapsed === 30) {
            card.classList.add('warning');
        } else if (timeElapsed === 60) {
            card.classList.remove('warning');
            card.classList.add('alert');
        }
    }, 1000);
}

function stopTimer(card) {
    clearInterval(timers[card.dataset.id]);
    delete timers[card.dataset.id];
}

function saveCompletedTask(card) {
    const task = {
        id: card.dataset.id,
        name: card.querySelector('.task-name').textContent,
        time: card.querySelector('.timer').textContent,
        analyst: card.querySelector('.analyst-name') ? card.querySelector('.analyst-name').textContent : 'Não atribuído', // Obtém o nome do analista
    };
    completedTasks.push(task);
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks)); // Salva tarefas no localStorage
}

function assignAnalyst(card) {
    // Verificar se já existe um analista atribuído
    const existingAnalyst = card.querySelector('.analyst-name');
    if (existingAnalyst) {
        return; // Se já existe um analista atribuído, não faz nada
    }

    // Se não existe, cria o botão para selecionar o analista
    const analystOptions = ['Pabricio', 'Bruno', 'RUY', 'Manoel', 'Ronaldo' , 'Caique', 'Alan', 'Andréa'];
    const select = document.createElement('select');
    select.innerHTML = analystOptions.map(name => `<option value="${name}">${name}</option>`).join('');

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirmar';
    confirmButton.classList.add('confirm');
    confirmButton.addEventListener('click', () => {
        const selectedAnalyst = select.value;
        alert(`Analista ${selectedAnalyst} atribuído à tarefa ${card.dataset.id}`);
        const analystSpan = document.createElement('span');
        analystSpan.classList.add('analyst-name');
        analystSpan.textContent = selectedAnalyst;
        card.querySelector('.card-header').append( ` - Analista: `, analystSpan);
        select.remove();
        confirmButton.remove();
        saveCardsToLocalStorage(); // Salva os cards no localStorage após atribuição do analista
    });

    // Adiciona o botão de selecionar analista ao card
    const selectButton = document.createElement('button');
    selectButton.textContent = 'Selecionar Analista';
    selectButton.classList.add('select-analyst');
    selectButton.addEventListener('click', () => {
        card.appendChild(select);
        card.appendChild(confirmButton);
        selectButton.remove(); // Remove o botão após clicar
    });

    card.querySelector('.card-header').appendChild(selectButton);
}

// Função para salvar os cartões no localStorage
function saveCardsToLocalStorage() {
    const allCards = document.querySelectorAll('.card');
    cards = Array.from(allCards).map(card => ({
        id: card.dataset.id,
        name: card.querySelector('.task-name').textContent,
        time: card.querySelector('.timer').textContent,
        column: card.closest('.column').id,
        analyst: card.querySelector('.analyst-name') ? card.querySelector('.analyst-name').textContent : null,
    }));
    localStorage.setItem('cards', JSON.stringify(cards));
}

// Função para restaurar os cards do localStorage
function restoreCardsFromLocalStorage() {
    cards.forEach(cardData => {
        const column = document.getElementById(cardData.column);
        if (column) {
            const card = document.createElement('div');
            card.className = 'card';
            card.setAttribute('draggable', 'true');
            card.dataset.id = cardData.id;
            card.innerHTML = 
                `<div class="card-header">
                    <span>${cardData.id}</span>
                    <button class="delete-btn">X</button>
                </div>
                <div class="task-name" contenteditable="true">${cardData.name}</div>
                <div class="timer">${cardData.time}</div>`;
            column.insertBefore(card, column.querySelector('.add-card'));
            card.addEventListener('dragstart', dragStart);
            card.addEventListener('dragend', dragEnd);
            card.querySelector('.delete-btn').addEventListener('click', () => deleteCard(card));

            // Restaura o analista, se existir
            if (cardData.analyst) {
                const analystSpan = document.createElement('span');
                analystSpan.classList.add('analyst-name');
                analystSpan.textContent = cardData.analyst;
                card.querySelector('.card-header').append( ` - Analista: `, analystSpan);
            }

            // Restaura o timer, se necessário
            if (cardData.column === 'aprovacao' && !timers[cardData.id]) {
                trackCard(card);
            }

            // Lógica para o comportamento do placeholder
            const taskName = card.querySelector('.task-name');

            taskName.addEventListener('focus', () => {
                if (taskName.textContent === "Digite o nome da tarefa...") {
                    taskName.textContent = "";
                }
            });

            taskName.addEventListener('blur', () => {
                if (taskName.textContent === "") {
                    taskName.textContent = "Digite o nome da tarefa...";
                }
            });
        }
    });
}


// Restaura os cards ao carregar a página
window.addEventListener('load', () => {
    restoreCardsFromLocalStorage(); // Essa função deve ser chamada aqui para restaurar os cards ao carregar a página
});


// Adicionar evento para abrir o dashboard
document.getElementById('dashboard-btn').addEventListener('click', () => {
    updateDashboard();
});

function updateDashboard() {
    const dashboard = document.getElementById('dashboard');
    const tbody = dashboard.querySelector('tbody');
    const totalTimeElement = document.getElementById('total-time');
    tbody.innerHTML = '';
    let totalTimeInSeconds = 0;

    completedTasks.forEach((task) => {
        const row = document.createElement('tr');
        row.innerHTML = 
        row.innerHTML = `
        <td>${task.id}</td>
        <td>${task.name}</td>
        <td>${task.time}</td>
        <td>${task.analyst}</td>
        <td>
            <button class="delete-task-btn" style="background: none; border: none; cursor: pointer;">
                <i class="fas fa-trash-alt" style="color: red; font-size: 18px;"></i>
            </button>
        </td>
    `;
   
    tbody.appendChild(row);
    

        // Calculando o total de tempo
        const timeParts = task.time.split(':').map(part => parseInt(part));
        const totalSecondsForTask = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
        totalTimeInSeconds += totalSecondsForTask;

        // Ação de excluir tarefa ao clicar no botão
        row.querySelector('.delete-task-btn').addEventListener('click', () => {
            deleteTaskFromReport(task.id);
        });
    });

    // Exibe o total de tempo
    const hrs = String(Math.floor(totalTimeInSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalTimeInSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(totalTimeInSeconds % 60).padStart(2, '0');
    totalTimeElement.textContent = `Total de Tempo: ${hrs}:${mins}:${secs}`;

    dashboard.style.display = 'block';
}

// Fechar o dashboard
document.getElementById('close-dashboard').addEventListener('click', () => {
    document.getElementById('dashboard').style.display = 'none';
});

// Geração do PDF
document.getElementById('generate-pdf').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Relatório de Tarefas Concluídas', 14, 10);

    const table = document.querySelector('#dashboard-table tbody');
    const rows = Array.from(table.rows);
    const data = rows.map(row => {
        const cells = Array.from(row.cells);
        return cells.map(cell => cell.textContent);
    });

    const head = [['ID', 'Tarefa', 'Tempo', 'Analista']];
    doc.autoTable({
        head: head,
        body: data,
        startY: 20,
        theme: 'grid',
    });

    doc.save('relatorio_tarefas_concluidas.pdf');
});

// Geração do Excel
document.getElementById('generate-excel').addEventListener('click', () => {
    const table = document.querySelector('#dashboard-table');
    const wb = XLSX.utils.table_to_book(table, { sheet: "Tarefas Concluídas" });
    XLSX.writeFile(wb, 'relatorio_tarefas_concluídas.xlsx');
});

// Função para atualizar a tabela ao excluir tarefa
function deleteTaskFromReport(taskId) {
    const taskIndex = completedTasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        completedTasks.splice(taskIndex, 1); // Remove a tarefa do array de tarefas completadas
        localStorage.setItem('completedTasks', JSON.stringify(completedTasks)); // Atualiza o localStorage
        updateDashboard(); // Atualiza o dashboard com as tarefas restantes
    }
}
// Alternar o modo escuro
// Seleciona o botão de alternância do modo escuro
const darkModeToggle = document.getElementById('dark-mode-toggle');
const icon = darkModeToggle.querySelector('i');

// Função para alternar o modo escuro
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    
    const elementsToToggle = [
        'login-container',
        'signup-container',
        'kanban-container',
        'dashboard',
        'footer'
    ];

    // Adiciona ou remove a classe dark-mode nos elementos necessários
    elementsToToggle.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.toggle('dark-mode');
        }
    });

    document.querySelectorAll('input[type="text"], input[type="password"], button, .card, .column')
        .forEach(element => element.classList.toggle('dark-mode'));

    // Verifica se o modo escuro está ativado e altera o ícone corretamente
    const isDarkMode = document.body.classList.contains('dark-mode');
    icon.classList.toggle('fa-moon', !isDarkMode);
    icon.classList.toggle('fa-sun', isDarkMode);

    // Salva o estado no localStorage
    localStorage.setItem('darkMode', isDarkMode);
}

// Evento de clique para alternar o modo escuro
darkModeToggle.addEventListener('click', toggleDarkMode);

// Verifica o estado salvo no localStorage ao carregar a página
window.addEventListener('load', () => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';

    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        
        ['login-container', 'signup-container', 'kanban-container', 'dashboard', 'footer']
            .forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.classList.add('dark-mode');
                }
            });

        document.querySelectorAll('input[type="text"], input[type="password"], button, .card, .column')
            .forEach(element => element.classList.add('dark-mode'));

        // Garante que o ícone seja atualizado corretamente
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
});

// Função para habilitar o arrasto nos cards em dispositivos móveis
function enableCardDrag() {
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        // Cria uma instância do Hammer para cada card
        const hammer = new Hammer(card);

        // Habilita o gesto de arrastar (pan)
        hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });

        // Evento quando o arrasto começa
        hammer.on('panstart', function (event) {
            card.style.transition = 'none'; // Remove a transição durante o arrasto
            card.classList.add('dragging'); // Adiciona a classe dragging para estilização
        });

        // Evento durante o arrasto
        hammer.on('panmove', function (event) {
            const deltaX = event.deltaX; // Movimento horizontal
            const deltaY = event.deltaY; // Movimento vertical

            // Aplica o movimento ao card
            card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        });

        // Evento quando o arrasto termina
        hammer.on('panend', function (event) {
            card.style.transition = 'transform 0.3s ease'; // Restaura a transição
            card.style.transform = 'translate(0, 0)'; // Retorna o card à posição original
            card.classList.remove('dragging'); // Remove a classe dragging

            // Verifica se o card foi solto em uma coluna válida
            const columns = document.querySelectorAll('.column');
            columns.forEach(column => {
                column.classList.remove('hovered'); // Remove a classe hovered de todas as colunas
            });

            // Verifica se o card foi solto em uma coluna
            const dropTarget = document.elementFromPoint(event.center.x, event.center.y);
            const targetColumn = dropTarget.closest('.column');

            if (targetColumn) {
                // Move o card para a coluna de destino
                targetColumn.insertBefore(card, targetColumn.querySelector('.add-card'));
                updateCardColor(card, targetColumn); // Atualiza a cor do card conforme a coluna
                saveCardsToLocalStorage(); // Salva as alterações no localStorage
            }
        });
    });
}

// Habilita o arrasto dos cards quando a página carregar
window.addEventListener('load', enableCardDrag);