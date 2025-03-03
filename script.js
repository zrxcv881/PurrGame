// Функция для переключения разделов
function showSection(sectionId) {
    // Скрываем все разделы
    document.querySelectorAll('.content').forEach(div => {
        div.classList.add('hidden');
    });

    // Показываем выбранный раздел
    document.getElementById(sectionId).classList.remove('hidden');
}

// Пример данных для хранилища
const cards = ["🂡", "🂢", "🂣", "🂤", "🂥", "🂦", "🂧", "🂨", "🂩", "🂪"];
const cardsList = document.getElementById('cards-list');

// Добавляем карточки в хранилище
cards.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.textContent = card;
    cardsList.appendChild(cardElement);
});
