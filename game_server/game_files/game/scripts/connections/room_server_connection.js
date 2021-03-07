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
		
		this.socket = io(this.room_server_url);
		this.room_info = null;

		this.peer_connections = {};
		this.pending_sdps = {};
		this.pending_ice_candidates = {};

		this.room_server_handlers = {} 
		this.room_server_handlers[Message.ROOM_INFO] = this.onRoomInfo;
		this.room_server_handlers[Message.PLAYER_JOIN] = this.onPlayerJoin;
		this.room_server_handlers[Message.PLAYER_READY] = this.onPlayerReady;
		this.room_server_handlers[Message.PLAYER_LEAVE] = this.onPlayerLeave;
		this.room_server_handlers[Message.SDP] = this.onSdp;
		this.room_server_handlers[Message.ICE_CANDIDATE] = this.onIceCandidate;
		this.room_server_handlers[Message.ERROR_FULL_ROOM] = this.onFullRoom;
		this.room_server_handlers[Message.ERROR_PLAYER_WAS_INITIALIZED] = this.onPlayerWasInitialized;

		this.peer_handlers = {};
	    this.peer_handlers['open'] = this.onPeerChannelOpen;
	    this.peer_handlers['close'] = this.onPeerChannelClose;
	    this.peer_handlers['message'] = this.onPeerMessage;

		Events.on(this.socket, this.room_server_handlers, this);
	}

	destroy()
	{
    	Events.off(this.socket, this.room_server_handlers, this);
	}

	onRoomInfo(data)
	{
    	this.emit('joined', data);
		this.room_info = data;
		for (var i in this.room_info.players) 
		{
  			var player = this.room_info.players[i];
  			if (player.player_id !== this.room_info.player_id)
  			{	
    			this.peer_connections[player.player_id] = this.createPeerConnection(player, true);
  			}
		}
	}

	onPlayerJoin(data)
	{
		this.log('Player with id ' + data.player_id + ' joined the room', 'green');
		
		var peer_connection = this.createPeerConnection(data, false);
		this.room_info.players.push(data);
		this.peer_connections[data.player_id] = peer_connection;
	}

	createPeerConnection(peer_player, is_initiator) 
	{
		var peer_connection = new PeerConnection(this.socket, peer_player, is_initiator, ICE_SERVERS);
    	Events.on(peer_connection, this.peer_handlers, this, peer_connection, peer_player);

	    var pending_sdp = this.pending_sdps[peer_player.player_id];
	    if (pending_sdp) 
	    {
	      peer_connection.setSdp(pending_sdp);
	      delete this.pending_sdps[peer_player.player_id];
	    }

	    var pending_candidate = this.pending_ice_candidates[peer_player.player_id];
	    if (pending_candidate) 
	    {
	      pending_candidate.forEach(peer_connection.addIceCandidate, peer_connection);
	      delete this.pending_ice_candidates[peer_player.player_id];
	    }

	    return peer_connection;
	}

	onPlayerReady(data)
	{
		this.log('Player with id ' + data.player_id + ' is ready', 'orange');
		this.socket.emit(Message.PLAYER_READY, data);
	}

	onPlayerLeave(data)
	{
		this.log('Player with id ' + data.player_id + ' left the room', 'green');

		if (!this.peer_connections[data.player_id]) 
		{
  			return;
		}
	    var peer_connection = this.peer_connections[data.player_id];
    	Events.off(peer_connection, this.peer_handlers, this);
	    peer_connection.destroy();
	    delete this.peer_connections[data.player_id];
	    delete this.room_info.players[data.player_id];

	    this.emit('remote_player_leave', data);
	}

	onSdp(data)
	{
		this.log("Received Sdp from player with id " + data.player_id, 'orange');

	    if (!this.peer_connections[data.player_id]) 
	    {
	      this.log('Adding pending sdp from player with id ' + data.player_id, 'gray');
	      this.pending_sdps[data.player_id] = data.sdp;
	      return;
	    }

	    this.peer_connections[data.player_id].setSdp(data.sdp);
	}

	onIceCandidate(data)
	{
		this.log("Ice candidate received from player with id" + data.player_id, 'orange');
		 
	    if (!this.peer_connections[data.player_id]) 
	    {
	      this.log('Adding pending candidate from player with id ' + data.player_id, 'gray');
	      if (!this.pending_ice_candidates[data.player_id]) 
	      {
	        this.pending_ice_candidates[data.player_id] = [];
	      }
	      this.pending_ice_candidates[data.player_id].push(data.candidate);
	      return;
	    }

	    this.peer_connections[data.player_id].addIceCandidate(data.candidate);
	}

	onFullRoom(data)
	{
		this.log("Full room responce received", 'red');
	}

	onPlayerWasInitialized(data)
	{
		this.log("Player was initialized before", 'red');
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

	onPeerChannelOpen(peer_player, player) 
	{
    	this.emit('open', player, peer_player);
  	}

	onPeerChannelClose(peer_player, player)
	{
	    this.emit('close', player, peer_player);
	}

    onPeerMessage(peer_player, player, message) 
    {
    	this.emit('message', message, player, peer_player);
    }

	broadcastMessage(message) 
	{
    	this.broadcast(JSON.stringify(message));
  	}

	sendMessageTo(peer_id, message) 
	{
	    var peer = this.peer_connections[peer_id];
	    this.peerSend(peer, JSON.stringify(message));
	}

	broadcast(serialized_message) 
	{
	    for (var i in this.peer_connections) 
	    {
	      this.peerSend(this.peer_connections[i], serialized_message);
	    }
	}

	peerSend(peer, serialized_message) 
	{
    	peer.sendMessage(serialized_message);
  	}

	log(message, color) 
	{
    	console.log('RoomServerConnection: %c%s', 'color:' + color, message);
  	}
};