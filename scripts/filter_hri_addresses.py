import json

from pyproj import Transformer

# hki_osoiteluettelo.json contains results from HTTP query
# https://kartta.hel.fi/ws/geoserver/avoindata/wfs?version=1.1.0&request=GetFeature&typeName=avoindata:Osoiteluettelo_piste_rekisteritiedot&outputformat=json
# File omitted from git due to large size.

transformer = Transformer.from_crs("epsg:3879", "epsg:4326")

addresses_file = open("./hki_osoiteluettelo.json", encoding="utf8")
addresses = json.load(addresses_file)
addresses_file.close()

addresses_out = []
for f in addresses["features"]:
    props = f["properties"]
    if props["osoitenumero"]:
        coord = transformer.transform(props["n"], props["e"])
        addresses_out.append(
            {
                "katunimi": props["katunimi"],
                "osoitenumero": props["osoitenumero"],
                "coord": coord,
            }
        )
        if "-" in props["osoitenumero"]:
            for part in props["osoitenumero"].split("-"):
                addresses_out.append(
                    {
                        "katunimi": props["katunimi"],
                        "osoitenumero": part,
                        "coord": coord,
                    }
                )

out = open("./hki_osoiteluettelo_cleaned.json", "w", encoding="utf8")
json.dump(addresses_out, out, indent=1, ensure_ascii=False)
out.close()
