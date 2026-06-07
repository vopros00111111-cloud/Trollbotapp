const API_URL = 'https://trollbot-mml4.onrender.com/api';
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.setHeaderColor('#16213e');
tg.setBackgroundColor('#1a1a2e');

let currentUser = null;
let currentBalance = 0;

function initUser() {
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
        console.warn("Данные Telegram не найдены. Используется тестовый профиль.");
        currentUser = { id: 123456789, username: 'test_user', firstName: 'Тест', lastName: '', avatar: '' };
        document.getElementById('header-nickname').innerText = 'Тест (нет данных TG)';
        document.getElementById('profile-nickname').innerText = 'Тест (нет данных TG)';
    }
}

async function apiRequest(endpoint, method, data) {
    method = method || 'GET';
    const options = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    const response = await fetch(API_URL + endpoint, options);
    if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
    }
    return await response.json();}

async function loadBalance() {
    try {
        const data = await apiRequest('/balance/' + currentUser.id);
        currentBalance = data.balance;
        document.getElementById('header-balance').innerText = currentBalance + ' 💰';
        document.getElementById('profile-balance').innerText = currentBalance + ' 💰';
    } catch (error) {
        console.error('Ошибка баланса:', error);
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
    try {
        const games = await apiRequest('/games');
        renderGames(games);
    } catch (error) {
        console.error('Ошибка игр:', error);
        document.getElementById('games-list').innerHTML = '<div style="text-align:center;padding:20px;color:#888;">Ошибка загрузки</div>';
    }
}

async function loadCatalog() {    try {
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
        let medal = (i === 0) ? '🥇' : (i === 1) ? '🥈' : (i === 2) ? '🥉' : (i + 1) + '.';
        const item = document.createElement('div');
        item.className = 'top-item';
        item.innerHTML = '<span class="top-place">' + medal + '</span><span class="top-name">@' + player.username + '</span><span class="top-score">' + player.balance.toLocaleString() + '</span>';
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
        const card = document.createElement('div');
        card.className = 'game-card';
        let btnHtml = '';
        if (game.id === 'poker' || game.id === 'durak') {
            btnHtml = '<button class="game-action-btn" onclick="openGame(\'' + game.id + '\')">Создать стол</button>';
        } else if (game.id === 'blackjack' || game.id === 'slots' || game.id === 'roulette') {
            btnHtml = '<button class="game-action-btn" onclick="openGame(\'' + game.id + '\')">Играть</button>';
        } else {
            btnHtml = '<button class="game-action-btn">Играть</button>';
        }
        card.innerHTML = '<div class="game-icon">' + game.icon + '</div><h3>' + game.name + '</h3><p>' + game.description + '</p>' + btnHtml;
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
        card.innerHTML = '<div class="catalog-icon">📦</div><div class="catalog-info"><h4>' + item.name + '</h4><p>' + item.description + '</p><div class="catalog-price">' + item.price.toLocaleString() + ' 💰</div></div>';
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
        if (b.getAttribute('data-tab') === tabName) b.classList.add('active');
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
    const amount = parseInt(document.getElementById('transfer-amount').value);    const comment = document.getElementById('transfer-comment').value.trim();
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

// === БЛЭКДЖЕК ===
let bjGame = { deck: [], playerHand: [], dealerHand: [], bet: 0, gameOver: false };

function createDeck() {
    const suits = ['♠️', '♥️', '♦️', '♣️'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    for (let s = 0; s < suits.length; s++) {
        for (let r = 0; r < ranks.length; r++) {
            let value = parseInt(ranks[r]);
            if (['J', 'Q', 'K'].indexOf(ranks[r]) !== -1) value = 10;
            if (ranks[r] === 'A') value = 11;
            deck.push({ rank: ranks[r], suit: suits[s], value: value });
        }
    }
    return deck.sort(function() { return Math.random() - 0.5; });
}

function calculateScore(hand) {
    let score = 0;
    for (let i = 0; i < hand.length; i++) { score += hand[i].value; }
    let aces = 0;
    for (let i = 0; i < hand.length; i++) { if (hand[i].rank === 'A') aces++; }
    while (score > 21 && aces > 0) { score -= 10; aces--; }
    return score;
}

function renderCard(card, hidden) {
    if (hidden) return '<div class="card hidden"></div>';
    const isRed = card.suit === '♥️' || card.suit === '♦️';
    return '<div class="card ' + (isRed ? 'red' : 'black') + '">' + card.rank + card.suit + '</div>';
}

function updateBlackjackUI() {    document.getElementById('player-cards').innerHTML = bjGame.playerHand.map(function(c) { return renderCard(c); }).join('');
    const dealerHidden = bjGame.dealerHand.length === 2 && !bjGame.gameOver;
    document.getElementById('dealer-cards').innerHTML = bjGame.dealerHand.map(function(c, i) { return renderCard(c, i === 1 && dealerHidden); }).join('');
    document.getElementById('player-score').innerText = calculateScore(bjGame.playerHand);
    document.getElementById('dealer-score').innerText = dealerHidden ? '?' : calculateScore(bjGame.dealerHand);
}

async function startBlackjack() {
    const bet = parseInt(document.getElementById('bj-bet').value);
    if (!bet || bet < 10) { tg.showAlert('❌ Мин. ставка: 10'); return; }
    if (bet > currentBalance) { tg.showAlert('❌ Недостаточно монет'); return; }
    try { await apiRequest('/game-bet', 'POST', { user_id: currentUser.id, amount: bet, game: 'blackjack' }); }
    catch (e) { tg.showAlert('❌ Ошибка ставки'); return; }
    
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
    
    if (calculateScore(bjGame.playerHand) === 21) { setTimeout(stand, 500); }
}

async function hit() {
    if (bjGame.gameOver) return;
    bjGame.playerHand.push(bjGame.deck.pop());
    updateBlackjackUI();
    if (calculateScore(bjGame.playerHand) > 21) {
        bjGame.gameOver = true;
        document.getElementById('play-controls').style.display = 'none';
        document.getElementById('bet-controls').style.display = 'block';
        const m = document.getElementById('bj-message');
        m.innerText = '❌ Перебор! Вы проиграли.';
        m.className = 'game-message lose';
        updateBlackjackUI();
        await loadBalance();
    }
}

async function stand() {
    if (bjGame.gameOver) return;
    bjGame.gameOver = true;
    while (calculateScore(bjGame.dealerHand) < 17) {
        bjGame.dealerHand.push(bjGame.deck.pop());        await new Promise(function(r) { setTimeout(r, 500); });
        updateBlackjackUI();
    }
    const ps = calculateScore(bjGame.playerHand);
    const ds = calculateScore(bjGame.dealerHand);
    document.getElementById('play-controls').style.display = 'none';
    document.getElementById('bet-controls').style.display = 'block';
    const m = document.getElementById('bj-message');
    
    if (ds > 21 || ps > ds) {
        const win = bjGame.bet * 2;
        try { await apiRequest('/game-win', 'POST', { user_id: currentUser.id, amount: win, game: 'blackjack' }); } catch (e) {}
        m.innerText = '🎉 Вы выиграли ' + win + ' монет!';
        m.className = 'game-message win';
    } else if (ps === ds) {
        try { await apiRequest('/game-win', 'POST', { user_id: currentUser.id, amount: bjGame.bet, game: 'blackjack_draw' }); } catch (e) {}
        m.innerText = '🤝 Ничья! Ставка возвращена.';
        m.className = 'game-message draw';
    } else {
        m.innerText = '😔 Дилер выиграл!';
        m.className = 'game-message lose';
    }
    updateBlackjackUI();
    await loadBalance();
}

// === СЛОТЫ ===
const slotSymbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🔔'];

async function spinSlots() {
    const bet = parseInt(document.getElementById('slots-bet').value);
    if (!bet || bet < 10) { tg.showAlert('❌ Мин. ставка: 10'); return; }
    if (bet > currentBalance) { tg.showAlert('❌ Недостаточно монет'); return; }
    
    try { await apiRequest('/game-bet', 'POST', { user_id: currentUser.id, amount: bet, game: 'slots' }); }
    catch (e) { tg.showAlert('❌ Ошибка ставки'); return; }
    
    const reels = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
    const msg = document.getElementById('slots-message');
    msg.innerText = 'Крутим...';
    
    for (let i = 0; i < 10; i++) {
        reels.forEach(function(r) { r.innerText = slotSymbols[Math.floor(Math.random() * slotSymbols.length)]; });
        await new Promise(function(r) { setTimeout(r, 100); });
    }
    
    const result = [
        slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
        slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
        slotSymbols[Math.floor(Math.random() * slotSymbols.length)]    ];
    reels.forEach(function(r, i) { r.innerText = result[i]; });
    
    let win = 0, txt = '';
    if (result[0] === result[1] && result[1] === result[2]) {
        if (result[0] === '7️⃣') { win = bet * 50; txt = '🎉 ДЖЕКПОТ 777! +' + win; }
        else { win = bet * 10; txt = '✨ ТРИ В РЯД! +' + win; }
    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
        win = bet * 2; txt = '✅ Два совпадения! +' + win;
    } else { 
        txt = '😔 Не повезло!'; 
    }
    
    msg.className = win > 0 ? 'game-message win' : 'game-message lose';
    msg.innerText = txt;
    
    if (win > 0) { 
        try { await apiRequest('/game-win', 'POST', { user_id: currentUser.id, amount: win, game: 'slots' }); } catch (e) {} 
    }
    await loadBalance();
}

// === РУЛЕТКА ===
async function placeRouletteBet(choice) {
    const bet = parseInt(document.getElementById('roulette-bet').value);
    if (!bet || bet < 10) { tg.showAlert('❌ Мин. ставка: 10'); return; }
    if (bet > currentBalance) { tg.showAlert('❌ Недостаточно монет'); return; }
    
    let betNumber = null;
    if (choice === 'number') {
        betNumber = parseInt(document.getElementById('roulette-number').value);
        if (isNaN(betNumber) || betNumber < 0 || betNumber > 36) { tg.showAlert('❌ Число от 0 до 36'); return; }
    }
    
    try { await apiRequest('/game-bet', 'POST', { user_id: currentUser.id, amount: bet, game: 'roulette' }); }
    catch (e) { tg.showAlert('❌ Ошибка ставки'); return; }
    
    const resultEl = document.getElementById('roulette-result');
    const msgEl = document.getElementById('roulette-message');
    msgEl.innerText = '';
    resultEl.innerText = '?';
    resultEl.classList.remove('red', 'black', 'green');
    resultEl.classList.add('spinning');
    
    const spinDuration = 2000;
    const spinInterval = 80;
    const startTime = Date.now();
    
    const spinTimer = setInterval(function() {
        const elapsed = Date.now() - startTime;        resultEl.innerText = Math.floor(Math.random() * 37);
        
        if (elapsed >= spinDuration) {
            clearInterval(spinTimer);
            const number = Math.floor(Math.random() * 37);
            resultEl.innerText = number;
            resultEl.classList.remove('spinning');
            
            let color;
            if (number === 0) color = 'green';
            else if ([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].indexOf(number) !== -1) color = 'red';
            else color = 'black';
            
            resultEl.classList.add(color);
            let winAmount = 0, message = '';
            
            if (choice === 'number' && betNumber === number) {
                winAmount = bet * 36;
                message = '🎉 Выпало ' + number + '! Вы выиграли ' + winAmount + ' монет!';
            } else if (choice === color) {
                const multiplier = color === 'green' ? 14 : 2;
                winAmount = bet * multiplier;
                const colorName = color === 'red' ? 'красное' : color === 'black' ? 'чёрное' : 'зелёное';
                message = '🎉 Выпало ' + number + ' (' + colorName + ')! Вы выиграли ' + winAmount + ' монет!';
            } else {
                const colorName = color === 'red' ? 'красное' : color === 'black' ? 'чёрное' : 'зелёное';
                message = '😔 Выпало ' + number + ' (' + colorName + '). Вы проиграли.';
            }
            
            msgEl.className = winAmount > 0 ? 'game-message win' : 'game-message lose';
            msgEl.innerText = message;
            
            if (winAmount > 0) { 
                try { await apiRequest('/game-win', 'POST', { user_id: currentUser.id, amount: winAmount, game: 'roulette' }); } catch (e) {} 
            }
            await loadBalance();
        }
    }, spinInterval);
}

// === ПОКЕР ===
async function createPokerTable() {
    const bet = parseInt(document.getElementById('poker-bet').value);
    const maxPlayers = parseInt(document.getElementById('poker-players').value);
    if (!bet || bet < 100) { tg.showAlert('❌ Мин. ставка: 100'); return; }
    if (bet > currentBalance) { tg.showAlert('❌ Недостаточно монет'); return; }
    try {
        const res = await apiRequest('/poker/create', 'POST', { user_id: currentUser.id, bet: bet, max_players: maxPlayers });
        if (res.success) {
            tg.showAlert('✅ Стол создан!\n💰 Ставка: ' + bet + '\n👥 Игроков: ' + maxPlayers);            closeGame('poker');
            await loadBalance();
        }
    } catch (e) { tg.showAlert('❌ Ошибка создания стола'); }
}

// Запуск при загрузке
window.addEventListener('load', async function() {
    console.log('🚀 Приложение загружено');
    initUser();
    if (currentUser) {
        console.log('👤 Загрузка данных для пользователя:', currentUser.id);
        try {
            await Promise.all([loadBalance(), loadStats(), loadTop(), loadGames(), loadCatalog()]);
            console.log('✅ Все данные успешно загружены');
        } catch (e) {
            console.error('❌ Критическая ошибка при загрузке:', e);
        }
    }
});
