//
// Alexa Alacena Inteligente
//

// sets up dependencies
const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');
const i18n = require('i18next');
var mqtt = require('mqtt');
const fs = require('fs');
const s3 = new AWS.S3({
  accessKeyId: "AKIA3SFEJEMIA2EGV545",
  secretAccessKey: "***"
});

//Configuracion conexion MQTT
let topic = 'YvdR293zKOCMVSD';
let client;

let options = {
  port: 11185,
  host: 'z2d95e64.en.emqx.cloud',
  clientId: 'access_control_server' + Math.round(Math.random() * (0 - 10000) * -1),
  username: 'K2SxWcwBK327gQq',
  password: '***',
  keepAlive: 60,
  reconnectPeriod: 500,
  protocolId: 'MQIsdp',
  protocolVersion: 3,
  clean: true,
  encoding: 'utf8'
};

function connectMQTT(mensajeEnviar = '0') {
  return new Promise(((resolve, reject) => {
    console.log(mensajeEnviar);
    client = mqtt.connect("mqtt://z2d95e64.en.emqx.cloud", options);

    client.on('connect', function() {

      client.subscribe(topic + '/output');
      client.publish(topic + '/input', mensajeEnviar, {}, function(error) {

      });

    });

    client.on('message', function (topic, mensajeRecibir) {
      // message is Buffer
      console.log(topic);
      console.log(mensajeRecibir.toString());
      client.end();
      resolve(mensajeRecibir.toString());
    })
    
  }));
}

function guardarProductoS3(producto) {
  let mensajeAlexa =
  `Lo siento, la alacena esta llena. Para liberar espacio en mi alacena diga Saca el "nombre del producto" 
  de mi alacena, ¿Qué mas quieres hacer con tu alacena?`;

  return new Promise(((resolve, reject) => {
    let paramsGetObject = {
      Bucket: 'alacena-iot-s3',
      Key: 'data.json'
    }

    s3.getObject(paramsGetObject, (err, data) => {
      if(err) console.log(err);

      fs.writeFileSync("/tmp/data.json", data.Body, 'binary');
      let rawdata = fs.readFileSync('/tmp/data.json');
      let temp = JSON.parse(rawdata.toString());
      let contenido = temp.contenido;
      let finish = false;
      let already = false;
  
      for (let i = 0; i < contenido.length; i++) {
        
        if(contenido[i].includes(producto)) {
          mensajeAlexa = `El producto ${producto} ya se encuentra guardado en el estante numero ${i + 1}, ¿Qué mas quieres hacer con tu alacena?`;
          already = true;
          resolve(mensajeAlexa);
        }
        
      }

  
      for (let i = 1; i < 5; i++) {
        
        if(finish || already) break;

        for (let j = 0; j < contenido.length; j++) {
          
          if(contenido[j][i] == undefined) {
            contenido[j][i] = producto;
            temp.contenido = contenido;
            let jsonDataString = JSON.stringify(temp);
            fs.writeFileSync('/tmp/data.json', jsonDataString);
  
            mensajeAlexa = `El producto ${producto} fue guardado en el estante numero ${contenido[j][0]}, ¿Qué mas quieres hacer con tu alacena?`;
  
            
            finish = true;
            break;
            
          }
          
        }
        
      }

      if(finish) {
        
        let dataa = fs.readFileSync('/tmp/data.json');
        let paramsPutObject = {
          Bucket: 'alacena-iot-s3',
          Key: 'data.json',
          Body: dataa
        }

        s3.putObject(paramsPutObject, (err, data) => {
          if(err) console.log(err);
          
          resolve(mensajeAlexa);
        });

      } else {
        
        resolve(mensajeAlexa);
        
      }
      
    });
  }));
}

