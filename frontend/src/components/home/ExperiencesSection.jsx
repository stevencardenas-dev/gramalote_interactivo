import { experiences } from '../../data/experiences.js'
import ExperienceCard from '../cards/ExperienceCard.jsx'

export default function ExperiencesSection() {
  return (
    <section className="section" aria-labelledby="experiences-title">
      <div className="container">
        <div className="experiences__head">
          <div className="section-head">
            <h2 id="experiences-title">Experiencias que no olvidarás</h2>
            <p>Gramalote se vive con los ojos, los pies y el paladar.</p>
          </div>
        </div>

        <div className="experiences__grid">
          {experiences.map((experience, index) => (
            <ExperienceCard
              key={experience.id}
              experience={experience}
              featured={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
