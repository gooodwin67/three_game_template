export class ParamsClass {
 constructor() {
  this.gameInit = false;
  this.isMobileDevice = this.detectDevice();

  this.gameState = { menu: 1, play: 2, pause: 3 }

  this.currentGameState = this.gameState.menu;
 }

 setGameState(targetGameState) {
  this.currentGameState = targetGameState;
 }

 goToMenu() {
  this.setGameState(this.gameState.menu);
 }

 startGame() {
  this.setGameState(this.gameState.play);
 }

 pauseGame() {
  this.setGameState(this.gameState.pause);
 }

 resumeGame() {
  this.setGameState(this.gameState.play);
 }


 detectDevice() {
  let isMobile = window.matchMedia || window.msMatchMedia;
  if (isMobile) {
   let match_mobile = isMobile("(pointer:coarse)");
   return match_mobile.matches;
  }
  return false;
 }

 initCustomScroll() {
  const screens = [
   '.free_game_screen',
   '.levels_game_screen',
   '.levels_game_screen_contest',
   '.main_screen'
  ];

  let activeEl = null;            // текущий видимый экран (контейнер со скроллом)
  let progress = null;           // его же .scroll-progress
  let bar = null;           // и .scroll-progress__bar
  let dragging = false;
  let startY = 0, startScroll = 0;

  const getActiveScreen = () => {
   for (const sel of screens) {
    const el = document.querySelector(sel);
    if (el && !el.classList.contains('hidden_screen')) return el;
   }
   return null;
  };

  const bindToActive = () => {
   const nextEl = getActiveScreen();
   if (nextEl === activeEl) return;

   // отписываемся от старого
   if (activeEl) activeEl.removeEventListener('scroll', update, { passive: true });
   if (bar) {
    bar.removeEventListener('mousedown', onDown);
    bar.removeEventListener('touchstart', onDown);
   }

   // берём новый экран и его бар
   activeEl = nextEl;
   progress = activeEl ? activeEl.querySelector('.scroll-progress') : null;
   bar = progress ? progress.querySelector('.scroll-progress__bar') : null;

   if (activeEl) activeEl.addEventListener('scroll', update, { passive: true });
   if (bar) {
    bar.addEventListener('mousedown', onDown);
    bar.addEventListener('touchstart', onDown);
   }
   update(); // первичный пересчёт
  };

  const update = () => {
   if (!activeEl || !progress || !bar) return;

   const h = activeEl.clientHeight;
   const sh = activeEl.scrollHeight;
   const st = activeEl.scrollTop;

   // если скролла нет — прячем бар
   if (sh <= h + 1) {
    progress.classList.remove('visible');
    return;
   }
   progress.classList.add('visible');

   const trackH = progress.getBoundingClientRect().height;
   const minThumb = 24;
   const thumbH = Math.max((h / sh) * trackH, minThumb);
   const maxScroll = sh - h;
   const maxTop = trackH - thumbH;
   const topPx = maxScroll > 0 ? (st / maxScroll) * maxTop : 0;

   bar.style.height = `${thumbH}px`;
   bar.style.top = `${topPx}px`;
  };

  // drag для активного бара
  const onDown = (e) => {
   if (!activeEl || !bar) return;
   dragging = true;
   startY = e.touches ? e.touches[0].clientY : e.clientY;
   startScroll = activeEl.scrollTop;
   document.body.style.userSelect = 'none';
   e.preventDefault();
  };

  const onMove = (e) => {
   if (!dragging || !activeEl || !bar || !progress) return;
   const y = e.touches ? e.touches[0].clientY : e.clientY;
   const dy = y - startY;

   const trackH = progress.getBoundingClientRect().height;
   const h = activeEl.clientHeight;
   const sh = activeEl.scrollHeight;

   const denom = Math.max(1, (trackH - bar.offsetHeight));
   const ratio = (sh - h) / denom;
   activeEl.scrollTop = startScroll + dy * ratio;
  };

  const onUp = () => {
   dragging = false;
   document.body.style.userSelect = '';
  };

  // глобальные слушатели (одни на всё приложение)
  window.addEventListener('resize', () => { bindToActive(); update(); });
  window.addEventListener('mousemove', onMove, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);

  // следим за переключением экранов (класс hidden_screen меняется)
  const mo = new MutationObserver(() => { bindToActive(); });
  mo.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });

  // старт
  bindToActive();
 }
}