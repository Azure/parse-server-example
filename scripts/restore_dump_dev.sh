#!/bin/sh

 mongorestore --drop -vvv --host=facturivaparsedevdb-parse.documents.azure.com --port=10250 \
  --username=facturivaparsedevdb-parse \
  --password=aUXkxvqqxSfcVrSqVVYI8gzvOzTBsgDgk2EmuMb7rkAEeQQjt632PArGiiFe2fSrDpy7CD379Tl7YveqbslJ6g== \
  --ssl \
  --db=parse dump/parse

#mongodb://facturivaparsedevdb-parse:aUXkxvqqxSfcVrSqVVYI8gzvOzTBsgDgk2EmuMb7rkAEeQQjt632PArGiiFe2fSrDpy7CD379Tl7YveqbslJ6g==@facturivaparsedevdb-parse.documents.azure.com:10250/parse?ssl=true


#mongo --username facturivaparsedevdb-parse --password aUXkxvqqxSfcVrSqVVYI8gzvOzTBsgDgk2EmuMb7rkAEeQQjt632PArGiiFe2fSrDpy7CD379Tl7YveqbslJ6g== --host facturivaparsedevdb-parse.documents.azure.com --port 10250