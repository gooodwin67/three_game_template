import { t } from './i18n.js';

export class DataClass {
  constructor() {


    this.yandexPlayer = {
      id: 0,
      player: null,
    };



  }


  async clearData() {
    localStorage.clear();
  }


  async initYandexPlayer({ force = false } = {}) {
    try {
      // 👇 при force переполучаем player, чтобы он был уже "авторизованный"
      if (!this.yandexPlayer.player || force) {
        this.yandexPlayer.player = await ysdk.getPlayer();
      }
      this.yandexPlayer.isAuthorized = await this.yandexPlayer.player.isAuthorized();
    } catch (_) {
      this.yandexPlayer.isAuthorized = false;
    }

    const autorizElement = document.querySelector('.autoriz');
    if (autorizElement) {
      // лог только когда реально авторизованы
      if (this.yandexPlayer.isAuthorized) {
        console.log('авторизовались');
      }
      // прячем баннер без перезагрузки
      autorizElement.classList.toggle('hidden_screen', this.yandexPlayer.isAuthorized === true);

      // на случай грязных стилей/анимаций — дубль через aria/display (не обязательно, но полезно)
      if (this.yandexPlayer.isAuthorized === true) {
        autorizElement.setAttribute('aria-hidden', 'true');
        autorizElement.style.display = 'none';
      }
    }
  }




  // --- 2. ПРОСТО: загрузить table из облака, без локала/слияний ---
  async loadTableFromCloud() {
    await this.initYandexPlayer();

    try {
      const cloud = await this.yandexPlayer.player.getData(['table']);
      if (cloud && cloud.table && typeof cloud.table === 'object') {
        // есть данные — используем их
        this.table = cloud.table;

      } else {
        // игрок впервые — создаём новую таблицу по умолчанию
        console.log('Первый вход: создаём новую table');
        this.table = this.createDefaultTable();
        await this.saveTableToCloud(); // сразу записываем базовую структуру в облако
      }
    } catch (error) {
      console.warn('Cloud load failed:', error);
      // если ошибка сети или SDK, создаём дефолт
      this.table = this.createDefaultTable();
    }

  }




  // дефолтная структура для нового игрока
  createDefaultTable() {
    return {
      updateDate: Date.now(),
      player: {
        levels: [0, 0, 0],
        bonusHat: [false, false, false],
      },

    };
  }




  // --- 3. ПРОСТО: сохранить table в облако ---
  async saveTableToCloud({ flush = false } = {}) {
    await this.initYandexPlayer();
    try {
      await this.yandexPlayer.player.setData({ /*table: this.table*/ }, flush);

    } catch (error) {
      console.warn('Cloud save failed:', error);
    }
  }
















}