const _ = require('lodash');

function getDataFacturacion(ticketDate) {
  if (ticketDate) {
    const month = ticketDate.getMonth();
    const year = ticketDate.getFullYear();
    const date = new Date(Date.UTC(year, month + 1, 0, 0, 0, 0, 0));
    return date;
  }
  return null;
}

async function getAutonomoMerchantTicket(autonomo, merchant, mesFacturacion) {
  try {
    const query = new Parse.Query('AutonomoTicketMerchant');
    query.include('tickets');
    query.equalTo('autonomo', autonomo);
    query.equalTo('merchant', merchant);
    query.equalTo('mesFacturacion', mesFacturacion);

    const result = await query.first();
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
}

function exsistTicketInArray(ticketArray, ticket) {
  let result = { exsist: false, index: -1 };
  try {
    _.map(ticketArray, (ticketArrayItem, index) => {
      if (ticketArrayItem.id === ticket.id) {
        result = { exsist: true, index: index };
        return true;
      }
    });
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function insertAutonomoMerchantTicket(
  autonomo,
  merchant,
  ticket,
  logger
) {
  try {
    const mesFacturacion = getDataFacturacion(ticket.get('fecha'));
    const result = await getAutonomoMerchantTicket(
      autonomo,
      merchant,
      mesFacturacion
    );

    if (result) {
      const exsistTicket = exsistTicketInArray(result.get('tickets'), ticket);
      if (!exsistTicket.exsist) {
        result.get('tickets').push(ticket);
        result.save();
      }
    } else {
      const autnonomoMerchantTicket = new Parse.Object(
        'AutonomoTicketMerchant'
      );
      const autnonomoMerchantTicketACL = new Parse.ACL();
      autnonomoMerchantTicketACL.setPublicWriteAccess(true);
      autnonomoMerchantTicketACL.setPublicReadAccess(true);
      autnonomoMerchantTicketACL.setRoleWriteAccess('Admin', true);
      autnonomoMerchantTicketACL.setRoleReadAccess('Admin', true);
      autnonomoMerchantTicket.setACL(autnonomoMerchantTicketACL);
      autnonomoMerchantTicket.set('autonomo', autonomo);
      autnonomoMerchantTicket.set('merchant', merchant);
      autnonomoMerchantTicket.set('tickets', [ticket]);
      autnonomoMerchantTicket.set('mesFacturacion', mesFacturacion);
      autnonomoMerchantTicket.save();
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

async function removeTicketFromArray(autonomo, merchant, ticket, logger) {
  try {
    const autonomoMerchantTickets = await getAutonomoMerchantTicket(
      autonomo,
      merchant,
      getDataFacturacion(ticket.get('fecha'))
    );

    if (autonomoMerchantTickets) {
      const exsistTicket = exsistTicketInArray(
        autonomoMerchantTickets.get('tickets'),
        ticket
      );
      if (exsistTicket.exsist) {
        autonomoMerchantTickets.get('tickets').splice(exsistTicket.index, 1);
        const res = autonomoMerchantTickets.get('tickets').length;
        if (res === 0) {
          await autonomoMerchantTickets.destroy();
        } else {
          await autonomoMerchantTickets.save();
        }
      }
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

Parse.Cloud.afterSave('Tickets', async function(request) {
  try {
    if (request.object.isNew()) return;

    const logger = request.log;

    const autonomo = request.object.get('user');

    const newFecha = request.object.get('fecha');
    const oldFecha = request.original.get('fecha');

    const newStatus = request.object.get('status');
    const oldStatus = request.original.get('status');

    const newMerchant = request.object.get('merchant');
    const oldMerchant = request.original.get('merchant');

    if (
      newStatus !== oldStatus ||
      (oldMerchant && newMerchant && oldMerchant.id !== newMerchant.id) ||
      (newFecha && oldFecha && newFecha.getMonth() !== oldFecha.getMonth())
    ) {
      if (newStatus === 'AP') {
        await insertAutonomoMerchantTicket(
          autonomo,
          newMerchant,
          request.object,
          logger
        );
      }
      if (oldStatus === 'AP') {
        await removeTicketFromArray(
          autonomo,
          oldMerchant,
          request.original,
          logger
        );
      }
    }

    if (oldMerchant && newMerchant && oldMerchant.id !== newMerchant.id) {
      await removeTicketFromArray(
        autonomo,
        oldMerchant,
        request.object,
        logger
      );
    }

    if (oldFecha && newFecha && newFecha.getMonth() !== oldFecha.getMonth()) {
      await removeTicketFromArray(
        autonomo,
        oldMerchant,
        request.original,
        logger
      );
    }
  } catch (error) {
    request.log.error(
      `Error on afterSave Tickets: ticketId: ${request.object.id}, Error: ${
        error
      }`
    );
  }
});
