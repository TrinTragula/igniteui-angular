﻿import {
    Directive,
    ElementRef,
    EventEmitter,
    HostBinding,
    HostListener,
    Input,
    NgModule,
    NgZone,
    OnDestroy,
    OnInit,
    Output,
    Renderer2,
    ChangeDetectorRef,
    ContentChild,
    ViewContainerRef,
    AfterContentInit
} from '@angular/core';
import { animationFrameScheduler, fromEvent, interval, Subject } from 'rxjs';
import { takeUntil, throttle } from 'rxjs/operators';
import { IgxDragGhostDirective } from './drag-ghost.directive';
import { IgxDragHandleDirective } from './drag-handle.directive';

export enum RestrictDrag {
    VERTICALLY,
    HORIZONTALLY,
    NONE
}

export interface IgxDragCustomEventDetails {
    startX: number;
    startY: number;
    pageX: number;
    pageY: number;
    owner: IgxDragDirective;
    originalEvent: any;
}

export interface IgxDropEnterEventArgs {
        /**
     * Reference to the original event that caused the draggable element to enter the igxDrop element.
     * Can be PointerEvent, TouchEvent or MouseEvent.
     */
    originalEvent: any;
    /** The owner igxDrop directive that triggered this event. */
    owner: IgxDropDirective;
    /** The igxDrag directive instanced on an element that entered the area of the igxDrop element */
    drag: IgxDragDirective;
    /** The data contained for the draggable element in igxDrag directive. */
    dragData: any;
    /** The initial position of the pointer on X axis when the dragged element began moving */
    startX: number;
    /** The initial position of the pointer on Y axis when the dragged element began moving */
    startY: number;
    /**
     * The current position of the pointer on X axis when the event was triggered.
     * Note: The browser might trigger the event with some delay and pointer would be already inside the igxDrop.
     */
    pageX: number;
    /**
     * The current position of the pointer on Y axis when the event was triggered.
     * Note: The browser might trigger the event with some delay and pointer would be already inside the igxDrop.
     */
    pageY: number;
    /**
     * The current position of the pointer on X axis relative to the container that initializes the igxDrop.
     * Note: The browser might trigger the event with some delay and pointer would be already inside the igxDrop.
     */
    offsetX: number;
    /**
     * The current position of the pointer on Y axis relative to the container that initializes the igxDrop.
     * Note: The browser might trigger the event with some delay and pointer would be already inside the igxDrop.
     */
    offsetY: number;
}

export interface IgxDropLeaveEventArgs {
    /**
     * Reference to the original event that caused the draggable element to enter the igxDrop element.
     * Can be PointerEvent, TouchEvent or MouseEvent.
     */
    originalEvent: any;
    /** The owner igxDrop directive that triggered this event. */
    owner: IgxDropDirective;
    /** The igxDrag directive instanced on an element that entered the area of the igxDrop element */
    drag: IgxDragDirective;
    /** The data contained for the draggable element in igxDrag directive. */
    dragData: any;
    /** The initial position of the pointer on X axis when the dragged element began moving */
    startX: number;
    /** The initial position of the pointer on Y axis when the dragged element began moving */
    startY: number;
    /**
     * The current position of the pointer on X axis when the event was triggered.
     * Note: The browser might trigger the event with some delay and pointer would be already inside the igxDrop.
     */
    pageX: number;
        /**
     * The current position of the pointer on Y axis when the event was triggered.
     * Note: The browser might trigger the event with some delay and pointer would be already inside the igxDrop.
     */
    pageY: number;
    /**
     * The current position of the pointer on X axis relative to the container that initializes the igxDrop.
     * Note: The browser might trigger the event with some delay and pointer would be already inside the igxDrop.
     */
    offsetX: number;
    /**
     * The current position of the pointer on Y axis relative to the container that initializes the igxDrop.
     * Note: The browser might trigger the event with some delay and pointer would be already inside the igxDrop.
     */
    offsetY: number;
}

export interface IgxDropEventArgs {
    /**
     * Reference to the original event that caused the draggable element to enter the igxDrop element.
     * Can be PointerEvent, TouchEvent or MouseEvent.
     */
    originalEvent: any;
    /** The owner igxDrop directive that triggered this event. */
    owner: IgxDropDirective;
    /** The igxDrag directive instanced on an element that entered the area of the igxDrop element */
    drag: IgxDragDirective;
    /** The data contained for the draggable element in igxDrag directive. */
    dragData: any;
    /**
     * The current position of the pointer on X axis relative to the container that initializes the igxDrop.
     * Note: The browser might trigger the event with some delay and pointer would be already inside the igxDrop.
     */
    offsetX: number;
    /**
     * The current position of the pointer on Y axis relative to the container that initializes the igxDrop.
     * Note: The browser might trigger the event with some delay and pointer would be already inside the igxDrop.
     */
    offsetY: number;
    /**
     * Whether the default drop behavior of the igxDrop directive should be canceled.
     * Note: If you implement custom behavior and you use `animateOnRelease` for the igxDrag make sure to call 'event.drag.dropFinished();'
     * to notify the igxDrag directive that it has been dropped so it animates properly.
     */
    cancel: boolean;
}

