import {
    AfterContentInit,
    ChangeDetectionStrategy,
    Component,
    forwardRef,
    HostBinding,
    Input,
    OnInit,
    TemplateRef,
    ViewChild
} from '@angular/core';
import { IgxGridBaseDirective } from '../grid-base.directive';
import { GridBaseAPIService } from '../api.service';
import { IgxFilteringService } from '../filtering/grid-filtering.service';
import { IgxGridSelectionService } from '../selection/selection.service';
import { IgxForOfSyncService, IgxForOfScrollSyncService } from '../../directives/for-of/for_of.sync.service';
import { GridType } from '../common/grid.interface';
import { IgxGridNavigationService } from '../grid-navigation.service';
import { IgxGridCRUDService } from '../common/crud.service';
import { IgxGridSummaryService } from '../summaries/grid-summary.service';
import { IPivotConfiguration, PivotDimensionType } from './pivot-grid.interface';
import { IgxPivotHeaderRowComponent } from './pivot-header-row.component';
import { IgxColumnGroupComponent } from '../columns/column-group.component';
import { IgxColumnComponent } from '../columns/column.component';
import { PivotUtil } from './pivot-util';
import { GridPagingMode, GridSummaryCalculationMode, GridSummaryPosition } from '../common/enums';
import { WatchChanges } from '../watch-changes';
import { OverlaySettings, State, Transaction, TransactionService } from '../../services/public_api';
import { IColumnVisibilityChangedEventArgs } from '../common/events';
import { IgxGridRowComponent } from '../grid/grid-row.component';
import { DropPosition } from '../moving/moving.service';
import { RowType } from '../common/row.interface';

