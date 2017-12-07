const docToPdf = require('docx-to-pdf');

module.exports = {
  getPDF(buf) {
    const response = { file: null, error: null };
    try {
      return new Promise(function(resolve, reject) {
        docToPdf(buf, function(err, data) {
          response.file = data;
          response.error = err ? err.message : null;
          resolve(response);
        });
      });
    } catch (error) {
      response.error = error.message;
    }
    return response;
  }
};
