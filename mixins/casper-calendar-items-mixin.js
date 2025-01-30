/* 
 * Copyright (C) 2020 Cloudware S.A. All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import moment from 'moment/src/moment.js';
import { templatize } from '@polymer/polymer/lib/utils/templatize.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

export const CasperCalendarItemsMixin = superClass => {
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
      // This means that either the calendar is currently rendering or the month is already collapsed.
      if (!this.__executeTaskOrEnqueueIt(this.collapseMonth, month) || !this.__expandedMonths.includes(month)) return;

      this.__expandedMonths = this.__expandedMonths.filter(expandedMonth => expandedMonth !== month);

      const rowContainer = this.shadowRoot.querySelector(`.row-container[data-month="${month}"]`);
      rowContainer.querySelector('.month-items-toggle casper-icon').icon = 'fa-solid:caret-right';

      while (rowContainer.nextElementSibling) {
        if (rowContainer.nextElementSibling.classList.contains('item-row-container')) {
          rowContainer.nextElementSibling.remove();
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
      // This means that either the calendar is currently rendering or the month is already expanded.
      if (!this.__executeTaskOrEnqueueIt(this.expandMonth, month) || this.__expandedMonths.includes(month)) return;

      const monthDays = this.__getMonthDays(month);
      const monthItems = this.__getMonthItems(month);

      // This means the month has no items.
      if (monthItems.length === 0) return;
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
          let backgroundColor = this.$.selector.getBackgroundColorForType(currentInterval.meta.type);
          if (currentInterval.backgroundColor) backgroundColor = currentInterval.backgroundColor;
          else if (currentItem.backgroundColor) backgroundColor = currentItem.backgroundColor;

          const currentIntervalStyles = `
            background-color: ${backgroundColor};
            grid-column: span ${currentInterval.end - currentInterval.start + 1};
          `;

          currentItemIntervals.push({
            styles: currentIntervalStyles,
            tooltip: currentInterval.tooltip,
            [this.idInternalProperty]: currentInterval[this.idInternalProperty],
          });
        }

        const ItemRowTemplateClass = templatize(this.$['item-row-template']);
        const templateInstance = new ItemRowTemplateClass({
          title: currentItem.title,
          intervals: currentItemIntervals,
          itemRowContainerStyle: `
            grid-template-columns: 10% repeat(${this.__numberOfColumns}, 1fr);
            ${currentItem.rowBackgroundColor ? `background-color: ${currentItem.rowBackgroundColor}` : ''}
          `
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
      if (this.__isComponentRendering) return;

      this.__expandedMonths = [];
      this.shadowRoot.querySelectorAll('.item-row-container, .month-items-toggle').forEach(element => element.remove());
      this.shadowRoot.querySelectorAll('.cell.cell--has-item').forEach(element => element.classList.remove('cell--has-item'));

      // Check if the items property contains an Array.
      if (!this.items || this.items.constructor !== Array) return console.warn('The items property should be an array, empty or not.');

      this.__itemsPerMonth = Object.fromEntries(Array.from(Array(12).keys()).map(month => [month, []]));

      this.items.forEach((item, itemIndex) => {
        item.intervals.forEach((interval, intervalIndex) => {
          // Internal idenfiers for each item and interval.
          const itemId = itemIndex;
          const intervalId = `${itemIndex}-${intervalIndex}`;

          // If the interval doesn't contain the end property assume it is a one day interval.
          interval.end = interval.end || interval.start;

          this.__executeForEachDayBetweenDates(currentDate => {
            this.__findCellByMonthAndDay(currentDate.month(), currentDate.date()).classList.add('cell--has-item');

            // Check if the item was already created in the current month.
            let existingItem = this.__itemsPerMonth[currentDate.month()].find(item => item[this.idInternalProperty] === itemId);

            // When the item does not exists, create it.
            if (!existingItem) {
              existingItem = {
                ...item,
                intervals: [],
                [this.idInternalProperty]: itemId,
              };

              this.__itemsPerMonth[currentDate.month()].push(existingItem);
            }

            // Check if the item already contains the current interval.
            const existingInterval = existingItem.intervals.find(interval => interval[this.idInternalProperty] === intervalId);

            if (existingInterval) {
              // Change the existing interval's end date.
              existingInterval.end = currentDate.date();
            } else {
              // Create the new interval.
              existingItem.intervals.push({
                ...interval,
                end: currentDate.date(),
                start: currentDate.date(),
                [this.idInternalProperty]: intervalId,
              });
            }
          }, moment(interval.start), moment(interval.end), true);
        });
      });

      this.__createMonthExpansionCollapseIcons();
    }

    /**
     * This method creates all the toggle icons to expand / collapse the months which have at least one item.
     */
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

    /**
     * This method tries to retrieve a context menu that might've been slotted.
     */
    __setupContextMenu () {
      this.__contextMenu = this.shadowRoot
        .querySelector('slot[name="context-menu"]')
        .assignedElements()
        .find(assignedElement => assignedElement.nodeName && assignedElement.nodeName.toLowerCase() === 'casper-context-menu');

      if (!this.__contextMenu) return;

      this.__contextMenu.horizontalAlign = 'auto';
      this.__contextMenu.addEventListener('opened-changed', event => {
        if (!event.detail.value) {
          this.activeItem = undefined;
          this.activeItemInterval = undefined;
        } else {
          // Change the current active item using the __identifier property which consists of the item and interval index.
          const [itemIndex, itemIntervalIndex] = this.__contextMenu.positionTarget.dataset.identifier.split('-');

          this.activeItem = this.items[itemIndex];
          this.activeItemInterval = this.items[itemIndex].intervals[itemIntervalIndex];
        }
      });
    }

    /**
     * Click listener that gets fired when the user clicks on an interval.
     *
     * @param {Object} event The event's object.
     */
    __openContextMenu (event) {
      // Check if a context menu was slotted or if the cell clicked contains an actual item.
      if (!this.__contextMenu || !event.target.dataset.identifier) return;

      this.__contextMenu.verticalOffset = event.target.getBoundingClientRect().height;
      this.__contextMenu.positionTarget = event.target;

      // This is used since the context menu might be closing at the time.
      afterNextRender(this, () => this.__contextMenu.open());
    }

    /**
     * Used for opening the holiday popover when user clicks on a day
     */
     __openHolidayPopover (target, selectedDay, description) {
      // Check if a context menu was slotted or if the cell clicked contains an actual item.
      if (!this._popoverDialog || !this.isHoliday || !target) return;

      this._popoverDialog.responseObject = selectedDay;

      if (description) {
        this._popoverDialog.headerText = 'Editar feriado';
        this._popoverDialog.inputLabel = 'Descrição';
        this._popoverDialog.inputValue = description;
        this._popoverDialog.hideDelete = false;
      } else {
        this._popoverDialog.headerText = 'Criar feriado';
        this._popoverDialog.inputLabel = 'Descrição';
        this._popoverDialog.inputValue = '';
        this._popoverDialog.hideDelete = true;
      }

      return this._popoverDialog.connection(target);
    }
  }
};
