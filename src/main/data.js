import { t } from '../utils/i18n.js';

export class DataClass {
  constructor(gameContext) {

    this.events = gameContext.events;


    this.yandexPlayer = {
      id: 0,
      player: null,
      isAuthorized: false,
    };



  }


  async clearData() {
    localStorage.clear();
  }


  async initYandexPlayer({ force = false } = {}) {
    try {
      if (!this.yandexPlayer.player || force) {
        // Предполагаем, что ysdk глобален или передан иначе. 
        // В идеале ysdk тоже должен лежать в gameContext, но пока оставим как есть.
        if (typeof ysdk !== 'undefined') {
          this.yandexPlayer.player = await ysdk.getPlayer();
        }
      }
      if (this.yandexPlayer.player) {
        this.yandexPlayer.isAuthorized = await this.yandexPlayer.player.isAuthorized();
      }
    } catch (_) {
      this.yandexPlayer.isAuthorized = false;
    }

    this.events.emit('player_auth_checked', this.yandexPlayer.isAuthorized);

    if (this.yandexPlayer.isAuthorized) {
      console.log('DataClass: авторизовались');
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