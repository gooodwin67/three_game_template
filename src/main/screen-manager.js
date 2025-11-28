import * as THREE from "three";

export class ScreenManager {
  constructor(gameContext) {
    this.events = gameContext.events;
    this.screens = document.querySelectorAll('.screen');
    this.currentScreen = null;

    document.querySelector('body').addEventListener('click', (e) => {

      const btn = e.target.closest('.btn');
      if (!btn) return;

      const action = btn.dataset.action;

      switch (action) {

        case 'newGame':
          gameContext.ui.show('free_game_screen');
          break;
        case 'settings':
          gameContext.ui.show('settings_screen');
          break;
        case 'back':
          gameContext.ui.show('main_screen');
          break;
        case 'start_game_btn':
          gameContext.ui.hideAll();
          this.events.emit('start_match', true);
          break;
        case 'pause':
          // pauseGame();
          break;
      }
    });

    this.initListeners();
  }


  initListeners() {
    // Слушаем событие из DataClass
    this.events.on('player_auth_checked', (isAuthorized) => {
      this.updateAuthUI(isAuthorized);
    });
  }

  updateAuthUI(isAuthorized) {
    const autorizElement = document.querySelector('.autoriz');
    if (autorizElement) {
      autorizElement.classList.toggle('hidden_screen', isAuthorized === true);

      if (isAuthorized === true) {
        autorizElement.setAttribute('aria-hidden', 'true');
        autorizElement.style.display = 'none';
      } else {
        // Если вдруг разлогинились или не авторизованы
        autorizElement.setAttribute('aria-hidden', 'false');
        autorizElement.style.display = ''; // или block/flex
      }
    }
  }


  show(screenId) {
    const targetScreen = document.getElementById(screenId);

    if (!targetScreen) {
      console.warn(`Screen ${screenId} not found`);
      return;
    }

    this.screens.forEach(s => s.classList.remove('active'));

    targetScreen.classList.add('active');
    this.currentScreen = screenId;
  }

  hideAll() {
    this.screens.forEach(s => s.classList.remove('active'));
    this.currentScreen = null;
  }
}