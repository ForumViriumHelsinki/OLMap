# Open Logistics Map - OLMap
App for collecting and discussing geospatial features important for last mile city logistics
(entrances, steps, gates, barriers etc.) and modeling them for inclusion in OpenStreetMap.

## Installation

**Prerequisites**: 
* Python 3.9+ with uv
* Node.js 18+ with npm
* Postgres with a db available as configured in django_server/olmap_config/settings.py

In project root:

```
cd django_server
uv pip install -e .
python manage.py migrate
python manage.py createsuperuser
<Configure user to your satisfaction>
python manage.py runserver
<Verify that you can login at 127.0.0.1:8000/admin/ >
```

In react_ui:

```
npm install
npm start
<Verify that you can login to React UI at 127.0.0.1:3000 using your superuser or courier user credentials>
```
