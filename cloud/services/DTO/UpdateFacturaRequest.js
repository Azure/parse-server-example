class UpdateFacturaRequest {
  constructor() {
    this.idFactura = null;
    this.file = null;
    this.status = null;
  }
}

const FACTURA_STATUS = {
  error: 'E',
  pendiente: 'P',
  confirmada: 'C'
};

module.exports = { UpdateFacturaRequest, FACTURA_STATUS };
