import re

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


def to_tuple(tags):
    nr = tags.get('addr:housenumber', None)
    street = tags.get('addr:street', None)
    if nr and street:
        try:
            nr = re.match(r'^\d+', nr)[0]
        except TypeError:
            pass
        return (street, nr)


buildings = []
for building in result.ways:
    addr = to_tuple(building.tags)
    b = {
        'id': building.id,
        'address': to_address(building.tags),
        'entrances': {},
        'addresses': [addr] if addr else []
    }
    buildings.append(b)
    for id in building._node_ids:
        entrance = entrance_index.get(id, None)
        if entrance:
            address = to_address(entrance.tags)
        if not (entrance and address):
            continue
        b['entrances'].setdefault(address, []).append(id)
        a_tuple = to_tuple(entrance.tags)
        if a_tuple and (a_tuple not in b['addresses']):
            b['addresses'].append(a_tuple)

buildings.sort(
    key=lambda b: len(b['addresses']) + 100 if len(set(a[0] for a in b['addresses'])) < len(b['addresses']) else 0,
    reverse=True)
for b in buildings:
    del b['addresses']
print(json.dumps(buildings, indent=1, ensure_ascii=False))
