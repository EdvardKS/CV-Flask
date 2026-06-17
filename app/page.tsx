import { Desktop } from '@os/Desktop'
import { SeoHomeContent } from '@components/SeoHomeContent'
import { AutoStart } from '@os/AutoStart'

export default function Home() {
  return (
    <>
      <SeoHomeContent />
      <Desktop />
      {/* Visitors land on the home and the Projects window opens first. */}
      <AutoStart appId="projects" />
    </>
  )
}
