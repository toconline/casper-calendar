import {
  CASPER_CALENDAR_MODES,
  CASPER_CALENDAR_MODE_TYPES
} from '../casper-calendar-constants';

import '@polymer/paper-radio-group/paper-radio-group.js';
import '@polymer/paper-radio-button/paper-radio-button.js';
import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperCalendarSelector extends PolymerElement {

  static get template () {
    return html`
      <style>
        paper-radio-button {
          display: none;
        }
      </style>

      <paper-radio-group>
        <template is="dom-repeat" items="[[__selectorOptions]]">
          <paper-radio-button data-type$="[[item.mode]]" name="[[item.value]]">
            [[item.label]]
          </paper-radio-button>
        </template>
      </paper-radio-group>

      <paper-input disabled value="{{customValue}}"></paper-input>
    `;
  }

  static get properties () {
    return {
      __selectorOptions: {
        type: Array,
        value: [
          { value: CASPER_CALENDAR_MODE_TYPES.FULL_DAY,       mode: CASPER_CALENDAR_MODES.DAYS,   label: 'Dia Inteiro', backgroundColor: 'red' },
          { value: CASPER_CALENDAR_MODE_TYPES.ONLY_MORNING,   mode: CASPER_CALENDAR_MODES.DAYS,   label: 'Só manhã',    backgroundColor: 'blue' },
          { value: CASPER_CALENDAR_MODE_TYPES.ONLY_AFTERNOON, mode: CASPER_CALENDAR_MODES.DAYS,   label: 'Só tarde',    backgroundColor: 'green' },
          { value: CASPER_CALENDAR_MODE_TYPES.FULL_HOURS,     mode: CASPER_CALENDAR_MODES.HOURS,  label: '8h',          backgroundColor: 'red' },
          { value: CASPER_CALENDAR_MODE_TYPES.HALF_HOURS,     mode: CASPER_CALENDAR_MODES.HOURS,  label: '4h',          backgroundColor: 'grey' },
          { value: CASPER_CALENDAR_MODE_TYPES.CUSTOM_HOURS,   mode: CASPER_CALENDAR_MODES.HOURS,  label: 'Outro',       backgroundColor: 'black' }
        ]
      },
      mode: {
        type: String,
        observer: '__modeChanged'
      },
      type: {
        type: String,
        notify: true
      },
      customValue: {
        type: String,
        notify: true
      },
      backgroundColor: {
        type: String,
        notify: true
      }
    };
  }

  __isCalendarInDaysMode () { return this.mode === CASPER_CALENDAR_MODES.DAYS; }
  __isCalendarInHoursMode () { return this.mode === CASPER_CALENDAR_MODES.HOURS; }

  __modeChanged () {
    afterNextRender(this, () => {
      this.__paperInputElement = this.__paperInputElement || this.shadowRoot.querySelector('paper-input');
      this.__radioGroupElement = this.__radioGroupElement || this.shadowRoot.querySelector('paper-radio-group');

      this.__radioGroupElement.addEventListener('selected-changed', event => {
        this.__paperInputElement.disabled = event.detail.value !== CASPER_CALENDAR_MODE_TYPES.CUSTOM_HOURS;

        const selectedOption = this.__selectorOptions.find(option => option.value === event.detail.value);

        this.type = selectedOption.value;
        this.backgroundColor = selectedOption.backgroundColor;
      });

      this.shadowRoot.querySelectorAll('paper-radio-button').forEach(paperRadioButton => {
        paperRadioButton.style.display = paperRadioButton.dataset.type === this.mode ? 'block' : 'none';
      });

      this.__isCalendarInDaysMode()
        ? this.__radioGroupElement.selected = this.__selectorOptions.find(option => option.mode === CASPER_CALENDAR_MODES.DAYS).value
        : this.__radioGroupElement.selected = this.__selectorOptions.find(option => option.mode === CASPER_CALENDAR_MODES.HOURS).value;
    });
  }

  getBackgroundColorForType (type) {
    return this.__selectorOptions.find(option => option.value === type).backgroundColor;
  }
}

customElements.define('casper-calendar-selector', CasperCalendarSelector);