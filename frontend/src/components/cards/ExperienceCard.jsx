import { Link } from 'react-router-dom'
import Photo from '../ui/Photo.jsx'
import Icon from '../ui/Icon.jsx'

export default function ExperienceCard({ experience, featured = false }) {
  return (
    <Link
      className={`experience-card${featured ? ' experience-card--featured' : ''}`}
      to={experience.to}
    >
      <Photo src={experience.photo} alt={experience.title} />
      <div className="experience-card__body">
        <h3 className="experience-card__title">{experience.title}</h3>
        <p className="experience-card__text">{experience.description}</p>
        <span className="experience-card__cta">
          {featured ? 'Ver más' : 'Explorar'}
          <Icon name="chevron-right" />
        </span>
      </div>
    </Link>
  )
}
