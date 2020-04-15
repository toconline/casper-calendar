export const CasperCalendarPaintMixin = superClass => {
  return class extends superClass {

    /**
     * This method paints the current active dates.
     */
    __paintActiveDates () {
      this.shadowRoot.querySelectorAll('.cell[style]').forEach(cell => cell.style.backgroundColor = '');

      if (this.activeDates.length > 0) {
        this.activeDates.forEach(activeDate => this.__paintDate(activeDate));
      }
    }

    /**
     * This function is used to paint the cells that are contained in a specific date.
     *
     * @param {Date} startDate The date's start.
     * @param {Date} end The date's end.
     * @param {Boolean} paintActiveDate This parameter decides if the cells are going to be painted or the opposite.
     */
    __paintDate (date, paintActiveDate = true) {
      // If the interval starts on the following years or ends in the previous years.
      if (date.start.year() > this.year || date.end.year() < this.year) return;

      this.__executeForEachDayBetweenDates(currentDate => {
        const currentDateCell = this.__findCellByMonthAndDay(currentDate.month(), currentDate.date());
        if (!currentDateCell) return;

        if (paintActiveDate) {
          currentDateCell.style.backgroundColor = date.meta && date.meta.type
            ? this.$.selector.getBackgroundColorForType(date.meta.type)
            : this.__intervalBackgroundColor;

        } else if (this.__activeDateIndexOfDay(currentDate) === -1) {
          // Only remove the active attribute from the cell, if there are no active dates that contain this day.
          currentDateCell.style.backgroundColor = '';
        }
      }, date.start, date.end, true);
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
        const holidayCell = this.__findCellByMonthAndDay(holiday.month - 1, holiday.day);

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