import { AfterContentChecked, AfterViewChecked, Component, ContentChildren, QueryList, ViewChild } from "@angular/core";
import { async, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { IgxTab, IgxTabBar, IgxTabBarModule, IgxTabPanel } from "./tabbar.component";

describe("TabBar", () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TabBarTestComponent, BottomTabBarTestComponent],
            imports: [IgxTabBarModule]
        })
            .compileComponents();
    }));

    it("should initialize igx-tab-bar, igx-tab-panel and igx-tab", () => {
        const fixture = TestBed.createComponent(TabBarTestComponent);
        const tabbar = fixture.componentInstance.tabbar;
        let panels: IgxTabPanel[];
        let tabs: IgxTab[];

        fixture.detectChanges();

        panels = tabbar.panels.toArray();
        tabs = tabbar.tabs.toArray();

        expect(tabbar).toBeDefined();
        expect(tabbar instanceof IgxTabBar).toBeTruthy();
        expect(tabbar.panels instanceof QueryList).toBeTruthy();
        expect(tabbar.panels.length).toBe(3);

        for (let i = 0; i < tabbar.panels.length; i++) {
            expect(panels[i] instanceof IgxTabPanel).toBeTruthy();
            expect(panels[i].relatedTab).toBe(tabs[i]);
        }

        expect(tabbar.tabs instanceof QueryList).toBeTruthy();
        expect(tabbar.tabs.length).toBe(3);

        for (let i = 0; i < tabbar.tabs.length; i++) {
            expect(tabs[i] instanceof IgxTab).toBeTruthy();
            expect(tabs[i].relatedPanel).toBe(panels[i]);
        }
    });

    it("should initialize default values of properties", () => {
        const fixture = TestBed.createComponent(TabBarTestComponent);
        const tabbar = fixture.componentInstance.tabbar;
        let tabs;

        expect(tabbar.selectedIndex).toBe(-1);
        expect(tabbar.selectedTab).toBeUndefined();

        fixture.componentInstance.tabSelectedHandler = () => {
            expect(tabbar.selectedIndex).toBe(0);
            expect(tabbar.selectedTab).toBe(tabs[0]);
        };

        fixture.detectChanges();

        tabs = tabbar.tabs.toArray();
        expect(tabs[0].isDisabled).toBeFalsy();
        expect(tabs[1].isDisabled).toBeFalsy();
    });

    it("should initialize set/get properties", () => {
        const fixture = TestBed.createComponent(TabBarTestComponent);
        const tabbar = fixture.componentInstance.tabbar;
        const icons = ["library_music", "video_library", "library_books"];
        let tabs;
        let panels;

        fixture.detectChanges();

        tabs = tabbar.tabs.toArray();
        panels = tabbar.panels.toArray();

        for (let i = 0; i < tabs.length; i++) {
            expect(panels[i].label).toBe("Tab " + (i + 1));
            expect(panels[i].icon).toBe(icons[i]);
        }
    });

    it("should select/deselect tabs", () => {
        const fixture = TestBed.createComponent(TabBarTestComponent);
        const tabbar = fixture.componentInstance.tabbar;
        let tabs;
        let tab1: IgxTab;
        let tab2: IgxTab;

        expect(tabbar.selectedIndex).toBe(-1);
        fixture.componentInstance.tabSelectedHandler = () => {
            expect(tabbar.selectedIndex).toBe(0);
            expect(tabbar.selectedTab).toBe(tab1);
        };

        fixture.detectChanges();
        tabs = tabbar.tabs.toArray();
        tab1 = tabs[0];
        tab2 = tabs[1];

        fixture.componentInstance.tabSelectedHandler = () => { };

        tab2.select();
        fixture.detectChanges();

        expect(tabbar.selectedIndex).toBe(1);
        expect(tabbar.selectedTab).toBe(tab2);
        expect(tabbar.selectedIndex).toBe(1);
        expect(tab2.isSelected).toBeTruthy();
        expect(tab1.isSelected).toBeFalsy();

        tab1.select();
        fixture.detectChanges();

        expect(tabbar.selectedIndex).toBe(0);
        expect(tabbar.selectedTab).toBe(tab1);
        expect(tab1.isSelected).toBeTruthy();
        expect(tab2.isSelected).toBeFalsy();

        // select disabled tab
        tab2.relatedPanel.isDisabled = true;
        tab2.select();
        fixture.detectChanges();

        expect(tabbar.selectedIndex).toBe(0);
        expect(tabbar.selectedTab).toBe(tab1);
        expect(tab1.isSelected).toBeTruthy();
        expect(tab2.isSelected).toBeFalsy();
    });
});

