class GameScene extends Phaser.Scene
{
	constructor(config, game_room)
	{
		super(config);
		this.my = {};
		this.my.game_room = game_room;
		this.my.connection = game_room.room_server_connection;
        this.my.player_id = game_room.room_server_connection.player_id;
		this.my.player_name = game_room.room_server_connection.player_name;
		this.my.player_class = PlayerClassSelector[game_room.room_server_connection.player_class];
		this.my.player_emoji_pack_name = game_room.room_server_connection.player_emoji_pack_name;
        this.my.map_array = game_room.map;
		this.my.map_width = game_room.map[0].length;
        this.my.map_height = game_room.map.length; 
        this.my.tile_size = WALL_IMAGE_SIZE;

        this.my.remote_players = {};
        this.my.player_objects = [];

        this.my.connection_handlers = 
        {
      		'message': this.onRemotePlayerMessage,
      		'remote_player_leave': this.onRemotePlayerLeave
    	};
	}

	preload()
	{
        // Load Roboto font
        this.plugins.get('rexwebfontloaderplugin').addToScene(this);
        var config = 
        {
            google: 
            {
                families: ['Roboto']
            }
        };
        this.load.rexWebFont(config);

        // Load images
		this.load.image('wall', 'assets/wall.png');

        this.load.image(PlayerClass.SQY.image_name, 'assets/sqy.png');
        this.load.image(PlayerClass.CII.image_name, 'assets/cii.png');
        this.load.image(PlayerClass.TRI.image_name, 'assets/tri.png');
        this.load.image(PlayerClass.SQY.bullet_image_name, 'assets/sqy_bullet.png');
        this.load.image(PlayerClass.CII.bullet_image_name, 'assets/cii_bullet.png');
        this.load.image(PlayerClass.TRI.bullet_image_name, 'assets/tri_bullet.png');

        var context = this;
        EMOJI_PACK_NAMES.forEach((pepn) => {
            context.load.image(pepn + '_robot', 'assets/emoji/' + pepn +'/robot.png');
            context.load.image(pepn + '_neutral', 'assets/emoji/' + pepn +'/neutral.png');
            context.load.image(pepn + '_angry', 'assets/emoji/' + pepn +'/angry.png');
            context.load.image(pepn + '_happy', 'assets/emoji/' + pepn +'/happy.png');
            context.load.image(pepn + '_sad', 'assets/emoji/' + pepn +'/sad.png');
            context.load.image(pepn + '_surprised', 'assets/emoji/' + pepn +'/surprised.png');
            context.load.image(pepn + '_disgusted', 'assets/emoji/' + pepn +'/disgusted.png');
            context.load.image(pepn + '_fearful', 'assets/emoji/' + pepn +'/fearful.png');
        });
    }

	create()
	{
        Events.on(this.my.connection, this.my.connection_handlers, this);

        // Controls
		this.my.motion_keys = this.input.keyboard.createCursorKeys();
        this.my.shoot_keys = 
        [
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
        ];

        // Set world size
        this.physics.world.setBounds(0,
                                     0, 
                                     this.my.map_width * this.my.tile_size, 
                                     this.my.map_height * this.my.tile_size);

        // Create walls
        var tilemap = this.make.tilemap(
        {
            data: this.my.map_array, 
            tileWidth: this.my.tile_size, 
            tileHeight: this.my.tile_size
        });
        var tiles = tilemap.addTilesetImage('wall');
        this.my.walls = tilemap.createLayer(0, tiles, 0, 0);
        this.my.walls.setCollision(0);

        // Create the player
        this.my.player = new MyPlayer(this,
                                      this.my.player_id, 
                                      this.my.player_name, 
                                      this.my.player_class, 
                                      this.my.player_emoji_pack_name);
        this.physics.add.collider(this.my.player, this.my.walls);
        this.my.player_objects.push(this.my.player);
        
        // Set camera
        this.cameras.main.zoom = 1;
        this.cameras.main.startFollow(this.my.player);

        // Spawn player
        var position = this.getRandomSpawnPosition();
        this.my.player.spawn(position.x, position.y);

        // Vector for collision detection
        this.my.delta_vector = new Phaser.Math.Vector2();

        this.my.map_center = this.add.text(this.my.map_width * this.my.tile_size / 2, this.my.map_height * this.my.tile_size / 2, "");
	   
        addChatMessage("Server", "Welcome, " + this.my.player_name);
    }

