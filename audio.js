import * as THREE from 'three';

export class AudioClass {
  constructor() {

    this.takeAudio;


    this._attached = false;
    this.listener = new THREE.AudioListener();
    this.musicOn = true;

    this.musics = [];


  }

  hardStopAll() {
    // останавливаем всё, что есть
    this.musics.forEach(({ music }) => {
      try { music.stop(); } catch { }
    });
    this.quacks.forEach(s => { try { s.stop(); } catch { } });
    this.thundersAudio.forEach(t => { try { t.music.stop(); } catch { } });

    // пустим очередь возобновления паузы
    this.musicNowPlaying = [];
  }

  toggleMute(isMuted) {
    if (isMuted) {
      // При выключении — останавливаем полностью аудио поток
      this.musicOn = false;
      this.listener.context.suspend();
    } else {
      // При включении — возобновляем
      this.musicOn = true;
      this.listener.context.resume();
      this.playMusic(['back']);
    }
  }

  isMuted() {
    return this.listener.context.state === 'suspended';
  }

  attachTo(camera) {
    if (this._attached) return;
    camera.add(this.listener);
    this._attached = true;
  }


  async loadAudio() {
    const loader = new THREE.AudioLoader();
    const sounds = [

      { key: 'takeAudio', name: 'take', path: 'audio/take.mp3', loop: false, ref: 200, vol: 2 },

    ];

    // Загружаем все буферы параллельно
    const buffers = await Promise.all(
      sounds.map(s => loader.loadAsync(s.path).catch(err => {
        console.error(`Ошибка при загрузке ${s.path}:`, err);
        return null;
      }))
    );

    // Присваиваем и создаём объекты
    buffers.forEach((buffer, i) => {
      const s = sounds[i];
      if (!buffer) return;

      const audio = new THREE.PositionalAudio(this.listener);
      audio.setBuffer(buffer);
      audio.setLoop(s.loop);
      audio.setRefDistance(s.ref);
      audio.setVolume(s.vol);
      if (s.rate) audio.setPlaybackRate(s.rate);
      // сохраняем в поле класса (например this.thunderAudio)
      this[s.key] = audio;
      // добавляем в общие массивы
      this.musics.push({ name: s.name, music: audio });
    });
  }


  stopMusic(musics) {
    if (this.musicOn) {
      if (musics == 0) {
        this.musics.forEach((value, index, array) => {
          value['music'].stop();
        })
      }
      else {
        musics.forEach((value, index, array) => {
          this.musics.find((el) => el['name'] === value)['music'].stop();
        })
      }
    }
  }

  pauseMusic(musics) {
    if (this.musicOn) {
      musics.forEach((value, index, array) => {
        this.musics.find((el) => el['name'] === value)['music'].pause();
      })
    }
  }

  playMusic(musics) {
    musics.forEach((value, index, array) => {
      let mus = this.musics.find((el) => el['name'] === value)['music'];
      if (!mus.isPlaying && this.musicOn) mus.play();
    })

  }

  togglePauseAll(isPaused) {
    if (this.musicOn) {
      if (isPaused) {
        // Если включили паузу — создаём пустой список и запоминаем, что играло
        this.musicNowPlaying = [];
        this.musics.forEach(({ music }) => {
          if (music.isPlaying) {
            music.pause();
            this.musicNowPlaying.push(music);
          }
        });
      } else {
        // Если снимаем паузу — возобновляем только те, что играли
        if (this.musicNowPlaying && this.musicNowPlaying.length) {
          this.musicNowPlaying.forEach((playingMusic) => {
            if (!playingMusic.isPlaying) playingMusic.play();
          });
          // очищаем после восстановления, чтобы не было накопления ссылок
          this.musicNowPlaying = [];
        }
      }
    }
  }


}