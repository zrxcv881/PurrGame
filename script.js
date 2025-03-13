// Variables
let userCards = [];
let tokens = 0;
let miningActive = false;
let miningEndTime = 0;
let marketListings = [];
let selectedCardIndex = null;
let currentPurchaseIndex = null;
let totalMinedPurr = 0; // Всего намайнено Purr
let totalSpentPurr = 0; // Всего потрачено Purr
let totalOpenedBoxes = 0; // Всего открыто боксов

// Mining upgrades
let miningUpgrades = [
    { level: 1, cost: 1000, bonus: 10, purchased: false },
    { level: 2, cost: 5000, bonus: 10, purchased: false },
    { level: 3, cost: 10000, bonus: 5, purchased: false }
];
let miningEfficiency = 0;
let currentUpgradeIndex = 0;

// DOM Elements
const tokenDisplay = document.getElementById('token-count');
const miningButton = document.getElementById('mining-button');
const miningText = document.getElementById('mining-text');
const miningTimer = document.getElementById('mining-timer');
const getCardButton = document.getElementById('get-card-button');
const marketListingsContainer = document.getElementById('market-listings-container');

// Инициализация Telegram Web App
if (window.Telegram && window.Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();

    const user = Telegram.WebApp.initDataUnsafe.user;
    if (user) {
        const welcomeMessage = `Welcome, ${user.first_name || "User"}!`;
        document.getElementById('welcome-text').textContent = welcomeMessage;
    }
} else {
    console.error("Telegram Web App SDK не загружен!");
}

