const API_URL = 'https://trollbot-mml4.onrender.com/api';
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.setHeaderColor('#16213e');
tg.setBackgroundColor('#1a1a2e');

let currentUser = null;
let currentBalance = 0;

// === ИНИЦИАЛИЗАЦИЯ ПОЛЬЗОВАТЕЛЯ ===
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

// === БАЗОВЫЙ ЗАПРОС К API ===
async function apiRequest(endpoint, method, data) {
    method = method || 'GET';
    const options = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    const response = await fetch(API_URL + endpoint, options);
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'HTTP error! status: ' + response.status);
    }
    return await response.json();
}

// === ЗАГРУЗКА ДАННЫХ ===
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
        document.getElementById('games-list').innerHTML = '<div style="text-align:center;padding:20px;color:#888;">Ошибка загрузки</div>';    }
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

// === РЕНДЕРИНГ СПИСКОВ ===
function renderTop(topList) {
    const container = document.getElementById('top-list');
    container.innerHTML = '';
    if (!topList || topList.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#888;">Топ пока пуст</div>';
        return;
    }
    for (let i = 0; i < topList.length; i++) {
        const player = topList[i];
        let medal = (i === 0) ? '' : (i === 1) ? '' : (i === 2) ? '🥉' : (i + 1) + '.';
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
        }        card.innerHTML = '<div class="game-icon">' + game.icon + '</div><h3>' + game.name + '</h3><p>' + game.description + '</p>' + btnHtml;
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

// === НАВИГАЦИЯ ===
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
    document.querySelectorAll('.game-section').forEach(function(t) { t.classList.remove('active'); });
    
    if (gameName === 'poker') {
        document.getElementById('poker-lobby-screen').classList.add('active');
        loadPokerTables();
    } else {
        document.getElementById('game-' + gameName).classList.add('active');    }
    
    document.querySelector('.bottom-nav').classList.add('hidden');
}

