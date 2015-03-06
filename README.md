#Fechty

## Description

Allow some monitoring thru an visual interface and an API

## Install

Make sure you have ionic : `npm install -g ionic`

Make sure you are using **node v12** --> go use nvm: https://github.com/creationix/nvm and stop make us cry. 

After installation complete, cd to the cloned repo and then,

`npm install`

`bower install`

Use the example config for server-side: `cp server/config.example server/config`
Use the example config for client-side: `cp front-config.example.js www/js/config.js`

Edit the host file for Ansible inventory.
Edit the hosts.json for the path to your hosts file.


## Run

`ionic serve`

It will also start the server part that expose an API. The server run on port `3000` by default and you can change it in config.json in the `/server/config/config.json` directory.