import * as THREE from "three";

export class ScreenManager {
  constructor(gameContext) {
    this.events = gameContext.events;
    this.screens = document.querySelectorAll('.screen');
    this.currentScreen = null;

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