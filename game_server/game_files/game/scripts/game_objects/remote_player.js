class RemotePlayer extends Player
{
    constructor(scene, player_id, player_name, player_class, emoji_pack_name)
    {
        super(scene, player_id, player_name, player_class, emoji_pack_name)
        this.remote_player = true;
    }

    updateState(state_message)
    {
        this.setEmotion(state_message.emotion);
        this.setX(state_message.x + CONTAINER_WIDTH / 2);
        this.setY(state_message.y + CONTAINER_HEIGHT / 2);
        // this.body.setVelocityX(state_message.velocity_x);
        // this.body.setVelocityY(state_message.velocity_y);
        this.player.rotation = state_message.rotation;
    }
}