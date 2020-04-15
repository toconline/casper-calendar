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
        <paper-radio-button data-type="DAYS" name="FULL_DAY">Dia Completo</paper-radio-button>
        <paper-radio-button data-type="DAYS" name="ONLY_MORNING">Apenas manhã</paper-radio-button>
        <paper-radio-button data-type="DAYS" name="ONLY_AFTERNOON">Apenas tarde</paper-radio-button>

        <paper-radio-button data-type="HOURS" name="FULL_HOURS">Dia Completo - [[__fullHoursValue]]</paper-radio-button>
        <paper-radio-button data-type="HOURS" name="HALF_HOURS">Meio-dia - [[__halfHoursValue]]</paper-radio-button>
        <paper-radio-button data-type="HOURS" name="CUSTOM_HOURS">Outro</paper-radio-button>
      </paper-radio-group>

      <paper-input disabled value="{{__customHoursValue}}" type="number" min="0" max="24"></paper-input>
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
      fullHoursValue: {
        type: Number,
        observer: '__fullHoursValueChanged'
      },
      /**
       * The currently custom value that the user introduced.
       *
       * @type {Number}
       */
      __customHoursValue: {
        type: Number,
        observer: '__customHoursValueChanged'
      },
      /**
       * The list of options for the hours / days modes.
       *
       * @type {Array}
       */
      __backgroundColors: {
        type: Array,
        value: {
          FULL_DAY: 'red',
          ONLY_MORNING: 'blue',
          ONLY_AFTERNOON: 'green',
          FULL_HOURS: 'red',
          HALF_HOURS: 'gray',
          CUSTOM_HOURS: 'aliceblue'
        }
      }
    }
  };

  /**
   * Returns the background color for a specific type.
   *
   * @param {String} type The type we're trying to obtain the background color for.
   */
  getBackgroundColorForType (type) {
    return this.__backgroundColors[type];
  }

  __isCalendarInDaysMode () { return this.mode === CASPER_CALENDAR_MODES.DAYS; }
  __isCalendarInHoursMode () { return this.mode === CASPER_CALENDAR_MODES.HOURS; }

  /**
   * Observer that gets fired when the calendar mode changes.
   */
  __modeChanged () {
    afterNextRender(this, () => {
      this.__paperInput = this.__paperInput || this.shadowRoot.querySelector('paper-input');
      this.__radioGroup = this.__radioGroup || this.shadowRoot.querySelector('paper-radio-group');

      this.__radioGroup.addEventListener('selected-changed', event => {
        const selectedValue = event.detail.value;

        // Disable the custom value input unless that option is currently selected.
        this.__paperInput.disabled = selectedValue !== CASPER_CALENDAR_MODE_TYPES.CUSTOM_HOURS;

        this.backgroundColor = this.__backgroundColors[selectedValue];

        let value = undefined;
        if (this.__isCalendarInHoursMode()) {
          switch (selectedValue) {
            case CASPER_CALENDAR_MODE_TYPES.FULL_HOURS: value = this.fullHoursValue; break;
            case CASPER_CALENDAR_MODE_TYPES.HALF_HOURS: value = this.fullHoursValue / 2; break;
            case CASPER_CALENDAR_MODE_TYPES.CUSTOM_HOURS: value = parseFloat(this.__customHoursValue); break;
          }
        }

        this.meta = { type: selectedValue, value };
      });

      // Display the correct options given the new mode.
      this.shadowRoot.querySelectorAll('paper-radio-button').forEach(radioButton => {
        radioButton.style.display = radioButton.dataset.type === this.mode ? 'block' : 'none';
      });

      // Pre-select the first option of the days or hours mode.
      this.__isCalendarInDaysMode()
        ? this.__radioGroup.selected = CASPER_CALENDAR_MODE_TYPES.FULL_DAY
        : this.__radioGroup.selected = CASPER_CALENDAR_MODE_TYPES.FULL_HOURS
    });
  }

  __fullHoursValueChanged (fullHours) {
    this.__fullHoursValue = this.__humanizeNumberOfHours(fullHours);
    this.__halfHoursValue = this.__humanizeNumberOfHours(fullHours / 2);
  }

  __humanizeNumberOfHours (numberOfHours) {
    const hours = Math.floor(numberOfHours);
    const minutes = Math.round((numberOfHours - hours) * 60);

    return minutes === 0
      ? `${hours}h`
      : `${hours}h ${minutes}m`;
  }

  /**
   * Updates the meta property considering the new custom hours value.
   *
   * @param {String} customHoursValue The current custom hours value.
   */
  __customHoursValueChanged (customHoursValue) {
    this.meta = { ...this.meta, value: parseFloat(customHoursValue) };
  }
}

customElements.define('casper-calendar-selector', CasperCalendarSelector);