@Component({
    template: `
        <div #wrapperDiv>
            <igx-tab-bar (onTabSelected)="tabSelectedHandler($event)">
                <igx-tab-panel label="Tab 1" icon="library_music">
                    <h1>Tab 1 Content</h1>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                </igx-tab-panel>
                <igx-tab-panel label="Tab 2" icon="video_library">
                    <h1>Tab 2 Content</h1>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                </igx-tab-panel>
                <igx-tab-panel label="Tab 3" icon="library_books">
                    <h1>Tab 3 Content</h1>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Vivamus vitae malesuada odio. Praesent ante lectus, porta a eleifend vel, sodales eu nisl.
                        Vivamus sit amet purus eu lectus cursus rhoncus quis non ex.
                        Cras ac nulla sed arcu finibus volutpat.
                        Vivamus risus ipsum, pharetra a augue nec, euismod fringilla odio.
                        Integer id velit rutrum, accumsan ante a, semper nunc.
                        Phasellus ultrices tincidunt imperdiet. Nullam vulputate mauris diam.
                         Nullam elementum, libero vel varius fermentum, lorem ex bibendum nulla,
                         pretium lacinia erat nibh vel massa.
                        In hendrerit, sapien ac mollis iaculis, dolor tellus malesuada sem,
                        a accumsan lectus nisl facilisis leo.
                        Curabitur consequat sit amet nulla at consequat. Duis volutpat tristique luctus.
                    </p>
                </igx-tab-panel>
            </igx-tab-bar>
        </div>`
})
class TabBarTestComponent {
    @ViewChild(IgxTabBar) public tabbar: IgxTabBar;
    @ViewChild("wrapperDiv") public wrapperDiv: any;

    public tabSelectedHandler(args) {
    }
}

@Component({
    template: `
        <div #wrapperDiv>
            <igx-tab-bar alignment="bottom">
                <igx-tab-panel label="Tab 1" icon="library_music">
                    <h1>Tab 1 Content</h1>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                </igx-tab-panel>
                <igx-tab-panel label="Tab 2" icon="video_library">
                    <h1>Tab 2 Content</h1>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                </igx-tab-panel>
                <igx-tab-panel label="Tab 3" icon="library_books">
                    <h1>Tab 3 Content</h1>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Vivamus vitae malesuada odio. Praesent ante lectus, porta a eleifend vel, sodales eu nisl.
                        Vivamus sit amet purus eu lectus cursus rhoncus quis non ex.
                        Cras ac nulla sed arcu finibus volutpat.
                        Vivamus risus ipsum, pharetra a augue nec, euismod fringilla odio.
                        Integer id velit rutrum, accumsan ante a, semper nunc.
                        Phasellus ultrices tincidunt imperdiet. Nullam vulputate mauris diam.
                         Nullam elementum, libero vel varius fermentum, lorem ex bibendum nulla,
                         pretium lacinia erat nibh vel massa.
                        In hendrerit, sapien ac mollis iaculis, dolor tellus malesuada sem,
                        a accumsan lectus nisl facilisis leo.
                        Curabitur consequat sit amet nulla at consequat. Duis volutpat tristique luctus.
                    </p>
                </igx-tab-panel>
            </igx-tab-bar>
        </div>`
})
class BottomTabBarTestComponent {
    @ViewChild(IgxTabBar) public tabbar: IgxTabBar;
    @ViewChild("wrapperDiv") public wrapperDiv: any;
}
