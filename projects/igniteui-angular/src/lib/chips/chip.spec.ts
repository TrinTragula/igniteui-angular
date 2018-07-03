import { Component, ViewChild, ViewChildren, QueryList } from '@angular/core';
import {
    async,
    TestBed
} from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { IgxIconModule } from '../icon/index';
import { IgxChipsModule } from './chips.module';
import { IgxChipComponent } from './chip.component';
import { IgxChipsAreaComponent } from './chips-area.component';
import { IgxPrefixDirective } from './../directives/prefix/prefix.directive';
import { IgxConnectorDirective } from './connector.directive';
import { IgxLabelDirective } from './../directives/label/label.directive';
import { IgxSuffixDirective } from './../directives/suffix/suffix.directive';
import { DisplayDensity } from 'dist/igniteui-angular/lib/core/utils';
import { TestChipReorderComponent } from './chips-area.spec';

@Component({
    template: `
        <igx-chips-area #chipsArea>
            <igx-chip #chipElem *ngFor="let chip of chipList"
            [id]="chip.id" [draggable]="chip.draggable" [removable]="chip.removable" [selectable]="chip.selectable"
            [displayDensity]="chip.density">
                <span #label [class]="'igx-chip__text'">{{chip.text}}</span>
                <igx-icon class="igx-chip__dir-icon" igxConnector fontSet="material" [name]="'forward'"></igx-icon>
                <igx-icon igxPrefix fontSet="material" [name]="'drag_indicator'"></igx-icon>
            </igx-chip>
        </igx-chips-area>
    `
})
class TestChipComponent {

    public chipList = [
        { id: 'Country', text: 'Country', removable: false, selectable: false, draggable: true },
        { id: 'City', text: 'City', removable: true, selectable: true, draggable: true, density: 'comfortable' },
        { id: 'Town', text: 'Town', removable: true, selectable: true, draggable: true, density: 'compact' },
        { id: 'FirstName', text: 'First Name', removable: true , selectable: true, draggable: true, density: 'cosy' },
    ];

    @ViewChild('chipsArea', { read: IgxChipsAreaComponent})
    public chipsArea: IgxChipsAreaComponent;

    @ViewChildren('chipElem', { read: IgxChipComponent})
    public chips: QueryList<IgxChipComponent>;
}

@Component({
    template: `
        <igx-chips-area>
            <igx-chip *ngFor="let chip of chipList">
                <span igxLabel>label</span>
                <span igxSuffix>suf</span>
            </igx-chip>
        </igx-chips-area>
    `
})
class TestChipsLabelAndSuffixComponent {

    public chipList = [
        { id: 'Country', text: 'Country', removable: false, selectable: false, draggable: true },
        { id: 'City', text: 'City', removable: true, selectable: true, draggable: true },
        { id: 'Town', text: 'Town', removable: true, selectable: true, draggable: true },
        { id: 'FirstName', text: 'First Name', removable: true , selectable: true, draggable: true},
    ];

    @ViewChild('chipsArea', { read: IgxChipsAreaComponent})
    public chipsArea: IgxChipsAreaComponent;

    @ViewChildren('chipElem', { read: IgxChipComponent})
    public chips: QueryList<IgxChipComponent>;
}

