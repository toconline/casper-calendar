import moment from 'moment/src/moment.js';

export const CasperCalendarMouseEventsMixin = superClass => {
  return class extends superClass {

    /**
     * This method gets invoked when the user presses the mouse key down on top of a cell.
     *
     * @param {Object} event The event's object.
     */
    __cellOnMouseDown (event) {
      const eventTarget = event.composedPath().find(element => element.classList.contains('cell'));
      console.log(!Object.keys(eventTarget.dataset).includes('day'));

      // This means it's an empty day used as padding or the user has entered the limbo state where he was selecting a date but then left the component.
      if (!Object.keys(eventTarget.dataset).includes('day') || this.__isUserSelectingRange) return;

      this.__isUserHoldingMouseButton = true;

      // Begin the date selection.
      this.__activeDateStart = moment(new Date(
        this.year,
        eventTarget.dataset.month,
        eventTarget.dataset.day
      ));
    }

    /**
     * This method gets invoked when the user hovers through a cell. If he is holding the mouse key down, the component
     * will start to create an interval of dates painting the cells that are contained in the aforementioned interval.
     *
     * @param {Object} event The event's object.
     */
    __cellOnMouseEnter (event) {
      const eventTarget = event.composedPath().find(element => element.classList.contains('cell'));

      if (!Object.keys(eventTarget.dataset).includes('day') || !this.__isUserHoldingMouseButton) return;

      // Only remove cells from the currently active range.
      if (this.__activeDateEnd) this.__paintDate(this.__activeDateStart, this.__activeDateEnd, false);

      this.__isUserSelectingRange = true;
      this.__activeDateEnd = moment(new Date(
        this.year,
        eventTarget.dataset.month,
        eventTarget.dataset.day
      ));

      this.__paintDate(this.__activeDateStart, this.__activeDateEnd);
    }

    /**
     * This method is invoked when the user releases the mouse key and therefore we set the __isSelectingInterval to false.
     *
     * @param {Object} event The event's object.
     */
    __cellOnMouseUp (event) {
      const eventTarget = event.composedPath().find(element => element.classList.contains('cell'));

      // This means, it's an empty day used as padding.
      if (!Object.keys(eventTarget.dataset).includes('day')) return;

      this.__isUserHoldingMouseButton = false;

      const activeDateEnd = moment(new Date(this.year, eventTarget.dataset.month, eventTarget.dataset.day));

      // This happens if, for instance, the user starts dragging out of nowhere and ends up in a cell.
      const activeDateStart = this.__activeDateStart || moment(activeDateEnd);

      // Sort the two dates to make sure the start is before than its end.
      const [sortedDateStart, sortedDateEnd] = [activeDateStart, activeDateEnd].sort((a, b) => a.diff(b));
      const newActiveDate = { start: sortedDateStart, end: sortedDateEnd };

      if (this.__isUserSelectingRange) {
        // This means the user stopped selecting a range.
        this.__isUserSelectingRange = false;
        this.__addActiveDate(newActiveDate);
      } else {
        // This means it was a click, so both the start and end date are equal.
        const activeDateIndex = this.__activeDateIndexOfDay(newActiveDate.start);

        if (activeDateIndex !== -1) {
          // The user clicked on an active date so we'll remove it from the list.
          this.__removeActiveDate(activeDateIndex);
        } else {
          // The user clicked on a day that wasn't previously active so we'll try to add it to the list.
          if (this.__addActiveDate(newActiveDate)) {
            eventTarget.setAttribute('active', '');
          }
        }
      }

      this.__activeDateEnd = undefined;
      this.__activeDateStart = undefined;
    }

    /**
     * This method tries to add a new date taking into account the maximum number of simultaneous dates property.
     *
     * @param {Object} newActiveDate The new date we'll try to add.
     */
    __addActiveDate (newActiveDate) {
      const mergedActiveDates = this.__mergeActiveDates(newActiveDate);

      if (this.maximumNumberActiveDates === undefined || mergedActiveDates.length <= this.maximumNumberActiveDates) {
        this.activeDates = mergedActiveDates;
        return true;
      }

      // This means the new interval can't be added since it surpasses the limit of simultaneous intervals.
      this.__paintDate(newActiveDate.start, newActiveDate.end, false);

      this.app.openToast({ backgroundColor: 'red', text: `Só pode ter seleccionado ${this.maximumNumberActiveDates} intervalo(s) simultaneamente.` });
    }

    /**
     * This method removes an active date by its index.
     *
     * @param {Number} activeDateIndex The index of the date we'll remove.
     */
    __removeActiveDate (activeDateIndex) {
      const deletedActiveDate = this.activeDates[activeDateIndex];

      // Remove the active date from the public property.
      this.activeDates = [
        ...this.activeDates.slice(0, activeDateIndex),
        ...this.activeDates.slice(activeDateIndex + 1, this.activeDates.length)
      ];

      this.__paintDate(deletedActiveDate.start, deletedActiveDate.end, false);
    }
  }
};