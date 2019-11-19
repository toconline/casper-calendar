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
      }
    }
  }

  static get template() {
    return html`
      <style>
        #main-container {
          display: flex;
          flex-grow: 1;
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
          <div class="cell cell--left-header cell--year-header">
            <casper-icon icon="fa-light:chevron-double-left" on-click="__decrementYear"></casper-icon>
            [[year]]
            <casper-icon icon="fa-light:chevron-double-right" on-click="__incrementYear"></casper-icon>
          </div>
          <template is="dom-repeat" items="[[__weekDays]]" as="weekDay">
            <div class$="cell cell--top-header [[__isWeekend(weekDay.weekDay)]]">[[weekDay.weekDayName]]</div>
          </template>
        </div>

        <template is="dom-repeat" items="[[__monthsWeekdays]]" as="monthWeekdays">
          <div class="row-container">
            <div class="cell cell--left-header">[[monthWeekdays.month]]</div>
            <template is="dom-repeat" items="[[__getDaysForMonth(index)]]" as="monthDay">
              <div class$="cell [[__isWeekend(monthDay.dayWeek)]]">[[monthDay.day]]</div>
            </template>
          </div>
        </template>
      </div>
    `;
  }

  __yearChanged () {
    const monthsWeekdays = [];
    this.__numberOfColumns = 31;

    const yearFirstWeekDay = new Date(this.year, 0, 1).getDay();

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      monthsWeekdays.push({ month: moment.months()[monthIndex].substring(0, 3) });

      // Get the month's number of days and its first week day.
      const firstDayOfMonth = moment(new Date(this.year, monthIndex, 1));
      const monthNumberOfDays = firstDayOfMonth.daysInMonth();
      const monthFirstWeekDay = firstDayOfMonth.day();

      const monthDays = [];
      for (let dayIndex = 1; dayIndex <= monthNumberOfDays; dayIndex++) {
        monthDays.push({
          day: dayIndex,
          dayWeek: dayIndex === 1
            ? firstDayOfMonth.day()
            : firstDayOfMonth.add(1, 'days').day()
        });
      }

      if (yearFirstWeekDay === monthFirstWeekDay) {
        monthsWeekdays[monthIndex].days = monthDays;
      } else {
        // Calculate how many days between the year's first week day and this month's first week day.
        let offset = monthFirstWeekDay >= yearFirstWeekDay
          ? monthFirstWeekDay - yearFirstWeekDay
          : monthFirstWeekDay + (7 - yearFirstWeekDay);

        monthsWeekdays[monthIndex].days = new Array(offset).concat(monthDays);
      }
    }

    this.__numberOfColumns = Math.max(...monthsWeekdays.map(monthWeekdays => monthWeekdays.days.length));

    const weekDays = [];
    for (let columnIndex = 0; columnIndex < this.__numberOfColumns; columnIndex++) {
      let currentWeekday = (yearFirstWeekDay + columnIndex) % 7;

      weekDays.push({
        weekDay: currentWeekday,
        weekDayName: moment.weekdays()[currentWeekday].charAt(0)
      });
    }

    this.set('__weekDays', []);
    this.set('__monthsWeekdays', []);
    afterNextRender(this, () => {
      this.set('__weekDays', weekDays);
      this.set('__monthsWeekdays', monthsWeekdays);
    });
  }

  /**
   * This method returns the formatted month's week days already padded in the beginning and in the end.
   *
   * @param {Number} month The month whose week days will be returned.
   */
  __getDaysForMonth (index) {
    return this.__monthsWeekdays[month].days.length === this.__numberOfColumns
      ? this.__monthsWeekdays[month].days
      : this.__monthsWeekdays[month].days.concat(new Array(this.__numberOfColumns - this.__monthsWeekdays[month].days.length));
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
}

customElements.define(CasperCalendar.is, CasperCalendar);
