// Переменные
let userCards = [];
let tokens = 0;
let miningActive = false;
let miningEndTime = 0;
let marketListings = [];
let selectedCardIndex = null;
let currentPurchaseIndex = null;
let totalMinedPurr = 0;
let totalSpentPurr = 0;
let totalOpenedBoxes = 0;
let hasWelcomeCard = false; // Флаг для приветственной карточки

// Mining upgrades
let miningUpgrades = [
    { level: 1, cost: 1000, bonus: 10, purchased: false },
    { level: 2, cost: 5000, bonus: 10, purchased: false },
    { level: 3, cost: 10000, bonus: 5, purchased: false }
];
let miningEfficiency = 0;
let currentUpgradeIndex = 0;

// Mining speed upgrades
let miningSpeedUpgrades = [
    { level: 1, cost: 2000, bonus: 10, purchased: false }, // Уменьшает время на 10%
    { level: 2, cost: 5000, bonus: 20, purchased: false }, // Уменьшает время на 20%
    { level: 3, cost: 10000, bonus: 30, purchased: false }  // Уменьшает время на 30%
];
let currentMiningSpeedUpgradeIndex = 0;
let miningSpeedBonus = 0;

// DOM Elements
const tokenDisplay = document.getElementById('token-count');
const miningButton = document.getElementById('mining-button');
const miningText = document.getElementById('mining-text');
const miningTimer = document.getElementById('mining-timer');
const getCardButton = document.getElementById('get-card-button');
const marketListingsContainer = document.getElementById('market-listings-container');

// ================== НОВЫЙ ФУНКЦИОНАЛ: УЛУЧШЕНИЕ СКОРОСТИ МАЙНИНГА ==================

// Функция для покупки улучшения скорости майнинга
function purchaseMiningSpeedUpgrade() {
    if (currentMiningSpeedUpgradeIndex >= miningSpeedUpgrades.length) {
        showNotification("Info", "Mining speed is fully upgraded!");
        return;
    }

    const currentUpgrade = miningSpeedUpgrades[currentMiningSpeedUpgradeIndex];
    if (tokens < currentUpgrade.cost) {
        showNotEnoughPurrModal();
        return;
    }

    tokens -= currentUpgrade.cost;
    tokenDisplay.textContent = tokens.toString();

    currentUpgrade.purchased = true;
    miningSpeedBonus += currentUpgrade.bonus;

    showNotification("Success", `Mining speed increased by ${currentUpgrade.bonus}%!`);
    currentMiningSpeedUpgradeIndex++;
    updateMiningSpeedUpgradeButton();
    saveProgress(); // Сохраняем прогресс
}

// Функция для обновления кнопки улучшения скорости майнинга
function updateMiningSpeedUpgradeButton() {
    const upgradeButton = document.getElementById('upgrade-mining-speed-button');
    if (currentMiningSpeedUpgradeIndex >= miningSpeedUpgrades.length) {
        upgradeButton.textContent = "Mining Speed Fully Upgraded!";
        upgradeButton.classList.add('disabled');
        return;
    }

    const currentUpgrade = miningSpeedUpgrades[currentMiningSpeedUpgradeIndex];
    upgradeButton.textContent = `Upgrade Mining Speed (Level ${currentUpgrade.level}): -${currentUpgrade.bonus}% (${currentUpgrade.cost} Purr)`;
    upgradeButton.classList.remove('disabled');
}

// Функция для расчета времени майнинга с учетом бонуса скорости
function getMiningDuration() {
    const baseDuration = 10 * 1000; // 10 секунд для теста (замените на 4 часа: 4 * 60 * 60 * 1000)
    return baseDuration * (1 - miningSpeedBonus / 100);
}

// ================== КОНЕЦ НОВОГО ФУНКЦИОНАЛА ==================

// ================== СОХРАНЕНИЕ ПРОГРЕССА ==================

// Функция для сохранения данных в облачное хранилище
function saveProgress() {
    const data = {
        tokens: tokens,
        userCards: userCards,
        totalMinedPurr: totalMinedPurr,
        totalSpentPurr: totalSpentPurr,
        totalOpenedBoxes: totalOpenedBoxes,
        miningActive: miningActive,
        miningEndTime: miningEndTime,
        hasWelcomeCard: hasWelcomeCard,
        miningEfficiency: miningEfficiency,
        currentUpgradeIndex: currentUpgradeIndex,
        miningSpeedBonus: miningSpeedBonus,
        currentMiningSpeedUpgradeIndex: currentMiningSpeedUpgradeIndex
    };

    Telegram.WebApp.CloudStorage.setItem('userProgress', JSON.stringify(data), function(error) {
        if (error) {
            console.error('Error saving progress:', error);
        } else {
            console.log('Progress saved successfully');
        }
    });
}

