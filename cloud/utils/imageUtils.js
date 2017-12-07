var request = require('request').defaults({ encoding: null });
const pngRegularEx = /^.*.png$/;
const jpgRegularEx = /^.*.jpg$/;

module.exports = {
  async getImageFromUrl(imageUrl) {
    return new Promise(function(resolve, reject) {
      request.get(imageUrl, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          let imageType = '';
          if (pngRegularEx.exec(imageUrl)) {
            imageType = 'image/png';
          } else if (jpgRegularEx.exec(imageUrl)) {
            imageType = 'image/jpg';
          }

          console.log(response);
          const data =
            'data:' +
            imageType +
            ';base64,' +
            new Buffer(body).toString('base64');
          resolve(data);
        } else {
          resolve(null);
        }
      });
    });
  }
};
