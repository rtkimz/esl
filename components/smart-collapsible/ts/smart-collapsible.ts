import {SmartPopup, PopupActionParams} from '../../smart-popup/ts/smart-popup';

import {attr} from '../../smart-element/smart-element';
import {afterNextRender} from '../../smart-utils/async/raf';

export interface CollapsibleActionParams extends PopupActionParams {
	noAnimation?: boolean;
}

export class SmartCollapsible extends SmartPopup {
	public static is = 'smart-collapsible';
	public static eventNs = 'esl:collapsible';

	@attr({defaultValue: 'open'}) public activeClass: string;
    @attr({defaultValue: 'animate'}) public animateClass: string;
    @attr({defaultValue: 'fade-animate'}) public postAnimateClass: string;
    @attr({defaultValue: 'auto'}) public fallbackDuration: number;

	protected initialHeight: number;

	protected bindEvents() {
		super.bindEvents();
		this.addEventListener('transitionend', this.onTransitionEnd);
    }

	protected unbindEvents() {
		super.unbindEvents();
		this.removeEventListener('transitionend', this.onTransitionEnd);
	}

	protected onShow(params: CollapsibleActionParams) {
        super.onShow(params);
        this.initialHeight = this.scrollHeight;
        // Skip max-height animation
		if (params.noAnimation) return;
        this.beforeAnimate(params);
        this.onAnimate('show', params);
		(this.fallbackDuration >= 0) && setTimeout(this.onTransitionEnd, this.fallbackDuration);
    }

	protected onHide(params: CollapsibleActionParams) {
		this.initialHeight = this.scrollHeight;
		super.onHide(params);
        // Skip max-height animation
        if (params.noAnimation) return;
        this.beforeAnimate(params);
		this.onAnimate('hide', params);
		// this.afterAnimate();
		(this.fallbackDuration >= 0) && setTimeout(this.onTransitionEnd, this.fallbackDuration);
	}

	protected onTransitionEnd = (e?: TransitionEvent) => {
		if (!e || e.propertyName === 'max-height') {
			this.style.removeProperty('max-height');
            this.afterAnimate();
		}
	};

    protected beforeAnimate(params: CollapsibleActionParams) {
        this.animateClass && this.classList.add(this.animateClass);
        this.postAnimateClass && afterNextRender(() => this.classList.add(this.postAnimateClass));
    }

    protected onAnimate(action: string, params: CollapsibleActionParams) {
        // set initial height
        this.style.setProperty('max-height', `${action === 'hide' ? this.initialHeight : 0}px`);
        // make sure that browser apply initial height for animation
        afterNextRender(() => {
            this.style.setProperty('max-height', `${action === 'hide' ? 0 : this.initialHeight}px`);
        });
    }

    protected afterAnimate() {
        this.animateClass && this.classList.remove(this.animateClass);
        this.postAnimateClass && this.classList.remove(this.postAnimateClass);
        this.dispatchCustomEvent('transitionend', {
            detail: { open: this.open }
        });
    }
}