
// Variables
let userCards = [];
let tokens = 0;
let miningActive = false;
let miningEndTime = 0;
let marketListings = []; // Список карточек на продажу
let selectedCardIndex = null; // Индекс выбранной карточки для продажи
let currentPurchaseIndex = null; // Индекс карточки для покупки

// DOM Elements
const tokenDisplay = document.getElementById('token-count');
const miningButton = document.getElementById('mining-button');
const miningText = document.getElementById('mining-text');
const miningTimer = document.getElementById('mining-timer');
const getCardButton = document.getElementById('get-card-button');
const marketListingsContainer = document.getElementById('market-listings-container');

// Function to switch sections
function showSection(sectionId) {
    // Скрываем все секции
    document.querySelectorAll('.content').forEach(div => {
        div.classList.remove('active');
        div.classList.add('hidden');
    });

    // Показываем выбранную секцию
    const selectedSection = document.getElementById(sectionId);
    selectedSection.classList.remove('hidden');
    selectedSection.classList.add('active');

    // Убираем активный класс у всех кнопок
    document.querySelectorAll('.navbar button').forEach(button => {
        button.classList.remove('active');
    });

    // Добавляем активный класс к выбранной кнопке
    const activeButton = document.querySelector(`.navbar button[onclick="showSection('${sectionId}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // Обновляем список карточек в выпадающем списке
    if (sectionId === 'exchange') {
        updateCardsToSell();
        updateMarketListings();
    }
}

// Function to get a welcome card
function getWelcomeCard() {
    const welcomeCard = { type: "welcome", content: "🎉", owner: "user" }; // Добавляем владельца
    userCards.push(welcomeCard); // Добавляем карточку в массив
    updateCardsList(); // Обновляем отображение карточек
    updateCardsToSell(); // Обновляем список карточек для продажи

    // Показываем модальное окно
    showModal();
}

// Function to update the cards list
function updateCardsList() {
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = ""; // Очищаем контейнер перед обновлением

    userCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.textContent = card.content; // Добавляем содержимое карточки
        cardsContainer.appendChild(cardElement);
    });
}

// Function to show the modal
function showModal() {
    const modal = document.getElementById('card-modal');
    modal.classList.remove('hidden');
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById('card-modal');
    modal.classList.add('hidden');
}

// Function to show the "Not Enough Purr" modal
function showPurrModal() {
    const modal = document.getElementById('purr-modal');
    modal.classList.remove('hidden');
}

// Function to close the "Not Enough Purr" modal
function closePurrModal() {
    const modal = document.getElementById('purr-modal');
    modal.classList.add('hidden');
}

// Function to start mining
function startMining() {
    if (!miningActive) {
        miningActive = true;
        miningEndTime = Date.now() + 10 * 1000; // 10 seconds
        miningButton.classList.add('disabled');
        miningText.textContent = "Mining...";
        miningTimer.classList.remove('hidden');
        miningButton.onclick = null;

        const timer = setInterval(() => {
            const timeLeft = miningEndTime - Date.now();
            if (timeLeft <= 0) {
                clearInterval(timer);
                miningText.textContent = "Claim";
                miningTimer.classList.add('hidden');
                miningTimer.textContent = ""; // Очищаем текст таймера
                miningButton.classList.remove('disabled');
                miningButton.onclick = claimTokens;

                // Add the token amount text
                const tokenAmount = document.createElement('span');
                tokenAmount.id = 'token-amount';
                tokenAmount.textContent = "+120 Purr";
                miningButton.appendChild(tokenAmount);
            } else {
                const seconds = Math.floor(timeLeft / 1000);
                miningTimer.textContent = `${seconds}s`;
            }
        }, 1000);
    }
}

// Function to claim tokens
function claimTokens() {
    if (miningActive && Date.now() >= miningEndTime) {
        miningActive = false;
        miningText.textContent = "Mining";
        miningButton.onclick = startMining;

        // Remove the token amount text
        const tokenAmount = document.getElementById('token-amount');
        if (tokenAmount) {
            tokenAmount.remove();
        }

        animateTokenIncrement(120); // Add 120 Purr
    }
}

// Function to animate token increment
function animateTokenIncrement(amount) {
    const targetTokens = tokens + amount;
    const incrementDuration = 1000; // 1 second
    const startTime = Date.now();

    const animation = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= incrementDuration) {
            tokens = targetTokens;
            tokenDisplay.textContent = tokens.toString();
            clearInterval(animation);
        } else {
            const progress = elapsedTime / incrementDuration;
            const currentTokens = Math.floor(tokens + amount * progress);
            tokenDisplay.textContent = currentTokens.toString();
        }
    }, 16); // Update every 16ms (~60 FPS)
}

// Function to buy a box
function buyBox(cost) {
    if (tokens >= cost) {
        tokens -= cost; // Снимаем Purr
        tokenDisplay.textContent = tokens.toString(); // Обновляем отображение Purr

        // Добавляем случайную карточку
        const randomCard = getRandomCard();
        userCards.push(randomCard);
        updateCardsList(); // Обновляем отображение карточек
        updateCardsToSell(); // Обновляем список карточек для продажи

        // Показываем модальное окно с новой карточкой
        showModalWithCard(randomCard.content);
    } else {
        showPurrModal(); // Показываем модальное окно "Недостаточно Purr"
    }
}

// Function to buy a box with Telegram Stars (заглушка)
function buyBoxWithStars(stars) {
    alert(`This feature is not implemented yet. You need ${stars} Telegram Stars to buy this box.`);
}

// Function to get a random card
function getRandomCard() {
    const cards = ["🃏", "🌟", "⚡", "🔥", "💎", "🍀", "🐱", "🐾", "✨"]; // Новые карточки
    const randomIndex = Math.floor(Math.random() * cards.length);
    return { type: "random", content: cards[randomIndex], owner: "user" }; // Добавляем владельца
}

// Function to show the modal with a specific card
function showModalWithCard(cardContent) {
    const modalCard = document.querySelector(".card-modal-card");
    modalCard.textContent = cardContent; // Устанавливаем содержимое карточки

    const modal = document.getElementById('card-modal');
    modal.classList.remove('hidden');
}

// Function to update the cards list in the sell modal
function updateCardsToSell() {
    const cardsToSellContainer = document.getElementById('cards-to-sell');
    cardsToSellContainer.innerHTML = ""; // Очищаем контейнер

    userCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-to-sell';
        cardElement.textContent = card.content; // Отображаем содержимое карточки

        // Проверяем, выставлена ли карточка на продажу
        const isOnSale = marketListings.some(listing => listing.card === card && listing.owner === "user");

        // Если карточка уже на продаже, добавляем специальный стиль
        if (isOnSale) {
            cardElement.classList.add('on-sale');
        }

        // Обработчик выбора карточки
        cardElement.addEventListener('click', () => {
            // Снимаем выделение с предыдущей карточки
            document.querySelectorAll('.card-to-sell').forEach(card => {
                card.classList.remove('selected');
            });

            // Выделяем выбранную карточку
            cardElement.classList.add('selected');
            selectedCardIndex = index; // Сохраняем индекс выбранной карточки

            // Показываем кнопку отмены, если карточка уже на продаже
            const cancelButton = document.getElementById('cancel-sale-button');
            if (isOnSale) {
                cancelButton.classList.remove('hidden');
            } else {
                cancelButton.classList.add('hidden');
            }
        });

        cardsToSellContainer.appendChild(cardElement);
    });
}

// Function to sell a card
function sellCard() {
    if (selectedCardIndex === null) {
        showNotification("Error", "Please select a card to sell.");
        return;
    }

    const price = parseInt(document.getElementById('card-price').value); // Цена
    if (isNaN(price) || price < 1) {
        showNotification("Error", "Please enter a valid price.");
        return;
    }

    // Получаем карточку для продажи
    const cardToSell = userCards[selectedCardIndex];

    // Добавляем карточку на рынок с указанием владельца
    marketListings.push({ card: cardToSell, price: price, owner: "user" }); // Владелец - текущий пользователь

    // Обновляем интерфейс
    updateCardsToSell(); // Обновляем список карточек в модальном окне
    updateMarketListings(); // Обновляем список карточек на рынке
    updateCardsList(); // Обновляем инвентарь пользователя

    showNotification("Success", "Card listed for sale!");
    closeSellCardModal(); // Закрываем модальное окно
}
// Function to cancel the sale of a card
function cancelSale() {
    if (selectedCardIndex === null) {
        showNotification("Error", "Please select a card to cancel the sale.");
        return;
    }

    const selectedCard = userCards[selectedCardIndex];

    // Находим объявление о продаже этой карточки
    const listingIndex = marketListings.findIndex(listing => listing.card === selectedCard && listing.owner === "user");

    if (listingIndex === -1) {
        showNotification("Error", "This card is not listed for sale.");
        return;
    }

    // Удаляем карточку из списка продаж
    marketListings.splice(listingIndex, 1);

    // Обновляем интерфейс
    updateMarketListings(); // Обновляем список карточек на рынке
    updateCardsToSell(); // Обновляем список карточек в модальном окне
    showNotification("Success", "Sale canceled successfully!");

    // Скрываем кнопку отмены
    const cancelButton = document.getElementById('cancel-sale-button');
    cancelButton.classList.add('hidden');
}

// Function to update the market listings
function updateMarketListings() {
    marketListingsContainer.innerHTML = ""; // Очищаем контейнер
    marketListings.forEach((listing, index) => {
        const listingElement = document.createElement('div');
        listingElement.className = 'market-listing';

        listingElement.innerHTML = `
            <div class="card-content">${listing.card.content}</div>
            <div class="card-price">${listing.price} Purr</div>
            <button onclick="openPurchaseConfirmModal(${index})">Buy</button>
        `;

        marketListingsContainer.appendChild(listingElement);
    });
}

// Function to open the purchase confirmation modal
function openPurchaseConfirmModal(index) {
    const purchaseModal = document.getElementById('purchase-confirm-modal');
    const confirmPrice = document.getElementById('confirm-price');
    const confirmCard = document.querySelector('.confirm-card');

    const listing = marketListings[index];
    confirmPrice.textContent = listing.price;
    confirmCard.textContent = listing.card.content;

    currentPurchaseIndex = index;
    purchaseModal.classList.remove('hidden');
}

// Function to confirm the purchase
function confirmPurchase() {
    if (currentPurchaseIndex !== null) {
        buyMarketCard(currentPurchaseIndex);
        closePurchaseConfirmModal();
    }
}

// Function to close the purchase confirmation modal
function closePurchaseConfirmModal() {
    const purchaseModal = document.getElementById('purchase-confirm-modal');
    purchaseModal.classList.add('hidden');
    currentPurchaseIndex = null;
}

// Function to buy a card from the market
function buyMarketCard(index) {
    const listing = marketListings[index]; // Карточка на продажу
    if (tokens < listing.price) {
        showNotification("Error", "Not enough Purr to buy this card.");
        return;
    }

    tokens -= listing.price; // Снимаем Purr у покупателя
    tokenDisplay.textContent = tokens.toString(); // Обновляем отображение Purr

    // Начисляем Purr продавцу (в реальном приложении это должно быть на сервере)
    if (listing.owner === "user") {
        tokens += listing.price; // Если продавец - текущий пользователь
        tokenDisplay.textContent = tokens.toString();
    } else {
        // Здесь можно добавить логику для начисления Purr другому пользователю
        console.log(`Purr transferred to ${listing.owner}`);
    }

    userCards.push(listing.card); // Добавляем карточку в инвентарь покупателя
    marketListings.splice(index, 1); // Удаляем карточку с рынка

    updateMarketListings(); // Обновляем список карточек на рынке
    updateCardsList(); // Обновляем инвентарь пользователя
    showNotification("Success", "Card purchased successfully!");
}

// Function to show notifications
function showNotification(title, message) {
    const notificationModal = document.getElementById('notification-modal');
    const notificationTitle = document.getElementById('notification-title');
    const notificationMessage = document.getElementById('notification-message');

    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    notificationModal.classList.remove('hidden');
}

// Function to close the notification modal
function closeNotificationModal() {
    const notificationModal = document.getElementById('notification-modal');
    notificationModal.classList.add('hidden');
}

// Initialize the app
showSection('home'); // Show the home section by default
updateCardsToSell(); // Обновляем список карточек при загрузке
// Function to open the sell card modal
function openSellCardModal() {
    selectedCardIndex = null; // Сбрасываем выбор
    updateCardsToSell(); // Обновляем список карточек
    const modal = document.getElementById('sell-card-modal');
    modal.classList.remove('hidden');
}

// Function to close the sell card modal
function closeSellCardModal() {
    const modal = document.getElementById('sell-card-modal');
    modal.classList.add('hidden');
}
