const LOCAL = false;
const HOSTNAME = "1f994c4db413.ngrok.io";

var log = console.log.bind(console);
var map_generator = require('./map_generator');

var ROOM_SERVER_PORT = 1337;
var ROOM_CAPACITY = 6;

var fs = require('fs');
const https = require("https");

var options = 
{
	requestCert: false,
	rejectUnauthorized: false
};

if (LOCAL)
{
	options["cert"] = fs.readFileSync("./certificates/cert.pem");
	options["key"] = fs.readFileSync("./certificates/key.pem");
}
else
{
	options["cert"] = fs.readFileSync("/etc/letsencrypt/live/" + HOSTNAME + "/fullchain.pem");
	options["key"] = fs.readFileSync("/etc/letsencrypt/live/" + HOSTNAME + "/privkey.pem");
}

var server = https.createServer(options);
server.listen(ROOM_SERVER_PORT);

var io = require('socket.io')(server, 
{
	cors: 
	{
    	origin: '*'
    }
});

var rooms = {};
var last_room_id = 0;
var last_user_id = 0;

var Message = 
{
	GET_ROOM_LIST: "get_room_list", // Request all available rooms
	ROOM_LIST: "room_list", // All available rooms

	ROOM_JOIN: "room_join", // Request from the player to join a room
	ROOM_LEAVE: "room_leave", // Request from the player to leave a room
	ROOM_INFO: "room_info", // Room info responce on ROOM_JOIN
	
	PLAYER_JOIN: "player_join", // When remote player joins a room
	PLAYER_READY: "player_ready", // When remote player in a room is ready
	PLAYER_LEAVE: "player_leave", // When remote player leaves a room

	SDP: "sdp",
	ICE_CANDIDATE: "ice_candidate",

	ERROR_FULL_ROOM: "error_full_room",
	ERROR_USER_INITIALIZED: "error_player_initialized"
};

class Player
{
	constructor(player_id, player_name, player_class, player_emoji_pack_name, token)
	{
		this.player_id = player_id;
		this.player_name = player_name;
		this.player_class = player_class;
		this.player_emoji_pack_name = player_emoji_pack_name;
		this.token = token;
	}	

	getId()
	{
		return this.player_id;
	}

	getName()
	{
		return this.player_name;
	}

	getPlayerClass()
	{
		return this.player_class;
	}

	getEmojiPackName()
	{
		return this.player_emoji_pack_name;
	}

	getToken()
	{
		return this.token;
	}

	getInfoMessage()
	{
		const message = 
		{
			player_id: this.getId(),
			player_name: this.getName(),
			player_class: this.getPlayerClass(),
			player_emoji_pack_name: this.getEmojiPackName()
		};
		return message;
	}
}

class Room
{
	constructor(room_name)
	{
		this.room_name = room_name;
  		this.players = [];
  		this.sockets = {};
  		this.map = map_generator.generate_map();
	}

	getName() 
	{
    	return this.room_name;
  	}

  	getMap() 
	{
    	return this.map;
  	}

  	getPlayers()
  	{
  		return this.players;
  	}

  	getPlayerById(player_id)
  	{
  		return this.players.find(function(player)
  		{
  			return player.getId() === player_id;
  		});
  	}

  	getPlayerByToken(token)
  	{
  		return this.players.find(function(player)
  		{
  			return player.getToken() === token;
  		});
  	}

  	size()
  	{
  		return this.players.length;
  	}

  	isEmpty()
  	{
  		return this.size() === 0;
  	}

  	addPlayer(player, socket)
  	{
  		this.players.push(player);
  		this.sockets[player.getId()] = socket;
  	}

  	removePlayer(player_id)
  	{
  		this.players = this.players.filter(function(player) 
  		{
  			return player.getId() !== player_id;
    	});
    	delete this.sockets[player_id];
  	}

  	messageToPlayer(player_id, message_type, data)
  	{
    	this.sockets[player_id].emit(message_type, data);
  	}

  	broadcastFromPlayer(from_player_id, message_type, data)
  	{
  		this.players.forEach(function(player) 
  		{
  			var cur_player_id = player.getId();
      		if (cur_player_id !== from_player_id) 
      		{
        		this.messageToPlayer(cur_player_id, message_type, data);
      		}
    	}, this);
  	}
}