// Функция для загрузки данных из облачного хранилища
function loadProgress() {
    Telegram.WebApp.CloudStorage.getItem('userProgress', function(error, value) {
        if (error) {
            console.error('Error loading progress:', error);
        } else if (value) {
            const data = JSON.parse(value);
            tokens = data.tokens || 0;
            userCards = data.userCards || [];
            totalMinedPurr = data.totalMinedPurr || 0;
            totalSpentPurr = data.totalSpentPurr || 0;
            totalOpenedBoxes = data.totalOpenedBoxes || 0;
            miningActive = data.miningActive || false;
            miningEndTime = data.miningEndTime || 0;
            hasWelcomeCard = data.hasWelcomeCard || false;
            miningEfficiency = data.miningEfficiency || 0;
            currentUpgradeIndex = data.currentUpgradeIndex || 0;
            miningSpeedBonus = data.miningSpeedBonus || 0;
            currentMiningSpeedUpgradeIndex = data.currentMiningSpeedUpgradeIndex || 0;

            // Обновляем интерфейс
            updateUI();

            // Проверяем, завершен ли майнинг
            if (miningActive && Date.now() >= miningEndTime) {
                miningActive = false; // Майнинг завершен
                saveProgress(); // Сохраняем обновленное состояние
                showClaimButton(); // Показываем кнопку "Claim"
            } else if (miningActive) {
                // Майнинг еще активен, запускаем таймер
                const timeLeft = miningEndTime - Date.now();
                startMiningTimer(timeLeft);
            }
        }
    });
}

// ================== МАЙНИНГ ==================

// Функция для запуска майнинга
function startMining() {
    if (!miningActive) {
        miningActive = true;
        miningEndTime = Date.now() + getMiningDuration(); // Время майнинга с учетом бонуса скорости
        saveProgress(); // Сохраняем состояние майнинга

        miningButton.classList.add('disabled');
        miningText.textContent = "Mining...";
        miningTimer.classList.remove('hidden');
        miningButton.onclick = null;

        startMiningTimer(getMiningDuration());
    }
}

// Функция для запуска таймера майнинга
function startMiningTimer(duration) {
    const timer = setInterval(() => {
        const timeLeft = miningEndTime - Date.now();
        if (timeLeft <= 0) {
            clearInterval(timer);
            showClaimButton();
        } else {
            const seconds = Math.floor(timeLeft / 1000);
            miningTimer.textContent = `${seconds}s`;
        }
    }, 1000);
}

// Функция для показа кнопки "Claim"
function showClaimButton() {
    miningText.textContent = "Claim";
    miningTimer.classList.add('hidden');
    miningTimer.textContent = "";
    miningButton.classList.remove('disabled');

    // Удаляем старый обработчик, если он есть
    miningButton.onclick = null;

    // Привязываем кнопку к функции claimTokens
    miningButton.onclick = function() {
        claimTokens();
    };

    // Добавляем количество токенов для сбора
    const tokenAmount = document.createElement('span');
    tokenAmount.id = 'token-amount';
    tokenAmount.textContent = `+${calculateMiningReward(120)} Purr`;
    miningButton.appendChild(tokenAmount);
}

// Функция для сбора токенов
function claimTokens() {
    if (Date.now() >= miningEndTime) {
        const baseReward = 120;
        const totalReward = calculateMiningReward(baseReward);
        animateTokenIncrement(totalReward);

        totalMinedPurr += totalReward;
        updateProfileStatistics();

        // Сбрасываем состояние майнинга
        miningActive = false;
        miningEndTime = 0;
        saveProgress(); // Сохраняем прогресс

        // Обновляем интерфейс
        miningText.textContent = "Mining";
        miningButton.classList.remove('disabled');
        miningButton.onclick = function() {
            startMining();
        };

        // Удаляем элемент с количеством токенов
        const tokenAmount = document.getElementById('token-amount');
        if (tokenAmount) {
            tokenAmount.remove();
        }
    }
}

// Функция для расчета награды за майнинг
function calculateMiningReward(baseReward) {
    return baseReward * (1 + miningEfficiency / 100);
}

// ================== ПРИВЕТСТВЕННАЯ КАРТОЧКА ==================

function getWelcomeCard() {
    if (hasWelcomeCard) {
        showNotification("Info", "You have already received your welcome card.");
        return;
    }

    const welcomeCard = { type: "welcome", content: "🎉", owner: "user" };
    userCards.push(welcomeCard);
    hasWelcomeCard = true;
    saveProgress();

    updateCardsList();
    updateCardsToSell();
    showModal();

    // Скрываем кнопку после получения карточки
    const getCardButton = document.getElementById('get-card-button');
    getCardButton.classList.add('hidden');
}

// ================== ОСТАЛЬНЫЕ ФУНКЦИИ ==================

// Остальные функции (ваш текущий код)
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
        updateMiningSpeedUpgradeButton();
    }
}

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

