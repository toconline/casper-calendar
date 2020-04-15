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

      <paper-input disabled value="{{__customValue}}" type="number"></paper-input>
    `;
  }

  static get properties () {
    return {
      /**
       * The mode in which the calendar is currently working.
       *
       * @type {String}
       */
      mode: {
        type: String,
        observer: '__modeChanged'
      },
      /**
       * The meta information that should be saved in the new active dates.
       *
       * @type {Object}
       */
      meta: {
        type: Object,
        notify: true
      },
      /**
       * The background color that should be applied when selecting the new active dates.
       *
       * @type {String}
       */
      backgroundColor: {
        type: String,
        notify: true
      },
      /**
       * The currently custom value that the user introduced.
       *
       * @type {Number}
       */
      __customValue: {
        type: Number,
        observer: '__customValueChanged'
      },
      /**
       * The list of options for the hours / days modes.
       *
       * @type {Array}
       */
      __selectorOptions: {
        type: Array,
        value: [
          { value: CASPER_CALENDAR_MODE_TYPES.FULL_DAY, mode: CASPER_CALENDAR_MODES.DAYS, label: 'Dia Inteiro', backgroundColor: 'red' },
          { value: CASPER_CALENDAR_MODE_TYPES.ONLY_MORNING, mode: CASPER_CALENDAR_MODES.DAYS, label: 'Só manhã', backgroundColor: 'blue' },
          { value: CASPER_CALENDAR_MODE_TYPES.ONLY_AFTERNOON, mode: CASPER_CALENDAR_MODES.DAYS, label: 'Só tarde', backgroundColor: 'green' },
          { value: CASPER_CALENDAR_MODE_TYPES.FULL_HOURS, mode: CASPER_CALENDAR_MODES.HOURS, label: '8h', backgroundColor: 'red' },
          { value: CASPER_CALENDAR_MODE_TYPES.HALF_HOURS, mode: CASPER_CALENDAR_MODES.HOURS, label: '4h', backgroundColor: 'grey' },
          { value: CASPER_CALENDAR_MODE_TYPES.CUSTOM_HOURS, mode: CASPER_CALENDAR_MODES.HOURS, label: 'Outro', backgroundColor: 'black' }
        ]
      },
    };
  }

  __isCalendarInDaysMode () { return this.mode === CASPER_CALENDAR_MODES.DAYS; }
  __isCalendarInHoursMode () { return this.mode === CASPER_CALENDAR_MODES.HOURS; }

  __modeChanged () {
    afterNextRender(this, () => {
      this.__paperInput = this.__paperInput || this.shadowRoot.querySelector('paper-input');
      this.__radioGroup = this.__radioGroup || this.shadowRoot.querySelector('paper-radio-group');

      this.__radioGroup.addEventListener('selected-changed', event => {
        // Disable the custom value input unless that option is currently selected.
        this.__paperInput.disabled = event.detail.value !== CASPER_CALENDAR_MODE_TYPES.CUSTOM_HOURS;

        const selectedOption = this.__selectorOptions.find(option => option.value === event.detail.value);

        this.backgroundColor = selectedOption.backgroundColor;
        this.meta = {
          type: selectedOption.value,
          customValue: this.__paperInput.disabled ? undefined : this.__customValue
        };
      });

      // Display the correct options given the new mode.
      this.shadowRoot.querySelectorAll('paper-radio-button').forEach(radioButton => {
        radioButton.style.display = radioButton.dataset.type === this.mode ? 'block' : 'none';
      });

      // Pre-select the first option of the days or hours mode.
      this.__isCalendarInDaysMode()
        ? this.__radioGroup.selected = this.__selectorOptions.find(option => option.mode === CASPER_CALENDAR_MODES.DAYS).value
        : this.__radioGroup.selected = this.__selectorOptions.find(option => option.mode === CASPER_CALENDAR_MODES.HOURS).value;
    });
  }

  /**
   * Returns the background color for a specific type.
   *
   * @param {String} type The type we're trying to obtain the background color for.
   */
  getBackgroundColorForType (type) {
    return this.__selectorOptions.find(option => option.value === type).backgroundColor;
  }

  /**
   * Updates the meta property considering the new custom value.
   *
   * @param {String} customValue The current custom value.
   */
  __customValueChanged (customValue) {
    this.meta = { ...this.meta, customValue };
  }
}

customElements.define('casper-calendar-selector', CasperCalendarSelector);