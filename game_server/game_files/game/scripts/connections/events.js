// Connection classes + utils to subscribe/unsubscribe events in different ways:
// addEventListener/removeEventListener for RTCPeerConnection etc
// on/off for socket.io sockets

class Connection
{
  constructor()
  {
  	this.last_token = 0;
    this.subscribers = {};
  }

  destroy() 
  {
    this.subscribers = null;
  }

  emit(event) 
  {
    var emit_arguments = [].slice.call(arguments, 1);
    for (var i in this.subscribers) 
    {
      var subscriber = this.subscribers[i];
      if (subscriber.event === event) 
      {
        subscriber.handler.apply(subscriber.context, emit_arguments);
      }
    }
  }

  on(event, handler, context) 
  {
    var token = ++this.last_token;
    this.subscribers[token] = {
							    event: event,
							    handler: handler,
							    context: context
							  };

    return token;
  }

  off(token) 
  {
    delete this.subscribers[token];
  }
}

Events = 
{
  Connection: Connection,

  listen: function() 
  {
    this._listen('addEventListener', arguments);
  },

  unlisten: function() 
  {
    this._unlisten('removeEventListener', arguments);
  },

  on: function() 
  {
    this._listen('on', arguments);
  },

  off: function() 
  {
    this._unlisten('off', arguments);
  },

  _listen: function(method, argsObject) 
  {
    var args = [].slice.apply(argsObject);
    var object = args[0];
    var handlers = args[1];
    var context = args[2];
    var bindArgs = args.slice(2);
    for (var k in handlers) 
    {
      var bound = context[k + '_bound'] = handlers[k].bind.apply(handlers[k], bindArgs);
      object[method](k, bound);
    }
  },

  _unlisten: function(method, args) 
  {
    var object = args[0];
    var handlers = args[1];
    var context = args[2];
    for (var k in handlers) 
    {
      object[method](k, context[k + '_bound']);
    }
  }
};