function ListarProductosS3() {
  let mensajeAlexa = "";

  return new Promise(((resolve, reject) => {
    let paramsGetObject = {
      Bucket: 'alacena-iot-s3',
      Key: 'data.json'
    }

    s3.getObject(paramsGetObject, (err, data) => {
      if(err) console.log(err);

      fs.writeFileSync("/tmp/data.json", data.Body, 'binary');
      let rawdata = fs.readFileSync('/tmp/data.json');
      let temp = JSON.parse(rawdata.toString());
      let contenido = temp.contenido;
  
      for (let i = 0; i < contenido.length; i++) {
      
        for (let j = 1; j < contenido[i].length; j++) {
          
          if(j == 1) {
            mensajeAlexa += `En el estante numero ${i + 1} se encuentran los productos: ${contenido[i][j]}`;
          } else {
            mensajeAlexa += contenido[i][j];
          }
  
          if(j == contenido[i].length - 1) {
            mensajeAlexa += ". ";
          } else {
            mensajeAlexa += ", ";
          }
          
        }
        
      }

      if(mensajeAlexa === "") { 
        mensajeAlexa = `Su alacena se encuentra vacía en este momento. `; 
      }

      mensajeAlexa += "¿Qué mas quieres hacer con tu alacena?";

      resolve(mensajeAlexa);
      
    });
  }));
}

function sacarProductoS3(producto) {
  let mensajeAlexa = "";

  return new Promise(((resolve, reject) => {
    let paramsGetObject = {
      Bucket: 'alacena-iot-s3',
      Key: 'data.json'
    }

    s3.getObject(paramsGetObject, (err, data) => {
      if(err) console.log(err);

      fs.writeFileSync("/tmp/data.json", data.Body, 'binary');
      let rawdata = fs.readFileSync('/tmp/data.json');
      let temp = JSON.parse(rawdata.toString());
      let contenido = temp.contenido;
  
      for (let i = 0; i < contenido.length; i++) {
      
        for (let j = 1; j < contenido[i].length; j++) {
          
          if(contenido[i][j] === producto) {

            contenido[i].splice(j, 1);

            temp.contenido = contenido;
            let jsonDataString = JSON.stringify(temp);
            fs.writeFileSync('/tmp/data.json', jsonDataString);
  
            mensajeAlexa = `El producto ${producto} fue retirado del estante numero ${contenido[i][0]}, ¿Qué mas quieres hacer con tu alacena?`;

          }
          
        }
        
      }

      if(mensajeAlexa === "") {
        
        mensajeAlexa = `Lo siento, al parecer el producto ${producto} no se encuentra en la alacena, ¿Qué mas quieres hacer con tu alacena?`;
        resolve(mensajeAlexa);

      } else {

        let dataa = fs.readFileSync('/tmp/data.json');
        let paramsPutObject = {
          Bucket: 'alacena-iot-s3',
          Key: 'data.json',
          Body: dataa
        }

        s3.putObject(paramsPutObject, (err, data) => {
          if(err) console.log(err);
          
          resolve(mensajeAlexa);
        });
        
      }
      
    });
  }));
}

function encontrarProductoS3(producto) {
  let mensajeAlexa = "";
  let posicion;

  return new Promise(((resolve, reject) => {
    let paramsGetObject = {
      Bucket: 'alacena-iot-s3',
      Key: 'data.json'
    }

    s3.getObject(paramsGetObject, async (err, data) => {
      if(err) console.log(err);

      fs.writeFileSync("/tmp/data.json", data.Body, 'binary');
      let rawdata = fs.readFileSync('/tmp/data.json');
      let temp = JSON.parse(rawdata.toString());
      let contenido = temp.contenido;

      for (let i = 0; i < contenido.length; i++) {
      
        for (let j = 1; j < contenido[i].length; j++) {
          
          if(contenido[i][j] === producto) {

            posicion = contenido[i][0];
  
            mensajeAlexa = `El producto ${producto} se encuentra en el estante numero ${contenido[i][0]}.`;
            let mensaje = '2' + posicion;
            await connectMQTT(mensaje);
          }
          
        }
        
      }

      if(mensajeAlexa === "") {
        
        mensajeAlexa = `Lo siento, al parecer el producto ${producto} no se encuentra en la alacena, ¿Qué mas quieres hacer con tu alacena?`;
        resolve(mensajeAlexa);

      } else {
          
          resolve(mensajeAlexa);
        
      }
      
    });
  }));
}