	update()
	{
		if (this.my.motion_keys.left.isDown)
        {
            this.my.player.rotateLeft();
        }
        else if (this.my.motion_keys.right.isDown)
        {
            this.my.player.rotateRight();
        }
        else if (this.my.motion_keys.up.isDown)
        {
            this.my.player.moveForward();
        }
        else if (this.my.motion_keys.down.isDown)
        {
            this.my.player.moveBackward();
        }
        else
        {
            this.my.player.stop();
        }
        this.my.player.setEmotion(emotion);

        this.my.connection.broadcastMessage(MessageBuilder.createMessage(MESSAGE_PLAYER_STATE)
        	.setEmotion(this.my.player.getEmotion())
        	.setX(this.my.player.getX())
      		.setY(this.my.player.getY())
      		.setRotation(this.my.player.getRotation())
      		.setVelocityX(this.my.player.getVelocityX())
      		.setVelocityY(this.my.player.getVelocityY())
        	);

        this.my.shoot_keys.forEach(key => 
        {
            if (Phaser.Input.Keyboard.JustDown(key)) 
            {
                var bullet_state = this.my.player.shoot();

                this.my.connection.broadcastMessage(MessageBuilder.createMessage(MESSAGE_PLAYER_SHOOT)
                    .setX(bullet_state.x)
                    .setY(bullet_state.y)
                    .setRotation(bullet_state.rotation)
                    );
            }
        });

        // Player collision detection
        if (!this.my.player.body.velocity.equals(Phaser.Math.Vector2.ZERO) && PLAYER_COLLISION_ENABLED) 
        {
            this.my.delta_vector.copy(this.my.player.body.velocity).scale( 1 / this.physics.world.fps);
    
            var bodies = this.physics.overlapRect(this.my.player.body.x + this.my.delta_vector.x,
                                                  this.my.player.body.y + this.my.delta_vector.y, 
                                                  this.my.player.body.width, 
                                                  this.my.player.body.height,
                                                  true, 
                                                  true);

            Phaser.Utils.Array.Remove(bodies, this.my.player.body);

            if (bodies.length) 
            {
                if (this.my.delta_vector.x) 
                {
                    this.my.player.body.setVelocityX(0);
                }
                if (this.my.delta_vector.y) 
                {
                    this.my.player.body.setVelocityY(0);

                }
            }
        }
	}

	getRandomSpawnPosition()
    {
        const candidates = [];
        for (var i = 0; i < this.my.map_array.length; ++i)
        {
            for (var j = 0; j < this.my.map_array[0].length; ++j)
            {
                if (this.my.map_array[i][j] === 1)
                {
                    candidates.push([j, i]);
                }
            }
        }
        var spawn_indices = candidates[Math.floor(Math.random() * candidates.length)]
        // var spawn_indices = candidates[0];
        return {x: this.my.tile_size * spawn_indices[0] + this.my.tile_size / 2,
                y: this.my.tile_size * spawn_indices[1] + this.my.tile_size / 2}
    }

    onRemotePlayerMessage(message, player_info, peer_connection)
    {
    	// console.log("Remote player message from %s", player_info.player_name);
		// console.log(message);
        // console.log(player_info);

    	var remote_player = this.my.remote_players[player_info.player_id];
    	if (!remote_player && message.getType() === MESSAGE_PLAYER_STATE) 
    	{
      		console.log('%cCreating remote player for id %s', 'color: blue;', player_info.player_id);
      		remote_player = new RemotePlayer(this, 
                                             player_info.player_id,
                                             player_info.player_name,
                                             PlayerClassSelector[player_info.player_class], 
                                             player_info.player_emoji_pack_name);
            remote_player.body.setImmovable();
            this.my.player.body.setImmovable()

            this.physics.add.collider(this.my.player, remote_player);
            remote_player.spawn(message.x, message.y);
            this.my.player_objects.push(remote_player);
            this.my.remote_players[player_info.player_id] = remote_player;

            addChatMessage("Server", remote_player.player_name + " joined the room");
    	}

    	// Add message switches
    	switch (message.getType()) 
    	{
    		case MESSAGE_PLAYER_STATE:
        	   this.onRemotePlayerState(remote_player, message);
        	   break;

            case MESSAGE_PLAYER_SHOOT:
                this.onRemotePlayerShoot(remote_player, message);
                break;

            case MESSAGE_PLAYER_DEAD:
                this.onRemotePlayerDead(remote_player, message);
                break;
    	}
    }

    onRemotePlayerState(remote_player, message)
    {
    	remote_player.updateState(message);
    }

    onRemotePlayerShoot(remote_player, message)
    {
        remote_player.shoot();
    }

    onRemotePlayerDead(remote_player, message)
    {
        // console.log("REMOTE PLAYER KILL NOTIFICATION", remote_player, message);
        // remote_player.kill();
    }

    onRemotePlayerLeave(data)
    {
    	console.log("Remote player " + data.player_id + " left the room");

    	var remote_player = this.my.remote_players[data.player_id];

        addChatMessage("Server", remote_player.player_name + " left the room");

	    if (remote_player)
	    {
	      remote_player.kill(0, "Server", false);
          remote_player.destroy();
	      delete this.my.remote_players[data.player_id];
	    }
    }
}