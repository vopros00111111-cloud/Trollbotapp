// ============================================
// КОНФИГУРАЦИЯ
// ============================================
const API_URL = 'https://trollbot-mml4.onrender.com/api'; // ️ ЗАМЕНИ НА СВОЙ RENDER URL

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
// API ЗАПРОСЫ К PYTHON-БОТУ// ============================================

// Универсальная функция для запросов
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
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

// Загрузка статистики
async function loadStats() {
    try {
        const stats = await apiRequest(`/stats/${currentUser.id}`);
        
        document.getElementById('stat-wins').innerText = stats.wins || 0;
        document.getElementById('stat-losses').innerText = stats.losses || 0;        document.getElementById('stat-games').innerText = stats.totalGames || 0;
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Загрузка топа
async function loadTop() {
    try {
        const top = await apiRequest('/top?limit=10');
        renderTop(top);
    } catch (error) {
        console.error('Ошибка загрузки топа:', error);
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

// Загрузка достижений
async function loadAchievements() {
    try {
        const achievements = await apiRequest(`/achievements/${currentUser.id}`);
        renderAchievements(achievements);
    } catch (error) {
        console.error('Ошибка загрузки достижений:', error);
    }
}

// Отправка перевода
async function sendTransferAPI(to, amount, comment) {
    try {
        const data = {
            from_id: currentUser.id,
            to_username: to,
            amount: amount,
            comment: comment
        };
        
        const result = await apiRequest('/transfer', 'POST', data);
        return result;
    } catch (error) {
        console.error('Ошибка перевода:', error);        throw error;
    }
}

// Создание стола
async function createTableAPI(game, players, bet) {
    try {
        const data = {
            user_id: currentUser.id,
            game: game,
            players: players,
            bet: bet
        };
        
        const result = await apiRequest('/create-table', 'POST', data);
        return result;
    } catch (error) {
        console.error('Ошибка создания стола:', error);
        throw error;
    }
}

// ============================================
// ФУНКЦИИ ОТРИСОВКИ
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
            <span class="top-place">${medal}</span>
            <span class="top-name">@${player.username}</span>
            <span class="top-score">${player.balance.toLocaleString()}</span>
        `;
        container.appendChild(item);
    });
}

function renderCatalog(items) {
    const container = document.getElementById('catalog-list');    container.innerHTML = '';
    
    if (!items || items.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Каталог пуст</div>';
        return;
    }
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'catalog-item';
        card.innerHTML = `
            <div class="catalog-icon">${item.icon}</div>
            <div class="catalog-info">
                <h4>${item.name}</h4>
                <p>${item.description}</p>
                <div class="catalog-price">${item.price.toLocaleString()} 💰</div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderAchievements(achievements) {
    const container = document.getElementById('achievements-list');
    container.innerHTML = '';
    
    if (!achievements || achievements.length === 0) {
        container.innerHTML = '<div style="color:#888;">Нет достижений</div>';
        return;
    }
    
    achievements.forEach(achievement => {
        const div = document.createElement('div');
        div.className = 'achievement';
        div.innerText = achievement;
        container.appendChild(div);
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

async function confirmCreateTable() {
    const players = parseInt(document.getElementById('table-players').value);
    const bet = parseInt(document.getElementById('table-bet').value);
    
    if (!bet || bet < 100) {
        tg.showAlert('❌ Минимальная ставка: 100 монет');
        return;
    }
    
    if (bet > currentBalance) {
        tg.showAlert(' Недостаточно монет!');
        return;
    }
    
    try {        const result = await createTableAPI(currentGameType, players, bet);
        closeModal();
        tg.showAlert(`✅ Стол создан!\n\n🎮 Игра: ${currentGameType === 'poker' ? 'Покер' : 'Дурак'}\n👥 Игроков: ${players}\n💰 Ставка: ${bet} монет\n\nПриглашение отправлено в чат!`);
        
        // Обновляем баланс
        await loadBalance();
    } catch (error) {
        tg.showAlert('❌ Ошибка создания стола');
    }
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
        tg.showAlert('❌ Введите корректную сумму');
        return;
    }
    
    if (amount > currentBalance) {
        tg.showAlert('❌ Недостаточно монет!');
        return;
    }
    
    try {
        const result = await sendTransferAPI(to, amount, comment);
        tg.showAlert(`✅ Перевод выполнен!\n\n👤 Получатель: ${to}\n💰 Сумма: ${amount} монет`);
        
        // Очищаем форму
        document.getElementById('transfer-to').value = '';
        document.getElementById('transfer-amount').value = '';
        document.getElementById('transfer-comment').value = '';
        
        // Обновляем баланс
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
            loadCatalog(),
            loadAchievements()
        ]);
    }
    
    console.log('✅ Все данные загружены');
});

window.addEventListener('error', (e) => {
    console.error('Глобальная ошибка:', e.error);
});
