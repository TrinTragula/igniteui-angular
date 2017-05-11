import { NgModule } from "@angular/core";

import { IgxButtonModule, IgxRippleModule, IgxToastModule } from "../../../src/main";
import { IgxToastSampleComponent } from "./sample.component";

@NgModule({
    imports: [
        IgxToastModule,
        IgxButtonModule,
        IgxRippleModule
    ],
    declarations: [
        IgxToastSampleComponent
    ]
})
export class IgxToastSampleModule {}
