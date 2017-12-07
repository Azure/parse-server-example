class Ticket {
  constructor() {
    this.id = null;
    this.importe = null;
    this.tipoPago = null;
    this.status = null;
    this.comments = null;
    this.image = null;
    this.numeroTicket = null;
    this.fecha = null;
    this.porcentajeIVA = null;
  }

  loadFromParseObject(parseTicket) {
    if (!parseTicket) return this;
    this.id = parseTicket.id;
    this.importe = parseTicket.get('importe');
    this.tipoPago = parseTicket.get('tipoPago');
    this.status = parseTicket.get('status');
    this.comments = parseTicket.get('comments');
    this.image = parseTicket.get('image')
      ? parseTicket.get('image').url()
      : null;
    this.numeroTicket = parseTicket.get('numeroTicket');
    this.fecha = parseTicket.get('fecha');
    this.porcentajeIVA = parseTicket.get('porcentajeIVA');
  }
}

module.exports = Ticket;