// Inicio de Skill
const BienvenidaHandler = {
  canHandle(handlerInput) {
    
    const request = handlerInput.requestEnvelope.request;
    // Checar el tipo de peticion
    return request.type === 'LaunchRequest';

  },
  async handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    let answer = await connectMQTT();

    if(answer == "0") {
      let speech = `Hola, al parecer la alacena esta descalibrada, por favor diga, estoy en el estante numero,
      seguido del numero de estante que este frente a usted`;
      return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(speech)
      .withSimpleCard(requestAttributes.t('SKILL_NAME'), 'Hola, ¿Qué quieres hacer con tu alacena?')
      .getResponse();
    }

    return handlerInput.responseBuilder
      .speak('Hola, ¿Qué quieres hacer con tu alacena?')
      .reprompt('¿Qué quieres hacer con tu alacena?')
      .withSimpleCard(requestAttributes.t('SKILL_NAME'), 'Hola, ¿Qué quieres hacer con tu alacena?')
      .getResponse();
  },
};

const MoverEstantes = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'MoverEstantes' 
      && handlerInput.requestEnvelope.request.intent.slots
      && !isNaN(handlerInput.requestEnvelope.request.intent.slots.numero.value);
  },
  async handle(handlerInput) {
    
    const numero = handlerInput.requestEnvelope.request.intent.slots.numero.value;
    let direccion;

    if(parseInt(numero) > 7) {
      return handlerInput.responseBuilder
      .speak(`Lo siento, el numero máximo de estantes a mover es 7`)
      .getResponse();
    }

    if(handlerInput.requestEnvelope.request.intent.slots.direccion.resolutions) {
      direccion = handlerInput.requestEnvelope.request.intent.slots.direccion.resolutions.resolutionsPerAuthority[0]
        .values[0].value.id;
    } else if(handlerInput.requestEnvelope.request.intent.slots.direc.resolutions) {
      direccion = handlerInput.requestEnvelope.request.intent.slots.direc.resolutions.resolutionsPerAuthority[0]
        .values[0].value.id;
    } else {
      direccion = '0';
    }

    let mensaje = '1' + numero + direccion;

    await connectMQTT(mensaje);

    let mensajeAlexa = `Moviendo ${numero} estantes hacia `;
    if(direccion == '0') {
      mensajeAlexa += 'adelante';
    } else {
      mensajeAlexa += 'atras';
    }

    return handlerInput.responseBuilder
      .speak(mensajeAlexa)
      .getResponse();
  },
};

const GuardarProducto = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'GuardarProducto' 
      && request.intent.slots;
  },
  async handle(handlerInput) {    
    const producto = handlerInput.requestEnvelope.request.intent.slots.producto.value;
    
    let mensajeAlexa = await guardarProductoS3(producto);
    
    return handlerInput.responseBuilder
      .speak(mensajeAlexa)
      .reprompt("¿Qué mas quieres hacer con tu alacena?")
      .getResponse();
    
  },
};

const ListarProductos = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'ListarProductos';
  },
  async handle(handlerInput) {
    
    let mensajeAlexa = await ListarProductosS3();

    return handlerInput.responseBuilder
      .speak(mensajeAlexa)
      .reprompt("¿Qué mas quieres hacer con tu alacena?")
      .getResponse();
  },
};

const SacarProducto = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'SacarProducto' 
      && request.intent.slots;
  },
  async handle(handlerInput) {
    
    const producto = handlerInput.requestEnvelope.request.intent.slots.producto.value;

    let mensajeAlexa = await sacarProductoS3(producto);

    return handlerInput.responseBuilder
      .speak(mensajeAlexa)
      .reprompt("¿Qué mas quieres hacer con tu alacena?")
      .getResponse();
  },
};

const EncontrarProducto = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'EncontrarProducto' 
      && request.intent.slots;
  },
  async handle(handlerInput) {
    
    const producto = handlerInput.requestEnvelope.request.intent.slots.producto.value;
    
    let mensajeAlexa = await encontrarProductoS3(producto);

    return handlerInput.responseBuilder
      .speak(mensajeAlexa)
      .getResponse();
  },
};

