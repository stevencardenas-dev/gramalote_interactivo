import Button from '../ui/Button.jsx'

function HistoryContent() {
  return (
    <div className="history-banner">
      <div className="history-banner__bg">
        <img src="/img/home/historia-banner.jpg" alt="Torre de la iglesia de Gramalote Viejo" />
      </div>
      <div className="history-banner__body">
        <p className="eyebrow">Historia y cultura</p>
        <h2>Conoce la historia detrás del paisaje</h2>
        <p>La historia de un pueblo que renació entre las montañas.</p>
        <Button to="/historia" icon="arrow" variant="light">
          Conoce nuestra historia
        </Button>
      </div>
    </div>
  )
}

export default function HistoryBlock({ embedded = false }) {
  if (embedded) return <HistoryContent />

  return (
    <section className="history-section" aria-labelledby="history-title">
      <div className="container">
        <HistoryContent />
      </div>
    </section>
  )
}
