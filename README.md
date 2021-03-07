![logo](images/logo.png)

## Features

### Peer-to-peer WebRTC

Rooms are WebRTC peer-to-peer. Server is required only for the peer connection signalling and game files retrieval

![web rtc](images/web_rtc.png)

### Video and audio sharing

You can share video and audio with your rommates

![video sharing](images/video_sharing.gif)

### Emotion recognition

If you share your video, your emotions will be recognized and your character's emoji will be updated

![emotion recognition](images/emotion_recognition.gif)

## Repository structure

- `game_server` - Game source code
- `room_server` - Room Server source code
- `docker-compose.yml` - Docker compose with Game Server, Room Server, and Certbot services
- `get_certificates.sh` - script to receive Let's Encrypt TLS certificates
- `get_ngrok_tunnels.py` - Python script to get names of running Ngrok tunnels
- `ngrok_config.yml` - Ngrok tunnel configuration file
- `package.json` - npm package description
- `run_local.sh` - script to update configs to run the game locally
- `run_ngrok.sh` - script to update configs to run the game with Ngrok

## How to run

Clone the repository first:

```
git clone https://github.com/Sarrasor/Triplemojio.git
```

I will refer to the folder with the repo as `Triplemojio`.

### Running locally 

If you want to run the game in development mode, you will need to have `NodeJS` and `npm` installed. If you don't have them, check out [this](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) link.

Open two terminals, and `cd` into the `Triplemojio` folder.

In the first terminal:

```
chmod +x run_local.sh
./run_local.sh
npm run game_server
```

In the second terminal:

```
npm run room_server
```

Now you can go to `https://localhost:8080`

### Running in Docker

If you want to deploy the game on your server, then go for Docker:

```
chmod +x run_local.sh
./run_local.sh
docker-compose build --no-cache
docker-compose up
```

### Ngrok tunnels

Ngrok allows you to expose local server to the world

Download ngrok from [here](https://ngrok.com/download) and unpack the executable to the `Triplemojio/ngrok` folder

Next, connect your Ngrok account. Add this line to the `ngrok_config.yml`:

```
authtoken <your auth token>
```

Run Ngrok tunnels:

```
chmod +x run_ngrok.sh
. ./run_ngrok.sh
```

Before running the server, you might want to receive a TLS certificate. If so, read the section below.


If all certificates are ok, run Docker:

```
docker-compose build --no-cache
docker-compose up
```

### Receiving Letsencrypt certificate

Since modern browsers allow WebRTC video and audio only via HHTPS, you might want to create an HTTPS server. In order for an HTTPS server to work, you will need some TLS certificates

This script can automatically receive a Let's Encrypt certificate:

```
./get_certificates.sh
```

### Stopping Ngrok tunnels

Ngrok tunnels run in the background. If you need to stop it:

```
ps ax | grep ngrok
kill <ngrok pid from the previous command>
```
