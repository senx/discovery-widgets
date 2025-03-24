/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/*
 *   Copyright 2025 SenX S.A.S.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */
import { Moment } from 'moment';
import { JQ } from './jq';
import { DTPickerOptions } from './options';
import { tz } from 'moment-timezone';
import moment from 'moment/min/moment-with-locales';

// IE browser doesn't support "class"
export class DateRangePicker {
  private jq: JQ = new JQ();
  private rangesLiElList: HTMLElement[];
  private readonly parentEl: HTMLElement;
  private readonly element: HTMLInputElement;
  private options: DTPickerOptions;
  private isShowing: boolean;
  private readonly callback: (start: Moment, end: Moment, label: string) => void;
  private readonly rightCalendar: any;
  private readonly leftCalendar: any;
  private container: HTMLElement;
  private timepicker: 'year' | 'years' | 'y' | 'month' | 'months' | 'M' | 'week' | 'weeks' | 'w' | 'day' | 'days' | 'd' | 'hour' | 'hours' | 'h' | 'minute' | 'minutes' | 'm' | 'second' | 'seconds' | 's' | 'millisecond' | 'milliseconds' | 'ms' | 'quarter' | 'quarters' | 'Q' | 'isoWeek' | 'isoWeeks' | 'W' | 'date' | 'dates' | 'D';
  private startDate: Moment = moment();
  private endDate: Moment = moment();
  private previousRightTime: Moment = moment();
  private oldStartDate: Moment = moment();
  private oldEndDate: Moment = moment();
  private chosenLabel: string;
  private outsideClickProxy = (e: MouseEvent) => this.outsideClick(e);
  private moveProxy = (e: MouseEvent) => this.move(e);
  private clickRangeProxy = (e: MouseEvent) => this.clickRange(e);
  private clickApplyProxy = (e: MouseEvent) => this.clickApply(e);
  private clickCancelProxy = (e: MouseEvent) => this.clickCancel(e);
  private showProxy = (e: Event) => this.show(e);
  private elementChangedProxy = (e: Event) => this.elementChanged(e);
  private keydownProxy = (e: KeyboardEvent) => this.keydown(e);
  private toggleProxy = (e: Event) => this.toggle(e);
  private clickPrevProxy = (e: MouseEvent) => this.clickPrev(e);
  private clickNextProxy = (e: MouseEvent) => this.clickNext(e);
  private clickDateProxy = (e: MouseEvent) => this.clickDate(e);
  private hoverDateProxy = (e: MouseEvent) => this.hoverDate(e);
  private monthOrYearChangedProxy = (e: Event) => this.monthOrYearChanged(e);
  private timeChangedProxy = (e: Event) => this.timeChanged(e);

