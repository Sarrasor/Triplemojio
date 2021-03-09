import json
import os

os.system("curl  http://localhost:4040/api/tunnels > tunnels.json")

with open('tunnels.json') as data_file:
    datajson = json.load(data_file)

domains = {}
for tunnel in datajson['tunnels']:
    if tunnel['proto'] == 'https':
        domains[tunnel['name']] = tunnel['public_url'].split('://')[-1]

with open("ngrok_tunnels.txt", "w") as f:
    f.write(f"export ROOM_SERVER={domains['room_server']}\n")
    f.write(f"export GAME_SERVER={domains['game_server']}\n")
