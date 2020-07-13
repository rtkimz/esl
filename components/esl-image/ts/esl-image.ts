/**
 * ESL Image
 * @version 2.2.0
 * @author Alexey Stsefanovich (ala'n), Yuliya Adamskaya
 */

import {Export} from '../../esl-utils/enviroment/export-ns';
import {ESLBaseElement, attr} from '../../esl-base-element/esl-base-element';
import {DeviceDetector} from '../../esl-utils/enviroment/device-detector';
import ESLMediaRuleList from '../../esl-utils/conditions/esl-media-rule-list';

/**
 * Describe mods configurations
 */
interface ESLImageRenderStrategy {
	/** Apply image from shadow loader */
	apply: (img: ESLImage, shadowImg: ShadowImageElement) => void;
	/** Clean strategy specific changes from ESLImage */
	clear?: (img: ESLImage) => void;
}

/**
 * Describes object that contains strategies mapping
 */
interface ESLImageStrategyMap {
	[mode: string]: ESLImageRenderStrategy;
}

/**
 * Mixed image element that used as shadow loader for ESLImage
 */
interface ShadowImageElement extends HTMLImageElement {
	dpr?: number
}

const STRATEGIES: ESLImageStrategyMap = {
	'cover': {
		apply(img, shadowImg) {
			const src = shadowImg.src;
			const isEmpty = !src || ESLImage.isEmptyImage(src);
			img.style.backgroundImage = isEmpty ? null : `url("${src}")`;
		},
		clear(img) {
			img.style.backgroundImage = null;
		}
	},
	'save-ratio': {
		apply(img, shadowImg) {
			const src = shadowImg.src;
			const isEmpty = !src || ESLImage.isEmptyImage(src);
			img.style.backgroundImage = isEmpty ? null : `url("${src}")`;
			if (shadowImg.width === 0) return;
			img.style.paddingTop = isEmpty ? null : `${(shadowImg.height * 100 / shadowImg.width)}%`;
		},
		clear(img) {
			img.style.paddingTop = null;
			img.style.backgroundImage = null;
		}
	},
	'fit': {
		apply(img, shadowImg) {
			img.attachInnerImage();
			img.innerImage.src = shadowImg.src;
			img.innerImage.removeAttribute('width');
		},
		clear(img) {
			img.removeInnerImage();
		}
	},
	'origin': {
		apply(img, shadowImg) {
			img.attachInnerImage();
			img.innerImage.src = shadowImg.src;
			img.innerImage.width = shadowImg.width / shadowImg.dpr;
		},
		clear(img) {
			img.removeInnerImage();
		}
	},
	'inner-svg': {
		apply(img, shadowImg) {
			const request = new XMLHttpRequest();
			request.open('GET', shadowImg.src, true);
			request.onreadystatechange = () => {
				if (request.readyState !== 4 || request.status !== 200) return;
				const tmp = document.createElement('div');
				tmp.innerHTML = request.responseText;
				Array.from(tmp.querySelectorAll('script') || [])
					.forEach((node: Element) => node.remove());
				img.innerHTML = tmp.innerHTML;
			};
			request.send();
		},
		clear(img) {
			img.innerHTML = '';
		}
	}
};

// Intersection Observer for lazy init functionality
let intersectionObserver: IntersectionObserver;

function getIObserver() {
	if (!intersectionObserver) {
		intersectionObserver = new IntersectionObserver(function intersectionCallback(entries) {
			(entries || []).forEach(function (entry) {
				if ((entry.isIntersecting || entry.intersectionRatio > 0) && entry.target instanceof ESLImage) {
					entry.target.triggerLoad();
				}
			});
		}, {
			threshold: [0.01],
			rootMargin: DeviceDetector.isMobile ? '250px' : '500px'// rootMargin value for IntersectionObserver
		});
	}
	return intersectionObserver;
}

@Export('Image')
export class ESLImage extends ESLBaseElement {
	public static is = 'esl-image';
    public static eventNs = 'esl:image';

