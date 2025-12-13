// Основное приложение менеджера паролей

class PasswordManager {
    constructor() {
        this.passwords = [];
        this.deferredPrompt = null;
        this.init();
    }

    // Инициализация приложения
    init() {
        this.loadPasswords();
        this.setupEventListeners();
        this.updatePasswordList();
        this.setupServiceWorker();
        this.setupInstallPrompt();

        console.log('=== PWA MOBILE DIAGNOSTICS ===');
        console.log('Touch support:', 'ontouchstart' in window);
        console.log('Screen size:', window.innerWidth, 'x', window.innerHeight);
        console.log('Pixel ratio:', window.devicePixelRatio);
        console.log('CSS loaded:', document.styleSheets.length > 0);
        console.log('Font Awesome loaded:', document.querySelector('.fa-lock') !== null);
    }

    // Загрузка паролей из localStorage
    loadPasswords() {
        const stored = localStorage.getItem('passwordManagerData');
        if (stored) {
            try {
                this.passwords = JSON.parse(stored);
            } catch (e) {
                console.error('Ошибка загрузки данных:', e);
                this.passwords = [];
            }
        }
    }

    // Сохранение паролей в localStorage
    savePasswords() {
        localStorage.setItem('passwordManagerData', JSON.stringify(this.passwords));
        this.updatePasswordCount();
    }

