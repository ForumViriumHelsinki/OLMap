# pull base image
FROM python:3.7

# set work directory
WORKDIR /usr/src/app

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# copy Pipfile
COPY Pipfile /usr/src/app/
COPY Pipfile.lock /usr/src/app/

# install dependencies
RUN pip install pipenv
RUN pipenv install --system --deploy

# copy entrypoint.sh
COPY ./entrypoint.sh /usr/src/app/entrypoint.sh

# copy project
COPY . /usr/src/app/

# run entrypoint.sh
ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
