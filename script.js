const API_URL = 'https://trollbot-mml4.onrender.com/api';
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.setHeaderColor('#16213e');
tg.setBackgroundColor('#1a1a2e');

let currentUser = null;
let currentBalance = 0;

function initUser() {
    // Безопасное получение данных пользователя
    const initData = tg.initDataUnsafe;
    const user = initData ? initData.user : null;

    if (user) {
        currentUser = {
            id: user.id,
            username: user.username || 'user' + user.id,
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            avatar: user.photo_url || ''
        };
        const fullName = user.first_name || 'User' + user.id;
        document.getElementById('header-nickname').innerText = fullName;
        document.getElementById('profile-nickname').innerText = fullName;
        if (user.photo_url) {
            document.getElementById('header-avatar').src = user.photo_url;
            document.getElementById('profile-avatar').src = user.photo_url;
            document.querySelector('.avatar-wrapper').classList.add('has-photo');
            document.querySelector('.profile-avatar-wrapper').classList.add('has-photo');
        }
    } else {
        // ЗАПАСНОЙ ВАРИАНТ для тестирования в обычном браузере
        console.warn("Данные Telegram не найдены. Используется тестовый профиль.");
        currentUser = {
            id: 123456789, // Тестовый ID
            username: 'test_user',
            firstName: 'Тест',
            lastName: '',
            avatar: ''
        };
        document.getElementById('header-nickname').innerText = 'Тест (нет данных TG)';
        document.getElementById('profile-nickname').innerText = 'Тест (нет данных TG)';
    }
}

async function apiRequest(endpoint, method, data) {
    method = method || 'GET';
    const options = { method: method, headers: { 'Content-Type': 'application/json' } };    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    const response = await fetch(API_URL + endpoint, options);
    if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
    }
    return await response.json();
}

async function loadBalance() {
    try {
        const data = await apiRequest('/balance/' + currentUser.id);
        currentBalance = data.balance;
        document.getElementById('header-balance').innerText = currentBalance + ' 💰';
        document.getElementById('profile-balance').innerText = currentBalance + ' 💰';
    } catch (error) {
        console.error('Ошибка баланса:', error);
        // Убираем "Загрузку..." при ошибке
        document.getElementById('header-balance').innerText = 'Ошибка';
        document.getElementById('profile-balance').innerText = 'Ошибка';
    }
}

async function loadStats() {
    try {
        const stats = await apiRequest('/stats/' + currentUser.id);
        document.getElementById('stat-rank').innerText = '#' + (stats.rank || 1);
        document.getElementById('stat-games').innerText = stats.totalGames || 0;
        document.getElementById('stat-won').innerText = (stats.totalWon || 0).toLocaleString() + ' 💰';
    } catch (error) {
        console.error('Ошибка статистики:', error);
        document.getElementById('stat-rank').innerText = '#-';
        document.getElementById('stat-games').innerText = '0';
        document.getElementById('stat-won').innerText = '0 💰';
    }
}

async function loadTop() {
    try {
        const top = await apiRequest('/top?limit=10');
        renderTop(top);
    } catch (error) {
        console.error('Ошибка топа:', error);
        document.getElementById('top-list').innerHTML = '<div style="text-align:center;padding:20px;color:#888;">Ошибка загрузки</div>';
    }
}

async function loadGames() {
    try {        const games = await apiRequest('/games');
        renderGames(games);
    } catch (error) {
        console.error('Ошибка игр:', error);
        document.getElementById('games-list').innerHTML = '<div style="text-align:center;padding:20px;color:#888;">Ошибка загрузки</div>';
    }
}

async function loadCatalog() {
    try {
        const items = await apiRequest('/catalog');
        renderCatalog(items);
    } catch (error) {
        console.error('Ошибка каталога:', error);
        document.getElementById('catalog-list').innerHTML = '<div style="text-align:center;padding:20px;color:#888;">Ошибка загрузки</div>';
    }
}

function renderTop(topList) {
    const container = document.getElementById('top-list');
    container.innerHTML = '';
    if (!topList || topList.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#888;">Топ пока пуст</div>';
        return;
    }
    for (let i = 0; i < topList.length; i++) {
        const player = topList[i];
        let medal;
        if (i === 0) medal = '🥇';
        else if (i === 1) medal = '🥈';
        else if (i === 2) medal = '🥉';
        else medal = (i + 1) + '.';
        
        const item = document.createElement('div');
        item.className = 'top-item';
        item.innerHTML = `<span class="top-place">${medal}</span><span class="top-name">@${player.username}</span><span class="top-score">${player.balance.toLocaleString()}</span>`;
        container.appendChild(item);
    }
}

