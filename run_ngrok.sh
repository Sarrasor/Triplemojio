#!/bin/bash

echo "Starting Ngrok..."

# Run Ngrok
./ngrok/ngrok start -config ngrok_config.yml game_server room_server > /dev/null &

# Wait for Ngrok to start
sleep 2

echo "Fetching Ngrok tunnels..."
# Get info about Ngrok tunnels
python3 get_ngrok_tunnels.py

# Add environment variables with server names
. ./ngrok_tunnels.txt

echo "Updating configs with Ngrok tunnels..."

# Generate config for the room server
sed 's@<hostname>@'"$GAME_SERVER"'@' ./room_server/server/config.js.nodata > ./room_server/server/config.js
sed -i 's@LOCAL = true@LOCAL = false@' ./room_server/server/config.js

# Generate config for the game server
sed 's@<server_name>@'"$GAME_SERVER"'@' ./game_server/nginx.conf.nodata > ./game_server/nginx.conf
sed 's@<server_name>@'"$ROOM_SERVER"'@' ./game_server/game_files/scripts/server_config.js.nodata > ./game_server/game_files/scripts/server_config.js
sed -i 's@LOCAL = true@LOCAL = false@' ./game_server/game_files/scripts/server_config.js

# Cleanup
rm tunnels.json
rm ngrok_tunnels.txt

echo "Done"
