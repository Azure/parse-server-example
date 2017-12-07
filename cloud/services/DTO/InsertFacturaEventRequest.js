const FACTURA_EVENT_TYPE = { error: 'E', info: 'I' };

class InsertFacturaEventRequest {
  constructor() {
    this.factura = null;
    this.type = null;
    this.info = null;
  }
}

module.exports = { InsertFacturaEventRequest, FACTURA_EVENT_TYPE };
