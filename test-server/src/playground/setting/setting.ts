import {ESLBaseElement, attr} from '../../../../src/modules/esl-base-element/core';

export abstract class ESLSetting extends ESLBaseElement {
  static eventNs = 'esl:setting';

  @attr() public name: string;
  public value: string | boolean;

  protected abstract render(): void;

  protected connectedCallback() {
    super.connectedCallback();
    this.style.display = 'block';
    this.renderLabel();
    this.render();
  }

  static get observedAttributes(): string[] {
    return ['name', 'value'];
  }

  protected onValueChange(): void {
    this.$$fireNs('valueChange', {detail: {name: this.name, value: this.value}});
  }

  protected renderLabel(): void {
    const label = document.createElement('label');
    label.innerText = this.name;
    label.htmlFor = this.name;

    this.appendChild(label);
  }
}
