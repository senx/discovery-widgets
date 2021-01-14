import { decorate } from '@storybook/addon-actions';

const eventProperties = [
  'bubbles',
  'cancelBubble',
  'cancelable',
  'composed',
  'currentTarget',
  'defaultPrevented',
  'detail',
  'eventPhase',
  'isTrusted',
  'path',
  'returnValue',
  'srcElement',
  'target',
  'timeStamp',
  'type',
];

const cloneEventObj = (eventObj, overrideObj = {}) => {
  class EventCloneFactory {
    constructor (override){
      for(const prop of eventProperties){
        this[prop] = eventObj[prop];
      }

      for(const prop in override){
        this[prop] = override[prop];
      }
    }
  }
  EventCloneFactory.prototype.constructor = eventObj.constructor;
  return new EventCloneFactory(overrideObj);
}

const uniqueId = (eventName) => `${eventName}-${(new Date()).getTime()}`;

export const customEvent = decorate([args => {
  const originalEvent = args[0];
  const ev = cloneEventObj(originalEvent, {
    id: uniqueId(originalEvent.type),
  });
  return [ev];
}]);
