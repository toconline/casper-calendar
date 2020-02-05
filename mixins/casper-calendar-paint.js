import moment from 'moment/src/moment.js';

export const CasperCalendarPaint = superClass => {
  return class extends superClass {

    /**
     * This method paints the current active dates.
     */
    __paintActiveDates () {
      this.shadowRoot.querySelectorAll('.cell[active]').forEach(cell => cell.removeAttribute('active'));

      if (this.activeDates.length > 0) {
        this.activeDates.forEach(activeDate => this.__paintDate(activeDate.start, activeDate.end));
      }
    }

    /**
     * This function is used to paint the cells that are contained in a specific date.
     *
     * @param {Date} startDate The date's start.
     * @param {Date} end The date's end.
     * @param {Boolean} setActiveAttribute This attribute decides if the cells are going to be painted or hidden.
     */
    __paintDate (startDate, endDate, setActiveAttribute = true) {
      // If the interval starts on the following years or ends in the previous years.
      if (startDate.year() > this.year || endDate.year() < this.year) return;

      // Sort the two dates to make sure the start is before than its end.
      const [sortedStartDate, sortedEndDate] = [startDate, endDate].sort((previousDate, nextDate) => previousDate.diff(nextDate));
      const daysBetweenBothDates = sortedEndDate.diff(sortedStartDate, 'days');

      for (let daysCount = 0; daysCount <= daysBetweenBothDates; daysCount++) {
        const currentDate = moment(sortedStartDate).add(daysCount, 'days');

        // Either skip to the next iteration if we're not in the current year or return if we already surpassed it.
        if (currentDate.year() < this.year) continue;
        if (currentDate.year() > this.year) return;

        const currentDateCell = this.__findCellByMonthAndDay(currentDate.month(), currentDate.date());
        if (!currentDateCell) return;

        if (setActiveAttribute) {
          currentDateCell.setAttribute('active', '');
        } else if (this.__activeDateIndexOfDay(currentDate) === -1) {
          // Only remove the active attribute from the cell, if there are no active dates that contain this day.
          currentDateCell.removeAttribute('active');
        }
      }
    }

    /**
     * This method paints the cell that represents the present day.
     */
    __paintTodayCell () {
      const today = new Date();
      if (today.getFullYear() !== this.year) return;

      const todayCell = this.__findCellByMonthAndDay(today.getMonth(), today.getDate());

      if (todayCell) todayCell.classList.add('cell--today');
    }

    /**
     * This method paints the cells that have associated holidays.
     */
    __paintHolidayCells () {
      this.shadowRoot.querySelectorAll('span.holiday').forEach(holidaySpan => holidaySpan.remove());

      this.__holidays.forEach(holiday => {
        const holidayCell = this.__findCellByYearMonthAndDay(this.year, holiday.month - 1, holiday.day);

        if (holidayCell) {
          const holidaySpanElement = document.createElement('span');
          holidaySpanElement.className = 'holiday';
          holidaySpanElement.innerText = 'F';
          holidaySpanElement.tooltip = holiday.description;

          holidayCell.appendChild(holidaySpanElement);
        }
      });
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
  }
};