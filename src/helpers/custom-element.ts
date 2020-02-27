/**
 * Base class for SmartLibrary custom elements.
 * Allows to define custom element with the optional custom tag name.
 * @abstract
 */
export abstract class CustomElement extends HTMLElement {
	public static is = '';
	public static eventNs = '';

	/**
	 * Register component in a {customElements} registry
	 * @param {string} tagName - tag name to register custom element
	 */
	// tslint:disable-next-line:ban-types
	public static register(this: Function & typeof CustomElement, tagName?: string) {
		tagName = tagName || this.is;
		if (!tagName) throw new Error('Can not define custom element');
		if (this.is !== tagName) {
			this.is = tagName;
		}
		customElements.define(tagName, this);
	}

	/**
	 * Dispatch component custom event.
	 * Will append prefix from static property {eventNs} if it is defined.
	 * @param {string} eventName -  event name
	 * @param {CustomEventInit} eventInit - event init
	 */
	public dispatchCustomEvent(eventName: string,
	                           eventInit: CustomEventInit = {bubbles: true}): boolean {
		const component = this.constructor as typeof CustomElement;
		const eventFullName = (component.eventNs ? `${component.eventNs}:` : '') + eventName;
		const event = new CustomEvent(eventFullName, eventInit);
		return this.dispatchEvent(event);
	}
}