export class ParamsClass {
 constructor() {
  this.gameInit = false;
  this.isMobileDevice = this.detectDevice();

  this.gameState = { menu: 0, play: 1, pause: 2 }
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