export interface IDragBaseEventArgs {
    /**
     * Reference to the original event that caused the interaction with the element.
     * Can be PointerEvent, TouchEvent or MouseEvent.
     */
    originalEvent: PointerEvent | MouseEvent | TouchEvent;
    /** The owner igxDrag directive that triggered this event. */
    owner: IgxDragDirective;
}
export interface IDragStartEventArgs extends IDragBaseEventArgs {
    /** Set if the the dragging should be canceled. */
    cancel: boolean;
}

@Directive({
    exportAs: 'drag',
    selector: '[igxDrag]'
})
export class IgxDragDirective implements AfterContentInit, OnDestroy {

    /**
     * - Save data inside the `igxDrag` directive. This can be set when instancing `igxDrag` on an element.
     * ```html
     * <div [igxDrag]="{ source: myElement }"></div>
     * ```
     */
    @Input('igxDrag')
    public data: any;

    /**
     * An @Input property that indicates when the drag should start
     * By default the drag starts after the draggable element is moved by 5px
     * ```html
     * <div igxDrag [dragTolerance]="100">
     *         <span>Drag Me!</span>
     * </div>
     * ```
     */
    @Input()
    public dragTolerance = 5;

    @Input()
    public renderGhost = true;

    @Input('dragLinkTo')
    public linkTo: number | string | number[] | string[];

    /**
     * Sets a custom class that will be added to the `dragGhost` element.
     * ```html
     * <div igxDrag [ghostImageClass]="'dragGhost'">
     *         <span>Drag Me!</span>
     * </div>
     * ```
     */
    @Input()
    public ghostImageClass = '';

    /**
     * An @Input property that hides the draggable element.
     * By default it's set to false.
     * ```html
     * <div igxDrag [dragTolerance]="100" [hideBaseOnDrag]="'true'">
     *         <span>Drag Me!</span>
     * </div>
     * ```
     */
    @Input()
    public hideBaseOnDrag = false;

    /**
     * An @Input property that enables/disables the draggable element animation
     * when the element is released.
     * By default it's set to false.
     * ```html
     * <div igxDrag [animateOnRelease]="'true'">
     *         <span>Drag Me!</span>
     * </div>
     * ```
     */
    @Input()
    public animateOnRelease = false;

    /**
     * An @Input property that sets the element to which the dragged element will be appended.
     * By default it's set to null and the dragged element is appended to the body.
     * ```html
     * <div #hostDiv></div>
     * <div igxDrag [dragGhostHost]="hostDiv">
     *         <span>Drag Me!</span>
     * </div>
     * ```
     */
    @Input()
    public dragGhostHost = null;

    /**
     * Event triggered when the draggable element drag starts.
     * ```html
     * <div igxDrag [animateOnRelease]="'true'" (dragStart)="onDragStart()">
     *         <span>Drag Me!</span>
     * </div>
     * ```
     * ```typescript
     * public onDragStart(){
     *      alert("The drag has stared!");
     * }
     * ```
     */
    @Output()
    public dragStart = new EventEmitter<IDragStartEventArgs>();

    /**
     * Event triggered when the draggable element is released.
     * ```html
     * <div igxDrag [animateOnRelease]="'true'" (dragEnd)="onDragEnd()">
     *         <span>Drag Me!</span>
     * </div>
     * ```
     * ```typescript
     * public onDragEnd(){
     *      alert("The drag has ended!");
     * }
     * ```
     */
    @Output()
    public dragEnd = new EventEmitter<IDragBaseEventArgs>();

    /**
     * Event triggered after the draggable element is released and after its animation has finished.
     * ```html
     * <div igxDrag [animateOnRelease]="'true'" (returnMoveEnd)="onMoveEnd()">
     *         <span>Drag Me!</span>
     * </div>
     * ```
     * ```typescript
     * public onMoveEnd(){
     *      alert("The move has ended!");
     * }
     * ```
     */
    @Output()
    public returnMoveEnd = new EventEmitter<IDragBaseEventArgs>();

    /**
     * Event triggered when the draggable element is clicked.
     * ```html
     * <div igxDrag [animateOnRelease]="'true'" (dragClicked)="dragClicked()">
     *         <span>Drag Me!</span>
     * </div>
     * ```
     * ```typescript
     * public dragClicked(){
     *      alert("The elemented has been clicked!");
     * }
     * ```
     */
    @Output()
    public dragClicked = new EventEmitter<IDragBaseEventArgs>();

    @ContentChild(IgxDragGhostDirective, { static: false })
    public ghostTemplate: IgxDragGhostDirective;

    @ContentChild(IgxDragHandleDirective, { static: false })
    public dragHandle: IgxDragHandleDirective;

    /**
     * @hidden
     */
    @HostBinding('style.touchAction')
    public touch = 'none';

    /**
     * @hidden
     */
    @HostBinding('style.visibility')
    public _visibility = 'visible';

    /**
     * Sets the visibility of the draggable element.
     * ```typescript
     * @ViewChild("myDrag" ,{read: IgxDragDirective})
     * public myDrag: IgxDragDirective;
     * ngAfterViewInit(){
     *     this.myDrag.visible = false;
     * }
     * ```
     */
    public set visible(bVisible) {
        this._visibility = bVisible ? 'visible' : 'hidden';
        this.cdr.detectChanges();
    }

