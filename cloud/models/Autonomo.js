const UserProfile = require('./UserProfile');

class Autonomo {
  constructor() {
    this.id = null;
    this.nombre = null;
    this.apellidos = null;
    this.email = null;
    this.UserProfile = null;
  }

  loadFromParseObject(parseAutonomo) {
    if (!parseAutonomo) return;
    this.id = parseAutonomo.id;
    this.nombre = parseAutonomo.get('name');
    this.apellidos = parseAutonomo.get('surnames');
    this.email = parseAutonomo.get('email');
    if (parseAutonomo.get('userProfile')) {
      const userProfile = new UserProfile();
      userProfile.loadFromParseObject(parseAutonomo.get('userProfile'));
      this.userProfile = userProfile;
    }
  }
}

module.exports = Autonomo;
