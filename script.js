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
        document.getElementById('profile-balance').innerText = `${currentBalance} `;
    } catch (error) {
        console.error('Ошибка загрузки баланса:', error);
        document.getElementById('header-balance').innerText = 'Ошибка 💰';
    }
}

// Загрузка статистики
async function loadStats() {
    try {
        const stats = await apiRequest(`/stats/${currentUser.id}`);
        
        document.getElementById('stat-rank').innerText = `#${stats.rank}`;
        document.getElementById('stat-games').innerText = stats.totalGames;
        document.getElementById('stat-won').innerText = `${stats.totalWon.toLocaleString()} 💰`;
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
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '' : `${index + 1}.`;
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
            buttons = `<button class="game-action-btn" onclick="createTable('${game.id}')">Создать стол</button>`;
        } else if (game.id === 'blackjack' || game.id === 'slots' || game.id === 'roulette') {
            buttons = `<button class="game-action-btn" onclick="openGame('${game.id}')">Играть</button>`;
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
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'catalog-item';
        card.innerHTML = `
            <div class="catalog-icon">📦</div>
            <div class="catalog-info">
                <h4>${item.name}</h4>
                <p>${item.description}</p>
                <div class="catalog-price">${item.price.toLocaleString()} </div>
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
        tg.showAlert(' Недостаточно монет!');
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
        tg.showAlert(' Введите получателя (@username)');
        return;
    }
    
    if (!amount || amount <= 0) {
        tg.showAlert(' Введите корректную сумму');
        return;
    }    
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
// ИГРЫ В WEB APP
// ============================================

// Открыть игру
function openGame(gameName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`game-${gameName}`).classList.add('active');
}

// Закрыть игру
function closeGame(gameName) {
    document.getElementById(`game-${gameName}`).classList.remove('active');
    document.getElementById('tab-games').classList.add('active');
}

// ============================================
// БЛЭКДЖЕК
// ============================================
let bjGame = {
    deck: [],
    playerHand: [],
    dealerHand: [],    bet: 0,
    gameOver: false
};

function createDeck() {
    const suits = ['♠️', '♥️', '♦️', '♣️'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    
    for (let suit of suits) {
        for (let rank of ranks) {
            let value = parseInt(rank);
            if (['J', 'Q', 'K'].includes(rank)) value = 10;
            if (rank === 'A') value = 11;
            deck.push({ rank, suit, value });
        }
    }
    
    return deck.sort(() => Math.random() - 0.5);
}

function calculateScore(hand) {
    let score = hand.reduce((sum, card) => sum + card.value, 0);
    let aces = hand.filter(card => card.rank === 'A').length;
    
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    
    return score;
}

function renderCard(card, hidden = false) {
    if (hidden) return '<div class="card hidden">❓</div>';
    const isRed = card.suit === '♥️' || card.suit === '♦️';
    return `<div class="card ${isRed ? 'red' : 'black'}">${card.rank}${card.suit}</div>`;
}

function updateBlackjackUI() {
    const playerCards = document.getElementById('player-cards');
    const dealerCards = document.getElementById('dealer-cards');
    const playerScore = document.getElementById('player-score');
    const dealerScore = document.getElementById('dealer-score');
    
    playerCards.innerHTML = bjGame.playerHand.map(c => renderCard(c)).join('');
    dealerCards.innerHTML = bjGame.dealerHand.map((c, i) => 
        renderCard(c, i === 1 && bjGame.dealerHand.length === 2 && !bjGame.gameOver)
    ).join('');
        playerScore.innerText = calculateScore(bjGame.playerHand);
    dealerScore.innerText = bjGame.dealerHand.length === 2 && !bjGame.gameOver ? '?' : calculateScore(bjGame.dealerHand);
}

async function startBlackjack() {
    const bet = parseInt(document.getElementById('bj-bet').value);
    
    if (!bet || bet < 10) {
        tg.showAlert('❌ Минимальная ставка: 10 монет');
        return;
    }
    
    if (bet > currentBalance) {
        tg.showAlert('❌ Недостаточно монет!');
        return;
    }
    
    // Списываем ставку через API
    try {
        await apiRequest('/transfer', 'POST', {
            from_id: currentUser.id,
            to_username: 'casino',
            amount: bet,
            comment: 'blackjack_bet'
        });
    } catch (error) {
        // Если нет пользователя casino, просто продолжаем
    }
    
    bjGame.bet = bet;
    bjGame.deck = createDeck();
    bjGame.playerHand = [bjGame.deck.pop(), bjGame.deck.pop()];
    bjGame.dealerHand = [bjGame.deck.pop(), bjGame.deck.pop()];
    bjGame.gameOver = false;
    
    document.getElementById('bet-controls').style.display = 'none';
    document.getElementById('play-controls').style.display = 'flex';
    document.getElementById('bj-message').innerText = '';
    document.getElementById('bj-message').className = 'game-message';
    
    updateBlackjackUI();
    
    // Проверка на блэкджек
    if (calculateScore(bjGame.playerHand) === 21) {
        setTimeout(() => stand(), 500);
    }
}

async function hit() {
    if (bjGame.gameOver) return;    
    bjGame.playerHand.push(bjGame.deck.pop());
    updateBlackjackUI();
    
    const score = calculateScore(bjGame.playerHand);
    
    if (score > 21) {
        bjGame.gameOver = true;
        endBlackjack('lose', 'Перебор! Вы проиграли.');
    }
}

async function stand() {
    if (bjGame.gameOver) return;
    
    bjGame.gameOver = true;
    
    // Ход дилера
    while (calculateScore(bjGame.dealerHand) < 17) {
        bjGame.dealerHand.push(bjGame.deck.pop());
        await new Promise(resolve => setTimeout(resolve, 500));
        updateBlackjackUI();
    }
    
    const playerScore = calculateScore(bjGame.playerHand);
    const dealerScore = calculateScore(bjGame.dealerHand);
    
    if (dealerScore > 21 || playerScore > dealerScore) {
        const winAmount = bjGame.bet * 2;
        try {
            await apiRequest('/transfer', 'POST', {
                from_id: 0,
                to_username: currentUser.username,
                amount: winAmount,
                comment: 'blackjack_win'
            });
        } catch (error) {}
        endBlackjack('win', `🎉 Вы выиграли ${winAmount} монет!`);
    } else if (playerScore === dealerScore) {
        try {
            await apiRequest('/transfer', 'POST', {
                from_id: 0,
                to_username: currentUser.username,
                amount: bjGame.bet,
                comment: 'blackjack_draw'
            });
        } catch (error) {}
        endBlackjack('draw', '🤝 Ничья! Ставка возвращена.');
    } else {
        endBlackjack('lose', ' Дилер выиграл!');    }
}

function endBlackjack(result, message) {
    document.getElementById('play-controls').style.display = 'none';
    document.getElementById('bet-controls').style.display = 'block';
    
    const msgEl = document.getElementById('bj-message');
    msgEl.innerText = message;
    msgEl.className = `game-message ${result}`;
    
    updateBlackjackUI();
    loadBalance();
}

// ============================================
// СЛОТЫ
// ============================================
const slotSymbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🔔'];

async function spinSlots() {
    const bet = parseInt(document.getElementById('slots-bet').value);
    
    if (!bet || bet < 10) {
        tg.showAlert('❌ Минимальная ставка: 10 монет');
        return;
    }
    
    if (bet > currentBalance) {
        tg.showAlert('❌ Недостаточно монет!');
        return;
    }
    
    const reels = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
    const msgEl = document.getElementById('slots-message');
    msgEl.innerText = '';
    
    // Анимация
    for (let i = 0; i < 10; i++) {
        reels.forEach(reel => {
            reel.innerText = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
        });
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Финальный результат
    const result = [
        slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
        slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
        slotSymbols[Math.floor(Math.random() * slotSymbols.length)]
    ];
    
    reels.forEach((reel, i) => reel.innerText = result[i]);
    
    // Проверка выигрыша
    let winAmount = 0;
    let message = '';
    
    if (result[0] === result[1] && result[1] === result[2]) {
        if (result[0] === '7️⃣') {
            winAmount = bet * 50;
            message = `🎉 ДЖЕКПОТ 777! +${winAmount} монет!`;
        } else {
            winAmount = bet * 10;
            message = `✨ ТРИ В РЯД! +${winAmount} монет!`;
        }
    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
        winAmount = bet * 2;
        message = `✅ Два совпадения! +${winAmount} монет!`;
    } else {
        message = '❌ Не повезло!';
    }
    
    if (winAmount > 0) {
        try {
            await apiRequest('/transfer', 'POST', {
                from_id: 0,
                to_username: currentUser.username,
                amount: winAmount,
                comment: 'slots_win'
            });
        } catch (error) {}
        msgEl.className = 'game-message win';
    } else {
        msgEl.className = 'game-message lose';
    }
    
    msgEl.innerText = message;
    loadBalance();
}

// ============================================
// РУЛЕТКА
// ============================================
async function placeRouletteBet(choice) {
    const bet = parseInt(document.getElementById('roulette-bet').value);
    
    if (!bet || bet < 10) {
        tg.showAlert('❌ Минимальная ставка: 10 монет');
        return;    }
    
    if (bet > currentBalance) {
        tg.showAlert('❌ Недостаточно монет!');
        return;
    }
    
    const resultEl = document.getElementById('roulette-result');
    const msgEl = document.getElementById('roulette-message');
    msgEl.innerText = '';
    
    // Анимация вращения
    resultEl.innerText = '🎡';
    resultEl.style.animation = 'spin 2s ease-out';
    await new Promise(resolve => setTimeout(resolve, 2000));
    resultEl.style.animation = '';
    
    // Результат
    const number = Math.floor(Math.random() * 37);
    const colors = { 0: 'green', 1: 'red', 2: 'black' };
    
    // Определяем цвет
    let color;
    if (number === 0) color = 'green';
    else if ([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(number)) color = 'red';
    else color = 'black';
    
    resultEl.innerText = number;
    resultEl.style.color = color === 'red' ? '#e74c3c' : color === 'black' ? '#2c3e50' : '#27ae60';
    
    // Проверка выигрыша
    let winAmount = 0;
    let message = '';
    
    if (choice === color) {
        const multiplier = color === 'green' ? 14 : 2;
        winAmount = bet * multiplier;
        message = `🎉 Выпало ${number} (${color === 'red' ? 'красное' : color === 'black' ? 'чёрное' : 'зелёное'})! Вы выиграли ${winAmount} монет!`;
    } else {
        message = `😔 Выпало ${number} (${color === 'red' ? 'красное' : color === 'black' ? 'чёрное' : 'зелёное'}). Вы проиграли.`;
    }
    
    if (winAmount > 0) {
        try {
            await apiRequest('/transfer', 'POST', {
                from_id: 0,
                to_username: currentUser.username,
                amount: winAmount,
                comment: 'roulette_win'
            });
        } catch (error) {}
        msgEl.className = 'game-message win';
    } else {
        msgEl.className = 'game-message lose';
    }
    
    msgEl.innerText = message;
    loadBalance();
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
