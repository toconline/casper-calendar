import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperCalendar extends PolymerElement {

  static get is () {
    return 'casper-calendar';
  }

  static get template() {
    return html``;
  }
}

customElements.define(CasperCalendar.is, CasperCalendar);
