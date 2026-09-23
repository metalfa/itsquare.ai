'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Edges, Environment, Html, Line, OrbitControls, RoundedBox, Sparkles, Text } from '@react-three/drei'
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
  { label: 'Dual ISP handoff', detail: 'Two independent internet circuits', position: [-3.15, 0.18, -1.65] as [number, number, number], color: '#ffad66' },
  { label: 'Next-gen firewall', detail: 'Inspects every connection at the edge', position: [-2.55, 0.42, 1.25] as [number, number, number], color: '#ff806f' },
  { label: 'Clinical server', detail: 'Open Dental and imaging data', position: [0.15, 0.62, 0.95] as [number, number, number], color: '#2dd4bf' },
  { label: '3-2-1 backup vault', detail: 'Immutable off-site recovery copy', position: [2.7, 0.42, -1.35] as [number, number, number], color: '#7dd3fc' },
  { label: 'Identity + MFA', detail: 'Every sign-in verified and logged', position: [2.7, 0.5, 1.2] as [number, number, number], color: '#c4b5fd' },
]

function NodeObject({ node, active }: { node: typeof networkNodes[number]; active: boolean }) {
  const edge = '#1a1f24'
  const accent = active ? node.color : '#607078'
  const common = { color: '#c9ccce', roughness: 0.6, metalness: 0.08 }
  if (node.label === 'Dual ISP handoff') return <group><mesh><boxGeometry args={[0.9, 0.24, 0.58]} /><meshStandardMaterial {...common} /></mesh><Edges threshold={15} color={edge} /><mesh position={[-0.22, 0.14, 0]}><boxGeometry args={[0.28, 0.05, 0.25]} /><meshStandardMaterial color={accent} /></mesh><mesh position={[0.22, 0.14, 0]}><boxGeometry args={[0.28, 0.05, 0.25]} /><meshStandardMaterial color={accent} /></mesh></group>
  if (node.label === 'Next-gen firewall') return <group><mesh><boxGeometry args={[0.82, 0.42, 0.5]} /><meshStandardMaterial color="#3b464b" roughness={0.45} /></mesh><Edges threshold={15} color={edge} /><mesh position={[0, 0.06, 0.255]}><boxGeometry args={[0.48, 0.08, 0.03]} /><meshStandardMaterial color={accent} /></mesh></group>
  if (node.label === 'Clinical server') return <group><mesh><boxGeometry args={[0.72, 1.05, 0.52]} /><meshStandardMaterial color="#566269" roughness={0.55} /></mesh><Edges threshold={15} color={edge} />{[0.3,0.08,-0.14,-0.36].map((y)=><mesh key={y} position={[0,y,0.27]}><boxGeometry args={[0.48,0.05,0.02]} /><meshStandardMaterial color={accent} /></mesh>)}</group>
  if (node.label === '3-2-1 backup vault') return <group><mesh><boxGeometry args={[0.72, 0.62, 0.58]} /><meshStandardMaterial color="#a3aaad" roughness={0.7} /></mesh><Edges threshold={15} color={edge} />{[-0.18,0,0.18].map((y)=><mesh key={y} position={[0,y,0.3]}><boxGeometry args={[0.42,0.035,0.02]} /><meshStandardMaterial color={accent} /></mesh>)}</group>
  return <group><mesh><boxGeometry args={[0.62, 0.72, 0.42]} /><meshStandardMaterial color="#c9ccce" roughness={0.65} /></mesh><Edges threshold={15} color={edge} /><mesh position={[0,0.08,0.22]}><boxGeometry args={[0.28,0.28,0.025]} /><meshStandardMaterial color={accent} /></mesh></group>
}

function NetworkNode({ node, active, onSelect }: { node: typeof networkNodes[number]; active: boolean; onSelect: () => void }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => { if (ref.current) ref.current.scale.setScalar(1 + (active ? Math.sin(state.clock.elapsedTime * 3) * 0.035 : 0)) })
  return <group ref={ref} position={node.position} onClick={(event) => { event.stopPropagation(); onSelect() }}>
    <NodeObject node={node} active={active} />
    {active && <Html distanceFactor={8} position={[0, 0.88, 0]} center><div className="node-label"><strong>{node.label}</strong><span>{node.detail}</span></div></Html>}
  </group>
}