fdescribe('IgxChip', () => {
    const CHIP_ITEM_AREA = 'igx-chip__item chip-area';
    const CHIP_CONNECTOR = 'igx-chip__connector';

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                TestChipComponent,
                TestChipsLabelAndSuffixComponent,
                TestChipReorderComponent,
                IgxPrefixDirective,
                IgxSuffixDirective,
                IgxLabelDirective
            ],
            imports: [FormsModule, IgxIconModule, IgxChipsModule]
        }).compileComponents();
    }));

    it('should render chip area and chips inside it', () => {
        const fix = TestBed.createComponent(TestChipComponent);
        fix.detectChanges();

        const chipArea = fix.debugElement.queryAll(By.directive(IgxChipsAreaComponent));
        expect(chipArea.length).toEqual(1);
        expect(chipArea[0].nativeElement.children.length).toEqual(4);
        expect(chipArea[0].nativeElement.children[0].tagName).toEqual('IGX-CHIP');
    });

    it('should render prefix element inside the chip before the content', () => {
        const fix = TestBed.createComponent(TestChipComponent);
        fix.detectChanges();

        const chipElems = fix.debugElement.queryAll(By.directive(IgxChipComponent));

        // For this first chip there are 2 elements. The prefix and content span.
        expect(chipElems[0].nativeElement.children[0].children.length).toEqual(2);
        expect(chipElems[0].nativeElement.children[0].children[0].tagName).toEqual('IGX-ICON');
        expect(chipElems[0].nativeElement.children[0].children[0].hasAttribute('igxprefix')).toEqual(true);
    });

    it('should render remove button when enabled after the content inside the chip', () => {
        const fix = TestBed.createComponent(TestChipComponent);
        fix.detectChanges();

        const chipElems = fix.debugElement.queryAll(By.directive(IgxChipComponent));

        // For this second chip there are 3 elements. The prefix, content span and the remove button icon with igxButton directive.
        expect(chipElems[1].nativeElement.children[0].children.length).toEqual(3);
        expect(chipElems[1].nativeElement.children[0].children[2].tagName).toEqual('IGX-ICON');
        expect(chipElems[1].nativeElement.children[0].children[2].hasAttribute('igxbutton')).toEqual(true);
    });

    it('should render connector after each chip except the last one', () => {
        const fix = TestBed.createComponent(TestChipComponent);
        fix.detectChanges();

        const chipAreaElem = fix.debugElement.queryAll(By.directive(IgxChipsAreaComponent));
        const connectors = chipAreaElem[0].queryAll(By.directive(IgxConnectorDirective));

        expect(connectors.length).toEqual(3);

        // The last 4th chip shouldn't have a connector.
        const lastChipComponent = chipAreaElem[0].queryAll(By.directive(IgxChipComponent))[3];
        const lastChipConnectors = lastChipComponent.queryAll(By.directive(IgxConnectorDirective));

        expect(lastChipConnectors.length).toEqual(0);
    });

    it('should not trigger onRemove event when a chip is focused and delete button is pressed when not removable', () => {
        const fix = TestBed.createComponent(TestChipComponent);
        fix.detectChanges();

        const firstChipComp = fix.componentInstance.chips.toArray()[0];
        spyOn(firstChipComp.onRemove, 'emit');
        firstChipComp.chipArea.nativeElement.focus();

        const focusedElems = firstChipComp.elementRef.nativeElement.querySelectorAll(':focus');
        expect(focusedElems.length).toEqual(1);
        expect(focusedElems[0].className).toEqual(CHIP_ITEM_AREA);

        const keyEvent = new KeyboardEvent('keydown', {
            'key': 'Delete'
        });
        firstChipComp.chipArea.nativeElement.dispatchEvent(keyEvent);
        fix.detectChanges();

        expect(firstChipComp.onRemove.emit).not.toHaveBeenCalled();
    });

    it('should trigger onRemove event when a chip is focused and delete button is pressed when removable', () => {
        const fix = TestBed.createComponent(TestChipComponent);
        fix.detectChanges();

        const secondChipComp = fix.componentInstance.chips.toArray()[1];
        spyOn(secondChipComp.onRemove, 'emit');
        secondChipComp.chipArea.nativeElement.focus();

        const focusedElems = secondChipComp.elementRef.nativeElement.querySelectorAll(':focus');
        expect(focusedElems.length).toEqual(1);
        expect(focusedElems[0].className).toEqual(CHIP_ITEM_AREA);

        const keyEvent = new KeyboardEvent('keydown', {
            'key': 'Delete'
        });
        secondChipComp.chipArea.nativeElement.dispatchEvent(keyEvent);
        fix.detectChanges();

        expect(secondChipComp.onRemove.emit).toHaveBeenCalled();
    });

    it('should set text in chips correctly', () => {
        const fix = TestBed.createComponent(TestChipComponent);
        fix.detectChanges();

        const chipArea = fix.debugElement.queryAll(By.directive(IgxChipsAreaComponent));
        const chipElements = chipArea[0].queryAll(By.directive(IgxChipComponent));
        const firstChipTextElement = chipElements[0].queryAllNodes(By.css('.igx-chip__text'));
        const firstChipText = firstChipTextElement[0].nativeNode.innerHTML;

        expect(firstChipText).toContain('Country');

        const secondChipTextElement = chipElements[1].queryAllNodes(By.css('.igx-chip__text'));
        const secondChipText = secondChipTextElement[0].nativeNode.innerHTML;

        expect(secondChipText).toContain('City');
    });

    it('should set chips label correctly', () => {
        const fix = TestBed.createComponent(TestChipsLabelAndSuffixComponent);
        fix.detectChanges();

        const chipArea = fix.debugElement.queryAll(By.directive(IgxChipsAreaComponent));
        const chipElements = chipArea[0].queryAll(By.directive(IgxChipComponent));
        const firstChipLabel = chipElements[0].queryAll(By.directive(IgxLabelDirective));
        const firstChipLabelText = firstChipLabel[0].nativeElement.innerHTML;

        expect(firstChipLabelText).toEqual('label');
    });

    it('should set chips prefix correctly', () => {
        const fix = TestBed.createComponent(TestChipComponent);
        fix.detectChanges();

        const chipArea = fix.debugElement.queryAll(By.directive(IgxChipsAreaComponent));
        const chipElements = chipArea[0].queryAll(By.directive(IgxChipComponent));
        const firstChipPrefix = chipElements[0].queryAll(By.directive(IgxPrefixDirective));
        const firstChipIconName = firstChipPrefix[0].nativeElement.textContent;

        expect(firstChipIconName).toContain('drag_indicator');
    });

    it('should set chips suffix correctly', () => {
        const fix = TestBed.createComponent(TestChipsLabelAndSuffixComponent);
        fix.detectChanges();

        const chipArea = fix.debugElement.queryAll(By.directive(IgxChipsAreaComponent));
        const chipElements = chipArea[0].queryAll(By.directive(IgxChipComponent));
        const firstChipSuffix = chipElements[0].queryAll(By.directive(IgxSuffixDirective));
        const firstChipSuffixText = firstChipSuffix[0].nativeElement.innerHTML;

        expect(firstChipSuffixText).toEqual('suf');
    });

    it('should set chips suffix connector correctly', () => {
        const fix = TestBed.createComponent(TestChipComponent);
        fix.detectChanges();

        const chipArea = fix.debugElement.queryAll(By.directive(IgxChipsAreaComponent));
        const chipElements = chipArea[0].queryAll(By.directive(IgxChipComponent));
        const firstChipSuffixConnector = chipElements[0].queryAll(By.directive(IgxConnectorDirective));
        const firstChipSuffixConnectorIconName = firstChipSuffixConnector[0].nativeElement.textContent;

        expect(firstChipSuffixConnectorIconName).toContain('forward');
    });

    it('should make chip comfortable when density is not set', () => {
        const fix = TestBed.createComponent(TestChipComponent);
        fix.detectChanges();

        const components = fix.debugElement.queryAll(By.directive(IgxChipComponent));
        const firstComponent = components[0];

        expect(firstComponent.componentInstance.displayDensity).toEqual(DisplayDensity.comfortable);
    });

    it('should make chip comfortable when density is set to comfortable', () => {
        const fix = TestBed.createComponent(TestChipComponent);
        fix.detectChanges();

        const components = fix.debugElement.queryAll(By.directive(IgxChipComponent));
        const secondComponent = components[1];

        expect(secondComponent.componentInstance.displayDensity).toEqual(DisplayDensity.comfortable);
    });

    it('should make chip compact when density is set to compat', () => {
        const fix = TestBed.createComponent(TestChipComponent);
        fix.detectChanges();

        const components = fix.debugElement.queryAll(By.directive(IgxChipComponent));
        const thirdComponent = components[2];

        expect(thirdComponent.componentInstance.displayDensity).toEqual(DisplayDensity.compact);
    });

    it('should make chip cosy when density is set to cosy', () => {
        const fix = TestBed.createComponent(TestChipComponent);
        fix.detectChanges();

        const components = fix.debugElement.queryAll(By.directive(IgxChipComponent));
        const fourthComponent = components[3];

        expect(fourthComponent.componentInstance.displayDensity).toEqual(DisplayDensity.cosy);
    });

    it('should set correctly color of chip when color is set through code', () => {
        const fix = TestBed.createComponent(TestChipComponent);
        fix.detectChanges();
        const chipColor = 'rgb(255, 0, 0)';

        const components = fix.debugElement.queryAll(By.directive(IgxChipComponent));
        const firstComponent = components[0];
        const chipAreaElem = firstComponent.queryAll(By.css('.igx-chip__item'))[0];

        firstComponent.componentInstance.color = chipColor;

        expect(chipAreaElem.nativeElement.style.backgroundColor).toEqual(chipColor);
        expect(firstComponent.componentInstance.color).toEqual(chipColor);
    });

    it('should delete chip when space button is pressed and chip delete button is focussed', () => {
        const spaceKeyEvent = new KeyboardEvent('keydown', {
            'key': ' '
        });

        const fix = TestBed.createComponent(TestChipReorderComponent);
        fix.detectChanges();

        fix.whenStable().then(() => {
            let chipComponents = fix.debugElement.queryAll(By.directive(IgxChipComponent));

            expect(chipComponents.length).toEqual(4);

            const deleteButtonElement = fix.debugElement.queryAll(By.css('#igx-icon-8'))[0];
            deleteButtonElement.nativeElement.focus();

            deleteButtonElement.nativeElement.dispatchEvent(spaceKeyEvent);
            fix.detectChanges();

            chipComponents = fix.debugElement.queryAll(By.directive(IgxChipComponent));
            expect(chipComponents.length).toEqual(3);
        });
    });

    it('should delete chip when enter button is pressed and chip delete button is focussed', () => {
        const enterKeyEvent = new KeyboardEvent('keydown', {
            'key': 'Enter'
        });

        const fix = TestBed.createComponent(TestChipReorderComponent);
        fix.detectChanges();

        fix.whenStable().then(() => {
            let chipComponents = fix.debugElement.queryAll(By.directive(IgxChipComponent));

            expect(chipComponents.length).toEqual(4);

            const deleteButtonElement = fix.debugElement.queryAll(By.css('#igx-icon-8'))[0];
            deleteButtonElement.nativeElement.focus();

            deleteButtonElement.nativeElement.dispatchEvent(enterKeyEvent);
            fix.detectChanges();

            chipComponents = fix.debugElement.queryAll(By.directive(IgxChipComponent));
            expect(chipComponents.length).toEqual(3);
        });
    });
});
