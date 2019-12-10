import moment from 'moment/src/moment.js';
import '@casper2020/casper-icons/casper-icon.js';
import { templatize } from '@polymer/polymer/lib/utils/templatize.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperCalendar extends PolymerElement {

  static get is () {
    return 'casper-calendar';
  }

  static get properties () {
    return {
      /**
       * The global application's app object.
       *
       * @type {Object}
       */
      app: {
        type: Object,
        value: window.app
      },
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
      items: {
        type: Array,
        value: () => {
          return [
            [],
            [],
            [
              { title: 'Teste 1', intervals: [{ start: 1, end: 2, tooltip: 'Tessste' }, { start: 11, end: 11 }]},
              { title: 'Teste 2', intervals: [{ start: 5, end: 17 }]},
              { title: 'Teste 3', intervals: [{ start: 24, end: 30 }, { start: 7, end: 17 }]},
              { title: 'Teste 4', intervals: [{ start: 5, end: 10 }]},
            ],
            [{ title: 'Teste', intervals: [{ start: 5, end: 10 }]}],
            [{ title: 'Teste', intervals: [{ start: 5, end: 10 }]}],
            [{ title: 'Teste', intervals: [{ start: 5, end: 10 }]}],
          ];
        }
      },
      __holidays: {
        type: Array,
        value: () => {
          return [
            { name: 'Natal', date: new Date(2019, 11, 25) },
            { name: 'Dia de Implementação da República', date: new Date(2019, 9, 5) },
            { name: 'Revolução 25 de Abril', date: new Date(2019, 3, 25) },
            { name: 'Dia de Portugal', date: new Date(2019, 5, 10) },
          ];
        }
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
          display: none;
          grid-template-rows: 30px;
        }

        #main-container .row-container .cell {
          flex: 1;
          border: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          font-size: 14px;
          position: relative;
          box-sizing: border-box;
          border: 1px #F2F2F2 solid;
        }

        #main-container .row-container .cell:not(.cell--left-header):not(.cell--top-header)[active] {
          color: var(--on-primary-color);
          background-color: var(--primary-color);
        }

        #main-container .row-container .cell:not(.cell--left-header):not(.cell--top-header):hover {
          cursor: pointer;
          box-shadow: 1px 1px 7px #999999;
        }

        #main-container .row-container .cell.cell--today {
          color: white;
          background-color: orange;
        }

        #main-container .row-container .cell.cell--weekend {
          color: red;
          background-color: #E4E4E4;
        }

        #main-container .row-container .cell.cell--left-header {
          padding: 0 10px;
          align-items: center;
          justify-content: space-between;
          background-color: #E4E4E4;
          color: var(--primary-color);
        }

        #main-container .row-container .cell.cell--left-header .month-items {
          display: flex;
          cursor: pointer;
          align-items: center;
        }

        #main-container .row-container .cell.cell--left-header .month-items:hover {
          color: var(--dark-primary-color);
        }

        #main-container .row-container .cell.cell--left-header .month-items casper-icon {
          width: 15px;
          height: 15px;
          --casper-icon-fill-color: var(--primary-color);
        }

        #main-container .row-container .cell.cell--left-header .month-items:hover casper-icon {
          --casper-icon-fill-color: var(--dark-primary-color);
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

        #main-container .row-container .cell .holiday {
          right: 0;
          bottom: 0;
          position: absolute;
          width: 13px;
          height: 13px;
          padding-top: 1px;
          padding-left: 1px;
          font-size: 8px;
          line-height: 13px;
          color: white;
          display: flex;
          opacity: 0.75;
          box-sizing: border-box;
          border-radius: 12px 3px 3px 3px;
          justify-content: center;
          background-color: #FF5000;
        }

        /* Item row styling */
        .item-row-container {
          display: grid;
          grid-template-rows: 30px;
        }

        .item-row-container:hover {
          background-color: rgba(200, 200, 200, 0.1);
        }

        .item-row-container > div {
          box-sizing: border-box;
          border: 1px #F2F2F2 solid;
        }

        .item-row-container > div:first-of-type {
          flex-grow: 0;
          flex-shrink: 0;
          flex-basis: 10%;
          padding: 0 10px;
          font-size: 14px;
          display: flex;
          align-items: center;
          color: var(--primary-color);
        }

        .item-row-container > div:not(:first-of-type) {
          flex: 1;
          height: 30px;
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

        <div on-mouseleave="__cellContainerOnMouseLeave">
          <template is="dom-repeat" items="[[__months]]" as="month" id="templateRepeat">
            <div class="row-container">
              <!--Month left column header-->
              <div class="cell cell--left-header">
                [[month.name]]

                <template is="dom-if" if="[[__monthHasItems(month.index)]]">
                  <div class="month-items" on-click="__expandOrCollapseMonthItems" data-month$="[[month.index]]">
                    <casper-icon icon="fa-solid:caret-right"></casper-icon>
                    [[__getItemsCountForMonth(month.index)]]
                  </div>
                </template>
                </div>

              <template is="dom-repeat" items="[[__getMonthDays(index)]]" as="monthDay">
                <div
                  data-year$="[[year]]"
                  data-month$="[[month.index]]"
                  data-day$="[[monthDay.index]]"
                  on-click="__cellClicked"
                  on-mouseup="__cellOnMouseUp"
                  on-mousedown="__cellOnMouseDown"
                  on-mouseenter="__cellOnMouseEnter"
                  class$="cell [[__isWeekend(monthDay.weekDay)]]">
                    [[monthDay.index]]
                    <!--Holiday-->
                    <template is="dom-if" if="[[__isHoliday(month.index, monthDay.index)]]">
                      <span tooltip="[[__holidayTooltip(month.index, monthDay.index)]]" class="holiday">F</span>
                    </template>
                  </div>
              </template>
            </div>
          </template>
        </div>
      </div>

      <template id="item-row-template">
        <div style$="[[rowContainerStyle]]" class="item-row-container">
          <div>[[title]]</div>
          <template is="dom-repeat" items="[[intervals]]" as="interval">
            <div style$="[[interval.styles]]" tooltip="[[interval.tooltip]]"></div>
          </template>
        </div>
      </template>
    `;
  }

  ready () {
    super.ready();

    this.addEventListener('mousemove', event => this.app.tooltip.mouseMoveToolip(event));
    this.$.templateRepeat.addEventListener('dom-change', () => {
      afterNextRender(this, () => {
        this.shadowRoot.querySelectorAll('.row-container').forEach(rowContainer => {
          rowContainer.style.display = 'grid';
          rowContainer.style.gridTemplateColumns = `10% repeat(${this.__numberOfColumns}, 1fr)`;
        });

        this.__paintTodayCell();
        this.__paintActiveDateCell(true);
        this.__paintActiveDateRangeCells(true);

      });
    });
  }

  /**
   * This method paints the cell that represents the present day.
   */
  __paintTodayCell () {
    const today = new Date();
    if (today.getFullYear() !== this.year) return;

    const todayCell = this.__findCellByYearMonthAndDay(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    if (todayCell) todayCell.classList.add('cell--today');
  }

  /**
   * This method paints the current active date cell.
   *
   * @param {Boolean} wasCalendarRedrawn This flag indicates if the method was invoked after the calendar was redrawn or not.
   */
  __paintActiveDateCell (wasCalendarRedrawn) {
    if (!wasCalendarRedrawn) this.__removeActiveAttributeFromCells();

    if (!this.activeDate || this.activeDate.getFullYear() !== this.year) return;

    const activeDateCell = this.__findCellByYearMonthAndDay(
      this.activeDate.getFullYear(),
      this.activeDate.getMonth(),
      this.activeDate.getDate()
    );

    if (activeDateCell) {
      this.__activeCells.push(activeDateCell);
      activeDateCell.setAttribute('active', '');
    }
  }

  /**
   * This method paints the current active date range cells.
   *
   * @param {Boolean} wasCalendarRedrawn This flag indicates if the method was invoked after the calendar was redrawn or not.
   */
  __paintActiveDateRangeCells (wasCalendarRedrawn) {
    if (!wasCalendarRedrawn) this.__removeActiveAttributeFromCells();

    if (!this.activeDateRange) return;

    this.__paintDateRangeCells(
      moment(this.activeDateRange.startRange),
      moment(this.activeDateRange.endRange)
    );
  }

  /**
   * This method gets invoked as soon as the year changes.
   *
   * @param {Number} year The current year.
   */
  __yearChanged (year) {
    const months = [];
    this.__numberOfColumns = 31;

    const yearFirstWeekDay = new Date(year, 0, 1).getDay();

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      months.push({
        index: monthIndex,
        name: moment.months()[monthIndex].substring(0, 3),
      });

      // Get the month's number of days and its first week day.
      const firstDayOfMonth = moment(new Date(year, monthIndex, 1));
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
  __getMonthDays (month) {
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

  __isHoliday (month, day) {
    return this.__holidays.some(holiday => holiday.date.getMonth() === month && holiday.date.getDate() === day);
  }

  __holidayTooltip (month, day) {
    return this.__holidays.find(holiday => holiday.date.getMonth() === month && holiday.date.getDate() === day).name;
  }

  /**
   * This method is invoked when one cell is clicked which will activate the current date.
   *
   * @param {Object} event The event's object.
   */
  __cellClicked (event) {
    // This means, it's an empty day used as padding.
    if (!Object.keys(event.target.dataset).includes('day')) return;

    this.activeDate = new Date(
      this.year,
      event.target.dataset.month,
      event.target.dataset.day
    );
  }

  /**
   * This method gets invoked when the user presses the mouse key down on top of a cell.
   *
   * @param {Object} event The event's object.
   */
  __cellOnMouseDown (event) {
    // This means, it's an empty day used as padding.
    if (!Object.keys(event.target.dataset).includes('day')) return;

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

      this.__internallyChangeProperty('activeDate', undefined);
      this.__internallyChangeProperty('activeDateRange', {
        startRange: this.__activeRangeStart.toDate(),
        endRange: this.__activeRangeEnd.toDate(),
      });
    }
  }

  /**
   * This method is invoked when the user abandons the cell container and interrupts the date range selection
   * if he's currently selecting one.
   */
  __cellContainerOnMouseLeave () {
    if (this.__isUserSelectingRange) {
      this.__cellOnMouseUp();
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

    this.__internallyChangeProperty('activeDateRange', undefined);
    this.__paintActiveDateCell();
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
    if (this.__activeDateRangeLock) return;

    this.__internallyChangeProperty('activeDate', undefined);
    this.__paintActiveDateRangeCells();
  }

  /**
   * This method queries the page for the cell which has a specific month and day.
   *
   * @param {Number} month The month that will be used in the cell's selector.
   * @param {Number} day The day that will be used in the cell's selector.
   */
  __findCellByYearMonthAndDay (year, month, day) {
    return this.shadowRoot.querySelector(`.cell[data-year="${year}"][data-month="${month}"][data-day="${day}"]`);
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
    if (rangeStart.year() > this.year || rangeEnd.year() < this.year) return;

    const daysBetweenBothDates = rangeEnd.diff(rangeStart, 'days');

    for (let daysCount = 0; daysCount <= Math.abs(daysBetweenBothDates); daysCount++) {
      const currentDate = daysBetweenBothDates > 0
        ? moment(rangeStart).add(daysCount, 'days')
        : moment(rangeStart).subtract(daysCount, 'days');

      // If a date interval spans over several years and the current date is not displayed, skip to the next iteration.
      if (currentDate.year() !== this.year) continue;

      const currentDateCell = this.__findCellByYearMonthAndDay(
        currentDate.year(),
        currentDate.month(),
        currentDate.date()
      );

      if (currentDateCell) {
        currentDateCell.setAttribute('active', '');
        this.__activeCells.push(currentDateCell);
      }
    }
  }

  /**
   * This method is used to internally change the value of a property "without" triggering its observer.
   *
   * @param {Object} activeDateRange The new activeDate value.
   */
  __internallyChangeProperty (propertyName, propertyValue) {
    const propertyLockName = `__${propertyName}Lock`;

    this[propertyLockName] = true;
    this[propertyName] = propertyValue;
    this[propertyLockName] = false;
  }

  /**
   * This method returns a boolean indicating if a specified month has items or not.
   *
   * @param {Number} month The month that will be checked to see if it has items.
   */
  __monthHasItems (month) {
    return this.items && this.items.length > month && this.items[month].length > 0;
  }

  /**
   * This method returns all the items for a specified month.
   *
   * @param {Number} month The month whose items will be returned.
   */
  __getMonthItems (month) {
    return this.items && this.items.length > month && this.items[month].length > 0 ? this.items[month] : [];
  }

  /**
   * This method returns how many items a specified item has.
   *
   * @param {Number} month The month whose items count will be returned.
   */
  __getItemsCountForMonth (month) {
    return this.items && this.items.length > month ? this.items[month].length : 0;
  }

  __expandOrCollapseMonthItems (event) {
    const monthRowElement = event.composedPath().find(element => element.classList && element.classList.contains('row-container'));
    const itemsToggleElement = event.composedPath().find(element => element.classList && element.classList.contains('month-items'));

    const month = parseInt(itemsToggleElement.dataset.month);
    const monthDays = this.__getMonthDays(month);
    const monthItems = this.__getMonthItems(month);

    const documentFragment = new DocumentFragment();

    // Loop through all the items.
    for (let itemCount = 0; itemCount < monthItems.length; itemCount++) {
      const currentItemIntervals = [];
      const currentItem = monthItems[itemCount];

      // Loop through all the month days, including the days used as padding to ensure the alignment of the cells.
      for (let dayCount = 0; dayCount < monthDays.length; dayCount++) {
        // This means, it's an empty day used as padding.
        if (!monthDays[dayCount]) {
          currentItemIntervals.push({});
          continue;
        };

        const currentDay = monthDays[dayCount].index;
        const currentDayInterval = currentItem.intervals.find(interval => interval.start <= currentDay && interval.end >= currentDay);

        if (!currentDayInterval) {
          currentItemIntervals.push({});
        } else if (currentDayInterval.start === currentDay) {
          currentItemIntervals.push({
            tooltip: currentDayInterval.tooltip,
            styles: `
              background-color: rgba(var(--primary-color-rgb), 0.3);
              grid-column: span ${currentDayInterval.end - currentDayInterval.start + 1};
            `
          });
        }
      }

      const ItemRowTemplateClass = templatize(this.$['item-row-template']);
      const templateInstance = new ItemRowTemplateClass({
        title: currentItem.title,
        intervals: currentItemIntervals,
        rowContainerStyle: `grid-template-columns: 10% repeat(${this.__numberOfColumns}, 1fr)`
      });

      documentFragment.appendChild(templateInstance.root);
    }

    monthRowElement.parentElement.insertBefore(documentFragment, monthRowElement.nextElementSibling);
  }
}

customElements.define(CasperCalendar.is, CasperCalendar);
