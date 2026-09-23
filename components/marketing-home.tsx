'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Html, Line, OrbitControls, RoundedBox, Sparkles, Text } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ArrowRight, Check, ChevronRight, CircleAlert, Menu, ShieldCheck, X } from 'lucide-react'

const findings = [
  'Patient Wi-Fi shares network with patient records',
  'Workstations unencrypted, updates months behind',
  'No multi-factor authentication on email',
  'Backup untested, single copy, on-site only',
  'Nothing monitoring outside office hours',
  'No Security Risk Assessment on file',
]
const layers = [
  ['Network', 'Patient Wi-Fi physically cannot reach the practice server.', 'Ubiquiti UniFi gateway, switching, and access points segmented into three isolated zones.'],
  ['Identity & devices', 'Every device is known, encrypted, and protected.', 'Microsoft 365 Business Premium with Entra ID, enforced MFA, Intune, Defender, and email screening.'],
  ['24/7 detection', 'If something happens at 3 AM, someone is already on it.', 'Huntress managed detection and response backed by a human security operations centre.'],
  ['Backup & recovery', 'A dead server should not mean a dead day.', 'Axcient image-based backup every hour, offsite, covering your database and imaging folders.'],
  ['Documentation', 'Proof that your safeguards are working, ready when you need it.', 'Every patch, restore test, and training session logged in a monthly practice-health report.'],
]

const networkNodes = [
  { label: 'Front desk', detail: 'Encrypted workstation', position: [-3.4, 0.7, 1.2] as [number, number, number], color: '#ff806f' },
  { label: 'Imaging', detail: 'Protected radiographs', position: [-2.7, 0.9, -1.5] as [number, number, number], color: '#ffad66' },
  { label: 'Practice server', detail: 'Hourly immutable backup', position: [0, 1.2, 0] as [number, number, number], color: '#2dd4bf' },
  { label: 'Cloud backup', detail: 'Recovery copy off-site', position: [2.9, 2.5, -0.8] as [number, number, number], color: '#7dd3fc' },
  { label: 'Security team', detail: 'Human response 24/7', position: [3.5, 0.7, 1.4] as [number, number, number], color: '#c4b5fd' },
]

function NetworkNode({ node, active, onSelect }: { node: typeof networkNodes[number]; active: boolean; onSelect: () => void }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => { if (ref.current) ref.current.scale.setScalar(1 + (active ? Math.sin(state.clock.elapsedTime * 3) * 0.07 : 0)) })
  return <group ref={ref} position={node.position} onClick={(event) => { event.stopPropagation(); onSelect() }}>
    <mesh><sphereGeometry args={[active ? 0.28 : 0.2, 24, 24]} /><meshPhysicalMaterial color={node.color} emissive={node.color} emissiveIntensity={active ? 2.2 : 0.8} roughness={0.2} metalness={0.2} /></mesh>
    <mesh scale={active ? 1.8 : 1.35}><sphereGeometry args={[0.2, 16, 16]} /><meshBasicMaterial color={node.color} transparent opacity={0.08} /></mesh>
    {active && <Html distanceFactor={8} position={[0, 0.55, 0]} center><div className="node-label"><strong>{node.label}</strong><span>{node.detail}</span></div></Html>}
  </group>
}

