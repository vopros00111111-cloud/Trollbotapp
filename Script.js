// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;

// Сообщаем Телеграму, что приложение готово
tg.ready();
// Разворачиваем на весь экран
tg.expand(); 

// Настраиваем цвета шапки под тему пользователя
tg.setHeaderColor(tg.themeParams.secondary_bg_color || '#2c2c2e');
tg.setBackgroundColor(tg.themeParams.bg_color || '#1c1c1e');

// Получаем данные пользователя
const user = tg.initDataUnsafe.user;
if (user) {
    document.getElementById('user-name').innerText = `Привет, ${user.first_name}!`;
    // Тут позже будет запрос к твоему Python-боту за реальным балансом
}

// Логика переключения вкладок
const navButtons = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Убираем активный класс у всех кнопок и экранов
        navButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));

        // Добавляем активный класс нажатой кнопке
        btn.classList.add('active');
        
        // Находим и показываем нужный экран
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(`tab-${tabId}`).classList.add('active');
    });
});
