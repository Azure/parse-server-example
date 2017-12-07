const _ = require('lodash');
const InvoiceMaker = require('./InvoiceMaker');

class Merchant {
  constructor() {
    this.id = null;
    this.nombre = null;
    this.razonSocial = null;
    this.direccion = null;
    this.fuc = null;
    this.telefono = null;
    this.nifCif = null;
    this.tipoMerchant = null;
    this.email = null;
    this.codigoPostal = null;
    this.localidad = null;
    this.provincia = null;
    this.efc3 = null;
    this.logo = null;
    this.invoiceMakers = [];
  }

  loadFromParseObject(parseMerchant) {
    if (!parseMerchant) return this;
    this.id = parseMerchant.id;
    this.nombre = parseMerchant.get('nombre');
    this.direccion = parseMerchant.get('direccion');
    this.fuc = parseMerchant.get('fuc');
    this.telefono = parseMerchant.get('telefono');
    this.nifCif = parseMerchant.get('nifCif');
    this.tipoMerchant = parseMerchant.get('tipoMerchant');
    this.email = parseMerchant.get('email');
    this.codigoPostal = parseMerchant.get('codigoPostal');
    this.localidad = parseMerchant.get('localidad');
    this.provincia = parseMerchant.get('provincia');
    this.efc3 = parseMerchant.get('efc3');
    this.razonSocial = parseMerchant.get('razonSocial');
    this.logo = parseMerchant.get('logo')
      ? parseMerchant.get('logo').url()
      : null;
    _.each(parseMerchant.get('invoiceMakers'), invoiceMaker => {
      const result = new InvoiceMaker();
      result.loadFromParseObject(invoiceMaker);
      this.invoiceMakers.push(result);
    });
  }
}

module.exports = Merchant;
