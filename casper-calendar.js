import { CasperCalendarPaint } from './mixins/casper-calendar-paint.js';
import { CasperCalendarMouseEvents } from './mixins/casper-calendar-mouse-events.js';

import moment from 'moment/src/moment.js';
import '@casper2020/casper-icons/casper-icon.js';
import { templatize } from '@polymer/polymer/lib/utils/templatize.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperCalendar extends CasperCalendarPaint(CasperCalendarMouseEvents(PolymerElement)) {

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
       * The date range that is currently active.
       *
       * @type {Array}
       */
      activeDates: {
        type: Array,
        value: [],
        notify: true,
        observer: '__activeDatesChanged',
      },
      /**
       * The list of items for each month of the current year.
       *
       * @type {Array}
       */
      items: {
        type: Array,
        value: [],
        observer: '__itemsChanged'
      },
      /**
       * This property contains the resource that will return the list of holidays for the calendar.
       *
       * @type {Array}
       */
      holidaysJsonApiResource: {
        type: String,
        observer: '__holidaysJsonApiResourceChanged'
      },
      /**
       * This array contains the cells that are currently painted in the page.
       *
       * @type {Array}
       */
      __activeCells: {
        type: Array,
        value: []
      },
      /**
       * This array contains the list of holidays.
       */
      __holidays: {
        type: Array,
        value: []
      },
      /**
       * This array contains the rows that are currently expanded.
       *
       * @type {Array}
       */
      __expandedMonths: {
        type: Array,
        value: []
      }
    }
  }

  static get template () {
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

        #main-container .row-container .cell.cell--left-header .month-items-toggle {
          display: flex;
          cursor: pointer;
          align-items: center;
        }

        #main-container .row-container .cell.cell--left-header .month-items-toggle:hover {
          color: var(--dark-primary-color);
        }

        #main-container .row-container .cell.cell--left-header .month-items-toggle casper-icon {
          width: 15px;
          height: 15px;
          color: var(--primary-color);
        }

        #main-container .row-container .cell.cell--left-header .month-items-toggle:hover casper-icon {
          color: var(--dark-primary-color);
        }

        #main-container .row-container .cell.cell--left-header.cell--year-header {
          justify-content: space-around;
        }

        #main-container .row-container .cell.cell--left-header.cell--year-header casper-icon {
          width: 15px;
          height: 15px;
          cursor: pointer;
          color: var(--primary-color);
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

        <template is="dom-repeat" items="[[__months]]" as="month" id="templateRepeat">
          <div class="row-container" data-month$="[[month.index]]">
            <!--Month left column header-->
            <div class="cell cell--left-header">[[month.name]]</div>

            <template is="dom-repeat" items="[[__getMonthDays(index)]]" as="monthDay">
              <div
                data-month$="[[month.index]]"
                data-day$="[[monthDay.index]]"
                on-mouseup="__cellOnMouseUp"
                on-mousedown="__cellOnMouseDown"
                on-mouseenter="__cellOnMouseEnter"
                class$="cell [[__isWeekend(monthDay.weekDay)]]">
                  [[monthDay.index]]
              </div>
            </template>
          </div>
        </template>
      </div>

      <template id="item-row-template">
        <div style$="[[itemRowContainerStyle]]" class="item-row-container">
          <div>[[title]]</div>
          <template is="dom-repeat" items="[[intervals]]" as="interval">
            <div style$="[[interval.styles]]" tooltip="[[interval.tooltip]]"></div>
          </template>
        </div>
      </template>
    `;
  }

  ready () {
    window.moment = moment;
    window.calendar = this;
    super.ready();

    this.addEventListener('mousemove', event => this.app.tooltip.mouseMoveToolip(event));
    this.$.templateRepeat.addEventListener('dom-change', () => {
      afterNextRender(this, () => {
        // Apply the grid styling taking into account the number of columns.
        this.shadowRoot.querySelectorAll('.row-container').forEach(rowContainer => {
          rowContainer.style.display = 'grid';
          rowContainer.style.gridTemplateColumns = `10% repeat(${this.__numberOfColumns}, 1fr)`;
        });

        this.__paintTodayCell();
        this.__paintActiveDates();
        this.__paintHolidayCells();
      });
    });
  }

  /**
   * This method either collapses / expands the current month.
   *
   * @param {Number} month The month that will be collapsed / expanded.
   */
  expandOrCollapseMonth (month) {
    !this.__expandedMonths.includes(month)
      ? this.expandMonth(month)
      : this.collapseMonth(month);
  }

  /**
   * This method will expand the current month if it has items.
   *
   * @param {Number} month The month that will be expanded.
   */
  expandMonth (month) {
    const monthDays = this.__getMonthDays(month);
    const monthItems = this.__getMonthItems(month);

    // This means the month is already expanded or has no items.
    if (this.__expandedMonths.includes(month) || monthItems.length === 0) return;
    this.__expandedMonths.push(month);

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
        }

        const currentDay = monthDays[dayCount].index;
        const currentInterval = currentItem.intervals.find(interval => interval.start <= currentDay && interval.end >= currentDay);

        if (!currentInterval) {
          currentItemIntervals.push({});
          continue;
        }

        // Since we span the the columns when drawing ranges, skip all the days but the first.
        if (currentInterval.start !== currentDay) continue;

        let currentIntervalStyles = `
          grid-column: span ${currentInterval.end - currentInterval.start + 1};
          background-color: rgba(var(--primary-color-rgb), 0.3);
        `;

        if (currentInterval.halfDay) {
          currentIntervalStyles = currentInterval.onlyMorning
            ? `${currentIntervalStyles} height: 50%;`
            : `${currentIntervalStyles} height: 50%; align-self: end;`;
        }

        currentItemIntervals.push({
          tooltip: currentInterval.tooltip,
          styles: currentIntervalStyles
        });
      }

      const ItemRowTemplateClass = templatize(this.$['item-row-template']);
      const templateInstance = new ItemRowTemplateClass({
        title: currentItem.title,
        intervals: currentItemIntervals,
        itemRowContainerStyle: `grid-template-columns: 10% repeat(${this.__numberOfColumns}, 1fr);`
      });

      documentFragment.appendChild(templateInstance.root);
    }

    // Append the items row and change the toggle icon.
    const rowContainer = this.shadowRoot.querySelector(`.row-container[data-month="${month}"]`);
    rowContainer.parentElement.insertBefore(documentFragment, rowContainer.nextElementSibling);
    rowContainer.querySelector('.month-items-toggle casper-icon').icon = 'fa-solid:caret-down';
  }

  /**
   * This method will collapse the current month.
   *
   * @param {Number} month The month that will be collapsed.
   */
  collapseMonth (month) {
    this.__expandedMonths = this.__expandedMonths.filter(expandedMonth => expandedMonth !== month);

    const rowContainer = this.shadowRoot.querySelector(`.row-container[data-month="${month}"]`);
    rowContainer.querySelector('.month-items-toggle casper-icon').icon = 'fa-solid:caret-right';

    while (rowContainer.nextElementSibling) {
      if (rowContainer.nextElementSibling.classList.contains('item-row-container')) {
        rowContainer.parentElement.removeChild(rowContainer.nextElementSibling);
        continue;
      }

      break;
    }
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

    this.__months = this.__weekDays = this.__holidays = [];

    afterNextRender(this, () => {
      this.__months = months;
      this.__weekDays = weekDays;

      // Fetch holidays for the current year.
      this.__holidaysJsonApiResourceChanged();
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
   * This method returns all the items for a specified month.
   *
   * @param {Number} month The month whose items will be returned.
   */
  __getMonthItems (month) {
    return this.items && this.items.length > month && this.items[month].length > 0 ? this.items[month] : [];
  }

  /**
   * This method increments the current year by one.
   */
  __incrementYear () {
    this.year++;
  }

  /**
   * This method decrements the current year by one.
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
   * This method gets invoked when the active dates changes and paints their corresponding cells.
   */
  __activeDatesChanged () {
    // This means the active dates were changed internally.
    if (this.__activeDatesLock) return;

    // Guarantee that all the objects are instances of the moment.
    this.__internallyChangeProperty('activeDates', this.activeDates.map(activeDate => ({
      start: moment.isMoment(activeDate.start) ? activeDate.start : moment(activeDate.start),
      end: moment.isMoment(activeDate.end) ? activeDate.end : moment(activeDate.end),
    })));

    afterNextRender(this, () => { this.__paintActiveDates(); });
  }

  /**
   * This method gets invoked when the property holidays changes.
   */
  async __holidaysJsonApiResourceChanged () {
    if (!this.holidaysJsonApiResource) return;

    try {
      const holidaysJsonApiResource = this.holidaysJsonApiResource.includes('?')
        ? `${this.holidaysJsonApiResource}&filter[year]=${this.year}`
        : `${this.holidaysJsonApiResource}?filter[year]=${this.year}`;

      const socketResponse = await this.app.socket.jget(holidaysJsonApiResource);

      this.__holidays = socketResponse.data;
      this.__paintHolidayCells();
    } catch (error) {
      console.error(error);

      this.app.openToast({ text: 'Ocorreu um erro ao obter os dados.', backgroundColor: 'red' });
    }
  }

  /**
   * This method gets invoked when the property items changes.
   */
  __itemsChanged () {
    this.__expandedMonths = [];
    this.shadowRoot.querySelectorAll('.item-row-container').forEach(itemsRowContainer => itemsRowContainer.remove());
    this.shadowRoot.querySelectorAll('.month-items-toggle').forEach(itemsToggleElement => itemsToggleElement.remove());

    this.items.forEach((item, month) => {
      if (item.length === 0) return;

      const itemsToggleIconElement = document.createElement('casper-icon');
      itemsToggleIconElement.icon = 'fa-solid:caret-right';

      const itemsToggleContainerElement = document.createElement('div');
      itemsToggleContainerElement.className = 'month-items-toggle';
      itemsToggleContainerElement.appendChild(itemsToggleIconElement);
      itemsToggleContainerElement.appendChild(document.createTextNode(item.length));
      itemsToggleContainerElement.addEventListener('click', event => {
        const rowContainer = event.composedPath().find(element => element.classList && element.classList.contains('row-container'));
        this.expandOrCollapseMonth(parseInt(rowContainer.dataset.month));
      });

      this.shadowRoot.querySelector(`.row-container[data-month="${month}"] .cell--left-header`).appendChild(itemsToggleContainerElement);
    });
  }

  /**
   * This method is used to internally change the value of a property "without" triggering its observer.
   *
   * @param {String} propertyName The name of the property that will be changed.
   * @param {String | Number  | Boolean | Object} propertyValue The new value that the propery will have.
   */
  __internallyChangeProperty (propertyName, propertyValue) {
    const propertyLockName = `__${propertyName}Lock`;

    this[propertyLockName] = true;
    this[propertyName] = propertyValue;
    this[propertyLockName] = false;
  }

  /**
   * This method adds a new active date to the list of existing ones and tries to merge the adjacent ones.
   *
   * @param {Object} newActiveDate The date that we'll be adding.
   */
  __mergeActiveDates (newActiveDate) {
    const updatedActiveDates = [];

    this.activeDates.forEach(activeDate => {
      const activeDateEnd = moment(activeDate.end).add(1, 'days');
      const activeDateStart = moment(activeDate.start).subtract(1, 'days');

      if (
        (newActiveDate.start.isSameOrBefore(activeDateStart) && newActiveDate.end.isSameOrAfter(activeDateEnd)) ||
        (newActiveDate.start.isSameOrAfter(activeDateStart) && newActiveDate.start.isSameOrBefore(activeDateEnd) && newActiveDate.end.isSameOrAfter(activeDateEnd)) ||
        (newActiveDate.start.isSameOrBefore(activeDateStart) && newActiveDate.end.isSameOrAfter(activeDateStart) && newActiveDate.end.isSameOrBefore(activeDateEnd))
      ) {
        // This means the two dates overlap so we merge them together.
        newActiveDate = {
          start: moment.min([newActiveDate.start, activeDate.start]),
          end: moment.max([newActiveDate.end, activeDate.end]),
        };
      } else {
        // In this case, since there was no overlap, push the unadulterated date.
        updatedActiveDates.push(activeDate);
      }
    });

    return [...updatedActiveDates, newActiveDate];
  }

  /**
   * This method will look into the existing active dates and return the index of the one that contains the specified day.
   *
   * @param {Object} day The day we're trying to find.
   */
  __activeDateIndexOfDay (day) {
    // The fourth parameter indicates that the comparison is inclusive.
    return this.activeDates.findIndex(activeDate => day.isBetween(activeDate.start, activeDate.end, null, '[]'));
  }
}

customElements.define(CasperCalendar.is, CasperCalendar);