    /**
     * Returns the visibility state of the draggable element.
     * ```typescript
     * @ViewChild("myDrag" ,{read: IgxDragDirective})
     * public myDrag: IgxDragDirective;
     * ngAfterViewInit(){
     *     let dragVisibilty = this.myDrag.visible;
     * }
     * ```
     */
    public get visible() {
        return this._visibility === 'visible';
    }

    public get pageX() {
        if (this.renderGhost && this.dragGhost) {
            return this.ghostLeft;
        }
        return this.element.nativeElement.getBoundingClientRect().left;
    }

    public get pageY() {
        if (this.renderGhost && this.dragGhost) {
            return this.ghostTop;
        }
        return this.element.nativeElement.getBoundingClientRect().top;
    }

    /**
     * @hidden
     */
    public set ghostLeft(val: number) {
        requestAnimationFrame(() => {
            if (this.dragGhost) {
                this.dragGhost.style.left = val + 'px';
            }
        });
    }

    /**
     * @hidden
     */
    public get ghostLeft() {
        return parseInt(this.dragGhost.style.left, 10);
    }

    /**
     * @hidden
     */
    public set ghostTop(val: number) {
        requestAnimationFrame(() => {
            if (this.dragGhost) {
                this.dragGhost.style.top = val + 'px';
            }
        });
    }

    /**
     * @hidden
     */
    public get ghostTop() {
        return parseInt(this.dragGhost.style.top, 10);
    }

    /**
     * Returns if the browser supports pointer events.
     * ```typescript
     * @ViewChild("myDrag" ,{read: IgxDragDirective})
     * public myDrag: IgxDragDirective;
     * ngAfterViewInit(){
     *     let pointerEvents = this.myDrag.pointerEventsEnabled;
     * }
     * ```
     */
    public get pointerEventsEnabled() {
        return typeof PointerEvent !== 'undefined';
    }

    /**
     * Returns if the browser supports touch events.
     * ```typescript
     * @ViewChild("myDrag" ,{read: IgxDragDirective})
     * public myDrag: IgxDragDirective;
     * ngAfterViewInit(){
     *     let touchEvents = this.myDrag.pointerEventsEnabled;
     * }
     * ```
     */
    public get touchEventsEnabled() {
        return 'ontouchstart' in window;
    }

    /**
     * @hidden
     */
    public defaultReturnDuration = '0.5s';

    protected _startX = 0;
    protected _startY = 0;
    protected _lastX = 0;
    protected _lastY = 0;
    protected _translateX = 0;
    protected _translateY = 0;

    protected dragGhost;
    protected _dragStarted = false;
    protected _dragOffsetX;
    protected _dragOffsetY;
    protected _dragStartX;
    protected _dragStartY;

    protected _pointerDownId = null;
    protected _clicked = false;
    protected _lastDropArea = null;

    protected _destroy = new Subject<boolean>();
    protected _removeOnDestroy = true;

    constructor(
        public cdr: ChangeDetectorRef,
        public element: ElementRef,
        public viewContainer: ViewContainerRef,
        public zone: NgZone,
        public renderer: Renderer2
    ) {
    }

    /**
     * @hidden
     */
    ngAfterContentInit() {
        const targetElement = this.dragHandle ? this.dragHandle.element.nativeElement : this.element.nativeElement;
        this.zone.runOutsideAngular(() => {
            if (this.pointerEventsEnabled) {
                fromEvent(targetElement, 'pointerdown').pipe(takeUntil(this._destroy))
                .subscribe((res) => this.onPointerDown(res));

                fromEvent(targetElement, 'pointermove').pipe(
                    throttle(() => interval(0, animationFrameScheduler)),
                    takeUntil(this._destroy)
                ).subscribe((res) => this.onPointerMove(res));

                fromEvent(targetElement, 'pointerup').pipe(takeUntil(this._destroy))
                    .subscribe((res) => this.onPointerUp(res));

                if (!this.renderGhost) {
                    fromEvent(targetElement, 'lostpointercapture').pipe(takeUntil(this._destroy))
                    .subscribe((res) => this.onPointerLost(res));
                }
            } else if (this.touchEventsEnabled) {
                fromEvent(targetElement, 'touchstart').pipe(takeUntil(this._destroy))
                .subscribe((res) => this.onPointerDown(res));

                fromEvent(document.defaultView, 'touchmove').pipe(
                    throttle(() => interval(0, animationFrameScheduler)),
                    takeUntil(this._destroy)
                ).subscribe((res) => this.onPointerMove(res));

                fromEvent(document.defaultView, 'touchend').pipe(takeUntil(this._destroy))
                    .subscribe((res) => this.onPointerUp(res));
            } else {
                // We don't have pointer events and touch events. Use then mouse events.
                fromEvent(targetElement, 'mousedown').pipe(takeUntil(this._destroy))
                .subscribe((res) => this.onPointerDown(res));

                fromEvent(document.defaultView, 'mousemove').pipe(
                    throttle(() => interval(0, animationFrameScheduler)),
                    takeUntil(this._destroy)
                ).subscribe((res) => this.onPointerMove(res));

                fromEvent(document.defaultView, 'mouseup').pipe(takeUntil(this._destroy))
                    .subscribe((res) => this.onPointerUp(res));
            }
        });
    }

