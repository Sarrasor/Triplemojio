class MyPlayer extends Player
{
    constructor(scene, player_id, player_name, player_class, emoji_pack_name)
    {
        super(scene, player_id, player_name, player_class, emoji_pack_name)
        this.remote_player = false;
    }

    rotateLeft()
    {
        this.player.rotation -= this.player_class.angular_velocity;
    }

    rotateRight()
    {
        this.player.rotation += this.player_class.angular_velocity;
    }

    moveForward()
    {
        this.body.angularVelocity = 0;
        this.body.setVelocity(Math.cos(this.player.rotation) * this.player_class.velocity, 
                              Math.sin(this.player.rotation) * this.player_class.velocity);
    }

    moveBackward()
    {
        this.body.angularVelocity = 0;
        this.body.setVelocity(Math.cos(this.player.rotation) * -this.player_class.velocity, 
                              Math.sin(this.player.rotation) * -this.player_class.velocity);
    }

    stop()
    {
        this.body.setVelocity(0, 0)
        this.body.angularVelocity = 0;
    }
}