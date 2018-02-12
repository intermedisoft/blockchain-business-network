#!/bin/bash
git pull
composer archive create -t dir -n .
composer network deploy -a depa-blockchain-network@1.0.0.bna -A admin -S adminpw -c PeerAdmin@hlfv1
composer card import -f admin@depa-blockchain-network.card
