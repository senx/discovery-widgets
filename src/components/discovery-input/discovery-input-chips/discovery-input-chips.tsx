/*
 *   Copyright 2022-2024 SenX S.A.S.
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// noinspection ES6UnusedImports eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Component, Element, Event, EventEmitter, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import { GTSLib } from '../../../utils/gts.lib';

@Component({
  tag: 'discovery-input-chips',
  styleUrl: 'discovery-input-chips.scss',
  shadow: true,
})
export class DiscoveryInputChips {

  @Prop() chips: string[] = [];
  @Prop() autocomplete: (value: string) => Promise<any>;
  @Prop() containsFn: (value: string) => Promise<boolean>;
  @Prop() constrain_input = false;
  @Prop({ mutable: true }) value: string;
  @Prop() disabled: boolean = false;

  @Element() el: HTMLDiscoveryInputChipsElement;

  @Event() chipClick: EventEmitter;
  @Event({
    composed: true,
    bubbles: true,
  }) chipInput: EventEmitter<void>;
  @Event({
    composed: true,
    bubbles: true,
    cancelable: false,
  }) chipChange: EventEmitter<string[]>;
  @Event({
    composed: true,
    bubbles: true,
    cancelable: false,
  }) chipCreate: EventEmitter;

  @State() private innerChips = [];

  private change_handler_enabled = true;
  private autocomplete_debounce = 200;
  private autocomplete_highlight = true;
  private delimiters = [' '];
  private boundClickHandler = this.handleDocumentClick.bind(this);
  private real_input: HTMLInputElement;
  private show_autocomplete_on_focus: boolean;
  private highlighted_autocomplete_index: number;
  private autocomplete_select_default: any;
  private autocomplete_debounce_key: any;
  private caret_position: { x: number, y: number };
  private caret_position_tracker: HTMLDivElement;
  private autocomplete_dismiss_target: any;
  private autocompleteContainer: HTMLDivElement;

  @Watch('chips')
  updateChips() {
    this.innerChips = (this.chips ?? []).slice();
  }

  // noinspection JSUnusedGlobalSymbols
  componentDidLoad() {
    this.el.addEventListener('click', () => this.real_input.focus());
    this.innerChips = (this.chips ?? []).slice();
  }

  handleAutocompleteContainerFocus(event: FocusEvent) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  private handleChipClose(event: any) {
    const chipLabel = event.detail;
    let index = -1;
    for (let i = 0; i < (this.innerChips ?? []).length; i++) {
      if (this.innerChips[i] === chipLabel) {
        index = i;
        break;
      }
    }
    if (index >= 0) {
      void this.deleteChip(index);
    }
  }

  @Listen('document:click')
  handleDocumentClick(event: any) {
    if ((event.path ?? []).includes(this.el)) {
      return;
    }
    this.closeAutoComplete(true);
  }

  private handleChipClick(event: any, chip: any) {
    this.chipClick.emit({
      label: chip.label,
      event: event,
    });
  }

  private handleInput(event?: any) {
    let autocomplete_items = [];
    this.value = this.real_input.value;
    const key = event ? event.data ?? '' : '';
    if (this.delimiters.includes(key)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!this.constrain_input)
        return this.createChip(undefined);
    }

    if (this.autocomplete_debounce_key) {
      clearTimeout(this.autocomplete_debounce_key);
    }
    this.chipInput.emit();
    return new Promise<void>(resolve => {
      this.autocomplete_debounce_key = setTimeout(() => {
        (async () => {
          this.autocomplete_debounce_key = null;
          const value = this.real_input.value;
          this.highlighted_autocomplete_index = null;
          if (this.autocomplete) {
            autocomplete_items = await this.autocomplete(value);
          }
          if (!autocomplete_items.length) {
            this.closeAutoComplete(false);
            return;
          } else {
            this.showAutoComplete(autocomplete_items, value);
          }
        })().then(() => resolve()).catch(e => console.error(e));
      }, this.autocomplete_debounce);
    });

  }

  private async handleBeforeInput(event: any) {
    const input_type = event.inputType;
    const key = event.data;
    let autocomplete_items = [];

    if (input_type === 'deleteContentBackward') {
      if (this.real_input.selectionStart === 0) {
        if (this.innerChips?.length)
          await this.deleteChip(this.innerChips.length - 1);
      }
      return;
    }
    if ((input_type === 'insertLineBreak')) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (this.highlighted_autocomplete_index !== null) {
        const div = this.autocompleteContainer.childNodes[this.highlighted_autocomplete_index];
        return this.handleAutoCompleteItemSelected(div);
      } else {
        if (this.autocomplete_select_default) {
          if (this.autocompleteContainer.childNodes.length) {
            const div = this.autocompleteContainer.childNodes[0];
            return this.handleAutoCompleteItemSelected(div);
          }
        }
      }
      await this.createChip(undefined);
      return;
    }
    if (this.constrain_input && !!this.autocomplete) {
      let value = this.real_input.value;
      value += key;
      this.highlighted_autocomplete_index = null;
      if (!!this.autocomplete) {
        autocomplete_items = await this.autocomplete(value);
      }
      if (!autocomplete_items.length) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      return;
    }
  }

  private handleChange() {
    if (!this.change_handler_enabled) {
      return;
    }
  }

  private handleKeydown(event: any) {
    const key = event.key;
    let navigating = false;
    if (key === 'ArrowDown') {
      if (this.highlighted_autocomplete_index == null)
        this.highlighted_autocomplete_index = -1;
      this.highlighted_autocomplete_index++;
      if (this.highlighted_autocomplete_index > (this.autocompleteContainer.childNodes.length - 1))
        this.highlighted_autocomplete_index = this.autocompleteContainer.childNodes.length - 1;
      navigating = true;
    }

    if (key === 'ArrowUp') {
      if (this.highlighted_autocomplete_index == null)
        this.highlighted_autocomplete_index = 1;
      this.highlighted_autocomplete_index--;
      if (this.highlighted_autocomplete_index < 0)
        this.highlighted_autocomplete_index = 0;
      navigating = true;
    }

    if (navigating) {
      const items = this.autocompleteContainer.children;
      for (let i = 0; i < items.length; i++) {
        const item = items.item(i) as HTMLElement;
        item.style.backgroundColor = 'var(--chip-input-autocomplete-background-color, white)';
        if (this.highlighted_autocomplete_index === i) {
          item.style.backgroundColor = 'var(--chip-input-autocomplete-hover-background-color, lightblue)';
          item.scrollIntoView();
        }
      }
    }
  }

  private updateCaretPosition() {
    const selection_start = this.real_input.selectionStart;
    this.caret_position_tracker.textContent = this.real_input.value.substring(0, selection_start).replace(/\s/g, '\u00a0');
    const pos_rect = this.caret_position_tracker.getBoundingClientRect();
    const input_rect = this.real_input.getBoundingClientRect();
    this.caret_position = {
      x: input_rect.x + pos_rect.width,
      y: input_rect.y + pos_rect.height,
    };
  }

  private closeAutoComplete(force: boolean) {
    if (!force && this.show_autocomplete_on_focus)
      return;
    if (this.autocomplete_dismiss_target) {
      this.autocomplete_dismiss_target.removeEventListener('click', this.boundClickHandler);
    } else {
      document.removeEventListener('click', this.boundClickHandler);
    }
    this.autocompleteContainer.style.display = 'none';
  }

  private async deleteChip(index: number) {
    (this.innerChips ?? []).splice(index, 1);
    this.innerChips = [...this.innerChips];
    this.chipChange.emit(this.innerChips);
    if (this.show_autocomplete_on_focus && this.autocomplete) {
      await this.handleInput(undefined);
    }
  }

  private async handleAutoCompleteItemSelected(div: any) {
    this.change_handler_enabled = false;
    this.real_input.value = div.dataset.value;
    await this.createChip(div.autocomplete_data);
    this.closeAutoComplete(false);
    this.real_input.blur();
    this.real_input.focus();
    this.highlighted_autocomplete_index = null;
  }

  private async handleFocus() {
    this.updateCaretPosition();
    if (this.show_autocomplete_on_focus && !!this.autocomplete) {
      const autocomplete_items = await this.autocomplete(this.real_input.value);
      this.showAutoComplete(autocomplete_items, this.real_input.value);
    }
  }

  private showAutoComplete(autocomplete_items: any, highlight_value: string) {
    const rect = this.real_input.getBoundingClientRect();
    const value = highlight_value;
    this.autocompleteContainer.style.display = 'block';
    this.autocompleteContainer.style.top = `${this.real_input.offsetTop + rect.height + 3}px`;
    this.autocompleteContainer.style.left = `${this.real_input.offsetLeft}px`;
    this.autocompleteContainer.innerHTML = '';
    autocomplete_items.map((item: any) => {
        let label: string;
        if (typeof item == 'string') {
          label = item;
        } else {
          label = item.label;
        }
        const start_index: number = label.toLowerCase().indexOf(value.toLowerCase());
        const prefix = label.substring(0, start_index);
        const match = label.slice(start_index, start_index + value.length);
        const postfix = label.slice(start_index + value.length);
        const div = document.createElement('DIV');
        div.addEventListener('focus', (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
        });
        div.style.backgroundColor = 'var(--chip-input-autocomplete-background-color, white)';
        div.style.borderBottom = '1px solid lightgrey';
        div.style.padding = '3px';
        div.style.cursor = 'pointer';
        if (this.autocomplete_highlight) {
          div.innerHTML = `${prefix}<span style='font-weight: bold'>${match}</span>${postfix}`;
        } else {
          div.innerHTML = label;
        }
        div.dataset.value = label;
        div.onmouseover = () => div.style.backgroundColor = 'var(--chip-input-autocomplete-hover-background-color, lightblue)';
        div.onmouseout = () => div.style.backgroundColor = 'var(--chip-input-autocomplete-background-color, white)';
        div.onclick = () => void this.handleAutoCompleteItemSelected(div);
        this.autocompleteContainer.appendChild(div);
      },
    );
    let autocomplete_dismiss_target = this.autocompleteContainer;
    let element: HTMLDivElement;
    if (this.autocomplete_dismiss_target) {
      if (typeof this.autocomplete_dismiss_target == 'string') {
        element = this.autocompleteContainer.querySelector(this.autocomplete_dismiss_target);
      } else {
        element = this.autocomplete_dismiss_target;
      }
    }
    if (element) {
      autocomplete_dismiss_target = element;
    }
    autocomplete_dismiss_target.addEventListener('click', this.boundClickHandler);
  }

  private async createChip(value: string) {
    if (!value) {
      value = this.real_input.value;
    }
    if (!!this.constrain_input && !await this.containsFn(this.real_input.value)) {
      return;
    }
    if (value.trim() !== '') {
      this.innerChips = [...this.innerChips?? [], value.trim()];
      this.change_handler_enabled = false;
      this.real_input.value = '';
      this.change_handler_enabled = true;
      this.chipCreate.emit(value.trim());
      this.chipChange.emit(this.innerChips);
    }
    if (this.show_autocomplete_on_focus && this.autocomplete) {
      this.updateCaretPosition();
      await this.handleInput();
    } else if (this.autocomplete) {
      this.closeAutoComplete(false);
    }
  }

  render() {
    return <Host>
      <div
        class="chip-input-autocomplete-container"
        onFocus={this.handleAutocompleteContainerFocus.bind(this)}
        ref={e => this.autocompleteContainer = e}></div>
      <div
        class={{'wrapper': true, 'disabled': this.disabled}}>
        {
          GTSLib.isArray(this.innerChips)
          ? this.innerChips.map(chip => <discovery-input-chips-chip
            onClick={event => this.handleChipClick(event, chip)}
            disabled={this.disabled}
            label={chip}
            onRemoveChip={this.handleChipClose.bind(this)}></discovery-input-chips-chip>)
            : ''
        }
        <div class="caret_position_tracker" ref={el => this.caret_position_tracker = el}></div>
        <input class="real_input" type="text"
               ref={e => {
                 this.real_input = e;
                 e.addEventListener('beforeinput', this.handleBeforeInput.bind(this));
               }}
               onInput={this.handleInput.bind(this)}
               disabled={this.disabled}
               onChange={this.handleChange.bind(this)}
               onKeyDown={this.handleKeydown.bind(this)}
               onKeyUp={this.updateCaretPosition.bind(this)}
               onClick={this.updateCaretPosition.bind(this)}
               onFocus={this.handleFocus.bind(this)} />
      </div>
    </Host>;
  }
}