function closeGame(gameName) {
    document.querySelectorAll('.game-section').forEach(function(t) { t.classList.remove('active'); });
    document.getElementById('tab-games').classList.add('active');
    document.querySelector('.bottom-nav').classList.remove('hidden');
    
    if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// === ПЕРЕВОДЫ ===
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
// === БЕЗОПАСНЫЙ БЛЭКДЖЕК ===
let bjGameActive = false;

function renderCard(card, hidden) {
    if (hidden) return '<div class="card hidden"></div>';
    const isRed = card.suit === '♥️' || card.suit === '♦️';
    return '<div class="card ' + (isRed ? 'red' : 'black') + '">' + card.rank + card.suit + '</div>';
}

function updateBlackjackUI(res) {
    document.getElementById('player-cards').innerHTML = res.player_hand.map(function(c) { return renderCard(c); }).join('');
    let dealerHtml = '';
    if (!res.finished && res.dealer_card) {
        dealerHtml = renderCard(res.dealer_card) + '<div class="card hidden"></div>';
        document.getElementById('dealer-score').innerText = '?';
    } else if (res.dealer_hand) {
        dealerHtml = res.dealer_hand.map(function(c) { return renderCard(c); }).join('');
        document.getElementById('dealer-score').innerText = res.dealer_score;
    }
    document.getElementById('dealer-cards').innerHTML = dealerHtml;
    document.getElementById('player-score').innerText = res.player_score;
    
    const m = document.getElementById('bj-message');
    if (res.finished) {
        m.innerText = res.message || '';
        m.className = 'game-message ' + (res.win > 0 ? 'win' : (res.message.includes('Ничья') ? 'draw' : 'lose'));
        document.getElementById('play-controls').style.display = 'none';
        document.getElementById('bet-controls').style.display = 'block';
        currentBalance = res.balance;
        document.getElementById('header-balance').innerText = currentBalance + ' 💰';
        document.getElementById('profile-balance').innerText = currentBalance + ' 💰';
    }
}

async function startBlackjack() {
    const bet = parseInt(document.getElementById('bj-bet').value);
    if (!bet || bet < 10) { tg.showAlert('❌ Мин. ставка: 10'); return; }
    if (bet > currentBalance) { tg.showAlert('❌ Недостаточно монет'); return; }
    try {
        const res = await apiRequest('/game/blackjack/start', 'POST', { user_id: currentUser.id, amount: bet });
        bjGameActive = true;
        document.getElementById('bet-controls').style.display = 'none';
        document.getElementById('play-controls').style.display = 'flex';
        document.getElementById('bj-message').innerText = '';
        updateBlackjackUI(res);
    } catch (e) { tg.showAlert('❌ Ошибка: ' + e.message); }
}

async function hit() {
    if (!bjGameActive) return;    try {
        const res = await apiRequest('/game/blackjack/hit', 'POST', { user_id: currentUser.id });
        updateBlackjackUI(res);
        if (res.finished) bjGameActive = false;
    } catch (e) { tg.showAlert('❌ Ошибка'); }
}

async function stand() {
    if (!bjGameActive) return;
    try {
        const res = await apiRequest('/game/blackjack/stand', 'POST', { user_id: currentUser.id });
        updateBlackjackUI(res);
        bjGameActive = false;
    } catch (e) { tg.showAlert('❌ Ошибка'); }
}

// === БЕЗОПАСНЫЕ СЛОТЫ ===
const slotSymbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🔔'];

async function spinSlots() {
    const bet = parseInt(document.getElementById('slots-bet').value);
    if (!bet || bet < 10) { tg.showAlert('❌ Мин. ставка: 10'); return; }
    if (bet > currentBalance) { tg.showAlert('❌ Недостаточно монет'); return; }
    
    const reels = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
    const msg = document.getElementById('slots-message');
    msg.innerText = 'Крутим...';
    
    for (let i = 0; i < 10; i++) {
        reels.forEach(function(r) { r.innerText = slotSymbols[Math.floor(Math.random() * slotSymbols.length)]; });
        await new Promise(function(r) { setTimeout(r, 100); });
    }
    
    try {
        const res = await apiRequest('/game/slots', 'POST', { user_id: currentUser.id, amount: bet });
        reels.forEach(function(r, i) { r.innerText = res.result[i]; });
        currentBalance = res.balance;
        document.getElementById('header-balance').innerText = currentBalance + ' 💰';
        document.getElementById('profile-balance').innerText = currentBalance + ' 💰';
        msg.className = res.win > 0 ? 'game-message win' : 'game-message lose';
        msg.innerText = res.win > 0 ? ' Выигрыш: +' + res.win + ' монет!' : '😔 Не повезло!';
    } catch (e) {
        msg.innerText = '❌ Ошибка: ' + e.message;
        msg.className = 'game-message lose';
    }
}

// === БЕЗОПАСНАЯ РУЛЕТКА ===
async function placeRouletteBet(choice) {
    const bet = parseInt(document.getElementById('roulette-bet').value);    if (!bet || bet < 10) { tg.showAlert(' Мин. ставка: 10'); return; }
    if (bet > currentBalance) { tg.showAlert('❌ Недостаточно монет'); return; }
    
    let betNumber = null;
    if (choice === 'number') {
        betNumber = parseInt(document.getElementById('roulette-number').value);
        if (isNaN(betNumber) || betNumber < 0 || betNumber > 36) { tg.showAlert('❌ Число от 0 до 36'); return; }
    }
    
    const resultEl = document.getElementById('roulette-result');
    const msgEl = document.getElementById('roulette-message');
    msgEl.innerText = '';
    resultEl.innerText = '?';
    resultEl.classList.remove('red', 'black', 'green');
    resultEl.classList.add('spinning');
    
    const startTime = Date.now();
    const spinTimer = setInterval(function() {
        resultEl.innerText = Math.floor(Math.random() * 37);
        if (Date.now() - startTime >= 2000) clearInterval(spinTimer);
    }, 80);
    
    try {
        const res = await apiRequest('/game/roulette', 'POST', { user_id: currentUser.id, amount: bet, choice: choice, bet_number: betNumber });
        await new Promise(function(r) { setTimeout(r, 2000); });
        resultEl.innerText = res.number;
        resultEl.classList.remove('spinning');
        resultEl.classList.add(res.color);
        currentBalance = res.balance;
        document.getElementById('header-balance').innerText = currentBalance + ' 💰';
        document.getElementById('profile-balance').innerText = currentBalance + ' 💰';
        const colorName = res.color === 'red' ? 'красное' : res.color === 'black' ? 'чёрное' : 'зелёное';
        msgEl.className = res.win > 0 ? 'game-message win' : 'game-message lose';
        msgEl.innerText = res.win > 0 ? '🎉 Выпало ' + res.number + ' (' + colorName + ')! +' + res.win + ' монет!' : '😔 Выпало ' + res.number + ' (' + colorName + '). Проигрыш.';
    } catch (e) {
        clearInterval(spinTimer);
        resultEl.classList.remove('spinning');
        msgEl.innerText = '❌ Ошибка: ' + e.message;
        msgEl.className = 'game-message lose';
    }
}

// === ПОКЕР: СОЗДАНИЕ СТОЛА ===
async function createPokerTable() {
    const bet = parseInt(document.getElementById('poker-bet').value);
    const maxPlayers = parseInt(document.getElementById('poker-players').value);
    if (!bet || bet < 100) { tg.showAlert('❌ Мин. ставка: 100'); return; }
    if (bet > currentBalance) { tg.showAlert('❌ Недостаточно монет'); return; }
    
    let chatId = 0;    try {
        const initData = tg.initDataUnsafe;
        if (initData && initData.chat) {
            chatId = initData.chat.id;
        }
        if (chatId === 0) {
            const params = new URLSearchParams(window.location.search);
            chatId = parseInt(params.get('tgWebAppChatId')) || 0;
        }
    } catch (e) {
        console.warn('Не удалось получить chat_id:', e);
    }
    
    try {
        const res = await apiRequest('/poker/create', 'POST', {
            user_id: currentUser.id,
            bet: bet,
            max_players: maxPlayers,
            chat_id: chatId
        });
        if (res.success) {
            tg.showAlert('✅ Стол создан!\n💰 Ставка: ' + bet + '\n👥 Игроков: ' + maxPlayers);
            openPokerGame(res.table_id);
            await loadBalance();
        }
    } catch (e) {
        tg.showAlert('❌ Ошибка создания стола: ' + e.message);
    }
}

// === ПОКЕР: ПРИСОЕДИНЕНИЕ К СТОЛУ ===
async function joinPokerTable(tableId) {
    try {
        const res = await apiRequest('/poker/join', 'POST', { user_id: currentUser.id, table_id: tableId });
        if (res.success) {
            tg.showAlert('✅ Вы присоединились к столу!');
            openPokerGame(tableId);
            await loadBalance();
        }
    } catch (e) {
        tg.showAlert('❌ Ошибка присоединения: ' + e.message);
    }
}

// === ПОКЕР: ОТКРЫТИЕ СТОЛА ===
function openPokerGame(tableId) {
    document.querySelectorAll('.tab-content, .game-section').forEach(function(t) { t.classList.remove('active'); });
    document.getElementById('poker-game-screen').classList.add('active');
    document.querySelector('.bottom-nav').classList.add('hidden');
    document.getElementById('poker-game-status').innerText = ' Ожидание игроков...';    document.getElementById('poker-game-table-id').innerText = 'Стол: ' + tableId;
    loadPokerGameState(tableId);
}

// === ПОКЕР: ЗАГРУЗКА СОСТОЯНИЯ СТОЛА ===
async function loadPokerGameState(tableId) {
    try {
        const state = await apiRequest('/poker/table/' + tableId, 'GET');
        
        document.getElementById('poker-pot').innerText = state.pot + ' 💰';
        updateCurrentBet(state.current_bet || 0);
        
        const communityContainer = document.getElementById('community-cards');
        communityContainer.innerHTML = '';
        if (state.community_cards && state.community_cards.length > 0) {
            state.community_cards.forEach(function(card) {
                const cardEl = document.createElement('div');
                cardEl.className = 'card revealed';
                cardEl.innerText = card.rank + card.suit;
                communityContainer.appendChild(cardEl);
            });
        } else {
            for (let i = 0; i < 5; i++) {
                const placeholder = document.createElement('div');
                placeholder.className = 'card-placeholder';
                placeholder.innerText = '🂠';
                communityContainer.appendChild(placeholder);
            }
        }
        
        const myCardsContainer = document.getElementById('my-cards');
        myCardsContainer.innerHTML = '';
        if (state.my_cards && state.my_cards.length > 0) {
            state.my_cards.forEach(function(card) {
                const cardEl = document.createElement('div');
                cardEl.className = 'card revealed';
                cardEl.innerText = card.rank + card.suit;
                myCardsContainer.appendChild(cardEl);
            });
        } else {
            for (let i = 0; i < 2; i++) {
                const cardBack = document.createElement('div');
                cardBack.className = 'card back';
                cardBack.innerText = '🂠';
                myCardsContainer.appendChild(cardBack);
            }
        }
        
        
        // === ОБНОВЛЕНИЕ ДАННЫХ СОПЕРНИКОВ ===
    
        if (state.players && Array.isArray(state.players)) {
            let oppIndex = 2;            
            state.players.forEach(function(player) {
                // Исправлено: убраны пробелы в user_id и &&
                if (player.user_id !== currentUser.id && oppIndex <= 4) {
                    const nickEl = document.getElementById('opp' + oppIndex + '-nick');
                    const avatarEl = document.getElementById('opp' + oppIndex + '-avatar');
                
                    if (nickEl) nickEl.innerText = '@' + (player.username || 'Игрок');
                    if (avatarEl) {
                        const firstLetter = player.username ? player.username.charAt(0).toUpperCase() : '?';
                        avatarEl.innerText = firstLetter;
                    }
                    oppIndex++;
                }
            });
        }
    
        // === ОБНОВЛЕНИЕ ДАННЫХ ТЕКУЩЕГО ИГРОКА ===
        const myAvatar = document.getElementById('my-avatar-small');
        // Исправлено: убран пробел в начале ID
        const myNick = document.getElementById('my-nick-small');
    
        if (myAvatar) {
            const myFirstLetter = currentUser.username ? currentUser.username.charAt(0).toUpperCase() : '?';
            myAvatar.innerText = myFirstLetter;
        }
        // Исправлено: убран пробел в username
        if (myNick) myNick.innerText = '@' + (currentUser.username || 'Вы');
        
        } catch (e) {
            console.error('Ошибка загрузки состояния:', e);
        }
    }

// === ПОКЕР: МОДАЛЬНОЕ ОКНО ПОВЫШЕНИЯ ===
let currentBet = 0;
let raiseAmount = 0;

function showRaiseModal() {
    document.getElementById('modal-current-bet').innerText = currentBet;
    document.getElementById('raise-amount').value = 10;
    updateTotalRaise();
    document.getElementById('raise-modal').classList.add('active');
}

function closeRaiseModal() {
    document.getElementById('raise-modal').classList.remove('active');
}

function setRaiseAmount(amount) {
    document.getElementById('raise-amount').value = amount;
    updateTotalRaise();
}

function updateTotalRaise() {
    const raise = parseInt(document.getElementById('raise-amount').value) || 0;
    const total = currentBet + raise;
    document.getElementById('total-raise').innerText = total;
    raiseAmount = total;
}

function confirmRaise() {
    if (raiseAmount <= currentBet) {
        tg.showAlert('❌ Повышение должно быть больше текущей ставки!');
        return;
    }
    if (raiseAmount > currentBalance) {
        tg.showAlert('❌ Недостаточно монет!');
        return;
    }
    pokerRaise(raiseAmount);
    closeRaiseModal();
}

// === ПОКЕР: ДЕЙСТВИЯ ===
async function pokerCall() {
    tg.showAlert('✅ Колл! (в разработке)');
}

async function pokerFold() {
    tg.showAlert('❌ Фолд! (в разработке)');
}

async function pokerRaise(amount) {
    tg.showAlert('📈 Повышение до ' + amount + ' монет! (в разработке)');
}

function updateCurrentBet(amount) {
    currentBet = amount;
    document.getElementById('current-bet').innerText = amount;
}

// === ПОКЕР: СПИСОК СТОЛОВ ===
async function loadPokerTables() {
    try {
        const tables = await apiRequest('/poker/tables', 'GET');
        renderPokerTables(tables);
    } catch (e) {
        console.error('Ошибка загрузки столов:', e);
        document.getElementById('poker-tables-list').innerHTML = '<div style="text-align:center;padding:20px;color:#888;">Ошибка загрузки</div>';
    }
}

function renderPokerTables(tables) {
    const container = document.getElementById('poker-tables-list');
    container.innerHTML = '';
    if (!tables || tables.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#888;">Нет активных столов</div>';
        return;
    }
    for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const card = document.createElement('div');
        card.className = 'poker-table-card';
        card.style.cssText = 'background:linear-gradient(135deg,#2a2d5a,#1e2145);border-radius:16px;padding:15px;border:2px solid #3d4080;margin-bottom:10px;';
        const isFull = table.players >= table.max_players;
        card.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;"><div><div style="font-size:16px;font-weight:700;color:#e0e7ff;">💰 Ставка: ' + table.bet + ' 💰</div><div style="font-size:14px;color:#c4b5fd;">👥 ' + table.players + '/' + table.max_players + ' игроков</div><div style="font-size:12px;color:#9ca3af;">👤 @' + table.host_username + '</div></div><button class="action-btn" style="width:auto;padding:10px 20px;" onclick="joinPokerTable(\'' + table.table_id + '\')" ' + (isFull ? 'disabled style="opacity:0.5;"' : '') + '>' + (isFull ? 'Полон' : 'Сесть') + '</button></div>';
        container.appendChild(card);
    }
}

