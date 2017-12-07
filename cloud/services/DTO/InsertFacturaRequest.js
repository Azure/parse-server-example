class InsertFacturaRequest {
  constructor() {
    this.tipo = null;
    this.file = null;
    this.numeroFactura = null;
    this.tickets = [];
    this.merchant = null;
    this.autonomo = null;
    this.periodoFacturacion = null;
  }
}

module.exports = InsertFacturaRequest;
