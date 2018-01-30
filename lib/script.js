/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var PERMISSION_LOG_ID_PREFIX = 'permissionLogId:';
var ASSET_ID_PREFIX = 'assetId:';

var CORE_NAMESPACE_PREFIX = "com.depa.blockchain.core";
var PERMISSION_LOG_ASSET = CORE_NAMESPACE_PREFIX + "." + "PermissionLog";
var PATIENT_PARTICIPANT = CORE_NAMESPACE_PREFIX + "." + "Patient";
var HCP_PARTICIPANT = CORE_NAMESPACE_PREFIX + "." + "HealthCareProvider";

var ASSET_NAMESPACE_PREFIX = "com.depa.blockchain.assets";
var SERVICE_HISTORY_ASSET = ASSET_NAMESPACE_PREFIX + "." + "ServiceHistory";
var DIAG_HISTORY_ASSET = ASSET_NAMESPACE_PREFIX + "." + "DiagHistory";
var PROCEDURE_HISTORY_ASSET = ASSET_NAMESPACE_PREFIX + "." + "ProcedureHistory";
var DRUG_HISTORY_ASSET = ASSET_NAMESPACE_PREFIX + "." + "DrugHistory";
var CHECKUP_HISTORY_ASSET = ASSET_NAMESPACE_PREFIX + "." + "CheckupHistory";
var VACCINATION_ASSET = ASSET_NAMESPACE_PREFIX + "." + "Vaccination";
var XRAY_ASSET = ASSET_NAMESPACE_PREFIX + "." + "Xray";

/**
 * A transaction processor for new permission request
 * 
 * @param {com.depa.blockchain.core.PermissionTransaction} permissionTransaction - A new permission request to be process
 * @transaction
 */
function PermissionTransaction(permissionTransaction) {
    var factory = getFactory();
    var actionDateTime = new Date();
    var permissionLogId = PERMISSION_LOG_ID_PREFIX + actionDateTime.getTime().toString();
    var savedPermissionLog = null;
    var permissionLogAssetRegistry = null;
    return getAssetRegistry(PERMISSION_LOG_ASSET)
        .then(function (_permissionLogAssetRegistry) {
            permissionLogAssetRegistry = _permissionLogAssetRegistry;
            // Create a new PermissionLog
            var newPermissionLog = factory.newResource(CORE_NAMESPACE_PREFIX, 'PermissionLog', permissionLogId);

            newPermissionLog.patient = permissionTransaction.patient;
            newPermissionLog.healthCareProvider = permissionTransaction.healthCareProvider;
            newPermissionLog.permissionType = permissionTransaction.permissionType;
            newPermissionLog.actionDateTime = actionDateTime;
            newPermissionLog.patientResponseResult = 'NOOP';

            savedPermissionLog = newPermissionLog;

            return permissionLogAssetRegistry.add(newPermissionLog)
                .then(stampResponseResultToAllPermissionLog(permissionLogAssetRegistry, permissionTransaction));
        })
        
        .then(function () {
            // Get Patient participant registry
            return getParticipantRegistry("com.depa.blockchain.core.Patient");
        })
        .then(function (patientParticipantRegistry) {
            // Update patient
            var patient = permissionTransaction.patient;
            var positionOfHcpInArray = -1;
            if (permissionTransaction.permissionType == 'GRANT') {
                // Remove HCP from pending list
                if (!patient.pendingHcpPermissionRequest) {
                    patient.pendingHcpPermissionRequest = [];
                }
                positionOfHcpInArray = patient.pendingHcpPermissionRequest.indexOf(permissionTransaction.healthCareProvider);
                if(positionOfHcpInArray != -1) {
                    patient.pendingHcpPermissionRequest.splice(positionOfHcpInArray, 1);
                }

                // Put into authorized list
                if (!patient.authorizedHcpPermissionRequest) {
                    patient.authorizedHcpPermissionRequest = [];
                }
                patient.authorizedHcpPermissionRequest.push(permissionTransaction.healthCareProvider);
                return patientParticipantRegistry.update(patient);
            } else if (permissionTransaction.permissionType == 'REVOKE') {
                // Remove HCP from authorized list
                positionOfHcpInArray = patient.authorizedHcpPermissionRequest.indexOf(permissionTransaction.healthCareProvider);
                patient.authorizedHcpPermissionRequest.splice(positionOfHcpInArray, 1);
                return patientParticipantRegistry.update(patient);
            } else if (permissionTransaction.permissionType == 'REQUEST') {
                // Initialize intial list if not any
                if (!patient.pendingHcpPermissionRequest) {
                    patient.pendingHcpPermissionRequest = [];
                }

                // Remove HCP from pending list
                positionOfHcpInArray = patient.pendingHcpPermissionRequest.indexOf(permissionTransaction.healthCareProvider);
                
                // Put into pending list
                if(positionOfHcpInArray == -1) {
                    patient.pendingHcpPermissionRequest.push(permissionTransaction.healthCareProvider);
                }
                return patientParticipantRegistry.update(patient);
            } else {
                return;
            }
        })
        .then(function () {
            // Emit an event for this transaction
            var resultPermissionEvent = 'PermissionEvent';
            var requestEvent = null;

            if (permissionTransaction.permissionType == 'REQUEST') {
                resultPermissionEvent = 'PermissionRequestEvent';
            } else if (permissionTransaction.permissionType == 'GRANT') {
                resultPermissionEvent = 'PermissionGrantedEvent';
            } else if (permissionTransaction.permissionType == 'DENY') {
                resultPermissionEvent = 'PermissionDeniedEvent';
            } else if (permissionTransaction.permissionType == 'REVOKE') {
                resultPermissionEvent = 'PermissionRevokeEvent';
            }

            requestEvent = factory.newEvent(CORE_NAMESPACE_PREFIX, resultPermissionEvent);
            requestEvent.refPermissionLog = savedPermissionLog;
            requestEvent.patient = permissionTransaction.patient;
            requestEvent.healthCareProvider = permissionTransaction.healthCareProvider;
            emit(requestEvent);
        })
        .catch(function (err) {
            console.log(err);
            throw err;
        });
}

// Utilities /////////////////////////////////////////////////////////////////////////
function stampResponseResultToAllPermissionLog(registry, tx) {
    var actionDateTime = new Date();
    if (tx.permissionType == 'GRANT' || tx.permissionType == 'DENY') {
        return query('listAllRequestWithNoResponse', {
                patientIdParam: 'resource:' + PATIENT_PARTICIPANT + '#' + tx.patient.patientId,
                hcpIdParam: 'resource:' + HCP_PARTICIPANT + '#' + tx.healthCareProvider.healthCareProviderId
            })
            .then(function (logs) {
                logs.forEach(function(log) {
                    log.patientResponseResult = tx.permissionType;
                    log.patientResponseDateTime = actionDateTime;
                    registry.update(log);
                });
                return;
            }).catch(function(e) {
                console.log('PouchDB expected to be error, fallback to for-loop.');
                return registry.getAll().then(function(logs) {
                    logs.forEach(function(log) {
                        if(log.patient.$identifier === tx.patient.patientId &&
                                log.healthCareProvider.$identifier === tx.healthCareProvider.healthCareProviderId) {
                            log.patientResponseResult = tx.permissionType;
                            log.patientResponseDateTime = actionDateTime;
                            registry.update(log);
                        }
                    });
                });
            });
    }
}
