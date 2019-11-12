import moment from 'moment/src/moment.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperCalendar extends PolymerElement {

  static get is () {
    return 'casper-calendar';
  }

  static get template() {
    return html`
      <style>
        #main-container {
          display: flex;
          flex-grow: 1;
          flex-direction: column;
        }

        .row-container {
          display: flex;
        }

        .cell {
          flex: 1;
          border: 0;
          border-radius: 3px;
          border-left: 1px #F2F2F2 solid;
          border-bottom: 1px #F2F2F2 solid;
        }

        .cell.cell--left-header {
          flex-grow: 0;
          flex-shrink: 0;
          flex-basis: 10%;
          height: 30px;
          padding: 0 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #E4E4E4;
          color: var(--primary-color);
        }

        .cell.cell--top-header {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #E4E4E4;
          color: var(--primary-color);
        }
      </style>
      <div id="main-container">
        <div class="row-container">
          <div class="cell cell--left-header">[[year]]</div>
          <template is="dom-repeat" items="[[__weekDays]]" as="weekDay">
            <div class="cell cell--top-header">[[weekDay]]</div>
          </template>
        </div>
        <template is="dom-repeat" items="[[__monthNames]]" as="month">
          <div class="row-container">
            <div class="cell cell--left-header">[[month]]</div>
            <template is="dom-repeat" items="[[__getDaysForMonth(index)]]">
              <div class="cell">[[item]]</div>
            </template>
          </div>
        </template>
      </div>
    `;
  }

  static get properties () {
    return {
      year: {
        type: Number,
        value: new Date().getFullYear()
      },
      __monthNames: {
        type: Array,
        value: moment.months().map(month => month.substring(0, 3))
      }
    }
  }

  ready () {
    super.ready();

    this.__numberOfColumns = 31;
    this.__weekdaysPerMonth = new Array(12);

    const yearFirstWeekDay = new Date(this.year, 0, 1).getDay();

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const firstDayOfMonth = moment(new Date(this.year, monthIndex, 1));

      const monthNumberOfDays = firstDayOfMonth.daysInMonth();
      const monthFirstWeekDay = firstDayOfMonth.day();

      let offset = monthFirstWeekDay >= yearFirstWeekDay
        ? monthFirstWeekDay - yearFirstWeekDay
        : monthFirstWeekDay + (7 - yearFirstWeekDay);

      const teste = Array.from(Array(monthNumberOfDays).keys()).map(a => a + 1);

      yearFirstWeekDay === monthFirstWeekDay
        ? this.__weekdaysPerMonth[monthIndex] = teste
        : this.__weekdaysPerMonth[monthIndex] = new Array(offset).concat(teste);
    }

    this.__numberOfColumns = Math.max(...this.__weekdaysPerMonth.map(a => a.length));

    this.__weekDays = [];
    for (let a = 0; a < this.__numberOfColumns; a++) {
      let b = yearFirstWeekDay + a;

      while (b >= 7) b -= 7;

      this.__weekDays[a] = moment.weekdays()[b].charAt(0);
    }
  }

  __getDaysForMonth (index) {
    return this.__weekdaysPerMonth[index].length === this.__numberOfColumns
      ? this.__weekdaysPerMonth[index]
      : this.__weekdaysPerMonth[index].concat(new Array(this.__numberOfColumns - this.__weekdaysPerMonth[index].length));
  }
}

customElements.define(CasperCalendar.is, CasperCalendar);