  constructor(element: string | HTMLInputElement, options: DTPickerOptions | null, cb: (start: Moment, end: Moment, label: string) => void) {
    let rangeHtml: string;
    let elem: HTMLTextAreaElement;
// default settings for options
    this.parentEl = document.body;
    if (typeof element === 'string') {
      this.element = document.getElementById(element) as HTMLInputElement;
    } else {
      this.element = element;
    }
    this.options = {
      startDate: moment().startOf('day'),
      endDate: moment().endOf('day'),
      minDate: undefined,
      maxDate: undefined,
      maxSpan: undefined,
      autoApply: false,
      singleDatePicker: false,
      showDropdowns: false,
      minYear: moment().subtract(100, 'year').format('YYYY'),
      maxYear: moment().add(100, 'year').format('YYYY'),
      showWeekNumbers: false,
      showISOWeekNumbers: false,
      showCustomRangeLabel: true,
      timePicker: false,
      timePicker24Hour: false,
      timePickerIncrement: 1,
      timePickerSeconds: false,
      linkedCalendars: true,
      autoUpdateInput: true,
      alwaysShowCalendars: false,
      ranges: {},
      opens: 'right',
      drops: 'down',
      buttonClasses: 'btn btn-sm',
      applyButtonClasses: 'btn-primary',
      cancelButtonClasses: 'btn-default',
      wrapperClasses: '',
      locale: {
        locale: 'en',
        direction: 'ltr',
        format: moment.localeData().longDateFormat('L'),
        separator: ' ➔ ',
        applyLabel: 'Apply',
        cancelLabel: 'Cancel',
        weekLabel: 'W',
        customRangeLabel: 'Custom Range',
        daysOfWeek: moment.weekdaysMin(),
        monthNames: moment.monthsShort(),
        firstDay: moment.localeData().firstDayOfWeek(),
      },
    };
    if (this.element.classList.contains('pull-right')) {
      this.options.opens = 'left';
    }
    if (this.element.classList.contains('dropup')) {
      this.options.drops = 'up';
    }
    this.callback = () => {
      // empty
    };
    // some state information
    this.isShowing = false;
    this.leftCalendar = {};
    this.rightCalendar = {};

    // custom options from user
    if (typeof options !== 'object' || options === null) {
      options = new DTPickerOptions();
    }

    // allow setting options with data attributes
    // data-api options will be overwritten with custom javascript options
    // options = Object.assign(Object.assign({}, this.element.dataset), options);
    // html template for the picker UI
    if (typeof options.template !== 'string') {
      options.template = `<div class="daterangepicker">
  <div class="dp-wrapper">
    <div class="ranges"></div>
    <div class="drp-calendar left">
      <div class="calendar-table"></div>
      <div class="calendar-time"></div>
    </div>
    <div class="drp-calendar right">
      <div class="calendar-table"></div>
      <div class="calendar-time"></div>
    </div>
  </div>
  <div class="drp-buttons">
    <span class="drp-selected"></span>
    <button class="cancelBtn" type="button"></button>
    <button class="applyBtn" disabled="disabled" type="button"></button>
  </div>
</div>`;
    }
    this.parentEl = options.parentEl ? options.parentEl : this.parentEl;
    const templateWrapEl = document.createElement('div');
    templateWrapEl.innerHTML = options.template.trim();
    this.container = templateWrapEl.firstElementChild as HTMLElement;
    this.parentEl.insertAdjacentElement('beforeend', this.container);
    //
    // handle all the possible options overriding defaults
    //
    if (typeof options.locale === 'object') {
      moment.locale(options.locale.locale ?? 'en');
      this.options.locale.locale = options.locale.locale ?? 'en';
      const loc = moment.localeData(options.locale.locale ?? 'en');
      this.options.locale.timeZone = options.locale.timeZone ?? 'UTC';
      if (typeof options.locale.direction === 'string') {
        this.options.locale.direction = options.locale.direction;
      }
      if (typeof options.locale.format === 'string') {
        this.options.locale.format = options.locale.format;
      }
      if (typeof options.locale.separator === 'string') {
        this.options.locale.separator = options.locale.separator;
      }
      this.options.locale.monthNames = loc.monthsShort();
      this.options.locale.daysOfWeek = loc.weekdaysShort();
      this.options.locale.firstDay = loc.firstDayOfWeek();
      if (typeof options.locale.applyLabel === 'string') {
        this.options.locale.applyLabel = options.locale.applyLabel;
      }
      if (typeof options.locale.cancelLabel === 'string') {
        this.options.locale.cancelLabel = options.locale.cancelLabel;
      }
      if (typeof options.locale.weekLabel === 'string') {
        this.options.locale.weekLabel = options.locale.weekLabel;
      }
      if (typeof options.locale.customRangeLabel === 'string') {
        // Support unicode chars in the custom range name.
        elem = document.createElement('textarea');
        elem.innerHTML = options.locale.customRangeLabel;
        rangeHtml = elem.value;
        this.options.locale.customRangeLabel = rangeHtml;
      }
    }
    this.container.classList.add(this.options.locale.direction);
    if (typeof options.startDate === 'object') {
      this.options.startDate = moment(options.startDate);
    }
    if (typeof options.endDate === 'object') {
      this.options.endDate = moment(options.endDate);
    }
    if (typeof options.minDate === 'object') {
      this.options.minDate = moment(options.minDate);
    }
    if (typeof options.maxDate === 'object') {
      this.options.maxDate = moment(options.maxDate);
    }
    // sanity check for bad options
    if (this.options.minDate && this.options.startDate.isBefore(this.options.minDate)) {
      this.options.startDate = this.options.minDate.clone();
    }
    // sanity check for bad options
    if (this.options.maxDate && this.options.endDate.isAfter(this.options.maxDate)) {
      this.options.endDate = this.options.maxDate.clone();
    }
    if (typeof options.applyButtonClasses === 'string') {
      this.options.applyButtonClasses = options.applyButtonClasses;
    }
    if (typeof options.cancelButtonClasses === 'string') {
      this.options.cancelButtonClasses = options.cancelButtonClasses;
    }
    if (typeof options.maxSpan === 'object') {
      this.options.maxSpan = options.maxSpan;
    }
    if (typeof options.opens === 'string') {
      this.options.opens = options.opens;
    }
    if (typeof options.drops === 'string') {
      this.options.drops = options.drops;
    }
    if (typeof options.showWeekNumbers === 'boolean') {
      this.options.showWeekNumbers = options.showWeekNumbers;
    }
    if (typeof options.showISOWeekNumbers === 'boolean') {
      this.options.showISOWeekNumbers = options.showISOWeekNumbers;
    }
    if (typeof options.buttonClasses === 'string') {
      this.options.buttonClasses = options.buttonClasses;
    }
    if (typeof options.buttonClasses === 'object') {
      this.options.buttonClasses = (options.buttonClasses ?? []).join(' ');
    }
    if (typeof options.showDropdowns === 'boolean') {
      this.options.showDropdowns = options.showDropdowns;
    }
    if (typeof options.minYear === 'number') {
      this.options.minYear = options.minYear;
    }
    if (typeof options.maxYear === 'number') {
      this.options.maxYear = options.maxYear;
    }
    if (typeof options.showCustomRangeLabel === 'boolean') {
      this.options.showCustomRangeLabel = options.showCustomRangeLabel;
    }
    if (typeof options.singleDatePicker === 'boolean') {
      this.options.singleDatePicker = options.singleDatePicker;
      if (this.options.singleDatePicker) {
        this.options.endDate = this.options.startDate.clone();
      }
    }
    if (typeof options.timePicker === 'boolean') {
      this.options.timePicker = options.timePicker;
    }
    if (typeof options.timePickerSeconds === 'boolean') {
      this.options.timePickerSeconds = options.timePickerSeconds;
    }
    if (typeof options.timePickerIncrement === 'number') {
      this.options.timePickerIncrement = options.timePickerIncrement;
    }
    if (typeof options.timePicker24Hour === 'boolean') {
      this.options.timePicker24Hour = options.timePicker24Hour;
    }
    if (typeof options.autoApply === 'boolean') {
      this.options.autoApply = options.autoApply;
    }
    if (typeof options.autoUpdateInput === 'boolean') {
      this.options.autoUpdateInput = options.autoUpdateInput;
    }
    if (typeof options.linkedCalendars === 'boolean') {
      this.options.linkedCalendars = options.linkedCalendars;
    }
    if (typeof options.isInvalidDate === 'function') {
      this.options.isInvalidDate = options.isInvalidDate;
    }
    if (typeof options.isCustomDate === 'function') {
      this.options.isCustomDate = options.isCustomDate;
    }
    if (typeof options.alwaysShowCalendars === 'boolean') {
      this.options.alwaysShowCalendars = options.alwaysShowCalendars;
    }
    // update day names order to firstDay
    if (this.options.locale.firstDay !== 0) {
      let iterator = this.options.locale.firstDay;
      while (iterator > 0) {
        this.options.locale.daysOfWeek.push(this.options.locale.daysOfWeek.shift());
        iterator--;
      }
    }

    let start: Moment;
    let end: Moment;
    let range: string;
    // if no start/end dates set, check if an input element contains initial values
    if (typeof options.startDate === 'undefined' && typeof options.endDate === 'undefined') {
      if (this.element.tagName === 'INPUT' && this.element.type === 'text') {
        const val = this.element.value;
        const split = val.split(this.options.locale.separator);
        start = end = null;
        if (split.length === 2) {
          start = moment(split[0], this.options.locale.format);
          end = moment(split[1], this.options.locale.format);
        } else if (this.options.singleDatePicker && val !== '') {
          start = moment(val, this.options.locale.format);
          end = moment(val, this.options.locale.format);
        }
        if (start !== null && end !== null) {
          this.setStartDate(start);
          this.setEndDate(end);
        }
      }
    } else {
      this.setStartDate(options.startDate);
      this.setEndDate(options.endDate);
    }

    if (typeof options.ranges === 'object') {
      const rangesKeys = Object.keys(options.ranges);
      for (const range of rangesKeys) {
        start = moment(options.ranges[range][0]);
        if (typeof options.ranges[range][1] === 'string') {
          end = moment(options.ranges[range][1], this.options.locale.format);
        } else {
          end = moment(options.ranges[range][1]);
        }
        // If the start or end date exceed those allowed by the minDate or maxSpan
        // options, shorten the range to the allowable period.
        if (this.options.minDate && start.isBefore(this.options.minDate)) {
          start = this.options.minDate.clone();
        }
        let maxDate = this.options.maxDate;
        if (this.options.maxSpan && maxDate && start.clone().add(this.options.maxSpan).isAfter(maxDate)) {
          maxDate = start.clone().add(this.options.maxSpan);
        }
        if (maxDate && end.isAfter(maxDate)) {
          end = maxDate.clone();
        }

        // If the end of the range is before the minimum or the start of the range is
        // after the maximum, don't display this range option at all.
        if ((this.options.minDate && end.isBefore(this.options.minDate, this.timepicker ? 'minute' : 'day'))
          || (maxDate && start.isAfter(maxDate, this.timepicker ? 'minute' : 'day'))) {
          continue;
        }
        // Support unicode chars in the range names.
        elem = document.createElement('textarea');
        elem.innerHTML = range;
        rangeHtml = elem.value;

        this.options.ranges[rangeHtml] = [start, end];
      }
      let list = '<ul>';
      for (range in this.options.ranges) {
        if (range) {
          list += `<li data-range-key="${range}">${range}</li>`;
        }
      }
      if (this.options.showCustomRangeLabel) {
        list += `<li data-range-key="${this.options.locale.customRangeLabel}">${this.options.locale.customRangeLabel}</li>`;
      }
      list += '</ul>';
      this.container.querySelector('.ranges').insertAdjacentHTML('afterbegin', list);
    }
    if (typeof cb === 'function') {
      this.callback = cb;
    }
    if (!this.options.timePicker) {
      this.options.startDate = this.options.startDate.startOf('day');
      this.options.endDate = this.options.endDate.endOf('day');
      this.container.style.display = 'none';
    }
    // can't be used together for now
    if (this.options.timePicker && this.options.autoApply) {
      this.options.autoApply = false;
    }
    if (this.options.autoApply) {
      this.container.classList.add('auto-apply');
    }
    if (typeof options.ranges === 'object') {
      this.container.classList.add('show-ranges');
    }

    if (typeof options.wrapperClasses === 'string') {
      options.wrapperClasses.split(' ').forEach((className) => {
        if (className.trim()) {
          this.container.classList.add(className);
        }
      });
    }

    if (this.options.singleDatePicker) {
      this.container.classList.add('single');
      this.container.querySelector('.drp-calendar.left').classList.add('single');
      (this.container.querySelector('.drp-calendar.left') as HTMLElement).style.display = 'block';
      (this.container.querySelector('.drp-calendar.right') as HTMLElement).style.display = 'none';
      if (!this.options.timePicker && this.options.autoApply) {
        this.container.classList.add('auto-apply');
      }
    }
    if ((typeof options.ranges === 'undefined' && !this.options.singleDatePicker) || this.options.alwaysShowCalendars) {
      this.container.classList.add('show-calendar');
    }
    this.container.classList.add('opens' + this.options.opens);
    // apply CSS classes and labels to buttons
    const applyBtnEl = this.container.querySelector('.applyBtn');
    const cancelBtnEl = this.container.querySelector('.cancelBtn');
    this.jq.addClass(applyBtnEl, this.options.buttonClasses);
    this.jq.addClass(cancelBtnEl, this.options.buttonClasses);
    if (this.options.applyButtonClasses.length) {
      this.jq.addClass(applyBtnEl, this.options.applyButtonClasses);
    }
    if (this.options.cancelButtonClasses.length) {
      this.jq.addClass(cancelBtnEl, this.options.cancelButtonClasses);
    }
    this.jq.html(applyBtnEl as HTMLButtonElement, this.options.locale.applyLabel);
    this.jq.html(cancelBtnEl as HTMLButtonElement, this.options.locale.cancelLabel);
    //
    // event listeners
    //
    /*
    -- Note: jquery can set event listner before the target element has not been build. Vanilla-JS set event listner LATER.--
    this.container.find('.drp-calendar')
        .on('click.daterangepicker', '.prev', $.proxy(this.clickPrev, this))
        .on('click.daterangepicker', '.next', $.proxy(this.clickNext, this))
        .on('mousedown.daterangepicker', 'td.available', $.proxy(this.clickDate, this))
        .on('mouseenter.daterangepicker', 'td.available', $.proxy(this.hoverDate, this))
        .on('change.daterangepicker', 'select.yearselect', $.proxy(this.monthOrYearChanged, this))
        .on('change.daterangepicker', 'select.monthselect', $.proxy(this.monthOrYearChanged, this))
        .on('change.daterangepicker', 'select.hourselect,select.minuteselect,select.secondselect,select.ampmselect', $.proxy(this.timeChanged, this));
    --------------------------------------------------------------------------------------
    */
    this.jq.on(this.container.querySelector('.ranges'), 'click', 'li', this.clickRangeProxy);
    const drpButtonsEl = this.container.querySelector('.drp-buttons');
    this.jq.on(drpButtonsEl, 'click', 'button.applyBtn', this.clickApplyProxy);
    this.jq.on(drpButtonsEl, 'click', 'button.cancelBtn', this.clickCancelProxy);
    if (this.element.tagName === 'INPUT' || this.element.tagName === 'BUTTON') {
      this.jq.on(this.element, 'click', this.showProxy);
      this.jq.on(this.element, 'focus', this.showProxy);
      this.jq.on(this.element, 'keyup', this.elementChangedProxy);
      this.jq.on(this.element, 'keydown', this.keydownProxy);
    } else {
      this.jq.on(this.element, 'click', this.toggleProxy);
      this.jq.on(this.element, 'keydown', this.toggleProxy);
    }
    //
    // if attached to a text input, set the initial value
    //
    this.updateElement();
  }

