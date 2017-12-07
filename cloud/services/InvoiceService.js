const _ = require('lodash');
const logger = require('../logger');
const Factura = require('../models/Factura');
const InsertFacturaResponse = require('./DTO/InsertFacturaResponse');

async function getPending(parse) {
  const result = [];
  try {
    const query = new parse.Query('AutonomoTicketMerchant');
    query.include('merchant');
    query.include('merchant.invoiceMakers');
    query.include('merchant.logo');
    query.include('autonomo');
    query.include('autonomo.userProfile');
    query.include('tickets');
    query.equalTo('status', 'N');

    const queryResult = await query.find({ useMasterKey: true });
    _.each(queryResult, dbFactura => {
      const factura = new Factura();
      factura.loadFromParseObject(dbFactura);
      result.push(factura);
    });

    return result;
  } catch (error) {
    logger.error(`Error on InvoiceService.getPending: ${error.message}`);
  }
}

async function insertInvoice(parse, request) {
  const response = new InsertFacturaResponse();
  try {
    const newInvoice = new Parse.Object('Facturas');
    const newInvoiceACL = new Parse.ACL();
    newInvoiceACL.setPublicWriteAccess(false);
    newInvoiceACL.setPublicReadAccess(true);
    newInvoiceACL.setRoleWriteAccess('Admin', true);
    newInvoiceACL.setRoleReadAccess('Admin', true);
    newInvoice.setACL(newInvoiceACL);

    newInvoice.set('tipo', request.tipo);

    if (request.file) {
      const file = new Parse.File('factura.pdf', {
        base64: request.file.toString('base64')
      });
      newInvoice.set('factura', file);
    }

    const merchant = await getMerchantById(parse, request.merchant.id);
    newInvoice.set('merchant', merchant);

    const anyoFacturacion = parseFloat(
      request.periodoFacturacion
        .getFullYear()
        .toString()
        .substr(-2)
    );

    newInvoice.set('numeroFactura', request.numeroFactura);
    newInvoice.set('anyoFacturacion', anyoFacturacion);
    newInvoice.set('mesFacturacion', request.periodoFacturacion.getMonth() + 1);
    let tickets = [];

    for (let ticket in request.tickets) {
      const result = await getTicketById(parse, request.tickets[ticket].id);
      tickets.push(result);
    }

    newInvoice.set('tickets', tickets);

    const autonomo = await getUserById(parse, request.autonomo.id);
    newInvoice.set('autonomo', autonomo);
    newInvoice.set('tipo', request.tipo);
    const result = await newInvoice.save();

    if (result) {
      response.created = true;
      response.factura = result;
    } else {
      response.created = false;
    }
  } catch (error) {
    response.created = false;
    response.errors = error.message;
    logger.error(
      `Error on InvoiceService.insertDraftInvoice: ${error.message}`
    );
  }
  return response;
}

async function updateInvoice(parse, request) {
  try {
    const invoice = new parse.Object('Facturas');
    invoice.id = request.idFactura;
    const result = await invoice.fetch();
    if (result) {
      if (request.file) {
        const file = new Parse.File('factura.pdf', {
          base64: request.file.toString('base64')
        });
        result.set('factura', file);
      }
      if (request.status) {
        result.set('status', request.status);
      }
      const res = await result.save(null, { useMasterKey: true });
      return res;
    }
  } catch (error) {
    logger.error(`Error on InvoiceService.updateInvoice: ${error.message}`);
  }
}

async function getMerchantById(parse, merchantId) {
  try {
    const merchant = new parse.Object('Merchant');
    merchant.id = merchantId;

    const result = await merchant.fetch({ useMasterKey: true });
    return result;
  } catch (error) {
    logger.error(
      `Error on InvoiceService.insertDraftInvoice: ${error.message}`
    );
  }
}

async function getTicketById(parse, ticketId) {
  try {
    const ticket = new parse.Object('Tickets');
    ticket.id = ticketId;
    const result = await ticket.fetch({ useMasterKey: true });
    return result;
  } catch (error) {
    logger.error(`Error on InvoiceService.getTicketById: ${error.message}`);
  }
}

async function getUserById(parse, userId) {
  try {
    const user = new parse.User();
    user.id = userId;
    const result = await user.fetch({ useMasterKey: true });
    return result;
  } catch (error) {
    logger.error(`Error on InvoiceService.getUserById: ${error.message}`);
  }
}

async function getNextInvoiceIdByMerchantId(
  parse,
  merchantId,
  anyoFacturacion
) {
  try {
    const merchant = await getMerchantById(parse, merchantId);
    const invoiceQuery = new parse.Query('Facturas');
    invoiceQuery.equalTo('merchant', merchant);
    invoiceQuery.equalTo('anyoFacturacion', anyoFacturacion);
    invoiceQuery.descending('createdAt');

    const result = await invoiceQuery.first({ useMasterKey: true });
    if (result) {
      const lastNum = result.get('numeroFactura');
      let num = parseFloat(lastNum.substring(7, lastNum.length));
      num += 1;
      return `FI${anyoFacturacion}001${num.toString().padStart(5, '0')}`;
    } else {
      return `FI${anyoFacturacion}00100001`;
    }
  } catch (error) {
    logger.error(
      `Error on InvoiceService.getNextInvoiceIdByMerchantId: ${error.message}`
    );
  }
}

async function insertInvoiceEvent(parse, request) {
  try {
    const event = new parse.Object('FacturasEventLog');
    const eventACL = new Parse.ACL();
    eventACL.setPublicWriteAccess(false);
    eventACL.setPublicReadAccess(true);
    eventACL.setRoleWriteAccess('Admin', true);
    eventACL.setRoleReadAccess('Admin', true);
    event.setACL(eventACL);

    event.set('factura', request.factura);
    event.set('type', request.type);
    event.set('info', request.info);

    const result = await event.save();
  } catch (error) {
    logger.error(`Error on insertInvoiceEvent ${error.message}`);
  }
}

async function deleteDraftInvoice(parse, id) {
  const result = { deleted: false, error: null };
  try {
    const draft = new parse.Object('AutonomoTicketMerchant');
    draft.id = id;
    const draftResult = await draft.fetch({ useMasterKey: true });
    if (draftResult) {
      await draftResult.destroy();
      result.deleted = true;
    }
  } catch (error) {
    logger.error(`Error on deleteDraftInvoice: ${error.message}`);
    result.deleted = false;
    result.error = error.message;
  }
  return result;
}
module.exports = {
  getPending,
  insertInvoice,
  getNextInvoiceIdByMerchantId,
  insertInvoiceEvent,
  updateInvoice,
  deleteDraftInvoice
};
