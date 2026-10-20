import { Link } from 'react-router-dom'
import Placeholder from '../ui/Placeholder.jsx'
import Icon from '../ui/Icon.jsx'

export default function ExperienceCard({ experience, featured = false }) {
  return (
    <Link
      className={`experience-card${featured ? ' experience-card--featured' : ''}`}
      to={experience.to}
    >
      <Placeholder label={experience.category} />
      <div className="experience-card__body">
        <span className="experience-card__category">{experience.category}</span>
        <h3 className="experience-card__title">{experience.title}</h3>
        <p className="experience-card__text">{experience.description}</p>
        <span className="experience-card__cta">
          {featured ? 'Ver más' : 'Explorar'}
          <Icon name="arrow" />
        </span>
      </div>
    </Link>
  )
}
