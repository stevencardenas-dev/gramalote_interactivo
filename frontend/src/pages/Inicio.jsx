import Hero from '../components/home/Hero.jsx'
import MapBlock from '../components/home/MapBlock.jsx'
import QuickAccess from '../components/home/QuickAccess.jsx'
import ExperiencesSection from '../components/home/ExperiencesSection.jsx'
import OpenToday from '../components/home/OpenToday.jsx'
import HistoryBlock from '../components/home/HistoryBlock.jsx'

export default function Inicio() {
  return (
    <>
      <Hero />
      <MapBlock />
      <QuickAccess />
      <ExperiencesSection />
      <OpenToday />
      <HistoryBlock />
    </>
  )
}
