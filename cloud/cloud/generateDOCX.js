const JSZip = require('jszip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

module.exports = {
  createDocx(templateName, jsonData) {
    const response = { buffer: null, error: null };
    try {
      const content = fs.readFileSync(
        path.resolve(__dirname, templateName),
        'binary'
      );
      const zip = new JSZip(content);
      const doc = new Docxtemplater();
      doc.loadZip(zip);
      doc.setData(jsonData);

      try {
        doc.render();
      } catch (error) {
        return null;
      }
      response.buffer = doc.getZip().generate({ type: 'nodebuffer' });
      return response;
    } catch (error) {
      response.error = error.message;
    }
    return response;
  }
};
