import Hero from '../components/home/Hero.jsx'
import BannerCarousel from '../components/home/BannerCarousel.jsx'
import MapBlock from '../components/home/MapBlock.jsx'
import QuickAccess from '../components/home/QuickAccess.jsx'
import ExperiencesSection from '../components/home/ExperiencesSection.jsx'
import OpenToday from '../components/home/OpenToday.jsx'
import HistoryBlock from '../components/home/HistoryBlock.jsx'
import PracticalInfo from '../components/home/PracticalInfo.jsx'
import { usePageContent } from '../lib/pageContent.js'

export default function Inicio() {
  const content = usePageContent('inicio')
  const carousel = usePageContent('carrusel')

  return (
    <>
      <Hero />
      <BannerCarousel content={carousel} />
      <MapBlock />
      <QuickAccess items={content.quickAccess} />
      <ExperiencesSection items={content.experiences} />
      <OpenToday items={content.highlights} />
      <HistoryBlock />
      <PracticalInfo />
    </>
  )
}