function purchaseUpgrade() {
    if (currentUpgradeIndex >= miningUpgrades.length) {
        showNotification("Info", "Mining is fully upgraded!");
        return;
    }

    const currentUpgrade = miningUpgrades[currentUpgradeIndex];
    if (tokens < currentUpgrade.cost) {
        showNotEnoughPurrModal();
        return;
    }

    tokens -= currentUpgrade.cost;
    tokenDisplay.textContent = tokens.toString();

    currentUpgrade.purchased = true;
    miningEfficiency += currentUpgrade.bonus;

    showNotification("Success", `Mining efficiency increased by ${currentUpgrade.bonus}%!`);
    currentUpgradeIndex++;
    updateUpgradeButton();
    saveProgress(); // Сохраняем прогресс
}

function updateCardsList() {
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = "";

    userCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.innerHTML = `
            <div class="card-content">${card.content}</div>
            <button class="sell-button hidden" onclick="sellSelectedCard(event)">Sell</button>
        `;

        cardElement.addEventListener('click', () => selectCard(cardElement));

        cardsContainer.appendChild(cardElement);
    });
}

function showModal() {
    const modal = document.getElementById('card-modal');
    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('card-modal');
    modal.classList.add('hidden');
}

function showPurrModal() {
    const modal = document.getElementById('purr-modal');
    modal.classList.remove('hidden');
}

function closePurrModal() {
    const modal = document.getElementById('purr-modal');
    modal.classList.add('hidden');
}

function showNotEnoughPurrModal() {
    const modal = document.getElementById('not-enough-purr-modal');
    modal.classList.remove('hidden');
}

function closeNotEnoughPurrModal() {
    const modal = document.getElementById('not-enough-purr-modal');
    modal.classList.add('hidden');
}

function showSuccessListingModal() {
    const modal = document.getElementById('success-listing-modal');
    modal.classList.remove('hidden');
}

function closeSuccessListingModal() {
    const modal = document.getElementById('success-listing-modal');
    modal.classList.add('hidden');
}

function showCancelSaleModal() {
    const modal = document.getElementById('cancel-sale-modal');
    modal.classList.remove('hidden');
}

function closeCancelSaleModal() {
    const modal = document.getElementById('cancel-sale-modal');
    modal.classList.add('hidden');
}

function showSuccessPurchaseModal() {
    const modal = document.getElementById('success-purchase-modal');
    modal.classList.remove('hidden');
}

function closeSuccessPurchaseModal() {
    const modal = document.getElementById('success-purchase-modal');
    modal.classList.add('hidden');
}

function showNoCardSelectedModal() {
    const modal = document.getElementById('no-card-selected-modal');
    modal.classList.remove('hidden');
}

function closeNoCardSelectedModal() {
    const modal = document.getElementById('no-card-selected-modal');
    modal.classList.add('hidden');
}

function showInvalidPriceModal() {
    const modal = document.getElementById('invalid-price-modal');
    modal.classList.remove('hidden');
}

function closeInvalidPriceModal() {
    const modal = document.getElementById('invalid-price-modal');
    modal.classList.add('hidden');
}

function calculateMiningReward(baseReward) {
    return baseReward * (1 + miningEfficiency / 100);
}

function animateTokenIncrement(amount) {
    const targetTokens = tokens + amount;
    const incrementDuration = 1000;
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
    }, 16);
}

function buyBox(cost) {
    if (tokens >= cost) {
        tokens -= cost;
        tokenDisplay.textContent = tokens.toString();

        totalSpentPurr += cost;
        totalOpenedBoxes += 1;
        updateProfileStatistics();

        const randomCard = getRandomCard();
        userCards.push(randomCard);
        updateCardsList();
        updateCardsToSell();
        showModalWithCard(randomCard.content);
        saveProgress(); // Сохраняем прогресс
    } else {
        showPurrModal();
    }
}

function getRandomCard() {
    const cards = ["🃏", "🌟", "⚡", "🔥", "💎", "🍀", "🐱", "🐾", "✨"];
    const randomIndex = Math.floor(Math.random() * cards.length);
    return { type: "random", content: cards[randomIndex], owner: "user" };
}

function showModalWithCard(cardContent) {
    const modalCard = document.querySelector(".card-modal-card");
    modalCard.textContent = cardContent;

    const modal = document.getElementById('card-modal');
    modal.classList.remove('hidden');
}

