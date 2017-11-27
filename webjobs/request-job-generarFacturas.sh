#!/bin/sh

curl --request POST \
  --url https://facturiva.azurewebsites.net/parse/jobs/generarFacturas \
  --header 'content-type: application/json' \
  --header 'content-length: 0' \
  --header "x-parse-application-id: ${APP_ID}" \
  --header "x-parse-master-key: ${MASTER_KEY}"