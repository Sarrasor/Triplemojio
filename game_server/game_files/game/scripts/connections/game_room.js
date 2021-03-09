class GameRoom
{
    constructor(room_server_url, room_name, player_name, player_class, player_emoji_pack_name, token)
    {
        this.room_server_connection = new RoomServerConnection(room_server_url,
                room_name,
                player_name,
                player_class,
                player_emoji_pack_name,
                token);
        this.map = [];
        this.phaser_game = null;

        this.room_server_connection.on(Message.ROOM_JOINED, this.onJoinedRoom, this);
        this.room_server_connection.connect();
    }

    onJoinedRoom(data)
    {
        this.log("Joined the room. Creating Phaser game", "green");
        this.map = data.map;
        this.phaser_game = new Phaser.Game(GAME_CONFIG);
        var game_scene = new GameScene(SCENE_CONFIG, this);
        this.phaser_game.scene.add(START_SCENE_KEY, game_scene);
        this.phaser_game.scene.start(START_SCENE_KEY);
    }

    disconnect()
    {
        this.room_server_connection.disconnect();
        this.room_server_connection.destroy();
    }

    startVideo(video_stream)
    {
        this.log("Start sharing video is not yet implemented", "red");
    }

    stopVideo()
    {
        this.log("Stop sharing video is not yet inmplemented", "red");
    }

    startAudio(audio_stream)
    {
        this.log("Start sharing audio is not yet implemented", "red");
    }

    stopAudio()
    {
        this.log("Stop sharing audio is not yet inmplemented", "red");
    }

    log(message, color) 
    {
        console.log("%c GameRoom: %s", "color:" + color, message);
    }
}
