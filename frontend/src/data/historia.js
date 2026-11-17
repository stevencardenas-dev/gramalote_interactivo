// Contenido de la sección Conocer historia.
//
// Fuente: «TEXTOS OFICIALES - CONOCER HISTORIA» y los briefs de la entrega del
// 14 de noviembre (referencia/fotos-establecimientos/05. ENTREGA [HISTORIA]).
// Las fotos salen de esa misma entrega y viven en public/img/historia.
//
// El contenido es estático a propósito: son páginas editoriales de lectura
// larga, no fichas que se editen desde el panel. Si algún día se editan, esta
// es la forma que debe devolver la API.

export const SECCION_NAV = [
  { label: 'Inicio', to: '/historia' },
  { label: 'Recorrido', to: '/historia/recorrido/gramalote-antes' },
  { label: 'Patrimonio', to: '/historia/patrimonio' },
  { label: 'Gente y leyendas', to: '/historia/gente-y-leyendas' },
]

// ---------------------------------------------------------------- Inicio

export const historiaInicio = {
  eyebrow: 'Memoria histórica y patrimonio',
  title: 'Conocer historia',
  intro:
    'Gramalote ha tenido tres emplazamientos: Caldereros, Gramalote Viejo y el Nuevo Gramalote. Aquí puedes recorrer su historia y también visitar sus lugares.',
  cta: 'Empezar el recorrido',
  franja: {
    title: 'Un pueblo que se ha reinventado',
    text: 'La historia de Gramalote es la de un territorio que se ha transformado a lo largo del tiempo. Conoce sus orígenes, su desarrollo, la tragedia de 2010 y el proceso de reconstrucción que dio lugar al nuevo municipio.',
  },
}

export const timeline = [
  {
    n: '01',
    date: '1583',
    title: 'El territorio de Salazar de las Palmas',
    text: 'El territorio que hoy conocemos como Gramalote formaba parte de la jurisdicción de Salazar de las Palmas. Sus montañas estaban habitadas por comunidades indígenas y posteriormente fueron ocupadas por colonos que desarrollaron actividades agrícolas.',
  },
  {
    n: '02',
    date: '1780',
    title: 'Una comunidad que defendía su territorio',
    text: 'El 5 de noviembre de 1780, los pobladores lograron expulsar a Alfonso de Arapiles Cornejo y Torres, quien usufructuaba terrenos en Miraflores. Este acontecimiento refleja la organización y defensa de los intereses de los primeros habitantes.',
  },
  {
    n: '03',
    date: '1821',
    title: 'Los primeros registros del café',
    text: 'Bartolomé Peñaranda y su esposa Estefanía Molina registraron plantaciones de café en sus tierras de Miraflores-Caldereros. Es el primer registro conocido del cultivo en el territorio, que después se convertiría en una de las principales actividades económicas.',
  },
  {
    n: '04',
    date: 'Mediados del siglo XIX',
    title: 'La colonización del Catatumbo',
    text: 'La llegada de nuevos colonos y la apertura de caminos fortalecieron los asentamientos de Caldereros y La Corcovada. El territorio se volvió un punto estratégico para avanzar hacia las tierras del Catatumbo y desarrollar nuevas actividades agrícolas.',
  },
  {
    n: '05',
    date: '1857',
    title: 'El oratorio de Caldereros',
    text: 'La construcción de un oratorio fortaleció la vida religiosa y comunitaria de Caldereros. Este espacio se convirtió en uno de los primeros referentes de organización del poblado y respondió a la necesidad de un lugar propio para las celebraciones religiosas.',
    image: '/img/historia/tiempo-05.jpg',
  },
  {
    n: '06',
    date: '1864',
    title: 'Creación del distrito de Galindo',
    text: 'El territorio adquirió una nueva organización político-administrativa con la creación del distrito de Galindo, cuya cabecera fue San Rafael. Este cambio representó un paso importante en la consolidación institucional de la población.',
    image: '/img/historia/tiempo-06.jpg',
  },
  {
    n: '07',
    date: '1865–1866',
    title: 'La parroquia de San Rafael',
    text: 'Se estableció oficialmente la parroquia de San Rafael de Galindo y Secundino Jácome fue nombrado su primer párroco. La parroquia se convirtió en un centro fundamental para la organización religiosa y comunitaria del poblado.',
  },
  {
    n: '08',
    date: '1870',
    title: 'El primer reasentamiento',
    text: 'Las condiciones geográficas y las limitaciones de espacio impulsaron la búsqueda de un nuevo lugar para la población. El padre Secundino Jácome participó en el proceso de traslado hacia las laderas de los Gramalotes, dando origen a una nueva configuración urbana.',
    image: '/img/historia/tiempo-08.jpg',
  },
  {
    n: '09',
    date: '1875',
    title: 'El terremoto de Cúcuta',
    text: 'El terremoto del 18 de mayo afectó las construcciones del territorio y algunas obras del nuevo asentamiento. Representó otra dificultad para una comunidad que atravesaba un importante proceso de transformación.',
    image: '/img/historia/tiempo-09.jpg',
  },
  {
    n: '10',
    date: '1888',
    title: 'El nombre Gramalote',
    text: 'Mediante la Ordenanza número 13 del 28 de julio de 1888 se cambió oficialmente el nombre de Galindo por Gramalote. La población recuperó así la denominación con la que sus habitantes identificaban históricamente el territorio.',
  },
  {
    n: '11',
    date: '1900–1902',
    title: 'La Guerra de los Mil Días',
    text: 'Gramalote vivió los efectos de la Guerra de los Mil Días. El 2 de febrero de 1900 se produjo una incursión militar de las fuerzas liberales del general Rafael Uribe Uribe, dejando huellas en la historia política y social del municipio.',
  },
  {
    n: '12',
    date: 'Primeras décadas del siglo XX',
    title: 'El esplendor cafetero',
    text: 'El café se consolidó como una de las principales fuentes de riqueza de Gramalote. Las grandes haciendas, sus casonas y extensos cultivos transformaron el paisaje rural y fortalecieron la economía de numerosas familias campesinas.',
  },
  {
    n: '13',
    date: '1925–1936',
    title: 'Nuevas fronteras y caminos',
    text: 'La separación de Lourdes modificó la extensión territorial de Gramalote. Después, la construcción de la carretera hacia Ocaña y la inauguración del puente Cuervo en 1932 fortalecieron las comunicaciones y el desarrollo comercial de la región.',
  },
  {
    n: '14',
    date: 'Décadas de 1960–1990',
    title: 'Transformaciones del paisaje',
    text: 'Los cambios en los cultivos, la expansión ganadera y la transformación de las coberturas vegetales modificaron progresivamente el paisaje de las montañas. Estas actividades también generaron nuevas preocupaciones sobre la conservación de los recursos naturales.',
  },
  {
    n: '15',
    date: 'Diciembre de 2010',
    title: 'La montaña se mueve',
    text: 'Después de once meses de lluvias persistentes, los movimientos del terreno provocaron la destrucción del antiguo casco urbano. Las calles, viviendas y edificios públicos resultaron afectados y la población tuvo que abandonar el municipio.',
    image: '/img/historia/tiempo-15.jpg',
  },
  {
    n: '16',
    date: '2010 en adelante',
    title: 'La reconstrucción de un pueblo',
    text: 'Después de la tragedia comenzó el proceso de reconstrucción y reasentamiento. Las familias tuvieron que reorganizar sus vidas mientras avanzaban los estudios y las obras del nuevo casco urbano, dando inicio a una tercera ubicación urbana para Gramalote.',
  },
]

// La línea del tiempo resumida usa los hitos con foto; al desplegarla se ven
// los 16 acontecimientos en orden.
export const timelineResumen = ['05', '06', '08', '09', '15']

// ------------------------------------------------------------- Capítulos

