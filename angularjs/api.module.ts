import * as api from './api/api';
import * as angular from 'angular';

const apiModule = angular.module('api', [])
.service('AuthenticateApi', api.AuthenticateApi)
.service('BatchExportApi', api.BatchExportApi)
.service('BidItemApi', api.BidItemApi)
.service('CommentApi', api.CommentApi)
.service('ContractApi', api.ContractApi)
.service('CustomerApi', api.CustomerApi)
.service('DocumentApi', api.DocumentApi)
.service('DocumentApprovalApi', api.DocumentApprovalApi)
.service('DocumentSendToApi', api.DocumentSendToApi)
.service('DocumentsApi', api.DocumentsApi)
.service('DocumentsByObservationApi', api.DocumentsByObservationApi)
.service('ElectronicSignatureApi', api.ElectronicSignatureApi)
.service('EquipmentApi', api.EquipmentApi)
.service('LineItemApi', api.LineItemApi)
.service('ModuleApi', api.ModuleApi)
.service('NotificationApi', api.NotificationApi)
.service('ObservationApi', api.ObservationApi)
.service('ObservationCloneTemplatesApi', api.ObservationCloneTemplatesApi)
.service('ObservationSearchsApi', api.ObservationSearchsApi)
.service('ObservationSendToApi', api.ObservationSendToApi)
.service('ObservationsBatchTagApi', api.ObservationsBatchTagApi)
.service('ObservationsByDocumentApi', api.ObservationsByDocumentApi)
.service('ObservationsByUpdateDateApi', api.ObservationsByUpdateDateApi)
.service('ObservationsFilterApi', api.ObservationsFilterApi)
.service('OrganizationApi', api.OrganizationApi)
.service('PayItemApi', api.PayItemApi)
.service('ProjectApi', api.ProjectApi)
.service('ReportApi', api.ReportApi)
.service('ReportNamedInstanceApi', api.ReportNamedInstanceApi)
.service('UserApi', api.UserApi)

export default apiModule;
