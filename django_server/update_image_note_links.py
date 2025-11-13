import os

import django

os.environ["DJANGO_SETTINGS_MODULE"] = "olmap_config.settings"
django.setup()

from olmap.models.map_features import link_notes_to_official_address, link_notes_to_osm_objects

link_notes_to_osm_objects()
link_notes_to_official_address()
