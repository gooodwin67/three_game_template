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
}