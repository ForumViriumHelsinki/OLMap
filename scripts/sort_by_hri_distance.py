import json
import re

from geopy import distance

# entrances_with_address.geojson contains output from Overpass query
# [out:json][timeout:25];
# // fetch area “Helsinki” to search in
# {{geocodeArea:Helsinki}}->.searchArea;
# // gather results
# (
#   // query part for: “addr:housenumber and entrance”
#   node["addr:housenumber"]["entrance"](area.searchArea);
# );
# // print results
# out body;
# >;
# out skel qt;
# hki_osoiteluettelo_cleaned.json contains output from filter_hri_addresses.py

# Files omitted from git due to large size.

addresses_file = open('./hki_osoiteluettelo_cleaned.json', encoding='utf8')
addresses = json.load(addresses_file)
addresses_file.close()

entrances_file = open('./entrances_with_address.geojson', encoding='utf8')
entrances = list(dict(f['properties'], coord=f['geometry']['coordinates'])
             for f in json.load(entrances_file)['features'])
entrances_file.close()

address_index = {}
for a in addresses:
    nr = a["osoitenumero"]
    nr_numeric = re.match(r"\d*", nr).group()  # If nr is e.g. 7a or 7-9, nr_numeric will be 7
    address_index[f'{a["katunimi"]} {nr}'] = a
    address_index.setdefault(f'{a["katunimi"]} {nr_numeric}', a)

for e in entrances:
    nr = e["addr:housenumber"]
    nr_numeric = re.match(r"\d*", nr).group()  # If nr is e.g. 7a or 7-9, nr_numeric will be 7
    street = e.get("addr:street", None)
    address = address_index.get(
        f'{street} {nr}',
        address_index.get(f'{street} {nr_numeric}', None))
    if address:
        e['distance'] = distance.distance(e['coord'], reversed(address['coord'])).meters
    else:
        e['distance'] = 0

entrances.sort(key=lambda e: e['distance'], reverse=True)

out = open('./entrances_with_distance.json', 'w', encoding='utf8')
json.dump(entrances, out, indent=1, ensure_ascii=False)
out.close()