export const chapters = [
  {
    slug: 'gramalote-antes',
    number: '01',
    cardTitle: 'Caldereros',
    cardPeriod: '1857–1875',
    cardText:
      'El primer asentamiento junto a la quebrada Calderera. Aquí comenzó la historia del poblado que dio origen a Gramalote.',
    cardImage: '/img/historia/cap1.jpg',
    heroImage: '/img/historia/cap1.jpg',
    title: 'Gramalote antes',
    heroText:
      'Desde las familias indígenas que habitaron estas montañas hasta el pueblo que los gramaloteros conocieron antes de 2010: café, guerras, una mudanza y una vida comunitaria forjada alrededor del templo de San Rafael.',
    stages: [
      {
        title: 'Los primeros habitantes',
        kicker: 'Etapa 01 · Orígenes y poblamiento',
        events: [
          {
            n: '1',
            date: 'Época precolombina',
            title: 'Los pueblos de las montañas',
            text: 'Antes de la llegada de los colonizadores, estas montañas fueron el hogar de familias indígenas. Dejaron huellas en los cerros de El Silencio, Mirador, Miraflores y Zumbador: tumbas excavadas en forma de cúpula, metates y vasijas decoradas con rombos. Sus tumbas muestran el gran respeto que tenían por sus muertos.',
            image: '/img/historia/cap1-01.jpg',
          },
          {
            n: '2',
            date: 'Un pasado poco conocido',
            title: 'Qué pasó con ellos',
            text: 'De estos pueblos se sabe muy poco. La tradición cuenta que se refugiaron en la selva del Catatumbo para escapar de la esclavitud. El padre Raimundo Ordóñez Yáñez fue su último gran defensor ante la asamblea del departamento. Hoy algunas familias campesinas aún encuentran piezas ancestrales en sus tierras.',
            image: '/img/historia/cap1-02.jpg',
          },
          {
            n: '3',
            date: 'Siglo XVIII · 1780',
            title: 'Caldereros antes de ser pueblo',
            text: 'En 1780, Caldereros era un gran latifundio ya habitado por campesinos. Cuando estallaron las revueltas comuneras, su dueño, el maestre de campo Alfonso de Arapiles, tuvo que huir hacia San José de Cúcuta. Un acta de 1853 menciona un cementerio, señal de que había comunidad antes del pueblo.',
            image: '/img/historia/cap1-03.jpg',
          },
        ],
      },
      {
        title: 'El café',
        kicker: 'Etapa 02 · Desarrollo agrícola y bonanza',
        events: [
          {
            n: '4',
            date: 'Siglo XIX · desde 1821',
            title: 'Del cacao al café',
            text: 'Estas tierras producían cacao, caña, pastos y granos. Cuando el cacao enfermó y se abolió la esclavitud, el café, que se daba bien en las tierras altas, se volvió la esperanza del territorio. Hacia 1821, Bartolomé Peñaranda y Estefanía Molina sembraron en la hacienda Piedra de Moler, en Miraflores, los cafetales más importantes de la zona.',
            image: '/img/historia/cap1-04.jpg',
          },
          {
            n: '5',
            date: 'Décadas de 1850 y 1860',
            title: 'Llegan los extranjeros',
            text: 'El auge del café atrajo a inmigrantes, sobre todo italianos, y también franceses, venezolanos y gente de Santander y Boyacá. Apellidos como Belfini, Berti o Vermont aparecen entre los primeros pobladores. Todos fueron bien recibidos y sus costumbres se mezclaron con las de los campesinos.',
            image: '/img/historia/cap1-05.jpg',
          },
          {
            n: '6',
            date: 'Siglo XIX',
            title: 'Un paso obligado',
            text: 'Caldereros quedaba en el camino hacia las zonas de colonización del norte (Lourdes, Sardinata, Ocaña), y el café salía por el río Zulia hacia el lago de Maracaibo; a fines del siglo XIX se comerciaban más de 9.000 cargas. Eso hizo del caserío una comunidad pujante.',
            image: '/img/historia/cap1-06.jpg',
          },
        ],
      },
      {
        title: 'Nace el pueblo',
        kicker: 'Etapa 03 · Fundación y primeros años',
        events: [
          {
            n: '7',
            date: '1857 · Fundación',
            title: 'El caserío de Caldereros',
            text: 'No hubo un acto formal de fundación. Don José Gregorio Montes cedió terrenos para un oratorio, y el caserío creció junto al camino y a una fuente de agua, en la orilla de la quebrada Calderera, de donde tomó su nombre. Se considera 1857 el año de fundación, el mismo en que se creó el Estado Soberano de Santander.',
            image: '/img/historia/cap1-07.jpg',
          },
          {
            n: '8',
            date: '1864 · Nace el distrito',
            title: 'El distrito de Galindo',
            text: 'Cuando los dirigentes locales quisieron independizarse de Salazar de las Palmas, el Estado de Santander creó el distrito en 1864 y le impuso el nombre de Galindo. No fue un homenaje: era el apellido del coronel liberal que en 1860 había atacado la población y murió en el intento.',
            image: '/img/historia/cap1-08.jpg',
          },
          {
            n: '9',
            date: '1865 · 1866',
            title: 'La parroquia de San Rafael',
            text: 'Los habitantes pidieron una parroquia propia. En diciembre de 1865, Joaquín Peñaranda, José Berti y Gregorio Montes donaron los terrenos del templo, la casa cural y el atrio, y se expidió el título de San Rafael de Galindo. En 1866 llegó como párroco Secundino Jácome, figura central en la vida del pueblo.',
            image: '/img/historia/cap1-09.jpg',
          },
          {
            n: '10',
            date: '1888 · Un nuevo nombre',
            title: 'El nombre Gramalote',
            text: 'En los documentos oficiales era Galindo, pero la gente se llamaba gramalotes. Tras la guerra de 1885, en la que el batallón Gramalote se hizo famoso por su bravura, los dirigentes pidieron el cambio y una ordenanza de 1888 lo oficializó. Sobre el origen del nombre hay dos versiones: la grama, planta abundante en las laderas, o el grammelot, lenguaje inventado del teatro satírico.',
            image: '/img/historia/cap1-10.jpg',
          },
        ],
      },
      {
        title: 'Tierra de guerreros',
        kicker: 'Etapa 04 · Guerras civiles del siglo XIX',
        events: [
          {
            n: '11',
            date: '1876 · 1885',
            title: 'La fama guerrera',
            text: 'Desde el siglo XIX, los gramaloteros tuvieron fama de soldados. En 1876, el coronel Eusebio Rojas Ballesteros, nacido en la vereda Teherán, lideró los batallones de Mutiscua y Gramalote, de los más aguerridos de Santander. En la guerra de 1885, el batallón Gramalote, con su bandera azul, fue temido en todo el estado y recordado por sus enemigos como una fuerza implacable.',
            image: '/img/historia/cap1-11.jpg',
          },
          {
            n: '12',
            date: '2 de febrero de 1900 · Guerra de los Mil Días',
            title: 'La toma de Gramalote',
            text: 'Por su ubicación y difícil acceso, el pueblo tenía fama de fortaleza inexpugnable. El 2 de febrero de 1900, las tropas liberales de Rafael Uribe Uribe y Benjamín Herrera entraron por El Caimito y el filo de La Canal hasta el poblado. Quedan pocos relatos de este episodio en la tradición oral; una frase popular lo recuerda: «Le fue más mal que a doña Pura en Candelaria».',
            image: '/img/historia/cap1-12.jpg',
          },
        ],
      },
      {
        title: 'El traslado',
        kicker: 'Etapa 05 · Un pueblo que se muda',
        events: [
          {
            n: '13',
            date: '1870 · 1875',
            title: 'Un terremoto y una idea',
            text: 'Hacia 1870, el caserío se había quedado sin espacio y el padre Secundino Jácome propuso trasladar la comunidad a las laderas de los Gramalotes. El terremoto de Cúcuta, el 18 de mayo de 1875, hizo caer algunas obras del nuevo templo y causó una sola víctima, una niña pequeña, Elena Arévalo. Aun así, el traslado siguió adelante.',
            image: '/img/historia/cap1-13.jpg',
          },
          {
            n: '14',
            date: '1882 · 1884',
            title: 'Pueblos nuevos y pueblos viejos',
            text: 'La mudanza dividió a la comunidad entre los pueblos nuevos, que querían trasladarse, y los pueblos viejos, que preferían quedarse. Hubo tensiones hasta con el obispado, que en 1882 retiró a Jácome. En 1883, el padre Santiago Mantilla consolidó el traslado y se ordenó demoler la capilla del caserío original. Todo el proceso tomó trece años.',
            image: '/img/historia/cap1-14.jpg',
          },
          {
            n: '15',
            date: '8 de febrero de 1884',
            title: 'La plaza',
            text: 'En el nuevo casco, el padre Domiciano Valderrama trazó una gran plaza. El 8 de febrero de 1884, una procesión la recorrió y cada esquina recibió un nombre, con lo que se consolidó el traslado. Fue el centro social del pueblo, con su pila pública, su cancha de fútbol y las fiestas bajo el samán. Se bautizó La Regeneración, pero hoy se llama de la Restauración por un error que quedó en una placa de 1993.',
            image: '/img/historia/cap1-15.jpg',
          },
        ],
      },
      {
        title: 'El pueblo que conocimos',
        kicker: 'Etapa 06 · Siglo XX · vida cotidiana',
        events: [
          {
            n: '16',
            date: 'Educación · siglos XIX y XX',
            title: 'Escuelas y colegios',
            text: 'La educación empezó con el padre Jácome y el seminarista José Natividad Zafra, y creció con las comunidades religiosas: el colegio Santa Catalina de Siena para señoritas (1894), las Bethlemitas (1921) y, desde 1943, el colegio Sagrado Corazón de Jesús. Después llegaron las escuelas urbanas, el colegio Simón Bolívar y la Escuela Vocacional Agrícola, hoy Instituto Técnico Agropecuario.',
            image: '/img/historia/cap1-16.jpg',
          },
          {
            n: '17',
            date: 'Salud y obras públicas · siglo XX',
            title: 'El hospital y las obras del pueblo',
            text: 'En 1941, el pueblo desfiló hasta el nuevo hospital San Vicente de Paúl, levantado con el esfuerzo de la curia y de los suscriptores, y en su momento el segundo en importancia del departamento. Antes habían llegado el acueducto (1912), de los primeros de Norte de Santander, y la casa de mercado (1928); en 1932 llegó la carretera de Cúcuta, con el puente Cuervo.',
            image: '/img/historia/cap1-17.jpg',
          },
          {
            n: '18',
            date: 'Fiestas y costumbres',
            title: 'Fiestas y tradiciones',
            text: 'Las fiestas populares se hacían en agosto, después de vender la cosecha principal, pero el mes más alegre era diciembre: aguinaldos, pólvora, música y la procesión de faroles. Había toros de candela y bolas de trapo encendidas, y desde mediados del siglo XX llegaron las comparsas y los globos. El Seis de Reyes, con más de 80 años, se volvió la celebración más renombrada.',
            image: '/img/historia/cap1-18.jpg',
          },
          {
            n: '19',
            date: 'Identidad y símbolos',
            title: 'Los símbolos del pueblo',
            text: 'La bandera recoge las flores de café, la tierra y el sol convertido en cereza, con un azul y un blanco que coinciden con los de la Virgen de Monguí, patrona del pueblo. El cuadro muestra a una familia que huye hacia Egipto, coincidencia con la historia de la comunidad. El himno, con letra de Manuel Grillo Martínez, nació en 1956 y se oficializó en 2013. La dalia, que renace entre las ruinas, es otro emblema.',
            image: '/img/historia/cap1-19.jpg',
          },
        ],
      },
    ],
    closing: {
      title: 'Un pueblo construido a través del tiempo',
      text: 'Caldereros fue el origen. Gramalote Viejo se convirtió en el hogar de generaciones de familias que construyeron su identidad entre sus calles, sus tradiciones y su vida comunitaria. Esa historia permanece en la memoria de quienes lo habitaron.',
    },
  },
  {
    slug: 'la-tragedia-de-2010',
    number: '02',
    cardTitle: 'Gramalote Viejo',
    cardPeriod: '1888–2010',
    cardText:
      'El pueblo que creció y desapareció en diciembre de 2010. Hoy sus ruinas y su memoria permanecen.',
    cardImage: '/img/historia/cap2.jpg',
    heroImage: '/img/historia/cap2.jpg',
    title: 'La tragedia de 2010',
    heroText:
      'Tras meses de lluvias persistentes, la montaña empezó a moverse el 16 de diciembre de 2010. En un solo día, todo el pueblo tuvo que ser evacuado.',
    stages: [
      {
        title: 'Cuando la montaña dio señales',
        kicker: 'Etapa 01 · Geofísica y advertencia',
        events: [
          {
            n: '1',
            date: 'Septiembre · noviembre de 2010',
            title: 'Las señales',
            text: 'Fue un año excepcionalmente lluvioso, con una lluvia persistente, casi silenciosa. Desde octubre aparecieron pequeños deslizamientos y grietas en fincas, caminos y beneficiaderos de café, y en noviembre los reportes aumentaron. Nadie sospechaba que el peligro no estaba sobre la superficie, sino debajo de la tierra.',
            image: '/img/historia/cap2-01.jpg',
          },
          {
            n: '2',
            date: '4 al 15 de diciembre',
            title: 'Las alarmas',
            text: 'La noche del 4 de diciembre sonó la primera alarma, por un torrente de barro y piedras que amenazó el sector de Santa Anita. En los días siguientes aparecieron grietas en potreros y en el casco urbano, y las autoridades se reunieron. Se buscaba una avalancha de agua, sin imaginar que el peligro era el propio movimiento de la montaña.',
            image: '/img/historia/cap2-02.jpg',
          },
          {
            n: '3',
            date: '16 de diciembre de 2010',
            title: 'Las primeras evidencias',
            text: 'El 16 de diciembre la montaña dejó de avisar y empezó a moverse: una enorme masa de tierra avanzaba desde la finca Santa Anita. Esa noche, hacia las seis y media, cayeron las primeras casas. Todavía había quienes pensaban que era una falsa alarma.',
            image: '/img/historia/cap2-03.jpg',
          },
        ],
      },
      {
        title: 'La evacuación y la pérdida',
        kicker: 'Etapa 02 · Rescate y desplazamiento',
        events: [
          {
            n: '4',
            date: '17 de diciembre de 2010',
            title: 'La evacuación',
            text: 'Con la masa de tierra avanzando hacia el pueblo, se confirmó la evacuación de todo el casco urbano. Camiones de la Policía, buses y otros vehículos sacaron a unas 3.200 personas, la mayoría con la ropa que llevaban puesta, creyendo que volverían al día siguiente. Hacia las siete y media de la noche, ya no quedaban familias en el pueblo.',
            image: '/img/historia/cap2-04.jpg',
          },
          {
            n: '5',
            date: 'Diciembre de 2010',
            title: 'Lo que se perdió',
            text: 'Esa noche empezaron a caer las casas, y en los días siguientes se perdió también el patrimonio: la nave central y la cúpula del templo, la capilla gótica de 1936, el colegio. El 23 de diciembre cayó la torre oriental, la del reloj lunar. Pero dolió más perder una forma de vivir: las relaciones, las fiestas, las costumbres.',
            image: '/img/historia/cap2-05.jpg',
          },
          {
            n: '6',
            date: 'Diciembre de 2010',
            title: 'Nadie murió',
            text: 'Aunque el pueblo quedó en ruinas, no hubo víctimas fatales. Hubo comisiones de emergencia, alertas por perifoneo desde las torres del templo y una evacuación a tiempo. Todavía días después había quien entraba a rescatar objetos religiosos, y sobrevivir fue una mezcla de prevención y suerte.',
            image: '/img/historia/cap2-06.jpg',
          },
        ],
      },
      {
        title: 'La memoria después de la tragedia',
        kicker: 'Etapa 03 · Duelo, identidad y persistencia',
        events: [
          {
            n: '7',
            date: 'Tradición oral',
            title: 'Las leyendas',
            text: 'Las tensiones entre el padre Ordóñez y varios dirigentes de Gramalote, tras la creación de Sardinata en 1906, dieron origen a la leyenda de la maldición, una creencia popular que se transmitió durante décadas. Con la tragedia de 2010 volvió con fuerza y los medios la repitieron. Muchos gramaloteros vieron en ella un símbolo de lo que estaban viviendo.',
            image: '/img/historia/cap2-07.jpg',
          },
          {
            n: '8',
            date: 'Diciembre de 2010 · enero de 2011',
            title: 'Lo que se conservó',
            text: 'Gracias a campesinos y vecinos se salvó parte del patrimonio: el cuadro de la Virgen, la estatua del líder conservador que presidía la plaza, el viacrucis y la matraca de Semana Santa. El 17 de enero de 2011, un grupo de hombres arriesgó la vida para rescatar las tres campanas de la torre occidental.',
            image: '/img/historia/cap2-08.jpg',
          },
          {
            n: '9',
            date: '23 de diciembre de 2010',
            title: 'El anuncio',
            text: 'Tras sobrevolar las ruinas, el presidente Juan Manuel Santos llegó a un albergue en Cúcuta y anunció que el Gobierno Nacional reconstruiría Gramalote, respetando la decisión de sus habitantes sobre el lugar. Dijo: «Créanme que Gramalote va a quedar mejor que antes». Era la primera esperanza de futuro.',
            image: '/img/historia/cap2-09.jpg',
          },
        ],
      },
    ],
    closing: {
      title: 'La historia no terminó entre las ruinas',
      text: 'La tragedia transformó el territorio y dispersó a sus habitantes, pero no acabó con la identidad de Gramalote. La memoria, la solidaridad y la esperanza de regresar abrieron el camino hacia un nuevo comienzo.',
    },
  },
  {
    slug: 'de-la-reconstruccion-al-presente',
    number: '03',
    cardTitle: 'Nuevo Gramalote',
    cardPeriod: '2010–Actualidad',
    cardText:
      'El pueblo que surgió después de la tragedia. Una nueva ubicación y una comunidad que comenzó de nuevo.',
    cardImage: '/img/historia/cap3.jpg',
    heroImage: '/img/historia/cap3.jpg',
    title: 'De la reconstrucción al presente',
    heroText:
      'Años de destierro, una decisión difícil y un pueblo nuevo levantado en Miraflores. Así volvió Gramalote a ponerse de pie, sin olvidar el anterior.',
    stages: [
      {
        title: 'Un pueblo sin pueblo',
        kicker: 'Etapa 01 · Destierro y espera',
        events: [
          {
            n: '1',
            date: '2011 en adelante',
            title: 'Los años errantes',
            text: 'Las familias se dispersaron por Cúcuta, Santiago, Bucaramanga y otros lugares. Muchos entendieron entonces que el pueblo no eran solo sus calles, sino su gente, sus costumbres y su memoria compartida. Cada fotografía, cada edificio perdido y cada recuerdo ganó un nuevo valor.',
            image: '/img/historia/cap3-01.jpg',
          },
          {
            n: '2',
            date: '2011 · 2016',
            title: 'El campo también cambió',
            text: 'Mientras el pueblo estaba ausente, el campesinado sostuvo la producción y mantuvo vivo el vínculo con la tierra. Las comunidades abrieron caminos antes imposibles para un vehículo y multiplicaron las vías rurales. Muchas familias, los neorurales, se refugiaron en fincas propias o prestadas, y en veredas como Valderrama surgieron asentamientos que fueron tomando forma de centros poblados.',
            image: '/img/historia/cap3-02.jpg',
          },
          {
            n: '3',
            date: 'Diciembre de 2010 · memoria a salvo',
            title: 'El pueblo de papel',
            text: 'Durante la evacuación no solo salieron las familias: también se rescataron los archivos municipales y parroquiales y los elementos sagrados del templo. Se perdieron las casas, pero no la memoria escrita. Hoy existen documentos sobre los cuales investigar la historia del pueblo, aunque el reto es conservarlos y abrirlos a la consulta pública.',
            image: '/img/historia/cap3-03.jpg',
          },
          {
            n: '4',
            date: '2012 · 2014',
            title: 'Miraflores, el lugar elegido',
            text: 'En abril de 2012 se instaló la Mesa de Trabajo para la Reconstrucción con el Fondo Adaptación. El 27 de febrero de 2014, una ordenanza departamental fijó el nuevo casco urbano en la antigua vereda Miraflores, en unas cien hectáreas. No había un lugar ideal, así que se decidió intervenir los riesgos.',
            image: '/img/historia/cap3-04.jpg',
          },
        ],
      },
      {
        title: 'Un pueblo que se construye con cuidado',
        kicker: 'Etapa 02 · Nuevo casco urbano',
        events: [
          {
            n: '5',
            date: 'Abril de 2015 · inicio de obras',
            title: 'Cuidar la montaña',
            text: 'Antes de construir se estudió el suelo con más de 321 metros de perforaciones en 43 sitios. Se hicieron drenajes, pozos profundos y muros, y se volvió a sembrar para ponerle de nuevo la piel a la tierra. El principio fue no forzar la montaña, sino adecuar el pueblo a ella.',
            image: '/img/historia/cap3-05.jpg',
          },
          {
            n: '6',
            date: '20 de diciembre de 2016',
            title: 'La primera fase',
            text: 'Seis años después de la evacuación se entregó la primera fase del nuevo casco urbano: la plaza de mercado, la plaza principal, el Centro Administrativo Municipal, las plantas de tratamiento y las primeras viviendas. Se construyó con grupos de viviendas dispersos y la menor remoción de tierra posible, para respetar la montaña.',
            image: '/img/historia/cap3-06.jpg',
          },
          {
            n: '7',
            date: '11 de marzo de 2017',
            title: 'El regreso',
            text: 'Llegó el primer grupo de unos doscientos gramaloteros, tras siete años de vidas rehechas en Cúcuta, Santiago, Bucaramanga y otros lugares. El retorno fue lento: había escrituras pendientes y viviendas por terminar, y muchos ya habían empezado una nueva vida lejos. Volver también costó.',
            image: '/img/historia/cap3-07.jpg',
          },
        ],
      },
      {
        title: 'Gramalote hoy',
        kicker: 'Etapa 03 · Un pueblo que se recorre',
        events: [
          {
            n: '8',
            date: '2019 · Premio Obras CEMEX',
            title: 'La plaza de mercado',
            text: 'En Miraflores, la plaza de mercado volvió a ser el corazón del pueblo, como lo había sido en 1857. Su diseño bioclimático, sus setenta puestos y sus terrazas de cultivo urbano le valieron en 2019 el Premio Obras CEMEX. Fue una de las primeras obras entregadas en la primera fase.',
            image: '/img/historia/cap3-08.jpg',
          },
          {
            n: '9',
            date: '2017 · 2025',
            title: 'El templo que levantó la comunidad',
            text: 'La reconstrucción no incluyó el templo, porque el Estado es laico. En abril de 2017 se inauguró una capilla provisional con las viejas campanas, y el nuevo templo se ha ido levantando con donaciones. En noviembre de 2025, todavía en obra, se celebró allí la fiesta patronal.',
            image: '/img/historia/cap3-09.jpg',
          },
          {
            n: '10',
            date: 'Hoy · turismo',
            title: 'Un destino que vuelve a visitarse',
            text: 'Las nuevas vías y la infraestructura reactivaron Valderrama y Miraflores, convertidos desde entonces en el nuevo centro de la vida municipal. También reabrieron las puertas al turismo, una vocación que ya estaba contemplada en el plan de ordenamiento territorial de 2002.',
            image: '/img/historia/cap3-10.jpg',
          },
          {
            n: '11',
            date: 'Hoy · memoria y presente',
            title: 'Tres lugares, una historia',
            text: 'Gramalote se lee en tres lugares: Pueblo Viejo, con las ruinas del oratorio y de la calle de la Jeringa; las ruinas de Gramalote Viejo, con su torre agrietada y su atrio, hoy vereda y lugar de memoria y romería; y el Nuevo Gramalote, en Miraflores, con más del 97 % del casco urbano construido. En una misma mañana se recorren el siglo XIX, el XX y el XXI.',
            image: '/img/historia/cap3-11.jpg',
          },
        ],
      },
    ],
    closing: {
      title: 'Tres lugares, una historia que permanece',
      text: 'Gramalote cambió de territorio, reconstruyó sus espacios y transformó su forma de habitar. Sin embargo, su historia sigue viva en sus habitantes, sus tradiciones y los lugares que conservan su memoria.',
    },
  },
]

