// Curiosidades (frames CURIOSIDADES y sus cuatro detalles, 1 de noviembre).
// `tone` pinta títulos, botones y bandas de cada faceta.
export const curiositySections = [
  {
    slug: 'territorio',
    title: 'Territorio e identidad',
    summary:
      'Conoce los símbolos, productos y referentes culturales que representan a Gramalote y reflejan la relación de su comunidad con la tierra.',
    cta: 'Explorar territorio',
    tone: 'navy',
    photo: '/img/curiosidades/territorio.jpg',
    alt: 'Vista aérea del Nuevo Gramalote entre montañas',
  },
  {
    slug: 'tradiciones',
    title: 'Tradiciones y celebraciones',
    summary:
      'Faroles, comparsas, globos y Reyes: recorre las celebraciones que reunieron a generaciones de gramaloteros y hacen parte de su memoria colectiva.',
    cta: 'Conocer tradiciones',
    tone: 'brown',
    photo: '/img/curiosidades/tradiciones.jpg',
    alt: 'Faldas de colores de bailarinas en un desfile',
  },
  {
    slug: 'sabores',
    title: 'Sabores tradicionales',
    summary:
      'Del pancoger a la mesa de domingo: chocheco, ajiaco, mute, masato y otros sabores que se cocinan y se comparten en Gramalote.',
    cta: 'Descubrir sabores',
    tone: 'coral',
    photo: '/img/curiosidades/sabores.jpg',
    alt: 'Plato de mute con aguacate y ají',
  },
  {
    slug: 'naturaleza',
    title: 'Naturaleza y vida',
    summary:
      'El Bojoso, los ceibos, la dalia y la chocheca: explora los árboles, las flores, las aves y los paisajes que hacen parte del entorno de Gramalote.',
    cta: 'Explorar naturaleza',
    tone: 'green',
    photo: '/img/experiencias/cascadas/1.jpg',
    alt: 'Cascada entre paredes de roca cubiertas de musgo',
  },
]

// Tarjetas de "También te puede interesar".
const related = {
  territorio: {
    title: 'Territorio e identidad',
    text: 'Explora los símbolos, lugares y referentes que identifican al municipio.',
    cta: 'Explorar territorio',
    to: '/curiosidades/territorio',
    photo: '/img/curiosidades/territorio.jpg',
  },
  tradiciones: {
    title: 'Tradiciones y celebraciones',
    text: 'Conoce las expresiones culturales y religiosas que hacen parte de la memoria de Gramalote.',
    cta: 'Conocer tradiciones',
    to: '/curiosidades/tradiciones',
    photo: '/img/curiosidades/tradiciones.jpg',
  },
  sabores: {
    title: 'Sabores tradicionales',
    text: 'Conoce los platos y preparaciones que forman parte de la cocina gramalotera.',
    cta: 'Descubrir sabores',
    to: '/curiosidades/sabores',
    photo: '/img/curiosidades/sabores.jpg',
  },
  naturaleza: {
    title: 'Naturaleza y vida',
    text: 'Descubre los elementos naturales que representan la identidad del territorio.',
    cta: 'Explorar naturaleza',
    to: '/curiosidades/naturaleza',
    photo: '/img/curiosidades/naturaleza-arbol.jpg',
  },
  lugares: {
    title: 'Lugares para descubrir',
    text: 'Encuentra espacios naturales y rincones para conocer durante tu visita.',
    cta: 'Descubrir lugares',
    to: '/que-hacer',
    photo: '/img/experiencias/cascadas/1.jpg',
  },
}

const T = '/img/curiosidades/territorio'
const R = '/img/curiosidades/tradiciones'
const S = '/img/curiosidades/sabores'
const N = '/img/curiosidades/naturaleza'