    public static get STRATEGIES() {
		return STRATEGIES;
	}

	static get EMPTY_IMAGE() {
		return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
	}

	static get observedAttributes() {
		return ['alt', 'data-alt', 'data-src', 'data-src-base', 'mode', 'lazy-triggered'];
	}

	@attr({defaultValue: ''}) public alt: string;
	@attr({defaultValue: 'save-ratio'}) public mode: string;
	@attr({dataAttr: true, defaultValue: ''}) public src: string;
	@attr({dataAttr: true, defaultValue: ''}) public srcBase: string;

	@attr({defaultValue: null}) public lazy: 'auto' | 'manual' | null;
	@attr({conditional: true}) public lazyTriggered: boolean;

	@attr({conditional: true}) public refreshOnUpdate: boolean;
	@attr({defaultValue: 'inner-image'}) public innerImageClass: string;

	@attr({conditional: true, readonly: true}) public readonly ready: boolean;
	@attr({conditional: true, readonly: true}) public readonly loaded: boolean;
	@attr({conditional: true, readonly: true}) public readonly error: boolean;

	private _strategy: ESLImageRenderStrategy;
	private _innerImg: HTMLImageElement;
	private _srcRules: ESLMediaRuleList<string>;
	private _currentSrc: string;
	private _detachLazyTrigger: () => void;
	private _shadowImageElement: ShadowImageElement;
	private readonly _onMatchChange: () => void;

	constructor() {
		super();
		this._onLoad = this._onLoad.bind(this);
		this._onError = this._onError.bind(this);
		this._onMatchChange = this.update.bind(this, false);
	}

	protected connectedCallback() {
		super.connectedCallback();
		this.alt = this.alt || this.getAttribute('data-alt') || '';
		if (!this.hasAttribute('role')) {
			this.setAttribute('role', 'img');
		}
		this.srcRules.addListener(this._onMatchChange);
		if (this.lazy !== 'manual') {
			this.removeAttribute('lazy-triggered');
			getIObserver().observe(this);
			this._detachLazyTrigger = function () {
				getIObserver().unobserve(this);
				this._detachLazyTrigger = null;
			};
		}
		this.refresh();
	}

	protected disconnectedCallback() {
		super.disconnectedCallback();
		this._detachLazyTrigger && this._detachLazyTrigger();
		if (this._srcRules) {
			this._srcRules.removeListener(this._onMatchChange);
		}
	}

	protected attributeChangedCallback(attrName: string, oldVal: string, newVal: string) {
		if (!this.connected || oldVal === newVal) return;
		switch (attrName) {
			case 'data-alt':
				this.alt = this.alt || this.getAttribute('data-alt') || '';
				break;
			case 'alt':
				this.innerImage && (this.innerImage.alt = this.alt);
				break;
			case 'data-src':
				this.srcRules = ESLMediaRuleList.parse<string>(newVal, ESLMediaRuleList.STRING_PARSER);
				this.refresh();
				break;
			case 'data-src-base':
				this.refresh();
				break;
			case 'mode':
				this.changeMode(oldVal, newVal);
				break;
			case 'lazy-triggered':
				this.lazyTriggered && this.update();
				break;
		}
	}

	get srcRules() {
		if (!this._srcRules) {
			this.srcRules = ESLMediaRuleList.parse<string>(this.src, ESLMediaRuleList.STRING_PARSER);
		}
		return this._srcRules;
	}

	set srcRules(rules: ESLMediaRuleList<string>) {
		if (this._srcRules) {
			this._srcRules.removeListener(this._onMatchChange);
		}
		this._srcRules = rules;
		this._srcRules.addListener(this._onMatchChange);
	}

	get currentSrc() {
		return this._currentSrc;
	}

	get empty() {
		return !this._currentSrc || ESLImage.isEmptyImage(this._currentSrc);
	}

	public triggerLoad() {
		this.setAttribute('lazy-triggered', '');
	}

