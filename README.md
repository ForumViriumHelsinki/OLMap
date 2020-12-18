# Open Logistics Map - OLMap
App for collecting and discussing geospatial features important for last mile city logistics
(entrances, steps, gates, barriers etc.) and modeling them for inclusion in OpenStreetMap.

## Installation

**Prerequisites**: 
* Python 3.7 with pip
* Node.js 13.3 with ./node_modules/.bin in the PATH
* Postgres with a db available as configured in django_server/olmap_config/settings.py

In project root:

```
sudo pip install pipenv
cd django_server
pipenv install
pipenv shell
python manage.py migrate
python manage.py createsuperuser
<Configure user to your satisfaction>
python manage.py runserver
<Verify that you can login at 127.0.0.1:8000/admin/ >
```

In react_ui:

```
npm install yarn
yarn install
yarn start
<Verify that you can login to React UI at 127.0.0.1:3000 using your superuser or courier user credentials>
```
