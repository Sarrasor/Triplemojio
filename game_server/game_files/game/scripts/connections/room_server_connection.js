class RoomServerConnection extends Events.Connection
{
	constructor(room_server_url, room_name, player_name, player_class, player_emoji_pack_name, token)
	{
		super();

		this.room_server_url = room_server_url;
		this.room_name = room_name;
		this.player_name = player_name;
		this.player_class = player_class;
		this.player_emoji_pack_name = player_emoji_pack_name;
		this.token = token;
		this.player_id = null;
		
		this.socket = io(this.room_server_url);
		this.room_info = null;

		this.peer_connections = {};
		this.pending_sdps = {};
		this.pending_ice_candidates = {};

		// Add room server message listeners
		this.room_server_handlers = {} 
		this.room_server_handlers[Message.ROOM_INFO] = this.onRoomInfo;
		this.room_server_handlers[Message.PLAYER_JOIN] = this.onPlayerJoin;
		this.room_server_handlers[Message.PLAYER_READY] = this.onPlayerReady;
		this.room_server_handlers[Message.PLAYER_LEAVE] = this.onPlayerLeave;
		this.room_server_handlers[Message.SDP] = this.onSDP;
		this.room_server_handlers[Message.ICE_CANDIDATE] = this.onICECandidate;
		this.room_server_handlers[Message.ERROR_FULL_ROOM] = this.onFullRoom;
		this.room_server_handlers[Message.ERROR_PLAYER_WAS_INITIALIZED] = this.onPlayerWasInitialized;
		Events.on(this.socket, this.room_server_handlers, this);

		// Add peer player message listeners
		this.peer_handlers = {};
	    this.peer_handlers[Message.PEER_OPEN] = this.onPeerChannelOpen;
	    this.peer_handlers[Message.PEER_CLOSE] = this.onPeerChannelClose;
	    this.peer_handlers[Message.PEER_MESSAGE] = this.onPeerMessage;
	}

	destroy()
	{
    	Events.off(this.socket, this.room_server_handlers, this);
	}

	connect()
	{
		this.socket.emit(Message.ROOM_JOIN,
		{
		    room_name: this.room_name,
		    player_name: this.player_name,
		    player_class: this.player_class,
		    player_emoji_pack_name: this.player_emoji_pack_name,
		    token: token
		});
	}

	disconnect()
	{
    	this.socket.emit(Message.ROOM_LEAVE);
	}

	onRoomInfo(data)
	{
    	this.emit(Message.ROOM_JOINED, data);
		this.room_info = data;
		this.player_id = this.room_info.player_id;
		for (var i in this.room_info.players) 
		{
  			var player = this.room_info.players[i];
  			if (player.player_id !== this.player_id)
  			{	
    			this.peer_connections[player.player_id] = this.createPeerConnection(player, true);
  			}
		}
	}

	onPlayerJoin(data)
	{
		this.log("Player with id " + data.player_id + " joined the room", "green");
		this.room_info.players.push(data);
		this.peer_connections[data.player_id] = this.createPeerConnection(data, false);
	}

	createPeerConnection(peer_player, is_initiator) 
	{
		var peer_connection = new PeerConnection(this.socket, peer_player, is_initiator, ICE_SERVERS);
    	Events.on(peer_connection, this.peer_handlers, this, peer_connection, peer_player);

    	// Handle pending SDP
	    var pending_sdp = this.pending_sdps[peer_player.player_id];
	    if (pending_sdp) 
	    {
	      peer_connection.setSDP(pending_sdp);
	      delete this.pending_sdps[peer_player.player_id];
	    }

	    // Handle all pending ICE candidates
	    var pending_ice_candidate_list = this.pending_ice_candidates[peer_player.player_id];
	    if (pending_ice_candidate_list) 
	    {
	      pending_ice_candidate_list.forEach(peer_connection.addICECandidate, peer_connection);
	      delete this.pending_ice_candidates[peer_player.player_id];
	    }

	    return peer_connection;
	}

	onPlayerReady(data)
	{
		this.log("Player with id " + data.player_id + " is ready", "cyan");
		this.emit(Message.PLAYER_READY, data);
	}

	onPlayerLeave(data)
	{
		this.log("Player with id " + data.player_id + " left the room", "green");

		if (!this.peer_connections[data.player_id]) 
		{
  			return;
		}

	    var peer_connection = this.peer_connections[data.player_id];
    	Events.off(peer_connection, this.peer_handlers, this);
	    peer_connection.destroy();
	    delete this.peer_connections[data.player_id];
	    delete this.room_info.players[data.player_id];

	    this.emit(Message.PLAYER_LEAVE, data);
	}

	onSDP(data)
	{
		this.log("Received SDP from player with id " + data.player_id, "green");

		// If we don"t yet have this player as a peer
	    if (!this.peer_connections[data.player_id]) 
	    {
	      this.log("Adding pending SDP from player with id " + data.player_id, "gray");
	      this.pending_sdps[data.player_id] = data.sdp;
	    }
	    else
	    {
	    	this.peer_connections[data.player_id].setSDP(data.sdp);
	    }
	}

	onICECandidate(data)
	{
		this.log("ICE candidate received from player with id" + data.player_id, "green");
		
		// If we don"t yet have this player as a peer
	    if (!this.peer_connections[data.player_id]) 
	    {
	      this.log("Adding pending ICE candidate from player with id " + data.player_id, "gray");
	      if (!this.pending_ice_candidates[data.player_id]) 
	      {
	        this.pending_ice_candidates[data.player_id] = [];
	      }
	      this.pending_ice_candidates[data.player_id].push(data.candidate);
	    }
	    else
	    {
	    	this.peer_connections[data.player_id].addICECandidate(data.candidate);
	    }
	}

	onFullRoom(data)
	{
		this.log("Full room responce received", "red");
	}

	onPlayerWasInitialized(data)
	{
		this.log("Player was initialized before responce received", "red");
	}

	onPeerChannelOpen(peer_player, player) 
	{
    	this.emit(Message.PEER_OPEN, player, peer_player);
  	}

	onPeerChannelClose(peer_player, player)
	{
	    this.emit(Message.PEER_CLOSE, player, peer_player);
	}

    onPeerMessage(peer_player, player, message) 
    {
    	this.emit(Message.PEER_MESSAGE, message, player, peer_player);
    }

	broadcastMessage(message) 
	{
    	for (var peer_id in this.peer_connections) 
	    {
	      this.sendMessageTo(peer_id, message);
	    }
  	}

	sendMessageTo(peer_id, message) 
	{
	    this.peer_connections[peer_id].sendDataChannelMessage(JSON.stringify(message));
	}

	log(message, color) 
	{
    	console.log("%c RoomServerConnection: %s", "color:" + color, message);
  	}
};