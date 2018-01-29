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
        
        .then(applyPermissionToAssets(SERVICE_HISTORY_ASSET, permissionTransaction))
        .then(applyPermissionToAssets(DIAG_HISTORY_ASSET, permissionTransaction))
        .then(applyPermissionToAssets(PROCEDURE_HISTORY_ASSET, permissionTransaction))
        .then(applyPermissionToAssets(DRUG_HISTORY_ASSET, permissionTransaction))
        .then(applyPermissionToAssets(CHECKUP_HISTORY_ASSET, permissionTransaction))
        .then(applyPermissionToAssets(VACCINATION_ASSET, permissionTransaction))
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

/**
 * A transaction processor for new permission request
 * 
 * @param {com.depa.blockchain.core.CreateServiceHistory} createServiceHistoryTx - A new permission request to be process
 * @transaction
 */
function CreateServiceHistory(createServiceHistoryTx) {
    return genericPermissionAddForCreate(SERVICE_HISTORY_ASSET, createServiceHistoryTx)
}

/**
 * A transaction processor for new permission request
 * 
 * @param {com.depa.blockchain.core.CreateDiagHistory} createDiagHistoryTx - A new permission request to be process
 * @transaction
 */
function CreateServiceHistory(createDiagHistoryTx) {
    return genericPermissionAddForCreate(DIAG_HISTORY_ASSET, createDiagHistoryTx)
}

/**
 * A transaction processor for new permission request
 * 
 * @param {com.depa.blockchain.core.CreateProcedureHistory} createProcedureHistoryTx - A new permission request to be process
 * @transaction
 */
function CreateServiceHistory(createProcedureHistoryTx) {
    return genericPermissionAddForCreate(PROCEDURE_HISTORY_ASSET, createProcedureHistoryTx)
}

/**
 * A transaction processor for new permission request
 * 
 * @param {com.depa.blockchain.core.CreateDrugHistory} createDrugHistoryTx - A new permission request to be process
 * @transaction
 */
function CreateServiceHistory(createDrugHistoryTx) {
    return genericPermissionAddForCreate(DRUG_HISTORY_ASSET, createDrugHistoryTx)
}

/**
 * A transaction processor for new permission request
 * 
 * @param {com.depa.blockchain.core.CreateCheckupHistory} createCheckupHistoryTx - A new permission request to be process
 * @transaction
 */
function CreateServiceHistory(createCheckupHistoryTx) {
    return genericPermissionAddForCreate(CHECKUP_HISTORY_ASSET, createCheckupHistoryTx)
}

/**
 * A transaction processor for new permission request
 * 
 * @param {com.depa.blockchain.core.CreateVaccination} createVaccinationTx - A new permission request to be process
 * @transaction
 */
function CreateServiceHistory(createVaccinationTx) {
    return genericPermissionAddForCreate(VACCINATION_ASSET, createVaccinationTx)
}

/**
 * A transaction processor for new permission request
 * 
 * @param {com.depa.blockchain.core.UpdateServiceHistory} updateServiceHistoryTx - A new permission request to be process
 * @transaction
 */
function UpdateServiceHistory(updateServiceHistoryTx) {
    return genericPermissionMaintainForUpdate(SERVICE_HISTORY_ASSET, updateServiceHistoryTx)
}

/**
 * A transaction processor for new permission request
 * 
 * @param {com.depa.blockchain.core.UpdateDiagHistory} updateDiagHistoryTx - A new permission request to be process
 * @transaction
 */
function UpdateServiceHistory(updateDiagHistoryTx) {
    return genericPermissionMaintainForUpdate(DIAG_HISTORY_ASSET, updateDiagHistoryTx)
}

/**
 * A transaction processor for new permission request
 * 
 * @param {com.depa.blockchain.core.UpdateProcedureHistory} updateProcedureHistoryTx - A new permission request to be process
 * @transaction
 */
function UpdateServiceHistory(updateProcedureHistoryTx) {
    return genericPermissionMaintainForUpdate(PROCEDURE_HISTORY_ASSET, updateProcedureHistoryTx)
}

/**
 * A transaction processor for new permission request
 * 
 * @param {com.depa.blockchain.core.UpdateDrugHistory} updateDrugHistoryTx - A new permission request to be process
 * @transaction
 */
function UpdateServiceHistory(updateDrugHistoryTx) {
    return genericPermissionMaintainForUpdate(DRUG_HISTORY_ASSET, updateDrugHistoryTx)
}

/**
 * A transaction processor for new permission request
 * 
 * @param {com.depa.blockchain.core.UpdateCheckupHistory} updateCheckupHistoryTx - A new permission request to be process
 * @transaction
 */
function UpdateServiceHistory(updateCheckupHistoryTx) {
    return genericPermissionMaintainForUpdate(CHECKUP_HISTORY_ASSET, updateCheckupHistoryTx)
}

/**
 * A transaction processor for new permission request
 * 
 * @param {com.depa.blockchain.core.UpdateVaccination} updateVaccinationTx - A new permission request to be process
 * @transaction
 */
function UpdateVaccination(updateVaccinationTx) {
    return genericPermissionMaintainForUpdate(VACCINATION_ASSET, updateVaccinationTx)
}

// Utilities /////////////////////////////////////////////////////////////////////////
function genericPermissionAddForCreate(assetName, createTx) {
    var factory = getFactory();
    return getAssetRegistry(assetName)
        .then(function (assetRegistry) {
            // Extract ServiceHistory and prepare data
            var newAsset = createTx.protectedAsset;
            newAsset.authorized = [];

            // Copy authorized identity to this ServiceHistory
            for (i = 0; i < newAsset.patient.authorizedHcpPermissionRequest.length; i++) {
                newAsset.authorized.push(newAsset.patient.authorizedHcpPermissionRequest[i]);
            }
            return assetRegistry.add(newAsset);
        })
        .catch(function (err) {
            console.log(err);
            throw err;
        });
}

function genericPermissionMaintainForUpdate(assetName, updateTx) {
    var factory = getFactory();
    return getAssetRegistry(assetName)
        .then(function (assetRegistry) {
            var oldAsset = assetRegistry.get(updateTx.protectedAsset.assetId);
            updateTx.authorized = oldAsset.authorized;
            return assetRegistry.update(updateTx.protectedAsset);
        })
        .catch(function (err) {
            console.log(err);
            throw err;
        });
}

function applyPermissionToAssets(assetName, permissionTransaction) {
    var storedProtectedAssetAssetRegistry = null;
    return getAssetRegistry(assetName).then(function (protectedAssetAssetRegistry) {
            // Store for later use
            storedProtectedAssetAssetRegistry = protectedAssetAssetRegistry;
            // Get protected assets
            return storedProtectedAssetAssetRegistry.getAll();
        })
        .then(function (protectedAssets) {
            // Update protected assets
            var hcp = permissionTransaction.healthCareProvider;
            var currentProtectedAsset = null;
            for (i = 0; i < protectedAssets.length; i++) {
                currentProtectedAsset = protectedAssets[i];
                if (permissionTransaction.permissionType == 'GRANT') {
                    if (!currentProtectedAsset.authorized) {
                        currentProtectedAsset.authorized = [];
                    }
                    currentProtectedAsset.authorized.push(hcp);
                } else if (permissionTransaction.permissionType == 'REVOKE') {
                    positionOfHcpInArray = currentProtectedAsset.authorized.indexOf(hcp);
                    currentProtectedAsset.authorized.splice(positionOfHcpInArray, 1);
                }
                storedProtectedAssetAssetRegistry.update(currentProtectedAsset);
            }
            return;
        });
}

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
    } else {
        return;
    }
}
