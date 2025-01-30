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

export const CasperCalendarActiveDatesMixin = superClass => {
  return class extends superClass {
    /**
     * This method tries to add a new date taking into account the maximum number of simultaneous dates property.
     *
     * @param {Object} newActiveDate The new date we'll try to add.
     */
    addActiveDate (newActiveDate) {
      const mergedActiveDates = this.__mergeActiveDates(newActiveDate);

      if (this.maximumNumberActiveDates && mergedActiveDates.length > this.maximumNumberActiveDates) {
        // Remove the first active date to add the new one.
        this.removeActiveDate(0);
        mergedActiveDates.shift();
      }

      this.activeDates = mergedActiveDates;
      this.__paintActiveDates();
    }

    /**
     * This method removes an active date by its index.
     *
     * @param {Number} activeDateIndex The index of the date we'll remove.
     */
    removeActiveDate (activeDateIndex) {
      const deletedActiveDate = this.activeDates[activeDateIndex];

      // Remove the active date from the public property.
      this.activeDates = [
        ...this.activeDates.slice(0, activeDateIndex),
        ...this.activeDates.slice(activeDateIndex + 1, this.activeDates.length)
      ];

      this.__paintActiveDates();
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
          (newActiveDate.start.isSameOrAfter(activeDateStart) && newActiveDate.end.isSameOrBefore(activeDateEnd)) ||
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

      // Add the meta information.
      newActiveDate.meta = { type: this.activeDateType };

      return [...updatedActiveDates, newActiveDate].map(activeDate => ({
        ...activeDate,
        days: this.__getDaysBetweenDates(activeDate.start, activeDate.end),
      }));
    }
  }
};