// === ПРОВЕРКА URL НА НАЛИЧИЕ TABLE_ID ===
async function checkUrlForTable() {
    const params = new URLSearchParams(window.location.search);
    const tableId = params.get('table');
    if (tableId) {
        console.log('Найден ID стола в URL:', tableId);
        await new Promise(function(resolve) { setTimeout(resolve, 1000); });
        if (!currentUser) {
            tg.showAlert('Ошибка: пользователь не авторизован');
            return;
        }
        try {
            const res = await apiRequest('/poker/join', 'POST', { user_id: currentUser.id, table_id: tableId });
            if (res.success) {
                tg.showAlert('✅ Вы присоединились к столу!');
                await loadBalance();
                if (res.game_started) {
                    openPokerGame(tableId);
                } else {
                    document.getElementById('poker-game-status').innerText = '⏳ Ожидание игроков...';
                    document.getElementById('poker-game-table-id').innerText = 'Стол: ' + tableId;
                }
            }
        } catch (e) {
            tg.showAlert('Не удалось присоединиться: ' + e.message);
        }
    }
}

// === ЗАПУСК ПРИЛОЖЕНИЯ ===
window.addEventListener('load', async function() {
    console.log('Приложение загружено');
    initUser();
    if (currentUser) {
        await Promise.all([loadBalance(), loadStats(), loadTop(), loadGames(), loadCatalog()]);
        await checkUrlForTable();
    }
    console.log('Все данные загружены');
});
