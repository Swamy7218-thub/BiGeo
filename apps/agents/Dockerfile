FROM python:3.12-slim

WORKDIR /srv

COPY apps/api/requirements.txt /srv/requirements.txt
RUN pip install --no-cache-dir -r /srv/requirements.txt

COPY apps/api /srv/api
COPY apps/agents /srv/agents

ENV PYTHONPATH=/srv/api:/srv
WORKDIR /srv

# No default CMD -- the ECS task definition's `command` selects which agent
# entrypoint to run (e.g. python -m agents.sourcing.run).
