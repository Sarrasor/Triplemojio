import json
import os
from collections import Counter

os.system("curl  http://localhost:4040/api/tunnels > tunnels.json")

with open('tunnels.json') as data_file:
    datajson = json.load(data_file)

domains = []
for tunnel in datajson['tunnels']:
    domains.append(tunnel['public_url'].split('://')[-1])
domains = Counter(domains)

keys = list(domains.keys())
values = list(domains.values())

with open("ngrok_tunnels.txt", "w") as f:
    f.write(f"export ROOM_SERVER={keys[values.index(1)]}\n")
    f.write(f"export GAME_SERVER={keys[values.index(2)]}\n")
