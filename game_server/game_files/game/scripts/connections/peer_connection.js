var remote_video_index = -1;

class PeerConnection extends Events.Connection
{
	constructor(socket, peer_player, is_initiator, ice_servers)
	{
		super();

		this.socket = socket;
    this.peer_player = peer_player;
    this.is_initiator = is_initiator;
    this.ice_servers = ice_servers;

  	remote_video_index = remote_video_index < ROOM_CAPACITY - 1 ? remote_video_index + 1 : 0;
  	this.video_index = remote_video_index;
  	this.video_stream = null;

  	this.peer_connection = null;
  	this.data_channel = null;
  	this.data_channel_ready = false;
  	this.remote_description_ready = false;
  	this.pending_ice_candidates = [];

  	this.peer_handlers = 
  	{
  		'icecandidate': this.onLocalIceCandidate,
    	'iceconnectionstatechange': this.onIceConnectionStateChanged,
    	'datachannel': this.onDataChannel
  	};

  	this.data_channel_handlers = 
  	{
  		'open': this.onDataChannelOpen,
      'close': this.onDataChannelClose,
    	'message': this.onDataChannelMessage
  	};

  	this.connect();
	}

  connect()
  {
		this.peer_connection = new RTCPeerConnection(
		{
			configuration: 
			{
			  offerToReceiveAudio: true, 
			  offerToReceiveVideo: true
		  },
    	iceServers: this.ice_servers
  	});

  	// TODO: remove when peer reconnection is implemented
  	if (local_stream && video_switch.checked && share_switch.checked)
  	{
    	const video_tracks = local_stream.getVideoTracks();
 	    if (video_tracks && video_tracks.length > 0)
 	    {
 	    	this.log("Using video device: ${video_tracks[0].label}", 'gray');
 	    	this.peer_connection.addTrack(video_tracks[0], local_stream);
 	    }
      const audio_tracks = local_stream.getAudioTracks();
      if (audio_tracks && audio_tracks.length > 0)
      {
        this.log("Using audio device: ${audio_tracks[0].label}", 'gray');
        this.peer_connection.addTrack(audio_tracks[0], local_stream);
      }
	   }
  	// TODO: remove when peer reconnection is implemented

  	var context = this;
    this.peer_connection.ontrack = gotRemoteStream;
    function gotRemoteStream(e)
		{
	  	if (remote_videos[context.video_index].srcObject !== e.streams[0]) 
	  	{
	    	remote_videos[context.video_index].srcObject = e.streams[0];
	  	}
		}
    Events.listen(this.peer_connection, this.peer_handlers, this);

    if (this.is_initiator) 
    {
      	this.openDataChannel(this.peer_connection.createDataChannel(
      	'data', 
      	{
        	ordered: false
      	}
      	));

    		this.setLocalDescriptionAndSend();
  	}
  }

  destroy()
  {
    // Close data channel
    Events.unlisten(this.data_channel, this.data_channel_handlers, this);
    this.data_channel.close();
      
    // Close peer connection
    Events.unlisten(this.peer_connection, this.peer_handlers, this);
    if (this.peer_connection.signalingState !== 'closed') 
    {
      this.peer_connection.close();
    }
  }

  addVideoStream(video_stream)
  {	
  	console.log("Adding video stream for peer is not yet implemented");
  	// 	this.video_stream = video_stream;
    // 	const video_tracks = video_stream.getVideoTracks();
    //      if (video_tracks.length > 0)
    //      {
    //      	console.log(`Using video device: ${video_tracks[0].label}`);
    //      	this.peer_connection.addTrack(video_tracks[0], video_stream);
    //      	this.is_initiator = true;
		// this.setLocalDescriptionAndSend();
    //      }
  }

	removeVideoStream()
	{
		console.log("Removing video stream for peer is not yet implemented");
		// var context = this;
		// if(context.video_stream)
		// {
    // 		context.video_stream.getVideoTracks().forEach(video_track => 
	  //   {
	  //   	video_track.stop();
	  //   	context.video_stream.removeTrack(video_track);
	  //   });
		// 	context.video_stream = null;
		// }
	}

