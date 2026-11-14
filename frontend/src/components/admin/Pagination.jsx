import { PAGE_SIZE } from '../../lib/usePaged.js'

// Pie de las listas del panel: anterior / siguiente y en qué página va.
export default function Pagination({ page, pages, total, setPage, label = 'elementos' }) {
  if (total <= PAGE_SIZE || pages <= 1) return null
  return (
    <nav className="admin-pager" aria-label={`Páginas de ${label}`}>
      <button type="button" className="admin-btn" onClick={() => setPage(page - 1)} disabled={page <= 1}>
        ← Anterior
      </button>
      <span className="admin-pager__info">
        Página {page} de {pages} · {total} {label}
      </span>
      <button type="button" className="admin-btn" onClick={() => setPage(page + 1)} disabled={page >= pages}>
        Siguiente →
      </button>
    </nav>
  )
}
