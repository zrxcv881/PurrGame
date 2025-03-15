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

// Ключи для облачного хранилища
const USER_DATA_KEY = 'user_data'; // Для данных пользователя
const MARKET_LISTINGS_KEY = 'market_listings'; // Для общих объявлений

// Инициализация данных пользователя
function initUserData() {
    if (window.Telegram && window.Telegram.WebApp && Telegram.WebApp.CloudStorage) {
        Telegram.WebApp.CloudStorage.getItem(USER_DATA_KEY, (error, data) => {
            if (error) {
                console.error('Error loading user data:', error);
                return;
            }

            if (data) {
                const parsedData = JSON.parse(data);
                tokens = parsedData.tokens || 0;
                userCards = parsedData.userCards || [];
                totalMinedPurr = parsedData.totalMinedPurr || 0;
                totalSpentPurr = parsedData.totalSpentPurr || 0;
                totalOpenedBoxes = parsedData.totalOpenedBoxes || 0;
                miningEfficiency = parsedData.miningEfficiency || 0;
                currentUpgradeIndex = parsedData.currentUpgradeIndex || 0;
                miningUpgrades = parsedData.miningUpgrades || miningUpgrades;
            }

            updateUI();
        });
    }
}

// Сохранение данных пользователя
function saveUserData() {
    if (window.Telegram && window.Telegram.WebApp && Telegram.WebApp.CloudStorage) {
        const data = JSON.stringify({
            tokens,
            userCards,
            totalMinedPurr,
            totalSpentPurr,
            totalOpenedBoxes,
            miningEfficiency,
            currentUpgradeIndex,
            miningUpgrades
        });

        Telegram.WebApp.CloudStorage.setItem(USER_DATA_KEY, data, (error, success) => {
            if (error) {
                console.error('Error saving user data:', error);
            } else if (success) {
                console.log('User data saved successfully. Tokens:', tokens);
            }
        });
    }
}

// Загрузка общих объявлений
function fetchMarketListings() {
    if (window.Telegram && window.Telegram.WebApp && Telegram.WebApp.CloudStorage) {
        Telegram.WebApp.CloudStorage.getItem(MARKET_LISTINGS_KEY, (error, data) => {
            if (error) {
                console.error('Error loading market listings:', error);
                return;
            }

            if (data) {
                marketListings = JSON.parse(data);
            } else {
                marketListings = [];
            }

            updateMarketListings();
        });
    }
}

// Добавление объявления в общий список
function addMarketListing(listing) {
    if (window.Telegram && window.Telegram.WebApp && Telegram.WebApp.CloudStorage) {
        // Загружаем текущие объявления
        Telegram.WebApp.CloudStorage.getItem(MARKET_LISTINGS_KEY, (error, data) => {
            if (error) {
                console.error('Error loading market listings:', error);
                return;
            }

            let listings = [];
            if (data) {
                listings = JSON.parse(data);
            }

            // Добавляем новое объявление
            listings.unshift(listing);

            // Сохраняем обновленный список
            Telegram.WebApp.CloudStorage.setItem(MARKET_LISTINGS_KEY, JSON.stringify(listings), (error, success) => {
                if (error) {
                    console.error('Error saving market listings:', error);
                } else if (success) {
                    console.log('Market listing added successfully');
                    marketListings = listings;
                    updateMarketListings();
                }
            });
        });
    }
}

// Обновление интерфейса
function updateUI() {
    tokenDisplay.textContent = tokens.toString();
    updateCardsList();
    updateMarketListings();
    updateProfileStatistics();
}

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
    saveUserData();
}

function getWelcomeCard() {
    const welcomeCard = { type: "welcome", content: "🎉", owner: "user" };
    userCards.push(welcomeCard);
    updateCardsList();
    updateCardsToSell();
    showModal();
    saveUserData();
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

function startMining() {
    if (!miningActive) {
        miningActive = true;
        miningEndTime = Date.now() + 10 * 1000;
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

function calculateMiningReward(baseReward) {
    return baseReward * (1 + miningEfficiency / 100);
}

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

        // Обновляем переменную tokens сразу
        tokens += totalReward;
        totalMinedPurr += totalReward;

        // Запускаем анимацию
        animateTokenIncrement(totalReward);

        // Сохраняем данные после завершения анимации
        setTimeout(() => {
            saveUserData();
        }, 1000); // Задержка равна длительности анимации (1000 мс)

        updateProfileStatistics();
    }
}

function animateTokenIncrement(amount) {
    const targetTokens = tokens; // Уже обновлено в claimTokens
    const incrementDuration = 1000;
    const startTime = Date.now();

    const animation = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= incrementDuration) {
            tokenDisplay.textContent = targetTokens.toString();
            clearInterval(animation);
        } else {
            const progress = elapsedTime / incrementDuration;
            const currentTokens = Math.floor(tokens - amount + amount * progress);
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
        saveUserData();
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
    const listing = { card: cardToSell, price: price, owner: "user", sellerUsername: sellerUsername };

    // Добавляем объявление в общий список
    addMarketListing(listing);

    updateCardsToSell();
    updateCardsList();

    showSuccessListingModal();
    closeSellCardModal();
    saveUserData();
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
    saveUserData();
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
    saveUserData();
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

    const user = Telegram.WebApp.initDataUnsafe.user;
    if (user) {
        const welcomeMessage = `Welcome, ${user.first_name || "User"}!`;
        document.getElementById('welcome-text').textContent = welcomeMessage;
    }

    initUserData(); // Загружаем данные пользователя
    fetchMarketListings(); // Загружаем объявления с сервера
}

// Привязка событий к кнопкам
document.getElementById('mining-button').addEventListener('click', startMining);
document.getElementById('get-card-button').addEventListener('click', getWelcomeCard);
document.getElementById('toggle-boxes').addEventListener('click', () => showMarketSection('boxes'));
document.getElementById('toggle-upgrades').addEventListener('click', () => showMarketSection('upgrades'));
