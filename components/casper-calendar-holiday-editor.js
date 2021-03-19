import '@polymer/paper-listbox/paper-listbox.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { CasperOverlayBehavior } from '@cloudware-casper/casper-overlay-behavior/casper-overlay-behavior.js';
import '@cloudware-casper/casper-context-menu/casper-menu-item.js';
import '@cloudware-casper/casper-context-menu/casper-menu-separator.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperCalendarHolidayEditor extends mixinBehaviors(CasperOverlayBehavior, PolymerElement) {
  static get properties () {
    return {
      description: {
        type: String,
        value: ''
      },
      _editorText: {
        type: String,
        value: 'Criar'
      },
      isEdit: {
        type: String,
        value: false
      },
      date: {
        type: Object,
        value: {}
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host {
          overflow: hidden;
          background: var(--primary-background-color, white);
          border-radius: var(--radius-primary, 6px);
          box-shadow: rgba(0, 0, 0, 0.24) -2px 5px 12px 0px,
                      rgba(0, 0, 0, 0.12) 0px 0px 12px 0px;
          max-width: 300px;
          width: 300px;
          max-height: 300px;
          height: 146px;
        }

        paper-listbox {
          border-radius: var(--radius-primary, 6px);
          padding: 0px;
        }

        .header {
          background: var(--primary-color);
          color: white;
          padding: 7px 0;
        }

        .header:focus {
          outline: none;
        }

        .header-content {
          width: 90%;
          display: flex;
          margin: auto;
          justify-content: space-between;
        }

        .close {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        #descriptionInput {
          width: 90%;
          margin: auto;
        }

        .buttons-container {
          display: flex;
          width: 90%;
          margin: auto;
          justify-content: flex-end;
          margin-top: 10px;
        }

        .buttons-container:focus {
          outline: none;
        }

        /* .button {
          font-size: 13px;
          display: flex;
          align-items: center;
          padding: 4px 14px 4px 14px;
          border-radius: 15px;
          cursor: pointer;
        }

        .delete-button {
          color: var(--primary-color);
          margin-right: 10px;
          border: 1.5px solid var(--primary-color);
        }

        .accept-button {
          color: white;
          background: var(--primary-color);
        } */

        .button {
          padding: 4px 14px 4px 14px;
          border-radius: 15px;
          cursor: pointer;
          border: 1.5px solid var(--primary-color);
        }

        .delete-button {
          color: var(--primary-color);
          margin-right: 10px;
        }

        .accept-button {
          color: white;
          background: var(--primary-color);
        }
      </style>

      <paper-listbox>
        <div class="header">
          <div class="header-content">
            <span>[[_editorText]] Feriado</span>
            <casper-icon class="close" icon="fa-light:times-circle" on-click="_closeEditor"></casper-icon>
          </div>
        </div>
        <paper-input id="descriptionInput" width="300px" label="Descrição" value="{{description}}"></paper-input>
        <div class="buttons-container">
          <template is="dom-if" if="[[isEdit]]">
            <casper-icon icon="fa-light:trash-alt" class="button delete-button" on-click="_o"></casper-icon>
          </template>
          <casper-icon icon="fa-light:check" class="button accept-button" on-click="_acceptHoliday"></casper-icon>
        </div>
      </paper-listbox>
    `;
  }

  static get is () {
    return 'casper-calendar-holiday-editor';
  }

  ready () {
    super.ready();

    this.addEventListener('opened-changed', (event) => {
      if (event && event.detail && event.detail.value) {
        afterNextRender(this, () => {
          this.$.descriptionInput.focus();
        });
      }
      if (this.isEdit) {
        this._editorText = 'Editar';
      } else {
        this._editorText = 'Criar';
        this.description = '';
      }
    });
  }

  _closeEditor () {
    this.close();
  }

  _acceptHoliday () {
    this.date.description = this.description;

    this.dispatchEvent(new CustomEvent('casper-holiday-editor-create', {
      bubbles: true,
      composed: true,
      detail: { newDate: this.date }
    }));

    this.close();
  }

}

customElements.define(CasperCalendarHolidayEditor.is, CasperCalendarHolidayEditor);


// officeBranchesWiz.$.casperCalendar.activeDates