	protected changeMode(oldVal: string, newVal: string) {
		oldVal = oldVal || 'save-ratio';
		newVal = newVal || 'save-ratio';
		if (oldVal === newVal) return;
		if (!STRATEGIES[newVal]) {
			this.mode = oldVal;
			throw new Error('ESL Image: Unsupported mode: ' + newVal);
		}
		this.clearImage();
		if (this.loaded) this.syncImage();
	}

	protected update(force: boolean = false) {
		if (this.lazy !== null && !this.lazyTriggered) {
			return;
		}

		const rule = this.srcRules.active;
		const src = this.getPath(rule.payload);
		const dpr = rule.DPR;

		if (this._currentSrc !== src || !this.ready || force) {
			this._currentSrc = src;
			this._shadowImg.src = src;
			this._shadowImg.dpr = dpr;

			if (this.refreshOnUpdate || !this.ready) {
				this.syncImage();
			}

			if (this._shadowImg.complete && this._shadowImg.naturalHeight > 0) {
				this._onLoad();
			}
			if (this._shadowImg.complete && this._shadowImg.naturalHeight <= 0) {
				this._onError();
			}
		}

		this._detachLazyTrigger && this._detachLazyTrigger();
	}

	protected getPath(src: string) {
		if (!src || src === '0' || src === 'none') {
			return ESLImage.EMPTY_IMAGE;
		}
		return this.srcBase + src;
	}

	public refresh() {
		this.removeAttribute('loaded');
		this.removeAttribute('ready');
		this.clearImage();
		this.update(true);
	}

	private syncImage() {
		const strategy = STRATEGIES[this.mode];
		this._strategy = strategy;
		strategy && strategy.apply(this, this._shadowImg);
	}

	private clearImage() {
		this._strategy && this._strategy.clear(this);
		this._strategy = null;
	}

	public get innerImage() {
		return this._innerImg;
	}

	public attachInnerImage() {
		if (!this.innerImage) {
			this._innerImg = this.querySelector(`img.${this.innerImageClass}`) ||
				this._shadowImg.cloneNode() as HTMLImageElement;
			this._innerImg.className = this.innerImageClass;
		}
		if (!this.innerImage.parentNode) {
			this.appendChild(this.innerImage);
		}
		this.innerImage.alt = this.alt;
	}

	public removeInnerImage() {
		if (!this.innerImage) return;
		this.removeChild(this.innerImage);
		setTimeout(() => {
			if (this._innerImg && !this._innerImg.parentNode) {
				this._innerImg = null;
			}
		});
	}

	protected get _shadowImg() {
		if (!this._shadowImageElement) {
			this._shadowImageElement = new Image();
			this._shadowImageElement.onload = this._onLoad;
			this._shadowImageElement.onerror = this._onError;
		}
		return this._shadowImageElement;
	}

	private _onLoad() {
		this.syncImage();
		this.removeAttribute('error');
		this.setAttribute('loaded', '');
		this.dispatchCustomEvent('load', {bubbles: false});
		this._onReady();
	}

	private _onError() {
		this.setAttribute('error', '');
		this.dispatchCustomEvent('error', {bubbles: false});
		this._onReady();
	}

	private _onReady() {
		if (!this.ready) {
			this.setAttribute('ready', '');
			this.dispatchCustomEvent('ready', {bubbles: false});
			if (this.hasAttribute('container-class') || this.hasAttribute('container-class-target')) {
				if (this.hasAttribute('container-class-onload') && this.error) return;
				const containerCls = this.getAttribute('container-class') || 'img-container-loaded';
				const target = this.getAttribute('container-class-target');
				const targetEl = target ? this.closest(target) : this.parentNode;
				(targetEl) && (targetEl as HTMLElement).classList.add(containerCls);
			}
		}
	}

	public static isEmptyImage(src: string) {
		return src === ESLImage.EMPTY_IMAGE;
	}
}

export default ESLImage;
