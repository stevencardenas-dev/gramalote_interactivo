/**
 * Gramalote Interactivo · formulario «Sugerir un establecimiento»
 *
 * Crea el formulario de Google y envía cada respuesta al sitio (Panel › Sugerencias).
 *
 * 1. Entra a https://script.google.com con la cuenta de correo del sitio y crea
 *    un proyecto nuevo. Borra lo que trae y pega este código completo.
 * 2. Arriba, elige la función «configurar» y pulsa Ejecutar. Google pedirá
 *    permisos (formularios y conexión a servicios externos): acéptalos.
 * 3. En el «Registro de ejecución» aparece el enlace público del formulario.
 *    Cópialo en Panel › Correo › Formulario de sugerencias y guarda.
 * 4. Opcional: ejecuta «probarConexion»; en Panel › Sugerencias debe aparecer
 *    «Prueba de conexión».
 *
 * WEBHOOK_URL y SECRET los rellena el panel al copiar el script. Si cambias el
 * secreto en el panel, cámbialo también aquí.
 */
const WEBHOOK_URL = '__WEBHOOK_URL__';
const SECRET = '__SECRET__';

const PREGUNTAS = [
  { clave: 'nombre', titulo: 'Nombre del establecimiento', tipo: 'texto', obligatoria: true },
  {
    clave: 'tipo',
    titulo: '¿Qué tipo de lugar es?',
    tipo: 'opciones',
    obligatoria: true,
    opciones: [
      'Dónde comer (restaurante, cafetería, comidas)',
      'Dónde dormir (hotel, hostal, cabañas, glamping)',
      'Dónde comprar (tienda, artesanías, productos locales)',
      'Dónde ir (atractivo, mirador, sitio turístico)',
      'Experiencia o actividad',
      'Otro',
    ],
  },
  { clave: 'direccion', titulo: 'Dirección o cómo llegar', tipo: 'texto' },
  { clave: 'telefono', titulo: 'Teléfono o WhatsApp del lugar', tipo: 'texto' },
  { clave: 'redes', titulo: 'Redes sociales o página web', tipo: 'texto' },
  {
    clave: 'motivo',
    titulo: '¿Por qué lo recomiendas?',
    tipo: 'parrafo',
    obligatoria: true,
    ayuda: 'Qué ofrece, horarios, precios aproximados o qué lo hace especial.',
  },
  { clave: 'esDueno', titulo: '¿Eres el dueño o trabajas allí?', tipo: 'opciones', opciones: ['Sí', 'No'] },
  { clave: 'sugeridoPor', titulo: 'Tu nombre', tipo: 'texto' },
  {
    clave: 'correo',
    titulo: 'Tu correo',
    tipo: 'correo',
    ayuda: 'Opcional. Te escribiremos para agradecerte y, si hace falta, para pedirte más datos.',
  },
];

function configurar() {
  const form = FormApp.create('Sugerir un establecimiento · Gramalote Interactivo');
  form
    .setDescription(
      '¿Conoces un restaurante, alojamiento, tienda o lugar de Gramalote (Norte de Santander) que ' +
        'debería estar en Gramalote Interactivo? Cuéntanos y el equipo lo revisará.',
    )
    .setConfirmationMessage('¡Gracias! Recibimos tu sugerencia y el equipo de Gramalote Interactivo la revisará.')
    .setAllowResponseEdits(false)
    .setShowLinkToRespondAgain(true);

  const claves = {};
  PREGUNTAS.forEach(function (p) {
    let item;
    if (p.tipo === 'opciones') {
      item = form.addMultipleChoiceItem().setChoiceValues(p.opciones);
    } else if (p.tipo === 'parrafo') {
      item = form.addParagraphTextItem();
    } else {
      item = form.addTextItem();
      if (p.tipo === 'correo') {
        item.setValidation(
          FormApp.createTextValidation().setHelpText('Escribe un correo válido').requireTextIsEmail().build(),
        );
      }
    }
    item.setTitle(p.titulo).setRequired(Boolean(p.obligatoria));
    if (p.ayuda) item.setHelpText(p.ayuda);
    claves[item.getId()] = p.clave;
  });

  // Se guarda la clave de cada pregunta por su id: si luego se edita el texto
  // de una pregunta en Google Forms, las respuestas siguen llegando bien.
  const props = PropertiesService.getScriptProperties();
  props.setProperty('FORM_ID', form.getId());
  props.setProperty('CLAVES', JSON.stringify(claves));

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'alEnviar') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('alEnviar').forForm(form).onFormSubmit().create();

  Logger.log('Enlace público (pégalo en el panel): ' + form.getPublishedUrl());
  Logger.log('Editar el formulario: ' + form.getEditUrl());
}

function alEnviar(e) {
  const respuesta = e.response;
  const claves = JSON.parse(PropertiesService.getScriptProperties().getProperty('CLAVES') || '{}');
  const porTitulo = {};
  const answers = {};
  respuesta.getItemResponses().forEach(function (r) {
    const item = r.getItem();
    porTitulo[item.getTitle()] = r.getResponse();
    let clave = claves[item.getId()];
    if (!clave) {
      const p = PREGUNTAS.find(function (q) { return q.titulo === item.getTitle(); });
      clave = p ? p.clave : null;
    }
    if (clave) answers[clave] = r.getResponse();
  });
  enviar({
    responseId: respuesta.getId(),
    submittedAt: respuesta.getTimestamp().toISOString(),
    respondentEmail: respuesta.getRespondentEmail() || null,
    answers: answers,
    raw: porTitulo,
  });
}

function enviar(payload) {
  // El secreto va también en el cuerpo: CloudFront puede no reenviar cabeceras propias.
  payload.secret = SECRET;
  for (let intento = 1; intento <= 3; intento++) {
    const r = UrlFetchApp.fetch(WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'X-Gramalote-Secret': SECRET },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    const code = r.getResponseCode();
    if (code >= 200 && code < 300) return;
    if (code >= 400 && code < 500) {
      throw new Error('El sitio rechazó la respuesta (' + code + '): ' + r.getContentText());
    }
    Utilities.sleep(2000 * intento);
  }
  throw new Error('No se pudo entregar la respuesta al sitio después de 3 intentos');
}

// Reenvía todas las respuestas guardadas en el formulario (por ejemplo, si el
// sitio estuvo caído). Las que ya llegaron se ignoran.
function reenviarTodo() {
  const form = FormApp.openById(PropertiesService.getScriptProperties().getProperty('FORM_ID'));
  form.getResponses().forEach(function (respuesta) {
    alEnviar({ response: respuesta });
  });
}

function probarConexion() {
  enviar({
    responseId: 'prueba-' + Date.now(),
    submittedAt: new Date().toISOString(),
    answers: {
      nombre: 'Prueba de conexión',
      tipo: 'Otro',
      motivo: 'Enviado desde Apps Script (probarConexion). Puedes borrarlo.',
    },
  });
  Logger.log('Conexión correcta: revisa Panel › Sugerencias.');
}