let NEXT_ID = 0;
const MINIMUM_COLUMN_WIDTH = 200;
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    preserveWhitespaces: false,
    selector: 'igx-pivot-grid',
    templateUrl: 'pivot-grid.component.html',
    providers: [
        IgxGridCRUDService,
        IgxGridSummaryService,
        IgxGridSelectionService,
        GridBaseAPIService,
        { provide: IgxGridBaseDirective, useExisting: forwardRef(() => IgxPivotGridComponent) },
        IgxFilteringService,
        IgxGridNavigationService,
        IgxForOfSyncService,
        IgxForOfScrollSyncService
    ]
})
export class IgxPivotGridComponent extends IgxGridBaseDirective implements OnInit, AfterContentInit,
    GridType {

    /** @hidden @internal */
    @ViewChild(IgxPivotHeaderRowComponent, { static: true })
    public theadRow: IgxPivotHeaderRowComponent;

    @Input()
    /**
     * Gets/Sets the pivot configuration with all related dimensions and values.
     *
     * @example
     * ```html
     * <igx-pivot-grid [pivotConfiguration]="config"></igx-pivot-grid>
     * ```
     */
    public pivotConfiguration: IPivotConfiguration = { rows: null, columns: null, values: null, filters: null };

    /**
     * @hidden @internal
     */
    @HostBinding('attr.role')
    public role = 'grid';

    /**
     * @hidden @internal
     */
    @ViewChild('record_template', { read: TemplateRef, static: true })
    public recordTemplate: TemplateRef<any>;

    /**
     * @hidden @internal
     */
    @ViewChild('headerTemplate', { read: TemplateRef, static: true })
    public headerTemplate: TemplateRef<any>;


    public columnGroupStates = new Map<string, boolean>();
    public isPivot = true;
    protected _defaultExpandState = true;
    private _data;
    private _filteredData;
    private p_id = `igx-pivot-grid-${NEXT_ID++}`;

    /**
     * @hidden @internal
     */
    @Input()
    public get pagingMode() {
        return;
    }

    public set pagingMode(val: GridPagingMode) {
    }

    /**
     * @hidden @internal
     */
    @WatchChanges()
    @Input()
    public get rowEditable(): boolean {
        return;
    }

    public set rowEditable(val: boolean) {
    }

    /**
     * @hidden @internal
     */
    @Input()
    public get pinning() {
        return null;
    }
    public set pinning(value) {
    }

    /**
     * @hidden @internal
     */
    @Input()
    public get summaryPosition() {
        return;
    }

    public set summaryPosition(value: GridSummaryPosition) {
    }

    /**
        * @hidden @interal
        */
    @Input()
    public get summaryCalculationMode() {
        return;
    }

    public set summaryCalculationMode(value: GridSummaryCalculationMode) {
    }

    /**
     * @hidden @interal
     */
    @Input()
    public get showSummaryOnCollapse() {
        return;
    }

    public set showSummaryOnCollapse(value: boolean) {
    }

    /**
     * @hidden @internal
     */
    public get hiddenColumnsCount() {
        return null;
    }

    /**
     * @hidden @internal
     */
    public get pinnedColumnsCount() {
        return null;
    }

    /**
     * @hidden @internal
     */
    @Input()
    public get batchEditing(): boolean {
        return;
    }

    public set batchEditing(val: boolean) {
    }

    /**
     * @hidden @internal
     */
    public get transactions(): TransactionService<Transaction, State> {
        return null;
    }

    /**
     * @hidden
     */
    public ngOnInit() {
        // pivot grid always generates columns automatically.
        this.autoGenerate = true;
        super.ngOnInit();
    }

    /**
     * @hidden
     */
    public ngAfterContentInit() {
        // ignore any user defined columns and auto-generate based on pivot config.
        this.columnList.reset([]);
        Promise.resolve().then(() => {
            this.setupColumns();
        });
    }

    /** @hidden */
    public featureColumnsWidth() {
        return this.pivotRowWidths;
    }

    /**
     * Gets/Sets the value of the `id` attribute.
     *
     * @remarks
     * If not provided it will be automatically generated.
     * @example
     * ```html
     * <igx-pivot-grid [id]="'igx-pivot-1'" [data]="Data"></igx-pivot-grid>
     * ```
     */
    @HostBinding('attr.id')
    @Input()
    public get id(): string {
        return this.p_id;
    }
    public set id(value: string) {
        this.p_id = value;
    }

    /**
     * An @Input property that lets you fill the `IgxPivotGridComponent` with an array of data.
     * ```html
     * <igx-pivot-grid [data]="Data"></igx-pivot-grid>
     * ```
     */
    @Input()
    public set data(value: any[] | null) {
        this._data = value || [];
        if (this.shouldGenerate) {
            this.setupColumns();
            this.reflow();
        }
        this.cdr.markForCheck();
        if (this.height === null || this.height.indexOf('%') !== -1) {
            // If the height will change based on how much data there is, recalculate sizes in igxForOf.
            this.notifyChanges(true);
        }
    }

    /**
     * Returns an array of data set to the component.
     * ```typescript
     * let data = this.grid.data;
     * ```
     */
    public get data(): any[] | null {
        return this._data;
    }
    /**
     * Sets an array of objects containing the filtered data.
     * ```typescript
     * this.grid.filteredData = [{
     *       ID: 1,
     *       Name: "A"
     * }];
     * ```
     */
    public set filteredData(value) {
        this._filteredData = value;
    }

    /**
     * Returns an array of objects containing the filtered data.
     * ```typescript
     * let filteredData = this.grid.filteredData;
     * ```
     *
     * @memberof IgxHierarchicalGridComponent
     */
    public get filteredData() {
        return this._filteredData;
    }


    /**
     * @hidden
     */
    public getContext(rowData, rowIndex): any {
        return {
            $implicit: rowData,
            templateID: {
                type: 'dataRow',
                id: null
            },
            index: this.getDataViewIndex(rowIndex, false)
        };
    }

    public get pivotRowWidths() {
        const rowDimCount = this.pivotConfiguration.rows.length;
        return MINIMUM_COLUMN_WIDTH * rowDimCount;
    }

    public toggleColumn(col: IgxColumnComponent) {
        const state = this.columnGroupStates.get(col.field);
        const newState = !state;
        this.columnGroupStates.set(col.field, newState);
        this.toggleGroup(col, newState);
        this.reflow();
    }

    /**
     * @hidden @internal
     */
    public isRecordPinnedByIndex(rowIndex: number) {
        return null;
    }

    /**
    * @hidden @internal
    */
    public toggleColumnVisibility(args: IColumnVisibilityChangedEventArgs) {
        return;
    }

    /**
     * @hidden @internal
     */
    @Input()
    public get expansionStates() {
        return null;
    }

    public set expansionStates(value) {
    }

    /**
     * @hidden @internal
     */
    public expandAll() {
    }

    /**
     * @hidden @internal
     */
    public collapseAll() {
    }

    /**
     * @hidden @internal
     */
    public expandRow(rowID: any) {
    }

    /**
     * @hidden @internal
     */
    public collapseRow(rowID: any) {
    }

    /**
     * @hidden @interal
     */
    public toggleRow(rowID: any) {
    }

    /**
     * Gets the current width of the container for the pinned `IgxColumnComponent`s.
     *
     * @example
     * ```typescript
     * const pinnedWidth = this.grid.getPinnedWidth;
     * ```
     */
    public get pinnedWidth() {
        return null;
    }

    /**
     * @hidden @internal
     */
    public get unpinnedWidth() {
        return null;
    }

    /**
     * @hidden @internal
     */
    public get pinnedColumns(): IgxColumnComponent[] {
        return;
    }

    /**
     * @hidden @internal
     */
    public get pinnedRows(): IgxGridRowComponent[] {
        return;
    }

    /**
     * @hidden @internal
     */
    public get unpinnedColumns(): IgxColumnComponent[] {
        return;
    }

    /**
     * @hidden @internal
     */
    public getColumnByVisibleIndex(index: number): IgxColumnComponent {
        return;
    }

    /**
    * @hidden @internal
    */
    public get visibleColumns(): IgxColumnComponent[] {
        return;
    }

    /**
     * @hidden @internal
     */
    @Input()
    public get totalRecords(): number {
        return;
    }

    public set totalRecords(total: number) {
    }

    /**
    * @hidden @internal
    */
    public moveColumn(column: IgxColumnComponent, target: IgxColumnComponent, pos: DropPosition = DropPosition.AfterDropTarget) {
    }

    /**
     * @hidden @internal
     */
    public addRow(data: any): void {
    }

    /**
     * @hidden @internal
     */
    public deleteRow(rowSelector: any): any {
    }

    /**
     * @hidden @internal
     */
    public updateCell(value: any, rowSelector: any, column: string): void {
    }

    /**
    * @hidden @internal
    */
    public updateRow(value: any, rowSelector: any): void {
    }

    /**
     * @hidden @internal
     */
    public enableSummaries(...rest) {
    }

    /**
    * @hidden @internal
    */
    public disableSummaries(...rest) {
    }

    /**
     * @hidden @internal
     */
    public pinColumn(columnName: string | IgxColumnComponent, index?): boolean {
        return;
    }

    /**
     * @hidden @internal
     */
    public unpinColumn(columnName: string | IgxColumnComponent, index?): boolean {
        return;
    }

    /**
    * @hidden @internal
    */
    public pinRow(rowID: any, index?: number, row?: RowType): boolean {
        return;
    }

    /**
     * @hidden @internal
     */
    public unpinRow(rowID: any, row?: RowType): boolean {
        return;
    }

    /**
     * @hidden @internal
     */
    public get pinnedRowHeight() {
        return;
    }

    /**
     * @hidden @internal
     */
    public get hasEditableColumns(): boolean {
        return;
    }

    /**
     * @hidden @internal
     */
    public get hasSummarizedColumns(): boolean {
        return;
    }

    /**
     * @hidden @internal
     */
    public get hasMovableColumns(): boolean {
        return;
    }

    /**
     * @hidden @internal
     */
    public getPinnedWidth(takeHidden = false) {
        return null;
    }

    /**
     * @hidden @internal
     */
    public get pinnedDataView(): any[] {
        return;
    }

    /**
     * @hidden @internal
     */
    public openAdvancedFilteringDialog(overlaySettings?: OverlaySettings) {
    }

    /**
     * @hidden @internal
     */
    public closeAdvancedFilteringDialog(applyChanges: boolean) {
    }

    /**
     * @hidden @internal
     */
    public endEdit(commit = true, event?: Event) {
    }

    /**
     * @hidden @internal
     */
    public beginAddRowById(rowID: any, asChild?: boolean): void {
    }

    /**
     * @hidden @internal
     */
    public beginAddRowByIndex(index: number): void {
    }

    protected toggleGroup(col: IgxColumnComponent, newState: boolean) {
        if (this.hasMultipleValues) {
            const fieldColumns = col.children.filter(x => !x.columnGroup);
            const groupColumns = col.children.filter(x => x.columnGroup);
            groupColumns.forEach(groupColumn => {
                groupColumn.hidden = newState;
                this.resolveToggle(groupColumn);
            });
            fieldColumns.forEach(fieldColumn => {
                fieldColumn.hidden = !newState;
            });
        } else {
            const parentCols = col.parent ? col.parent.children : this.columns.filter(x => x.level === 0);
            const fieldColumn = parentCols.filter(x => x.header === col.header && !x.columnGroup)[0];
            const groupColumn = parentCols.filter(x => x.header === col.header && x.columnGroup)[0];
            groupColumn.hidden = newState;
            this.resolveToggle(groupColumn);
            fieldColumn.hidden = !newState;
            if (newState) {
                fieldColumn.headerTemplate = this.headerTemplate;
            } else {
                fieldColumn.headerTemplate = undefined;
            }
        }
    }

    protected resolveToggle(groupColumn: IgxColumnComponent) {
        const hasChildGroup = groupColumn.children.filter(x => x.columnGroup).length > 0;
        if (!groupColumn.hidden && hasChildGroup) {
            const fieldChildren = groupColumn.children.filter(x => !x.columnGroup);
            const groupChildren = groupColumn.children.filter(x => x.columnGroup);
            groupChildren.forEach(group => {
                this.resolveToggle(group);
            });
            fieldChildren.forEach(fieldChild => {
                fieldChild.hidden = true;
            });
        }
    }

    /**
     * @hidden
     * @internal
     */
    protected calcGridHeadRow() {
    }

    protected get hasMultipleValues() {
        return this.pivotConfiguration.values.length > 1;
    }

    /**
     * @hidden
     */
    protected autogenerateColumns() {
        const data = this.gridAPI.get_data();
        const fieldsMap = PivotUtil.getFieldsHierarchy(
            data,
            this.pivotConfiguration.columns,
            PivotDimensionType.Column,
            { aggregations: 'aggregations', records: 'records', children: 'children', level: 'level' }
        );
        const columns = this.generateColumnHierarchy(fieldsMap, data);
        this._autoGeneratedCols = columns;

        this.columnList.reset(columns);
        if (data && data.length > 0) {
            this.shouldGenerate = false;
        }
    }

    protected generateColumnHierarchy(fields: Map<string, any>, data, parent = null): IgxColumnComponent[] {
        const factoryColumn = this.resolver.resolveComponentFactory(IgxColumnComponent);
        const factoryColumnGroup = this.resolver.resolveComponentFactory(IgxColumnGroupComponent);
        let columns = [];
        fields.forEach((value, key) => {
            if (value.children == null || value.children.length === 0 || value.children.size === 0) {
                const ref = this.hasMultipleValues ?
                    factoryColumnGroup.create(this.viewRef.injector) :
                    factoryColumn.create(this.viewRef.injector);
                ref.instance.header = parent != null ? key.split(parent.header + '-')[1] : key;
                ref.instance.field = key;
                ref.instance.parent = parent;
                ref.changeDetectorRef.detectChanges();
                columns.push(ref.instance);
                if (this.hasMultipleValues) {
                    const measureChildren = this.getMeasureChildren(factoryColumn, data, ref.instance, false);
                    ref.instance.children.reset(measureChildren);
                    columns = columns.concat(measureChildren);
                }

            } else {
                const ref = factoryColumnGroup.create(this.viewRef.injector);
                ref.instance.parent = parent;
                ref.instance.field = key;
                ref.instance.header = parent != null ? key.split(parent.header + '-')[1] : key;
                if (value.expandable) {
                    ref.instance.headerTemplate = this.headerTemplate;
                }
                if (!this.hasMultipleValues) {
                    const refSibling = factoryColumn.create(this.viewRef.injector);
                    refSibling.instance.header = parent != null ? key.split(parent.header + '-')[1] : key;
                    refSibling.instance.field = key;
                    refSibling.instance.dataType = this.resolveDataTypes(data[0][key]);
                    refSibling.instance.parent = parent;
                    refSibling.instance.hidden = true;
                    columns.push(refSibling.instance);
                }
                const children = this.generateColumnHierarchy(value.children, data, ref.instance);
                const filteredChildren = children.filter(x => x.level === ref.instance.level + 1);
                ref.changeDetectorRef.detectChanges();
                columns.push(ref.instance);
                if (this.hasMultipleValues) {
                    const measureChildren = this.getMeasureChildren(factoryColumn, data, ref.instance, true);
                    const nestedChildren = filteredChildren.concat(measureChildren);
                    const allChildren = children.concat(measureChildren);
                    ref.instance.children.reset(nestedChildren);
                    columns = columns.concat(allChildren);
                } else {
                    ref.instance.children.reset(filteredChildren);
                    columns = columns.concat(children);
                }
            }
        });
        this.reflow();
        return columns;
    }

    protected getMeasureChildren(colFactory, data, parent, hidden) {
        const cols = [];
        this.pivotConfiguration.values.forEach(val => {
            const ref = colFactory.create(this.viewRef.injector);
            ref.instance.header = val.member;
            ref.instance.field = parent.field + '-' + val.member;
            ref.instance.parent = parent;
            ref.instance.hidden = hidden;
            ref.instance.dataType = val.dataType || this.resolveDataTypes(data[0][val.member]);
            ref.instance.formatter = val.formatter;
            ref.changeDetectorRef.detectChanges();
            cols.push(ref.instance);
        });
        return cols;
    }
}