export function getChapter(slug) {
  return chapters.find((chapter) => chapter.slug === slug) ?? null
}

export function getChapterIndex(slug) {
  return chapters.findIndex((chapter) => chapter.slug === slug)
}

// --------------------------------------------------------- Gente y leyendas

export const people = [
  {
    n: '01',
    name: 'José Gregorio Montes Pérez',
    category: 'Fundador · murió en 1896',
    intro:
      'Propietario de importantes haciendas de la región y de los terrenos de San Rafael, donde se estableció el primer caserío de Gramalote.',
    body: [
      'José Gregorio Montes Pérez fue uno de los principales vecinos vinculados al establecimiento del primer poblado de Gramalote. Era propietario de la hacienda El Palmar, ubicada en la vereda Teherán, así como de terrenos en San Rafael, donde se formó el caserío que dio origen a la población.',
      'También poseía las haciendas Las Juntas, en la vereda Boyacá, y Limoncito, en Valderrama. Estuvo casado con Isabel Molina Páez.',
      'Su participación en la historia fundacional quedó registrada en la escritura número 66 del 15 de diciembre de 1865, mediante la cual, junto con Joaquín Peñaranda y José Berti, participó en la donación de tierras y solares destinados a la Iglesia Parroquial de San Rafael.',
      'Murió el 2 de septiembre de 1896, a los 90 años, en la hacienda Limoncito. Su nombre permanece ligado a los primeros pasos de la comunidad gramalotera.',
    ],
    source: 'Gramalote: toda una historia; Cómo fue posible Gramalote.',
  },
  {
    n: '02',
    name: 'Secundino Jácome',
    category: 'Sacerdote · 1866–1895',
    intro:
      'Primer párroco de San Rafael de Galindo. Su liderazgo religioso y comunitario estuvo ligado al crecimiento del poblado y a los primeros procesos de reubicación.',
    body: [
      'José Secundino Jácome fue nombrado primer párroco de San Rafael de Galindo el 8 de enero de 1866. Durante casi tres décadas estuvo al frente de la vida religiosa de la comunidad y acompañó el crecimiento de los nuevos asentamientos cafeteros y madereros de la región.',
      'Su labor trascendió el ámbito religioso. Promovió la educación y la creación de una escuela en el poblado, y participó en las iniciativas que buscaban trasladar el caserío de Caldereros hacia un terreno más amplio, debido a las dificultades geográficas y a las condiciones del lugar.',
      'Hacia 1870 comenzó a impulsar este proceso junto con otros dirigentes locales. Aunque fue retirado de la parroquia en 1882, su nombre quedó asociado a los orígenes de Gramalote y al desarrollo de otras poblaciones del norte de Santander.',
      'Su historia también permanece vinculada a la tradición de la Virgen de Monguí, cuya imagen se relaciona con su llegada a la comunidad.',
    ],
    source: 'Cómo fue posible Gramalote; Esquema evolutivo del territorio; Gramalote: toda una historia.',
  },
  {
    n: '03',
    name: 'Raimundo Ordóñez Yáñez',
    category: 'Sacerdote y orador',
    intro:
      'Sacerdote nacido en Caldereros, reconocido por su liderazgo religioso, su participación en la vida política regional y la fundación de Lourdes y Las Mercedes.',
    body: [
      'Raimundo Ordóñez Yáñez nació el 24 de mayo de 1863 en Caldereros, el antiguo asentamiento de Gramalote. Fue bautizado con el nombre de Juan Ramón y realizó sus primeros estudios en su tierra natal, bajo la orientación de José Natividad Zafra.',
      'Continuó su formación sacerdotal en Bogotá y posteriormente en Pamplona, donde recibió la ordenación en abril de 1891. A lo largo de su trayectoria ejerció como sacerdote en diferentes poblaciones de Santander y Norte de Santander.',
      'Se destacó por su liderazgo religioso y político. Su participación fue importante en procesos como la fundación de Lourdes y la creación del municipio de Sardinata en 1906. También impulsó la fundación del caserío Las Mercedes, en el territorio de Sardinata.',
      'Además de su labor religiosa, fue escritor y participó como capellán de las fuerzas conservadoras durante diferentes conflictos armados. Defendió a las comunidades indígenas del Catatumbo y tuvo una participación activa en asuntos sociales y políticos de la región.',
      'Falleció el 23 de enero de 1936, a los 73 años. En Gramalote su memoria permanece representada en el busto que actualmente se encuentra en el acceso a la Casa de la Cultura.',
    ],
    source: 'Cuentos y leyendas gramaloteras; ¿Qué tan buen gramalotero es usted?; Gramalote: toda una historia.',
  },
  {
    n: '04',
    name: 'Eusebio Rojas Ballesteros',
    category: 'General',
    intro:
      'Militar nacido en la vereda Teherán. Participó en las guerras civiles del siglo XIX y lideró los batallones de Mutiscua y Gramalote durante el conflicto de 1876.',
    body: [
      'Eusebio Rojas Ballesteros nació en la finca El Pantano, ubicada en la vereda Teherán, territorio rural de Gramalote. Su trayectoria estuvo marcada por la participación en los conflictos militares que tuvieron lugar durante el siglo XIX.',
      'Inició su vida militar durante la guerra civil de 1860, con participación en los acontecimientos de Tulcán en 1861. Posteriormente, durante la guerra de 1876, lideró los batallones de Mutiscua y Gramalote, reconocidos en los registros históricos del municipio como algunos de los más aguerridos del departamento de Santander.',
      'Su trayectoria también aparece referenciada en el libro Campaña militar del Ejército del Norte, publicado en 1885 por el general Guillermo E. Martín, donde se registran numerosas menciones al entonces coronel Eusebio Rojas.',
      'Su nombre forma parte de la memoria de los militares gramaloteros que tuvieron participación en los acontecimientos políticos y armados de su época.',
    ],
    source: 'Gramalote: toda una historia.',
  },
  {
    n: '05',
    name: 'Gonzalo Canal Ramírez',
    category: 'Escritor',
    intro:
      'Reconocido como una de las figuras literarias más destacadas nacidas en tierras gramaloteras, cuya trayectoria representa el aporte del municipio a las letras.',
    body: [
      'Gonzalo Canal Ramírez es recordado entre los personajes ilustres de Gramalote por su trayectoria en el mundo de las letras. El material histórico del municipio lo destaca como una de las plumas más representativas nacidas en estas tierras.',
      'Su nombre aparece en el conjunto de personajes que han contribuido al reconocimiento de Gramalote en diferentes disciplinas, especialmente en el ámbito cultural e intelectual.',
      'Su inclusión en la memoria histórica del municipio permite reconocer la importancia de los escritores y de la producción literaria como parte de la identidad de una comunidad.',
    ],
    source: 'Gramalote: toda una historia.',
  },
  {
    n: '06',
    name: 'Teresa Yáñez de Cuberos',
    category: 'Escritora',
    intro:
      'Escritora gramalotera que encontró en las letras una manera de recuperar sus recuerdos, expresar sus sentimientos y compartir la memoria de su tierra.',
    body: [
      'Teresa Yáñez de Cuberos nació en Gramalote en 1929, en la finca Santa Anita, en el hogar conformado por Silverio Antonio Yáñez Peñaranda y Ana Ramírez Peñaranda.',
      'En sus escritos recogió recuerdos de su infancia en el territorio gramalotero y de sus años de estudio en el colegio Sagrado Corazón de las Hermanas Bethlemitas, en Pamplona.',
      'Ingresó al mundo de la escritura durante una etapa avanzada de su vida, motivada por la pérdida trágica de su hijo Juan Manuel. Encontró en las letras una forma de expresar sus sentimientos y mantener vivo su recuerdo. Participó en los talleres de escritura de la Biblioteca Pública Piloto de Medellín, donde recibió el acompañamiento del escritor Manuel Mejía Vallejo.',
      'Entre sus obras se encuentran De este lado de los sueños, Barco de papel, Plegaria del agua, Ánfora de barro y Los hermanos pequeños de San Francisco. En sus textos se destacan la sencillez, la sensibilidad y la recuperación de los recuerdos cotidianos.',
      'Falleció en Medellín el 9 de mayo de 2019, a los 90 años. Su obra conserva una mirada íntima sobre la vida, la memoria y los paisajes de Gramalote.',
    ],
    source: 'Cruci-temas gramaloteros; Gramalote: toda una historia.',
  },
]