    /**
     * @hidden
     */
    ngOnDestroy() {
        this._destroy.next(true);
        this._destroy.complete();

        if (this.renderGhost && this.dragGhost && this._removeOnDestroy) {
            this.dragGhost.parentNode.removeChild(this.dragGhost);
            this.dragGhost = null;
        }
    }

    protected getTransformX(elem) {
        let posX = 0;
        if (elem.style.transform) {
            const matrix = elem.style.transform;
            const values = matrix ? matrix.match(/-?[\d\.]+/g) : undefined;
            posX = values ? Number(values[ 1 ]) : 0;
        }

        return posX;
    }

    protected getTransformY(elem) {
        let posY = 0;
        if (elem.style.transform) {
            const matrix = elem.style.transform;
            const values = matrix ? matrix.match(/-?[\d\.]+/g) : undefined;
            posY = values ? Number(values[ 2 ]) : 0;
        }

        return posY;
    }

    /** Method setting transformation to the base draggable element. */
    protected setTransformXY(x: number, y: number) {
        this.element.nativeElement.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0px)';
    }

    public setPageXY(pageX: number, pageY: number) {
        if (!this.renderGhost) {
            const deltaX = pageX - this.pageX;
            const deltaY = pageY - this.pageY;
            const transformX = this.getTransformX(this.element.nativeElement);
            const transformY = this.getTransformY(this.element.nativeElement);
            this.setTransformXY(transformX + deltaX, transformY + deltaY);
        } else if (this.dragGhost) {
            this.ghostLeft = pageX;
            this.ghostTop = pageY;
        }

        // Reset runtime updated values when dragging
        this._startX = pageX;
        this._startY = pageY;
        this._translateX = 0;
        this._translateY = 0;
    }

    /**
     * @hidden
     * Method bound to the PointerDown event of the base element igxDrag is initialized.
     * @param event PointerDown event captured
     */
    public onPointerDown(event) {
        this._clicked = true;
        this._pointerDownId = event.pointerId;

        if (this.pointerEventsEnabled || !this.touchEventsEnabled) {
            // Check first for pointer events or non touch, because we can have pointer events and touch events at once.
            this._startX = event.pageX;
            this._startY = event.pageY;
        } else if (this.touchEventsEnabled) {
            this._startX = event.touches[0].pageX;
            this._startY = event.touches[0].pageY;
        }

        this._lastX = this._startX;
        this._lastY = this._startY;

        // Take margins because getBoundingClientRect() doesn't include margins of the element
        const marginTop = parseInt(document.defaultView.getComputedStyle(this.element.nativeElement)['margin-top'], 10);
        const marginLeft = parseInt(document.defaultView.getComputedStyle(this.element.nativeElement)['margin-left'], 10);

        this._dragOffsetX =
            (this._startX - this.element.nativeElement.getBoundingClientRect().left - this.getWindowScrollLeft()) + marginLeft;
        this._dragOffsetY =
            (this._startY - this.element.nativeElement.getBoundingClientRect().top - this.getWindowScrollTop()) + marginTop;
        this._dragStartX = this._startX - this._dragOffsetX;
        this._dragStartY = this._startY - this._dragOffsetY;

        // Set pointer capture so we detect pointermove even if mouse is out of bounds until dragGhost is created.
        const targetElement = this.dragHandle ? this.dragHandle.element.nativeElement : this.element.nativeElement;
        if (this.pointerEventsEnabled) {
            targetElement.setPointerCapture(this._pointerDownId);
        } else {
            targetElement.focus();
            event.preventDefault();
        }
    }

    /**
     * @hidden
     * Perfmorm drag move logic when dragging and dispatching events if there is igxDrop under the pointer.
     * This method is bound at first at the base element.
     * If dragging starts and after the dragGhost is rendered the pointerId is reassigned to the dragGhost. Then this method is bound to it.
     * @param event PointerMove event captured
     */
    public onPointerMove(event) {
        if (this._clicked) {
            const dragStartArgs: IDragStartEventArgs = {
                originalEvent: event,
                owner: this,
                cancel: false
            };
            let pageX, pageY;
            if (this.pointerEventsEnabled || !this.touchEventsEnabled) {
                // Check first for pointer events or non touch, because we can have pointer events and touch events at once.
                pageX = event.pageX;
                pageY = event.pageY;
            } else if (this.touchEventsEnabled) {
                pageX = event.touches[0].pageX;
                pageY = event.touches[0].pageY;

                // Prevent scrolling on touch while dragging
                event.preventDefault();
            }

            const totalMovedX = pageX - this._startX;
            const totalMovedY = pageY - this._startY;
            if (!this._dragStarted &&
                (Math.abs(totalMovedX) > this.dragTolerance || Math.abs(totalMovedY) > this.dragTolerance)) {
                this.zone.run(() => {
                    this.dragStart.emit(dragStartArgs);
                });

                if (!dragStartArgs.cancel) {
                    this._dragStarted = true;
                    if (this.renderGhost) {
                        // We moved enough so dragGhost can be rendered and actual dragging to start.
                        this.createDragGhost(event);
                    }
                }
                return;
            } else if (!this._dragStarted) {
                return;
            }

            if (this.renderGhost) {
                this.ghostLeft = this._dragStartX + totalMovedX;
                this.ghostTop = this._dragStartY + totalMovedY;
            } else {
                this._translateX += pageX - this._lastX;
                this._translateY += pageY - this._lastY;
                this.setTransformXY(this._translateX, this._translateY);
            }

            this.dispatchDragEvents(pageX, pageY, event);

            this._lastX = pageX;
            this._lastY = pageY;
        }
    }

    /**
     * @hidden
     * Perform drag end logic when releasing the dragGhost and dispatching drop event if igxDrop is under the pointer.
     * This method is bound at first at the base element.
     * If dragging starts and after the dragGhost is rendered the pointerId is reassigned to the dragGhost. Then this method is bound to it.
     * @param event PointerUp event captured
     */
    public onPointerUp(event) {
        if (!this._clicked) {
            return;
        }

        const eventArgs = {
            originalEvent: event,
            owner: this
        };
        this._clicked = false;
        if (this._dragStarted) {
            if (this._lastDropArea && this._lastDropArea !== this.element.nativeElement) {
                if (!this.animateOnRelease) {
                    this.onTransitionEnd(null);
                }

                // dragging ended over a drop area. Call this after transition because onDrop might remove the element.
                this.dispatchDropEvent(event.pageX, event.pageY, event);
                // else the drop directive needs to call the dropFinished() method so the animation can perform
            } else if (this.animateOnRelease &&
                    (this.ghostLeft !== Math.floor(this._dragStartX) || this.ghostTop !== Math.floor(this._dragStartY))) {
                // If the start positions are the same as the current the transition will not execute.
                // return the ghost to start position before removing it. See onTransitionEnd.
                this.dragGhost.style.transitionDuration = this.defaultReturnDuration;
                this.ghostLeft = this._dragStartX;
                this.ghostTop = this._dragStartY;
            } else {
                this.onTransitionEnd(null);
            }

            this.zone.run(() => {
                this.dragEnd.emit(eventArgs);
            });
        } else {
            this.zone.run(() => {
                this.dragClicked.emit(eventArgs);
            });
        }
    }

    public onPointerLost(event) {
        if (!this._clicked) {
            return;
        }

        const eventArgs = {
            originalEvent: event,
            owner: this
        };
        this._clicked = false;
        if (this._dragStarted) {
            if (this.animateOnRelease &&
                    (this.ghostLeft !== Math.floor(this._dragStartX) || this.ghostTop !== Math.floor(this._dragStartY))) {
                // If the start positions are the same as the current the transition will not execute.
                // return the ghost to start position before removing it. See onTransitionEnd.
                this.dragGhost.style.transitionDuration = this.defaultReturnDuration;
                this.ghostLeft = this._dragStartX;
                this.ghostTop = this._dragStartY;
            } else {
                this.onTransitionEnd(null);
            }

            this.zone.run(() => {
                this.dragEnd.emit(eventArgs);
            });
        }
    }

    /**
     * @hidden
     * Create dragGhost element - if a Node object is provided it creates a clone of that node,
     * otherwise it clones the host element.
     * Bind all needed events.
     * @param event Pointer event required when the dragGhost is being initialized.
     * @param node The Node object to be cloned.
     */
    protected createDragGhost(event, node: any = null) {
        if (this.ghostTemplate) {
            const dynamicGhostRef = this.viewContainer.createEmbeddedView(this.ghostTemplate.template);
            this.dragGhost = dynamicGhostRef.rootNodes[0];
        } else {
            this.dragGhost = node ? node.cloneNode(true) : this.element.nativeElement.cloneNode(true);
        }

        this.dragGhost.style.transitionDuration = '0.0s';
        this.dragGhost.style.position = 'absolute';
        const hostLeft = this.dragGhostHost ? this.dragGhostHost.getBoundingClientRect().left : 0;
        const hostTop = this.dragGhostHost ? this.dragGhostHost.getBoundingClientRect().top : 0;
        this.dragGhost.style.top = this._dragStartY - hostTop + 'px';
        this.dragGhost.style.left = this._dragStartX - hostLeft + 'px';

        if (this.ghostImageClass) {
            this.renderer.addClass(this.dragGhost, this.ghostImageClass);
        }

        if (this.dragGhostHost) {
            this.dragGhostHost.appendChild(this.dragGhost);
        } else {
            document.body.appendChild(this.dragGhost);
        }

        if (this.pointerEventsEnabled) {
            // The dragGhost takes control for moving and dragging after it has been shown.
            this.dragGhost.setPointerCapture(this._pointerDownId);
            this.dragGhost.addEventListener('pointermove', (args) => {
                this.onPointerMove(args);
            });
            this.dragGhost.addEventListener('pointerup', (args) => {
                this.onPointerUp(args);
            });
            this.dragGhost.addEventListener('lostpointercapture', (args) => {
                this.onPointerLost(args);
            });
        }

        if (this.animateOnRelease) {
            // Transition animation when the dragGhost is released and it returns to it's original position.
            this.dragGhost.addEventListener('transitionend', (args) => {
                this.onTransitionEnd(args);
            });
        }

        // Hide the base after the dragGhost is created, because otherwise the dragGhost will be not visible.
        if (this.hideBaseOnDrag) {
            this.visible = false;
        }

        this.cdr.detectChanges();
    }

    /**
     * @hidden
     * Dispatch custom igxDragEnter/igxDragLeave events based on current pointer position and if drop area is under.
     */
    protected dispatchDragEvents(pageX: number, pageY: number, originalEvent) {
        let topDropArea;
        const eventArgs: IgxDragCustomEventDetails = {
            startX: this._startX,
            startY: this._startY,
            pageX: pageX,
            pageY: pageY,
            owner: this,
            originalEvent: originalEvent
        };

        const elementsFromPoint = this.getElementsAtPoint(pageX, pageY);
        for (let i = 0; i < elementsFromPoint.length; i++) {
            if (elementsFromPoint[i].getAttribute('droppable') === 'true' && elementsFromPoint[i] !== this.dragGhost) {
                topDropArea = elementsFromPoint[i];
                break;
            }
        }

        if (topDropArea) {
            this.dispatchEvent(topDropArea, 'igxDragOver', eventArgs);
        }

        if (topDropArea &&
            (!this._lastDropArea || (this._lastDropArea && this._lastDropArea !== topDropArea))) {
            if (this._lastDropArea) {
                this.dispatchEvent(this._lastDropArea, 'igxDragLeave', eventArgs);
            }

            this._lastDropArea = topDropArea;
            this.dispatchEvent(this._lastDropArea, 'igxDragEnter', eventArgs);
        } else if (!topDropArea && this._lastDropArea) {
            this.dispatchEvent(this._lastDropArea, 'igxDragLeave', eventArgs);
            this._lastDropArea = null;
        }
    }

    /**
     * @hidden
     * Dispatch custom igxDrop event based on current pointer position if there is last recorder drop area under the pointer.
     * Last recorder drop area is updated in @dispatchDragEvents method.
     */
    protected dispatchDropEvent(pageX: number, pageY: number, originalEvent) {
        const eventArgs: IgxDragCustomEventDetails = {
            startX: this._startX,
            startY: this._startY,
            pageX: pageX,
            pageY: pageY,
            owner: this,
            originalEvent: originalEvent
        };

        this.dispatchEvent(this._lastDropArea, 'igxDrop', eventArgs);
        this.dispatchEvent(this._lastDropArea, 'igxDragLeave', eventArgs);
        this._lastDropArea = null;
    }

    /**
     * @hidden
     * Update relative positions
     */
    public updateDragRelativePos() {
        if (!this.dragGhost) {
            return;
        }

        // Calculate the new dragGhost position to remain where the mouse is, so it doesn't jump
        const totalDraggedX = this.ghostLeft - this._dragStartX;
        const totalDraggedY = this.ghostTop - this._dragStartY;
        const newPosX = this.element.nativeElement.getBoundingClientRect().left;
        const newPosY = this.element.nativeElement.getBoundingClientRect().top;
        const diffStartX = this._dragStartX - newPosX;
        const diffStartY = this._dragStartY - newPosY;
        this.ghostTop = newPosX + totalDraggedX - diffStartX;
        this.ghostLeft = newPosY + totalDraggedY - diffStartY;
    }

    /**
     * Informs the `igxDrag` directive that it has been dropped/released.
     * This should usully be called when `animateOnRelease` is set to `true`.
     * When canceling or defining custom drop logic this tells the igxDrag to update it's positions and
     * animate correctly to the new position.
     * ```typescript
     * public onDropElem(event) {
     *     // Function bound to the igxDrop directive event `onDrop`
     *     // This cancels the default drop logic of the `igxDrop`
     *     event.cancel = true;
     *     event.drag.dropFinished();
     * }
     * ```
     */
    public dropFinished() {
        if (this.animateOnRelease && this.dragGhost) {
            this.updateDragRelativePos();

            // Return the dragged element to the start. See onTransitionEnd next.
            // Take margins becuase getBoundingClientRect() doesn't include margins
            const marginTop = parseInt(document.defaultView.getComputedStyle(this.element.nativeElement)['margin-top'], 10);
            const marginLeft = parseInt(document.defaultView.getComputedStyle(this.element.nativeElement)['margin-left'], 10);
            const newPosX = this.element.nativeElement.getBoundingClientRect().left + this.getWindowScrollLeft();
            const newPosY = this.element.nativeElement.getBoundingClientRect().top + this.getWindowScrollTop();

            this.dragGhost.style.transitionDuration = this.defaultReturnDuration;
            this.ghostLeft = newPosX - marginLeft;
            this.ghostTop = newPosY - marginTop;
        }
    }

    /**
     * @hidden
     */
    public onTransitionEnd(event) {
        if (!this._dragStarted || this._clicked) {
            return ;
        }

        if (this.renderGhost) {
            if (this.hideBaseOnDrag) {
                this.visible = true;
            }
            this.dragGhost.parentNode.removeChild(this.dragGhost);
            this.dragGhost = null;

            this.element.nativeElement.style.transitionDuration = '0.0s';
            this.zone.run(() => {
                this.returnMoveEnd.emit({
                    originalEvent: event,
                    owner: this
                });
            });
        }
        this._dragStarted = false;
    }

    /**
     * @hidden
     */
    protected getElementsAtPoint(pageX: number, pageY: number) {
        // correct the coordinates with the current scroll position, because
        // document.elementsFromPoint conider position within the current viewport
        // window.pageXOffset == window.scrollX; // always true
        // using window.pageXOffset for IE9 compatibility
        const viewPortX = pageX - window.pageXOffset;
        const viewPortY = pageY - window.pageYOffset;
        if (document['msElementsFromPoint']) {
            // Edge and IE special snowflakes
            return document['msElementsFromPoint'](viewPortX, viewPortY);
        } else {
            // Other browsers like Chrome, Firefox, Opera
            return document.elementsFromPoint(viewPortX, viewPortY);
        }
    }

    /**
     * @hidden
     */
    protected dispatchEvent(target, eventName: string, eventArgs: IgxDragCustomEventDetails) {
        // This way is IE11 compatible.
        const dragLeaveEvent = document.createEvent('CustomEvent');
        dragLeaveEvent.initCustomEvent(eventName, false, false, eventArgs);
        target.dispatchEvent(dragLeaveEvent);
        // Othersie can be used `target.dispatchEvent(new CustomEvent(eventName, eventArgs));`
    }

    protected getWindowScrollTop() {
        return window.scrollY ? window.scrollY : (window.pageYOffset ? window.pageYOffset : 0);
    }

    protected getWindowScrollLeft() {
        return window.scrollX ? window.scrollX : (window.pageXOffset ? window.pageXOffset : 0);
    }
}

