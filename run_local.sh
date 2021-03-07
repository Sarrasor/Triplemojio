#!/bin/bash

echo "Updating configs to run locally..."

# Generate config for the room server
sed 's@<hostname>@localhost@' ./room_server/server/config.js.nodata > ./room_server/server/config.js
sed -i 's@LOCAL = false@LOCAL = true@' ./room_server/server/config.js

# Generate config for the game server
sed 's@<server_name>@localhost@' ./game_server/nginx.conf.nodata > ./game_server/nginx.conf
sed 's@<server_name>@localhost@' ./game_server/game_files/scripts/server_config.js.nodata > ./game_server/game_files/scripts/server_config.js
sed -i 's@LOCAL = false@LOCAL = true@' ./game_server/game_files/scripts/server_config.js

echo "Generating local certificates..."

# Generating local certificates
mkdir -p "./certificates/certbot/conf/live/localhost"
openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
    -keyout './certificates/certbot/conf/live/localhost/privkey.pem' \
    -out './certificates/certbot/conf/live/localhost/fullchain.pem' \
    -subj '/CN=localhost'

# Copy certeficates to the room server
mkdir -p ./room_server/server/certificates/certbot/conf/live/localhost
cp ./certificates/certbot/conf/live/localhost/privkey.pem ./room_server/server/certificates/certbot/conf/live/localhost/privkey.pem 
cp ./certificates/certbot/conf/live/localhost/fullchain.pem ./room_server/server/certificates/certbot/conf/live/localhost/fullchain.pem

echo "Done"
