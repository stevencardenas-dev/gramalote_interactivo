import Placeholder from '../ui/Placeholder.jsx'
import Button from '../ui/Button.jsx'

function HistoryContent() {
  return (
    <div className="history-block">
      <Placeholder label="Historia y cultura" />
      <div className="history-block__content">
        <p className="eyebrow">Historia y cultura</p>
        <h2>Conoce la historia detrás del paisaje</h2>
        <p>La historia de un pueblo que renació entre las montañas.</p>
        <Button to="/historia" icon="arrow">
          Conoce nuestra historia
        </Button>
      </div>
    </div>
  )
}

export default function HistoryBlock({ embedded = false }) {
  if (embedded) return <HistoryContent />

  return (
    <section className="section" aria-labelledby="history-title">
      <div className="container">
        <HistoryContent />
      </div>
    </section>
  )
}
