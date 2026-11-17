import { heritage } from '../data/historia.js'

// El mapa recibe los patrimonios de la base de datos; sus fichas viven en
// /historia/patrimonio. Casi todos comparten slug; este alias cubre el único que
// difiere (base de datos → ficha).
const ALIAS = {
  'templo-san-rafael-antiguo': 'templo-de-san-rafael-antiguo',
}

// Ficha de Historia que corresponde a un patrimonio del mapa, o null si no tiene.
export function heritageFichaFor(slug) {
  if (!slug) return null
  const target = ALIAS[slug] ?? slug
  return heritage.find((item) => item.slug === target) ?? null
}
