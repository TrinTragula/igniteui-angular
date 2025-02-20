import { Component, ViewChild } from '@angular/core';
import { IgxExcelStyleDefaultExpressionComponent } from './excel-style-default-expression.component';
import { IgxInputDirective } from '../../../directives/input/input.directive';
import { IgxDatePickerComponent } from '../../../date-picker/public_api';
import { IgxTimePickerComponent } from '../../../time-picker/time-picker.component';
import { getLocaleFirstDayOfWeek } from "@angular/common";

/**
 * @hidden
 */
@Component({
    selector: 'igx-excel-style-date-expression',
    templateUrl: './excel-style-date-expression.component.html'
})
export class IgxExcelStyleDateExpressionComponent extends IgxExcelStyleDefaultExpressionComponent {
    @ViewChild('input', { read: IgxInputDirective, static: false })
    private input: IgxInputDirective;

    @ViewChild('picker')
    private picker: IgxDatePickerComponent | IgxTimePickerComponent;

    protected override get inputValuesElement() {
        return this.picker?.getEditElement() || this.input?.nativeElement;
    }

    public get inputDatePlaceholder(): string {
        return this.grid.resourceStrings['igx_grid_filter_row_date_placeholder'];
    }

    public get inputTimePlaceholder(): string {
        return this.grid.resourceStrings['igx_grid_filter_row_time_placeholder'];
    }

    public get weekStart(): number {
        return getLocaleFirstDayOfWeek(this.grid.locale);
    }
}
