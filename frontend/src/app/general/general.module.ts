import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GeneralRoutingModule } from "./general-routing.module";
//own components
import { DashboardComponent } from './dashboard/dashboard.component';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { FooterComponent } from './footer/footer.component';
// modules 
import { HomeModule } from '../home/home.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { CustomerModule } from '../customer/customer.module';


@NgModule({
    imports: [
        CommonModule,
        HomeModule,
        GeneralRoutingModule,
        FileUploadModule,
        CustomerModule
    ],
    declarations: [
        DashboardComponent,
        NavbarComponent,
        SidebarComponent,
        FooterComponent
    ],
    exports: [
        DashboardComponent
    ],
    providers: [
    ]
})
export class GeneralModule { }