# Triplemoji

## How to run

### Running locally 

If you want to run the game in development mode:

```
npm run game_server
npm run room_server
```

### Running in docker

If you want to deploy the game:

```
docker-compose up --build
```

#### Receiving Letsencrypt certificate

Since modern browsers allow sharing video and audio only via HHTPS, you might want to create an HTTPS server. In order for an HTTPS server to work, you will need some TLS certificates

This script can automatically receive a Letsencrypt certificate:

```
./get_certificates.sh
```

