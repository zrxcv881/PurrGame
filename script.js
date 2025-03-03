// Функция для переключения разделов
function showSection(sectionId) {
    // Скрываем все разделы
    document.querySelectorAll('.content').forEach(div => {
        div.classList.add('hidden');
    });

    // Показываем выбранный раздел
    document.getElementById(sectionId).classList.remove('hidden');
}

// Массив карточек пользователя
let userCards = [];

// Функция для получения приветственной карточки
function getWelcomeCard() {
    if (userCards.length === 0) {
        const welcomeCard = "🎉 Приветственная карточка";
        userCards.push(welcomeCard);
        updateCardsList();
        alert("Вы получили приветственную карточку!");
    } else {
        alert("Вы уже получили приветственную карточку.");
    }
}

// Функция для обновления списка карточек
function updateCardsList() {
    const cardsList = document.getElementById('cards-list');
    cardsList.innerHTML = ""; // Очищаем список перед обновлением

    userCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.textContent = card;
        cardsList.appendChild(cardElement);
    });
}

// Пример данных для хранилища
const cards = ["🂡", "🂢", "🂣", "🂤", "🂥", "🂦", "🂧", "🂨", "🂩", "🂪"];
const cardsList = document.getElementById('cards-list');

// Добавляем карточки в хранилище (для примера)
cards.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.textContent = card;
    cardsList.appendChild(cardElement);
});
// Сохранение карточек
     localStorage.setItem('userCards', JSON.stringify(userCards));

     // Загрузка карточек
     const savedCards = JSON.parse(localStorage.getItem('userCards'));
     if (savedCards) {
         userCards = savedCards;
         updateCardsList();
     }
