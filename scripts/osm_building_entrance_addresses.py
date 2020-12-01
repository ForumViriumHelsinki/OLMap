import overpy, json

api = overpy.Overpass()

query = """
[out:json][timeout:25];
node["addr:housenumber"]["entrance"](area:3600034914)->.entrances;
.entrances out;
.entrances < -> .ways;
way["building"].ways -> .buildings;
.buildings out;
"""

result = api.query(query)

entrance_index = dict((n.id, n) for n in result.nodes)

def to_address(tags):
    nr = tags.get('addr:housenumber', None)
    street = tags.get('addr:street', None)
    if nr and street:
        return f'{street} {nr}'

buildings = []
for building in result.ways:
    b = {
        'id': building.id,
        'address': to_address(building.tags),
        'entrances': {}
    }
    buildings.append(b)
    for id in building._node_ids:
        entrance = entrance_index.get(id, None)
        if entrance:
            address = to_address(entrance.tags)
        if not (entrance and address):
            continue
        b['entrances'].setdefault(address, []).append(id)

print(json.dumps(buildings, indent=1, ensure_ascii=False))