@Directive({
    exportAs: 'drop',
    selector: '[igxDrop]'
})
export class IgxDropDirective implements OnInit, OnDestroy {

    /**
     * - Save data inside the `igxDrop` directive. This can be set when instancing `igxDrop` on an element.
     * ```html
     * <div [igxDrop]="{ source: myElement }"></div>
     * ```
     */
    @Input('igxDrop')
    public data: any;

    @Input('dropLinkTo')
    public linkTo: number | string | number[] | string[];

    /** Event triggered when dragged element enters the area of the element.
     * ```html
     * <div class="cageArea" igxDrop (onEnter)="dragEnter()" (igxDragEnter)="onDragCageEnter()" (igxDragLeave)="onDragCageLeave()">
     * </div>
     * ```
     * ```typescript
     * public dragEnter(){
     *     alert("A draggable element has entered the chip area!");
     * }
     * ```
     */
    @Output()
    public onEnter = new EventEmitter<IgxDropEnterEventArgs>();

    /** Event triggered when dragged element leaves the area of the element.
     * ```html
     * <div class="cageArea" igxDrop (onLeave)="dragLeave()" (igxDragEnter)="onDragCageEnter()" (igxDragLeave)="onDragCageLeave()">
     * </div>
     * ```
     * ```typescript
     * public dragLeave(){
     *     alert("A draggable element has left the chip area!");
     * }
     * ```
     */
    @Output()
    public onLeave = new EventEmitter<IgxDropLeaveEventArgs>();