export const stories = [
  {
    n: '01',
    type: 'Leyenda',
    title: 'La maldición del padre Ordóñez',
    intro:
      'Unas palabras atribuidas al padre Raimundo Ordóñez quedaron en la memoria de los gramaloteros y, después de la tragedia de 2010, fueron recordadas como una misteriosa premonición.',
    body: [
      'Raimundo Ordóñez Yáñez fue un sacerdote nacido en Caldereros, conocido por su carácter fuerte y su participación en la vida religiosa, política y social de la región. Su figura también quedó ligada a una de las historias más conocidas de la tradición oral gramalotera.',
      'Según cuenta el relato, el padre Ordóñez tuvo varios enfrentamientos con habitantes de su pueblo natal. En medio de uno de esos desacuerdos, cuyas razones no quedaron claramente establecidas, habría pronunciado una frase que permaneció en la memoria de la comunidad: «Algún día, este pueblo se convertirá en un tartagal».',
      'Con el paso del tiempo, estas palabras fueron interpretadas como una maldición. Cuando ocurrió la destrucción del antiguo casco urbano de Gramalote en diciembre de 2010, muchos habitantes recordaron aquella expresión y la relacionaron con lo sucedido.',
      'La historia también cuenta que, durante la tragedia, el busto del padre Ordóñez permaneció durante varios días sobre su pedestal en el parque principal. Cuando alguien intentó retirarlo para salvarlo, una persona gritó: «Déjelo ahí, ese tiene que ser el último».',
      'Finalmente, el busto fue rescatado y trasladado al nuevo casco urbano, donde actualmente se encuentra en el acceso a la Casa de la Cultura.',
      'Más allá de su carácter legendario, este relato conserva una parte de la memoria colectiva y de la manera en que los gramaloteros interpretaron uno de los acontecimientos más difíciles de su historia.',
    ],
    source: 'Cuentos y leyendas gramaloteras, entrega 4. Relato compilado por León David Peñaranda y editado por Miguel Palacios.',
    image: '/img/historia/gente-01.jpg',
  },
  {
    n: '02',
    type: 'Leyenda',
    title: '¿Hijo de Bolívar?',
    intro:
      'Una antigua tradición relaciona al sacerdote Secundino Jácome con Simón Bolívar. Una historia transmitida entre generaciones que mezcla personajes históricos y memoria popular.',
    body: [
      'Entre las historias que rodean la vida del padre Secundino Jácome se encuentra una tradición que le atribuye ser hijo natural del Libertador Simón Bolívar.',
      'Según esta versión, su madre habría sido una mujer esclavizada que estuvo al servicio de Bolívar durante su estancia en Ocaña, entre 1812 y 1813. A partir de esta relación surgió la creencia de que el sacerdote era descendiente del Libertador.',
      'El relato también cuenta que, después de quedar huérfano, Secundino fue llevado a Cúcuta, donde recibió el cuidado de las señoritas de la familia Jácome. Allí habría recibido formación en humanidades y educación religiosa, que posteriormente marcarían su camino hacia el sacerdocio.',
      'Con el paso de los años, la historia de su supuesto origen se difundió entre los habitantes y llegó a formar parte de la memoria popular de Gramalote.',
      'Sin embargo, no existen documentos históricos que demuestren su parentesco con Simón Bolívar. Por eso, esta narración debe entenderse como una leyenda y no como un hecho comprobado.',
    ],
    source: 'Cómo fue posible Gramalote; ¿Qué tan buen gramalotero es usted?, material cultural del municipio.',
    image: '/img/historia/gente-02.jpg',
  },
  {
    n: '03',
    type: 'Tradición',
    title: 'La Virgen de Monguí',
    intro:
      'Una devoción que ha acompañado a los gramaloteros durante generaciones y que representa una de las expresiones más importantes de su identidad religiosa y cultural.',
    body: [
      'La Virgen de Monguí ocupa un lugar especial en la historia y en la vida religiosa de Gramalote. Su imagen se convirtió en uno de los principales símbolos de fe de la comunidad y permanece vinculada a las tradiciones que han acompañado a sus habitantes a través del tiempo.',
      'Una de las versiones sobre su llegada cuenta que el obispo José Luis Niño llevó una copia de la imagen hasta Pamplona y que, hacia 1861, se la entregó al sacerdote Secundino Jácome. Este la habría trasladado a la nueva parroquia de San Rafael, donde fue ubicada en la puerta del tabernáculo.',
      'Otras versiones recogidas en la memoria local relacionan su llegada con diferentes acontecimientos y personajes religiosos. Estas narraciones hacen parte de la tradición que rodea a la imagen.',
      'Después de la muerte de Secundino Jácome, en 1895, la devoción perdió protagonismo durante un tiempo. En 1947, el padre Josué Acosta Romero impulsó nuevamente su veneración. Con los años, la Virgen de Monguí se consolidó como patrona y símbolo religioso del municipio.',
      'Su importancia también se refleja en las celebraciones del 27 de noviembre, fecha asociada a las festividades patronales, y en los colores de la bandera y las representaciones culturales de Gramalote.',
      'Incluso después de la destrucción del antiguo casco urbano, la imagen fue rescatada de los escombros en diciembre de 2010, convirtiéndose en un símbolo de continuidad y esperanza para la comunidad.',
    ],
    source: 'Virgen de Monguí; Cómo fue posible Gramalote; Gramalote: toda una historia.',
    image: '/img/historia/gente-03.jpg',
  },
  {
    n: '04',
    type: 'Tradición',
    title: 'El nombre Gramalote',
    intro:
      'El nombre del municipio está relacionado con una planta gramínea que abundaba en las laderas del territorio y que terminó convirtiéndose en parte de su identidad.',
    body: [
      'El nombre Gramalote tiene sus raíces en la relación entre los primeros habitantes y el entorno natural que los rodeaba.',
      'Una de las explicaciones recogidas en la historia local señala que proviene de una planta gramínea conocida como gramalote, que crecía abundantemente en las laderas occidentales de la población. Era una planta de hojas anchas y alargadas, utilizada como alimento para el ganado.',
      'Antes de convertirse oficialmente en el nombre del municipio, Gramalote ya identificaba uno de los partidos rurales que conformaban el territorio.',
      'En 1864, cuando se creó el distrito, las autoridades establecieron el nombre de Galindo para su cabecera, conocida como San Rafael. Sin embargo, los habitantes continuaron llamando Gramalote a su territorio.',
      'En 1888, mediante una ordenanza de la Asamblea Departamental de Santander, el municipio recuperó oficialmente el nombre de Gramalote, que había permanecido en la memoria de sus habitantes durante los años en que se utilizó la denominación de Galindo.',
      'Así, el nombre que identifica hoy al municipio conserva una relación directa con su paisaje, su vegetación y la historia de quienes habitaron estas tierras.',
    ],
    source: 'Cómo fue posible Gramalote; Gramalote: toda una historia.',
    image: '/img/historia/gente-01.jpg',
  },
]

