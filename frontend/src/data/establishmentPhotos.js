// Fotos por establecimiento (entrega de Drive, optimizadas en public/img/ficha).
// Se mezclan sobre los datos base en establishments.js.
const f = (name) => `/img/ficha/${name}.jpg`

const dish = (slug, title, text, key) => ({ title, text, photo: f(`${slug}-${key}`) })
const product = (slug, name, key) => ({ name, photo: f(`${slug}-${key}`) })
const lodging = (slug) => ({
  photo: f(`${slug}-card`),
  hero: f(`${slug}-hero`),
  gallery: [f(`${slug}-card`), f(`${slug}-hero`)],
})

export const establishmentPhotos = {
  bambu: {
    photo: f('bambu-card'),
    hero: f('bambu-hero'),
    features: [
      dish('bambu', 'Hamburguesas', 'Variedad de hamburguesas para disfrutar.', 'hamburguesas'),
      dish('bambu', 'Coctelería', 'Cócteles y bebidas para compartir.', 'cocteleria'),
      dish('bambu', 'Cafetería', 'Opciones de café y bebidas para acompañar tu visita.', 'cafeteria'),
    ],
  },
  'dulce-paseo': { photo: f('dulce-paseo-card'), hero: f('dulce-paseo-hero') },
  'dona-claudia': {
    photo: f('dona-claudia-card'),
    hero: f('dona-claudia-hero'),
    features: [
      dish('dona-claudia', 'Arroz con verduras', 'Arroz con verduras y pan tostado.', 'plato-1'),
      dish('dona-claudia', 'Pollo con arroz', 'Pollo con arroz y acompañamientos.', 'plato-2'),
      dish('dona-claudia', 'Pollo con mazorca', 'Pollo con mazorca y acompañamientos.', 'plato-3'),
    ],
  },
  'fresas-con-crema-carvajal': {
    photo: f('fresas-con-crema-carvajal-card'),
    hero: f('fresas-con-crema-carvajal-hero'),
    features: [
      dish('fresas-con-crema-carvajal', 'Fresas con crema', 'El postre insignia, con fruta fresca.', 'fresas'),
      dish('fresas-con-crema-carvajal', 'Maracumango', 'Un refresco frutal y tropical.', 'maracumango'),
      dish('fresas-con-crema-carvajal', 'Obleas', 'Obleas con arequipe, queso y mermelada.', 'obleas'),
    ],
  },
  'la-comarca': {
    photo: f('la-comarca-card'),
    hero: f('la-comarca-hero'),
    features: [
      dish('la-comarca', 'Helados artesanales', 'Sabores de la región elaborados con ingredientes locales.', 'helados'),
      dish('la-comarca', 'Postres', 'Fresas con crema y copas para compartir.', 'postres'),
      dish('la-comarca', 'Yogur griego', 'Yogur natural para llevar durante el recorrido.', 'yogur'),
    ],
  },
  'la-sazon-de-la-tia': {
    photo: f('la-sazon-de-la-tia-card'),
    hero: f('la-sazon-de-la-tia-hero'),
    features: [
      dish('la-sazon-de-la-tia', 'Carnes a la plancha', 'Cortes a la plancha con acompañamientos.', 'carnes'),
      dish('la-sazon-de-la-tia', 'Pechuga en salsa de champiñones', 'Un plato casero con salsa cremosa.', 'pechuga'),
      dish('la-sazon-de-la-tia', 'Sobrebarriga en salsa', 'Receta tradicional de la casa.', 'sobrebarriga'),
    ],
  },
  'origen-cocina-de-autor': {
    photo: f('origen-cocina-de-autor-card'),
    features: [
      dish('origen-cocina-de-autor', 'Choripán', 'Una versión de autor del clásico.', 'card'),
      dish('origen-cocina-de-autor', 'El Tesoro', 'Hamburguesa de la casa.', 'plato-1'),
      dish('origen-cocina-de-autor', 'Maicito mixto', 'Maíz tierno con quesos y toppings.', 'plato-2'),
    ],
  },
  'glamping-vista-antigua': lodging('glamping-vista-antigua'),
  'hostal-campestre-camino-real': lodging('hostal-campestre-camino-real'),
  'hostal-luna-azul': lodging('hostal-luna-azul'),
  'cabanas-el-penon': lodging('cabanas-el-penon'),
  'casa-hiedra-hotel-boutique': {
    photo: f('casa-hiedra-hotel-boutique-card'),
    gallery: [f('casa-hiedra-hotel-boutique-card')],
  },
  artelu: { photo: f('artelu-card'), hero: f('artelu-hero') },
  chelinarte: { photo: f('chelinarte-card') },
  'mi-gordita-bella': { photo: f('mi-gordita-bella-card') },
  'mi-hermoso-eden': { photo: f('mi-hermoso-eden-card') },
  'maestros-de-la-madera': {
    photo: f('maestros-de-la-madera-card'),
    products: [
      product('maestros-de-la-madera', 'Llaveros', 'llaveros'),
      product('maestros-de-la-madera', 'Imanes', 'imanes'),
      product('maestros-de-la-madera', 'Letreros', 'letreros'),
      product('maestros-de-la-madera', 'Adornos', 'adornos'),
    ],
  },
  'creaciones-martina': {
    photo: f('creaciones-martina-card'),
    products: [
      product('creaciones-martina', 'Amigurumis', 'amigurumis'),
      product('creaciones-martina', 'Velas artesanales', 'velas'),
      product('creaciones-martina', 'Llaveros', 'llaveros'),
      product('creaciones-martina', 'Cuadros decorativos', 'cuadros'),
    ],
  },
  caliopes: {
    photo: f('caliopes-card'),
    products: [
      product('caliopes', 'Macetas', 'macetas'),
      product('caliopes', 'Plantas', 'plantas'),
    ],
  },
  'sombreros-techa': {
    photo: f('sombreros-techa-card'),
    products: [
      product('sombreros-techa', 'Sombreros', 'sombrero'),
      product('sombreros-techa', 'Productos textiles', 'textil'),
    ],
  },
}
