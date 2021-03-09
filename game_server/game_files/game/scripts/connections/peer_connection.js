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

        this.peer_handlers = {};
        this.peer_handlers[Message.WEBRTC_ICE_CANDIDATE] = this.onLocalICECandidate;
        this.peer_handlers[Message.WEBRTC_ICE_STATE_CHANGE] = this.onICEConnectionStateChanged;
        this.peer_handlers[Message.WEBRTC_DATA_CHANNEL] = this.onDataChannel;

        this.data_channel_handlers = {};
        this.data_channel_handlers[Message.PEER_OPEN] = this.onDataChannelOpen;
        this.data_channel_handlers[Message.PEER_CLOSE] = this.onDataChannelClose;
        this.data_channel_handlers[Message.PEER_MESSAGE] = this.onDataChannelMessage;

        this.connect();
    }

    connect()
    {
        this.peer_connection = new RTCPeerConnection(
            {
                configuration:
                {
                    offerToReceiveVideo: video_switch.checked,
                    offerToReceiveAudio: audio_switch.checked,
                },
                iceServers: this.ice_servers
            });

        if (local_stream && share_switch.checked)
        {
            if (video_switch.checked)
            {
                const video_tracks = local_stream.getVideoTracks();
                if (video_tracks && video_tracks.length > 0)
                {
                    this.log("Using video device: ${video_tracks[0].label}", "gray");
                    this.peer_connection.addTrack(video_tracks[0], local_stream);
                }
            }

            if (audio_switch.checked)
            {
                const audio_tracks = local_stream.getAudioTracks();
                if (audio_tracks && audio_tracks.length > 0)
                {
                    this.log("Using audio device: ${audio_tracks[0].label}", "gray");
                    this.peer_connection.addTrack(audio_tracks[0], local_stream);
                }
            }
        }

        var context = this;
        this.peer_connection.ontrack = (data) =>
        {
            if (remote_videos[context.video_index].srcObject !== data.streams[0])
            {
                remote_videos[context.video_index].srcObject = data.streams[0];
            }
        }
        Events.listen(this.peer_connection, this.peer_handlers, this);

        if (this.is_initiator)
        {
            this.openDataChannel(this.peer_connection.createDataChannel(DATA_CHANNEL_NAME,
                {
                    ordered: false
                }));

            this.sendSDPDescription();
        }
    }

    destroy()
    {
        // Close data channel
        Events.unlisten(this.data_channel, this.data_channel_handlers, this);
        this.data_channel.close();

        // Close peer connection
        Events.unlisten(this.peer_connection, this.peer_handlers, this);
        if (this.peer_connection.signalingState !== "closed")
        {
            this.peer_connection.close();
        }
    }

    addVideoStream(video_stream)
    {
        console.log("Adding video stream for peer is not yet implemented");
    }

    removeVideoStream()
    {
        console.log("Removing video stream for peer is not yet implemented");
    }

    addAudioStream(audio_stream)
    {
        console.log("Adding audio stream for peer is not yet implemented");
    }

    removeAudioStream()
    {
        console.log("Removing audio stream for peer is not yet implemented");
    }

    closePeerConnection()
    {
        this.closeDataChannel();
        Events.unlisten(this.peer_connection, this.peer_handlers, this);
        if (this.peer_connection.signalingState !== "closed")
        {
            this.peer_connection.close();
        }
    }

    setSDP(sdp)
    {
        this.log("Got SDP from remote peer", "gray");
        var context = this;
        var rtc_descriprion = new RTCSessionDescription(sdp);
        context.peer_connection.setRemoteDescription(rtc_descriprion).then(() =>
        {
            context.remote_description_ready = true;

            while (context.pending_ice_candidates.length)
            {
                context.addRemoteICECandidate(context.pending_ice_candidates.pop());
            }

            if (!context.is_initiator)
            {
                context.sendSDPDescription();
            }
        });
    }

    sendSDPDescription()
    {
        var context = this;
        context.getDescription().then((local_description) =>
        {
            context.peer_connection.setLocalDescription(local_description).then(() =>
            {
                context.log("Sending SDP", "green");
                context.sendSDP(context.peer_player.player_id, local_description);
            });
        }).catch(function (error)
        {
            context.log("SDP Error: " + error.message, "red");
        });
    }

    getDescription()
    {
        return this.is_initiator ?
        this.peer_connection.createOffer() :
        this.peer_connection.createAnswer();
    }

    addICECandidate(candidate)
    {
        if (this.remote_description_ready)
        {
            this.addRemoteICECandidate(candidate);
        }
        else
        {
            this.pending_ice_candidates.push(candidate);
        }
    }

    addRemoteICECandidate(candidate)
    {
        try
        {
            this.peer_connection.addIceCandidate(new RTCIceCandidate(candidate));
            this.log("Added ICE candidate: " + candidate.candidate, "gray");
        }
        catch (e)
        {
            this.log("Error while adding remote ice candidate: " + e.message, "red");
        }
    }

    onLocalICECandidate(event)
    {
        if (event.candidate)
        {
            this.log("Send my ICE candidate: " + event.candidate.candidate, "gray");
            this.sendICECandidate(this.peer_player.player_id, event.candidate);
        }
        else
        {
            this.log("No more candidates", "gray");
        }
    }

    onICEConnectionStateChanged(event)
    {
        this.log("Connection state changed: " + event.target.iceConnectionState, "green");
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
        this.log("Oppening data channel", "green");
        this.data_channel = channel;
        Events.listen(this.data_channel, this.data_channel_handlers, this);
    }

    closeDataChannel()
    {
        Events.unlisten(this.data_channel, this.data_channel_handlers, this);
        this.data_channel.close();
    }

    sendDataChannelMessage(message)
    {
        if (!this.data_channel_ready)
        {
            this.log("Data channel is not ready", "red");
            return;
        }
        this.data_channel.send(message);
    }

    onDataChannelOpen()
    {
        this.data_channel_ready = true;
        this.emit(Message.PEER_OPEN);
    }

    onDataChannelMessage(message)
    {
        this.emit(Message.PEER_MESSAGE, JSON.parse(message.data));
    }

    onDataChannelClose()
    {
        this.data_channel_ready = false;
        this.emit(Message.PEER_CLOSE);
    }

    sendSDP(player_id, sdp)
    {
        this.socket.emit(Message.SDP,
        {
            player_id: player_id,
            sdp: sdp
        });
        this.log("Sent SDP to player with id " + player_id + " via server", "gray");
    }

    sendICECandidate(player_id, candidate)
    {
        this.socket.emit(Message.ICE_CANDIDATE,
        {
            player_id: player_id,
            candidate: candidate
        });
    }

    log(message, color)
    {
        console.log("%c PeerConnection[Player id: %d (%s), State: %s] %s", "color:" + color,
            this.peer_player.player_id,
            this.peer_player.player_name,
            this.peer_connection.signalingState,
            message);
    }
}