    /** Event triggered when dragged element is dropped in the area of the element.
     * Since the `igxDrop` has default logic that appends the dropped element as a child, it can be canceled here.
     * To cancel the default logic the `cancel` property of the event needs to be set to true.
     * ```html
     * <div class="cageArea" igxDrop (onDrop)="dragDrop()" (igxDragEnter)="onDragCageEnter()" (igxDragLeave)="onDragCageLeave()">
     * </div>
     * ```
     * ```typescript
     * public dragDrop(){
     *     alert("A draggable element has been dropped in the chip area!");
     * }
     * ```
     */
    @Output()
    public onDrop = new EventEmitter<IgxDropEventArgs>();

    /**
     * @hidden
     */
    @HostBinding('attr.droppable')
    public droppable = true;

    /**
     * @hidden
     */
    @HostBinding('class.dragOver')
    public dragover = false;

    /**
     * @hidden
     */
    protected _destroy = new Subject<boolean>();

    constructor(public element: ElementRef, private _renderer: Renderer2, private _zone: NgZone) {
    }

    ngOnInit() {
        this._zone.runOutsideAngular(() => {
            fromEvent(this.element.nativeElement, 'igxDragEnter').pipe(takeUntil(this._destroy))
                .subscribe((res) => this.onDragEnter(res as CustomEvent<IgxDragCustomEventDetails>));

            fromEvent(this.element.nativeElement, 'igxDragLeave').pipe(takeUntil(this._destroy)).subscribe((res) => this.onDragLeave(res));
            fromEvent(this.element.nativeElement, 'igxDragOver').pipe(takeUntil(this._destroy)).subscribe((res) => this.onDragOver(res));
        });
    }

