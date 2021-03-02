class Bullet extends Phaser.Physics.Arcade.Sprite 
{
    constructor(scene, x, y, image_name)
    {
        super(scene, x, y, image_name);
        this.player_class = {};
        this.wall_collisions = 0;
    }

    setPlayerClass(player_class)
    {
        this.player_class = player_class;
    }

    spawn(x, y, direction) 
    {
        this.setActive(true);
        this.setVisible(true);
        
        this.body.enable = true;
        this.body.reset(x, y);
        this.setVelocityX(Math.cos(direction) * this.player_class.bullet_velocity);
        this.setVelocityY(Math.sin(direction) * this.player_class.bullet_velocity);
    }

    playerHit()
    {
        this.kill();
    }

    addCollision()
    {
        if (this.active)
        {
            ++this.wall_collisions;
        }
    }

    preUpdate(time, delta)
    {
        super.preUpdate(time, delta);
 
        if (this.wall_collisions >= this.player_class.bullet_durability) 
        {
           this.kill();
        }
    }

    kill()
    {
        this.wall_collisions = 0;
        this.setActive(false);
        this.setVisible(false);
        this.setVelocityX(0);
        this.setVelocityY(0);
        this.body.reset(0, 0);
        this.body.enable = false;
    }
}