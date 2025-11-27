// SdkManager.js
export class SdkManager {
    constructor(startGameCallback) {
        this.startGameCallback = startGameCallback;
        this.ysdk = null;

        // Сразу вешаем глобальные обработчики ошибок
        this._setupGlobalErrorListeners();
    }

    /**
     * Основной метод инициализации
     */
    init() {
        // Проверяем готовность DOM, как в оригинальном коде
        if (document.readyState === 'complete') {
            this._initYaGames();
        } else {
            window.addEventListener('load', () => {
                this._initYaGames();
            });
        }
    }

    showFullscreenAdv() {
        if (!this.ysdk) return;
        this.ysdk.adv.showFullscreenAdv({
            callbacks: {
                onClose: function(wasShown) {
                    // resume game logic
                },
                onError: function(error) {
                    // resume game logic (fallback)
                }
            }
        });
    }
    
    showRewardedVideo(callbacks) {
        if (!this.ysdk) return;
        this.ysdk.adv.showRewardedVideo({
            callbacks: {
                onOpen: () => {
                    // pause game audio/loop
                    callbacks.onOpen && callbacks.onOpen();
                },
                onRewarded: () => {
                    // give reward
                    callbacks.onRewarded && callbacks.onRewarded();
                },
                onClose: () => {
                    // resume game
                    callbacks.onClose && callbacks.onClose();
                },
                onError: (e) => {
                    console.error('Reward error:', e);
                    callbacks.onError && callbacks.onError(e);
                }
            }
        });
    }

    /**
     * Внутренняя логика загрузки SDK
     */
    _initYaGames() {
        if (typeof YaGames !== 'undefined') {
            YaGames.init()
                .then((ysdkInstance) => {
                    console.log('YaGames SDK initialized');
                    this.ysdk = ysdkInstance;
                    window.ysdk = ysdkInstance; // Для глобального доступа, если нужно
                    
                    // Запускаем игру
                    if (this.startGameCallback) {
                        this.startGameCallback(ysdkInstance);
                    }
                })
                .catch((error) => {
                    this.showInitError(error);
                });
        } else {
            // Если скрипт sdk.js не подключен или не загрузился
            // (В локальной разработке это нормально, если вы не используете мок)
            console.warn('YaGames is not defined (running in offline/dev mode?)');
            
            // Пробуем запустить игру без SDK (null)
            if (this.startGameCallback) {
                this.startGameCallback(null);
            }
        }
    }

    /**
     * Отображение ошибки на экране (Overlay)
     */
    showInitError(error) {
        let message = 'Init error';
        if (error) {
            if (error.message) message += ': ' + error.message;
            else message += ': ' + String(error);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this._renderInitError(message);
            }, { once: true });
        } else {
            this._renderInitError(message);
        }
    }

    /**
     * Отрисовка DOM-элемента ошибки
     */
    _renderInitError(message) {
        const container = document.body || document.documentElement;
        if (!container) return;

        let overlay = document.getElementById('debug-error-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'debug-error-overlay';
            overlay.className = 'debug_error_overlay';
            // Добавим базовые стили скриптом, чтобы не зависеть от CSS
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.background = 'rgba(0,0,0,0.85)';
            overlay.style.color = 'red';
            overlay.style.zIndex = '9999';
            overlay.style.padding = '20px';
            overlay.style.whiteSpace = 'pre-wrap';
            overlay.style.fontFamily = 'monospace';
            
            container.appendChild(overlay);
        }

        overlay.textContent = message;
    }

    /**
     * Настройка глобальных перехватчиков ошибок
     */
    _setupGlobalErrorListeners() {
        window.addEventListener('error', (event) => {
            if (!event) return;
            const parts = [];
            if (event.message) parts.push(event.message);
            if (event.filename) parts.push('at ' + event.filename + ':' + event.lineno + ':' + event.colno);
            if (event.error && event.error.stack) {
                parts.push(event.error.stack);
            }
            this.showInitError(parts.join('\n'));
        });

        window.addEventListener('unhandledrejection', (event) => {
            if (!event) return;
            const reason = event.reason || 'unhandledrejection';
            if (reason && reason.stack) {
                this.showInitError(reason.stack);
            } else {
                this.showInitError(String(reason));
            }
        });
    }
}