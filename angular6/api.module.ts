import { NgModule, ModuleWithProviders, SkipSelf, Optional } from '@angular/core';
import { Configuration } from './configuration';
import { HttpClient } from '@angular/common/http';


import { AuthenticateService } from './api/authenticate.service';
import { BatchExportService } from './api/batchExport.service';
import { BidItemService } from './api/bidItem.service';
import { CommentService } from './api/comment.service';
import { ContractService } from './api/contract.service';
import { CustomerService } from './api/customer.service';
import { DocumentService } from './api/document.service';
import { DocumentApprovalService } from './api/documentApproval.service';
import { DocumentSendToService } from './api/documentSendTo.service';
import { DocumentsService } from './api/documents.service';
import { DocumentsByObservationService } from './api/documentsByObservation.service';
import { ElectronicSignatureService } from './api/electronicSignature.service';
import { EquipmentService } from './api/equipment.service';
import { LineItemService } from './api/lineItem.service';
import { ModuleService } from './api/module.service';
import { NotificationService } from './api/notification.service';
import { ObservationService } from './api/observation.service';
import { ObservationCloneTemplatesService } from './api/observationCloneTemplates.service';
import { ObservationSearchsService } from './api/observationSearchs.service';
import { ObservationSendToService } from './api/observationSendTo.service';
import { ObservationsBatchTagService } from './api/observationsBatchTag.service';
import { ObservationsByDocumentService } from './api/observationsByDocument.service';
import { ObservationsByUpdateDateService } from './api/observationsByUpdateDate.service';
import { ObservationsFilterService } from './api/observationsFilter.service';
import { OrganizationService } from './api/organization.service';
import { PayItemService } from './api/payItem.service';
import { ProjectService } from './api/project.service';
import { ReportService } from './api/report.service';
import { ReportNamedInstanceService } from './api/reportNamedInstance.service';
import { UserService } from './api/user.service';

@NgModule({
  imports:      [],
  declarations: [],
  exports:      [],
  providers: [
    AuthenticateService,
    BatchExportService,
    BidItemService,
    CommentService,
    ContractService,
    CustomerService,
    DocumentService,
    DocumentApprovalService,
    DocumentSendToService,
    DocumentsService,
    DocumentsByObservationService,
    ElectronicSignatureService,
    EquipmentService,
    LineItemService,
    ModuleService,
    NotificationService,
    ObservationService,
    ObservationCloneTemplatesService,
    ObservationSearchsService,
    ObservationSendToService,
    ObservationsBatchTagService,
    ObservationsByDocumentService,
    ObservationsByUpdateDateService,
    ObservationsFilterService,
    OrganizationService,
    PayItemService,
    ProjectService,
    ReportService,
    ReportNamedInstanceService,
    UserService ]
})
export class ApiModule {
    public static forRoot(configurationFactory: () => Configuration): ModuleWithProviders {
        return {
            ngModule: ApiModule,
            providers: [ { provide: Configuration, useFactory: configurationFactory } ]
        };
    }

    constructor( @Optional() @SkipSelf() parentModule: ApiModule,
                 @Optional() http: HttpClient) {
        if (parentModule) {
            throw new Error('ApiModule is already loaded. Import in your base AppModule only.');
        }
        if (!http) {
            throw new Error('You need to import the HttpClientModule in your AppModule! \n' +
            'See also https://github.com/angular/angular/issues/20575');
        }
    }
}