    // Обновление счетчика паролей
    updatePasswordCount() {
        const countElement = document.getElementById('passwordCount');
        if (countElement) {
            countElement.textContent = `(${this.passwords.length})`;
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Генерация пароля
        document.getElementById('generatePassword').addEventListener('click', () => this.generatePassword());
        
        // Копирование сгенерированного пароля
        document.getElementById('copyPassword').addEventListener('click', () => this.copyGeneratedPassword());
        
        // Изменение длины пароля
        const lengthSlider = document.getElementById('passwordLength');
        const lengthValue = document.getElementById('lengthValue');
        lengthSlider.addEventListener('input', () => {
            lengthValue.textContent = lengthSlider.value;
        });
        
        // Переключение видимости пароля
        document.getElementById('togglePassword').addEventListener('click', () => this.togglePasswordVisibility());
        
        // Использование сгенерированного пароля
        document.getElementById('useGeneratedPassword').addEventListener('click', () => this.useGeneratedPassword());
        
        // Форма добавления пароля
        document.getElementById('passwordForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Поиск паролей
        document.getElementById('searchInput').addEventListener('input', (e) => this.filterPasswords(e.target.value));
        
        // Кнопка удаления всех паролей
        document.getElementById('clearAll').addEventListener('click', () => this.showConfirmModal());
        
        // Модальное окно подтверждения удаления
        document.getElementById('confirmDelete').addEventListener('click', () => this.clearAllPasswords());
        document.getElementById('cancelDelete').addEventListener('click', () => this.hideConfirmModal());
        
        // Кнопка установки PWA
        const installButton = document.getElementById('installButton');
        if (installButton) {
            installButton.addEventListener('click', () => this.installPWA());
        }
    }

    // Установка PWA
    installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('Пользователь принял установку');
                    this.showNotification('Приложение успешно установлено!', 'success');
                    this.hideInstallButton();
                } else {
                    console.log('Пользователь отклонил установку');
                }
                this.deferredPrompt = null;
            });
        }
    }

    // Скрыть кнопку установки
    /*hideInstallButton() {
        const installButton = document.getElementById('installButton');
        if (installButton) {
            installButton.style.display = 'none';
        }
    }*/

    // Настройка подсказки установки PWA
    setupInstallPrompt() {
        const installButton = document.getElementById('installButton');
        const isYandexBrowser = /YaBrowser/.test(navigator.userAgent);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (!installButton) return;

        // Для Яндекс.Браузера на мобильных
        if (isYandexBrowser && isMobile) {
            installButton.innerHTML = '<i class="fas fa-mobile-alt"></i> Добавить на рабочий стол';
            installButton.style.display = 'flex';
            installButton.onclick = () => {
                this.showNotification(
                    'Используйте меню браузера (⋮) → "Добавить на рабочий стол"', 
                    'info',
                    5000
                );
            };
            return;
        }

        // Для десктопного Яндекс.Браузера
        if (isYandexBrowser && !isMobile) {
            installButton.style.display = 'flex';
            installButton.innerHTML = '<i class="fas fa-download"></i> Установить приложение';
            installButton.onclick = () => {
                this.showNotification(
                    'В Яндекс.Браузере PWA устанавливается автоматически при посещении сайта', 
                    'info'
                );
            };
            return;
        }

        // Скрыть кнопку по умолчанию
        if (installButton) {
            installButton.style.display = 'none';
        }
        
        // Отслеживание события beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('beforeinstallprompt event fired');
            
            // Предотвратить автоматическое отображение подсказки
            e.preventDefault();
            
            // Сохранить событие для использования позже
            this.deferredPrompt = e;
            
            // Показать кнопку установки
            if (installButton) {
                installButton.style.display = 'flex';
            }
            
            // Опционально: логировать информацию о событии
            console.log('Deferred prompt saved');
        });
        
        // Отслеживание успешной установки
        window.addEventListener('appinstalled', (evt) => {
            console.log('Приложение установлено');
            this.deferredPrompt = null;
            this.hideInstallButton();
        });
        
        // Проверить, установлено ли приложение уже
        this.checkIfAppInstalled();
    }

    // Проверить, установлено ли приложение
    checkIfAppInstalled() {
        // Проверка для standalone режима
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        
        // Проверка для iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isIOSInstalled = isIOS && window.navigator.standalone === true;
        
        if (isStandalone || isIOSInstalled) {
            console.log('Приложение уже установлено');
            this.hideInstallButton();
        }
    }

    // Генерация пароля
    generatePassword() {
        const length = parseInt(document.getElementById('passwordLength').value);
        const useUppercase = document.getElementById('uppercase').checked;
        const useLowercase = document.getElementById('lowercase').checked;
        const useNumbers = document.getElementById('numbers').checked;
        const useSymbols = document.getElementById('symbols').checked;
        
        let charset = '';
        if (useUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (useLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (useNumbers) charset += '0123456789';
        if (useSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        // Если ничего не выбрано, используются все символы
        if (charset === '') {
            charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        }
        
        let password = '';
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);
        
        for (let i = 0; i < length; i++) {
            password += charset[array[i] % charset.length];
        }
        
        document.getElementById('generatedPassword').value = password;
        this.showNotification('Пароль сгенерирован', 'success');
    }

    // Копирование сгенерированного пароля
    copyGeneratedPassword() {
        const passwordField = document.getElementById('generatedPassword');
        if (passwordField.value) {
            navigator.clipboard.writeText(passwordField.value)
                .then(() => this.showNotification('Пароль скопирован в буфер обмена', 'success'))
                .catch(err => {
                    console.error('Ошибка копирования: ', err);
                    this.showNotification('Не удалось скопировать пароль', 'error');
                });
        } else {
            this.showNotification('Сначала сгенерируйте пароль', 'error');
        }
    }

    // Переключение видимости пароля
    togglePasswordVisibility() {
        const passwordField = document.getElementById('password');
        const toggleIcon = document.getElementById('togglePassword').querySelector('i');
        
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            toggleIcon.className = 'far fa-eye-slash';
        } else {
            passwordField.type = 'password';
            toggleIcon.className = 'far fa-eye';
        }
    }

    // Использование сгенерированного пароля
    useGeneratedPassword() {
        const generatedPassword = document.getElementById('generatedPassword').value;
        if (generatedPassword) {
            document.getElementById('password').value = generatedPassword;
            this.showNotification('Сгенерированный пароль добавлен в форму', 'success');
        } else {
            this.showNotification('Сначала сгенерируйте пароль', 'error');
        }
    }

    // Обработка отправки формы
    handleFormSubmit(e) {
        e.preventDefault();
        
        const url = document.getElementById('url').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const notes = document.getElementById('notes').value.trim();
        
        if (!url || !username || !password) {
            this.showNotification('Заполните обязательные поля', 'error');
            return;
        }
        
        const newPassword = {
            id: Date.now(),
            url,
            username,
            password,
            notes,
            createdAt: new Date().toISOString()
        };
        
        this.passwords.unshift(newPassword);
        this.savePasswords();
        this.updatePasswordList();
        this.resetForm();
        
        this.showNotification('Пароль успешно сохранен', 'success');
    }

    // Сброс формы
    resetForm() {
        document.getElementById('passwordForm').reset();
        document.getElementById('password').type = 'password';
        document.getElementById('togglePassword').querySelector('i').className = 'far fa-eye';
    }

    // Обновление списка паролей
    updatePasswordList(filter = '') {
        const container = document.getElementById('passwordsContainer');
        
        if (this.passwords.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shield-alt"></i>
                    <p>Пока нет сохраненных паролей. Добавьте свой первый пароль!</p>
                </div>
            `;
            this.updatePasswordCount();
            return;
        }
        
        let filteredPasswords = this.passwords;
        if (filter) {
            const searchTerm = filter.toLowerCase();
            filteredPasswords = this.passwords.filter(p => 
                p.url.toLowerCase().includes(searchTerm) || 
                p.username.toLowerCase().includes(searchTerm) ||
                (p.notes && p.notes.toLowerCase().includes(searchTerm))
            );
        }
        
        if (filteredPasswords.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>По вашему запросу ничего не найдено</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredPasswords.map(password => this.createPasswordItem(password)).join('');
        
        // Обработчики для кнопок копирования и удаления
        container.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.copyPassword(e));
        });
        
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.deletePassword(e));
        });
        
        this.updatePasswordCount();
    }

    // Создание элемента пароля
    createPasswordItem(password) {
        const date = new Date(password.createdAt);
        const formattedDate = date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        return `
            <div class="password-item" data-id="${password.id}">
                <div class="password-header">
                    <div class="password-title">${this.escapeHtml(password.url)}</div>
                    <div class="password-actions">
                        <button class="copy-btn" title="Копировать пароль">
                            <i class="far fa-copy"></i>
                        </button>
                        <button class="delete-btn" title="Удалить">
                            <i class="far fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="password-details">
                    <div class="detail-item">
                        <div class="detail-label">Логин:</div>
                        <div class="detail-value">${this.escapeHtml(password.username)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Добавлен:</div>
                        <div class="detail-value">${formattedDate}</div>
                    </div>
                </div>
                <div class="password-details">
                    <div class="detail-item">
                        <div class="detail-label">Пароль:</div>
                        <div class="password-value">
                            <span>••••••••</span>
                            <button class="copy-btn">
                                <i class="far fa-copy"></i> Копировать
                            </button>
                        </div>
                    </div>
                    ${password.notes ? `
                    <div class="detail-item">
                        <div class="detail-label">Примечания:</div>
                        <div class="detail-value">${this.escapeHtml(password.notes)}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Фильтрация паролей
    filterPasswords(searchTerm) {
        this.updatePasswordList(searchTerm);
    }

    // Копирование пароля
    copyPassword(e) {
        const passwordItem = e.target.closest('.password-item');
        const passwordId = parseInt(passwordItem.dataset.id);
        const password = this.passwords.find(p => p.id === passwordId);
        
        if (password) {
            navigator.clipboard.writeText(password.password)
                .then(() => this.showNotification('Пароль скопирован в буфер обмена', 'success'))
                .catch(err => {
                    console.error('Ошибка копирования: ', err);
                    this.showNotification('Не удалось скопировать пароль', 'error');
                });
        }
    }

    // Удаление пароля
    deletePassword(e) {
        const passwordItem = e.target.closest('.password-item');
        const passwordId = parseInt(passwordItem.dataset.id);
        
        this.passwords = this.passwords.filter(p => p.id !== passwordId);
        this.savePasswords();
        this.updatePasswordList();
        
        this.showNotification('Пароль удален', 'success');
    }

    // Показать модальное окно подтверждения
    showConfirmModal() {
        document.getElementById('confirmModal').style.display = 'flex';
    }

    // Скрыть модальное окно подтверждения
    hideConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
    }

    // Удалить все пароли
    clearAllPasswords() {
        this.passwords = [];
        this.savePasswords();
        this.updatePasswordList();
        this.hideConfirmModal();
        this.showNotification('Все пароли удалены', 'success');
    }

    // Показать уведомление
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Экранирование HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Настройка Service Worker
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                const swUrl = 'service-worker.js';
                
                navigator.serviceWorker.register(swUrl)
                    .then(registration => {
                        console.log('ServiceWorker зарегистрирован успешно:', registration);
                        
                        // Проверить обновления
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            console.log('Найдено обновление ServiceWorker');
                            
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed') {
                                    if (navigator.serviceWorker.controller) {
                                        console.log('Новая версия доступна. Перезагрузите страницу.');
                                        this.showNotification('Доступно обновление приложения', 'info');
                                    }
                                }
                            });
                        });
                    })
                    .catch(error => {
                        console.log('Ошибка регистрации ServiceWorker:', error);
                    });
                    
                // Проверить, контролирует ли Service Worker страницу
                if (navigator.serviceWorker.controller) {
                    console.log('Страница контролируется ServiceWorker');
                }
                
                // Отслеживать изменения Service Worker
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('Контроллер ServiceWorker изменился');
                });
            });
        }
    }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    const app = new PasswordManager();
    
    // Генерирация паролей при загрузке
    app.generatePassword();
    
    // Обновление списка паролей
    app.updatePasswordList();
});