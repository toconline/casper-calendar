import moment from 'moment/src/moment.js';
import { templatize } from '@polymer/polymer/lib/utils/templatize.js';

export const CasperCalendarItems = superClass => {
  return class extends superClass {
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

          // Decide the background color for the current interval.
          let backgroundColor = 'rgba(var(--primary-color-rgb), 0.3)';
          if (currentInterval.backgroundColor) backgroundColor = currentInterval.backgroundColor;
          else if (currentItem.backgroundColor) backgroundColor = currentItem.backgroundColor;

          let currentIntervalStyles = `
          background-color: ${backgroundColor};
          grid-column: span ${currentInterval.end - currentInterval.start + 1};
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
     * This method gets invoked when the property items changes.
    */
    __itemsChanged () {
      if (this.__isComponentInitializing) return;

      this.__expandedMonths = [];
      this.shadowRoot.querySelectorAll('.item-row-container, .month-items-toggle').forEach(element => element.remove());
      this.shadowRoot.querySelectorAll('.cell.cell--has-item').forEach(element => element.classList.remove('cell--has-item'));

      if (!this.items || this.items.constructor !== Array) {
        return console.warn('The items property should be an array, empty or not.');
      }

      this.__itemsPerMonth = {};
      for (let month = 0; month < 12; month++) {
        this.__itemsPerMonth[month] = [];
      }

      this.items.forEach((item, itemIndex) => {
        item.intervals.forEach((interval, intervalIndex, intervals) => {
          // Internal idenfiers for each item and interval.
          const itemIdentifier = itemIndex;
          const itemIntervalIdentifier = `${itemIndex}-${intervalIndex}`;

          // If the interval doesn't contain the end property assume it is a one day interval.
          intervals[intervalIndex].end = interval.end || interval.start;

          for (let currentDate = moment(interval.start); currentDate.diff(interval.end, 'days') <= 0; currentDate.add(1, 'days')) {
            this.__findCellByMonthAndDay(currentDate.month(), currentDate.date()).classList.add('cell--has-item');

            // Check if the item was already created in the current month.
            const existingItemIndex = this.__itemsPerMonth[currentDate.month()].findIndex(monthItem => monthItem[this.idInternalProperty] === itemIdentifier);

            // When the item does not exist, create it with the current interval.
            if (existingItemIndex === -1) {
              this.__itemsPerMonth[currentDate.month()].push({
                ...item,
                [this.idInternalProperty]: itemIdentifier,
                intervals: [{
                  [this.idInternalProperty]: itemIntervalIdentifier,
                  start: currentDate.date(),
                  end: currentDate.date()
                }]
              });
            } else {
              // Check if the item already contains the current interval.
              const existingIntervalIndex = this.__itemsPerMonth[currentDate.month()][existingItemIndex].intervals.findIndex(monthItemInterval => monthItemInterval[this.idInternalProperty] === itemIntervalIdentifier);
              existingIntervalIndex !== -1
                ? this.__itemsPerMonth[currentDate.month()][existingItemIndex].intervals[existingIntervalIndex].end = currentDate.date()
                : this.__itemsPerMonth[currentDate.month()][existingItemIndex].intervals.push({
                  [this.idInternalProperty]: itemIntervalIdentifier,
                  start: currentDate.date(),
                  end: currentDate.date()
                });
            }
          }
        });
      });

      this.__createMonthExpansionCollapseIcons();
    }

    __createMonthExpansionCollapseIcons () {
      Object.entries(this.__itemsPerMonth).forEach(([month, items]) => {
        if (items.length === 0) return;

        const itemsToggleIconElement = document.createElement('casper-icon');
        itemsToggleIconElement.icon = 'fa-solid:caret-right';

        const itemsToggleContainerElement = document.createElement('div');
        itemsToggleContainerElement.className = 'month-items-toggle';
        itemsToggleContainerElement.appendChild(itemsToggleIconElement);
        itemsToggleContainerElement.appendChild(document.createTextNode(items.length));
        itemsToggleContainerElement.addEventListener('click', event => {
          const rowContainer = event.composedPath().find(element => element.classList && element.classList.contains('row-container'));
          this.expandOrCollapseMonth(parseInt(rowContainer.dataset.month));
        });

        this.shadowRoot.querySelector(`.row-container[data-month="${month}"] .cell--left-header`).appendChild(itemsToggleContainerElement);
      });
    }

    /**
     * This method returns all the items for a specified month.
     *
     * @param {Number} month The month whose items will be returned.
     */
    __getMonthItems (month) {
      return this.__itemsPerMonth && this.__itemsPerMonth.hasOwnProperty(month) ? this.__itemsPerMonth[month] : [];
    }
  }
};