import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { RotatingPlanet } from './components/Planet';
import { AsteroidField } from './components/Asteroids';
import { Explosion } from './components/Explosion';
import { Satellites, ACTION_DATA } from './components/Satellites';
import { EffectComposer, Bloom } from '@react-three/postprocessing';


import { ShieldAlert, Mail, Linkedin } from 'lucide-react';
import * as THREE from 'three';

const CameraController = ({ phase, focus }) => {
  const { camera, size } = useThree();
  const currentOffsetX = useRef(0);
  const currentOffsetY = useRef(0);

  // Transition state: 0 = User Control, >0 = Auto Animation
  const transitionRef = useRef(1.0);

  // Reset transition on state change
  useEffect(() => {
    transitionRef.current = 1.0;
  }, [phase, focus]);

  useFrame((state, delta) => {
    // 1. Smooth Visual Shift (Intro & Explore Focused) - ALWAYS RUN
    let targetX = 0;
    let targetY = 0;
    const isMobile = size.width < 768;

    if (phase === 'intro' || (phase === 'explore' && focus)) {
      if (isMobile) {
        targetY = size.height * 0.25;
      } else {
        targetX = size.width * 0.25;
      }
    }

    currentOffsetX.current = THREE.MathUtils.lerp(currentOffsetX.current, targetX, delta * 2.5);
    currentOffsetY.current = THREE.MathUtils.lerp(currentOffsetY.current, targetY, delta * 2.5);

    if (Math.abs(currentOffsetX.current) > 0.1 || Math.abs(currentOffsetY.current) > 0.1 || phase === 'intro' || (phase === 'explore' && focus)) {
      camera.setViewOffset(size.width, size.height, currentOffsetX.current, currentOffsetY.current, size.width, size.height);
    } else {
      camera.clearViewOffset();
    }

    // 2. Camera Position/Zoom Logic - ONLY RUN IF TRANSITIONING OR LOCKED PHASE
    // 'threat_alert' and 'defense' are LOCKED phases (no user zoom)
    const isLockedPhase = phase === 'threat_alert' || phase === 'defense';

    if (isLockedPhase) {
      // Enforce position constantly
      const targetZ = 14;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, delta * 2);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, delta * 2);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 2);
      camera.lookAt(0, 0, 0);
    }
    else if (transitionRef.current > 0.01) {
      // Smoothly transition to target, then stop to let OrbitControls work
      transitionRef.current = THREE.MathUtils.lerp(transitionRef.current, 0, delta * 2); // Decay

      if (phase === 'explore' && focus) {
        const targetZ = isMobile ? 32 : 20;
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 4);
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, delta * 4);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, delta * 4);
        camera.lookAt(0, 0, 0);
      }
      else if (phase === 'explore' && !focus) {
        const targetZ = isMobile ? 35 : 20;
        const currentDist = camera.position.length();
        const newDist = THREE.MathUtils.lerp(currentDist, targetZ, delta * 4);
        camera.position.setLength(newDist);
      }
    }
  });

  return null;
};


const Typewriter = ({ text, speed = 100, onComplete }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayText(text.slice(0, i + 1));
      i++;
      if (i > text.length) {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span style={{ borderRight: '2px solid #44ffaa', paddingRight: '5px', animation: 'blink 1s step-end infinite' }}>
      {displayText}
    </span>
  );
};

