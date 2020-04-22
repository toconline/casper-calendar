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
        #container {
          display: flex;
          padding: 10px;
          align-items: center;
        }

        #container label {
          margin-right: 8px;
        }

        #container paper-radio-group {
          display: flex;
        }

        #container paper-radio-group paper-radio-button {
          display: none;
        }

        #container paper-radio-group paper-radio-button[visible] {
          display: flex;
        }

        #container paper-radio-group paper-radio-button .color-square {
          width: 15px;
          height: 15px;
          display: flex;
        }

        #container paper-input {
          width: 20%;
          display: none;
          --paper-input-container: {
            padding: 0;
          }
        }

        #container paper-input[visible] {
          display: block;
        }
      </style>

      <div id="container">
        <label>Escolha uma opção:</label>
        <paper-radio-group>
          <paper-radio-button data-type="DAYS" name="FULL_DAY">Dia Completo</paper-radio-button>
          <paper-radio-button data-type="DAYS" name="ONLY_MORNING">Apenas manhã</paper-radio-button>
          <paper-radio-button data-type="DAYS" name="ONLY_AFTERNOON">Apenas tarde</paper-radio-button>

          <paper-radio-button data-type="HOURS" name="FULL_HOURS">Dia Completo</paper-radio-button>
          <paper-radio-button data-type="HOURS" name="HALF_HOURS">Meio-dia</paper-radio-button>
          <paper-radio-button data-type="HOURS" name="CUSTOM_HOURS">Outro:</paper-radio-button>
        </paper-radio-group>

        <paper-input
          disabled
          min="0"
          max="24"
          type="number"
          no-label-float
          value="{{customHours}}"
          label="Introduza um número de horas">
        </paper-input>
      </div>
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
      customHours: {
        type: Number,
        notify: true
      },
      /**
       * The list of options for the hours / days modes.
       *
       * @type {Array}
       */
      __backgroundColors: {
        type: Object,
        value: {
          FULL_DAY: 'red',
          ONLY_MORNING: 'blue',
          ONLY_AFTERNOON: 'green',
          FULL_HOURS: 'red',
          HALF_HOURS: 'gray',
          CUSTOM_HOURS: 'purple'
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
        const isCustomHoursSelected = selectedValue === CASPER_CALENDAR_MODE_TYPES.CUSTOM_HOURS;

        // Disable the custom value input unless that option is currently selected.
        this.__isCalendarInHoursMode()
          ? this.__paperInput.setAttribute('visible', true)
          : this.__paperInput.removeAttribute('visible');
        this.__paperInput.disabled = !isCustomHoursSelected;

        this.meta = { type: selectedValue };
        this.backgroundColor = this.__backgroundColors[selectedValue];
      });

      // Display the correct options given the new mode.
      this.shadowRoot.querySelectorAll('paper-radio-button').forEach(radioButton => {
        radioButton.dataset.type === this.mode
          ? radioButton.setAttribute('visible', true)
          : radioButton.removeAttribute('visible');
      });

      // Pre-select the first option of the days or hours mode.
      this.__radioGroup.selected = this.__isCalendarInDaysMode()
        ? CASPER_CALENDAR_MODE_TYPES.FULL_DAY
        : CASPER_CALENDAR_MODE_TYPES.FULL_HOURS;
    });
  }
}

customElements.define('casper-calendar-selector', CasperCalendarSelector);