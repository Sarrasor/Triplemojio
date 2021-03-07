const GAME_PATH = '/game';
const ROOM_CAPACITY = 6;

const ICE_SERVERS = 
[
  { url: 'stun:stun.l.google.com:19302' },
  { url: 'stun:stun1.l.google.com:19302' },
  { url: 'stun:stun2.l.google.com:19302' },
  { url: 'stun:stun3.l.google.com:19302' },
  
  {
      url: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com'
  },
  {
      url: 'turn:192.158.29.39:3478?transport=udp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
  },
  {
      url: 'turn:192.158.29.39:3478?transport=tcp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
  },
  {
      url: 'turn:turn.bistri.com:80',
      credential: 'homeo',
      username: 'homeo'
  },
  // {
  //     url: 'turn:turn.anyfirewall.com:443?transport=tcp',
  //     credential: 'webrtc',
  //     username: 'webrtc'
  // }
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

const MESSAGE_PLAYER_STATE = "player_state";
const MESSAGE_PLAYER_SHOOT = "player_shoot";
const MESSAGE_PLAYER_DEAD = "player_dead";