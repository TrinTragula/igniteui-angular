import {
    Component,
    HostBinding
} from '@angular/core';
import { IgxDropDownItemBaseDirective } from './drop-down-item.base';

/**
 * The `<igx-drop-down-item>` is a container intended for row items in
 * a `<igx-drop-down>` container.
 */
@Component({
    selector: 'igx-drop-down-item',
    templateUrl: 'drop-down-item.component.html'
})
export class IgxDropDownItemComponent extends IgxDropDownItemBaseDirective {
    /**
     * Sets/gets if the given item is focused
     * ```typescript
     *  let mySelectedItem = this.dropdown.selectedItem;
     *  let isMyItemFocused = mySelectedItem.focused;
     * ```
     */
    public override get focused(): boolean {
        let focusedState = this._focused;
        if (this.hasIndex) {
            const focusedItem = this.selection.first_item(`${this.dropDown.id}-active`);
            const focusedIndex = focusedItem ? focusedItem.index : -1;
            focusedState = this._index === focusedIndex;
        }
        return this.isSelectable && focusedState;
    }

    /**
     * Sets/gets if the given item is focused
     * ```typescript
     *  let mySelectedItem = this.dropdown.selectedItem;
     *  let isMyItemFocused = mySelectedItem.focused;
     * ```
     */
    public override set focused(value: boolean) {
        this._focused = value;
    }
    /**
     * Sets/Gets if the item is the currently selected one in the dropdown
     *
     * ```typescript
     *  let mySelectedItem = this.dropdown.selectedItem;
     *  let isMyItemSelected = mySelectedItem.selected; // true
     * ```
     *
     * Two-way data binding
     * ```html
     * <igx-drop-down-item [(selected)]='model.isSelected'></igx-drop-down-item>
     * ```
     */
    public override get selected(): boolean {
        if (this.hasIndex) {
            const item = this.selection.first_item(`${this.dropDown.id}`);
            return item ? item.index === this._index && item.value === this.value : false;
        }
        return this._selected;
    }

    /**
     * Sets/Gets if the item is the currently selected one in the dropdown
     *
     */
    public override set selected(value: boolean) {
        if (this.isHeader) {
            return;
        }
        this._selected = value;
        this.selectedChange.emit(this._selected);
    }
    /**
     * @hidden @internal
     */
    @HostBinding('attr.tabindex')
    public get setTabIndex() {
        const shouldSetTabIndex = this.dropDown.allowItemsFocus && this.isSelectable;
        if (shouldSetTabIndex) {
            return 0;
        } else {
            return null;
        }
    }

    public override clicked(event): void {
        if (!this.isSelectable) {
            this.ensureItemFocus();
            return;
        }
        if (this.selection) {
            this.dropDown.selectItem(this, event);
        }
    }
}