function DentalOffice({ secure }: { secure: boolean }) {
  const glow = secure ? '#2dd4bf' : '#ff806f'
  return <group position={[0, -0.1, 0]}>
    <RoundedBox args={[8.2, 0.35, 5.6]} radius={0.12} position={[0, -0.35, 0]}><meshPhysicalMaterial color="#12222d" roughness={0.48} metalness={0.3} /></RoundedBox>
    <RoundedBox args={[7.5, 0.08, 4.9]} radius={0.08} position={[0, -0.12, 0]}><meshPhysicalMaterial color={secure ? '#103b3d' : '#3d2933'} transparent opacity={0.9} roughness={0.28} /></RoundedBox>
    <group position={[-1.1, 0.38, 0.15]} rotation={[0, 0.08, -0.04]}>
      <RoundedBox args={[2.2, 0.32, 1.15]} radius={0.18}><meshPhysicalMaterial color="#d7dfe2" roughness={0.28} /></RoundedBox>
      <RoundedBox args={[1.35, 0.28, 0.7]} radius={0.16} position={[-0.55, 0.34, 0]} rotation={[0, 0, -0.18]}><meshPhysicalMaterial color="#b8c9cf" roughness={0.3} /></RoundedBox>
      <RoundedBox args={[0.58, 0.22, 0.9]} radius={0.12} position={[0.95, 0.26, 0]} rotation={[0, 0, 0.16]}><meshPhysicalMaterial color="#c7d4d8" roughness={0.3} /></RoundedBox>
      <mesh position={[-1.02, 0.08, 0]} rotation={[0, 0, -0.2]}><cylinderGeometry args={[0.12, 0.12, 1.1, 16]} /><meshPhysicalMaterial color="#344956" metalness={0.8} /></mesh>
    </group>
    <group position={[1.55, 0.72, -0.25]}>
      <RoundedBox args={[1.25, 0.65, 0.78]} radius={0.08}><meshPhysicalMaterial color="#263d49" metalness={0.5} roughness={0.24} /></RoundedBox>
      <mesh position={[0, 0.46, 0]} rotation={[0.05, 0, 0]}><boxGeometry args={[1.05, 0.62, 0.05]} /><meshPhysicalMaterial color="#172832" emissive={glow} emissiveIntensity={0.35} /></mesh>
      <Text position={[0, 0.46, 0.04]} fontSize={0.11} color={glow} anchorX="center" anchorY="middle">PATIENT CHART</Text>
    </group>
    <group position={[2.5, 0.25, 0.65]}>
      <RoundedBox args={[0.7, 0.95, 0.5]} radius={0.06}><meshPhysicalMaterial color="#526873" roughness={0.32} /></RoundedBox>
      <mesh position={[0, 0.55, 0]}><sphereGeometry args={[0.09, 16, 16]} /><meshBasicMaterial color={glow} /></mesh>
      <mesh position={[0, -0.15, 0]}><cylinderGeometry args={[0.12, 0.12, 0.45, 16]} /><meshPhysicalMaterial color="#91a5ad" metalness={0.6} /></mesh>
    </group>
    <Text position={[-1.1, -0.02, 2.47]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.17} color="#9fb6bd" anchorX="center" anchorY="middle">DENTAL PRACTICE / SECURE FLOORPLAN</Text>
  </group>
}

function PracticeScene({ step, selected, setSelected }: { step: number; selected: number; setSelected: (index: number) => void }) {
  const group = useRef<THREE.Group>(null)
  const packets = useMemo(() => Array.from({ length: 8 }, (_, index) => ({ offset: index / 8 })), [])
  useFrame((state, delta) => { if (group.current) group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, Math.sin(state.clock.elapsedTime * 0.22) * 0.12, delta * 2) })
  const secure = step > 0
  const connections = networkNodes.slice(0, 4).map((node) => [node.position, networkNodes[2].position] as [number[], number[]])
  return <group ref={group} rotation={[0.12, -0.25, 0]}>
    <DentalOffice secure={secure} />
    {connections.map(([from, to], index) => <Line key={index} points={[from, to]} color={secure ? '#2dd4bf' : '#ff806f'} lineWidth={secure ? 1.4 : 0.8} transparent opacity={0.7} />)}
    {packets.map((packet, index) => <Packet key={index} from={networkNodes[index % 2].position} to={networkNodes[2].position} offset={packet.offset} color={secure ? '#d7fff5' : '#ffb09e'} />)}
    {networkNodes.map((node, index) => <NetworkNode key={node.label} node={node} active={selected === index} onSelect={() => setSelected(index)} />)}
  </group>
}

function Packet({ from, to, offset, color }: { from: number[]; to: number[]; offset: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => { if (ref.current) { const t = (state.clock.elapsedTime * 0.28 + offset) % 1; ref.current.position.lerpVectors(new THREE.Vector3(...from), new THREE.Vector3(...to), t) } })
  return <mesh ref={ref}><sphereGeometry args={[0.055, 10, 10]} /><meshBasicMaterial color={color} /></mesh>
}

function HeroCanvas({ step, selected, setSelected }: { step: number; selected: number; setSelected: (index: number) => void }) { return <div className="hero-canvas"><Canvas shadows dpr={[1, 1.6]} camera={{ position: [8.8, 5.8, 9.8], fov: 35 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.12 }} onPointerMissed={() => setSelected(-1)}><color attach="background" args={['#0b1821']} /><ambientLight intensity={0.6} /><directionalLight position={[5, 8, 4]} intensity={2.4} castShadow /><pointLight position={[-4, 3, -2]} intensity={14} color={step === 0 ? '#ff806f' : '#2dd4bf'} /><Environment preset="city" /><PracticeScene step={step} selected={selected} setSelected={setSelected} /><Sparkles count={38} scale={11} size={1.5} speed={0.2} color={step === 0 ? '#ff806f' : '#2dd4bf'} /><OrbitControls enableZoom={false} enablePan={false} minPolarAngle={0.72} maxPolarAngle={1.5} enableDamping autoRotate autoRotateSpeed={0.35} /><EffectComposer><Bloom intensity={0.65} luminanceThreshold={0.75} /><Vignette eskil={false} offset={0.2} darkness={0.62} /></EffectComposer></Canvas></div> }