function updateCardsToSell() {
    const cardsToSellContainer = document.getElementById('cards-to-sell');
    cardsToSellContainer.innerHTML = "";

    userCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-to-sell';
        cardElement.textContent = card.content;

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

function sellCard() {
    if (selectedCardIndex === null) {
        showNoCardSelectedModal();
        return;
    }

    const price = parseInt(document.getElementById('card-price').value);
    if (isNaN(price) || price < 1 || !Number.isInteger(price)) {
        showInvalidPriceModal();
        return;
    }

    const cardToSell = userCards[selectedCardIndex];
    userCards.splice(selectedCardIndex, 1);

    const sellerUsername = Telegram.WebApp.initDataUnsafe.user?.username || "Anonymous";
    marketListings.unshift({ card: cardToSell, price: price, owner: "user", sellerUsername: sellerUsername });

    updateCardsToSell();
    updateMarketListings();
    updateCardsList();

    showSuccessListingModal();
    closeSellCardModal();
    saveProgress(); // Сохраняем прогресс
}

function cancelSale(listingIndex) {
    if (listingIndex === null || listingIndex === undefined) {
        showNotification("Error", "Please select a listing to cancel.");
        return;
    }

    const listing = marketListings[listingIndex];

    if (listing.owner !== "user") {
        showNotification("Error", "You can only cancel your own listings.");
        return;
    }

    userCards.push(listing.card);
    marketListings.splice(listingIndex, 1);

    updateMarketListings();
    updateCardsList();
    updateCardsToSell();

    showCancelSaleModal();
    saveProgress(); // Сохраняем прогресс
}

function updateMarketListings() {
    marketListingsContainer.innerHTML = "";

    marketListings.sort((a, b) => a.price - b.price);

    marketListings.forEach((listing, index) => {
        const listingElement = document.createElement('div');
        listingElement.className = 'market-listing';

        listingElement.innerHTML = `
            <div class="card-content">${listing.card.content}</div>
            <div class="card-price">${listing.price} Purr</div>
            <div class="seller-info">
                <span class="seller-icon">👤</span>
                <span class="seller-username">@${listing.sellerUsername}</span>
            </div>
            <button onclick="openPurchaseConfirmModal(${index})">Buy</button>
        `;

        if (listing.owner === "user") {
            const cancelButton = document.createElement('button');
            cancelButton.textContent = "Cancel Sale";
            cancelButton.className = 'cancel-sale-button';
            cancelButton.onclick = () => cancelSale(index);
            listingElement.appendChild(cancelButton);
        }

        marketListingsContainer.appendChild(listingElement);
    });
}

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

function confirmPurchase() {
    if (currentPurchaseIndex !== null) {
        buyMarketCard(currentPurchaseIndex);
        closePurchaseConfirmModal();
    }
}

function closePurchaseConfirmModal() {
    const purchaseModal = document.getElementById('purchase-confirm-modal');
    purchaseModal.classList.add('hidden');
    currentPurchaseIndex = null;
}

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
    showSuccessPurchaseModal();
    saveProgress(); // Сохраняем прогресс
}

function showNotification(title, message) {
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.showAlert(`${title}: ${message}`);
    } else {
        alert(`${title}: ${message}`);
    }
}

function closeNotificationModal() {
    const notificationModal = document.getElementById('notification-modal');
    notificationModal.classList.add('hidden');
}

function openSellCardModal() {
    selectedCardIndex = null;
    updateCardsToSell();
    const modal = document.getElementById('sell-card-modal');
    modal.classList.remove('hidden');
    modal.scrollTop = 0;
}

function closeSellCardModal() {
    const modal = document.getElementById('sell-card-modal');
    modal.classList.add('hidden');
}

let selectedCard = null;

function selectCard(card) {
    document.querySelectorAll('.sell-button').forEach(button => {
        button.classList.add('hidden');
    });

    const sellButton = card.querySelector('.sell-button');
    sellButton.classList.remove('hidden');

    selectedCard = card;
}

document.addEventListener('click', (event) => {
    if (selectedCard && !selectedCard.contains(event.target)) {
        const sellButton = selectedCard.querySelector('.sell-button');
        if (sellButton) {
            sellButton.classList.add('hidden');
        }
        selectedCard = null;
    }
});

let selectedCardForSale = null;

function sellSelectedCard(event) {
    event.stopPropagation();

    selectedCardForSale = selectedCard;

    showSection('market');
    openSellCardModal();

    const sellButton = selectedCard.querySelector('.sell-button');
    if (sellButton) {
        sellButton.classList.add('hidden');
    }

    selectedCard = null;
}

function confirmPrice() {
    const priceInput = document.getElementById('card-price');
    priceInput.blur();
}

function editPrice() {
    const priceInput = document.getElementById('card-price');
    const confirmButton = document.getElementById('confirm-price-button');
    const editButton = document.getElementById('edit-price-button');

    priceInput.disabled = false;
    confirmButton.classList.remove('hidden');
    editButton.classList.add('hidden');
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

// Инициализация Telegram Web App
if (window.Telegram && window.Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.requestFullscreen();
    const user = Telegram.WebApp.initDataUnsafe.user;
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

// Загрузка прогресса при запуске приложения
loadProgress();