function generateRoomPlayerNames()
{
	var result = {};
	for (var room_name in rooms) 
	{
		var player_names = [];
		rooms[room_name].getPlayers().forEach(function (player) 
		{
    		player_names.push(player.getName());
		});
		result[room_name] = player_names;
	}

	log(result);

	return result;
}

function processConnection(socket)
{
	var player = null;
  	var room = null;

	socket.on(Message.GET_ROOM_LIST, onGetRoomList);

	socket.on(Message.ROOM_JOIN, onRoomJoinRequest);
  	socket.on(Message.ROOM_LEAVE, onLeave);

	socket.on(Message.SDP, onSdp);
  	socket.on(Message.ICE_CANDIDATE, onIceCandidate);

  	function onGetRoomList()
  	{
  		log("Room list request");
  		socket.emit(Message.ROOM_LIST, 
  			{
  				room_player_names: generateRoomPlayerNames()
  			});
  	}

	function onRoomJoinRequest(data)
	{
		// If a player was connected before
		if (player !== null || room !== null) 
		{
      		room.messageToPlayer(player.getId(), 
      						   Message.ERROR_PLAYER_WAS_INITIALIZED,
      						   {});
      		return;
      	}

      	// Get the room for player
	    room = getRoom(data.room_name);

	    // Check if the room is full
	    if (room.size() >= ROOM_CAPACITY) 
	    {
	      socket.emit(Message.ERROR_FULL_ROOM, {});
	      return;
	    }

	    player = new Player(++last_user_id, 
					    	data.player_name,
					    	data.player_class,
					    	data.player_emoji_pack_name,
					    	data.token);
	    room.addPlayer(player, socket);

	    // Notify player about the room
	    room.messageToPlayer(player.getId(), 
	    				   Message.ROOM_INFO, 
						   {
						      player_id: player.getId(),
						      room_name: room.getName(),
						      players: room.getPlayers(),
						      map: room.getMap(),
						   });

	    // Notify other room players about the new player
	    room.broadcastFromPlayer(player.getId(),
	    					     Message.PLAYER_JOIN, 
							   	 player.getInfoMessage()
							   	);

	    log('Player with id %d and name %s joined room %s. There are %d players in the room',
	    	player.getId(),
	    	player.getName(),
	    	room.getName(),
	    	room.size());
    }

    function getRoom(room_name) 
    {
	    if (!rooms[room_name]) 
	    {
	    	if (!room_name)
	    	{
	    		room_name = 'Room ' + ++last_room_id;
	    	}

	    	log("Creating new room with name %s", room_name)
	    	rooms[room_name] = new Room(room_name);
	    }

    	return rooms[room_name];
  	}

  	function onLeave() 
  	{
    	if (room === null) 
    	{
      		return;
    	}
    	
    	room.removePlayer(player.getId());
	    log('Player with id %d and name %s left room %s. There are %d players in the room',
	    	player.getId(),
	    	player.getName(),
	    	room.getName(),
	    	room.size());
	    
	    if (room.isEmpty()) 
	    {
	      log('Room %s is empty - dropping', room.getName());
	      delete rooms[room.getName()];
	    }

	    room.broadcastFromPlayer(player.getId(), 
						    	 Message.PLAYER_LEAVE,
						    	 {
						      		player_id: player.getId()
						    	 });
  	}

  function onSdp(data) 
  {
	log('Sdp request from %s to %s', player.getId(), data.player_id);

    room.messageToPlayer(data.player_id,
					     Message.SDP, 
					     {
					      	player_id: player.getId(),
					     	sdp: data.sdp
					     });
  }

  function onIceCandidate(data) 
  {
	log('Ice candidate from %s to %s', player.getId(), data.player_id);

    room.messageToPlayer(data.player_id,
			      Message.ICE_CANDIDATE, 
			      {
			      	player_id: player.getId(),
			      	candidate: data.candidate
			      });
  }
}

io.on('connection', processConnection);
log('I am running room server on port %d', ROOM_SERVER_PORT);