function renderGames(games) {
    const container = document.getElementById('games-list');
    container.innerHTML = '';
    if (!games || games.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#888;">Нет доступных игр</div>';
        return;
    }
    for (let i = 0; i < games.length; i++) {
        const game = games[i];
        const card = document.createElement('div');        card.className = 'game-card';
        let btnHtml = '';
        if (game.id === 'poker' || game.id === 'durak') {
            btnHtml = `<button class="game-action-btn" onclick="openGame('${game.id}')">Создать стол</button>`;
        } else if (game.id === 'blackjack' || game.id === 'slots' || game.id === 'roulette') {
            btnHtml = `<button class="game-action-btn" onclick="openGame('${game.id}')">Играть</button>`;
        } else {
            btnHtml = `<button class="game-action-btn">Играть</button>`;
        }
        card.innerHTML = `<div class="game-icon">${game.icon}</div><h3>${game.name}</h3><p>${game.description}</p>${btnHtml}`;
        container.appendChild(card);
    }
}

function renderCatalog(items) {
    const container = document.getElementById('catalog-list');
    container.innerHTML = '';
    if (!items || items.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#888;">Каталог пуст</div>';
        return;
    }
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const card = document.createElement('div');
        card.className = 'catalog-item';
        card.innerHTML = `<div class="catalog-icon">📦</div><div class="catalog-info"><h4>${item.name}</h4><p>${item.description}</p><div class="catalog-price">${item.price.toLocaleString()} 💰</div></div>`;
        container.appendChild(card);
    }
}

document.querySelectorAll('.nav-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
        document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById('tab-' + tabId).classList.add('active');
    });
});

function switchTab(tabName) {
    document.querySelectorAll('.nav-btn').forEach(function(b) {
        b.classList.remove('active');
        if (b.getAttribute('data-tab') === tabName) {
            b.classList.add('active');
        }
    });
    document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
    document.getElementById('tab-' + tabName).classList.add('active');
}
function openGame(gameName) {
    document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
    document.getElementById('game-' + gameName).classList.add('active');
    document.querySelector('.bottom-nav').classList.add('hidden');
}

function closeGame(gameName) {
    document.getElementById('game-' + gameName).classList.remove('active');
    document.getElementById('tab-games').classList.add('active');
    document.querySelector('.bottom-nav').classList.remove('hidden');
}

async function sendTransfer() {
    const to = document.getElementById('transfer-to').value.trim();
    const amount = parseInt(document.getElementById('transfer-amount').value);
    const comment = document.getElementById('transfer-comment').value.trim();
    if (!to) { tg.showAlert('❌ Введите получателя'); return; }
    if (!amount || amount <= 0) { tg.showAlert('❌ Введите сумму'); return; }
    if (amount > currentBalance) { tg.showAlert('❌ Недостаточно монет'); return; }
    try {
        await apiRequest('/transfer', 'POST', { from_id: currentUser.id, to_username: to, amount: amount, comment: comment });
        tg.showAlert('✅ Перевод выполнен!');
        document.getElementById('transfer-to').value = '';
        document.getElementById('transfer-amount').value = '';
        document.getElementById('transfer-comment').value = '';
        await loadBalance();
    } catch (error) {
        tg.showAlert('❌ Ошибка перевода: ' + error.message);
    }
}

// ... (код игр Blackjack, Slots, Roulette, Poker оставляем без изменений, он рабочий) ...
// Для экономии места я не дублирую функции игр, оставь свои функции createDeck, calculateScore, startBlackjack, hit, stand, spinSlots, placeRouletteBet, createPokerTable, joinPokerTable как они были.

window.addEventListener('load', async function() {
    console.log('🚀 Приложение загружено');
    initUser();
    
    // Теперь этот блок выполнится всегда, даже если это тестовый профиль
    if (currentUser) {
        console.log('👤 Загрузка данных для пользователя:', currentUser.id);
        try {
            await Promise.all([loadBalance(), loadStats(), loadTop(), loadGames(), loadCatalog()]);
            console.log('✅ Все данные успешно загружены');
        } catch (e) {
            console.error('❌ Критическая ошибка при загрузке:', e);
        }
    } else {
        console.error('❌ Не удалось инициализировать пользователя');    }
});
