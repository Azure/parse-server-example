#!/bin/sh

mongodump -v --host=facturivadevdb-parse.documents.azure.com --port=10250 \
  --username=facturivadevdb-parse \
  --password=wgvxnpK7AiaVku1k2XLJpcnxRdIhGUVDxn47KdM6rGUpI1BQ3E3KHpAFEjpQCwh08zsrWlKPQwgLmhS0YP0ptg== \
  --ssl \
  --db=parse
# mongodb://facturivadevdb-parse:wgvxnpK7AiaVku1k2XLJpcnxRdIhGUVDxn47KdM6rGUpI1BQ3E3KHpAFEjpQCwh08zsrWlKPQwgLmhS0YP0ptg==@facturivadevdb-parse.documents.azure.com:10250/parse?ssl=true