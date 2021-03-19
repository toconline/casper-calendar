import moment from 'moment/src/moment.js';

export const CasperCalendarMouseEventsMixin = superClass => {
  return class extends superClass {

    __cellOnClick (event) {
      if (!this.isHoliday) return;

      const eventTarget = event.composedPath().find(element => element.classList.contains('cell'));

      // This means it's an empty day used as padding or the user has entered the limbo state where he was selecting a date but then left the component.
      if (!Object.keys(eventTarget.dataset).includes('day') || this.__isUserSelectingRange) return;


      let customDescription = '';
      for (const node of eventTarget.childNodes) {
        if (node.className === 'custom-holiday') {
          if (node.tooltip) {
            customDescription = node.tooltip;
          }
        }
      }


      // Begin the date selection.
      this.__activeDateStart = moment(new Date(
        this.year,
        eventTarget.dataset.month,
        eventTarget.dataset.day
      ));

      this.__activeDateEnd = this.__activeDateStart;

      const newActiveDate = { start: this.__activeDateStart, end: this.__activeDateEnd };

      // This means it was a click, so both the start and end date are equal.
      const activeDateIndex = this.__activeDateIndexOfDay(newActiveDate.start);

      if (activeDateIndex !== -1) {
        // The user clicked on an active date so we'll remove it from the list.
        this.removeActiveDate(activeDateIndex);
      } else {
        // The user clicked on a day that wasn't previously active so we'll try to add it to the list.
        eventTarget.setAttribute('active', '');
        this.__selectedCell(eventTarget);
        this.__openHolidayEditor(event, newActiveDate, customDescription);
      }

      this.__activeDateEnd = undefined;
      this.__activeDateStart = undefined;
    }


    /**
     * This method gets invoked when the user presses the mouse key down on top of a cell.
     *
     * @param {Object} event The event's object.
     */
    __cellOnMouseDown (event) {
      if (this.isHoliday) return;

      const eventTarget = event.composedPath().find(element => element.classList.contains('cell'));

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
      if (this.isHoliday) return;

      const eventTarget = event.composedPath().find(element => element.classList.contains('cell'));

      if (!Object.keys(eventTarget.dataset).includes('day') || !this.__isUserHoldingMouseButton) return;

      // Only remove cells from the currently active range.
      if (this.__activeDateEnd) this.__paintDate({ start: this.__activeDateStart, end: this.__activeDateEnd }, false);

      this.__isUserSelectingRange = true;
      this.__activeDateEnd = moment(new Date(
        this.year,
        eventTarget.dataset.month,
        eventTarget.dataset.day
      ));

      this.__paintDate({ start: this.__activeDateStart, end: this.__activeDateEnd });
    }

    /**
     * This method is invoked when the user releases the mouse key and therefore we set the __isSelectingInterval to false.
     *
     * @param {Object} event The event's object.
     */
    __cellOnMouseUp (event) {
      if (this.isHoliday) return;

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
        this.addActiveDate(newActiveDate);
      } else {
        // This means it was a click, so both the start and end date are equal.
        const activeDateIndex = this.__activeDateIndexOfDay(newActiveDate.start);

        if (activeDateIndex !== -1) {
          // The user clicked on an active date so we'll remove it from the list.
          this.removeActiveDate(activeDateIndex);
        } else {
          // The user clicked on a day that wasn't previously active so we'll try to add it to the list.
          this.addActiveDate(newActiveDate);
          eventTarget.setAttribute('active', '');
        }
      }

      this.__activeDateEnd = undefined;
      this.__activeDateStart = undefined;
    }
  }
};