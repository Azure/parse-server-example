async function savedField(objectId, logger) {
  var query = new Parse.Query('Tickets');
  return query.get(objectId).then(function(savedObject) {
    logger.error('savedField:', savedObject);
    return savedObject;
  });
}

Parse.Cloud.beforeSave('Tickets', function(request, response) {
  try {
    request.log.error('Id: ', request.object.id);
    savedField(request.object.id, request.log).then(
      function(savedObject) {
        request.log.error('result: ', savedObject);
      },
      function(error) {
        request.log.error('error: ', error);
      }
    );

    // if (!request.object.isNew()) {
    //   var query = new Parse.Query('Tickets');
    //   query.get(request.object.id, {
    //     success: function(row) {
    //       request.log.error('Success: ', result);
    //     },
    //     error: function(row, error) {
    //       request.log.error('Error: ', error.message);
    //     }
    //   });
    // }
    response.success();
  } catch (error) {
    response.error('Error on beforeSave: ', error);
  }
});

Parse.Cloud.afterSave('Tickets', async function(request) {
  try {
    request.log.info('Request: ', request.object.id);
    const ticketQuery = new Parse.Query('Tickets');
    ticketQuery.equalTo('objectId', request.object.id);
    ticketQuery.include('user');
    ticketQuery.include('merchant');
    const ticketResult = await ticketQuery.first();

    if (ticketResult) {
      const merchant = ticketResult.get('merchant');
      const autonomo = ticketResult.get('user');

      if (merchant && autonomo && ticketResult.get('status') == 'AP') {
        const autonomoTicketMerchantQuery = new Parse.Query(
          'AutomoTicketMerchant'
        );
        autonomoTicketMerchantQuery.include('tickets');
        autonomoTicketMerchantQuery.equalTo('autonomo', autonomo);
        autonomoTicketMerchantQuery.equalTo('merchant', merchant);

        const result = autonomoTicketMerchantQuery.first();
        if (result) {
          const dbTickets = autonomoTicketMerchantQuery.get('tickets');
          let exsist = false;
          _.each(dbTickets, dbTicket => {
            if (dbTicket.id === ticket.id) {
              exsist = true;
              return false;
            }
            return true;
          });

          if (!exsist) {
            dbTickets.push(ticketResult);
            dbTickets.save();
          }
        } else {
          const autonomoMerchantTicket = new Parse.Object(
            'AutomoTicketMerchant'
          );
          const autonomoMerchantTicketACL = new Parse.ACL();
          autonomoMerchantTicketACL.setPublicWriteAccess(false);
          autonomoMerchantTicketACL.setPublicReadAccess(false);
          autonomoMerchantTicketACL.setRoleWriteAccess('Admin', true);
          autonomoMerchantTicketACL.setRoleReadAccess('Admin', true);
          autonomoMerchantTicket.setACL(autonomoMerchantTicketACL);
          autonomoMerchantTicket.set('autonomo', autonomo);
          autonomoMerchantTicket.set('merchant', merchant);
          autonomoMerchantTicket.set('tickets', [ticketResult]);
          autonomoMerchantTicket.save();
        }
      }
    }
  } catch (error) {
    request.log.error('Error on afterSave Tickets', error);
  }
});
