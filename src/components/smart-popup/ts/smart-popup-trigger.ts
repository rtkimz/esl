import { isTouch } from '@helpers/device-utils';
import SmartPopup from './smart-popup';

const HOVER_HIDE_DELAY = isTouch() ? 0 : 1000;
const HOVER_SHOW_EVENT = isTouch() ? 'click' : 'mouseenter';
const HOVER_HIDE_EVENT = isTouch() ? 'click' : 'mouseleave';

export interface ISmartPopupTrigger extends HTMLElement {
  popup: SmartPopup;
}

class SmartPopupTrigger extends HTMLElement implements ISmartPopupTrigger {

  static get is() {
    return 'smart-popup-trigger';
  }

  static get observedAttributes() {
    return [
      'target-id',
      'event',
      'mode',
      'active',
      'show-delay',
      'hide-delay'
    ];
  }

  public popup: SmartPopup;

  protected showEvent = 'click';
  protected hideEvent = 'click';
  protected mode = 'toggle';
  protected showTimerId: number;
  protected hideTimerId: number;
  protected showDelay = 0;
  protected hideDelay = 0;
  protected activeAttr = 'active';

  protected attributeChangedCallback(attr: string, prevValue: string, value: string) {
    this._unbindEvents();
    switch (attr) {
      case 'target-id':
        this.setPopup(value);
        break;
      case 'active':
        this.setState();
        break;
      case 'event':
        this.setEvents(value);
        break;
      case 'mode':
        this.setMode(value);
        break;
      case 'show-delay':
        this.setShowDelay(value);
        break;
      case 'hide-delay':
        this.setHideDelay(value);
        break;
    }
    if (this.popup && this.showEvent && this.mode) {
      this._bindEvents();
    }
  }

  protected connectedCallback() {
    this.classList.add(SmartPopupTrigger.is);
    this.bindPopupEvents();
    this.bindHoverSubEvents();
  }

  protected disconnectedCallback() {
    this.unbindPopupEvents();
    this.unbindHoverSubEvents();
  }

  get isActive(): boolean {
    return this.hasAttribute(this.activeAttr);
  }

  protected setPopup(value: string) {
    this.unbindPopupEvents();
    if (value) {
      this.popup = document.getElementById(value) as SmartPopup;
      if (this.popup && this.popup.isOpen) {
        this.setAttribute(this.activeAttr, '');
      }
      this.bindPopupEvents();
    }
  }

  protected bindPopupEvents() {
    if (this.popup) {
      this.popup.addEventListener('show', this.onPopupShown);
      this.popup.addEventListener('hide', this.onPopupHidden);
    }
  }

  protected unbindPopupEvents() {
    if (this.popup) {
      this.popup.removeEventListener('show', this.onPopupShown);
      this.popup.removeEventListener('hide', this.onPopupHidden);
    }
  }

  protected onPopupShown = () => {
    this.setAttribute(this.activeAttr, '');
  };

  protected onPopupHidden = () => {
    this.removeAttribute(this.activeAttr);
  };

  protected setEvents(value: string) {
    value = value || 'click';
    switch (value) {
      case 'hover':
        this.showEvent = HOVER_SHOW_EVENT;
        this.hideEvent = HOVER_HIDE_EVENT;
        break;
      default:
        this.showEvent = this.hideEvent = value;
    }

    if (this.hideEvent === HOVER_HIDE_EVENT) {
      this.hideDelay = HOVER_HIDE_DELAY;
    }
  }

  protected setMode(value: string) {
    this.mode = value || 'toggle';
  }

  protected setState() {
    if (this.popup) {
      this.isActive ? this.popup.show() : this.popup.hide();
    }
  }

  protected setShowDelay(value: string) {
    this.showDelay = parseInt(value, 10) || 0;
  }

  protected setHideDelay(value: string) {
    this.hideDelay = parseInt(value, 10) || 0;
    if (this.hideEvent === HOVER_HIDE_EVENT) {
      this.hideDelay = HOVER_HIDE_DELAY;
    }
  }

  protected _bindEvents() {
    switch (this.mode) {
      case 'show':
        this.bindShowEvent();
        break;
      case 'hide':
        this.bindHideEvent();
        break;
      default:
        if (this.showEvent === this.hideEvent) {
          this.bindToggleEvent();
        } else {
          this.bindShowEvent();
          this.bindHideEvent();
        }
    }
    this.unbindHoverSubEvents();
    this.bindHoverSubEvents();
  }

  protected unbindHoverSubEvents() {
    if (this.popup) {
      this.popup.removeEventListener('mouseenter', this.onPopupMouseEnter);
      this.popup.removeEventListener('mouseleave', this.onPopupMouseLeave);
    }
  }

  protected bindHoverSubEvents() {
    if (this.popup && this.hideEvent === 'mouseleave') {
      this.popup.addEventListener('mouseenter', this.onPopupMouseEnter);
      this.popup.addEventListener('mouseleave', this.onPopupMouseLeave);
    }
  }

  protected onPopupMouseEnter = () => {
    clearTimeout(this.hideTimerId);
  };

  protected onPopupMouseLeave = (e: Event) => {
    this.hidePopup(e);
  };

  protected _unbindEvents() {
    this.removeEventListener(this.showEvent, this.togglePopup);
    this.removeEventListener(this.showEvent, this.showPopup);
    this.removeEventListener(this.hideEvent, this.hidePopup);
  }

  protected stopEventPropagation(e: Event) {
    if (this.popup.closeOnBodyClick && (this.showEvent === 'click' || this.hideEvent === 'click')) {
      e.stopPropagation();
    }
  }

  protected showPopup(e: Event) {
    this.stopEventPropagation(e);
    clearTimeout(this.hideTimerId);
    this.showTimerId = setTimeout(() => {
      this.popup.show();
    }, this.showDelay);
  }

  protected hidePopup(e: Event) {
    this.stopEventPropagation(e);
    clearTimeout(this.showTimerId);
    this.hideTimerId = setTimeout(() => {
      this.popup.hide();
    }, this.hideDelay);
  }

  protected togglePopup(e: Event) {
    this.stopEventPropagation(e);
    this.popup.toggle();
  }

  protected bindShowEvent() {
    this.addEventListener(this.showEvent, this.showPopup);
  }

  protected bindHideEvent() {
    this.addEventListener(this.hideEvent, this.hidePopup);
  }

  protected bindToggleEvent() {
    this.addEventListener(this.showEvent, this.togglePopup);
  }
}

customElements.define(SmartPopupTrigger.is, SmartPopupTrigger);
export default SmartPopupTrigger;
