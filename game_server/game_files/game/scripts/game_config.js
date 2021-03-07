const ALIVE_ZOOM = 0.8;

const RESPAWN_DELAY = 6000;
const BULLET_OFFSET_X = 58.5;
const BULLET_OFFSET_Y = 50;
const BULLET_OFFSET_R = 70;

const CONTAINER_WIDTH = 100;
const CONTAINER_HEIGHT = 100;

const PLAYER_OFFSET_X = 0;
const PLAYER_OFFSET_Y = 0;

const EMOJI_OFFSET_X = 0;
const EMOJI_OFFSET_Y = 0;
const EMOJI_SCALE = 0.6;

const PLAYER_NAME_OFFSET_X = 0;
const PLAYER_NAME_OFFSET_Y = -80;
const PLAYER_NAME_STYLE = 
{   
    fontFamily: 'Roboto',
    fontSize: '20px',
    color: '#020202',
    fontStyle: 'normal',
    strokeThickness: 1,
    shadow: 0
};

const WALL_IMAGE_SIZE = 350;

const START_SCENE_KEY = 'game_scene';

const SCENE_CONFIG =
{
    key: START_SCENE_KEY,
    pack: 
    {
        files: 
        [{
            type: 'plugin',
            key: 'rexwebfontloaderplugin',
            url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexwebfontloaderplugin.min.js',
            start: true
        }]
    }
};

const PLAYER_COLLISION_ENABLED = false;

const GAME_CONFIG = 
{
    type: Phaser.AUTO,
    backgroundColor: '#fff',
    scale:
    {
        parent: 'game_container',
        mode: Phaser.Scale.FIT,
        width: document.getElementById('game_container').offsetWidth,
        height: document.getElementById('game_container').offsetHeight,
    },
    physics: 
    {
        default: 'arcade',
        arcade: 
        {
            tileBias: WALL_IMAGE_SIZE,
            overlapBias: 100,
            gravity: 
            { 
                y: 0 
            },
            debug: false
        }
    },
};

const PlayerClass = 
{
    SQY: 
    {
        image_name: 'sqy',
        hp: 100,
        velocity: 500,
        angular_velocity: 0.02,
        fire_rate: 200,
        bullet_image_name: 'sqy_bullet',
        bullet_damage: 20,
        bullet_velocity: 1500,
        bullet_capacity: 3,
        bullet_durability: 3,
    },
    CII: 
    {
        image_name: 'cii',
        hp: 80,
        velocity: 800,
        angular_velocity: 0.03,
        fire_rate: 200,
        bullet_image_name: 'cii_bullet',
        bullet_damage: 25,
        bullet_velocity: 1500,
        bullet_capacity: 3,
        bullet_durability: 3
    },
    TRI:
    {
        image_name: 'tri',
        hp: 60,
        velocity: 900,
        angular_velocity: 0.04,
        fire_rate: 200,
        bullet_image_name: 'tri_bullet',
        bullet_damage: 25,
        bullet_velocity: 1500,
        bullet_capacity: 3,
        bullet_durability: 3 
    }
};

const PlayerClassSelector = 
{
    "sqy": PlayerClass.SQY,
    "cii": PlayerClass.CII,
    "tri": PlayerClass.TRI
}