	closePeerConnection() 
	{
  	this.closeDataChannel();
  	Events.unlisten(this.peer_connection, this.peer_handlers, this);
  	if (this.peer_connection.signalingState !== 'closed') 
  	{
    		this.peer_connection.close();
  	}
	}

	setSdp(sdp)
	{
		var context = this;
		var rtc_descriprion = new RTCSessionDescription(sdp);
  	// And set it as remote description for peer connection
    context.peer_connection.setRemoteDescription(rtc_descriprion).then(function() 
    {
    	context.remote_description_ready = true;
    	context.log('Got SDP from remote peer', 'gray');
    
    	// Add all received remote candidates
    	while (context.pending_ice_candidates.length) 
    	{
          context.addRemoteCandidate(context.pending_ice_candidates.pop());
    	}

      // Send answer on offer
      if (!context.is_initiator) 
      {
        context.setLocalDescriptionAndSend();
      }
    });
	}

	setLocalDescriptionAndSend() 
	{
		var context = this;
  	context.getDescription().then(function(local_description) 
  	{
      context.peer_connection.setLocalDescription(local_description).then(function() 
        {
          context.log('Sending SDP', 'green');
         	context.sendSdp(context.peer_player.player_id, local_description);
        });
    	}).catch(function(error) 
    	{
      	context.log('onSdpError: ' + error.message, 'red');
    	});
  }

	getDescription() 
	{
  	return this.is_initiator ? 
  	  this.peer_connection.createOffer() :
      this.peer_connection.createAnswer();
	}

	addIceCandidate(candidate) 
	{
    if (this.remote_description_ready) 
    {
      this.addRemoteCandidate(candidate);
    } 
    else 
    {
      this.pending_ice_candidates.push(candidate);
    }
	}

	addRemoteCandidate(candidate) 
	{
  	try 
  	{
    	this.peer_connection.addIceCandidate(new RTCIceCandidate(candidate));
    	this.log('Added his ICE-candidate:' + candidate.candidate, 'gray');
  	}
  	catch (err) 
  	{
    	this.log('Error adding remote ice candidate' + err.message, 'red');
  	}
	}

	onLocalIceCandidate(event) 
	{
  	if (event.candidate) 
  	{
    	this.log('Send my ICE-candidate: ' + event.candidate.candidate, 'gray');
    	this.sendIceCandidate(this.peer_player.player_id, event.candidate);
  	}
  	else
  	{
    		this.log('No more candidates', 'gray');
  	}
	}

	onIceConnectionStateChanged(event) 
	{
  	this.log('Connection state: ' + event.target.iceConnectionState, 'green');
  }

	onDataChannel(event) 
	{
  	if (!this.is_initiator) 
  	{
    	this.openDataChannel(event.channel);
  	}
	}

	openDataChannel(channel) 
	{
  	this.data_channel = channel;
  	Events.listen(this.data_channel, this.data_channel_handlers, this);
	}

	closeDataChannel() 
	{
  	Events.unlisten(this.data_channel, this.data_channel_handlers, this);
  	this.data_channel.close();
	}

	sendMessage(message) 
	{
  	if (!this.data_channel_ready) 
  	{
    	return;
  	}
  	this.data_channel.send(message);
	}

	onDataChannelOpen() 
	{
  	this.data_channel_ready = true;
  	this.emit('open');
	}

	onDataChannelMessage(message) 
	{
  	this.emit('message', JSON.parse(message.data));
	}

	onDataChannelClose() 
	{
  	this.data_channel_ready = false;
  	this.emit('closed');
	}

	sendSdp(player_id, sdp) 
	{
  	this.socket.emit(Message.SDP, 
  	{
    		player_id: player_id,
    		sdp: sdp
  	});
  	this.log("Sent Sdp to player with id " + player_id + " via server", 'gray');
	}

	sendIceCandidate(player_id, candidate) 
	{
    this.socket.emit(Message.ICE_CANDIDATE, 
    {
      player_id: player_id,
      candidate: candidate
    });
	}

	log(message, color) 
	{
  console.log('%c[Player id: %d (%s), %s] %s', 'color:' + color, 
  			      this.peer_player.player_id,
              this.peer_player.player_name,
    		      this.peer_connection.signalingState,
              message);
	}
}