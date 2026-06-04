// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;

tg.ready();
tg.expand();

// Получаем данные пользователя
const user = tg.initDataUnsafe.user;
let currentBalance = 0;

if (user) {
    const userName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
    document.getElementById('header-nickname').innerText = userName;
    document.getElementById('profile-nickname').innerText = userName;
    
    // Здесь позже будет загрузка аватарки
    // document.getElementById('header-avatar').src = user.photo_url;
    // document.getElementById('profile-avatar').src = user.photo_url;
}

// Навигация
const navButtons = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));
        
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(`tab-${tabId}`).classList.add('active');
    });
});

// Функция для переключения вкладок из кнопок на главной
function switchTab(tabName) {
    navButtons.forEach(b => {
        b.classList.remove('active');
        if (b.getAttribute('data-tab') === tabName) {
            b.classList.add('active');
        }
    });
    
    tabContents.forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// Создание стола (Покер/Дурак)
let currentGameType = '';
function createPokerTable() {
    currentGameType = 'poker';
    document.getElementById('modal-create-table').classList.add('active');
}

function createDurakTable() {
    currentGameType = 'durak';
    document.getElementById('modal-create-table').classList.add('active');
}

function closeModal() {
    document.getElementById('modal-create-table').classList.remove('active');
}

function confirmCreateTable() {
    const players = document.getElementById('table-players').value;
    const bet = document.getElementById('table-bet').value;
    
    if (!bet || bet < 100) {
        alert('Минимальная ставка: 100 монет');
        return;
    }
    
    // Отправляем данные боту
    const data = {
        action: 'create_table',
        game: currentGameType,
        players: parseInt(players),
        bet: parseInt(bet)
    };
    
    tg.sendData(JSON.stringify(data));
    closeModal();
    
    // Показываем уведомление
    tg.showAlert(`Стол создан!\nИгра: ${currentGameType === 'poker' ? 'Покер' : 'Дурак'}\nИгроков: ${players}\nСтавка: ${bet} 💰\n\nПриглашение отправлено в чат!`);
}

// Отправка перевода
function sendTransfer() {
    const to = document.getElementById('transfer-to').value;
    const amount = document.getElementById('transfer-amount').value;
    const comment = document.getElementById('transfer-comment').value;
    
    if (!to || !amount) {
        alert('Заполните все обязательные поля');
        return;
    }
        const data = {
        action: 'transfer',
        to: to,
        amount: parseInt(amount),
        comment: comment
    };
    
    tg.sendData(JSON.stringify(data));
    alert('Перевод отправлен!');
    
    // Очистка формы
    document.getElementById('transfer-to').value = '';
    document.getElementById('transfer-amount').value = '';
    document.getElementById('transfer-comment').value = '';
}

// Загрузка баланса (заглушка - потом будет запрос к API)
function loadBalance() {
    // Здесь будет fetch запрос к твоему Python-серверу
    // Пока используем тестовое значение
    currentBalance = 5000;
    document.getElementById('header-balance').innerText = `${currentBalance} 💰`;
    document.getElementById('profile-balance').innerText = `${currentBalance} 💰`;
}

// Загрузка статистики (заглушка)
function loadStats() {
    document.getElementById('stat-wins').innerText = '15';
    document.getElementById('stat-losses').innerText = '8';
    document.getElementById('stat-games').innerText = '23';
}

// Инициализация при загрузке
window.addEventListener('load', () => {
    loadBalance();
    loadStats();
});
