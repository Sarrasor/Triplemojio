class GameRoomConnection
{
	constructor(room_server_url, room_name, player_name, player_class, player_emoji_pack_name, token)
	{
		this.room_server_url = room_server_url;
		this.room_name = room_name;
		this.player_name = player_name;
		this.player_class = player_class;
		this.player_emoji_pack_name = player_emoji_pack_name;
		this.token = token;
		this.room_server_connection = new RoomServerConnection(room_server_url, 
															   room_name, 
															   player_name, 
															   player_class, 
															   player_emoji_pack_name,
															   token);
		this.map = [];

		this.room_server_connection.on('joined', this.onJoinedRoom, this);
    	this.room_server_connection.connect();
	}

  	onJoinedRoom(data) 
  	{
    	console.log('%cJoined the room. Creating Phaser game', 'color: green');
    	this.map = data.map;
		  var game = new Phaser.Game(GAME_CONFIG);
		  var game_scene = new GameScene(SCENE_CONFIG, this);
		  game.scene.add(START_SCENE_KEY, game_scene);
		  game.scene.start(START_SCENE_KEY);
  	}

  	disconnect()
  	{
  		this.room_server_connection.disconnect();
  	}

  	startVideo(video_stream)
  	{
  		console.log("Start sharing video is not yet implemented");
  		// var peer_connections = this.room_server_connection.peer_connections;

  		// for (var key in peer_connections)
  		// {
  		// 	peer_connections[key].addVideoStream(video_stream);
  		// }
  	}

  	stopVideo()
  	{
  		console.log("Stop sharing video is not yet inmplemented");

  		// var peer_connections = this.room_server_connection.peer_connections;

  		// for (var key in peer_connections)
  		// {
  		// 	peer_connections[key].removeVideoStream();
  		// }
  	}
}


