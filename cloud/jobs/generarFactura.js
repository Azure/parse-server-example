require('dotenv').config();
const _ = require('lodash');
const sendGrid = require('sendgrid')(process.env.SENDGRID_API_KEY);
const fs = require('fs');
const path = require('path');
const generateDOCX = require('../cloud/generateDOCX');
const generatePDF = require('../cloud/generatePDF');
const logger = require('../logger');
const InvoiceService = require('../services/InvoiceService');
const ImageUtils = require('../utils/imageUtils');
const merchantUtils = require('../utils/merchantUtils');
const dateUtils = require('../utils/dateUtils');
const InsertFacturaRequest = require('../services/DTO/InsertFacturaRequest');
const {
  TIPO_FACTURA_BORRADOR,
  TIPO_FACTURA_DEFINITIVA,
  TIPO_SOLICITUD_FACTURA
} = require('../utils/tipoFacturaEnum');

const {
  InsertFacturaEventRequest,
  FACTURA_EVENT_TYPE
} = require('../services/DTO/InsertFacturaEventRequest');

const {
  UpdateFacturaRequest,
  FACTURA_STATUS
} = require('../services/DTO/UpdateFacturaRequest');

async function generateModelForDocxInvoice(factura, facturaId) {
  const response = { model: null, errors: null };
  try {
    response.model = {
      facturaId: facturaId
    };
    // model.hasImage = factura.merchant.logo ? true : false;
    response.model.hasImage = false;
    if (response.model.hasImage) {
      response.model.imageData = await ImageUtils.getImageFromUrl(
        factura.merchant.logo
      );
      // model.image = await ImageUtils.getImageFromUrl(
      //   'https://facturivaparsedevstr.blob.core.windows.net/parse/e8f053b2e6f608299fe5d9cc7870939b_Mcdonalds_logo.png'
      // );
    }
    response.model.emisor = {
      nombre: factura.merchant.razonSocial,
      nifCif: factura.merchant.nifCif,
      calle: factura.merchant.direccion,
      direccionCompleta: `${factura.merchant.codigoPostal}, ${
        factura.merchant.localidad
      }, ${factura.merchant.provincia}`,
      tipo: merchantUtils.getMerchantType(factura.merchant.tipoMerchant)
    };
    response.model.destinatario = {
      nombre: factura.autonomo.userProfile.razonSocial,
      nifCif: factura.autonomo.userProfile.nifNie,
      calle: factura.autonomo.userProfile.domicilioSocial,
      direccionCompleta: `${factura.autonomo.userProfile.codigoPostal}, ${
        factura.autonomo.userProfile.poblacion
      }, ${factura.autonomo.userProfile.provincia}`
    };

    // const date = new Date();
    // date.setMonth(date.getMonth() - 1);
    response.model.periodoFacturacion = dateUtils.getMonthYearString(
      factura.mesFacturacion
    );
    response.model.fecha = dateUtils.getStringFromDate(new Date());
    response.model.tickets = [];

    let totalBaseImponible = 0;
    let totalTipoImpositivo = 0;
    let totalIvaIncluido = 0;

    _.each(factura.tickets, ticket => {
      const total = ticket.importe;
      const ivaPercent = ticket.porcentajeIVA;
      const tipoImpositivo = ivaPercent / 100 * total;
      const baseImponible = total - tipoImpositivo;

      totalBaseImponible += baseImponible;
      totalTipoImpositivo += tipoImpositivo;
      totalIvaIncluido += total;

      const ticketModel = {
        total: (Math.round(total * 1000) / 1000)
          .toFixed(2)
          .toLocaleString('es-ES'),
        ivaPercent: (Math.round(ivaPercent * 1000) / 1000)
          .toFixed(2)
          .toLocaleString('es-ES'),
        tipoImpositivo: (Math.round(tipoImpositivo * 1000) / 1000)
          .toFixed(2)
          .toLocaleString('es-ES'),
        baseImponible: (Math.round(baseImponible * 1000) / 1000)
          .toFixed(2)
          .toLocaleString('es-ES')
      };
      response.model.tickets.push(ticketModel);
    });

    response.model.totales = {
      baseImponible: (Math.round(totalBaseImponible * 1000) / 1000)
        .toFixed(2)
        .toLocaleString('es-ES'),
      tipoImpositivo: (Math.round(totalTipoImpositivo * 1000) / 1000)
        .toFixed(2)
        .toLocaleString('es-ES'),
      totalIvaIncluido: (Math.round(totalIvaIncluido * 1000) / 1000)
        .toFixed(2)
        .toLocaleString('es-ES')
    };
  } catch (error) {
    response.errors = `Error al crear modelo para DOCX: ${error.message}`;
  }
  return response;
}

