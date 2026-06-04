// ============================================
// КОНФИГУРАЦИЯ
// ============================================
const API_URL = 'https://trollbot-mml4.onrender.com/api';

// ============================================
// ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP
// ============================================
const tg = window.Telegram.WebApp;

tg.ready();
tg.expand();
tg.setHeaderColor('#16213e');
tg.setBackgroundColor('#1a1a2e');

let currentUser = null;
let currentBalance = 0;
let currentGameType = '';

// ============================================
// ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
// ============================================
function initUser() {
    const user = tg.initDataUnsafe.user;
    
    if (user) {
        currentUser = {
            id: user.id,
            username: user.username || `user${user.id}`,
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            avatar: user.photo_url || ''
        };
        
        const fullName = `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`;
        document.getElementById('header-nickname').innerText = fullName;
        document.getElementById('profile-nickname').innerText = fullName;
        
        if (user.photo_url) {
            document.getElementById('header-avatar').src = user.photo_url;
            document.getElementById('profile-avatar').src = user.photo_url;
        }
    } else {
        document.getElementById('header-nickname').innerText = 'Гость';
        document.getElementById('profile-nickname').innerText = 'Гость';
    }
}

// ============================================
// API ЗАПРОСЫ// ============================================
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${API_URL}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

// Загрузка баланса
async function loadBalance() {
    try {
        const data = await apiRequest(`/balance/${currentUser.id}`);
        currentBalance = data.balance;
        
        document.getElementById('header-balance').innerText = `${currentBalance} 💰`;
        document.getElementById('profile-balance').innerText = `${currentBalance} 💰`;
    } catch (error) {
        console.error('Ошибка загрузки баланса:', error);
        document.getElementById('header-balance').innerText = 'Ошибка 💰';
    }
}

// Загрузка статистики (место в топе, игры, выиграно)
async function loadStats() {
    try {
        const stats = await apiRequest(`/stats/${currentUser.id}`);
        
        document.getElementById('stat-rank').innerText = `#${stats.rank}`;
        document.getElementById('stat-games').innerText = stats.totalGames;
        document.getElementById('stat-won').innerText = `${stats.totalWon.toLocaleString()} `;
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }}

// Загрузка топа
async function loadTop() {
    try {
        const top = await apiRequest('/top?limit=10');
        renderTop(top);
    } catch (error) {
        console.error('Ошибка загрузки топа:', error);
    }
}

// Загрузка игр
async function loadGames() {
    try {
        const games = await apiRequest('/games');
        renderGames(games);
    } catch (error) {
        console.error('Ошибка загрузки игр:', error);
    }
}

// Загрузка каталога
async function loadCatalog() {
    try {
        const items = await apiRequest('/catalog');
        renderCatalog(items);
    } catch (error) {
        console.error('Ошибка загрузки каталога:', error);
    }
}

// ============================================
// ОТРИСОВКА
// ============================================
function renderTop(topList) {
    const container = document.getElementById('top-list');
    container.innerHTML = '';
    
    if (!topList || topList.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Топ пока пуст</div>';
        return;
    }
    
    topList.forEach((player, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const item = document.createElement('div');
        item.className = 'top-item';
        item.innerHTML = `
            <span class="top-place">${medal}</span>            <span class="top-name">@${player.username}</span>
            <span class="top-score">${player.balance.toLocaleString()}</span>
        `;
        container.appendChild(item);
    });
}

function renderGames(games) {
    const container = document.getElementById('games-list');
    container.innerHTML = '';
    
    if (!games || games.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Нет доступных игр</div>';
        return;
    }
    
    games.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        
        let buttons = '';
        if (game.id === 'poker' || game.id === 'durak') {
            buttons = `
                <button class="game-action-btn" onclick="createTable('${game.id}')">Создать стол</button>
                <button class="game-secondary-btn">Быстрая игра</button>
            `;
        } else {
            buttons = `<button class="game-action-btn">Играть</button>`;
        }
        
        card.innerHTML = `
            <div class="game-icon">${game.icon}</div>
            <h3>${game.name}</h3>
            <p>${game.description}</p>
            ${buttons}
        `;
        container.appendChild(card);
    });
}

function renderCatalog(items) {
    const container = document.getElementById('catalog-list');
    container.innerHTML = '';
    
    if (!items || items.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Каталог пуст</div>';
        return;
    }
    
    items.forEach(item => {        const card = document.createElement('div');
        card.className = 'catalog-item';
        card.innerHTML = `
            <div class="catalog-icon">📦</div>
            <div class="catalog-info">
                <h4>${item.name}</h4>
                <p>${item.description}</p>
                <div class="catalog-price">${item.price.toLocaleString()} 💰</div>
            </div>
        `;
        container.appendChild(card);
    });
}

// ============================================
// НАВИГАЦИЯ
// ============================================
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

// ============================================
// МОДАЛЬНОЕ ОКНО
// ============================================
function createTable(gameType) {
    currentGameType = gameType;
    document.getElementById('modal-create-table').classList.add('active');
}
function closeModal() {
    document.getElementById('modal-create-table').classList.remove('active');
}

async function confirmCreateTable() {
    const players = parseInt(document.getElementById('table-players').value);
    const bet = parseInt(document.getElementById('table-bet').value);
    
    if (!bet || bet < 100) {
        tg.showAlert('❌ Минимальная ставка: 100 монет');
        return;
    }
    
    if (bet > currentBalance) {
        tg.showAlert('❌ Недостаточно монет!');
        return;
    }
    
    const data = {
        action: 'create_table',
        game: currentGameType,
        players: players,
        bet: bet,
        user_id: currentUser.id
    };
    
    tg.sendData(JSON.stringify(data));
    closeModal();
    
    const gameName = currentGameType === 'poker' ? 'Покер' : 'Дурак';
    tg.showAlert(`✅ Стол создан!\n\n🎮 Игра: ${gameName}\n👥 Игроков: ${players}\n💰 Ставка: ${bet} монет\n\nПриглашение отправлено в чат!`);
}

// ============================================
// ПЕРЕВОДЫ
// ============================================
async function sendTransfer() {
    const to = document.getElementById('transfer-to').value.trim();
    const amount = parseInt(document.getElementById('transfer-amount').value);
    const comment = document.getElementById('transfer-comment').value.trim();
    
    if (!to) {
        tg.showAlert('❌ Введите получателя (@username)');
        return;
    }
    
    if (!amount || amount <= 0) {
        tg.showAlert(' Введите корректную сумму');
        return;    }
    
    if (amount > currentBalance) {
        tg.showAlert('❌ Недостаточно монет!');
        return;
    }
    
    const data = {
        from_id: currentUser.id,
        to_username: to,
        amount: amount,
        comment: comment
    };
    
    try {
        await apiRequest('/transfer', 'POST', data);
        tg.showAlert(`✅ Перевод выполнен!\n\n👤 Получатель: ${to}\n💰 Сумма: ${amount} монет`);
        
        document.getElementById('transfer-to').value = '';
        document.getElementById('transfer-amount').value = '';
        document.getElementById('transfer-comment').value = '';
        
        await loadBalance();
    } catch (error) {
        tg.showAlert('❌ Ошибка перевода');
    }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
window.addEventListener('load', async () => {
    console.log('🚀 Приложение загружено');
    
    initUser();
    
    if (currentUser) {
        await Promise.all([
            loadBalance(),
            loadStats(),
            loadTop(),
            loadGames(),
            loadCatalog()
        ]);
    }
    
    console.log('✅ Все данные загружены');
});
