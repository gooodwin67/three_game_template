export class EventEmitter {
 constructor() {
  this.events = {};
 }

 // Подписаться на событие
 on(event, listener) {
  if (!this.events[event]) {
   this.events[event] = [];
  }
  this.events[event].push(listener);
 }

 // Отписаться от события (важно для очистки памяти)
 off(event, listenerToRemove) {
  if (!this.events[event]) return;
  this.events[event] = this.events[event].filter(
   (listener) => listener !== listenerToRemove
  );
 }

 // Вызвать событие (можно передать данные data)
 emit(event, data) {
  if (this.events[event]) {
   this.events[event].forEach((listener) => listener(data));
  }
 }
}