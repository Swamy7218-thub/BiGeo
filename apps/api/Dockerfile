FROM python:3.12-slim

WORKDIR /srv

COPY apps/api/requirements.txt /srv/requirements.txt
RUN pip install --no-cache-dir -r /srv/requirements.txt

COPY apps/api /srv/api
COPY apps/agents /srv/agents

ENV PYTHONPATH=/srv/api:/srv
WORKDIR /srv/api

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
