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
          height: 150px;
        }

        paper-listbox {
          border-radius: var(--radius-primary, 6px);
          padding: 0px;
        }

        #descriptionInput {
          width: 90%;
          margin: 0 auto;
        }

        .delete {
          color: var(--primary-color);
          padding: 4px 10px;
          border-radius: 20%;
          border: 2px solid var(--primary-color);
          margin-right: 5px;
        }

        .accept {
          color: white;
          padding: 4px 10px;
          border-radius: 20%;
          background: var(--primary-color);
          border: 2px solid var(--primary-color);
        }

        .container {
          display: flex;
          width: 90%;
          margin: 0 auto;
          justify-content: flex-end;
          margin-top: 15px;
        }

        .delete-alt {
          color: var(--primary-color);
          font-size: 13px;
          display: flex;
          align-items: center;
          margin-right: 10px;
          padding: 4px 14px 4px 14px;
          border-radius: 15px;
          border: 1.5px solid var(--primary-color);
        }

        .accept-alt {
          color: white;
          font-size: 13px;
          display: flex;
          align-items: center;
          padding: 4px 14px 4px 14px;
          border-radius: 15px;
          background: var(--primary-color);
        }

        .header {
          background: var(--primary-color);
          color: white;
          padding: 7px 0;
        }

        /* cinza*/
        /* .header {
          background: #efefef;
          color: var(--primary-color);
          padding: 7px 0;
        } */

        .header-content {
          width: 90%;
          display: flex;
          margin: auto;
          justify-content: space-between;
        }

        .close {
          width: 20px;
          height: 20px;
        }
      </style>

      <!-- <paper-listbox>
        <casper-menu-separator>
          Editar Feriado
          <casper-icon class="close" icon="fa-light:times" on-click="_o"></casper-icon>
        </casper-menu-separator>
        <paper-input id="descriptionInput" label="Descrição"></paper-input>
        <div class="container">
          <casper-icon class="delete" icon="fa-light:trash-alt" on-click="_o"></casper-icon>
          <casper-icon class="accept" icon="fa-light:check" on-click="_o"></casper-icon>
        </div>
      </paper-listbox> -->
      <!-- <paper-listbox>
        <casper-menu-separator>
          Editar Feriado
          <casper-icon class="close" icon="fa-light:times" on-click="_o"></casper-icon>
        </casper-menu-separator>
        <paper-input id="descriptionInput" label="Descrição"></paper-input>
        <div class="container">
          <casper-icon class="delete-alt" icon="fa-light:trash-alt" on-click="_o"></casper-icon>
          <casper-icon class="accept-alt" icon="fa-light:check" on-click="_o"></casper-icon>
        </div>
      </paper-listbox> -->
      <paper-listbox>
        <!-- <casper-menu-separator>
          Editar Feriado
          <casper-icon class="close" icon="fa-light:times" on-click="_o"></casper-icon>
        </casper-menu-separator> -->
        <div class="header">
          <div class="header-content">
            <span >Editar Feriado</span>
            <casper-icon class="close" icon="fa-light:times-circle" on-click="_o"></casper-icon>
          </div>
        </div>
        <paper-input id="descriptionInput" width="300px" label="Descrição"></paper-input>
        <div class="container">
          <span class="delete-alt"><casper-icon icon="fa-light:trash-alt" on-click="_o"></casper-icon></span>
          <span class="accept-alt"><casper-icon icon="fa-light:check" on-click="_o"></casper-icon></span>
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
    });
  }

}
  
customElements.define(CasperCalendarHolidayEditor.is, CasperCalendarHolidayEditor);
  