// Bloques de cada detalle, en el orden del diseño:
// - row: foto(s) a un lado y texto al otro (`side` = lado de la foto; `band`
//   pone el fondo de color de la faceta).
// - featured: tarjeta de fecha destacada.
// - collection: tarjetas con foto, título y texto.
// - pair: dos platos o plantas con foto grande (`titleFirst` = título arriba).
// - related: "También te puede interesar".
// - strip: foto panorámica con un párrafo debajo.
// - overlay: foto grande con el texto encima.
// - card: tarjeta con foto a la izquierda y texto sobre fondo de color.
// - closing: foto a todo el ancho con el texto de cierre.
export const curiosities = {
  territorio: {
    title: 'Territorio e identidad',
    tone: 'navy',
    hero: `${T}/hero.jpg`,
    heading: 'Un territorio que nos identifica',
    intro:
      'Gramalote es un municipio de montañas y tradición campesina. Su identidad se ha formado entre los cafetales, la fe en su patrona y los símbolos que los gramaloteros reconocen como propios. Esta sección recorre algunos de ellos: el café, la bandera, el himno, la Virgen de Monguí, el chocheco y los elementos naturales que los representan.',
    blocks: [
      {
        type: 'row',
        side: 'left',
        title: 'El café, raíz de nuestra historia',
        images: [{ src: `${T}/cafe-recoleccion.jpg`, alt: 'Campesino con un canasto de café recién recogido' }],
        paragraphs: [
          'En 1821, en la hacienda «Piedra de moler», en la vereda Miraflores, se establecieron cultivos de café con fines económicos que se fueron extendiendo por las veredas vecinas. La cercanía al río Zulia, y más tarde al ferrocarril, permitía exportar el grano por el lago de Maracaibo.',
          'Hoy el café se siembra en fincas desde los 1.200 metros de altura, en unas 1.100 hectáreas, y da dos cosechas principales al año. Es parte de la economía del municipio desde hace más de 200 años.',
        ],
      },
      {
        type: 'row',
        side: 'right',
        images: [{ src: `${T}/cafe-cerezas.jpg`, alt: 'Ramas de cafeto con cerezas rojas' }],
        paragraphs: [
          'Su importancia también se refleja en los símbolos del municipio. En la bandera, adoptada en 1994, el blanco recuerda las flores del café, esperanza de una buena cosecha, y el rojo evoca la cereza del grano. El himno, nacido en 1956 y aprobado en 2013, nombra a los cafetos desde su primera estrofa y une en sus versos la fe, el trabajo y la alegría de la gente.',
        ],
      },
      {
        type: 'row',
        side: 'left',
        title: 'La Virgen de Monguí, una tradición que permanece',
        images: [{ src: `${T}/virgen-mongui.jpg`, alt: 'Cuadro de la Virgen de Monguí con el Niño', position: 'center 15%' }],
        paragraphs: [
          'La imagen de la patrona es una versión hecha por un taller boyacense, que replica la imagen traída a Boyacá desde España. Llegó a Gramalote, entonces Galindo, cuando el obispo entregó el retablo al párroco de San Rafael de Galindo.',
          'El cuadro representa un descanso de la Sagrada Familia en su huida a Egipto. Sus colores, el blanco, el azul y el rojo, son los mismos de la bandera del municipio.',
        ],
      },
      {
        type: 'row',
        side: 'right',
        band: true,
        title: 'El chocheco, parte de nuestra identidad gastronómica',
        images: [
          { src: `${T}/chocheco-racimo.jpg`, alt: 'Racimo de chocheco en la mata' },
          { src: `${T}/chocheco-pilon.jpg`, alt: 'Chocheco cocido machacado en un pilón' },
        ],
        paragraphs: [
          'El chocheco es un pequeño plátano que se da en solares y fincas de todo el territorio. En Norte de Santander es el nombre de un banano de fruto pequeño, y en Gramalote se volvió tan propio que se dice «más gramalotero que el chocheco» cuando alguien se siente muy de aquí.',
          'Antes de 2010 se regalaba al visitante. Tras el éxodo, muchas familias tuvieron que comprarlo, y su ausencia en la mesa aumentó la añoranza por el pueblo.',
        ],
      },
      {
        type: 'collection',
        title: 'Los elementos naturales que nos representan',
        items: [
          { title: 'Los ceibos', text: 'Fieles compañeros de los cafetales, aportan fertilidad al suelo y se llenan de flores para anunciar la cosecha.', src: `${T}/ceibo.jpg`, alt: 'Ceibo en un potrero' },
          { title: 'La dalia', text: 'Flor que resurge hermosa entre las ruinas, como el pueblo.', src: `${T}/dalia.jpg`, alt: 'Dalia de color salmón' },
          { title: 'La chocheca', text: 'Ave de hábitos gregarios, conocida también como urraca verde, que recorre bosques, cultivos y potreros.', src: `${T}/chocheca.jpg`, alt: 'Chocheca posada en una rama' },
        ],
      },
      { type: 'related', items: [related.tradiciones, related.naturaleza] },
      {
        type: 'strip',
        image: { src: `${T}/paisaje.jpg`, alt: 'Montañas cubiertas de bosque' },
        text: 'Los árboles, las flores y las aves hacen parte del paisaje, pero también adquieren un significado cultural cuando la comunidad los reconoce como símbolos propios, junto con el chocheco y el reloj lunar.',
      },
    ],
    closing: {
      image: `${T}/cierre.jpg`,
      title: 'Descubrir Gramalote a través de sus símbolos',
      paragraphs: [
        'El café, la bandera, el himno, la Virgen de Monguí y el chocheco conectan la vida cotidiana con la historia del municipio. Hay símbolos más discretos, como el reloj lunar, que acompañó las decisiones del campesino desde el 30 de junio de 1910.',
      ],
    },
  },
  tradiciones: {
    title: 'Tradiciones y celebraciones',
    tone: 'brown',
    hero: `${R}/hero.jpg`,
    heading: 'Celebraciones que nos unen',
    intro:
      'Las fiestas han sido un espacio de encuentro para las familias, los vecinos y los visitantes de Gramalote. Las fiestas populares se celebraban en agosto, cuando ya se había vendido la cosecha principal, pero era en diciembre cuando el pueblo se llenaba de aguinaldos, faroles y música. Recordar estas celebraciones permite acercarse a las costumbres del antiguo Gramalote y a la forma en que la comunidad se reunía.',
    blocks: [
      {
        type: 'row',
        side: 'left',
        title: 'Festinavidad: mucho más que una fiesta',
        images: [{ src: `${R}/festinavidad.jpg`, alt: 'Representación del viacrucis al aire libre' }],
        paragraphs: [
          'La Festinavidad era la mezcla de celebraciones religiosas y populares con que Gramalote vivía el final del año. Duraba cerca de mes y medio y reunía misas, serenatas, desfiles, representaciones y juegos que movilizaban a todo el pueblo. Hasta el aroma de los tamales cocinándose entre hojas de plátano anunciaba que la temporada estaba por empezar.',
        ],
      },
      {
        type: 'featured',
        eyebrow: '26 de noviembre',
        title: 'El regreso de la Virgen de Monguí',
        text: 'Ese día la patrona volvía al casco urbano y comenzaba la temporada festiva.',
      },
      {
        type: 'row',
        side: 'right',
        images: [{ src: `${T}/virgen-mongui.jpg`, alt: 'Cuadro de la Virgen de Monguí con el Niño', position: 'center 15%' }],
        paragraphs: [
          'Durante varios meses, la imagen de la Virgen de Monguí recorría las veredas y visitaba casi un millar de hogares campesinos. El 26 de noviembre regresaba al pueblo, donde la recibían con oraciones, cánticos y campanas, y esa noche las escuelas de música y danza le ofrecían una serenata. Luego llegaban los faroles del 7 de diciembre y las novenas desde el día 15.',
        ],
      },
      {
        type: 'row',
        side: 'left',
        title: 'Cuando el pueblo se convertía en escenario',
        images: [{ src: `${R}/comparsas.jpg`, alt: 'Comparsa de disfraces de colores en una calle' }],
        paragraphs: [
          'Cada barrio, junto con algunas veredas, pasaba días confeccionando disfraces y escenografías para su comparsa. Al mediodía desfilaban frente al atrio de diez gradas, lleno de espectadores, y por la noche la plaza se llenaba de nuevo con la representación bíblica y los actos culturales de cada sector.',
          'Las comparsas y representaciones se remontan a mediados del siglo XX y desde los años ochenta se organizaron con carrozas. El 24 de diciembre llegaban una tras otra a la plaza, donde miles de personas bailaban mientras esperaban el fallo del jurado.',
        ],
      },
      {
        type: 'row',
        side: 'left',
        title: 'El Seis de Reyes: una tradición con historia',
        images: [{ src: `${R}/reyes.jpg`, alt: 'Figuras de los Reyes Magos en un pesebre' }],
        paragraphs: [
          'La representación de la llegada de los Reyes Magos cerraba oficialmente las festividades, con cerca de un centenar de actores en escena. Era el final de un mes y medio de fiestas y una celebración que se ha mantenido de forma continua por más de ochenta años.',
          'Hoy, el fin de semana de Reyes reúne presentaciones de artistas, un concurso de murgas campesinas y la presentación en vivo de los Reyes Magos en la plaza principal.',
        ],
      },
      { type: 'related', items: [related.sabores, related.territorio] },
      {
        type: 'row',
        side: 'left',
        title: 'El 31 de diciembre y sus recuerdos',
        images: [{ src: `${R}/globos.jpg`, alt: 'Fuegos artificiales en el cielo nocturno' }],
        paragraphs: [
          'Después del Día de los Locos, cuando hombres y mujeres salían disfrazados de los personajes más extravagantes, llegaba el 31 de diciembre. Ese día subían al cielo los globos, que llevaban sueños, promesas y el recuerdo de quienes ya no estaban. Luego venía el baile de Año Nuevo.',
          'La técnica de los globos se fortaleció a finales de los años sesenta, cuando los Clavijo la popularizaron y los jóvenes de Gramalote la masificaron. A finales de los noventa pasaron a ser exclusivos del 31 de diciembre, una fecha para compartir con familiares, vecinos y amigos.',
        ],
      },
    ],
    closing: {
      image: `${R}/cierre.jpg`,
      paragraphs: [
        'Las celebraciones permanecen en las fotografías, los relatos y los recuerdos de quienes participaron en ellas. En esas fechas regresaban los hijos ausentes y las familias volvían a reunirse alrededor de la misma mesa, y cada gramalotero renovaba su vínculo con el pueblo.',
        'Hoy esa memoria se renueva cada diciembre con la misa de aguinaldos de las 4:00 a. m., las comparsas con papayera y el encendido del alumbrado navideño en el casco urbano.',
      ],
    },
  },
  sabores: {
    title: 'Sabores tradicionales',
    tone: 'coral',
    hero: `${S}/hero.jpg`,
    heading: 'Sabores que cuentan nuestra historia',
    intro:
      'La cocina de Gramalote nace de la huerta y del solar. Con plátano, yuca, ahuyama y mazorca tierna se alimentaba a familias numerosas y a quienes trabajaban en las fincas. De esa despensa salieron platos, bebidas y postres que todavía se preparan para los domingos, las fiestas y los encuentros familiares.',
    blocks: [
      {
        type: 'row',
        side: 'left',
        tall: true,
        title: 'El chocheco, un sabor de nuestra tierra',
        images: [{ src: `${S}/chocheco.jpg`, alt: 'Racimo de chocheco verde' }],
        paragraphs: [
          'El chocheco es un plátano pequeño que se da en cualquier suelo del territorio, en los solares y en las plantaciones mixtas de las fincas. Hace parte del bastimento y acompaña la cocina del pueblo desde sus orígenes.',
          'Se consigue durante todo el año y cada familia lo cultiva en su propio solar. Por eso es un compañero frecuente de la mesa gramalotera y de la cocina cotidiana.',
        ],
      },
      {
        type: 'pair',
        titleFirst: true,
        items: [
          { title: 'Ajiaco gramalotero', text: 'Plato típico de las casas gramaloteras, preparado en fogón de leña. Lleva plátano, yuca, apio, ahuyama, papa y mazorca tierna, junto con carne de res con hueso o costilla.', src: `${S}/ajiaco.jpg`, alt: 'Ajiaco gramalotero en un plato de madera' },
          { title: 'Mute', text: 'Plato típico de la región que se prepara con vísceras de res, papa, apio, ahuyama, maíz blanco y garbanzo o arveja. Es muy representativo del departamento y se cocina con frecuencia en el pueblo.', src: `${S}/mute.jpg`, alt: 'Plato de mute' },
        ],
        note: {
          title: 'Preparaciones que conservan la tradición',
          text: 'Ambas recetas forman parte de las preparaciones gastronómicas documentadas en relación con Gramalote y permiten conocer técnicas culinarias transmitidas a través del tiempo.',
        },
      },
      { type: 'related', items: [related.tradiciones, related.territorio] },
      {
        type: 'collection',
        title: 'Sabores para compartir',
        items: [
          { title: 'Helado de yuca', text: 'El helado de yuca es un postre artesanal de leche y yuca que se elabora en el Nuevo Gramalote. Aprovecha un producto de la huerta, le da valor agregado y lo convierte en un sabor propio del municipio.', src: `${S}/helado-yuca.jpg`, alt: 'Paleta de helado de yuca' },
          { title: 'Masato', text: 'El masato es una bebida fermentada que se prepara con arroz cocido y licuado, endulzada con guarapo de piña o de panela. Se hace sobre todo a final de año y se comparte en las casas del pueblo y del campo.', src: `${S}/masato.jpg`, alt: 'Jarra de masato con canela' },
          { title: 'Café', text: 'El café va del cultivo a la taza. Además de ser el grano de las fincas, se sirve a diario en las cafeterías del Nuevo Gramalote y en los hogares, y hoy es una fuente de ingresos para algunas familias.', src: `${S}/cafe.jpg`, alt: 'Taza de café sobre granos tostados' },
        ],
      },
      {
        type: 'row',
        side: 'right',
        title: 'Mesas de domingo y de fiesta',
        images: [{ src: `${S}/mesa.jpg`, alt: 'Mesa servida con ajiaco, mute, arroz y arepas' }],
        paragraphs: [
          'Cada plato tiene su momento. El ajiaco suele servirse los domingos y el mute, los domingos y en las fiestas. El masato se reserva para el final del año, cuando se prepara en las casas del pueblo y del campo para compartir en familia.',
          'Estos platos también se cocinan para ayudar: los grupos escolares y los sectores del pueblo los preparan para reunir fondos y apoyar una causa particular, y así la comida se vuelve una forma de unirse.',
        ],
      },
      {
        type: 'card',
        title: 'La cocina también cuenta quiénes somos',
        image: { src: `${S}/fogon.jpg`, alt: 'Fogón de leña con ollas' },
        text: 'La cocina también guarda la huella de quienes llegaron. El ajiaco gramalotero conserva la influencia de los boyacenses que se establecieron en el territorio, y el masato llegó del altiplano cundiboyacense, donde se hacía con yuca; aquí se prepara con arroz.',
      },
    ],
    closing: {
      image: `${S}/cierre.jpg`,
      paragraphs: [
        'La cocina de Gramalote sigue cambiando. Hoy el café pasa del cultivo a la agroindustria y a la taza, y la yuca se transforma en helado. Cada preparación conserva una historia de campo, de familia y de encuentro alrededor de la mesa.',
      ],
    },
  },
  naturaleza: {
    title: 'Naturaleza y vida',
    tone: 'green',
    hero: `${N}/hero.jpg`,
    heading: 'Una naturaleza llena de vida',
    intro:
      'Las montañas, los bosques y los paisajes rurales hacen parte del entorno de Gramalote. Entre sus referencias naturales hay árboles, flores y aves que permiten conocer la diversidad del territorio y entender cómo la naturaleza se ha unido a la identidad de su gente.',
    blocks: [
      {
        type: 'overlay',
        title: 'El Bojoso, un refugio natural',
        image: { src: `${N}/bojoso.jpg`, alt: 'Bosque de niebla de la reserva El Bojoso' },
        paragraphs: [
          'La Reserva Forestal Protectora Regional El Bojoso abarca zonas de Gramalote, Santiago y El Zulia, en Norte de Santander. Protege bosques y fuentes de agua que abastecen a las comunidades de los tres municipios y cuida los ecosistemas asociados.',
          'La idea de protegerlo comenzó a tomar forma en 1992 y fue declarado oficialmente en 2016, con más de mil hectáreas dedicadas a conservar el agua y el bosque.',
        ],
      },
      {
        type: 'row',
        side: 'right',
        title: 'Los ceibos y su relación con los cafetales',
        images: [{ src: `${N}/ceibo.jpg`, alt: 'Copa de un ceibo vista desde abajo' }],
        paragraphs: [
          'Los ceibos acompañan a los cafetales desde hace décadas. Aportan fertilidad al suelo y, cuando se llenan de flores, anuncian que llega la cosecha.',
          'Florecen dos veces al año, justo cuando el café está listo, y en las grandes haciendas servían de señal para saber qué lotes recoger primero.',
        ],
      },
      {
        type: 'row',
        side: 'left',
        title: 'La dalia, una flor que representa renovación',
        images: [{ src: `${N}/dalia.jpg`, alt: 'Dalia de color salmón' }],
        paragraphs: [
          'La dalia es una flor ornamental de colores intensos que se cultiva en jardines y espacios abiertos. En Gramalote se ha convertido en una de las flores asociadas con la identidad del municipio.',
          'Se le relaciona con la renovación porque, como el pueblo, resurge hermosa entre las ruinas. Es una flor que se vuelve símbolo de esperanza y de la capacidad de seguir adelante.',
        ],
      },
      {
        type: 'row',
        side: 'left',
        title: 'La chocheca, un ave de nuestro entorno',
        images: [{ src: `${N}/chocheca.jpg`, alt: 'Chocheca posada en una rama' }],
        paragraphs: [
          'La chocheca, también llamada urraca verde, es un ave de plumaje verde brillante en el cuerpo, azul en las alas y la cola, y corona amarillenta, con una franja negra en la cara. Vive en bordes de bosque, cafetales, potreros arbolados y cultivos, y suele moverse en grupos ruidosos.',
          'Come frutas, semillas, insectos y pequeños vertebrados, y al esparcir semillas ayuda a regenerar el bosque. Se la considera inteligente y capaz de imitar sonidos, y en la tradición popular sus gritos se han interpretado como mal agüero o como anuncio de visitas y cambios de clima.',
        ],
      },
      { type: 'related', items: [related.lugares, related.territorio] },
      {
        type: 'pair',
        title: 'Árboles y flores que acompañan al pueblo',
        items: [
          { title: 'El samán', text: 'Árbol de gran porte, con una copa extendida en forma de sombrilla. Ha estado presente en las plazas del pueblo, tanto en la antigua como en la actual Plaza de la Restauración.', src: `${N}/saman.jpg`, alt: 'Samán en medio de un potrero' },
          { title: 'Las hortensias', text: 'Crecen en las veredas de clima frío, con flores de colores suaves: azules, violetas y blancas. Se dejaban crecer como arbustos para formar cercas y los domingos adornaban la casa de mercado, las casas y los templos.', src: `${N}/hortensias.jpg`, alt: 'Hortensias azules' },
        ],
      },
      {
        type: 'row',
        side: 'left',
        band: true,
        title: 'Cascadas Arco Iris, un paisaje por descubrir',
        images: [
          { src: '/img/experiencias/cascadas/3.jpg', alt: 'Salto de agua sobre una roca oscura' },
          { src: '/img/experiencias/cascadas/4.jpg', alt: 'Cascada que cae sobre una pared de roca' },
        ],
        paragraphs: [
          'Las Cascadas Arco Iris están en la finca Limoncito, en la vereda Valderrama, donde vivió sus últimos años el fundador del municipio. Cuando el sol entra entre la vegetación, cada gota de agua separa la luz en colores y forma pequeños arcoíris sobre la roca.',
          'La quebrada se conoció siempre como Las Golondrinas, porque estas aves se posaban allí en las horas de la noche, lo que añade un motivo más para visitarla.',
        ],
        link: { to: '/que-hacer/cascadas-arco-iris', label: 'Ver la experiencia' },
      },
    ],
    closing: {
      image: `${N}/cierre.jpg`,
      paragraphs: [
        'Los bosques, los árboles de los cafetales, las flores y las aves forman parte de las distintas maneras de conocer Gramalote. Sus paisajes permiten acercarse a la riqueza natural del territorio y entender la importancia de cuidar los espacios que sostienen el agua y la vida.',
        'Explorar esta faceta del municipio es una invitación a observar con atención, aprender del entorno y disfrutar de la naturaleza de manera responsable.',
      ],
    },
  },
}

export function getCuriosity(slug) {
  return curiosities[slug]
}
