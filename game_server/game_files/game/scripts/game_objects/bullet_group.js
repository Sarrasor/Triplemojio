class BulletGroup extends Phaser.Physics.Arcade.Group
{
    constructor(scene, player_id, player_name, player_class) 
    {
        // Call the super constructor, passing in a world and a scene
        super(scene.physics.world, scene);
        this.scene = scene;
        this.player_id = player_id;
        this.player_name = player_name;
        this.player_class = player_class;
        this.next_fire_time = 0;

        // Initialize the group
        this.createMultiple(
        {
            classType: Bullet,
            frameQuantity: this.player_class.bullet_capacity,
            active: false,
            visible: false,
            key: this.player_class.bullet_image_name,
        });

        var context = this;
        this.children.entries.forEach(function(bullet) 
        {
            bullet.setPlayerClass(context.player_class);
            bullet.setBounce(1, 1);
            context.scene.physics.add.collider(bullet, context.scene.my.walls, ()=>{bullet.addCollision();});
            bullet.body.collideWorldBounds = true;
        });
    }

    spawnBullet(x, y, rotation) 
    {
        var cur_time = new Date().getTime();
        if (cur_time > this.next_fire_time)
        {
            this.next_fire_time = cur_time + this.player_class.fire_rate;

            const bullet = this.getFirstDead(false);

            if (bullet)
            {
                var context = this;
                context.scene.my.player_objects.forEach(function(player_object) 
                {
                    context.scene.physics.add.collider(bullet, player_object, () =>
                    {
                        player_object.body.setVelocity(0);
                        bullet.setVelocity(0);
                        bullet.playerHit(); 
                        player_object.hit(context.player_id, context.player_name, context.player_class.bullet_damage);
                        // console.log("Bullet hit %s, %d hp left", player_object.player_name, player_object.current_hp);
                    });
                });

                bullet.spawn(x, y, rotation);
            }
        }
    }
}