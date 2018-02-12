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

'use strict';

const AdminConnection = require('composer-admin').AdminConnection;
const BrowserFS = require('browserfs/dist/node/index');
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const path = require('path');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const bfs_fs = BrowserFS.BFSRequire('fs');

const PROFILE_NAME = 'hlfv1';
const NETWORK_NAME = 'depa-blockchain-network';

describe('DEPA-Blockchain-Scenario', () => {

    // This is the business network connection the tests will use.
    let businessNetworkConnection;

    // This is the factory for creating instances of types.
    let factory;

    // These are the identities for Alice and Bob.
    let aliceIdentity;
    let bpkIdentity;
    let ssIdentity;

    // These are a list of receieved events.
    let events;

    // This is called before each test is executed.
    before(() => {

        // Initialize an in-memory file system, so we do not write any files to the actual file system.
        BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());

        // Create a new admin connection.
        const adminConnection = new AdminConnection({
            fs: bfs_fs
        });

        // Create a new connection profile that uses the embedded (in-memory) runtime.
        return adminConnection.createProfile(PROFILE_NAME, {
            type: 'embedded'
        })
            .then(() => {

                // Establish an admin connection. The user ID must be admin. The user secret is
                // ignored, but only when the tests are executed using the embedded (in-memory)
                // runtime.
                return adminConnection.connect(PROFILE_NAME, 'admin', 'adminpw');

            })
            .then(() => {

                // Generate a business network definition from the project directory.
                return BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));

            })
            .then((businessNetworkDefinition) => {

                // Deploy and start the business network defined by the business network definition.
                return adminConnection.deploy(businessNetworkDefinition);

            })
            .then(() => {

                // Create and establish a business network connection
                businessNetworkConnection = new BusinessNetworkConnection({
                    fs: bfs_fs
                });
                events = [];
                businessNetworkConnection.on('event', (event) => {
                    events.push(event);
                });
                return businessNetworkConnection.connect(PROFILE_NAME, NETWORK_NAME, 'admin', 'adminpw');

            })
            .then(() => {
                // Get the factory for the business network.
                factory = businessNetworkConnection.getBusinessNetwork().getFactory();

                // Create the participants.
                const alice = factory.newResource('com.depa.blockchain.core', 'Patient', 'alice@phr-app.com');
                alice.prename = 'Miss';
                alice.name = 'Alice';
                alice.surname = 'A.';
                alice.dateTimeUpdate = new Date();

                return businessNetworkConnection.getParticipantRegistry('com.depa.blockchain.core.Patient')
                    .then((participantRegistry) => {
                        participantRegistry.addAll([alice]);
                    });
            })
            .then(() => {
                // Get the factory for the business network.
                factory = businessNetworkConnection.getBusinessNetwork().getFactory();

                // Create the participants.
                const bpk = factory.newResource('com.depa.blockchain.core', 'HealthCareProvider', 'hcp:bpk');
                bpk.healthCareProviderName = 'Bangkok Hospital - Phuket';
                bpk.dateTimeUpdate = new Date();
                const ss = factory.newResource('com.depa.blockchain.core', 'HealthCareProvider', 'hcp:ss');
                ss.healthCareProviderName = 'Pensook Clinic';
                ss.dateTimeUpdate = new Date();

                return businessNetworkConnection.getParticipantRegistry('com.depa.blockchain.core.HealthCareProvider')
                    .then((participantRegistry) => {
                        participantRegistry.addAll([bpk, ss]);
                    });
            })
            .then(() => {
                // Create the assets.
                const asset1 = factory.newResource('com.depa.blockchain.assets', 'CheckupHistory', 'testCheckupHistory:1');
                asset1.checkupHistoryId = 'chk-test-001';
                asset1.dateTimeServe = '2016-03-23T15:54:47';
                asset1.pulse = '81';
                asset1.pressure = '116/93';
                asset1.cbc_wbc = '7.2';
                asset1.hct = '43.6';
                asset1.hb = '14.8';
                asset1.ph = '6';
                asset1.rbc = '5.07';
                asset1.sugar = 'Negative';
                asset1.spgr = '1.03';
                asset1.fbs = '110';
                asset1.bun = '9';
                asset1.creatinine = '1.03';
                asset1.uric = '';
                asset1.chlt = '222';
                asset1.trig = '278';
                asset1.hdl = '';
                asset1.ldl = '';
                asset1.sgot = '59';
                asset1.sgpt = '26';
                asset1.eos = '0';
                asset1.lym = '34';
                asset1.mono = '11';
                asset1.dateTimeUpdate = '2016-03-23T15:54:47';
                asset1.assetId = 'assetId-test-001';
                asset1.patient = factory.newRelationship('com.depa.blockchain.core', 'Patient', 'alice@phr-app.com');
                asset1.healthCareProvider = factory.newRelationship('com.depa.blockchain.core', 'HealthCareProvider', 'hcp:bpk');

                const asset2 = factory.newResource('com.depa.blockchain.assets', 'CheckupHistory', 'testCheckupHistory:2');
                asset2.checkupHistoryId = 'chk-test-002';
                asset2.dateTimeServe = '2016-03-23T15:54:47';
                asset2.pulse = '81';
                asset2.pressure = '116/93';
                asset2.cbc_wbc = '7.2';
                asset2.hct = '43.6';
                asset2.hb = '14.8';
                asset2.ph = '6';
                asset2.rbc = '5.07';
                asset2.sugar = 'Negative';
                asset2.spgr = '1.03';
                asset2.fbs = '110';
                asset2.bun = '9';
                asset2.creatinine = '1.03';
                asset2.uric = '';
                asset2.chlt = '222';
                asset2.trig = '278';
                asset2.hdl = '';
                asset2.ldl = '';
                asset2.sgot = '59';
                asset2.sgpt = '26';
                asset2.eos = '0';
                asset2.lym = '34';
                asset2.mono = '11';
                asset2.dateTimeUpdate = '2016-03-23T15:54:47';
                asset2.assetId = 'assetId00072';
                asset2.patient = factory.newRelationship('com.depa.blockchain.core', 'Patient', 'alice@phr-app.com');
                asset2.healthCareProvider = factory.newRelationship('com.depa.blockchain.core', 'HealthCareProvider', 'hcp:ss');
                return businessNetworkConnection.getAssetRegistry('com.depa.blockchain.assets.CheckupHistory')
                    .then((assetRegistry) => {
                        assetRegistry.addAll([asset1, asset2]);
                    });
            })
            .then(() => {
                // Issue the identities.
                return businessNetworkConnection.issueIdentity('com.depa.blockchain.core.Patient#alice@phr-app.com', 'alice')
                    .then((identity) => {
                        aliceIdentity = identity;
                        return businessNetworkConnection.issueIdentity('com.depa.blockchain.core.HealthCareProvider#hcp:bpk', 'bpk');
                    })
                    .then((identity) => {
                        bpkIdentity = identity;
                        return businessNetworkConnection.issueIdentity('com.depa.blockchain.core.HealthCareProvider#hcp:ss', 'ss');
                    })
                    .then((identity) => {
                        ssIdentity = identity;
                    });
            });

    });

    /**
     * Reconnect using a different identity.
     * @param {Object} identity The identity to use.
     * @return {Promise} A promise that will be resolved when complete.
     */
    function useIdentity(identity) {
        return businessNetworkConnection.disconnect()
            .then(() => {
                businessNetworkConnection = new BusinessNetworkConnection({
                    fs: bfs_fs
                });
                events = [];
                businessNetworkConnection.on('event', (event) => {
                    events.push(event);
                });
                return businessNetworkConnection.connect(PROFILE_NAME, NETWORK_NAME, identity.userID, identity.userSecret);
            });
    }

    it('Alice should be able to read all data of herself', () => {
        // Use the identity for Alice.
        return useIdentity(aliceIdentity)
            .then(() => {
                // Get the assets.
                return businessNetworkConnection.getAssetRegistry('com.depa.blockchain.assets.CheckupHistory')
                    .then((assetRegistry) => {
                        return assetRegistry.getAll();
                    });
            })
            .then((assets) => {
                // Validate the assets.
                assets.should.have.lengthOf(2);
            });
    });

    it('BPK should not read any Alice\'s assets without permission', () => {
        // Use the identity for Alice.
        return useIdentity(bpkIdentity)
            .then(() => {
                // Get the assets.
                return businessNetworkConnection.getAssetRegistry('com.depa.blockchain.assets.CheckupHistory')
                    .then((assetRegistry) => {
                        return assetRegistry.getAll();
                    });
            })
            .then((assets) => {
                // Validate the assets.
                assets.should.have.lengthOf(0);
            });
    });

    it('SS should not read any Alice\'s assets without permission', () => {
        // Use the identity for Alice.
        return useIdentity(ssIdentity)
            .then(() => {
                // Get the assets.
                return businessNetworkConnection.getAssetRegistry('com.depa.blockchain.assets.CheckupHistory')
                    .then((assetRegistry) => {
                        return assetRegistry.getAll();
                    });
            })
            .then((assets) => {
                // Validate the assets.
                assets.should.have.lengthOf(0);
            });
    });

    it('BPK should be able to request permission to Alice', () => {
        let requestPermission = factory.newTransaction('com.depa.blockchain.core', 'PermissionTransaction', 'txRequest1');
        requestPermission.permissionType = 'REQUEST';
        requestPermission.patient = factory.newRelationship('com.depa.blockchain.core', 'Patient', 'alice@phr-app.com');
        requestPermission.healthCareProvider = factory.newRelationship('com.depa.blockchain.core', 'HealthCareProvider', 'hcp:bpk');

        return useIdentity(bpkIdentity)
            .then(() => {
                return businessNetworkConnection.submitTransaction(requestPermission);
            }).then(() => {
                return businessNetworkConnection.getParticipantRegistry('com.depa.blockchain.core.Patient');
            }).then((participantRegistry) => {
                return participantRegistry.get('alice@phr-app.com');
            }).then((alice) => {
                alice.should.have.property('pendingHcpPermissionRequest').be.lengthOf(1);
            });
    });

    it('Alice should be able to grant permission to BPK', () => {
        let grantPermission = factory.newTransaction('com.depa.blockchain.core', 'PermissionTransaction', 'txRequest2');
        grantPermission.permissionType = 'GRANT';
        grantPermission.patient = factory.newRelationship('com.depa.blockchain.core', 'Patient', 'alice@phr-app.com');
        grantPermission.healthCareProvider = factory.newRelationship('com.depa.blockchain.core', 'HealthCareProvider', 'hcp:bpk');

        return useIdentity(aliceIdentity)
            .then(() => {
                return businessNetworkConnection.submitTransaction(grantPermission);
            })
            .then(() => {
                return businessNetworkConnection.getParticipantRegistry('com.depa.blockchain.core.Patient');
            }).then((participantRegistry) => {
                return participantRegistry.get('alice@phr-app.com');
            }).then((alice) => {
                alice.should.have.property('authorizedHcpPermissionRequest').be.lengthOf(1);
            });
    });

    it('BPK should be able to read any Alice\'s assets with her permission', () => {
        // Use the identity for Alice.
        return useIdentity(bpkIdentity)
            .then(() => {
                // Get the assets.
                return businessNetworkConnection.getAssetRegistry('com.depa.blockchain.assets.CheckupHistory')
                    .then((assetRegistry) => {
                        return assetRegistry.getAll();
                    });
            })
            .then((assets) => {
                // Validate the assets.
                assets.should.have.lengthOf(2);
            });
    });

    it('BPK should be able to create Vaccination record on Alice', () => {
        let vaccinationAsset = factory.newResource('com.depa.blockchain.assets', 'Vaccination', 'testVaccination:1');
        vaccinationAsset.vaccineName = 'Vaccine #1';
        vaccinationAsset.vaccineType = 'VaccineType #1';
        vaccinationAsset.dateTimeServe = new Date();
        vaccinationAsset.patient = factory.newRelationship('com.depa.blockchain.core', 'Patient', 'alice@phr-app.com');
        vaccinationAsset.healthCareProvider = factory.newRelationship('com.depa.blockchain.core', 'HealthCareProvider', 'hcp:bpk');

        let assetRegistry = null;
        return useIdentity(bpkIdentity)
            .then(() => {
                return businessNetworkConnection.getAssetRegistry('com.depa.blockchain.assets.Vaccination');
            }).then((_assetRegistry) => {
                assetRegistry = _assetRegistry;
                return assetRegistry.add(vaccinationAsset);
            }).then(() => {
                return assetRegistry.getAll();
            }).then((assets) => {
                assets.should.have.lengthOf(1);
            });
    });

    it('BPK should be able to run CheckupResultProduced TX on Alice', () => {
        let checkupHistoryAsset = factory.newResource('com.depa.blockchain.assets', 'CheckupHistory', 'testCheckupHistory:3');
        checkupHistoryAsset.checkupHistoryId = 'chk-test-003';
        checkupHistoryAsset.dateTimeServe = '2016-03-23T15:54:47';
        checkupHistoryAsset.pulse = '81';
        checkupHistoryAsset.pressure = '116/93';
        checkupHistoryAsset.cbc_wbc = '7.2';
        checkupHistoryAsset.hct = '43.6';
        checkupHistoryAsset.hb = '14.8';
        checkupHistoryAsset.ph = '6';
        checkupHistoryAsset.rbc = '5.07';
        checkupHistoryAsset.sugar = 'Negative';
        checkupHistoryAsset.spgr = '1.03';
        checkupHistoryAsset.fbs = '110';
        checkupHistoryAsset.bun = '9';
        checkupHistoryAsset.creatinine = '1.03';
        checkupHistoryAsset.uric = '';
        checkupHistoryAsset.chlt = '222';
        checkupHistoryAsset.trig = '278';
        checkupHistoryAsset.hdl = '';
        checkupHistoryAsset.ldl = '';
        checkupHistoryAsset.sgot = '59';
        checkupHistoryAsset.sgpt = '26';
        checkupHistoryAsset.eos = '0';
        checkupHistoryAsset.lym = '34';
        checkupHistoryAsset.mono = '11';
        checkupHistoryAsset.dateTimeUpdate = '2016-03-23T15:54:47';
        checkupHistoryAsset.assetId = 'assetId00071';
        checkupHistoryAsset.patient = factory.newRelationship('com.depa.blockchain.core', 'Patient', 'alice@phr-app.com');
        checkupHistoryAsset.healthCareProvider = factory.newRelationship('com.depa.blockchain.core', 'HealthCareProvider', 'hcp:bpk');

        let checkupResultProducedTx = factory.newTransaction('com.depa.blockchain.core', 'CheckupResultProducedTransaction', 'txCheckupResultProduced:1');
        checkupResultProducedTx.checkupHistory = checkupHistoryAsset;

        return useIdentity(bpkIdentity)
            .then(() => {
                return businessNetworkConnection.submitTransaction(checkupResultProducedTx);
            }).then(() => {
                return businessNetworkConnection.getAssetRegistry('com.depa.blockchain.assets.CheckupHistory');
            }).then((assetRegistry) => {
                return assetRegistry.getAll();
            }).then((assets) => {
                assets.should.have.lengthOf(3);
            }).catch((err) => {
                console.log(err);
                throw err;
            });
    });

    it('Alice should be able to revoke permission of BPK', () => {
        let grantPermission = factory.newTransaction('com.depa.blockchain.core', 'PermissionTransaction', 'txRequest3');
        grantPermission.permissionType = 'REVOKE';
        grantPermission.patient = factory.newRelationship('com.depa.blockchain.core', 'Patient', 'alice@phr-app.com');
        grantPermission.healthCareProvider = factory.newRelationship('com.depa.blockchain.core', 'HealthCareProvider', 'hcp:bpk');

        return useIdentity(aliceIdentity)
            .then(() => {
                return businessNetworkConnection.submitTransaction(grantPermission);
            })
            .then(() => {
                return businessNetworkConnection.getParticipantRegistry('com.depa.blockchain.core.Patient');
            }).then((participantRegistry) => {
                return participantRegistry.get('alice@phr-app.com');
            }).then((alice) => {
                alice.should.have.property('authorizedHcpPermissionRequest').be.lengthOf(0);
            });
    });

    it('BPK should not read any Alice\'s assets without permission', () => {
        // Use the identity for Alice.
        return useIdentity(bpkIdentity)
            .then(() => {
                // Get the assets.
                return businessNetworkConnection.getAssetRegistry('com.depa.blockchain.assets.CheckupHistory')
                    .then((assetRegistry) => {
                        return assetRegistry.getAll();
                    });
            })
            .then((assets) => {
                // Validate the assets.
                assets.should.have.lengthOf(0);
            });
    });

    it('SS should be able to request permission to Alice', () => {
        let requestPermission = factory.newTransaction('com.depa.blockchain.core', 'PermissionTransaction', 'txRequest4');
        requestPermission.permissionType = 'REQUEST';
        requestPermission.patient = factory.newRelationship('com.depa.blockchain.core', 'Patient', 'alice@phr-app.com');
        requestPermission.healthCareProvider = factory.newRelationship('com.depa.blockchain.core', 'HealthCareProvider', 'hcp:ss');

        return useIdentity(bpkIdentity)
            .then(() => {
                return businessNetworkConnection.submitTransaction(requestPermission);
            }).then(() => {
                return businessNetworkConnection.getParticipantRegistry('com.depa.blockchain.core.Patient');
            }).then((participantRegistry) => {
                return participantRegistry.get('alice@phr-app.com');
            }).then((alice) => {
                alice.should.have.property('pendingHcpPermissionRequest').be.lengthOf(1);
            });
    });

    it('Alice should be able to grant permission to BPK', () => {
        let grantPermission = factory.newTransaction('com.depa.blockchain.core', 'PermissionTransaction', 'txRequest5');
        grantPermission.permissionType = 'GRANT';
        grantPermission.patient = factory.newRelationship('com.depa.blockchain.core', 'Patient', 'alice@phr-app.com');
        grantPermission.healthCareProvider = factory.newRelationship('com.depa.blockchain.core', 'HealthCareProvider', 'hcp:ss');

        return useIdentity(aliceIdentity)
            .then(() => {
                return businessNetworkConnection.submitTransaction(grantPermission);
            })
            .then(() => {
                return businessNetworkConnection.getParticipantRegistry('com.depa.blockchain.core.Patient');
            }).then((participantRegistry) => {
                return participantRegistry.get('alice@phr-app.com');
            }).then((alice) => {
                alice.should.have.property('authorizedHcpPermissionRequest').be.lengthOf(1);
            });
    });

    it('SS should be able to read any Alice\'s vaccination assets with her permission', () => {
        // Use the identity for Alice.
        return useIdentity(ssIdentity)
            .then(() => {
                // Get the assets.
                return businessNetworkConnection.getAssetRegistry('com.depa.blockchain.assets.Vaccination')
                    .then((assetRegistry) => {
                        return assetRegistry.getAll();
                    });
            })
            .then((assets) => {
                // Validate the assets.
                assets.should.have.lengthOf(1);
            });
    });

    it('BPK should be able to read any Alice\'s vaccination assets without her permission', () => {
        // Use the identity for Alice.
        return useIdentity(bpkIdentity)
            .then(() => {
                // Get the assets.
                return businessNetworkConnection.getAssetRegistry('com.depa.blockchain.assets.Vaccination')
                    .then((assetRegistry) => {
                        return assetRegistry.getAll();
                    });
            })
            .then((assets) => {
                // Validate the assets.
                assets.should.have.lengthOf(0);
            });
    });

    it('BPK should be able to submit late Vaccination record for Alice without her permission', () => {
        let vaccinationAsset = factory.newResource('com.depa.blockchain.assets', 'Vaccination', 'testVaccination:2');
        vaccinationAsset.vaccineName = 'Vaccine #2';
        vaccinationAsset.vaccineType = 'VaccineType #2';
        vaccinationAsset.dateTimeServe = new Date();
        vaccinationAsset.patient = factory.newRelationship('com.depa.blockchain.core', 'Patient', 'alice@phr-app.com');
        vaccinationAsset.healthCareProvider = factory.newRelationship('com.depa.blockchain.core', 'HealthCareProvider', 'hcp:bpk');

        let assetRegistry = null;
        return useIdentity(bpkIdentity)
            .then(() => {
                return businessNetworkConnection.getAssetRegistry('com.depa.blockchain.assets.Vaccination');
            }).then((_assetRegistry) => {
                assetRegistry = _assetRegistry;
                return assetRegistry.add(vaccinationAsset);
            }).then(() => {
                return assetRegistry.getAll();
            }).then((assets) => {
                assets.should.have.lengthOf(0);
            });
    });

    it('SS should be see two Alice\'s vaccination assets using her permission', () => {
        // Use the identity for Alice.
        return useIdentity(ssIdentity)
            .then(() => {
                // Get the assets.
                return businessNetworkConnection.getAssetRegistry('com.depa.blockchain.assets.Vaccination')
                    .then((assetRegistry) => {
                        return assetRegistry.getAll();
                    });
            })
            .then((assets) => {
                assets.should.have.lengthOf(2);
            });
    });
});