import { Component, Event, EventEmitter, h, Prop, Watch } from '@stencil/core';
import { DTPickerOptions } from './datetimerange-picker/options';
import moment, { Moment } from 'moment/min/moment-with-locales';
import { DateRangePicker } from './datetimerange-picker/datetimerange-picker';
import { Param } from '../../../model/param';
import { GTSLib } from '../../../utils/gts.lib';
import { Utils } from '../../../utils/utils';
import { tz } from 'moment-timezone';

@Component({
  tag: 'discovery-input-date-range',
  styleUrl: 'discovery-input-date-range.scss',
  shadow: true,
})
export class DiscoveryInputDateRange {
  @Prop() options: Param = new Param();
  @Prop() dateRange: number[] = [];
  @Prop() required: boolean;
  @Prop() disabled: boolean;

  @Event() valueChanged: EventEmitter<number[] | number>;

  private input: HTMLInputElement;
  private wrapper: HTMLDivElement;
  private previousStart: Moment;
  private previousEnd: Moment;
  private opts: DTPickerOptions = new DTPickerOptions();
  private drp: DateRangePicker;
  private divider: number;

  private cbProxy = (start: Moment, end: Moment) => this.selected(start, end);

  @Watch('dateRange')
  onDateRangeChange() {
    this.setOptions();
  }

  @Watch('options')
  onOptionsChange() {
    this.setOptions();
  }

  // noinspection JSUnusedGlobalSymbols
  componentDidLoad() {
    if ((this.dateRange ?? []).length > 0) {
      this.setOptions();
    }
  }

  private selected(start: Moment, end: Moment) {
    if (!start.isSame(this.previousStart) && !end.isSame(this.previousEnd) && (this.dateRange ?? []).length > 0) {
      this.previousStart = start.clone();
      this.previousEnd = end.clone();
      if (!this.opts.singleDatePicker) {
        this.valueChanged.emit([
          GTSLib.toTimestamp(this.previousStart.toISOString(true), this.divider, this.options.timeZone, undefined),
          GTSLib.toTimestamp(this.previousEnd.toISOString(true), this.divider, this.options.timeZone, undefined),
        ]);
      } else if (this.opts.singleDatePicker) {
        this.valueChanged.emit(GTSLib.toTimestamp(this.previousStart.toISOString(true), this.divider, this.options.timeZone, undefined));
      }
    }
  }

  private setOptions() {
    this.divider = GTSLib.getDivider(this.options.timeUnit ?? 'us');
    if (!GTSLib.isArray(this.dateRange)) return;
    if (!this.dateRange[0]) return;
    this.opts = {
      ...this.opts,
      parentEl: this.wrapper,
      timePicker: !this.options.input?.disableTime,
      singleDatePicker: ((this.dateRange ?? []).length === 1),
      cancelButtonClasses: 'discovery-btn',
      buttonClasses: 'discovery-btn',
      timePicker24Hour: true,
      timePickerSeconds: true,
      alwaysShowCalendars: true,
      autoUpdateInput: true,
      // opens: 'left',
      // drops: 'auto',
      ranges: this.options.input?.ranges
        ? this.convertRange(this.options.input?.ranges ?? {})
        : {
          'Today': [moment().startOf('day'), moment().endOf('day')],
          'Yesterday': [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')],
          'Last 7 Days': [moment().subtract(6, 'days').startOf('day'), moment().endOf('day')],
          'This Month': [moment().startOf('month').startOf('day'), moment().endOf('month').endOf('day')],
        },
      wrapperClasses: '',
    };
    if (this.opts.singleDatePicker) {
      this.opts.ranges = undefined;
    }
    if (this.opts.ranges) {
      this.opts.wrapperClasses = 'with-range';
    }
    if (document.body.offsetWidth < 1024 || this.opts.singleDatePicker) {
      this.opts.wrapperClasses += ' sm';
    }
    if (!!this.options.input && !!this.options.input.min) {
      this.opts.minDate = this.toMoment(this.options.input.min);
    }
    if (!!this.options.input && !!this.options.input.max) {
      this.opts.maxDate = this.toMoment(this.options.input.max);
    }
    let locale = this.options.input?.locale ?? 'default';
    if (locale === 'AUTO') {
      locale = Utils.getNavigatorLanguage();
    }
    const timeZone = this.options.timeZone === 'AUTO' ? tz.guess() : this.options.timeZone;
    this.opts.locale = {
      locale: locale,
      format: this.options.timeFormat ?? 'YYYY-MM-DDTHH:mm:ssZ',
      timeZone,
      customRangeLabel: this.options.input?.customRangeLabel,
      applyLabel: this.options.input?.applyLabel,
      cancelLabel: this.options.input?.cancelLabel,
    };
    if ((this.dateRange ?? []).length > 1) {
      this.opts.singleDatePicker = false;
      this.previousStart = this.toMoment(this.dateRange[0]);
      this.previousEnd = this.toMoment(this.dateRange[1]);
      this.opts.startDate = this.previousStart.clone();
      this.opts.endDate = this.previousEnd.clone();
    }
    if ((this.dateRange ?? []).length === 1) {
      this.opts.singleDatePicker = true;
      this.previousStart = this.toMoment(this.dateRange[0]);
      this.previousEnd = this.toMoment(this.dateRange[0]);
      this.opts.startDate = this.previousStart.clone();
      this.opts.endDate = this.previousEnd.clone();
    }
    if (this.drp) {
      this.drp.remove();
    }
    this.drp = new DateRangePicker(this.input, this.opts, this.cbProxy);
  }

  private toMoment(timestamp: number): Moment {
    const timeZone = this.options.timeZone === 'AUTO' ? tz.guess() : this.options.timeZone;
    if (timeZone ?? 'UTC' !== 'UTC') {
      return tz(timestamp / this.divider, timeZone ?? 'UTC');
    } else {
      return moment.utc(timestamp / this.divider);
    }
  }

  private convertRange(ranges: any) {
    const r = {};
    Object.keys(ranges).forEach(k => {
      r[k] = ranges[k].map((time: number) => this.toMoment(time));
    });
    return r;
  }

  render() {
    return <div ref={el => this.wrapper = el} class="wrapper">
      <button class="discovery-btn prev" onClick={() => this.previousPeriod()}>&lt;</button>
      <input type="text"
             ref={el => this.input = el}
             required={this.required}
             disabled={this.disabled}
             class="discovery-input"
      />
      <button class="discovery-btn next" onClick={() => this.nextPeriod()}>&gt;</button>
    </div>;
  }

  private previousPeriod() {
    let start: Moment;
    let end: Moment;
    if (this.opts.singleDatePicker) {
      start = this.previousStart.clone().subtract(1, 'd');
      end = this.previousEnd.clone().subtract(1, 'd');
    } else {
      const diff = this.previousEnd.diff(this.previousStart);
      start = this.previousStart.clone().subtract(diff, 'ms');
      end = this.previousEnd.clone().subtract(diff, 'ms');
    }
    this.selected(start, end);
    this.drp.setStartDate(start);
    this.drp.setEndDate(end);
  }

  private nextPeriod() {
    let start: Moment;
    let end: Moment;
    if (this.opts.singleDatePicker) {
      start = this.previousStart.clone().add(1, 'd');
      end = this.previousEnd.clone().add(1, 'd');
    } else {
      const diff = this.previousEnd.diff(this.previousStart);
      start = this.previousStart.clone().add(diff, 'ms');
      end = this.previousEnd.clone().add(diff, 'ms');
    }
    this.selected(start, end);
    this.drp.setStartDate(start);
    this.drp.setEndDate(end);
  }
}
