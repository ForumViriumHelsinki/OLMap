# Open Logistics Map - OLMap

App for collecting and discussing geospatial features important for last mile city logistics
(entrances, steps, gates, barriers etc.) and modeling them for inclusion in OpenStreetMap.

# Repository Archived
Note: This repository has been archived.

This project has concluded, and the code is no longer actively maintained. However, you are free to use the code as per the license terms. If you wish to continue development, feel free to fork this repository.

Thank you for your interest in this project.

-- project team 2026-08-27

## Installation

**Prerequisites**:

- Python 3.9+ with uv
- Node.js 18+ with npm
- Postgres with a db available as configured in django_server/olmap_config/settings.py

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
