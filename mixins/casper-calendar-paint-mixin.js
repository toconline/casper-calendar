export const CasperCalendarPaintMixin = superClass => {
  return class extends superClass {

    /**
     * This method paints the current active dates.
     */
    __paintActiveDates () {
      // Remove both the background color and the text color.
      this.shadowRoot.querySelectorAll('.row-container .cell[style]').forEach(cell => {
        cell.style.color = '';
        cell.style.backgroundColor = '';
      });

      if (this.activeDates.length > 0) {
        this.activeDates.forEach(activeDate => this.__paintDate(activeDate));
      }
    }

    /**
     * This function is used to paint the cells that are contained in a specific date range.
     *
     * @param {Date} date The date we're going to paint.
     * @param {Boolean} paintActiveDate This parameter decides if the cells are going to be painted or the opposite.
     */
    __paintDate (date, paintActiveDate = true) {
      // If the interval starts on the following years or ends in the previous years.
      if (date.start.year() > this.year || date.end.year() < this.year) return;

      let color, backgroundColor;

      // Calculate beforehand the color and background color that will be used when styling the cells.
      if (paintActiveDate) {
        backgroundColor = date.meta && date.meta.type
          ? this.$.selector.getBackgroundColorForType(date.meta.type)
          : this.__intervalBackgroundColor;

        color = this.__getContrastingTextColorForBackground(backgroundColor);
      }

      this.__executeForEachDayBetweenDates(currentDate => {
        const currentDateCell = this.__findCellByMonthAndDay(currentDate.month(), currentDate.date());
        if (!currentDateCell) return;

        if (paintActiveDate) {
          currentDateCell.style.color = color;
          currentDateCell.style.backgroundColor = backgroundColor;
        } else if (this.__activeDateIndexOfDay(currentDate) === -1) {
          // Only remove the styling from the cell, if there are no active dates that contain this day.
          currentDateCell.style.color = '';
          currentDateCell.style.backgroundColor = '';
        }
      }, date.start, date.end, true);
    }

    /**
     * This method paints the cell that was clicked by the user in holiday mode
     */
    __selectCell (cell) {
      if (cell) {
        const backgroundColor = 'var(--light-primary-color)';
        const color = this.__getContrastingTextColorForBackground(backgroundColor);

        cell.style.color = color;
        cell.style.backgroundColor = backgroundColor;
      }
    }

    /**
     * This method unpaints the cell that was previously clicked by the user in holiday mode
     */
    __unselectCell (cell) {
      if (cell) {
        cell.style.color = '';
        cell.style.backgroundColor = '';
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
      this.shadowRoot.querySelectorAll('span.custom-holiday').forEach(holidaySpan => holidaySpan.remove());

      this.__holidays.forEach(holiday => {
        const holidayCell = this.__findCellByMonthAndDay(holiday.month - 1, holiday.day);

        if (holidayCell) {
          const holidaySpanElement = document.createElement('span');

          if (holiday.is_custom) {
            holidaySpanElement.className = 'custom-holiday';
            holidayCell.dataset.id = holiday.true_id;
          } else {
            holidaySpanElement.className = 'holiday';
          }
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

    /**
     * This method returns the text color that contrasts with the background color.
     *
     * @param {String} backgroundColor The background's color which can be in the following formats - (human-readable name),
     * RGB, hexadecimal, CSS variables.
     */
    __getContrastingTextColorForBackground (backgroundColor) {
      let backgroundColorRGB = {};

      // CSS variables in the format of var(--primary-color).
      if (backgroundColor.startsWith('rgb(')) backgroundColorRGB = this.__getRedGreenBlueFromRGB(backgroundColor);
      else if (/^[a-z]+$/.test(backgroundColor)) backgroundColorRGB = this.__getRedGreenBlueFromHumanName(backgroundColor);
      else if (backgroundColor.startsWith('#')) backgroundColorRGB = this.__getRedGreenBlueFromHexadecimal(backgroundColor);
      else if (backgroundColor.startsWith('var(')) backgroundColorRGB = this.__getRedGreenBlueFromCSSVariable(backgroundColor);

      // This means a recursion has occurred (either from __getRedGreenBlueFromCSSVariable or __getRedGreenBlueFromHumanName) and I already have the color.
      if (['white', 'black'].includes(backgroundColorRGB)) return backgroundColorRGB;

      return (
        (backgroundColorRGB.red * 0.299) +
        (backgroundColorRGB.green * 0.587) +
        (backgroundColorRGB.blue * 0.114)
      ) > 186 ? 'black' : 'white';
    }

    /**
     * Returns an object with the red, blue and green properties from a CSS variable name like var(--primary-color).
     *
     * @param {String} cssVariable The CSS variable's name.
     */
    __getRedGreenBlueFromCSSVariable (cssVariable) {
      const regexMatch = cssVariable.match(/^var\((--[-a-zA-Z]+)\)$/);

      // We call this method again since the CSS variable might be defined as an hexadecimal, RGB.
      return this.__getContrastingTextColorForBackground(getComputedStyle(document.body).getPropertyValue(regexMatch[1]).trim());
    }

    /**
     * Returns an object with the red, blue and green properties from a human-readable name such as 'red' or 'aliceblue'.
     *
     * @param {String} humanName The color's human name.
     */
    __getRedGreenBlueFromHumanName (humanName) {
      const canvasContext = document.createElement('canvas').getContext('2d');
      canvasContext.fillStyle = humanName;

      return this.__getContrastingTextColorForBackground(canvasContext.fillStyle);
    }

    /**
     * Returns an object with the red, blue and green properties from an hexadecimal value like #FFFFFF.
     *
     * @param {String} hexadecimal The color's hexadecimal representation.
     */
    __getRedGreenBlueFromHexadecimal (hexadecimal) {
      return {
        red: parseInt(hexadecimal.substring(1, 3), 16),
        green: parseInt(hexadecimal.substring(3, 5), 16),
        blue: parseInt(hexadecimal.substring(5, 7), 16)
      };
    }

    /**
     * Returns an object with the red, blue and green properties from something like this rgb(255, 255, 255).
     *
     * @param {String} rgb The color's RGB representation.
     */
    __getRedGreenBlueFromRGB (rgb) {
      const splitColors = rgb.substring(4, rgb.length - 1).split(',').map(color => color.trim());

      return {
        red: parseInt(splitColors[0].trim()),
        green: parseInt(splitColors[1].trim()),
        blue: parseInt(splitColors[2].trim()),
      }
    }
  }
};