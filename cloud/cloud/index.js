const generateDOCX = require('./generateDOCX');
const generatePDF = require('./generatePDF');
const fs = require('fs');
const path = require('path');

Parse.Cloud.define('averageStars', async function(request, response) {
  const jsonData = {
    clients: [
      {
        first_name: 'Jhon'
      },
      {
        first_name: 'Jane'
      }
    ]
  };
  const doc = generateDOCX.createDocx('factura-template.docx', jsonData);
  const pdf = await generatePDF.getPDF(doc);
  fs.writeFileSync(path.resolve(__dirname, 'test.pdf'), pdf);
});