export const quotes = [
  { text: 'El mundo se está acabando.', author: 'Un campesino que ayudaba en el rescate, diciembre de 2010' },
  { text: 'Se destruyó el pueblo, el templo, pero nunca la fe.', author: 'Pbro. Samuel García Botello, párroco de Gramalote' },
  {
    text: 'Créanme que Gramalote va a quedar mejor que antes.',
    author: 'Juan Manuel Santos, presidente de Colombia, diciembre de 2010',
  },
]

// -------------------------------------------------------------- Patrimonio

export const ZONES = [
  { id: 'todas', label: 'Todas las zonas' },
  { id: 'caldereros', label: 'Caldereros' },
  { id: 'gramalote-viejo', label: 'Gramalote Viejo' },
  { id: 'nuevo-gramalote', label: 'Nuevo Gramalote' },
]

export const heritage = [
  {
    n: '01',
    slug: 'templo-de-san-rafael-antiguo',
    name: 'Templo de San Rafael · antiguo',
    zone: 'gramalote-viejo',
    zoneLabel: 'Gramalote Viejo',
    category: 'Patrimonio religioso',
    status: 'Con restricciones',
    summary:
      'Fue el centro religioso del antiguo casco urbano. Una torre agrietada permaneció en pie tras el movimiento del terreno, según las fuentes consultadas.',
    intro:
      'El templo que durante generaciones reunió la fe y la vida religiosa de los habitantes del antiguo Gramalote.',
    subtitle: 'El corazón religioso del antiguo pueblo',
    body: [
      'El templo de San Rafael fue uno de los principales referentes religiosos y arquitectónicos de Gramalote Viejo. Durante décadas, sus espacios acogieron celebraciones, encuentros comunitarios y acontecimientos importantes para la población.',
      'El movimiento del terreno de 2010 causó graves daños en la estructura. Sus ruinas permanecen como testimonio de la historia religiosa del municipio y de la transformación que vivió su territorio.',
    ],
    visit: {
      location: 'Antiguo casco urbano de Gramalote, sector de Gramalote Viejo.',
      access: 'Con restricciones.',
      recommendation:
        'Consultar previamente con la Alcaldía las condiciones de seguridad y autorización. No acercarse ni ingresar a las ruinas sin permiso.',
    },
    mapsUrl: 'https://maps.app.goo.gl/ThZgudsNGKhbZf2c8',
    coords: [-72.7978318, 7.8888743], // [longitud, latitud] de la matriz de patrimonio (migración 027)
    image: '/img/historia/pat-01.jpg',
    gallery: [],
    // Carrusel por épocas: sustituye a la foto única en la ficha.
    eras: [
      { src: '/img/historia/tiempo-07.jpg', label: '1910 – 1953', alt: 'Templo de San Rafael entre 1910 y 1953' },
      { src: '/img/historia/tiempo-07a.jpg', label: '1957 – 2010', alt: 'Templo de San Rafael entre 1957 y 2010' },
      { src: '/img/historia/tiempo-07b.jpg', label: 'Desde 2010', alt: 'Ruinas del templo de San Rafael desde 2010' },
    ],
  },
  {
    n: '02',
    slug: 'templo-san-rafael-arcangel',
    name: 'Templo San Rafael Arcángel',
    zone: 'nuevo-gramalote',
    zoneLabel: 'Nuevo Gramalote',
    category: 'Patrimonio religioso',
    status: 'Con restricciones',
    summary:
      'La comunidad sostiene la construcción del nuevo templo mediante donaciones de gramaloteros y benefactores.',
    intro:
      'Un nuevo espacio de encuentro que mantiene viva la tradición religiosa de la comunidad gramalotera.',
    subtitle: 'La fe que acompaña al nuevo pueblo',
    body: [
      'Después de la tragedia de 2010, la comunidad tuvo que reconstruir los espacios que hacían parte de su vida colectiva. Entre ellos, el templo ocupó un lugar especial por su importancia religiosa y cultural.',
      'La construcción del nuevo templo ha contado con el esfuerzo de los habitantes, gramaloteros y benefactores, mediante donaciones destinadas a recuperar un espacio de encuentro y celebración religiosa.',
    ],
    visit: {
      location: 'Nuevo Gramalote.',
      access: 'Con restricciones, según el inventario.',
      recommendation: 'Consultar previamente las condiciones de ingreso y respetar los horarios y actividades religiosas.',
    },
    mapsUrl: 'https://maps.app.goo.gl/K7D5x8YcVH4LNmsQ8',
    coords: [-72.7860123, 7.9161523], // [longitud, latitud] de la matriz de patrimonio (migración 027)
    image: '/img/historia/pat-02.jpg',
    gallery: [],
  },
  {
    n: '03',
    slug: 'plaza-de-la-restauracion',
    name: 'Plaza de la Restauración',
    zone: 'nuevo-gramalote',
    zoneLabel: 'Nuevo Gramalote',
    category: 'Espacio público',
    status: 'Visitable',
    summary:
      'Centro social del pueblo desde el trazado de 1884; la plaza actual tiene 4.300 m² configurada en terrazas urbanas integradas al valle.',
    intro:
      'Un espacio de encuentro que conserva la memoria de la plaza y acompaña la vida cotidiana del nuevo municipio.',
    subtitle: 'El lugar donde vuelve a encontrarse la comunidad',
    body: [
      'La plaza ha sido históricamente uno de los principales escenarios de encuentro de los habitantes de Gramalote. En el antiguo municipio reunía actividades comerciales, celebraciones religiosas y acontecimientos de la vida pública.',
      'En el Nuevo Gramalote, la Plaza de la Restauración cuenta, según el documento de contenidos, con aproximadamente 4.300 m² distribuidos en terrazas urbanas integradas al paisaje del valle. Hoy constituye uno de los espacios centrales de la vida comunitaria.',
    ],
    visit: {
      location: 'Plaza principal, Nuevo Gramalote.',
      access: 'Libre.',
      recommendation: 'Visitar durante el día y recorrer respetuosamente sus espacios públicos.',
    },
    mapsUrl: 'https://maps.app.goo.gl/aYVe7HsQt7FJEPZV6',
    coords: [-72.7865937, 7.9154771], // [longitud, latitud] de la matriz de patrimonio (migración 027)
    image: '/img/historia/pat-03.jpg',
    gallery: [],
  },
  {
    n: '04',
    slug: 'casa-municipal-gregorio-montes',
    name: 'Casa Municipal Gregorio Montes',
    zone: 'gramalote-viejo',
    zoneLabel: 'Gramalote Viejo',
    category: 'Edificio histórico',
    status: 'Con restricciones',
    summary:
      'Sede de la administración municipal desde 1903, quedó reducida a ruinas después de la tragedia de 2010.',
    intro:
      'Un edificio que representó la organización administrativa y la vida institucional del antiguo municipio.',
    subtitle: 'La memoria de la administración municipal',
    body: [
      'La Casa Municipal Gregorio Montes fue sede de la administración de Gramalote desde 1903. Desde allí se desarrollaron actividades relacionadas con el gobierno local y la organización institucional del municipio.',
      'Su estructura formó parte del paisaje urbano del antiguo pueblo. Después de la tragedia de 2010, el edificio quedó reducido a ruinas, que conservan el recuerdo de una de las construcciones representativas de la vida pública gramalotera.',
    ],
    visit: {
      location: 'Antiguo casco urbano, Gramalote Viejo.',
      access: 'Con restricciones.',
      recommendation:
        'No ingresar a las ruinas. Consultar con la Alcaldía si existe un punto seguro de observación y autorización para acercarse.',
    },
    mapsUrl: 'https://maps.app.goo.gl/9xsMX9KDFJYgKWMd7',
    coords: [-72.7981812, 7.8886254], // [longitud, latitud] de la matriz de patrimonio (migración 027)
    image: '/img/historia/pat-04.jpg',
    gallery: [],
  },
  {
    n: '05',
    slug: 'puente-cuervo',
    name: 'Puente Cuervo',
    zone: 'gramalote-viejo',
    zoneLabel: 'Gramalote Viejo',
    category: 'Monumento',
    status: 'Visitable',
    summary:
      'Inaugurado en febrero de 1932, facilitó la llegada del automóvil y el desarrollo de las actividades comerciales.',
    intro:
      'Una obra de infraestructura que transformó la comunicación y el desarrollo comercial de Gramalote.',
    subtitle: 'El puente que abrió nuevos caminos',
    body: [
      'La inauguración del Puente Cuervo, en febrero de 1932, representó un avance importante para la comunicación del municipio. Su construcción permitió la llegada del automóvil y favoreció el crecimiento de las actividades comerciales.',
      'Con el paso de los años, el puente se convirtió en un referente de la infraestructura regional. Su permanencia después de la tragedia de 2010 conserva el recuerdo de una etapa fundamental en la transformación del territorio.',
    ],
    visit: {
      location: 'Sector de Puente Cuervo, vía departamental.',
      access: 'Visitable, sujeto a las condiciones de la vía y del lugar.',
      recommendation:
        'Visitar durante el día. Transitar con precaución y comprobar previamente el estado de la vía; no detenerse en zonas que comprometan la seguridad vial.',
    },
    mapsUrl: 'https://maps.app.goo.gl/gDAeBfpcjWaGHKWf6',
    coords: [-72.793939, 7.8851011], // [longitud, latitud] de la matriz de patrimonio (migración 027)
    image: '/img/historia/pat-05.jpg',
    gallery: [],
  },
  {
    n: '06',
    slug: 'hospital-san-vicente-de-paul',
    name: 'Hospital San Vicente de Paúl',
    zone: 'nuevo-gramalote',
    zoneLabel: 'Nuevo Gramalote',
    category: 'Edificio histórico',
    status: 'Visitable',
    summary:
      'Inaugurado el 6 de agosto de 1941, se convirtió en un importante centro de atención para Gramalote y los municipios vecinos.',
    intro:
      'Una obra construida gracias al esfuerzo colectivo y dedicada al cuidado de la salud de la comunidad.',
    subtitle: 'Una historia de servicio y solidaridad',
    body: [
      'La historia del hospital comenzó con iniciativas de asistencia impulsadas por el padre Secundino Jácome para atender a las personas más necesitadas. Posteriormente, la llegada de las Hijas de la Caridad de San Vicente de Paúl, en 1936, fortaleció la atención social y sanitaria.',
      'El edificio hospitalario fue inaugurado el 6 de agosto de 1941, gracias al esfuerzo conjunto de la comunidad, las autoridades y las religiosas. Se convirtió en un importante centro de atención para Gramalote y los municipios vecinos.',
    ],
    visit: {
      location: 'Nuevo Gramalote.',
      access: 'Acceso sujeto a las condiciones del establecimiento.',
      recommendation:
        'Es un centro de salud en funcionamiento: respetar las áreas de atención, la privacidad de los pacientes y las normas del establecimiento. No realizar visitas turísticas que interfieran con los servicios médicos.',
    },
    mapsUrl: 'https://maps.app.goo.gl/kP7R8drs9PrDULjs5',
    coords: [-72.7872526, 7.914146], // [longitud, latitud] de la matriz de patrimonio (migración 027)
    image: '/img/historia/pat-06.jpg',
    gallery: ['/img/historia/pat-06b.jpg'],
  },
  {
    n: '07',
    slug: 'colegio-sagrado-corazon-de-jesus',
    name: 'Colegio Sagrado Corazón de Jesús',
    zone: 'nuevo-gramalote',
    zoneLabel: 'Nuevo Gramalote',
    category: 'Edificio histórico',
    status: 'Visitable',
    summary:
      'Impulsado por las Hermanas Bethlemitas, fue uno de los principales referentes educativos del antiguo Gramalote.',
    intro:
      'Una institución que marcó la formación académica y la vida de generaciones de gramaloteros.',
    subtitle: 'La educación como legado de comunidad',
    body: [
      'El Colegio Sagrado Corazón de Jesús fue impulsado por la comunidad de Hermanas Bethlemitas, bajo la dirección de la madre Encarnación. Su labor educativa contribuyó a la formación de numerosas generaciones de niñas y jóvenes del municipio.',
      'Su trayectoria lo convirtió en uno de los referentes educativos y culturales de Gramalote. El documento de contenidos lo vincula con la memoria del antiguo municipio, mientras que el inventario lo registra en Nuevo Gramalote; esta correspondencia territorial debe confirmarse antes de publicar la ubicación.',
    ],
    visit: {
      location: 'Nuevo Gramalote, según el inventario. Confirmar si el punto corresponde a la sede actual o a la referencia histórica.',
      access: 'Requiere autorización institucional.',
      recommendation:
        'Consultar previamente con la institución. No ingresar a las instalaciones sin autorización ni interrumpir las actividades académicas.',
    },
    mapsUrl: 'https://maps.app.goo.gl/E569mY89DG6AsPgb7',
    coords: [-72.7883649, 7.9148731], // [longitud, latitud] de la matriz de patrimonio (migración 027)
    image: '/img/historia/pat-07.jpg',
    gallery: ['/img/historia/pat-07b.jpg'],
  },
  {
    n: '08',
    slug: 'capilla-bethlemita',
    name: 'Capilla Bethlemita',
    zone: 'gramalote-viejo',
    zoneLabel: 'Gramalote Viejo',
    category: 'Patrimonio religioso',
    status: 'Solo memoria',
    summary:
      'La Capilla de los Dolores Internos del Sagrado Corazón fue una de las construcciones religiosas más representativas del antiguo Gramalote.',
    intro:
      'Una construcción religiosa de estilo gótico que permanece en la memoria arquitectónica y espiritual del antiguo pueblo.',
    subtitle: 'La huella de una arquitectura desaparecida',
    body: [
      'La Capilla de los Dolores Internos del Sagrado Corazón, vinculada a la comunidad Bethlemita, fue una de las construcciones religiosas más representativas del antiguo Gramalote. Su arquitectura de estilo gótico destacaba dentro del paisaje urbano.',
      'El documento histórico sitúa su construcción en 1936. Durante la tragedia de diciembre de 2010 sufrió daños irreversibles y su torre sur colapsó. La capilla se conserva hoy en la memoria de la comunidad y en los registros históricos.',
    ],
    visit: {
      location: 'Gramalote Viejo, ubicación histórica.',
      access: 'Solo memoria; no se presenta como un sitio actualmente visitable.',
      recommendation:
        'Conocer su historia mediante fotografías, testimonios y documentos históricos. No ofrecer una visita física a las ruinas sin confirmación de su existencia, acceso y seguridad.',
    },
    mapsUrl: 'https://maps.app.goo.gl/YqZGKan3MpQvM7Dk6',
    coords: [-72.79725, 7.88845], // [longitud, latitud] de la matriz de patrimonio (migración 027)
    image: '/img/historia/pat-08.jpg',
    gallery: [],
  },
  {
    n: '09',
    slug: 'ruinas-del-primer-templo',
    name: 'Ruinas del primer templo (Pueblo Viejo)',
    zone: 'caldereros',
    zoneLabel: 'Caldereros',
    category: 'Patrimonio religioso',
    status: 'Con restricciones',
    summary:
      'Restos del primer templo del antiguo asentamiento de Caldereros, testimonio de los orígenes del territorio.',
    intro:
      'Los vestigios de uno de los primeros espacios religiosos del territorio donde comenzó la historia de Gramalote.',
    subtitle: 'Las primeras huellas de Caldereros',
    body: [
      'En el antiguo asentamiento de Caldereros, ubicado en la vereda Miraflores, la vida religiosa fue fundamental para la organización de sus primeros habitantes. La construcción de espacios de culto acompañó el crecimiento de aquella comunidad.',
      'Los restos del primer templo constituyen un testimonio de los orígenes del municipio y de su primera ubicación. Su valor histórico permite reconocer las huellas materiales de los primeros asentamientos gramaloteros.',
    ],
    visit: {
      location: 'Vereda Miraflores, sector de Caldereros.',
      access: 'Con restricciones.',
      recommendation:
        'No acercarse sin verificar previamente las condiciones de seguridad, el estado del terreno y la autorización de acceso.',
    },
    // Sin coordenada propia en la matriz: se ubica de forma aproximada junto al Puente Gregorio Montes.
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=7.9022955,-72.7977908',
    coords: [-72.7977908, 7.9022955],
    coordsApprox: true,
    image: '/img/historia/pat-09.jpg',
    gallery: [],
  },
  {
    n: '10',
    slug: 'estatua-de-secundino-jacome',
    name: 'Estatua de Secundino Jácome',
    zone: 'gramalote-viejo',
    zoneLabel: 'Gramalote Viejo',
    category: 'Monumento',
    status: 'Solo memoria',
    zoneTag: 'Gramalote Viejo — emplazamiento histórico',
    summary:
      'Homenaje al primer párroco de Gramalote, colocado en 1962 en la iglesia parroquial del antiguo pueblo; hoy se conserva en fotografías.',
    intro:
      'Un homenaje al primer párroco de Gramalote, cuya labor hizo parte de la historia religiosa del municipio.',
    subtitle: 'El legado del padre Secundino Jácome',
    body: [
      'Secundino Jácome fue el primer párroco de Gramalote y una figura vinculada a la vida religiosa de sus habitantes. Su labor pastoral acompañó los primeros años de organización de la comunidad y el desarrollo del municipio.',
      'En su honor se levantó una estatua, colocada el 8 de diciembre de 1962. De acuerdo con los registros históricos de la Universidad de Pamplona, la escultura fue instalada en la iglesia parroquial del antiguo Gramalote, mientras que la estatua de Laureano Gómez ocupó el parque principal.',
      'La escultura ya no se conserva como monumento físico. Su recuerdo permanece en los registros fotográficos que permiten conocer cómo era y el lugar que ocupó en el antiguo municipio.',
    ],
    // Solo memoria: no hay visita física, así que la ficha no lleva bloque «para visitarlo».
    visit: null,
    imageAlt: 'Estatua del padre Secundino Jácome en el antiguo Gramalote',
    imageCaption: 'Fotografía histórica: estatua del padre Secundino Jácome en el antiguo Gramalote.',
    mapsUrl: 'https://maps.app.goo.gl/itwtwRQNMGM4MbuDA',
    // Estuvo en la iglesia parroquial del antiguo Gramalote: se ubica junto al Templo de San Rafael antiguo (aproximado).
    coords: [-72.7976, 7.8890],
    coordsApprox: true,
    image: '/img/historia/pat-10.jpg',
    gallery: [],
  },
  {
    n: '11',
    slug: 'estatua-de-laureano-gomez',
    name: 'Estatua de Laureano Gómez',
    zone: 'nuevo-gramalote',
    zoneLabel: 'Nuevo Gramalote',
    category: 'Monumento',
    status: 'Visitable',
    zoneTag: 'Nuevo Gramalote (según el inventario)',
    summary:
      'Escultura del expresidente Laureano Gómez: trasladada a la Gobernación en 2010 y devuelta restaurada al Nuevo Gramalote en 2016.',
    intro:
      'Una escultura dedicada al expresidente Laureano Gómez, recuperada e instalada nuevamente en el municipio después de la tragedia de 2010.',
    subtitle: 'Laureano Gómez: del antiguo al nuevo Gramalote',
    body: [
      'La estatua de Laureano Gómez fue realizada en homenaje al expresidente colombiano y estuvo ubicada durante décadas en el parque principal del antiguo Gramalote. Su instalación fue promovida desde 1950 y finalmente llegó a la plaza en 1973.',
      'En diciembre de 2010, ante el deterioro del terreno y la evacuación del municipio, la escultura fue trasladada a la Gobernación de Norte de Santander para protegerla de los daños ocasionados por la falla geológica.',
      'El 16 de diciembre de 2016, después de su restauración, fue devuelta al Nuevo Gramalote. Desde entonces forma parte del patrimonio monumental del municipio y puede apreciarse nuevamente en su espacio público.',
    ],
    visit: {
      location: 'Plaza principal (Plaza de la Restauración).',
      access: 'Visitable. Se encuentra en un espacio público.',
      recommendation:
        'Aprovechar la visita para recorrer la plaza principal y conocer otros espacios representativos del nuevo municipio.',
    },
    mapsUrl: 'https://maps.app.goo.gl/Eej6XoywhVfRkx8v7',
    coords: [-72.786362, 7.915631], // [longitud, latitud] de la matriz de patrimonio (migración 027)
    image: '/img/historia/pat-11.jpg',
    gallery: [],
  },
  {
    n: '12',
    slug: 'diosa-de-la-fuente',
    name: 'Diosa de la Fuente',
    zone: 'nuevo-gramalote',
    zoneLabel: 'Nuevo Gramalote',
    category: 'Monumento',
    status: 'Visitable',
    summary:
      'Instalada en 1912 sobre la pila de la plaza, fue recuperada tras la tragedia y hoy vuelve a ocupar un lugar en el nuevo Gramalote.',
    intro:
      'Una escultura que acompañó durante décadas la vida cotidiana de la plaza y volvió a ocupar un lugar en el nuevo Gramalote.',
    subtitle: 'La diosa que volvió a la plaza',
    body: [
      'La Diosa de la Fuente es una escultura que forma parte de la vida pública de Gramalote desde inicios del siglo XX. Según el documento de contenidos, fue instalada en 1912 sobre la pila de la plaza, como un elemento de embellecimiento del espacio público.',
      'Con el paso del tiempo se convirtió en un punto de encuentro, presente en celebraciones y en la vida cotidiana del pueblo. Tras la tragedia de 2010, la estatua fue recuperada y hoy vuelve a presidir la plaza del Nuevo Gramalote, como vínculo entre la memoria del antiguo municipio y la vida actual.',
    ],
    visit: {
      location: 'Plaza principal, Nuevo Gramalote.',
      access: 'Libre, según la ficha.',
      recommendation: 'Visitar durante el día y recorrer la plaza, respetando el espacio público y a sus visitantes.',
    },
    mapsUrl: 'https://maps.app.goo.gl/MmKW4C8SE9kwmXfLA',
    coords: [-72.786818, 7.915442], // [longitud, latitud] de la matriz de patrimonio (migración 027)
    image: '/img/historia/pat-12.jpg',
    gallery: [],
  },
  {
    n: '13',
    slug: 'puente-gregorio-montes',
    name: 'Puente Gregorio Montes',
    zone: 'caldereros',
    zoneLabel: 'Caldereros',
    category: 'Monumento',
    status: 'Visitable',
    summary:
      'Sobre la quebrada Calderera, recuerda la importancia de los caminos y pasos naturales para las comunidades rurales.',
    intro:
      'Una estructura vinculada a los caminos y a la memoria del primer asentamiento de Gramalote.',
    subtitle: 'Un puente ligado a los orígenes del territorio',
    body: [
      'El puente Gregorio Montes se encuentra sobre la quebrada Calderera, en el territorio de Caldereros, donde se estableció el primer asentamiento de la población. Su ubicación permite reconocer la importancia de los caminos y de los pasos naturales para la comunicación entre las comunidades rurales.',
      'Su nombre rinde homenaje a Gregorio Montes, personaje recordado por su participación en los orígenes de Gramalote. El puente permanece como un referente de la memoria territorial del municipio.',
    ],
    visit: {
      location: 'Quebrada Calderera, sector Caldereros.',
      access: 'Visitable, sujeto al estado del camino y a las condiciones de seguridad.',
      recommendation: 'Visitar durante el día y verificar previamente el estado del camino y las condiciones del terreno.',
    },
    mapsUrl: 'https://maps.app.goo.gl/QFZ1AnYq5ZVgRULm8',
    coords: [-72.7983908, 7.9015955], // [longitud, latitud] de la matriz de patrimonio (migración 027)
    image: '/img/historia/pat-13.jpg',
    gallery: [],
  },
]

export function getHeritage(slug) {
  return heritage.find((item) => item.slug === slug) ?? null
}

export const heritageHero = {
  eyebrow: 'Patrimonio del territorio',
  title: 'Patrimonio',
  intro:
    'Lugares que conservan la memoria de Gramalote. Templos, espacios públicos, caminos y monumentos que narran sus distintas etapas.',
}

export const genteHero = {
  eyebrow: 'Memoria y comunidad',
  title: 'Gente y leyendas',
  intro: 'Un pueblo es también lo que recuerda y lo que cuenta.',
}
