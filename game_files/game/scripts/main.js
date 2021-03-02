const START_IMMEDIATELY = true;

// Extract player input
const query_params = new URLSearchParams(window.location.search);
const room_name = query_params.get('room_name');
const player_name = query_params.get('player_name');
const player_class = query_params.get('player_class');
const player_emoji_pack_name = query_params.get('player_emoji_pack_name');
const token = query_params.get('token');

// Create variables to use
const detection_options = new faceapi.TinyFaceDetectorOptions();
var detection_returned = true;
var emotion = Emotion.ROBOT;
var local_stream = null;
var created_game_room = false;

// Get buttons and switches
const start_button = document.getElementById('start_button');
const video_switch = document.getElementById('video_switch');
const audio_switch = document.getElementById('audio_switch');
const share_switch = document.getElementById('share_switch');
start_button.disabled = true;
video_switch.disabled = true;
audio_switch.disabled = true;
share_switch.disabled = true;

// Get containers for remote videos
const remote_videos =
[
  document.querySelector('video#video_remote_1'),
  document.querySelector('video#video_remote_2'),
  document.querySelector('video#video_remote_3'),
  document.querySelector('video#video_remote_4'),
  document.querySelector('video#video_remote_5'),
];

// Attach emotion detector to local video
const video_local = document.querySelector('video#video_local');


video_local.addEventListener('play', () => 
{
  setInterval(async () => 
  {
    if (video_switch.checked && detection_returned)
    {
      detection_returned = false;
      detectEmotions().then((detections) =>
      {
        detection_returned = true;
        if (detections.length > 0)
        {
          var expr = detections[0].expressions;
          emotion = Object.keys(expr).reduce((a, b) => expr[a] > expr[b] ? a : b);
          emotion = EmotionSelector[Object.keys(expr).reduce((a, b) => expr[a] > expr[b] ? a : b)];
        }
      });
    }
  }, EMOTION_RECOGNITION_FREQUENCY)
});

async function detectEmotions()
{
  return faceapi.detectAllFaces(video_local, detection_options).withFaceExpressions();
}

// Load models
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('scripts/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('scripts/models')
]).then(loadedModels);

function loadedModels() 
{
  if(!video_switch.checked && START_IMMEDIATELY)
  {
    startConnection();
  }

  // console.log("Loaded models");
  if (video_switch.checked)
  {
    startLocalVideo();
  }

  start_button.disabled = false;
  video_switch.disabled = false;
  // audio_switch.disabled = false;
  // share_switch.disabled = false;
}

// Listen for video switch
video_switch.addEventListener('change', (event) => 
{
  video_switch.disabled = true;
  if(event.currentTarget.checked) 
  {
    startLocalVideo();
  }
  else
  {
    stopLocalVideo();
  }
});

function startLocalVideo() 
{
  var video_constraints = video_switch.checked;
  if(video_constraints)
  {
    video_constraints = 
    {
        width: 640,
        height: 480
    }
  }

  // console.log('Requesting local stream');
  navigator.mediaDevices
      .getUserMedia({
        audio: audio_switch.checked,
        video: video_constraints
      })
      .then(gotStream)
      .catch(e => console.log('getUserMedia() error: ', e));
}

function gotStream(stream)
{
  local_stream = stream;
  video_local.srcObject = stream;

  video_switch.disabled = false;

  if(share_switch.checked)
  {
    // game_room.startVideo(stream);
  }

  if(START_IMMEDIATELY)
  {
    startConnection();
  }
}

function stopLocalVideo()
{
  if(local_stream)
  {
    local_stream.getVideoTracks().forEach(video_track => 
    {
      video_track.stop();
      local_stream.removeTrack(video_track);
    });
  }

  video_local.srcObject = null;
  video_local.srcObject = local_stream;

  if(share_switch.checked)
  {
    // game_room.stopVideo();
  }

  video_switch.disabled = false;
}

start_button.onclick = function()
{
	start_button.disabled = true;
  startConnection();
};

function startConnection()
{
  if(!created_game_room)
  {
    created_game_room = true;

    // console.log("Creating Game Room connection");
    var game_room_connection = new GameRoomConnection(SERVER_URL,
                                                      room_name,
                                                      player_name,
                                                      player_class, 
                                                      player_emoji_pack_name,
                                                      token
                                                      );
    window.onbeforeunload = function() 
    {
        game_room_connection.disconnect();
    };
  }
}

// Chat helper functions
const chat_container = document.getElementById('chat_container');
function addChatMessage(prefix, content)
{
  var message = '<div class="chat-message"><h3 class="chat-message-prefix">';
  message += prefix + ':</h3><p class="chat-message-content">';
  message += content + '</p></div>';

  // Possibility of injection
  // Do not allow user input to enter here
  chat_container.innerHTML += message;
}