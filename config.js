module.exports = {
  server: {
    appId: '53509fcc-be66-4f8c-9da1-79dfa9e3a030',
    masterKey: '1c11ca6f-c6b7-437a-9e42-366e88a3bf79',
    databaseURI:
      'mongodb://facturivadb-parse:XV5O2KFyyO0rGIzNoQfDXGvwC5vllDYoiCllSYOdsyBRJn1JoZNH1IRBjBGkKkxZztbk1eNzOr5GUAl2QOAmKg==@facturivadb-parse.documents.azure.com:10250/parse?ssl=true',
    serverURL: 'http://localhost:1337/parse'
  },
  dashboard: {
    apps: [
      {
        appId: '53509fcc-be66-4f8c-9da1-79dfa9e3a030',
        serverURL: 'http://localhost:1337/parse',
        masterKey: '1c11ca6f-c6b7-437a-9e42-366e88a3bf79',
        appName: 'Facturiva'
      }
    ],
    users: [
      {
        user: 'parse',
        pass:
          'XV5O2KFyyO0rGIzNoQfDXGvwC5vllDYoiCllSYOdsyBRJn1JoZNH1IRBjBGkKkxZztbk1eNzOr5GUAl2QOAmKg=='
      }
    ]
  }
};
//'mongodb://facturivadevdb-parse:wgvxnpK7AiaVku1k2XLJpcnxRdIhGUVDxn47KdM6rGUpI1BQ3E3KHpAFEjpQCwh08zsrWlKPQwgLmhS0YP0ptg==@facturivadevdb-parse.documents.azure.com:10250/parse?ssl=true',
// mongodb://facturivadevdb-parse:wgvxnpK7AiaVku1k2XLJpcnxRdIhGUVDxn47KdM6rGUpI1BQ3E3KHpAFEjpQCwh08zsrWlKPQwgLmhS0YP0ptg==@facturivadevdb-parse.documents.azure.com:10250/parse?ssl=true