function DentalOffice({ secure }: { secure: boolean }) {
  const wall = '#f2f1ee'
  const line = '#1a1f24'
  return <group>
    <mesh position={[0,-0.28,0]} receiveShadow><boxGeometry args={[8.8,0.36,6.2]} /><meshStandardMaterial color="#cfccc6" roughness={0.95} /></mesh><Edges threshold={15} color={line} />
    <mesh position={[0,-0.06,0]} receiveShadow><boxGeometry args={[8.1,0.08,5.5]} /><meshStandardMaterial color="#e4e2dd" roughness={0.85} /></mesh><Edges threshold={15} color={line} />
    <mesh position={[-3.65,0.68,0]}><boxGeometry args={[0.14,1.5,5.5]} /><meshStandardMaterial color={wall} roughness={0.92} /></mesh><Edges threshold={15} color={line} />
    <mesh position={[3.65,0.68,0]}><boxGeometry args={[0.14,1.5,5.5]} /><meshStandardMaterial color={wall} roughness={0.92} /></mesh><Edges threshold={15} color={line} />
    <mesh position={[0,0.68,-2.68]}><boxGeometry args={[7.4,1.5,0.14]} /><meshStandardMaterial color={wall} roughness={0.92} /></mesh><Edges threshold={15} color={line} />
    <group position={[-1.25,0.3,0.3]}><mesh><boxGeometry args={[2.2,0.22,1.12]} /><meshStandardMaterial color="#dcd8d0" roughness={0.8} /></mesh><Edges threshold={15} color={line} /><mesh position={[-0.55,0.22,0]} rotation={[0,0,-0.16]}><boxGeometry args={[1.3,0.18,0.7]} /><meshStandardMaterial color="#c9ccce" roughness={0.7} /></mesh><Edges threshold={15} color={line} /></group>
    <group position={[1.55,0.34,0.35]}><mesh><boxGeometry args={[1.35,0.68,0.78]} /><meshStandardMaterial color="#dcd8d0" roughness={0.8} /></mesh><Edges threshold={15} color={line} /><mesh position={[0,0.45,0]}><boxGeometry args={[1.05,0.05,0.62]} /><meshStandardMaterial color="#afc7d1" roughness={0.05} transparent opacity={0.85} /></mesh><Edges threshold={15} color={line} /></group>
    <group position={[2.55,0.38,-1.2]}><mesh><boxGeometry args={[0.7,0.9,0.48]} /><meshStandardMaterial color="#c9ccce" roughness={0.6} /></mesh><Edges threshold={15} color={line} /><mesh position={[0,0.53,0]}><boxGeometry args={[0.5,0.05,0.32]} /><meshStandardMaterial color="#7b9aa4" /></mesh></group>
    <Text position={[-2.55,0.01,-1.55]} rotation={[-Math.PI/2,0,0]} fontSize={0.13} color="#47737b" anchorX="center">PATIENT WI-FI / VLAN 30</Text><Text position={[1.55,0.01,-1.55]} rotation={[-Math.PI/2,0,0]} fontSize={0.13} color="#2b8f86" anchorX="center">CLINICAL VLAN 10</Text>
    <Text position={[0,0.03,2.78]} rotation={[-Math.PI/2,0,0]} fontSize={0.16} color="#1a1f24" anchorX="center">DENTAL PRACTICE / CUTAWAY PLAN</Text>
    <Html position={[-2.7,1.65,1.2]} center><div className="arch-label"><b>NGFW / VLAN GATEWAY</b><span>segmented perimeter</span></div></Html><Html position={[1.6,1.65,0.4]} center><div className="arch-label"><b>CLINICAL WORKSTATION</b><span>encrypted endpoint + MFA</span></div></Html><Html position={[2.3,1.35,-1.2]} center><div className="arch-label"><b>3–2–1 BACKUP</b><span>hourly immutable copy</span></div></Html>
    {secure && <Html position={[0,1.7,0]} center><div className="arch-label arch-label-accent"><b>HIPAA CONTROL PLANE</b><span>evidence · monitoring · recovery</span></div></Html>}
  </group>
}

function PracticeScene({ step, selected, setSelected }: { step: number; selected: number; setSelected: (index: number) => void }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state, delta) => { if (group.current) group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, Math.sin(state.clock.elapsedTime * 0.16) * 0.06, delta * 2) })
  const secure = step > 0
  const points = networkNodes.map((node) => node.position)
  return <group ref={group} rotation={[0.08,-0.35,0]}><DentalOffice secure={secure} />{points.map((point,index)=><Line key={index} points={[point,[point[0],point[1]+0.12,point[2]]]} color={secure ? '#2b8f86' : '#a35c55'} lineWidth={0.9} transparent opacity={0.65} />)}{networkNodes.map((node,index)=><NetworkNode key={node.label} node={node} active={selected===index} onSelect={()=>setSelected(index)} />)}</group>
}

function Packet({ from, to, offset, color }: { from: number[]; to: number[]; offset: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => { if (ref.current) { const t = (state.clock.elapsedTime * 0.28 + offset) % 1; ref.current.position.lerpVectors(new THREE.Vector3(...from), new THREE.Vector3(...to), t) } })
  return <mesh ref={ref} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.11, 0.11, 0.11]} /><meshBasicMaterial color={color} /></mesh>
}

function HeroCanvas({ step, selected, setSelected }: { step: number; selected: number; setSelected: (index: number) => void }) { return <div className="hero-canvas"><Canvas orthographic shadows dpr={[1, 2]} camera={{ position: [14, 11, 14], zoom: 54, near: 0.1, far: 100 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1 }} onPointerMissed={() => setSelected(-1)}><color attach="background" args={['#0d1318']} /><hemisphereLight args={['#eaf2f7','#7f878c',1.1]} /><directionalLight position={[12,18,8]} intensity={2.6} castShadow shadow-mapSize={[2048,2048]} shadow-bias={-0.0004} shadow-normalBias={0.02}><orthographicCamera attach="shadow-camera" args={[-14,14,14,-14,0.1,60]} /></directionalLight><Environment preset="city" environmentIntensity={0.25} /><PracticeScene step={step} selected={selected} setSelected={setSelected} /><OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI/5} maxPolarAngle={Math.PI/2.35} enableDamping dampingFactor={0.06} autoRotate autoRotateSpeed={0.22} /></Canvas></div> }

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