// Function to switch sections
function showSection(sectionId) {
    document.querySelectorAll('.content').forEach(div => {
        div.classList.remove('active');
        div.classList.add('hidden');
    });

    const selectedSection = document.getElementById(sectionId);
    selectedSection.classList.remove('hidden');
    selectedSection.classList.add('active');

    document.querySelectorAll('.navbar button').forEach(button => {
        button.classList.remove('active');
    });

    const activeButton = document.querySelector(`.navbar button[onclick="showSection('${sectionId}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }

    if (sectionId === 'market') {
        showMarketSection('boxes');
    }
}

// Function to switch between Boxes and Upgrades sections
function showMarketSection(section) {
    document.querySelectorAll('.market-section').forEach(div => {
        div.classList.remove('active');
        div.classList.add('hidden');
    });

    const selectedSection = document.getElementById(`${section}-section`);
    selectedSection.classList.remove('hidden');
    selectedSection.classList.add('active');

    document.querySelectorAll('.toggle-button').forEach(button => {
        button.classList.remove('active');
    });

    const activeButton = document.getElementById(`toggle-${section}`);
    activeButton.classList.add('active');

    if (section === 'upgrades') {
        updateUpgradeButton();
    }
}

// Function to update the upgrade button
function updateUpgradeButton() {
    const upgradeButton = document.getElementById('upgrade-button');
    if (currentUpgradeIndex >= miningUpgrades.length) {
        upgradeButton.textContent = "Mining Fully Upgraded!";
        upgradeButton.classList.add('disabled');
        return;
    }

    const currentUpgrade = miningUpgrades[currentUpgradeIndex];
    upgradeButton.textContent = `Upgrade Mining (Level ${currentUpgrade.level}): +${currentUpgrade.bonus}% (${currentUpgrade.cost} Purr)`;
    upgradeButton.classList.remove('disabled');
}

// Function to purchase the current upgrade
function purchaseUpgrade() {
    if (currentUpgradeIndex >= miningUpgrades.length) {
        showNotification("Info", "Mining is fully upgraded!");
        return;
    }

    const currentUpgrade = miningUpgrades[currentUpgradeIndex];
    if (tokens < currentUpgrade.cost) {
        showNotification("Error", "Not enough Purr to purchase this upgrade.");
        return;
    }

    tokens -= currentUpgrade.cost;
    tokenDisplay.textContent = tokens.toString();

    currentUpgrade.purchased = true;
    miningEfficiency += currentUpgrade.bonus;

    showNotification("Success", `Mining efficiency increased by ${currentUpgrade.bonus}%!`);
    currentUpgradeIndex++;
    updateUpgradeButton();
}

// Function to get a welcome card
function getWelcomeCard() {
    const welcomeCard = { type: "welcome", content: "🎉", owner: "user" };
    userCards.push(welcomeCard);
    updateCardsList();
    updateCardsToSell();
    showModal();
}

// Function to update the cards list
function updateCardsList() {
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = ""; // Очищаем контейнер

    userCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.innerHTML = `
            <div class="card-content">${card.content}</div>
            <button class="sell-button hidden" onclick="sellSelectedCard(event)">Sell</button>
        `;

        // Добавляем обработчик события для выбора карточки
        cardElement.addEventListener('click', () => selectCard(cardElement));

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
                miningTimer.textContent = "";
                miningButton.classList.remove('disabled');
                miningButton.onclick = claimTokens;

                const tokenAmount = document.createElement('span');
                tokenAmount.id = 'token-amount';
                tokenAmount.textContent = `+${calculateMiningReward(120)} Purr`;
                miningButton.appendChild(tokenAmount);
            } else {
                const seconds = Math.floor(timeLeft / 1000);
                miningTimer.textContent = `${seconds}s`;
            }
        }, 1000);
    }
}

// Function to calculate mining rewards with efficiency bonus
function calculateMiningReward(baseReward) {
    return baseReward * (1 + miningEfficiency / 100);
}

// Function to claim tokens
function claimTokens() {
    if (miningActive && Date.now() >= miningEndTime) {
        miningActive = false;
        miningText.textContent = "Mining";
        miningButton.onclick = startMining;

        const tokenAmount = document.getElementById('token-amount');
        if (tokenAmount) {
            tokenAmount.remove();
        }

        const baseReward = 120;
        const totalReward = calculateMiningReward(baseReward);
        animateTokenIncrement(totalReward);

        // Обновляем статистику
        totalMinedPurr += totalReward;
        updateProfileStatistics();
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
        tokens -= cost;
        tokenDisplay.textContent = tokens.toString();

        // Обновляем статистику
        totalSpentPurr += cost;
        totalOpenedBoxes += 1;
        updateProfileStatistics();

        const randomCard = getRandomCard();
        userCards.push(randomCard);
        updateCardsList();
        updateCardsToSell();
        showModalWithCard(randomCard.content);
    } else {
        showPurrModal();
    }
}

// Function to buy a box with Telegram Stars (stub)
function buyBoxWithStars(stars) {
    Telegram.WebApp.showAlert(`This feature is not implemented yet. You need ${stars} Telegram Stars to buy this box.`);
}

// Function to get a random card
function getRandomCard() {
    const cards = ["🃏", "🌟", "⚡", "🔥", "💎", "🍀", "🐱", "🐾", "✨"];
    const randomIndex = Math.floor(Math.random() * cards.length);
    return { type: "random", content: cards[randomIndex], owner: "user" };
}

// Function to show the modal with a specific card
function showModalWithCard(cardContent) {
    const modalCard = document.querySelector(".card-modal-card");
    modalCard.textContent = cardContent;

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
        cardElement.textContent = card.content;

        // Если карточка выбрана для продажи, добавляем класс selected
        if (selectedCardForSale && card.content === selectedCardForSale.querySelector('.card-content').textContent) {
            cardElement.classList.add('selected');
            selectedCardIndex = index;
        }

        cardElement.addEventListener('click', () => {
            document.querySelectorAll('.card-to-sell').forEach(card => {
                card.classList.remove('selected');
            });

            cardElement.classList.add('selected');
            selectedCardIndex = index;

            const cancelButton = document.getElementById('cancel-sale-button');
            if (marketListings.some(listing => listing.card === card && listing.owner === "user")) {
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

    const price = parseInt(document.getElementById('card-price').value);
    if (isNaN(price) || price < 1) {
        showNotification("Error", "Please enter a valid price.");
        return;
    }

    const cardToSell = userCards[selectedCardIndex];
    userCards.splice(selectedCardIndex, 1);

    // Добавляем новое объявление в начало массива
    marketListings.unshift({ card: cardToSell, price: price, owner: "user" });

    updateCardsToSell();
    updateMarketListings();
    updateCardsList();

    showNotification("Success", "Card listed for sale!");
    closeSellCardModal();
}

// Function to cancel the sale of a card
function cancelSale(listingIndex) {
    if (listingIndex === null || listingIndex === undefined) {
        showNotification("Error", "Please select a listing to cancel.");
        return;
    }

    const listing = marketListings[listingIndex];

    // Проверяем, что текущий пользователь — создатель объявления
    if (listing.owner !== "user") {
        showNotification("Error", "You can only cancel your own listings.");
        return;
    }

    // Возвращаем карточку в инвентарь пользователя
    userCards.push(listing.card);

    // Удаляем объявление из списка
    marketListings.splice(listingIndex, 1);

    // Обновляем интерфейс
    updateMarketListings(); // Обновляем список объявлений
    updateCardsList(); // Обновляем инвентарь пользователя
    updateCardsToSell(); // Обновляем список карточек для продажи

    showNotification("Success", "Sale canceled successfully!");
}

// Function to update the market listings
function updateMarketListings() {
    marketListingsContainer.innerHTML = ""; // Очищаем контейнер

    marketListings.forEach((listing, index) => {
        const listingElement = document.createElement('div');
        listingElement.className = 'market-listing';

        // Содержимое объявления
        listingElement.innerHTML = `
            <div class="card-content">${listing.card.content}</div>
            <div class="card-price">${listing.price} Purr</div>
            <button onclick="openPurchaseConfirmModal(${index})">Buy</button>
        `;

        // Если текущий пользователь — создатель объявления, добавляем кнопку отмены
        if (listing.owner === "user") {
            const cancelButton = document.createElement('button');
            cancelButton.textContent = "Cancel Sale";
            cancelButton.className = 'cancel-sale-button';
            cancelButton.onclick = () => cancelSale(index); // Передаём индекс объявления
            listingElement.appendChild(cancelButton);
        }

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
    const listing = marketListings[index];
    if (tokens < listing.price) {
        showNotification("Error", "Not enough Purr to buy this card.");
        return;
    }

    tokens -= listing.price;
    tokenDisplay.textContent = tokens.toString();

    if (listing.owner === "user") {
        tokens += listing.price;
        tokenDisplay.textContent = tokens.toString();
    }

    userCards.push(listing.card);
    marketListings.splice(index, 1);

    updateMarketListings();
    updateCardsList();
    showNotification("Success", "Card purchased successfully!");
}

// Function to show notifications
function showNotification(title, message) {
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.showAlert(`${title}: ${message}`);
    } else {
        alert(`${title}: ${message}`);
    }
}

// Function to close the notification modal
function closeNotificationModal() {
    const notificationModal = document.getElementById('notification-modal');
    notificationModal.classList.add('hidden');
}

// Function to open the sell card modal
function openSellCardModal() {
    selectedCardIndex = null;
    updateCardsToSell();
    const modal = document.getElementById('sell-card-modal');
    modal.classList.remove('hidden');
    modal.scrollTop = 0; // Сбрасываем прокрутку в начало
}

// Function to close the sell card modal
function closeSellCardModal() {
    const modal = document.getElementById('sell-card-modal');
    modal.classList.add('hidden');
}

let selectedCard = null;

// Функция для выбора карточки
function selectCard(card) {
    // Скрываем кнопку Sell на всех карточках
    document.querySelectorAll('.sell-button').forEach(button => {
        button.classList.add('hidden');
    });

    // Показываем кнопку Sell на выбранной карточке
    const sellButton = card.querySelector('.sell-button');
    sellButton.classList.remove('hidden');

    // Запоминаем выбранную карточку
    selectedCard = card;
}

// Функция для скрытия кнопки Sell при клике вне карточки
document.addEventListener('click', (event) => {
    if (selectedCard && !selectedCard.contains(event.target)) {
        const sellButton = selectedCard.querySelector('.sell-button');
        if (sellButton) {
            sellButton.classList.add('hidden');
        }
        selectedCard = null;
    }
});

// Функция для продажи выбранной карточки
let selectedCardForSale = null; // Переменная для хранения выбранной карточки

// Функция для продажи выбранной карточки
function sellSelectedCard(event) {
    event.stopPropagation(); // Останавливаем всплытие события

    // Запоминаем выбранную карточку
    selectedCardForSale = selectedCard;

    // Переходим в раздел Market
    showSection('market');

    // Открываем окно продажи карточки
    openSellCardModal();

    // Скрываем кнопку Sell
    const sellButton = selectedCard.querySelector('.sell-button');
    if (sellButton) {
        sellButton.classList.add('hidden');
    }

    // Сбрасываем выбранную карточку
    selectedCard = null;
}

// Функция для подтверждения цены и скрытия клавиатуры
function confirmPrice() {
    const priceInput = document.getElementById('card-price');
    priceInput.blur(); // Скрываем клавиатуру
}

// Функция для подтверждения цены
function confirmPrice() {
    const priceInput = document.getElementById('card-price');
    const confirmButton = document.getElementById('confirm-price-button');
    const editButton = document.getElementById('edit-price-button');

    // Блокируем поле ввода
    priceInput.disabled = true;

    // Скрываем кнопку подтверждения и показываем кнопку редактирования
    confirmButton.classList.add('hidden');
    editButton.classList.remove('hidden');

    // Скрываем клавиатуру
    priceInput.blur();
}

// Функция для редактирования цены
function editPrice() {
    const priceInput = document.getElementById('card-price');
    const confirmButton = document.getElementById('confirm-price-button');
    const editButton = document.getElementById('edit-price-button');

    // Разблокируем поле ввода
    priceInput.disabled = false;

    // Показываем кнопку подтверждения и скрываем кнопку редактирования
    confirmButton.classList.remove('hidden');
    editButton.classList.add('hidden');

    // Фокусируемся на поле ввода, чтобы появилась клавиатура
    priceInput.focus();
}

function updateProfileStatistics() {
    const profileSection = document.getElementById('profile');
    profileSection.innerHTML = `
        <h1>Profile</h1>
        <div class="statistics">
            <p>Total Mined Purr: ${totalMinedPurr}</p>
            <p>Total Spent Purr: ${totalSpentPurr}</p>
            <p>Total Opened Boxes: ${totalOpenedBoxes}</p>
        </div>
    `;
}

// Инициализация приложения
if (window.Telegram && window.Telegram.WebApp) {
    const user = window.Telegram.WebApp.initDataUnsafe.user;

    if (user) {
        const welcomeMessage = `Welcome, ${user.first_name || "User"}!`;
        document.getElementById('welcome-text').textContent = welcomeMessage;
    }
}

// Привязка событий к кнопкам
document.getElementById('mining-button').addEventListener('click', startMining);
document.getElementById('get-card-button').addEventListener('click', getWelcomeCard);
document.getElementById('toggle-boxes').addEventListener('click', () => showMarketSection('boxes'));
document.getElementById('toggle-upgrades').addEventListener('click', () => showMarketSection('upgrades'));
