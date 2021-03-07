class Player extends Phaser.GameObjects.Container
{
    constructor(scene, player_id, player_name, player_class, emoji_pack_name)
    {   
        super(scene, 0, 0);
        this.scene = scene;

        this.player_id = player_id;
        this.player_name = player_name;
        this.player_class = player_class
        this.emoji_pack_name = emoji_pack_name;
        this.emotion = Emotion.ROBOT;
        this.current_hp = this.player_class.hp;
        this.alive = false;

        // Create player image
        this.player = scene.add.image(PLAYER_OFFSET_X, PLAYER_OFFSET_Y, player_class.image_name);
        this.player.setDisplayOrigin(CONTAINER_WIDTH / 2, CONTAINER_HEIGHT / 2);

        // Create emoji image
        this.emoji = scene.add.image(EMOJI_OFFSET_X, EMOJI_OFFSET_Y, this.getEmojiImage());
        this.emoji.setScale(EMOJI_SCALE);
        this.emoji.setDepth(1);

        // Create player text
        this.player_name_text = scene.add.text(PLAYER_NAME_OFFSET_X, 
                                               PLAYER_NAME_OFFSET_Y,
                                               this.player_name, 
                                               PLAYER_NAME_STYLE);
        this.player_name_text.setOrigin(0.5, 0.5);

        // Add images and text to the container
        this.add([this.player, this.emoji, this.player_name_text]);
        this.setSize(CONTAINER_WIDTH, CONTAINER_HEIGHT);
        this.scene.physics.world.enable(this);

        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        this.body.enable = false;

        this.bullets = new BulletGroup(this.scene, this.player_id, this.player_name, this.player_class);
    }

    spawn(x, y)
    {   
        if (!this.alive)
        {
            // console.log("Spawned player!");
            this.alive = true;
            this.current_hp = this.player_class.hp;
            this.body.enable = true;
            this.setX(x);
            this.setY(y);
            this.setActive(true);
            this.setVisible(true);

            if (!this.remote_player)
            {
                // Hide html overlay
                document.getElementById("game_container_overlay").className = "game-container-overlay";
                document.getElementById("kill_title").className = "kill-title";
                document.getElementById("kill_message").className = "kill-message";

                this.scene.cameras.main.startFollow(this);
                this.scene.cameras.main.zoom = ALIVE_ZOOM;
            }
        }
    }

    hit(player_id, player_name, damage)
    {
        // console.log("%s hit %s", player_name, this.player_name);

        if (this.current_hp > damage)
        {
            this.current_hp -= damage;
        }
        else
        {
            this.kill(player_id, player_name, true);
        }
    }

    kill(killer_id, killer_name, respawn)
    {   
        if (this.alive)
        {
            this.alive = false;
            this.body.enable = false;
            this.setX(0);
            this.setY(0);
            this.player.rotation = 0;
            this.setActive(false);
            this.setVisible(false);
            this.body.setVelocity(0);

            if (respawn)
            {
                // this.scene.my.connection.broadcastMessage(
                //     {
                //         type: MESSAGE_PLAYER_DEAD,
                //         killer_id: killer_id
                //     });

                // console.log("%s killed %s", killer_name, this.player_name);

                if (killer_id != this.player_id)
                {
                    addChatMessage("Server", killer_name + " killed " + this.player_name);
                }
                else
                {
                   addChatMessage("Server", this.player_name + " died by suicide"); 
                }


                if (!this.remote_player)
                {
                    this.scene.cameras.main.startFollow(this.scene.my.map_center);
                    this.scene.cameras.main.zoom = 0.065;

                    // Set kill message
                    var message = "suicide";
                    if (killer_id != this.player_id)
                    {
                        message = killer_name + " killed you";
                    }
                    document.getElementById("kill_message").innerHTML = message;

                    // Show html overlay
                    document.getElementById("game_container_overlay").className += " show";
                    document.getElementById("kill_title").className += " show";
                    document.getElementById("kill_message").className += " show";
                }

                this.scene.time.addEvent(
                {
                    delay: RESPAWN_DELAY,
                    callback: () =>
                    {
                        var position = this.scene.getRandomSpawnPosition();
                        this.spawn(position.x, position.y);
                    },
                    loop: false
                });
            }
        }
    }

    shoot()
    {
        var x = this.getX() + BULLET_OFFSET_X + BULLET_OFFSET_R * Math.cos(this.player.rotation);
        var y = this.getY() + BULLET_OFFSET_Y + BULLET_OFFSET_R * Math.sin(this.player.rotation);
        this.bullets.spawnBullet(x, y, this.player.rotation);

        var bullet_state = 
        {
            x: x,
            y: y,
            rotation: this.getRotation()
        }

        return bullet_state;
    }

    getX()
    {
        return this.body.x;
    }

    getY()
    {
        return this.body.y;
    }

    getVelocityX()
    {
        return this.body.velocity.x;
    }

    getVelocityY()
    {
        return this.body.velocity.y;
    }

    getRotation()
    {
        return this.player.rotation;
    }

    getEmotion()
    {
        return this.emotion;
    }

    setEmotion(emotion)
    {
        if (this.emotion !== emotion)
        {
            this.emotion = emotion;
            this.updateEmojiImage();
        }
    }

    updateEmojiImage()
    {
        this.emoji.setTexture(this.getEmojiImage());
    }

    getEmojiImage()
    {
        return this.emoji_pack_name + "_" + EmotionSelectorReverse[this.emotion];
    }
}