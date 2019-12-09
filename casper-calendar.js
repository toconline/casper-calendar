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
      },
      /**
       * The date range that is currently active.
       *
       * @type {Object}
       */
      activeDateRange: {
        type: Object,
        observer: '__activeDateRangeChanged',
        notify: true
      },
      /**
       * This array contains the cells that are currently painted in the page.
       *
       * @type {Array}
       */
      __activeCells: {
        type: Array,
        value: []
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
                data-month$="[[month.index]]"
                data-day$="[[monthDay.index]]"
                on-click="__cellClicked"
                on-mouseup="__cellOnMouseUp"
                on-mousedown="__cellOnMouseDown"
                on-mouseenter="__cellOnMouseEnter"
                class$="cell [[__isWeekend(monthDay.weekDay)]]">[[monthDay.index]]</div>
            </template>
          </div>
        </template>
      </div>
    `;
  }

  ready () {
    super.ready();

    this.addEventListener('mouseout', () => {
      if (this.__isUserSelectingRange) {
        this.__cellOnMouseUp();
      }
    });
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
   * This method gets invoked when the user presses the mouse key down on top of a cell.
   *
   * @param {Object} event The event's object.
   */
  __cellOnMouseDown (event) {
    this.__removeActiveAttributeFromCells();

    this.__isUserHoldingMouseButton = true;
    this.__activeRangeStart = moment(new Date(
      this.year,
      event.composedPath().shift().dataset.month,
      event.composedPath().shift().dataset.day
    ));
  }

  /**
   * This method gets invoked when the user hovers through a cell. If he is holding the mouse key down, the component
   * will start to create an interval of dates painting the cells that are contained in the aforementioned interval.
   *
   * @param {Object} event The event's object.
   */
  __cellOnMouseEnter (event) {
    if (!this.__isUserHoldingMouseButton) return;

    this.__removeActiveAttributeFromCells();

    this.__isUserSelectingRange = true;
    this.__activeRangeEnd = moment(new Date(
      this.year,
      event.composedPath().shift().dataset.month,
      event.composedPath().shift().dataset.day
    ));

    this.__paintDateRangeCells(this.__activeRangeStart, this.__activeRangeEnd);
  }

  /**
   * This method is invoked when the user releases the mouse key and therefore we set the __isSelectingInterval to false.
   */
  __cellOnMouseUp () {
    this.__isUserHoldingMouseButton = false;
    if (this.__isUserSelectingRange) {
      this.__isUserSelectingRange = false;

      this.__internallyChangeActiveDate(undefined);
      this.__internallyChangeActiveDateRange({
        startRange: this.__activeRangeStart.toDate(),
        endRange: this.__activeRangeEnd.toDate(),
      });
    }
  }

  /**
   * This method gets invoked when the active date changes and paints its corresponding cell.
   *
   * @param {Date} activeDate The current active date.
   */
  __activeDateChanged (activeDate) {
    if (activeDate && activeDate.constructor.name !== 'Date') {
      return console.error('The activeDate property must be a valid Date object.');
    }

    // This means the active date was changed internally.
    if (this.__activeDateLock) {
      this.__activeDateLock = false;
      return;
    }

    const currentDateCell = this.__findCellByMonthAndDay(activeDate.getMonth(), activeDate.getDate());

    // This means the calendar is not yet fully rendered, so we postpone the remaining function.
    if (!currentDateCell) return afterNextRender(this, () => this.__activeDateChanged(activeDate));

    this.__removeActiveAttributeFromCells();
    this.__internallyChangeActiveDateRange(undefined);

    currentDateCell.setAttribute('active', true);
    this.__activeCells.push(currentDateCell);
  }

  /**
   * This method gets invoked when the active date changes and paints its corresponding cell.
   *
   * @param {Date} activeDate The current active date.
   */
  __activeDateRangeChanged (activeDateRange) {
    if (activeDateRange && (activeDateRange.constructor.name !== 'Object' || !activeDateRange.startRange || !activeDateRange.endRange)) {
      return console.error('The activeRangeDate property must be an Object and contain the startRange / endRange keys.');
    }

    // This means the active date range was changed internally.
    if (this.__activeDateRangeLock) {
      this.__activeDateRangeLock = false;
      return;
    }

    this.__removeActiveAttributeFromCells();
    this.__internallyChangeActiveDate(undefined);
    this.__paintDateRangeCells(
      moment(activeDateRange.startRange),
      moment(activeDateRange.endRange)
    );
  }

  /**
   * This method queries the page for the cell which has a specific month and day.
   *
   * @param {Number} month The month that will be used in the cell's selector.
   * @param {Number} day The day that will be used in the cell's selector.
   */
  __findCellByMonthAndDay (month, day) {
    return this.shadowRoot.querySelector(`.cell[data-month="${month}"][data-day="${day}"]`);
  }

  /**
   * This method resets the currently painted cells.
   */
  __removeActiveAttributeFromCells () {
    this.__activeCells.forEach(activeCell => activeCell.removeAttribute('active'));
    this.__activeCells = [];
  }

  /**
   * This function is used to paint the cells that are contained in a specific date range.
   *
   * @param {Date} rangeStart The range's start date.
   * @param {Date} rangeEnd The range's end date.
   */
  __paintDateRangeCells (rangeStart, rangeEnd) {
    const daysBetweenBothDates = rangeEnd.diff(rangeStart, 'days');

    for (let daysCount = 0; daysCount <= Math.abs(daysBetweenBothDates); daysCount++) {
      const currentDate = daysBetweenBothDates > 0
        ? moment(rangeStart).add(daysCount, 'days')
        : moment(rangeStart).subtract(daysCount, 'days');

      const currentDateCell = this.__findCellByMonthAndDay(currentDate.month(), currentDate.date());
      currentDateCell.setAttribute('active', true);
      this.__activeCells.push(currentDateCell);
    }
  }

  /**
   * This method is used to internally change the value of the active date "without" triggering its observer.
   *
   * @param {Date} activeDate The new activeDate value.
   */
  __internallyChangeActiveDate (activeDate) {
    this.__activeDateLock = true;
    this.activeDate = activeDate;
  }

  /**
   * This method is used to internally change the value of the active date range "without" triggering its observer.
   *
   * @param {Object} activeDateRange The new activeDate value.
   */
  __internallyChangeActiveDateRange (activeDateRange) {
    this.__activeDateRangeLock = true;
    this.activeDateRange = activeDateRange;
  }
}

customElements.define(CasperCalendar.is, CasperCalendar);