  setStartDate(startDate: Moment) {
    this.startDate = moment(startDate);
    if (!this.options.timePicker) {
      this.startDate = this.startDate.startOf('day');
    }
    if (this.options.timePicker && this.options.timePickerIncrement) {
      this.startDate.minute(Math.round(this.startDate.minute() / this.options.timePickerIncrement) * this.options.timePickerIncrement);
    }
    if (this.options.minDate && this.startDate.isBefore(this.options.minDate)) {
      this.startDate = this.options.minDate.clone();
      if (this.options.timePicker && this.options.timePickerIncrement) {
        this.startDate.minute(Math.round(this.startDate.minute() / this.options.timePickerIncrement) * this.options.timePickerIncrement);
      }
    }
    if (this.options.maxDate && this.startDate.isAfter(this.options.maxDate)) {
      this.startDate = this.options.maxDate.clone();
      if (this.options.timePicker && this.options.timePickerIncrement) {
        this.startDate.minute(Math.floor(this.startDate.minute() / this.options.timePickerIncrement) * this.options.timePickerIncrement);
      }
    }
    if (!this.isShowing) {
      this.updateElement();
    }
    this.updateMonthsInView();
  }

  setEndDate(endDate: Moment) {
    this.endDate = moment(endDate);
    if (!this.options.timePicker) {
      this.endDate = this.endDate.endOf('day');
    }
    if (this.options.timePicker && this.options.timePickerIncrement) {
      this.endDate.minute(Math.round(this.endDate.minute() / this.options.timePickerIncrement) * this.options.timePickerIncrement);
    }
    if (this.endDate.isBefore(this.startDate)) {
      this.endDate = this.startDate.clone();
    }
    if (this.options.maxDate && this.endDate.isAfter(this.options.maxDate)) {
      this.endDate = this.options.maxDate.clone();
    }
    if (this.options.maxSpan && this.startDate.clone().add(this.options.maxSpan).isBefore(this.endDate)) {
      this.endDate = this.startDate.clone().add(this.options.maxSpan);
    }
    this.previousRightTime = this.endDate.clone();
    // this.jq.html(this.container.querySelector('.drp-selected'), this.startDate.format(this.options.locale.format) + this.options.locale.separator + this.endDate.format(this.options.locale.format));
    if (!this.isShowing) {
      this.updateElement();
    }
    this.updateMonthsInView();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isInvalidDate(_a: any) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isCustomDate(_a: any) {
    return false;
  }

  updateView() {
    if (this.options.timePicker) {
      this.renderTimePicker('left');
      this.renderTimePicker('right');
      const selectElList = this.container.querySelectorAll('.right .calendar-time select') as unknown as HTMLInputElement[];
      if (!this.endDate) {
        for (const item of selectElList) {
          item.disabled = true;
          item.classList.add('disabled');
        }
      } else {
        for (const item of selectElList) {
          item.disabled = false;
          item.classList.remove('disabled');
        }
      }
    }
    if (this.endDate) {
      //  this.jq.html(this.container.querySelector('.drp-selected'), this.startDate.format(this.options.locale.format) + this.options.locale.separator + this.endDate.format(this.options.locale.format));
    }
    this.updateMonthsInView();
    this.updateCalendars();
    this.updateFormInputs();
  }

  updateMonthsInView() {
    if (this.endDate) {
      // if both dates are visible already, do nothing
      if (!this.options.singleDatePicker && this.leftCalendar.month && this.rightCalendar.month &&
        (this.startDate.format('YYYY-MM') === this.leftCalendar.month.format('YYYY-MM') || this.startDate.format('YYYY-MM') === this.rightCalendar.month.format('YYYY-MM'))
        &&
        (this.endDate.format('YYYY-MM') === this.leftCalendar.month.format('YYYY-MM') || this.endDate.format('YYYY-MM') === this.rightCalendar.month.format('YYYY-MM'))
      ) {
        return;
      }
      this.leftCalendar.month = this.startDate.clone().date(2);
      if (!this.options.linkedCalendars && (this.endDate.month() !== this.startDate.month() || this.endDate.year() !== this.startDate.year())) {
        this.rightCalendar.month = this.endDate.clone().date(2);
      } else {
        this.rightCalendar.month = this.startDate.clone().date(2).add(1, 'month');
      }
    } else {
      if (this.leftCalendar.month.format('YYYY-MM') !== this.startDate.format('YYYY-MM') && this.rightCalendar.month.format('YYYY-MM') !== this.startDate.format('YYYY-MM')) {
        this.leftCalendar.month = this.startDate.clone().date(2);
        this.rightCalendar.month = this.startDate.clone().date(2).add(1, 'month');
      }
    }
    if (this.options.maxDate && this.options.linkedCalendars && !this.options.singleDatePicker && this.rightCalendar.month > this.options.maxDate) {
      this.rightCalendar.month = this.options.maxDate.clone().date(2);
      this.leftCalendar.month = this.options.maxDate.clone().date(2).subtract(1, 'month');
    }
  }

  updateCalendars() {
    let ampm: string;
    /*
    -- Note: by jquery, we can set event listener before the target element has not been build. but we must remove event listener HERE by Vanilla-JS. --
    this.container.find('.drp-calendar')
        .on('click.daterangepicker', '.prev', $.proxy(this.clickPrev, this))
        .on('click.daterangepicker', '.next', $.proxy(this.clickNext, this))
        .on('mousedown.daterangepicker', 'td.available', $.proxy(this.clickDate, this))
        .on('mouseenter.daterangepicker', 'td.available', $.proxy(this.hoverDate, this))
        .on('change.daterangepicker', 'select.yearselect', $.proxy(this.monthOrYearChanged, this))
        .on('change.daterangepicker', 'select.monthselect', $.proxy(this.monthOrYearChanged, this))
        .on('change.daterangepicker', 'select.hourselect,select.minuteselect,select.secondselect,select.ampmselect', $.proxy(this.timeChanged, this));
    --------------------------------------------------------------------------------------
    */
    const drpCalendarElList = this.container.querySelectorAll('.drp-calendar');
    this.jq.off(drpCalendarElList, 'click', '.prev', this.clickPrevProxy);
    this.jq.off(drpCalendarElList, 'click', '.next', this.clickNextProxy);
    this.jq.off(drpCalendarElList, 'mousedown', 'td.available', this.clickDateProxy);
    this.jq.off(drpCalendarElList, 'mouseenter', 'td.available', this.hoverDateProxy);
    this.jq.off(drpCalendarElList, 'change', 'select.yearselect', this.monthOrYearChangedProxy);
    this.jq.off(drpCalendarElList, 'change', 'select.monthselect', this.monthOrYearChangedProxy);
    this.jq.off(drpCalendarElList, 'change', 'select.hourselect,select.minuteselect,select.secondselect,select.ampmselect', this.timeChangedProxy);
    if (this.options.timePicker) {
      let hour: number;
      let minute: number;
      let second: number;
      if (this.endDate) {
        hour = parseInt((this.container.querySelector('.left .hourselect') as HTMLSelectElement).value, 10);
        minute = parseInt((this.container.querySelector('.left .minuteselect') as HTMLSelectElement).value, 10);
        if (isNaN(minute)) {
          minute = parseInt(this.jq.findLast(this.container.querySelector('.left .minuteselect')).value, 10);
        }
        second = this.options.timePickerSeconds ? parseInt((this.container.querySelector('.left .secondselect') as HTMLSelectElement).value, 10) : 0;
        if (!this.options.timePicker24Hour) {
          ampm = (this.container.querySelector('.left .ampmselect') as HTMLSelectElement).value;
          if (ampm === 'PM' && hour < 12)
            hour += 12;
          if (ampm === 'AM' && hour === 12)
            hour = 0;
        }
      } else {
        hour = parseInt((this.container.querySelector('.right .hourselect') as HTMLSelectElement).value, 10);
        minute = parseInt((this.container.querySelector('.right .minuteselect') as HTMLSelectElement).value, 10);
        if (isNaN(minute)) {
          minute = parseInt(this.jq.findLast(this.container.querySelector('.right .minuteselect')).value, 10);
        }
        second = this.options.timePickerSeconds ? parseInt((this.container.querySelector('.right .secondselect') as HTMLSelectElement).value, 10) : 0;
        if (!this.options.timePicker24Hour) {
          ampm = (this.container.querySelector('.right .ampmselect') as HTMLSelectElement).value;
          if (ampm === 'PM' && hour < 12)
            hour += 12;
          if (ampm === 'AM' && hour === 12)
            hour = 0;
        }
      }
      this.leftCalendar.month.hour(hour).minute(minute).second(second);
      this.rightCalendar.month.hour(hour).minute(minute).second(second);
    }
    this.renderCalendar('left');
    this.renderCalendar('right');
    // highlight any predefined range matching the current start and end dates
    this.rangesLiElList = this.container.querySelectorAll('.ranges li') as unknown as HTMLElement[];
    for (const item of this.rangesLiElList) {
      item.classList.remove('active');
    }
    if (this.endDate !== null) {
      this.calculateChosenLabel();
    }
    /*
    -- Note: by jquery, we can set event listener before the target element has not been build. but we must set event listener HERE by Vanilla-JS. --
    this.container.find('.drp-calendar')
        .on('click.daterangepicker', '.prev', $.proxy(this.clickPrev, this))
        .on('click.daterangepicker', '.next', $.proxy(this.clickNext, this))
        .on('mousedown.daterangepicker', 'td.available', $.proxy(this.clickDate, this))
        .on('mouseenter.daterangepicker', 'td.available', $.proxy(this.hoverDate, this))
        .on('change.daterangepicker', 'select.yearselect', $.proxy(this.monthOrYearChanged, this))
        .on('change.daterangepicker', 'select.monthselect', $.proxy(this.monthOrYearChanged, this))
        .on('change.daterangepicker', 'select.hourselect,select.minuteselect,select.secondselect,select.ampmselect', $.proxy(this.timeChanged, this));
    --------------------------------------------------------------------------------------
    */
    this.jq.on(drpCalendarElList, 'click', '.prev', this.clickPrevProxy);
    this.jq.on(drpCalendarElList, 'click', '.next', this.clickNextProxy);
    this.jq.on(drpCalendarElList, 'mousedown', 'td.available', this.clickDateProxy);
    this.jq.on(drpCalendarElList, 'mouseenter', 'td.available', this.hoverDateProxy);
    this.jq.on(drpCalendarElList, 'change', 'select.yearselect', this.monthOrYearChangedProxy);
    this.jq.on(drpCalendarElList, 'change', 'select.monthselect', this.monthOrYearChangedProxy);
    this.jq.on(drpCalendarElList, 'change', 'select.hourselect,select.minuteselect,select.secondselect,select.ampmselect', this.timeChangedProxy);
  }

  renderCalendar(side: string) {
// Build the matrix of dates that will populate the calendar
    let i: number;
    let calendar = side === 'left' ? this.leftCalendar : this.rightCalendar;
    const month = calendar.month.month();
    const year = calendar.month.year();
    const hour = calendar.month.hour();
    const minute = calendar.month.minute();
    const second = calendar.month.second();
    const daysInMonth = moment([year, month]).daysInMonth();
    const firstDay = moment([year, month, 1]);
    const lastDay = moment([year, month, daysInMonth]);
    const lastMonth = moment(firstDay).subtract(1, 'month').month();
    const lastYear = moment(firstDay).subtract(1, 'month').year();
    const daysInLastMonth = moment([lastYear, lastMonth]).daysInMonth();
    const dayOfWeek = firstDay.day();
    // initialize a 6 rows x 7 columns array for the calendar
    calendar = [];
    calendar.firstDay = firstDay;
    calendar.lastDay = lastDay;
    for (i = 0; i < 6; i++) {
      calendar[i] = [];
    }
    // populate the calendar with date objects
    let startDay = daysInLastMonth - dayOfWeek + this.options.locale.firstDay + 1;
    if (startDay > daysInLastMonth) {
      startDay -= 7;
    }
    if (dayOfWeek === this.options.locale.firstDay) {
      startDay = daysInLastMonth - 6;
    }
    let curDate = tz([lastYear, lastMonth, startDay, 12, minute, second], this.options.locale.timeZone);
    i = 0;
    let col = 0;
    let row = 0;
    for (; i < 42; i++, col++, curDate = curDate.add(24, 'hour')) {
      if (i > 0 && col % 7 === 0) {
        col = 0;
        row++;
      }
      calendar[row][col] = curDate.clone().hour(hour).minute(minute).second(second);
      curDate.hour(12);
      if (this.options.minDate && calendar[row][col].format('YYYY-MM-DD') === this.options.minDate.format('YYYY-MM-DD') && calendar[row][col].isBefore(this.options.minDate) && side === 'left') {
        calendar[row][col] = this.options.minDate.clone();
      }
      if (this.options.maxDate && calendar[row][col].format('YYYY-MM-DD') === this.options.maxDate.format('YYYY-MM-DD') && calendar[row][col].isAfter(this.options.maxDate) && side === 'right') {
        calendar[row][col] = this.options.maxDate.clone();
      }
    }
    // make the calendar object available to hoverDate/clickDate
    if (side === 'left') {
      this.leftCalendar.calendar = calendar;
    } else {
      this.rightCalendar.calendar = calendar;
    }
    //
    // Display the calendar
    //
    const minDate = side === 'left' ? this.options.minDate : this.startDate;
    let maxDate = this.options.maxDate;
    /* const selected = side === 'left' ? this.startDate : this.endDate;
     const arrow = this.options.locale.direction === 'ltr' ? {
       left: 'chevron-left',
       right: 'chevron-right',
     } : { left: 'chevron-right', right: 'chevron-left' };*/
    let html = '<table class="table-condensed">';
    html += '<thead>';
    html += '<tr>';
    // add empty cell for week number
    if (this.options.showWeekNumbers || this.options.showISOWeekNumbers) {
      html += '<th></th>';
    }
    if ((!minDate || minDate.isBefore(calendar.firstDay)) && (!this.options.linkedCalendars || side === 'left')) {
      html += '<th class="prev available"><span></span></th>';
    } else {
      html += '<th></th>';
    }
    let dateHtml = this.options.locale.monthNames[calendar[1][1].month()] + calendar[1][1].format(' YYYY');
    if (this.options.showDropdowns) {
      const currentMonth: number = calendar[1][1].month();
      const currentYear: number = calendar[1][1].year();
      const maxYear: number = (maxDate && maxDate.year()) || parseInt(this.options.maxYear, 10);
      const minYear: number = (minDate && minDate.year()) || parseInt(this.options.minYear, 10);
      const inMinYear = currentYear === minYear;
      const inMaxYear = currentYear === maxYear;
      let monthHtml = '<select class="monthselect">';
      for (let m = 0; m < 12; m++) {
        if ((!inMinYear || (minDate && m >= minDate.month())) && (!inMaxYear || (maxDate && m <= maxDate.month()))) {
          monthHtml += `<option value='${m}'${m === currentMonth ? ' selected=\'selected\'' : ''}>${this.options.locale.monthNames[m]}</option>`;
        } else {
          monthHtml += `<option value='${m}'${m === currentMonth ? ' selected=\'selected\'' : ''} disabled='disabled'>${this.options.locale.monthNames[m]}</option>`;
        }
      }
      monthHtml += '</select>';
      let yearHtml = '<select class="yearselect">';
      for (let y = minYear; y <= maxYear; y++) {
        yearHtml += `<option value="${y}"${y === currentYear ? ' selected="selected"' : ''}>${y}</option>`;
      }
      yearHtml += '</select>';
      dateHtml = monthHtml + yearHtml;
    }
    html += '<th colspan="5" class="month">' + dateHtml + '</th>';
    if ((!maxDate || maxDate.isAfter(calendar.lastDay)) && (!this.options.linkedCalendars || side === 'right' || this.options.singleDatePicker)) {
      html += '<th class="next available"><span></span></th>';
    } else {
      html += '<th></th>';
    }
    html += '</tr>';
    html += '<tr>';
    // add week number label
    if (this.options.showWeekNumbers || this.options.showISOWeekNumbers) {
      html += `<th class="week">${this.options.locale.weekLabel}</th>`;
    }
    for (const item of this.options.locale.daysOfWeek) {
      html += `<th>${item}</th>`;
    }
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';
    // adjust maxDate to reflect the maxSpan setting in order to
    // grey out end dates beyond the maxSpan
    if (this.endDate === null && this.options.maxSpan) {
      const maxLimit = this.startDate.clone().add(this.options.maxSpan).endOf('day');
      if (!maxDate || maxLimit.isBefore(maxDate)) {
        maxDate = maxLimit;
      }
    }
    for (row = 0; row < 6; row++) {
      html += '<tr>';
      // add week number
      if (this.options.showWeekNumbers) {
        html += `<td class="week">${calendar[row][0].week()}</td>`;
      } else if (this.options.showISOWeekNumbers) {
        html += `<td class="week">${calendar[row][0].isoWeek()}</td>`;
      }
      for (col = 0; col < 7; col++) {
        const classes = [];
        // highlight today's date
        if (calendar[row][col].isSame(new Date(), 'day')) {
          classes.push('today');
        }
        // highlight weekends
        if (calendar[row][col].isoWeekday() > 5) {
          classes.push('weekend');
        }
        // grey out the dates in other months displayed at beginning and end of this calendar
        if (calendar[row][col].month() !== calendar[1][1].month()) {
          classes.push('off', 'ends');
        }
        // don't allow selection of dates before the minimum date
        if (this.options.minDate && calendar[row][col].isBefore(this.options.minDate, 'day')) {
          classes.push('off', 'disabled');
        }
        // don't allow selection of dates after the maximum date
        if (maxDate && calendar[row][col].isAfter(maxDate, 'day')) {
          classes.push('off', 'disabled');
        }
        // don't allow selection of date if a custom function decides it's invalid
        if (this.isInvalidDate(calendar[row][col])) {
          classes.push('off', 'disabled');
        }
        // highlight the currently selected start date
        if (calendar[row][col].format('YYYY-MM-DD') === this.startDate.format('YYYY-MM-DD')) {
          classes.push('active', 'start-date');
        }
        // highlight the currently selected end date
        if (this.endDate !== null && calendar[row][col].format('YYYY-MM-DD') === this.endDate.format('YYYY-MM-DD')) {
          classes.push('active', 'end-date');
        }
        // highlight dates in-between the selected dates
        if (this.endDate !== null && calendar[row][col] > this.startDate && calendar[row][col] < this.endDate) {
          classes.push('in-range');
        }
        // apply custom classes for this date
        const isCustom = this.isCustomDate(calendar[row][col]);
        if (isCustom !== false) {
          if (typeof isCustom === 'string') {
            classes.push(isCustom);
          } else {
            Array.prototype.push.apply(classes, isCustom);
          }
        }
        let cname = '';
        let disabled = false;
        for (i = 0; i < classes.length; i++) {
          cname += classes[i] + ' ';
          if (classes[i] === 'disabled') {
            disabled = true;
          }
        }
        if (!disabled) {
          cname += 'available';
        }
        html += `<td class="${cname.replace(/^\s+|\s+$/g, '')}" data-title="r${row}c${col}">${calendar[row][col].date()}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody>';
    html += '</table>';
    this.jq.html(this.container.querySelector(`.drp-calendar.${side} .calendar-table`), html);
  }

  renderTimePicker(side: string) {
    let padded: string;
    let disabled: boolean;
    let time: Moment;
// Don't bother updating the time picker if it's currently disabled
    let i;
// because an end date hasn't been clicked yet
    if (side === 'right' && !this.endDate) return;
    let html: string;
    let selected: Moment;
    let minDate: Moment;
    let maxDate = this.options.maxDate;
    if (this.options.maxSpan && (!this.options.maxDate || this.startDate.clone().add(this.options.maxSpan).isBefore(this.options.maxDate))) {
      maxDate = this.startDate.clone().add(this.options.maxSpan);
    }
    if (side === 'left') {
      selected = this.startDate.clone();
      minDate = this.options.minDate;
    } else if (side === 'right') {
      selected = this.endDate.clone();
      minDate = this.startDate;
      // Preserve the time already selected
      const timeSelector = this.container.querySelector('.drp-calendar.right .calendar-time');
      if (timeSelector.innerHTML !== '') {
        selected.hour(!isNaN(selected.hour()) ? selected.hour() : this.jq.findSelectedOption(timeSelector.querySelector('.hourselect')).value);
        selected.minute(!isNaN(selected.minute()) ? selected.minute() : this.jq.findSelectedOption(timeSelector.querySelector('.minuteselect')).value);
        selected.second(!isNaN(selected.second()) ? selected.second() : this.jq.findSelectedOption(timeSelector.querySelector('.secondselect')).value);
        if (!this.options.timePicker24Hour) {
          const ampm = this.jq.findSelectedOption(timeSelector.querySelector('.ampmselect')).value;
          if (ampm === 'PM' && selected.hour() < 12)
            selected.hour(selected.hour() + 12);
          if (ampm === 'AM' && selected.hour() === 12)
            selected.hour(0);
        }
      }
      if (selected.isBefore(this.startDate)) {
        selected = this.startDate.clone();
      }
      if (maxDate && selected.isAfter(maxDate)) {
        selected = maxDate.clone();
      }
    }
    //
    // hours
    //
    html = '<select class="hourselect">';
    const start = this.options.timePicker24Hour ? 0 : 1;
    const end = this.options.timePicker24Hour ? 23 : 12;
    for (i = start; i <= end; i++) {
      let i_in_24 = i;
      if (!this.options.timePicker24Hour) {
        i_in_24 = selected.hour() >= 12 ? (i === 12 ? 12 : i + 12) : (i === 12 ? 0 : i);
      }
      time = selected.clone().hour(i_in_24);
      disabled = !!(minDate && time.minute(59).isBefore(minDate));
      if (maxDate && time.minute(0).isAfter(maxDate)) {
        disabled = true;
      }
      padded = i < 10 ? '0' + i : i;
      if (i_in_24 === selected.hour() && !disabled) {
        html += `<option value="${i}" selected="selected">${padded}</option>`;
      } else if (disabled) {
        html += `<option value="${i}" disabled="disabled" class="disabled">${padded}</option>`;
      } else {
        html += `<option value="${i}">${padded}</option>`;
      }
    }
    html += '</select> ';
    //
    // minutes
    //
    html += ': <select class="minuteselect">';
    for (i = 0; i < 60; i += this.options.timePickerIncrement) {
      padded = i < 10 ? '0' + i : i;
      time = selected.clone().minute(i);
      disabled = !!(minDate && time.second(59).isBefore(minDate));
      if (maxDate && time.second(0).isAfter(maxDate)) {
        disabled = true;
      }
      if (selected.minute() === i && !disabled) {
        html += `<option value="${i}" selected="selected">${padded}</option>`;
      } else if (disabled) {
        html += `<option value="${i}" disabled="disabled" class="disabled">${padded}</option>`;
      } else {
        html += `<option value="${i}">${padded}</option>`;
      }
    }
    html += '</select> ';
    //
    // seconds
    //
    if (this.options.timePickerSeconds) {
      html += ': <select class="secondselect">';
      for (i = 0; i < 60; i++) {
        padded = i < 10 ? '0' + i : i;
        time = selected.clone().second(i);
        disabled = minDate && time.isBefore(minDate);
        if (maxDate && time.isAfter(maxDate)) {
          disabled = true;
        }
        if (selected.second() === i && !disabled) {
          html += `<option value="${i}" selected="selected">${padded}</option>`;
        } else if (disabled) {
          html += `<option value="${i}" disabled="disabled" class="disabled">${padded}</option>`;
        } else {
          html += `<option value="${i}">${padded}</option>`;
        }
      }
      html += '</select> ';
    }
    //
    // AM/PM
    //
    if (!this.options.timePicker24Hour) {
      html += '<select class="ampmselect">';
      let am_html = '';
      let pm_html = '';
      if (minDate && selected.clone().hour(12).minute(0).second(0).isBefore(minDate)) {
        am_html = ' disabled="disabled" class="disabled"';
      }
      if (maxDate && selected.clone().hour(0).minute(0).second(0).isAfter(maxDate)) {
        pm_html = ' disabled="disabled" class="disabled"';
      }
      if (selected.hour() >= 12) {
        html += `<option value="AM"${am_html}>AM</option><option value="PM" selected="selected"${pm_html}>PM</option>`;
      } else {
        html += `<option value="AM" selected="selected"${am_html}>AM</option><option value="PM"${pm_html}>PM</option>`;
      }
      html += '</select>';
    }
    this.jq.html(this.container.querySelector('.drp-calendar.' + side + ' .calendar-time'), html);
  }

  updateFormInputs() {
    (this.container.querySelector('button.applyBtn') as HTMLButtonElement).disabled = !(this.options.singleDatePicker || (this.endDate && (this.startDate.isBefore(this.endDate) || this.startDate.isSame(this.endDate))));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  move(_e?: Event) {
    let containerLeft: string | number;
    let parentOffset = { top: 0, left: 0 };
    let containerTop: string | number;
    let drops = this.options.drops;
    let parentRightEdge = window.innerWidth;
    if (!(this.parentEl.tagName === 'BODY')) {
      const parentElOffset = this.jq.offset(this.parentEl);
      parentOffset = {
        top: parentElOffset.top - this.parentEl.scrollTop,
        left: parentElOffset.left - this.parentEl.scrollLeft,
      };
      parentRightEdge = this.parentEl.clientWidth + parentElOffset.left;
    }
    /* Note: jquery this.container.outerHeight() returns non 0 even if not showing, but Vanilla-JS this.container.offsetHeight() returns 0 */
    const elementOffset = this.jq.offset(this.element);
    switch (drops) {
      case 'auto':
        containerTop = elementOffset.top + this.element.offsetHeight - parentOffset.top;
        if (containerTop + this.container.offsetHeight >= this.parentEl.scrollHeight) {
          containerTop = elementOffset.top - this.container.offsetHeight - parentOffset.top;
          drops = 'up';
        }
        break;
      case 'up':
        containerTop = elementOffset.top - this.container.offsetHeight - parentOffset.top;
        break;
      default:
        containerTop = elementOffset.top + this.element.offsetHeight - parentOffset.top;
        break;
    }
    // Force the container to it's actual width
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.right = 'auto';
    const containerWidth = this.container.offsetWidth;
    if (drops === 'up') {
      this.container.classList.add('drop-up');
    } else {
      this.container.classList.remove('drop-up');
    }
    if ((this.container.querySelector('button.applyBtn')).getAttribute('opens') === 'left') {
      const containerRight = parentRightEdge - elementOffset.left - this.element.offsetWidth;
      if (containerWidth + containerRight > window.innerWidth) {
        this.container.style.top = containerTop + 'px';
        this.container.style.right = 'auto';
        this.container.style.left = '9px';
      } else {
        this.container.style.top = containerTop + 'px';
        this.container.style.right = containerRight + 'px';
        this.container.style.left = 'auto';
      }
    } else if (this.options.opens === 'center') {
      containerLeft = elementOffset.left - parentOffset.left + this.element.offsetWidth / 2 - containerWidth / 2;
      if (containerLeft < 0) {
        this.container.style.top = containerTop + 'px';
        this.container.style.right = 'auto';
        this.container.style.left = '9px';
      } else if (containerLeft + containerWidth > window.innerWidth) {
        this.container.style.top = containerTop + 'px';
        this.container.style.left = 'auto';
        this.container.style.right = '0';
      } else {
        this.container.style.top = containerTop + 'px';
        this.container.style.left = containerLeft + 'px';
        this.container.style.right = 'auto';
      }
    } else {
      containerLeft = elementOffset.left - parentOffset.left;
      if (containerLeft + containerWidth > window.innerWidth) {
        this.container.style.top = containerTop + 'px';
        this.container.style.left = 'auto';
        this.container.style.right = '0';
      } else {
        this.container.style.top = containerTop + 'px';
        this.container.style.left = containerLeft + 'px';
        this.container.style.right = 'auto';
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  show(_e?: Event) {
    if (this.isShowing) return;
    // Bind global datepicker mousedown for hiding and
    document.addEventListener('mousedown', this.outsideClickProxy);
    // also support mobile devices
    document.addEventListener('touchend', this.outsideClickProxy);
    this.jq.on(document, 'click', '[data-toggle=dropdown]', this.outsideClickProxy);
    // and also close when focus changes to outside the picker (eg. tabbing between controls)
    document.addEventListener('focusin', this.outsideClickProxy);
    // Reposition the picker if the window is resized while it's open
    window.addEventListener('resize', this.moveProxy);
    this.oldStartDate = this.startDate.clone();
    this.oldEndDate = this.endDate.clone();
    this.previousRightTime = this.endDate.clone();
    this.updateView();
    this.container.style.display = 'block';
    this.move();
    this.element.dispatchEvent(new CustomEvent('show.daterangepicker', { bubbles: true, detail: this }));
    this.isShowing = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hide(_e?: Event) {
    if (!this.isShowing) return;
    // incomplete date selection, revert to last values
    if (!this.endDate) {
      this.startDate = this.oldStartDate.clone();
      this.endDate = this.oldEndDate.clone();
    }
    // if a new date range was selected, invoke the user callback function
    if (!this.startDate.isSame(this.oldStartDate) || !this.endDate.isSame(this.oldEndDate)) {
      this.callback(this.startDate.clone(), this.endDate.clone(), this.chosenLabel);
    }
    // if picker is attached to a text input, update it
    this.updateElement();

    setTimeout(() => {
      document.removeEventListener('mousedown', this.outsideClickProxy);
      document.removeEventListener('touchend', this.outsideClickProxy);
      window.removeEventListener('resize', this.moveProxy);
      this.container.style.display = 'none';
      this.isShowing = false;
      this.jq.off(document, 'click', '[data-toggle=dropdown]', this.outsideClickProxy);
      document.removeEventListener('focusin', this.outsideClickProxy);
      this.element.dispatchEvent(new CustomEvent('hide.daterangepicker', { bubbles: true, detail: this }));
    }, 200);
  }

  toggle(e?: Event) {
    if (this.isShowing) {
      this.hide(e);
    } else {
      this.show(e);
    }
  }

  outsideClick(e: MouseEvent) {
    if (e.type === 'focusin' || e.composedPath().includes(this.container)) return;
    this.hide();
    this.element.dispatchEvent(new CustomEvent('outsideClick.daterangepicker', { bubbles: true, detail: this }));
  }

  showCalendars() {
    this.container.classList.add('show-calendar');
    this.move();
    this.element.dispatchEvent(new CustomEvent('showCalendar.daterangepicker', { bubbles: true, detail: this }));
  }

  hideCalendars() {
    this.container.classList.remove('show-calendar');
    this.element.dispatchEvent(new CustomEvent('hideCalendar.daterangepicker', { bubbles: true, detail: this }));
  }

  clickRange(e: MouseEvent) {
    const label = (e.target as HTMLElement).dataset.rangeKey;
    this.chosenLabel = label;
    if (label === this.options.locale.customRangeLabel) {
      this.showCalendars();
    } else {
      const dates = this.options.ranges[label];
      this.startDate = dates[0];
      this.endDate = dates[1];
      if (!this.options.timePicker) {
        this.startDate.startOf('day');
        this.endDate.endOf('day');
      }
      if (!this.options.alwaysShowCalendars) {
        this.hideCalendars();
      }
      this.clickApply(e);
    }
  }

  clickPrev(e: MouseEvent) {
    const cal = (e.target as HTMLElement).closest('.drp-calendar'); // Note: original use parents not closest.
    if (cal.classList.contains('left')) {
      this.leftCalendar.month.subtract(1, 'month');
      if (this.options.linkedCalendars) {
        this.rightCalendar.month.subtract(1, 'month');
      }
    } else {
      this.rightCalendar.month.subtract(1, 'month');
    }
    this.updateCalendars();
  }

  clickNext(e: MouseEvent) {
    const cal = (e.target as HTMLElement).closest('.drp-calendar'); // Note: original use parents not closest.
    if (cal.classList.contains('left')) {
      this.leftCalendar.month.add(1, 'month');
    } else {
      this.rightCalendar.month.add(1, 'month');
      if (this.options.linkedCalendars) {
        this.leftCalendar.month.add(1, 'month');
      }
    }
    this.updateCalendars();
  }

  hoverDate(e: MouseEvent) {
    // ignore dates that can't be selected
    const target = e.target as HTMLElement;
    if (!(target.classList.contains('available'))) return;

    let title = target.dataset.title;
    let row = title.substr(1, 1);
    let col = title.substr(3, 1);
    let cal = target.closest('.drp-calendar'); // Note: original use parents not closest.
    const date = cal.classList.contains('left') ? this.leftCalendar.calendar[row][col] : this.rightCalendar.calendar[row][col];
    // highlight the dates between the start date and the date being hovered as a potential end date
    const leftCalendar = this.leftCalendar;
    const rightCalendar = this.rightCalendar;
    const startDate = this.startDate;
    if (!this.endDate) {
      const tdElList = this.container.querySelectorAll('.drp-calendar tbody td');
      for (const td of tdElList) {
        // skip week numbers, only look at dates
        if (td.classList.contains('week')) return;
        title = (td as HTMLElement).dataset.title;
        row = title.substr(1, 1);
        col = title.substr(3, 1);
        cal = td.closest('.drp-calendar'); // Note: original use parents not closest.
        const dt = cal.classList.contains('left') ? leftCalendar.calendar[row][col] : rightCalendar.calendar[row][col];
        if ((dt.isAfter(startDate) && dt.isBefore(date)) || dt.isSame(date, 'day')) {
          td.classList.add('in-range');
        } else {
          td.classList.remove('in-range');
        }
      }
    }
  }

  clickDate(e: MouseEvent) {
    let second: number;
    let minute: number;
    let ampm: string;
    let hour: number;
    const target = e.target as HTMLElement;
    if (!target.classList.contains('available')) return;
    const title = target.dataset.title;
    const row = title.substr(1, 1);
    const col = title.substr(3, 1);
    const cal = target.closest('.drp-calendar');  // Note: original use parents not closest.
    let date = cal.classList.contains('left') ? this.leftCalendar.calendar[row][col] : this.rightCalendar.calendar[row][col];
    //
    // this function needs to do a few things:
    // * alternate between selecting a start and end date for the range,
    // * if the time picker is enabled, apply the hour/minute/second from the select boxes to the clicked date
    // * if autoapply is enabled, and an end date was chosen, apply the selection
    // * if single date picker mode, and time picker isn't enabled, apply the selection immediately
    // * if one of the inputs above the calendars was focused, cancel that manual input
    //
    if (this.endDate || date.isBefore(this.startDate, 'day')) { // picking start
      if (this.options.timePicker) {
        hour = parseInt((this.container.querySelector('.left .hourselect') as HTMLSelectElement).value, 10);
        if (!this.options.timePicker24Hour) {
          ampm = (this.container.querySelector('.left .ampmselect') as HTMLSelectElement).value;
          if (ampm === 'PM' && hour < 12) {
            hour += 12;
          }
          if (ampm === 'AM' && hour === 12) {
            hour = 0;
          }
        }
        minute = parseInt((this.container.querySelector('.left .minuteselect') as HTMLSelectElement).value, 10);
        if (isNaN(minute)) {
          minute = parseInt((this.container.querySelector('.left .minuteselect option:last-of-type') as HTMLSelectElement).value, 10);
        }
        second = this.options.timePickerSeconds ? parseInt((this.container.querySelector('.left .secondselect') as HTMLSelectElement).value, 10) : 0;
        date = date.clone().hour(hour).minute(minute).second(second);
      }
      this.endDate = null;
      this.setStartDate(date.clone());
    } else if (!this.endDate && date.isBefore(this.startDate)) {
      // special case: clicking the same date for start/end,
      // but the time of the end date is before the start date
      this.setEndDate(this.startDate.clone());
    } else { // picking end
      if (this.options.timePicker) {
        hour = parseInt((this.container.querySelector('.right .hourselect') as HTMLSelectElement).value, 10);
        if (!this.options.timePicker24Hour) {
          ampm = (this.container.querySelector('.right .ampmselect') as HTMLSelectElement).value;
          if (ampm === 'PM' && hour < 12) {
            hour += 12;
          }
          if (ampm === 'AM' && hour === 12) {
            hour = 0;
          }
        }
        minute = parseInt((this.container.querySelector('.right .minuteselect') as HTMLSelectElement).value, 10);
        if (isNaN(minute)) {
          minute = parseInt((this.container.querySelector('.right .minuteselect option:last-of-type') as HTMLSelectElement).value, 10);
        }
        second = this.options.timePickerSeconds ? parseInt((this.container.querySelector('.right .secondselect') as HTMLSelectElement).value, 10) : 0;
        date = date.clone().hour(hour).minute(minute).second(second);
      }
      this.setEndDate(date.clone());
      if (this.options.autoApply) {
        this.calculateChosenLabel();
        this.clickApply(e);
      }
    }

    if (this.options.singleDatePicker) {
      this.setEndDate(this.startDate);
      if (!this.options.timePicker && this.options.autoApply) {
        this.clickApply(e);
      }
    }
    this.updateView();
    // This is to cancel the blur event handler if the mouse was in one of the inputs
    e.stopPropagation();
  }

  calculateChosenLabel() {
    let customRange = true;
    const rangesKey = Object.keys(this.options.ranges);
    for (let i = 0; i < rangesKey.length; ++i) {
      const range = this.options.ranges[rangesKey[i]];
      if (this.options.timePicker) {
        const format = this.options.timePickerSeconds ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm';
        // ignore times when comparing dates if time picker seconds is not enabled
        if (this.startDate.format(format) === range[0].format(format) && this.endDate.format(format) === range[1].format(format)) {
          customRange = false;
          const rangesLiList = this.container.querySelectorAll('.ranges li');
          rangesLiList[i].classList.add('active');
          this.chosenLabel = (rangesLiList[i] as HTMLInputElement).dataset.rangeKey;
          break;
        }
      } else {
        // ignore times when comparing dates if time picker is not enabled
        if (this.startDate.format('YYYY-MM-DD') === range[0].format('YYYY-MM-DD') && this.endDate.format('YYYY-MM-DD') === range[1].format('YYYY-MM-DD')) {
          customRange = false;
          const rangesLiList = this.container.querySelectorAll('.ranges li');
          rangesLiList[i].classList.add('active');
          this.chosenLabel = (rangesLiList[i] as HTMLInputElement).dataset.rangeKey;
          break;
        }
      }
    }
    if (customRange) {
      if (this.options.showCustomRangeLabel) {
        const rangesLiLastEl = this.jq.findLast(this.container.querySelectorAll('.ranges li'));
        if (rangesLiLastEl) {
          rangesLiLastEl.classList.add('active');
          this.chosenLabel = rangesLiLastEl.dataset.rangeKey;
        } else {
          this.chosenLabel = null;
        }
      } else {
        this.chosenLabel = null;
      }
      this.showCalendars();
    }
  }

  clickApply(e: MouseEvent) {
    this.hide(e);
    e.target.dispatchEvent(new CustomEvent('apply.daterangepicker', { bubbles: true, detail: this }));
  }

  clickCancel(e: MouseEvent) {
    this.startDate = this.oldStartDate;
    this.endDate = this.oldEndDate;
    this.hide();
    e.target.dispatchEvent(new CustomEvent('cancel.daterangepicker', { bubbles: true, detail: this }));
  }

  monthOrYearChanged(e: Event) {
    const isLeft = (e.target as HTMLElement).closest('.drp-calendar').classList.contains('left');
    const leftOrRight = isLeft ? 'left' : 'right';
    const cal = this.container.querySelector('.drp-calendar.' + leftOrRight);
    // Month must be Number for new moment versions
    let month = parseInt((cal.querySelector('.monthselect') as HTMLSelectElement).value, 10);
    let year = parseInt((cal.querySelector('.yearselect') as HTMLSelectElement).value, 10);
    if (!isLeft) {
      if (year < this.startDate.year() || (year === this.startDate.year() && month < this.startDate.month())) {
        month = this.startDate.month();
        year = this.startDate.year();
      }
    }
    if (this.options.minDate) {
      if (year < this.options.minDate.year() || (year === this.options.minDate.year() && month < this.options.minDate.month())) {
        month = this.options.minDate.month();
        year = this.options.minDate.year();
      }
    }
    if (this.options.maxDate) {
      if (year > this.options.maxDate.year() || (year === this.options.maxDate.year() && month > this.options.maxDate.month())) {
        month = this.options.maxDate.month();
        year = this.options.maxDate.year();
      }
    }
    if (isLeft) {
      this.leftCalendar.month.month(month).year(year);
      if (this.options.linkedCalendars) {
        this.rightCalendar.month = this.leftCalendar.month.clone().add(1, 'month');
      }
    } else {
      this.rightCalendar.month.month(month).year(year);
      if (this.options.linkedCalendars) {
        this.leftCalendar.month = this.rightCalendar.month.clone().subtract(1, 'month');
      }
    }
    this.updateCalendars();
  }

  timeChanged(e: Event) {
    const cal = (e.target as HTMLElement).closest('.drp-calendar');
    const isLeft = cal.classList.contains('left');
    let hour = parseInt((cal.querySelector('.hourselect') as HTMLSelectElement).value, 10);
    let minute = parseInt((cal.querySelector('.minuteselect') as HTMLSelectElement).value, 10);
    if (isNaN(minute)) {
      minute = parseInt(this.jq.findLast(cal.querySelectorAll('.minuteselect option') as unknown as HTMLSelectElement).value, 10);
    }
    const second = this.options.timePickerSeconds ? parseInt((cal.querySelector('.secondselect') as HTMLSelectElement).value, 10) : 0;
    if (!this.options.timePicker24Hour) {
      const ampm = (cal.querySelector('.ampmselect') as HTMLSelectElement).value;
      if (ampm === 'PM' && hour < 12)
        hour += 12;
      if (ampm === 'AM' && hour === 12)
        hour = 0;
    }
    if (isLeft) {
      const start = this.startDate.clone();
      start.hour(hour);
      start.minute(minute);
      start.second(second);
      this.setStartDate(start);
      if (this.options.singleDatePicker) {
        this.endDate = this.startDate.clone();
      } else if (this.endDate && this.endDate.format('YYYY-MM-DD') === start.format('YYYY-MM-DD') && this.endDate.isBefore(start)) {
        this.setEndDate(start.clone());
      }
    } else if (this.endDate) {
      const end = this.endDate.clone();
      end.hour(hour);
      end.minute(minute);
      end.second(second);
      this.setEndDate(end);
    }
    // update the calendars so all clickable dates reflect the new time component
    this.updateCalendars();
    // update the form inputs above the calendars with the new time
    this.updateFormInputs();
    // re-render the time pickers because changing one selection can affect what's enabled in another
    const drpCalendarElList = this.container.querySelectorAll('.drp-calendar');
    this.jq.off(drpCalendarElList, 'change', 'select.hourselect,select.minuteselect,select.secondselect,select.ampmselect', (e: Event) => this.timeChanged(e));
    this.renderTimePicker('left');
    this.renderTimePicker('right');
    this.jq.on(drpCalendarElList, 'change', 'select.hourselect,select.minuteselect,select.secondselect,select.ampmselect', (e: Event) => this.timeChanged(e));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  elementChanged(_e?: Event) {
    if (!(this.element.tagName === 'INPUT')) return;
    if (!this.element.value || !this.element.value.length) return;
    const dateString = this.element.value.split(this.options.locale.separator);
    let start = null;
    let end = null;
    if (dateString.length === 2) {
      start = moment(dateString[0], this.options.locale.format);
      end = moment(dateString[1], this.options.locale.format);
    }
    if (this.options.singleDatePicker || start === null || end === null) {
      start = moment(this.element.value, this.options.locale.format);
      end = start;
    }
    if (!start.isValid() || !end.isValid()) return;
    this.setStartDate(start);
    this.setEndDate(end);
    this.updateView();
  }

  keydown(e: KeyboardEvent) {
    // hide on tab or enter
    if ((e.keyCode === 9) || (e.keyCode === 13)) {
      this.hide(e);
    }
    // hide on esc and prevent propagation
    if (e.keyCode === 27) {
      e.preventDefault();
      e.stopPropagation();
      this.hide(e);
    }
  }

  updateElement() {
    if (this.element.tagName === 'INPUT' && this.options.autoUpdateInput) {
      let newValue = this.startDate.locale(this.options.locale.locale ?? 'en').format(this.options?.locale?.format);
      if (!this.options.singleDatePicker) {
        newValue += this.options.locale.separator + this.endDate.locale(this.options.locale.locale ?? 'en').format(this.options.locale.format);
      }
      if (newValue !== this.element.value) {
        this.element.value = newValue;
        /* this.element.dispatchEvent(new Event('change')); Note: イベント？ */
      }
    }
  }

  remove() {
    // Bind global datepicker mousedown for hiding and
    document.removeEventListener('mousedown', this.outsideClickProxy);
    // also support mobile devices
    document.removeEventListener('touchend', this.outsideClickProxy);
    this.jq.off(document, 'click', '[data-toggle=dropdown]', this.outsideClickProxy);
    // and also close when focus changes to outside the picker (eg. tabbing between controls)
    document.removeEventListener('focusin', this.outsideClickProxy);
    delete this.outsideClickProxy;
    window.addEventListener('resize', this.moveProxy);
    delete this.moveProxy;
    this.jq.off(this.container.querySelector('.ranges'), 'click', 'li', this.clickRangeProxy);
    // delete this.clickRangeProxy;
    const drpButtonsEl = this.container.querySelector('.drp-buttons');
    this.jq.off(drpButtonsEl, 'click', 'button.applyBtn', this.clickApplyProxy);
    delete this.clickApplyProxy;
    this.jq.off(drpButtonsEl, 'click', 'button.cancelBtn', this.clickCancelProxy);
    delete this.clickCancelProxy;
    if (this.element.tagName === 'INPUT' || this.element.tagName === 'BUTTON') {
      if (this.showProxy) {
        this.jq.off(this.element, 'click', this.showProxy);
        this.jq.off(this.element, 'focus', this.showProxy);
        delete this.showProxy;
      }
      this.jq.off(this.element, 'keyup', this.elementChangedProxy);
      delete this.elementChangedProxy;
      this.jq.off(this.element, 'keydown', this.keydownProxy);
      delete this.keydownProxy;
    } else {
      this.jq.off(this.element, 'click', this.toggleProxy);
      this.jq.off(this.element, 'keydown', this.toggleProxy);
      delete this.toggleProxy;
    }
    const drpCalendarElList = this.container.querySelectorAll('.drp-calendar');
    this.jq.off(drpCalendarElList, 'click', '.prev', this.clickPrevProxy);
    delete this.clickPrevProxy;
    this.jq.off(drpCalendarElList, 'click', '.next', this.clickNextProxy);
    delete this.clickNextProxy;
    this.jq.off(drpCalendarElList, 'mousedown', 'td.available', this.clickDateProxy);
    delete this.clickDateProxy;
    this.jq.off(drpCalendarElList, 'mouseenter', 'td.available', this.hoverDateProxy);
    delete this.hoverDateProxy;
    this.jq.off(drpCalendarElList, 'change', 'select.yearselect', this.monthOrYearChangedProxy);
    this.jq.off(drpCalendarElList, 'change', 'select.monthselect', this.monthOrYearChangedProxy);
    delete this.monthOrYearChangedProxy;
    this.jq.off(drpCalendarElList, 'change', 'select.hourselect,select.minuteselect,select.secondselect,select.ampmselect', this.timeChangedProxy);
    delete this.timeChangedProxy;
    delete this.container;
    // delete (this.element as HTMLElement).dataset;
  }

  updateRanges(newRanges: any) {
    if (typeof newRanges === 'object') {
      this.jq.off(this.container.querySelector('.ranges'), 'click', 'li', this.clickRangeProxy);
      this.options.ranges = [];
      const rangesKeys = Object.keys(newRanges);
      let start: Moment;
      let end: Moment;
      for (const range of rangesKeys) {
        if (typeof newRanges[range][0] === 'string') {
          start = moment(newRanges[range][0], this.options.locale.format);
        } else {
          start = moment(newRanges[range][0]);
        }
        if (typeof newRanges[range][1] === 'string') {
          end = moment(newRanges[range][1], this.options.locale.format);
        } else {
          end = moment(newRanges[range][1]);
        }
        // If the start or end date exceed those allowed by the minDate or maxSpan
        // options, shorten the range to the allowable period.
        if (this.options.minDate && start.isBefore(this.options.minDate)) {
          start = this.options.minDate.clone();
        }
        let maxDate = this.options.maxDate;
        if (this.options.maxSpan && maxDate && start.clone().add(this.options.maxSpan).isAfter(maxDate)) {
          maxDate = start.clone().add(this.options.maxSpan);
        }
        if (maxDate && end.isAfter(maxDate)) {
          end = maxDate.clone();
        }
        // If the end of the range is before the minimum or the start of the range is
        // after the maximum, don't display this range option at all.
        if ((this.options.minDate && end.isBefore(this.options.minDate, this.timepicker ? 'minute' : 'day'))
          || (maxDate && start.isAfter(maxDate, this.timepicker ? 'minute' : 'day'))) {
          continue;
        }
        // Support unicode chars in the range names.
        const elem = document.createElement('textarea');
        elem.innerHTML = range;
        const rangeHtml = elem.value;
        this.options.ranges[rangeHtml] = [start, end];
      }
      let list = '<ul>';
      for (const range of this.options.ranges) {
        list += `<li data-range-key="${range}">${range}</li>`;
      }
      if (this.options.showCustomRangeLabel) {
        list += `<li data-range-key="${this.options.locale.customRangeLabel}">${this.options.locale.customRangeLabel}</li>`;
      }
      list += '</ul>';
      const rangeNode = this.container.querySelector('.ranges');
      rangeNode.removeChild(rangeNode.firstChild);
      rangeNode.insertAdjacentHTML('afterbegin', list);
    }
    this.jq.on(this.container.querySelector('.ranges'), 'click', 'li', this.clickRangeProxy);
  }
}