async function getNextInvoiceId(merchantId, fechaFacturacion) {
  try {
    const anyoFacturacion = parseFloat(
      fechaFacturacion
        .getFullYear()
        .toString()
        .substr(-2)
    );
    const numeroFactura = await InvoiceService.getNextInvoiceIdByMerchantId(
      Parse,
      merchantId,
      anyoFacturacion
    );
    return numeroFactura;
  } catch (error) {
    logger.error('Error on getNextInvoiceId: ', error.message);
  }
  return null;
}

function getTipoFactura(merchant) {
  const response = { error: null, tipoFactura: null };
  try {
    if (!merchant) {
      response.error = 'Merchant is undefined';
      return response;
    }

    switch (merchant.efc3) {
      case 'S': {
        response.tipoFactura = TIPO_FACTURA_DEFINITIVA;
        break;
      }
      case 'N': {
        response.tipoFactura = TIPO_SOLICITUD_FACTURA;
        break;
      }
      default: {
        response.tipoFactura = TIPO_FACTURA_BORRADOR;
        break;
      }
    }
  } catch (error) {
    response.error = error.message;
  }
  return response;
}

async function createFacturaEvent(type, factura, info) {
  try {
    const request = new InsertFacturaEventRequest();
    request.type = type;
    request.factura = factura;
    request.info = info;
    await InvoiceService.insertInvoiceEvent(Parse, request);
  } catch (error) {
    logger.error(`Error al crear un evento: ${error.message}`);
  }
}

async function crearFactura(
  autonomo,
  merchant,
  tickets,
  mesFacturacion,
  numeroFactura
) {
  const response = { factura: null, created: false, error: null };
  try {
    const request = new InsertFacturaRequest();
    request.autonomo = autonomo;
    request.merchant = merchant;

    const tipoFacturaResponse = getTipoFactura(merchant);
    if (tipoFacturaResponse.error) {
      response.error = `Error al crear factura: ${tipoFacturaResponse.error}`;
      return response;
    }
    request.tipo = tipoFacturaResponse.tipoFactura;
    request.tickets = tickets;
    request.periodoFacturacion = mesFacturacion;
    request.numeroFactura = numeroFactura;
    const insertInvoiceResponse = await InvoiceService.insertInvoice(
      Parse,
      request
    );
    response.created = insertInvoiceResponse.created;
    response.factura = insertInvoiceResponse.factura;
    response.error = insertInvoiceResponse.errors;
  } catch (error) {
    response.created = false;
    response.factura = null;
    response.error = error.message;
  }
  return response;
}

function createSendGridRequest(pdf) {
  try {
    const request = sendGrid.emptyRequest();
    request.body = {
      attachments: [
        {
          filename: 'Factura.pdf',
          type: 'application/pdf',
          disposition: 'attachment',
          content: pdf.toString('base64')
        }
      ],
      from: { email: 'info@facturiva.com', name: 'FacturIVA' },
      personalizations: [
        {
          to: [
            {
              email: 'ernest14@partners.innocells.io',
              name: 'User'
            }
          ],
          substitutions: {
            '<%name%>': 'Ernest'
          }
        }
      ],
      subject: 'This is the subject',
      template_id: '4f3febe7-7f55-4abd-acca-3f828172349a'
    };

    request.method = 'POST';
    request.path = '/v3/mail/send';
    return request;
  } catch (error) {}
}

async function changeFacturaStatus(idFactura, status) {
  try {
    const requestUpdateFactura = new UpdateFacturaRequest();
    requestUpdateFactura.idFactura = idFactura;
    requestUpdateFactura.status = status;
    return await InvoiceService.updateInvoice(Parse, requestUpdateFactura);
  } catch (error) {
    logger.error(`Error on update factura status: ${error.message}`);
  }
}

