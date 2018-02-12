#!/bin/bash
git pull
composer archive create -t dir -n .
composer network deploy -a my-network@0.1.8.bna -A admin -S adminpw -c PeerAdmin@hlfv1
composer card import -f admin@my-network.card
