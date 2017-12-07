const _ = require('lodash');

function getDataFacturacion(ticketDate) {
  if (ticketDate) {
    const month = ticketDate.getMonth();
    const year = ticketDate.getFullYear();

    const current = new Date();
    const currentDay = current.getDate();
    const currentMonth = current.getMonth();
    const currentYear = current.getFullYear();

    let date;
    if (currentDay <= 2 && currentMonth !== month) {
      date = new Date(Date.UTC(currentYear, currentMonth, 0, 0, 0, 0, 0));
    } else {
      date = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 0, 0, 0, 0));
    }

    return date;
  }
  return null;
}

async function getAutonomoMerchantTicket(autonomo, merchant, mesFacturacion) {
  try {
    const query = new Parse.Query('AutonomoTicketMerchant');
    query.equalTo('autonomo', autonomo);
    query.equalTo('merchant', merchant);
    if (mesFacturacion) {
      query.equalTo('mesFacturacion', mesFacturacion);
    }

    const result = await query.find();
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

    if (result.length === 1) {
      const exsistTicket = exsistTicketInArray(
        result[0].get('tickets'),
        ticket
      );
      if (!exsistTicket.exsist) {
        result[0].get('tickets').push(ticket);
        result[0].save();
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
      merchant
    );

    if (autonomoMerchantTickets) {
      for (let i = 0; i < autonomoMerchantTickets.length; i++) {
        const exsistTicket = exsistTicketInArray(
          autonomoMerchantTickets[i].get('tickets'),
          ticket
        );
        if (exsistTicket.exsist) {
          autonomoMerchantTickets[i]
            .get('tickets')
            .splice(exsistTicket.index, 1);
          const res = autonomoMerchantTickets[i].get('tickets').length;
          if (res === 0) {
            await autonomoMerchantTickets[i].destroy();
          } else {
            await autonomoMerchantTickets[i].save();
          }
        }
      }
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

Parse.Cloud.afterSave('Tickets', async function(request) {
  try {
    if (
      request.object.get('createdAt').toString() ===
      request.object.get('updatedAt').toString()
    )
      return;

    const logger = request.log;

    const autonomo = request.object.get('user');

    const newFecha = request.object.get('fecha');
    const oldFecha = request.original.get('fecha');

    const newStatus = request.object.get('status');
    const oldStatus = request.original.get('status');

    const newMerchant = request.object.get('merchant');
    const oldMerchant = request.original.get('merchant');

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

    if (oldStatus === 'AP' && oldStatus !== newStatus) {
      await removeTicketFromArray(
        autonomo,
        oldMerchant,
        request.original,
        logger
      );
    }

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
    }
  } catch (error) {
    request.log.error(
      `Error on afterSave Tickets: ticketId: ${request.object.id}, Error: ${
        error
      }`
    );
  }
});
