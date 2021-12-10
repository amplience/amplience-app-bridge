# amplience-app-bridge

## Overview
When creating an Amplience app, this library must be included within your app to communicate with the platform. The bridge library will provide hooks for:

- Initializing your application, passing in activation data such as which assets were selected.
- Authentication and token management.
- Callbacks for drag and drop.
- Callbacks for change in asset selection.
- Application lifecycle callbacks. Application closure hooks, opportunity to prompt before app closure.

## Usage
Within the client app, connect to the host using `var host = new amp.Host();`, add a ready callback with `host.onReady(function(){})`


After the ready callback has been called, you can retrieve a token for use in requests to the API by accessing the currentToken property on `host`.
Tokens should not be stored, you should refer directly to `host.currentToken` with each request.


Any data sent from the host is accessible using `host.activationData`. Currently, this includes `baseURL` and optionally `assets`.


Example:

    var host = new amp.Host();
    host.onReady(function(){
        $.ajax({
            url: host.activationData.baseURL+'/assets/'+host.activationData.assets.join(','),
            headers: {
                'X-Amp-Auth': host.currentToken
            }
        })
    });

## Licensing
This library is licensed under Apache-2.0. It uses a modified version of Mozilla jschannel which is licensed under MPL 1.1. A copy of the license and documentation related to the changes can be found in [lib/jschannel.js](/lib/jschannel.js)