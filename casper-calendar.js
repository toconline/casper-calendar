import moment from 'moment/src/moment.js';
import '@casper2020/casper-icons/casper-icon.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperCalendar extends PolymerElement {

  static get is () {
    return 'casper-calendar';
  }

  static get properties () {
    return {
      /**
       * The year that is currently being displayed on the calendar.
       *
       * @type {Number}
       */
      year: {
        type: Number,
        value: new Date().getFullYear(),
        observer: '__yearChanged'
      },
      /**
       * The date that is currently active.
       *
       * @type {Date}
       */
      activeDate: {
        type: Object,
        value: new Date(),
        observer: '__activeDateChanged',
        notify: true
      }
    }
  }

  static get template() {
    return html`
      <style>
        #main-container {
          display: flex;
          flex-grow: 1;
          user-select: none;
          flex-direction: column;
        }

        #main-container .row-container {
          display: flex;
        }

        #main-container .row-container .cell {
          flex: 1;
          border: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          box-sizing: border-box;
          border-left: 1px #F2F2F2 solid;
          border-bottom: 1px #F2F2F2 solid;
        }

        #main-container .row-container .cell:not(.cell--left-header):not(.cell--top-header)[active] {
          color: var(--on-primary-color);
          background-color: var(--primary-color);
        }

        #main-container .row-container .cell:not(.cell--left-header):not(.cell--top-header):hover {
          cursor: pointer;
          box-shadow: 1px 1px 7px #999999;
        }

        #main-container .row-container .cell.cell--weekend {
          color: red;
          background-color: #E4E4E4;
        }

        #main-container .row-container .cell.cell--left-header {
          flex-grow: 0;
          flex-shrink: 0;
          flex-basis: 10%;
          height: 30px;
          padding: 0 10px;
          align-items: center;
          justify-content: space-between;
          background-color: #E4E4E4;
          color: var(--primary-color);
        }

        #main-container .row-container .cell.cell--left-header.cell--year-header {
          justify-content: space-around;
        }

        #main-container .row-container .cell.cell--left-header.cell--year-header casper-icon {
          width: 15px;
          height: 15px;
          cursor: pointer;
          --casper-icon-fill-color: var(--primary-color);
        }

        #main-container .row-container .cell.cell--top-header {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #E4E4E4;
          color: var(--primary-color);
        }

        #main-container .row-container .cell.cell--top-header.cell--weekend {
          color: red;
          background-color: #E4E4E4;
        }
      </style>
      <div id="main-container">
        <div class="row-container">
          <!--Year selector-->
          <div class="cell cell--left-header cell--year-header">
            <casper-icon icon="fa-light:chevron-double-left" on-click="__decrementYear"></casper-icon>
            [[year]]
            <casper-icon icon="fa-light:chevron-double-right" on-click="__incrementYear"></casper-icon>
          </div>

          <!--Week days column headers-->
          <template is="dom-repeat" items="[[__weekDays]]" as="weekDay">
            <div class$="cell cell--top-header [[__isWeekend(weekDay.weekDay)]]">[[weekDay.weekDayName]]</div>
          </template>
        </div>

        <template is="dom-repeat" items="[[__months]]" as="month">
          <div class="row-container">
            <div class="cell cell--left-header">[[month.name]]</div>
            <template is="dom-repeat" items="[[__getDaysForMonth(index)]]" as="monthDay">
              <div
                on-click="__cellClicked"
                data-month$="[[month.index]]"
                data-day$="[[monthDay.index]]"
                class$="cell [[__isWeekend(monthDay.weekDay)]]">[[monthDay.index]]</div>
            </template>
          </div>
        </template>
      </div>
    `;
  }

  __yearChanged () {
    const months = [];
    this.__numberOfColumns = 31;

    const yearFirstWeekDay = new Date(this.year, 0, 1).getDay();

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      months.push({
        index: monthIndex,
        name: moment.months()[monthIndex].substring(0, 3),
      });

      // Get the month's number of days and its first week day.
      const firstDayOfMonth = moment(new Date(this.year, monthIndex, 1));
      const monthNumberOfDays = firstDayOfMonth.daysInMonth();
      const monthFirstWeekDay = firstDayOfMonth.day();

      // Get all the weekdays for every single day of the month.
      const monthDays = [];
      for (let dayIndex = 0; dayIndex < monthNumberOfDays; dayIndex++) {
        monthDays.push({
          index: dayIndex + 1,
          weekDay: (monthFirstWeekDay + dayIndex) % 7
        });
      }

      if (yearFirstWeekDay === monthFirstWeekDay) {
        months[monthIndex].days = monthDays;
      } else {
        // Calculate how many days between the year's first week day and this month's first week day.
        let offset = monthFirstWeekDay >= yearFirstWeekDay
          ? monthFirstWeekDay - yearFirstWeekDay
          : monthFirstWeekDay + (7 - yearFirstWeekDay);

        months[monthIndex].days = new Array(offset).concat(monthDays);
      }
    }

    this.__numberOfColumns = Math.max(...months.map(monthWeekdays => monthWeekdays.days.length));

    // Build the weekdays that will appear at the top of the page taking into account the first day of the year.
    const weekDays = [];
    for (let columnIndex = 0; columnIndex < this.__numberOfColumns; columnIndex++) {
      const currentWeekday = (yearFirstWeekDay + columnIndex) % 7;

      weekDays.push({
        weekDay: currentWeekday,
        weekDayName: moment.weekdays()[currentWeekday].charAt(0)
      });
    }

    this.__months = [];
    this.__weekDays = [];
    afterNextRender(this, () => {
      this.__months = months;
      this.__weekDays = weekDays;
    });
  }

  /**
   * This method returns the formatted month's week days already padded in the beginning and in the end.
   *
   * @param {Number} month The month whose week days will be returned.
   */
  __getDaysForMonth (month) {
    return this.__months[month].days.length === this.__numberOfColumns
      ? this.__months[month].days
      : this.__months[month].days.concat(new Array(this.__numberOfColumns - this.__months[month].days.length));
  }

  /**
   * This method increments the current year by one.
   */
  __incrementYear () {
    this.year++;
  }

  /**
   * This method decrementes the current year by one.
   */
  __decrementYear () {
    this.year--;
  }

  /**
   * This method receives an weekDay as a parameter and returns the CSS class 'cell--weekend' if that day
   * is either Saturday or Sunday.
   *
   * @param {Number} weekDay The weekday that will be checked to see if it's either Saturday or Sunday.
   */
  __isWeekend (weekDay) {
    return weekDay === 0 || weekDay === 6 ? 'cell--weekend' : '';
  }

  /**
   * This method is invoked when one cell is clicked which will activate the current date.
   *
   * @param {Object} event The event's object.
   */
  __cellClicked (event) {
    const cellDataset = event.target.dataset;

    this.activeDate = new Date(this.year, cellDataset.month, cellDataset.day);
  }

  /**
   * This method gets invoked when the active date changes and paints its corresponding cell.
   */
  __activeDateChanged () {
    if (this.__activeCell) this.__activeCell.removeAttribute('active');

    const activeCellSelector = `.cell[data-month="${this.activeDate.getMonth()}"][data-day="${this.activeDate.getDate()}"]`;
    this.__activeCell = this.shadowRoot.querySelector(activeCellSelector);

    // This means the calendar is not yet fully rendered, so we postpone the remaining function.
    if (!this.__activeCell) {
      return afterNextRender(this, () => this.__activeDateChanged());
    }

    this.__activeCell.setAttribute('active', true);
  }
}

customElements.define(CasperCalendar.is, CasperCalendar);
