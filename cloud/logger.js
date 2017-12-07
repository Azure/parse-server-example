const logger = require('parse-server').logger;

module.exports = {
  info(message) {
    logger.log('info', message);
  },
  error(message) {
    if (typeof message === 'object') {
      logger.log('error', message.message);
    } else {
      logger.log('error', message);
    }
  }
};
