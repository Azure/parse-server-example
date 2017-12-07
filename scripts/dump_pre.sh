#!/bin/sh

mongodump -v --host=facturivadb-parse.documents.azure.com --port=10250 \
  --username=facturivadb-parse \
  --password=XV5O2KFyyO0rGIzNoQfDXGvwC5vllDYoiCllSYOdsyBRJn1JoZNH1IRBjBGkKkxZztbk1eNzOr5GUAl2QOAmKg== \
  --ssl \
  --db=parse