function App() {
  // Phases: 'beauty', 'threat_alert', 'defense', 'victory', 'intro'
  const [phase, setPhase] = useState('beauty');
  const [hits, setHits] = useState(0);
  const [explosions, setExplosions] = useState([]);
  const asteroidFieldRef = useRef();
  const earthRef = useRef();

  // Intro Flow State
  const [introStep, setIntroStep] = useState('thanks'); // 'thanks' | 'bio'
  const [showContinue, setShowContinue] = useState(false);
  const [exploreFocus, setExploreFocus] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const [contactOpen, setContactOpen] = useState(false);


  const handleSkip = () => {
    setPhase('intro');
    setIntroStep('bio');
  };

  // Phase Managers
  const handleYesClick = () => {
    setPhase('transition_out');
    setTimeout(() => {
      setPhase('threat_alert');
    }, 6000); // 6s silence before alert
  };

  useEffect(() => {
    if (phase === 'threat_alert') {
      const timer = setTimeout(() => {
        setPhase('defense');
      }, 4000); // Show alert for 4s then start game
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Game Logic: Spacebar & Touch
  useEffect(() => {
    if (phase !== 'defense') return;

    const fireWeapon = () => {
      if (asteroidFieldRef.current) {
        const pos = asteroidFieldRef.current.destroyAsteroid();
        if (pos) {
          const newExplosion = { id: Date.now(), pos: [pos.x, pos.y, pos.z] };
          setExplosions(prevExp => [...prevExp, newExplosion]);

          setTimeout(() => {
            setExplosions(prevExp => prevExp.filter(ex => ex.id !== newExplosion.id));
          }, 2500);

          setHits(prev => {
            const newHits = prev + 1;
            if (newHits >= 15) {
              setPhase('victory');
              setExplosions([]); // Clear all
            }
            return newHits;
          });
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        fireWeapon();
      }
    };

    const handleTouch = () => {
      fireWeapon();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouch);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouch);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === 'victory') {
      const timer = setTimeout(() => {
        setPhase('intro');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [phase]);


  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>

      {/* --- UI OVERLAYS --- */}



      {/* 1. Beauty Phase */}
      {phase === 'beauty' && (
        <>
          <div className="space-text">Isn't it Beautiful?</div>
          <button className="yes-button" onClick={handleYesClick}>YES</button>
        </>
      )}

      {/* 2. Threat Alert */}
      {phase === 'threat_alert' && (
        <div className="alert-box">
          <div className="alert-title">
            <ShieldAlert size={24} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
            WARNING
          </div>
          <div>ASTEROID DETECTED</div>
        </div>
      )}

      {/* 3. Defense Mode */}
      {phase === 'defense' && (
        <div className="defense-hud">
          <div className="press-space">PRESS SPACE OR TAP</div>
          <div style={{ fontSize: '1rem', marginTop: '10px' }}>DEFEND THE PLANET ({hits}/15)</div>
        </div>
      )}

      {/* 4. Victory */}
      {phase === 'victory' && (
        <div className="victory-msg">
          Thank you for saving my Home.
        </div>
      )}

      {/* 5. Intro (Final) */}
      {phase === 'intro' && (
        <div className="intro-container">
          {introStep === 'thanks' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.5rem', color: '#44ffaa', fontFamily: "'Orbitron', sans-serif", minHeight: '60px' }}>
                <Typewriter
                  text="Thank you for saving my home"
                  speed={150}
                  onComplete={() => setShowContinue(true)}
                />
              </div>
              {showContinue && (
                <button
                  className="yes-button"
                  style={{
                    position: 'static',
                    marginTop: '20px',
                    opacity: 0,
                    animation: 'fadeInBtn 1s ease-out forwards'
                  }}
                  onClick={() => setIntroStep('bio')}
                >
                  CONTINUE
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="intro-name">
                <Typewriter text="Subhradip Nandi" speed={100} />
              </div>

              <div className="intro-role">Computer Science Undergraduate</div>

              <div className="intro-desc" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '15px', marginTop: '0' }}>
                  I am currently pursuing a <strong>B.Tech in Computer Science and Engineering</strong> at the
                  North Eastern Regional Institute of Science and Technology (NERIST), Itanagar, AP.
                </p>
                <p style={{ marginBottom: '15px' }}>
                  I am a passionate learner, always curious about new technologies. My interests lie in
                  <strong> Software Development, Machine Learning, Artificial Intelligence</strong>, and <strong>Generative AI</strong>.
                  I possess a strong foundation in Computer Science core concepts including DSA, Algorithms, DBMS, and OS.
                </p>
                <p style={{ marginBottom: '15px' }}>
                  I have developed various projects in <strong>Web & Android Development</strong>, as well as ML/DL,
                  driven by self-directed learning. I have also gained practical experience through internships at reputed institutions.
                </p>
                <p style={{ color: '#44ffaa', fontWeight: 'bold', marginTop: '20px' }}>
                  This is my portfolio. Thank you for visiting my profile.
                </p>
              </div>


              <div style={{ marginTop: '30px' }}>
                <a href="/NewResumeSubh.pdf" target="_blank" rel="noopener noreferrer" style={{ color: '#44aaff', textDecoration: 'none', borderBottom: '1px dotted #44aaff' }}>View Full Resume</a>
              </div>

              <button className="explore-button" onClick={() => setPhase('explore')}>
                Explore
              </button>
            </>
          )}
        </div>
      )}

      {/* Explore Info Panel */}
      {phase === 'explore' && exploreFocus && ACTION_DATA[exploreFocus] && (
        <div className="intro-container" style={{
          opacity: 0,
          animation: 'fadeInIntro 0.5s ease-out forwards',
          pointerEvents: 'auto',
          maxHeight: '80vh',
          overflowY: 'auto',
          zIndex: 1500
        }}>
          <div className="intro-name" style={{ fontSize: '2.5rem' }}>{exploreFocus}</div>
          <hr style={{ borderColor: ACTION_DATA[exploreFocus].color, opacity: 0.5, marginBottom: '20px' }} />
          <div className="intro-desc" style={{ fontSize: '1.1rem', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>
            {ACTION_DATA[exploreFocus].description}
          </div>

          {exploreFocus === 'Projects' && (
            <div style={{ marginBottom: '20px' }}>
              <a
                href="https://github.com/codingplugin"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  color: '#44ffaa',
                  border: '1px solid #44ffaa',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  background: 'rgba(0,0,0,0.5)',
                  textDecoration: 'none',
                  fontFamily: 'Orbitron',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s'
                }}
                onMouseOver={e => {
                  e.target.style.background = 'rgba(68, 255, 170, 0.2)';
                  e.target.style.boxShadow = '0 0 10px #44ffaa';
                }}
                onMouseOut={e => {
                  e.target.style.background = 'rgba(0,0,0,0.5)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                View Full GitHub
              </a>
            </div>
          )}

          {exploreFocus === 'Skills' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {ACTION_DATA[exploreFocus].items?.map((item, idx) => (
                <div key={idx} style={{
                  padding: '5px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${item.color}`,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  minHeight: '45px',
                  boxShadow: `0 0 5px ${item.color}40`,
                  transition: 'transform 0.2s',
                  cursor: 'default'
                }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ fontSize: '0.75rem', color: item.color, fontFamily: 'Orbitron', letterSpacing: '1px', textShadow: `0 0 5px ${item.color}, 0 0 10px ${item.color}, 0 0 20px ${item.color}` }}>{item.name}</div>
                </div>
              ))}
            </div>
          ) : exploreFocus === 'Projects' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              {ACTION_DATA[exploreFocus].items?.map((item, idx) => (
                <div key={idx} style={{
                  padding: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${item.color}`,
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  boxShadow: `0 0 10px ${item.color}20`,
                  transition: 'transform 0.2s',
                  minHeight: '90px'
                }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ fontSize: '0.8rem', color: item.color, fontFamily: 'Orbitron', marginBottom: '8px', fontWeight: 'bold', textShadow: `0 0 5px ${item.color}` }}>{item.name}</div>
                  {item.externalLink && (
                    <a
                      href={item.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        background: 'transparent',
                        border: `1px solid ${item.color}`,
                        color: item.color,
                        padding: '4px 12px',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontFamily: 'Orbitron',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = item.color;
                        e.target.style.color = '#000';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = item.color;
                      }}
                    >
                      OPEN
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {ACTION_DATA[exploreFocus].items?.map((item, idx) => (
                <div key={idx}>
                  <div style={{ fontSize: '1.2rem', color: item.color, marginBottom: '5px' }}>{item.name}</div>
                  {item.detail && <div style={{ fontSize: '1rem', whiteSpace: 'pre-wrap', marginBottom: '8px', lineHeight: '1.4' }}>{item.detail}</div>}
                  {item.externalLink && (
                    <a
                      href={item.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        background: 'transparent',
                        border: `1px solid ${item.color}`,
                        color: item.color,
                        padding: '6px 12px',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontFamily: 'Orbitron',
                        fontSize: '0.8rem',
                        marginTop: '5px',
                        marginRight: '10px',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => e.target.style.background = `${item.color}20`}
                      onMouseOut={(e) => e.target.style.background = 'transparent'}
                    >
                      Open Project
                    </a>
                  )}
                  {item.link && (
                    <button
                      onClick={() => setViewImage(item.link)}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${item.color}`,
                        color: item.color,
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontFamily: 'Orbitron',
                        fontSize: '0.8rem',
                        marginTop: '5px'
                      }}
                      onMouseOver={(e) => e.target.style.background = `${item.color}20`}
                      onMouseOut={(e) => e.target.style.background = 'transparent'}
                    >
                      {item.linkLabel || 'View Image'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Modal */}
      {viewImage && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.9)',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backdropFilter: 'blur(5px)'
        }} onClick={() => setViewImage(null)}>
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <img src={viewImage} alt="Document" style={{ maxHeight: '90vh', maxWidth: '90vw', border: '2px solid #44ffaa', boxShadow: '0 0 30px rgba(68, 255, 170, 0.3)' }} />
            <button
              onClick={() => setViewImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '2rem',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}


      {/* --- 3D SCENE --- */}
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <CameraController phase={phase} focus={exploreFocus} />
        <color attach="background" args={['#050510']} />

        <Suspense fallback={null}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 3, 5]} intensity={4.0} color="#ffffff" />
          <pointLight position={[-10, -5, -10]} intensity={2.0} color="#44aaff" />

          <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Sparkles count={200} scale={10} size={2} speed={0.4} opacity={0.5} color="#4ECDC4" />

          <RotatingPlanet ref={earthRef} />

          <AsteroidField
            ref={asteroidFieldRef}
            active={phase === 'defense'}
          />

          <Satellites active={phase === 'explore'} focus={exploreFocus} setFocus={setExploreFocus} earthRef={earthRef} />

          {explosions.map(ex => (
            <Explosion key={ex.id} position={ex.pos} />
          ))}

          <OrbitControls
            enablePan={false}
            enableZoom={phase === 'beauty' || phase === 'intro' || phase === 'victory' || phase === 'explore'}
            minDistance={3.5}
            maxDistance={25}
            autoRotate={phase === 'beauty' || phase === 'victory' || phase === 'intro'}
            autoRotateSpeed={0.5}
            enableDamping={true}
            dampingFactor={0.05}
            enabled={phase !== 'threat_alert' && phase !== 'defense'}
            target={[0, 0, 0]}
          />

          <EffectComposer>
            <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} intensity={1.5} />
          </EffectComposer>
        </Suspense>
      </Canvas>
      {/* Skip / Back Button */}
      {((phase === 'intro' && introStep !== 'bio') || phase === 'explore' || phase === 'beauty') && (
        <button className="skip-button" onClick={() => {
          if (phase === 'explore') {
            if (exploreFocus) setExploreFocus(null);
            else {
              setPhase('intro');
              setIntroStep('bio');
            }
          } else {
            handleSkip();
          }
        }}>
          {phase === 'explore' ? (exploreFocus ? 'Close' : 'Back') : 'Skip'}
        </button>
      )}

      {/* Contact Me Section - Always Visible */}
      <div className="contact-wrapper">
        <div className={`contact-panel ${contactOpen ? 'open' : ''}`}>
          <div className="contact-item">
            <Mail size={16} color="#44ffaa" />
            <a href="mailto:nandisubhradip01@gmail.com">nandisubhradip01@gmail.com</a>
          </div>
          <div className="contact-item">
            <Linkedin size={16} color="#44ffaa" />
            <a href="https://linkedin.com/in/subhradip-nandi-038b3a2b7" target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </div>
        </div>
        <button
          className={`contact-btn ${contactOpen ? 'active' : ''}`}
          onClick={() => setContactOpen(!contactOpen)}
        >
          CONTACT ME
        </button>
      </div>

    </div>
  );
}

export default App;