export function MarketingHome() {
  const [step, setStep] = useState(0); const [menuOpen, setMenuOpen] = useState(false); const [layer, setLayer] = useState(0); const [selectedNode, setSelectedNode] = useState(2)
  const resolve = Math.min(step, 6)
  return <div className="site-shell">
    <header className="site-nav"><a className="brand" href="#top"><span className="brand-mark">IT</span><span>IT Square</span></a><nav className="desktop-nav"><a href="#stakes">Why it matters</a><a href="#stack">The stack</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></nav><a className="nav-cta" href="#contact">Book assessment <ArrowRight size={15}/></a><button className="mobile-menu" aria-label="Open navigation" onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X/>:<Menu/>}</button></header>
    {menuOpen && <div className="mobile-nav"><a href="#stakes" onClick={()=>setMenuOpen(false)}>Why it matters</a><a href="#stack" onClick={()=>setMenuOpen(false)}>The stack</a><a href="#pricing" onClick={()=>setMenuOpen(false)}>Pricing</a><a href="#faq" onClick={()=>setMenuOpen(false)}>FAQ</a></div>}
    <main id="top">
      <section className="hero-section"><div className="hero-copy"><div className="eyebrow"><span className="live-dot"/> IT Square · Chicago</div><h1>IT for dental practices that <span>passes a HIPAA audit.</span></h1><p className="hero-lede">We split your network, lock every workstation, back up everything hourly, and document all of it. This is a typical install — watch it happen.</p><div className="hero-actions"><a className="button button-primary" href="#contact">Book a free HIPAA assessment <ArrowRight size={16}/></a><button className="button button-ghost" onClick={()=>setStep(0)}>Replay install</button></div><p className="fine-print">90 minutes on site. Written report yours to keep, whether or not you hire us.</p><div className="stats-row"><div><strong>1 hour</strong><span>to be back seeing patients</span></div><div><strong>6</strong><span>average findings we open with</span></div><div><strong>100%</strong><span>of safeguards documented</span></div></div></div><div className="hero-visual"><HeroCanvas step={step} selected={selectedNode} setSelected={setSelectedNode}/><div className="scorecard"><div className="score-head"><div><span>OPEN FINDINGS</span><strong className={resolve===6?'resolved':''}>{6-resolve}</strong></div><span className={resolve===6?'status resolved':'status'}>{resolve===6?'SAFETY IN PLACE':'RISK DETECTED'}</span></div><div className="findings-list">{findings.map((finding,i)=><div className={i<resolve?'finding cleared':'finding'} key={finding}><span className="finding-icon">{i<resolve?<Check size={12}/>:<CircleAlert size={12}/>}</span><span>{finding}</span></div>)}</div></div><div className="step-controls" aria-label="Installation steps">{['Before','Network','Endpoints','Identity','Backup','Monitor','Ready'].map((label,i)=><button key={label} className={i===step?'active':''} aria-label={`Go to ${label} step`} onClick={()=>setStep(i)}><span>{String(i).padStart(2,'0')}</span>{label}</button>)}</div></div></section>
      <section id="stakes" className="stakes-section section"><div className="section-kicker">01 / THE STAKES</div><div className="section-heading"><h2>Most practices discover the gap <span>after</span> it costs them.</h2><p>Compliance is not a binder on a shelf. It is the quiet systems work that keeps a bad morning from becoming a public breach.</p></div><div className="stakes-grid">{[['The fine','HIPAA requires an annual Security Risk Assessment. Most practices have never had one done. Penalties scale with culpability, and “we didn’t know” is the most expensive answer.'],['The ransom','A practice with one untested backup and a flat network is one bad click from losing twelve years of charts and radiographs.'],['The lost day','When the server dies mid-morning, production stops. Ask any dentist what a full day off the schedule costs, then multiply by three.']].map(([title,copy],i)=><motion.article className="stake-card" key={title} initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}}><span className="card-number">0{i+1}</span><h3>{title}</h3><p>{copy}</p></motion.article>)}</div><a className="text-link" href="https://ocrportal.hhs.gov/ocr/breach" target="_blank" rel="noreferrer">Real dental breaches are public record. <ArrowRight size={15}/></a></section>
      <section id="stack" className="stack-section section"><div className="section-kicker">02 / THE STACK</div><div className="section-heading"><h2>Safeguards you can <span>explain</span> to a patient.</h2><p>Technology should disappear into reliable operations. Here is exactly what protects your practice.</p></div><div className="stack-layout"><div className="layer-tabs">{layers.map(([name],i)=><button key={name} className={layer===i?'selected':''} onClick={()=>setLayer(i)}><span>0{i+1}</span>{name}<ChevronRight size={16}/></button>)}</div><AnimatePresence mode="wait"><motion.div className="layer-detail" key={layer} initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-12}}><div className="detail-icon"><ShieldCheck size={26}/></div><h3>{layers[layer][1]}</h3><p>{layers[layer][2]}</p><div className="detail-line"><Check size={15}/> Installed, monitored, and documented by IT Square.</div></motion.div></AnimatePresence></div></section>
      <section className="specialization section"><div className="special-copy"><div className="section-kicker">03 / DENTAL, SPECIFICALLY</div><h2>We know when your imaging stops talking to your chart.</h2><p>We run Open Dental in our own lab, and we know Dentrix, Eaglesoft, imaging bridges, and sensor drivers. We have already broken and fixed that exact thing.</p><a className="text-link" href="#contact">Talk to a dental IT team <ArrowRight size={15}/></a></div><div className="software-grid">{['Open Dental','Dentrix','Eaglesoft','Dexis','Apteryx'].map(name=><div key={name}>{name}</div>)}</div><div className="timeline"><div><strong>WEEK 1</strong><p>Audit and documentation · Agents deployed · Microsoft 365 secured · Passwords vaulted · Backups verified</p></div><div><strong>WEEK 2</strong><p>UniFi installed · Devices encrypted · Everything patched · Staff training launched · Baseline assessment delivered</p></div></div></section>
      <section id="pricing" className="pricing-section section"><div className="section-kicker">04 / SIMPLE PRICING</div><div className="section-heading"><h2>Clear coverage. No surprise tickets.</h2><p>Every plan starts with the same free assessment. We quote hardware and network installation separately.</p></div><div className="pricing-grid">{[['Essential','The reliable baseline','Monitoring, patching, helpdesk, backup, endpoint protection'],['Complete','Most practices choose this','Everything in Essential, plus the full security stack, Microsoft 365 management, training, reviews, and compliance documentation'],['Complete + Compliance','For practices that want the full record','Everything, plus annual assessments, written policies, incident response planning, and vendor BAA management']].map(([name,desc,copy],i)=><article className={`price-card ${i===1?'featured':''}`} key={name}>{i===1&&<span className="popular">MOST PRACTICES CHOOSE THIS</span>}<div className="price-title"><h3>{name}</h3><span>from $X<span>/user/month</span></span></div><p className="price-desc">{desc}</p><div className="price-copy"><Check size={15}/>{copy}</div><a href="#contact" className="price-link">Get a recommendation <ArrowRight size={15}/></a></article>)}</div><p className="pricing-note">Network installation and hardware quoted separately. Minimum engagement applies.</p></section>
      <section id="faq" className="faq-section section"><div className="section-heading"><div className="section-kicker">05 / FAQ</div><h2>The questions we hear first.</h2></div><Accordion type="single" collapsible className="faq-list">{['We already have an IT guy','What does the free assessment actually involve?','How fast can you recover our server?','Do you work with our practice management software?','What happens in the first 30 days?'].map((q,i)=><AccordionItem value={`item-${i}`} key={q}><AccordionTrigger>{q}</AccordionTrigger><AccordionContent>{['That is okay. We can work alongside an internal IT person or replace the reactive parts of the job. The assessment will show you where the gaps are.','We spend 90 minutes on site reviewing network boundaries, endpoints, identity, backup, monitoring, and documentation. You keep the written report either way.','With a verified hourly image backup, we can boot a copy in the cloud and get you seeing patients within the hour.','Yes. We work with Open Dental, Dentrix, Eaglesoft, Dexis, Apteryx, and the bridges and drivers that connect them.','We audit, document, secure Microsoft 365, deploy agents, verify backups, and give you a baseline HIPAA assessment with clear next actions.'][i]}</AccordionContent></AccordionItem>)}</Accordion></section>
      <section id="contact" className="final-cta section"><div><div className="section-kicker">START WITH THE TRUTH</div><h2>Find out what&apos;s actually open in your practice.</h2><p>90 minutes on site. You keep the report.</p></div><a className="button button-primary" href="mailto:hello@itsquare.ai">Book a free HIPAA assessment <ArrowRight size={16}/></a></section>
    </main><footer className="site-footer"><div><a className="brand" href="#top"><span className="brand-mark">IT</span><span>IT Square</span></a><p>Managed IT & HIPAA compliance for dental practices.</p><small>© 2026 IT Square. Chicago, Illinois.</small></div><div className="footer-links"><div><strong>Services</strong><a href="#stack">Managed IT</a><a href="#stack">HIPAA compliance</a><a href="#stack">Backup & recovery</a></div><div><strong>Company</strong><a href="#contact">Contact</a><a href="#stakes">Why IT Square</a><a href="#faq">FAQ</a></div><div><strong>Legal</strong><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:hello@itsquare.ai">hello@itsquare.ai</a></div></div></footer>
  </div>
}

export default MarketingHome
