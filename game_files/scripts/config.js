const SERVER_URL = 'https://' + window.location.hostname + ':1337';
const GAME_PATH = '/game';
const ROOM_CAPACITY = 6;

const ICE_SERVERS = [
  {
    url: 'stun:stun.l.google.com:19302'
  },

  {
    url: 'stun:stun.anyfirewall.com:3478'
  },

  {
    url: 'turn:turn.bistri.com:80',
    credential: 'homeo',
    username: 'homeo'
  },

  {
    url: 'turn:turn.anyfirewall.com:443?transport=tcp',
    credential: 'webrtc',
    username: 'webrtc'
  }
]

const Message = 
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
	ERROR_PLAYER_WAS_INITIALIZED: "error_player_was_initialized"
};

const MESSAGE_PLAYER_STATE = 0;
const MESSAGE_PLAYER_SHOOT = 1;
const MESSAGE_PLAYER_DEAD = 2;

const FIELD_TYPE = 'type';
const FIELD_EMOTION = 'emotion';
const FIELD_X = 'x';
const FIELD_Y = 'y';
const FIELD_ROTATION = 'rotation';
const FIELD_VELOCITY_X = 'velocity_x';
const FIELD_VELOCITY_Y = 'velocity_y';
const FIELD_KILLER_ID = 'killer_id';