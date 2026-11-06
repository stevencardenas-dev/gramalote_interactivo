import { experiences } from '../../data/experiences.js'
import ExperienceCard from '../cards/ExperienceCard.jsx'

export default function ExperiencesSection() {
  return (
    <section className="experiences" aria-labelledby="experiences-title">
      <div className="container">
        <div className="section-head section-head--center">
          <h2 id="experiences-title">Experiencias que no olvidarás</h2>
          <p>Gramalote se vive con los ojos, pies y el paladar</p>
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
