import json
import os

import django
import geopandas
from geopy.distance import distance

os.environ["DJANGO_SETTINGS_MODULE"] = "city_logistics.settings"
django.setup()

from fvh_courier.models import Entrance

osoitehaavi_entrances_frame = geopandas.read_file("osoitehaavi-hki.gpkg").to_crs("epsg:4326")

entrance_index = {}
identifiers = set()

for [id, address_name, entrance_type_id, entrance_identifier, geometry] in osoitehaavi_entrances_frame.values:
    [city, housenumber, street, street_sv] = address_name.split("|")
    address = f'{street} {housenumber} {entrance_identifier or ""}'.strip()
    identifiers.add(entrance_identifier)
    entrance_index.setdefault(address, {"osoitehaavi": [], "olmap": [], "ids": []})
    entrance_index[address]["osoitehaavi"].append(geometry.coords[0])

for entrance in Entrance.objects.select_related("image_note").all():
    address = f'{entrance.street} {entrance.housenumber} {entrance.unit or ""}'.strip()
    entrance_index.setdefault(address, {"osoitehaavi": [], "olmap": [], "ids": []})
    entrance_index[address]["olmap"].append((float(entrance.image_note.lon), float(entrance.image_note.lat)))
    entrance_index[address]["ids"].append(entrance.image_note_id)


with open("all_entrances.json", "w", encoding="utf8") as f:
    json.dump(entrance_index, f, indent=1, ensure_ascii=False)

only_in_olmap = []
only_in_osoitehaavi = []
in_both = []

for address, points in entrance_index.items():
    if not len(points["olmap"]):
        only_in_osoitehaavi.append(address)
    elif not len(points["osoitehaavi"]):
        only_in_olmap.append(address)
    else:
        in_both.append(address)

print(f"{len(only_in_olmap)} entrance identifiers only in OLMap")
print(f"{len(only_in_osoitehaavi)} entrance identifiers only in Osoitehaavi")
print(f"{len(in_both)} entrance identifiers found in both")

common_entrances = [dict(address=address, **points) for address, points in entrance_index.items() if address in in_both]

for entrances in common_entrances:
    lists = sorted([entrances["olmap"], entrances["osoitehaavi"]], key=len)
    entrances["distances"] = []
    for point in lists[0]:
        closest_match = min(distance(reversed(point), reversed(p2)) for p2 in lists[1])
        entrances["distances"].append(closest_match.meters)

common_entrances.sort(key=lambda e: max(e["distances"]))

with open("common_entrances.json", "w", encoding="utf8") as f:
    json.dump(common_entrances, f, indent=1, ensure_ascii=False)

suspicious_entrances = list(filter((lambda e: max(e["distances"]) > 10), common_entrances))

print(f"\n{len(suspicious_entrances)} identifiers with entrances over 10m apart:")
for e in suspicious_entrances:
    print(f'{e["address"]} ({max(e["distances"]):.1f}m)')
