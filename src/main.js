(function(window, Channel){

    var ids = 0;
    var CallbackHandler = function(){
        this.callbacks = [];
    };
    CallbackHandler.prototype.register = function(callback){
        var id = ids++;
        var self = this;
        var deregister = function(){
            for(var i = 0; i < self.callbacks.length; i++){
                if(self.callbacks[i].id == id){
                    self.callbacks.splice(i, 1);
                    break;
                }
            }
        };
        var handler = {
            id: id,
            handler: callback,
            deregister: deregister
        };
        this.callbacks.push(handler);
        return handler;
    };
    CallbackHandler.prototype.deregister = function(id){
        for(var i = 0; i < this.callbacks.length; i++){
            if(this.callbacks[i].id == id){
                this.callbacks[i].deregister();
            }
        }
    };
    CallbackHandler.prototype.dispatch = function(data){
        for(var i = 0; i < this.callbacks.length; i++){
            this.callbacks[i].handler(data);
        }
    };

    var didInit = null;
    var callbacks = null;

    var Host = function(){
        var self = this;
        this.onActivateManager = new CallbackHandler();
        this.onDeactivateManager = new CallbackHandler();
        this.onAssetSelectedManager = new CallbackHandler();
        this.onAssetDroppedManager = new CallbackHandler();

        var stripSlash = function(url){
            return (url.indexOf('/', url.length - 1) !== -1) ? url.slice(0, -1) : url;
        };

        var errorFn = function(){
            didInit = 'error';
            if(callbacks){
                callbacks.error();
            }
        };

        var successFn = function(response){
            self.currentToken = response.token;
            self.activationData = response.activationData;
            if(self.activationData.baseURL){
                self.activationData.baseURL = stripSlash(self.activationData.baseURL);
            }
            if(callbacks){
                callbacks.success({token: self.currentToken, activationData: self.activationData});
            }
            didInit = 'success';
        };

        var buildChannel = function(window){
            self.channel = Channel.build({window: window, origin: "*", scope: "Amplience", onReady: function(){
                self.channel.call({method: 'requestInitialData', success: successFn, error: errorFn});
            }});
            self.channel.bind('tokenRefreshed', function(ctx, params){
                self.currentToken = params;
            });
            self.channel.bind("onActivate", function(context, params) {
                self.onActivateManager.dispatch(params);
            });
            self.channel.bind("onDeactivate", function(context, params) {
                self.onDeactivateManager.dispatch(params);
            });
            self.channel.bind("onAssetSelected", function(context, params) {
                self.onAssetSelectedManager.dispatch(params);
            });
            self.channel.bind("onAssetDropped", function(context, params) {
                self.onAssetDroppedManager.dispatch(params);
            });
            self.channel.bind("checkClose", function() {
                if(self.checkCloseCallback){
                    return self.checkCloseCallback();
                }else{
                    return false;
                }
            });
            //TODO: An on exit handler may be useful, so that apps can reject an exit (e.g. if unsaved changes)
            //If the user requests an exit a second time, we should honour it though (someone will inevitably make an unexitable app)
        };

        try{
            buildChannel(window.parent);
        }catch(e){
            try{
                buildChannel(window);
            }catch(e){
                console.log("Failed to create postMessage channel. Is the app inside an iframe?");
                errorFn();
            }
        }
    };

    Host.prototype.onReady = function(success, error){
        var self = this;
        if(didInit == 'success'){
            success({token: self.currentToken, activationData: self.activationData});
        }else if(didInit == 'error'){
            error();
        }else{
            callbacks = {success: success, error:error};
        }
    };

    Host.prototype.onActivate = function(cb){
        return this.onActivateManager.register(cb);
    };

    Host.prototype.onDeactivate = function(cb){
        return this.onDeactivateManager.register(cb);
    };

    Host.prototype.onAssetSelected = function(cb){
        return this.onAssetSelectedManager.register(cb);
    };

    Host.prototype.onAssetDropped = function(cb){
        return this.onAssetDroppedManager.register(cb);
    };

    Host.prototype.checkClose = function(cb){
        this.checkCloseCallback = cb;
    };

    Host.prototype.exit = function(){
        this.channel.notify({method: 'exit'});
    };

    window.amp = window.amp || {};
    window.amp.Host = Host;

})(window, Channel);