    ngOnDestroy() {
        this._destroy.next(true);
        this._destroy.complete();
    }

    public isDragLinked(drag: IgxDragDirective): boolean {
        const dragLinkArray = drag.linkTo instanceof Array;
        const dropLinkArray = this.linkTo instanceof Array;

        if (!dragLinkArray && !dropLinkArray) {
            return this.linkTo === drag.linkTo;
        } else if (!dragLinkArray && dropLinkArray) {
            const dropLinks = <Array<any>>this.linkTo;
            for (let i = 0; i < dropLinks.length; i ++) {
                if (dropLinks[i] === drag.linkTo) {
                    return true;
                }
            }
        } else if (dragLinkArray && !dropLinkArray) {
            const dragLinks = <Array<any>>drag.linkTo;
            for (let i = 0; i < dragLinks.length; i ++) {
                if (dragLinks[i] === this.linkTo) {
                    return true;
                }
            }
        } else {
            const dragLinks = <Array<any>>drag.linkTo;
            const dropLinks = <Array<any>>this.linkTo;
            for (let i = 0; i < dragLinks.length; i ++) {
                for (let j = 0; j < dropLinks.length; j ++) {
                    if (dragLinks[i] === dropLinks[j]) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * @hidden
     */
    public onDragOver(event) { }

    /**
     * @hidden
     */
    public onDragEnter(event: CustomEvent<IgxDragCustomEventDetails>) {
        if (!this.isDragLinked(event.detail.owner)) {
            return;
        }

        this.dragover = true;
        const elementPosX = this.element.nativeElement.getBoundingClientRect().left + this.getWindowScrollLeft();
        const elementPosY = this.element.nativeElement.getBoundingClientRect().top + this.getWindowScrollTop();
        const offsetX = event.detail.pageX - elementPosX;
        const offsetY = event.detail.pageY - elementPosY;
        const eventArgs: IgxDropEnterEventArgs = {
            originalEvent: event.detail.originalEvent,
            owner: this,
            drag: event.detail.owner,
            dragData: event.detail.owner.data,
            startX: event.detail.startX,
            startY: event.detail.startY,
            pageX: event.detail.pageX,
            pageY: event.detail.pageY,
            offsetX: offsetX,
            offsetY: offsetY
        };
        this._zone.run(() => {
            this.onEnter.emit(eventArgs);
        });
    }

    /**
     * @hidden
     */
    public onDragLeave(event) {
        if (!this.isDragLinked(event.detail.owner)) {
            return;
        }

        this.dragover = false;
        const elementPosX = this.element.nativeElement.getBoundingClientRect().left + this.getWindowScrollLeft();
        const elementPosY = this.element.nativeElement.getBoundingClientRect().top + this.getWindowScrollTop();
        const offsetX = event.detail.pageX - elementPosX;
        const offsetY = event.detail.pageY - elementPosY;
        const eventArgs: IgxDropLeaveEventArgs = {
            originalEvent: event.detail.originalEvent,
            owner: this,
            drag: event.detail.owner,
            dragData: event.detail.owner.data,
            startX: event.detail.startX,
            startY: event.detail.startY,
            pageX: event.detail.pageX,
            pageY: event.detail.pageY,
            offsetX: offsetX,
            offsetY: offsetY
        };
        this._zone.run(() => {
            this.onLeave.emit(eventArgs);
        });
    }

    /**
     * @hidden
     */
    @HostListener('igxDrop', ['$event'])
    public onDragDrop(event) {
        if (!this.isDragLinked(event.detail.owner)) {
            return;
        }

        const elementPosX = this.element.nativeElement.getBoundingClientRect().left + this.getWindowScrollLeft();
        const elementPosY = this.element.nativeElement.getBoundingClientRect().top + this.getWindowScrollTop();
        const offsetX = event.detail.pageX - elementPosX;
        const offsetY = event.detail.pageY - elementPosY;
        const args: IgxDropEventArgs = {
            owner: this,
            originalEvent: event.detail.originalEvent,
            drag: event.detail.owner,
            dragData: event.detail.owner.data,
            offsetX: offsetX,
            offsetY: offsetY,
            cancel: false
        };
        this._zone.run(() => {
            this.onDrop.emit(args);
        });

        if (!args.cancel) {
            // To do for generic scenario
            this._renderer.removeChild(event.detail.owner.element.nativeElement.parentNode, event.detail.owner.element.nativeElement);
            this._renderer.appendChild(this.element.nativeElement, event.detail.owner.element.nativeElement);

            setTimeout(() => {
                event.detail.owner.dropFinished();
            }, 0);
        }
    }

    protected getWindowScrollTop() {
        return window.scrollY ? window.scrollY : (window.pageYOffset ? window.pageYOffset : 0);
    }

    protected getWindowScrollLeft() {
        return window.scrollX ? window.scrollX : (window.pageXOffset ? window.pageXOffset : 0);
    }
}


/**
 * @hidden
 */
@NgModule({
    declarations: [IgxDragDirective, IgxDropDirective, IgxDragGhostDirective, IgxDragHandleDirective],
    exports: [IgxDragDirective, IgxDropDirective, IgxDragGhostDirective, IgxDragHandleDirective]
})
export class IgxDragDropModule { }
