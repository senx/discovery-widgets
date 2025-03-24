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

import moment, { Duration } from 'moment/moment';

export class DTPickerOptions {
  startDate: moment.Moment;
  endDate: moment.Moment;
  minDate: moment.Moment;
  maxDate: moment.Moment;
  maxSpan: number | Duration | string;
  autoApply: boolean;
  singleDatePicker: boolean;
  showDropdowns: boolean;
  minYear: string;
  maxYear: string;
  showWeekNumbers: boolean;
  showISOWeekNumbers: boolean;
  showCustomRangeLabel: boolean;
  timePicker: boolean;
  timePicker24Hour: boolean;
  timePickerSeconds: boolean;
  linkedCalendars: boolean;
  autoUpdateInput: boolean;
  alwaysShowCalendars: boolean;
  timePickerIncrement: number;
  ranges: any;
  opens: string;
  drops: string;
  buttonClasses: string;
  applyButtonClasses: string;
  cancelButtonClasses: string;
  wrapperClasses: string;
  template?: string;
  parentEl?: HTMLElement;
  locale: {
    locale?: string;
    timeZone?: string;
    direction?: string;
    format?: string;
    separator?: string;
    applyLabel?: string;
    cancelLabel?: string;
    weekLabel?: string;
    customRangeLabel?: string;
    daysOfWeek?: string[];
    monthNames?: string[];
    firstDay?: number;
  };
  isInvalidDate?: () => void;
  isCustomDate?: () => void;
}
