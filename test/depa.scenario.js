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
const NETWORK_NAME = 'my-network';

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
    beforeEach(() => {

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
                const asset1 = factory.newResource('com.depa.blockchain.assets', 'ServiceHistory', 'testServiceHistory:1');
                asset1.patient = factory.newRelationship('com.depa.blockchain.core', 'Patient', 'alice@phr-app.com');
                asset1.healthCareProvider = factory.newRelationship('com.depa.blockchain.core', 'HealthCareProvider', 'hcp:bpk');
                const asset2 = factory.newResource('com.depa.blockchain.assets', 'ServiceHistory', 'testServiceHistory:2');
                asset2.patient = factory.newRelationship('com.depa.blockchain.core', 'Patient', 'alice@phr-app.com');
                asset2.healthCareProvider = factory.newRelationship('com.depa.blockchain.core', 'HealthCareProvider', 'hcp:ss');
                return businessNetworkConnection.getAssetRegistry('com.depa.blockchain.assets.ServiceHistory')
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
                return businessNetworkConnection.getAssetRegistry('com.depa.blockchain.assets.ServiceHistory')
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
                return businessNetworkConnection.getAssetRegistry('com.depa.blockchain.assets.ServiceHistory')
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
                return businessNetworkConnection.getAssetRegistry('com.depa.blockchain.assets.ServiceHistory')
                    .then((assetRegistry) => {
                        return assetRegistry.getAll();
                    });
            })
            .then((assets) => {
                // Validate the assets.
                assets.should.have.lengthOf(0);
            });
    });
});
