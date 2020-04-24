import {
  CASPER_CALENDAR_MODES,
  CASPER_CALENDAR_MODE_TYPES
} from '../casper-calendar-constants';

import '@casper2020/casper-icons/casper-icon.js';
import '@polymer/paper-input/paper-input.js';
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
          align-items: center;
          padding: 0 10px;
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

        #container paper-radio-group paper-radio-button .radio-button-label {
          color: white;
          padding: 5px 10px;
          border-radius: 20px;
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
          <template is="dom-repeat" items="[[__options]]">
            <paper-radio-button data-mode$="[[item.mode]]" name="[[item.type]]">
              <span class="radio-button-label" style="background-color: [[getBackgroundColorForType(item.type, __backgroundColors)]];">
                [[item.label]]
              </span>
            </paper-radio-button>
          </template>
        </paper-radio-group>

        <paper-input
          no-label-float
          value="{{__customHours}}"
          label="Introduza o número de horas">
          <casper-icon icon="fa-light:info-circle" slot="suffix" tooltip="Este valor deverá ser numérico ser compreendido entre 0 e 24"></casper-icon>
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
       * The different options that the user can select in both modes.
       *
       * @type {Array}
       */
      __options: {
        type: Array,
        value: () => [
          // Days options.
          { type: CASPER_CALENDAR_MODE_TYPES.FULL_DAY, label: 'Dia Completo', mode: 'DAYS' },
          { type: CASPER_CALENDAR_MODE_TYPES.ONLY_MORNING, label: 'Apenas Manhã', mode: 'DAYS' },
          { type: CASPER_CALENDAR_MODE_TYPES.ONLY_AFTERNOON, label: 'Apenas Tarde', mode: 'DAYS' },
          // Hours options.
          { type: CASPER_CALENDAR_MODE_TYPES.FULL_HOURS, label: 'Dia Completo', mode: 'HOURS' },
          { type: CASPER_CALENDAR_MODE_TYPES.HALF_HOURS, label: 'Meio-dia', mode: 'HOURS' },
          { type: CASPER_CALENDAR_MODE_TYPES.CUSTOM_HOURS, label: 'Outro', mode: 'HOURS' },
        ]
      },
      /**
       * The list of background colors that will be used for each of the types.
       *
       * @type {Object}
       */
      __backgroundColors: {
        type: Object,
        value: {
          FULL_DAY: 'var(--status-orange)',
          ONLY_MORNING: 'var(--status-blue)',
          ONLY_AFTERNOON: 'var(--status-green)',
          FULL_HOURS: 'var(--status-orange)',
          HALF_HOURS: 'var(--status-blue)',
          CUSTOM_HOURS: 'var(--status-green)'
        }
      }
    }
  };

  ready () {
    super.ready();

    this.__isInputPristine = true;

    this.__paperInput = this.shadowRoot.querySelector('paper-input');
    this.__paperInput.allowedPattern = /[\d\.]/;
    this.__paperInput.addEventListener('blur', () => this.__validateCustomHoursInput());
    this.__paperInput.addEventListener('value-changed', () => this.__validateCustomHoursInput());
    this.__paperInput.addEventListener('focus', () => { this.__isInputPristine = false; });
  }

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

        // Automatically focus the input if the user selected the custom hours opion.
        if (isCustomHoursSelected) {
          this.__paperInput.focus();
        }
      });

      // Display the correct options given the new mode.
      this.shadowRoot.querySelectorAll('paper-radio-button').forEach(radioButton => {
        radioButton.dataset.mode === this.mode
          ? radioButton.setAttribute('visible', true)
          : radioButton.removeAttribute('visible');
      });

      // Pre-select the first option of the days or hours mode.
      this.__radioGroup.selected = this.__isCalendarInDaysMode()
        ? CASPER_CALENDAR_MODE_TYPES.FULL_DAY
        : CASPER_CALENDAR_MODE_TYPES.FULL_HOURS;
    });
  }

  /**
   * This method is used to validate the custom hours input's value.
   */
  __validateCustomHoursInput () {
    // Do not validate if the input was not focused yet.
    if (this.__isInputPristine) return;

    // Validate if the input contains a numeric value between 0 and 24.
    if (!this.__customHours || !this.__customHours.match(/^\d+(\.\d+)?$/g) || parseFloat(this.__customHours) > 24) {
      this.__paperInput.invalid = true;
      this.customHours = 0;
      return;
    }

    // If we got here, it means the input passed all validations.
    this.__paperInput.invalid = false;
    this.customHours = parseFloat(this.__customHours);
  }
}

customElements.define('casper-calendar-selector', CasperCalendarSelector);