const CalibrarAlacena = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'CalibrarAlacena' 
      && handlerInput.requestEnvelope.request.intent.slots
      && !isNaN(handlerInput.requestEnvelope.request.intent.slots.numero.value);
  },
  async handle(handlerInput) {
    
    const numero = handlerInput.requestEnvelope.request.intent.slots.numero.value;

    if(parseInt(numero) > 8) {
      return handlerInput.responseBuilder
      .speak(`Lo siento, el numero de estantes solo van del uno al ocho`)
      .getResponse();
    }

    let mensaje = '3' + numero;

    await connectMQTT(mensaje);

    let mensajeAlexa = `Alacena calibrada en el estante numero ${numero}, ¿Qué quieres hacer con tu alacena?`;

    return handlerInput.responseBuilder
      .speak(mensajeAlexa)
      .reprompt("¿Qué mas quieres hacer con tu alacena?")
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('HELP_MESSAGE'))
      .reprompt(requestAttributes.t('HELP_REPROMPT'))
      .getResponse();
  },
};

const FallbackHandler = {
  // The FallbackIntent can only be sent in those locales which support it,
  // so this handler will always be skipped in locales where it is not supported.
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('FALLBACK_MESSAGE'))
      .reprompt(requestAttributes.t('FALLBACK_REPROMPT'))
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    //client.end();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('STOP_MESSAGE'))
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    
    const { requestEnvelope } = handlerInput;
    const request = requestEnvelope.request;
    
    console.log(`${request.reason}: ${request.error.type}, ${request.error.message}`);
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(requestAttributes.t('FALLBACK_MESSAGE'))
      .reprompt(requestAttributes.t('HELP_REPROMPT'))
      .getResponse();
  },
};

const LocalizationInterceptor = {
  process(handlerInput) {
    // Gets the locale from the request and initializes i18next.
    const localizationClient = i18n.init({
      lng: handlerInput.requestEnvelope.request.locale,
      resources: languageStrings,
      returnObjects: true
    });
    // Creates a localize function to support arguments.
    localizationClient.localize = function localize() {
      // gets arguments through and passes them to
      // i18next using sprintf to replace string placeholders
      // with arguments.
      const args = arguments;
      const value = i18n.t(...args);
      // If an array is used then a random value is selected
      if (Array.isArray(value)) {
        return value[Math.floor(Math.random() * value.length)];
      }
      return value;
    };
    // this gets the request attributes and save the localize function inside
    // it to be used in a handler by calling requestAttributes.t(STRING_ID, [args...])
    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function translate(...args) {
      return localizationClient.localize(...args);
    }
  }
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    BienvenidaHandler,
    MoverEstantes,
    CalibrarAlacena,
    GuardarProducto,
    EncontrarProducto,
    SacarProducto,
    ListarProductos,
    HelpHandler,
    ExitHandler,
    FallbackHandler,
    SessionEndedRequestHandler,
  )
  .addRequestInterceptors(LocalizationInterceptor)
  .addErrorHandlers(ErrorHandler)
  .withCustomUserAgent('sample/basic-fact/v2')
  .lambda();


const esData = {
  translation: {
    SKILL_NAME: 'Mi alacena inteligente',
    LED_ACTION: 'Prendiendo led',
    HELP_MESSAGE: 'Puedes decir pasame el cereal, o decir hazme un recuento de mi alacena... ¿Cómo te puedo ayudar?',
    HELP_REPROMPT: 'Cómo te puedo ayudar?',
    FALLBACK_MESSAGE: 'La skill Mi Alacena Inteligente no te puede ayudar con eso.  Te puede ayudar a pasarte objetos de tu alacena, o darte informacion sobre tu despensa... ¿Cómo te puedo ayudar?',
    FALLBACK_REPROMPT: '¿Cómo te puedo ayudar?',
    ERROR_MESSAGE: 'Lo sentimos, se ha producido un error.',
    STOP_MESSAGE: 'Adiós!',
    FACTS:
        [
          'Un año en Mercurio es de solo 88 días',
          'A pesar de estar más lejos del Sol, Venus tiene temperaturas más altas que Mercurio',
          'En Marte el sol se ve la mitad de grande que en la Tierra',
          'Jupiter tiene el día más corto de todos los planetas',
          'El sol es una esféra casi perfecta',
        ],
  },
};

const esmxData = {
  translation: {
    SKILL_NAME: 'Curiosidades del Espacio para México',
  },
};

const esusData = {
  translation: {
    SKILL_NAME: 'Curiosidades del Espacio para Estados Unidos',
  },
};

// constructs i18n and l10n data structure
const languageStrings = {
  'es': esData,
  'es-MX': esmxData,
  'es-US': esusData,
};
