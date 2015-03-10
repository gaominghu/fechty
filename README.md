#Fechty

## Description

Allow some monitoring thru an visual interface and an API

## Install

Make sure you have ionic : `npm install -g ionic`

After installation complete, cd to the cloned repo and then,

`npm install`

`bower install`

Use the example config: `cp server/config.example server/config`

Edit the host file for Ansible inventory.


## Run

`ionic serve`

It will also start the server part that expose an API. The server run on port `3000` by default and you can change it in config.json in the `/server/config/config.json` directory.