Parse.Cloud.job('generarFacturas', async (request, status) => {
  try {
    const result = await InvoiceService.getPending(Parse);
    for (var i = 0; i < result.length; i++) {
      const numeroFactura = await getNextInvoiceId(
        result[i].merchant.id,
        result[i].mesFacturacion
      );

      if (!numeroFactura) {
        continue;
      }

      const facturaResponse = await crearFactura(
        result[i].autonomo,
        result[i].merchant,
        result[i].tickets,
        result[i].mesFacturacion,
        numeroFactura
      );

      if (!facturaResponse.created || !facturaResponse.factura) {
        logger.error(`Error al crear factura: ${facturaResponse.error}`);
        continue;
      } else {
        const deleteDraftInvoiceResult = await InvoiceService.deleteDraftInvoice(
          Parse,
          result[i].id
        );
        if (!deleteDraftInvoiceResult.deleted) {
          continue;
        }
      }

      const docxModelResponse = await generateModelForDocxInvoice(
        result[i],
        numeroFactura
      );

      if (docxModelResponse.errors) {
        await createFacturaEvent(
          FACTURA_EVENT_TYPE.error,
          facturaResponse.factura,
          docxModelResponse.errors
        );
        changeFacturaStatus(facturaResponse.factura.id, FACTURA_STATUS.error);
        continue;
      }

      const docResponse = generateDOCX.createDocx(
        'factura-borrador-template.docx',
        docxModelResponse.model
      );

      if (docResponse.error) {
        await createFacturaEvent(
          FACTURA_EVENT_TYPE.error,
          facturaResponse.factura,
          docResponse.error
        );
        changeFacturaStatus(facturaResponse.factura.id, FACTURA_STATUS.error);
        continue;
      }

      const pdfResponse = await generatePDF.getPDF(docResponse.buffer);

      if (pdfResponse.error) {
        await createFacturaEvent(
          FACTURA_EVENT_TYPE.error,
          facturaResponse.factura,
          pdfResponse.error
        );
        changeFacturaStatus(facturaResponse.factura.id, FACTURA_STATUS.error);
        continue;
      }

      try {
        const requestUpdateFactura = new UpdateFacturaRequest();
        requestUpdateFactura.idFactura = facturaResponse.factura.id;
        requestUpdateFactura.file = pdfResponse.file;
        await InvoiceService.updateInvoice(Parse, requestUpdateFactura);
      } catch (error) {
        logger.error(`Error while update invoice: ${error.message}`);
        continue;
      }

      const sendGridRequest = createSendGridRequest(pdfResponse.file);
      sendGrid.API(sendGridRequest, function(error, response) {
        if (error) {
          createFacturaEvent(
            FACTURA_EVENT_TYPE.error,
            facturaResponse.factura,
            `Error al enviar email: ${error}`
          );
          changeFacturaStatus(facturaResponse.factura.id, FACTURA_STATUS.error);
        } else {
          createFacturaEvent(
            FACTURA_EVENT_TYPE.info,
            facturaResponse.factura,
            `Se ha enviado un email a ${
              sendGridRequest.body.personalizations[0].to[0].email
            }`
          );
          changeFacturaStatus(
            facturaResponse.factura.id,
            FACTURA_STATUS.confirmada
          );
        }
      });
    }
    status.success('Success');
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    status.error(`Error: ${error.message}`);
  }
});

// const request = sendGrid.emptyRequest();
// request.body = {
//   from: { email: 'info@facturiva.com', name: 'FacturIVA' },
//   personalizations: [
//     {
//       to: [
//         {
//           email: 'ernest@partners.innocells.io',
//           name: 'User'
//         }
//       ],
//       substitutions: {
//         '<%name%>': 'Ernest'
//       }
//     }
//   ],
//   subject: 'This is the subject',
//   template_id: '4f3febe7-7f55-4abd-acca-3f828172349a'
// };

// request.method = 'POST';
// request.path = '/v3/mail/send';

// sendGrid.API(request, function(error, response) {
//   console.log(response.statusCode);
//   console.log(response.body);
//   console.log(response.headers);
// });
