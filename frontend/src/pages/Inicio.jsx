import Hero from '../components/home/Hero.jsx'
import MapBlock from '../components/home/MapBlock.jsx'
import QuickAccess from '../components/home/QuickAccess.jsx'
import ExperiencesSection from '../components/home/ExperiencesSection.jsx'
import OpenToday from '../components/home/OpenToday.jsx'
import HistoryBlock from '../components/home/HistoryBlock.jsx'
import PracticalInfo from '../components/home/PracticalInfo.jsx'
import { usePageContent } from '../lib/pageContent.js'

export default function Inicio() {
  const content = usePageContent('inicio')

  return (
    <>
      <Hero />
      <MapBlock />
      <QuickAccess items={content.quickAccess} />
      <ExperiencesSection items={content.experiences} />
      <OpenToday items={content.highlights} />
      <HistoryBlock />
      <PracticalInfo />
    </>
  )
}
