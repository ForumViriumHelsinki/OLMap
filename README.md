# CityLogistics
Proof of concept app for last mile city logistics

## Installation

**Prerequisites**: Python 3.7, Node.js 13.3

In project root:

```
pip install pipenv
pipenv install
cd django_server
python manage.py migrate
python manage.py createsuperuser
<Configure user to your satisfaction>
python manage.py runserver
<Verify that you can login at 127.0.0.1:8000/admin/ >
<Create a courier user, e.g. "courier" which belongs to "courier" group>
```

In city_logistics_ui:

```
npm install yarn
yarn install
yarn start
<Verify that you can login to React UI at 127.0.0.1:3000 using your superuser or courier user credentials>
```
