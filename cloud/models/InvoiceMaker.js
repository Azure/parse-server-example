class InvoiceMaker {
  constructor() {
    this.id = null;
    this.nombre = null;
    this.telefono = null;
    this.email = null;
  }

  loadFromParseObject(parseInvoiceMaker) {
    if (!parseInvoiceMaker) return this;
    this.id = parseInvoiceMaker.id;
    this.nombre = parseInvoiceMaker.get('nombre');
    this.telefono = parseInvoiceMaker.get('telefono');
    this.email = parseInvoiceMaker.get('email');
  }
}

module.exports = InvoiceMaker;
