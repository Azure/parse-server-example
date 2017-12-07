class UserProfile {
  constructor() {
    this.razonSocial = null;
    this.domicilioSocial = null;
    this.poblacion = null;
    this.provincia = null;
    this.nifNie = null;
    this.codigoPostal = null;
  }

  loadFromParseObject(parseUserProfile) {
    if (!parseUserProfile) return;
    this.razonSocial = parseUserProfile.get('razonSocial');
    this.domicilioSocial = parseUserProfile.get('domicilioSocial');
    this.poblacion = parseUserProfile.get('poblacion');
    this.provincia = parseUserProfile.get('provincia');
    this.nifNie = parseUserProfile.get('nifNie');
    this.codigoPostal = parseUserProfile.get('codigoPostal');
  }
}

module.exports = UserProfile;
