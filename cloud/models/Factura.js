const _ = require('lodash');
const Ticket = require('./Ticket');
const Autonomo = require('./Autonomo');
const Merchant = require('./Merchant');

class Factura {
  constructor() {
    this.id = null;
    this.autonomo = null;
    this.merchant = null;
    this.tickets = [];
    this.mesFacturacion = null;
    this.status = null;
    this.lastMailSended = null;
  }

  loadFromParseObject(parseFactura) {
    if (!parseFactura) return;
    this.id = parseFactura.id;
    this.mesFacturacion = parseFactura.get('mesFacturacion');
    this.status = parseFactura.get('status');
    this.lastMailSended = parseFactura.get('lastMailSended');
    this.autonomo = new Autonomo();
    this.autonomo.loadFromParseObject(parseFactura.get('autonomo'));
    this.merchant = new Merchant();
    this.merchant.loadFromParseObject(parseFactura.get('merchant'));
    _.each(parseFactura.get('tickets'), dbTicket => {
      const ticket = new Ticket();
      ticket.loadFromParseObject(dbTicket);
      this.tickets.push(ticket);
    });
  }
}

module.exports = Factura;
