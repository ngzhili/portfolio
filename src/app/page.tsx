/**
 * Home page — assembles the single-page sections in order.
 * Each section is its own component under src/components/sections/.
 */
import { Hero } from '@/components/sections/Hero';
import { AgentSystems } from '@/components/sections/AgentSystems';
import { Experience } from '@/components/sections/Experience';
import { Projects } from '@/components/sections/Projects';
import { Publications } from '@/components/sections/Publications';
import { Skills } from '@/components/sections/Skills';
import { Certifications } from '@/components/sections/Certifications';
import { Awards } from '@/components/sections/Awards';
import { About } from '@/components/sections/About';
import { Contact } from '@/components/sections/Contact';

export default function HomePage() {
  return (
    <>
      <Hero />
      <AgentSystems />
      <Experience />
      <Skills />
      <Projects />
      <Publications />
      <Certifications />
      <Awards />
      <About />
      <Contact />
    </>
  );
}
