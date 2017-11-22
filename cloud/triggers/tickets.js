const _ = require('lodash');

async function getAutonomoMerchantTicket(autnomo, merchant) {
  try {
    const query = new Parse.Query('AutomoTicketMerchant');
    query.include('tickets');
    query.equalTo('autonomo', autonomo);
    query.equalTo('merchant', merchant);

    const result = await query.first();
    return result;
  } catch (error) {
    throw error;
  }
}

async function deleteTicketFromAutonomoMerchantRelationIfExsist(
  autnomo,
  merchant,
  ticket,
  logger
) {
  try {
    const query = new Parse.Query('AutomoTicketMerchant');
    query.include('tickets');
    query.equalTo('autonomo', autnomo);
    query.equalTo('merchant', merchant);

    const result = await query.first();

    // if (result) {
    const indexArray = _.indexOf(result.get('tickets'), ticket);
    logger.error(`Index array: ${indexArray}`);
    // }
  } catch (error) {
    throw error;
  }
}

Parse.Cloud.afterSave('Tickets', async function(request) {
  try {
    if (request.object.isNew()) return;

    const logger = request.log;

    const newStatus = request.original.get('status');
    const oldStatus = request.object.get('status');

    const newMerchant = request.original.get('merchant');
    const oldMerchant = request.object.get('merchant');

    logger.error('delete');
    await deleteTicketFromAutonomoMerchantRelationIfExsist(
      request.object.get('user'),
      newMerchant,
      request.object
    );

    // if (newStatus !== oldStatus) {
    //   if (newStatus !== 'AP') {
    //     await deleteTicketFromAutonomoMerchantRelationIfExsist(
    //       request.object.get('user'),
    //       newMerchant,
    //       request.object
    //     );
    //     //TODO: Eliminar ticket en la relacion Usuario/Merchant/Ticket
    //   } else {
    //     const autonomoMerchantTicket = new Parse.Object('AutomoTicketMerchant');
    //     const autonomoMerchantTicketACL = new Parse.ACL();
    //     autonomoMerchantTicketACL.setPublicWriteAccess(false);
    //     autonomoMerchantTicketACL.setPublicReadAccess(false);
    //     autonomoMerchantTicketACL.setRoleWriteAccess('Admin', true);
    //     autonomoMerchantTicketACL.setRoleReadAccess('Admin', true);
    //     autonomoMerchantTicket.setACL(autonomoMerchantTicketACL);
    //     autonomoMerchantTicket.set('autonomo', request.object.get('user'));
    //     autonomoMerchantTicket.set('merchant', newMerchant);
    //     autonomoMerchantTicket.set('tickets', [request.object]);
    //     autonomoMerchantTicket.save();
    //   }
    // }

    if (newMerchant !== oldMerchant) {
      //TODO: Eliminar ticket de la relacion
    }
  } catch (error) {
    request.log.error(`Error on afterSave Tickets ${error}`);
  }
});
