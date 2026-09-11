document.addEventListener('DOMContentLoaded', () => {

    // 0. Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sound Effects Manager (synthesized via Web Audio API)
    let audioCtx = null;
    let soundEnabled = localStorage.getItem('sound-enabled') === 'true'; // default to false (muted)
    
    const soundToggleBtn = document.getElementById('sound-toggle');
    
    // Update button UI state initially
    if (soundToggleBtn) {
        if (soundEnabled) {
            soundToggleBtn.classList.remove('muted');
        } else {
            soundToggleBtn.classList.add('muted');
        }
    }

    const initAudioContext = () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    };

    const playClickSound = () => {
        if (!soundEnabled) return;
        try {
            initAudioContext();
            const now = audioCtx.currentTime;

            // Dual tone digital beep
            // Tone 1: Pitch slide up
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(450, now);
            osc1.frequency.exponentialRampToValueAtTime(1050, now + 0.08);

            gain1.gain.setValueAtTime(0.12, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);

            osc1.start(now);
            osc1.stop(now + 0.08);

            // Tone 2: Extra cyber snap/click transient
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1200, now);
            osc2.frequency.setValueAtTime(800, now + 0.01);

            gain2.gain.setValueAtTime(0.08, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);

            osc2.start(now);
            osc2.stop(now + 0.015);
        } catch (e) {
            console.warn('Audio click playback failed:', e);
        }
    };

    const playTypeSound = () => {
        if (!soundEnabled) return;
        try {
            initAudioContext();
            const now = audioCtx.currentTime;
            
            // Simulates a tiny mechanical keyclick using bandpass filtered white noise
            const bufferSize = audioCtx.sampleRate * 0.012; // 12ms duration
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noiseNode = audioCtx.createBufferSource();
            noiseNode.buffer = buffer;

            // Bandpass filter to isolate mechanical mid-high frequencies (around 1600Hz)
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1600 + Math.random() * 400 - 200; // adding slight jitter for realism
            filter.Q.value = 5.0;

            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

            noiseNode.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);

            noiseNode.start(now);
            noiseNode.stop(now + 0.012);
        } catch (e) {
            console.warn('Audio typing playback failed:', e);
        }
    };

    const playSuccessSound = () => {
        if (!soundEnabled) return;
        try {
            initAudioContext();
            const now = audioCtx.currentTime;
            
            // Play a rising electronic arpeggio (chime)
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Major chord)
            notes.forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                const noteTime = now + (idx * 0.09);
                gain.gain.setValueAtTime(0, now);
                gain.gain.setValueAtTime(0, noteTime);
                gain.gain.linearRampToValueAtTime(0.08, noteTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.start(noteTime);
                osc.stop(noteTime + 0.35);
            });
        } catch (e) {
            console.warn('Audio success playback failed:', e);
        }
    };

    // Toggle button handler
    if (soundToggleBtn) {
        soundToggleBtn.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            localStorage.setItem('sound-enabled', soundEnabled);
            
            if (soundEnabled) {
                soundToggleBtn.classList.remove('muted');
                initAudioContext();
                playClickSound();
            } else {
                soundToggleBtn.classList.add('muted');
            }
        });
    }

    // Global Click Listener for elements acting like buttons
    document.addEventListener('click', (e) => {
        const interactive = e.target.closest('a, button, .project-card, .achievement-card, .social-link, #greeting-trigger');
        if (interactive) {
            if (interactive.id === 'sound-toggle') return; // Click sound handled in its own click listener
            playClickSound();
        }
    });

    // Form inputs typing sound
    const contactFormInputs = document.querySelectorAll('#contact-form input, #contact-form textarea');
    contactFormInputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                playTypeSound();
            }
        });
    });

    // 1. Mobile Menu Toggle
    const hamburger = document.getElementById('hamburger-toggle');
    const navLinks = document.getElementById('nav-links');
    const links = document.querySelectorAll('.nav-link');

    hamburger.addEventListener('click', () => {
        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', !isExpanded);
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when clicking a link & custom smooth scroll with header offset
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    hamburger.setAttribute('aria-expanded', 'false');
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');

                    lenis.scrollTo(targetElement, {
                        offset: -90,
                        duration: 1.2
                    });
                }
            }
        });
    });

    // 2. Navbar Background Transition on Scroll
    const navbar = document.getElementById('navbar');
    
    const handleNavbarScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleNavbarScroll);
    // Initial check in case user refreshes partway down
    handleNavbarScroll();

    // 3. Dynamic Terminal Typing Effect
    const typingTarget = document.getElementById('typing-target');
    const fullText = "C:\\Users\\Vishal> run IOT_Engineer.exe";
    const promptText = "C:\\Users\\Vishal> ";
    let charIndex = 0;
    let isDeleting = false;

    const typeEffect = () => {
        if (!isDeleting) {
            // Typing mode
            typingTarget.textContent = fullText.substring(0, charIndex + 1);
            charIndex++;

            if (charIndex === fullText.length) {
                // Fully typed, pause for 3.5s before deleting command
                isDeleting = true;
                setTimeout(typeEffect, 3500);
            } else {
                // Type prompt fast (30ms), command at normal speed (100ms) with minor variance
                let speed = charIndex < promptText.length ? 30 : 100;
                if (charIndex >= promptText.length) {
                    speed += Math.random() * 60 - 30; // realistic typing jitter
                }
                setTimeout(typeEffect, speed);
            }
        } else {
            // Deleting mode (delete back to command prompt)
            typingTarget.textContent = fullText.substring(0, charIndex - 1);
            charIndex--;

            if (charIndex === promptText.length) {
                // Back to prompt, pause for 1.2s before typing command again
                isDeleting = false;
                setTimeout(typeEffect, 1200);
            } else {
                setTimeout(typeEffect, 40); // Deleting is fast and steady
            }
        }
    };

    // Start typing effect
    if (typingTarget) {
        setTimeout(typeEffect, 800);
    }

    // 4. Reveal-on-Scroll Intersection Observer
    const revealElements = document.querySelectorAll('.hidden');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                // Stop observing once revealed
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // 5. Back-to-Top Button
    const backToTopBtn = document.getElementById('back-to-top');

    const handleBackToTopScroll = () => {
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    };

    window.addEventListener('scroll', handleBackToTopScroll);
    
    backToTopBtn.addEventListener('click', () => {
        lenis.scrollTo(0, {
            duration: 1.2
        });
    });

    // 6. Interactive Contact Form Submission Simulation
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const terminalLog = document.getElementById('contact-terminal-log');
    const logLine1 = document.getElementById('log-line-1');
    const logLine2 = document.getElementById('log-line-2');
    const logLine3 = document.getElementById('log-line-3');

    if (contactForm && submitBtn && terminalLog) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Temporary disable button and change visual state
            submitBtn.disabled = true;
            submitBtn.textContent = 'TRANSMITTING...';

            // Reset and show terminal log
            terminalLog.style.display = 'block';
            logLine1.textContent = '';
            logLine2.textContent = '';
            logLine3.textContent = '';

            // Get form values
            const nameVal = document.getElementById('name').value;
            const emailVal = document.getElementById('email').value;
            const messageVal = document.getElementById('message').value;

            // Line 1 typing effect
            setTimeout(() => {
                logLine1.textContent = 'Connecting to secure transmission gateway... OK';
            }, 400);

            // Line 2 typing effect
            setTimeout(() => {
                logLine2.textContent = 'Encrypting cargo message payload (RSA-4096)... DONE';
            }, 1100);

            // Send actual email via formsubmit.co AJAX endpoint
            fetch("https://formsubmit.co/ajax/cocavenger3000@gmail.com", {
                method: "POST",
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: nameVal,
                    email: emailVal,
                    message: messageVal
                })
            })
            .then(response => response.json())
            .then(data => {
                logLine3.textContent = 'Transmission complete. Status code: 202 (ACCEPTED)';
                submitBtn.textContent = 'SECURELY SENT!';
                playSuccessSound();
            })
            .catch(error => {
                logLine3.textContent = 'Transmission failed. Routing error: 503 (UNAVAILABLE)';
                submitBtn.textContent = 'FAILED!';
                console.error('Email transmission failed:', error);
            });

            // Clear input fields and restore after delay
            setTimeout(() => {
                contactForm.reset();
                
                // Gradually fade out log
                gsap.to(terminalLog, {
                    opacity: 0,
                    duration: 0.8,
                    onComplete: () => {
                        terminalLog.style.display = 'none';
                        terminalLog.style.opacity = 1;
                        
                        // Reset button
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Send Message';
                    }
                });
            }, 5500);
        });
    }

    // 7. Neon Scroll Progress Bar
    const scrollProgress = document.getElementById('scroll-progress');
    if (scrollProgress) {
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollPercentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            scrollProgress.style.width = `${scrollPercentage}%`;
        });
    }

    // 7b. VS Code-Style Minimap Scrollbar (Cached/Optimized)
    const minimapTrack = document.getElementById('minimap-track');
    const minimapThumb = document.getElementById('minimap-thumb');
    const markers = document.querySelectorAll('.minimap-marker');
    
    const minimapSections = {
        hero: document.getElementById('hero'),
        education: document.getElementById('education'),
        projects: document.getElementById('projects'),
        contact: document.getElementById('contact')
    };

    let trackHeight = 0;
    let thumbHeight = 0;
    let scrollHeight = 0;
    let sectionPositions = {};

    const cacheDimensions = () => {
        if (!minimapTrack || !minimapThumb) return;
        trackHeight = minimapTrack.clientHeight;
        thumbHeight = minimapThumb.clientHeight;
        scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

        for (const [id, el] of Object.entries(minimapSections)) {
            if (el) {
                // Get absolute Y position of section top relative to document
                sectionPositions[id] = el.getBoundingClientRect().top + window.scrollY;
            }
        }
    };

    const updateMarkerPositions = () => {
        if (!minimapTrack || !minimapThumb || scrollHeight <= 0) return;

        markers.forEach(marker => {
            const sectionId = marker.getAttribute('data-section');
            const sectionTop = sectionPositions[sectionId];
            if (sectionTop !== undefined) {
                const ratio = Math.max(0, Math.min(1, sectionTop / scrollHeight));
                // Center the marker where the thumb center would be at this ratio
                const markerCenterY = ratio * (trackHeight - thumbHeight) + (thumbHeight / 2);
                marker.style.top = `${markerCenterY}px`;
                // Store cached coordinate to avoid DOM reads on scroll
                marker.dataset.centerY = markerCenterY;
            }
        });
    };

    const updateThumbPosition = () => {
        if (!minimapTrack || !minimapThumb || scrollHeight <= 0) return;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollPercent = Math.max(0, Math.min(1, scrollTop / scrollHeight));

        // Position of the thumb (translateY value)
        const thumbTop = scrollPercent * (trackHeight - thumbHeight);
        minimapThumb.style.transform = `translate(-50%, ${thumbTop}px)`;

        // Overlap detection
        const thumbBottom = thumbTop + thumbHeight;

        markers.forEach(marker => {
            const markerCenterYStr = marker.dataset.centerY;
            if (markerCenterYStr) {
                const markerCenter = parseFloat(markerCenterYStr);
                const markerHeight = 6;
                const markerTop = markerCenter - (markerHeight / 2);
                const markerBottom = markerCenter + (markerHeight / 2);

                // Check overlap
                const overlaps = thumbTop <= markerBottom && thumbBottom >= markerTop;

                if (overlaps) {
                    marker.classList.add('active-pulse');
                } else {
                    marker.classList.remove('active-pulse');
                }
            }
        });
    };

    let isScrollingMinimap = false;
    const onScrollMinimap = () => {
        if (!isScrollingMinimap) {
            window.requestAnimationFrame(() => {
                updateThumbPosition();
                isScrollingMinimap = false;
            });
            isScrollingMinimap = true;
        }
    };

    window.addEventListener('scroll', onScrollMinimap);

    // Run cache once and position
    cacheDimensions();
    updateMarkerPositions();
    updateThumbPosition();

    // Recalculate on load/resize/layout shifts
    window.addEventListener('load', () => {
        cacheDimensions();
        updateMarkerPositions();
        updateThumbPosition();
    });
    window.addEventListener('resize', () => {
        cacheDimensions();
        updateMarkerPositions();
        updateThumbPosition();
    });
    
    // Periodically run for a short duration after DOM ready to catch lazy images/fonts
    setTimeout(() => {
        cacheDimensions();
        updateMarkerPositions();
        updateThumbPosition();
    }, 500);
    setTimeout(() => {
        cacheDimensions();
        updateMarkerPositions();
        updateThumbPosition();
    }, 1500);

    // Click on track interaction
    if (minimapTrack) {
        minimapTrack.addEventListener('click', (e) => {
            if (e.target === minimapThumb) return;

            const rect = minimapTrack.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const trackHeight = rect.height;
            const thumbHeight = minimapThumb.clientHeight;

            let ratio = (clickY - thumbHeight / 2) / (trackHeight - thumbHeight);
            ratio = Math.max(0, Math.min(1, ratio));

            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const targetScrollY = ratio * scrollHeight;

            lenis.scrollTo(targetScrollY, {
                duration: 1.2
            });
        });
    }

    // Drag thumb interaction
    let isDraggingThumb = false;
    let startDragY = 0;
    let startScrollY = 0;

    const startDrag = (clientY) => {
        isDraggingThumb = true;
        startDragY = clientY;
        startScrollY = window.scrollY;
        document.body.style.userSelect = 'none';
        minimapThumb.style.cursor = 'grabbing';
    };

    const doDrag = (clientY) => {
        if (!isDraggingThumb) return;

        const deltaY = clientY - startDragY;
        const trackHeight = minimapTrack.clientHeight;
        const thumbHeight = minimapThumb.clientHeight;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const trackRange = trackHeight - thumbHeight;

        if (trackRange <= 0) return;

        const scrollDelta = deltaY * (scrollHeight / trackRange);
        lenis.scrollTo(startScrollY + scrollDelta, {
            immediate: true
        });
    };

    const stopDrag = () => {
        if (isDraggingThumb) {
            isDraggingThumb = false;
            document.body.style.userSelect = '';
            minimapThumb.style.cursor = 'grab';
        }
    };

    if (minimapThumb) {
        minimapThumb.addEventListener('mousedown', (e) => startDrag(e.clientY));
        minimapThumb.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientY), { passive: true });
    }

    window.addEventListener('mousemove', (e) => doDrag(e.clientY));
    window.addEventListener('touchmove', (e) => {
        if (isDraggingThumb) {
            e.preventDefault();
            doDrag(e.touches[0].clientY);
        }
    }, { passive: false });

    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
    // 8 & 11. Optimized Flashlight Glow Tracker
    const flashlightGlow = document.getElementById('flashlight-glow');
    if (window.matchMedia('(pointer: fine)').matches && flashlightGlow) {
        let hasMoved = false;

        window.addEventListener('mousemove', (e) => {
            if (!hasMoved) {
                flashlightGlow.style.display = 'block';
                hasMoved = true;
            }
            flashlightGlow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
        });
    }

    // 9. Multi-Language Easter Egg Greeting
    const greetingTrigger = document.getElementById('greeting-trigger');
    const greetings = [
        "Hi",          // English
        "こんにちは",    // Japanese
        "नमस्ते"        // Hindi
    ];
    let greetingIndex = 0;

    if (greetingTrigger) {
        greetingTrigger.addEventListener('click', () => {
            greetingIndex = (greetingIndex + 1) % greetings.length;
            
            // Transition effect
            greetingTrigger.style.opacity = '0';
            greetingTrigger.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                greetingTrigger.textContent = greetings[greetingIndex];
                greetingTrigger.style.opacity = '1';
                greetingTrigger.style.transform = 'scale(1)';
            }, 200);
        });
    }

    // 10. 3D Glassmorphic Card Tilt with Glare (Optimized - No Layout Thrashing)
    const cards = document.querySelectorAll('.project-card, .achievement-card');
    cards.forEach(card => {
        // Create glare overlay
        const glare = document.createElement('div');
        glare.className = 'card-glare';
        card.style.position = 'relative';
        card.style.overflow = 'hidden';
        card.appendChild(glare);

        let rect = null;
        let ticking = false;

        card.addEventListener('mouseenter', () => {
            rect = card.getBoundingClientRect();
        });

        card.addEventListener('mousemove', (e) => {
            if (!rect) return;

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (!rect) return;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const maxTilt = 8; // Max rotation in degrees
                    const rotateX = ((centerY - y) / centerY) * maxTilt;
                    const rotateY = ((x - centerX) / centerX) * maxTilt;

                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                    card.style.transition = 'transform 0.05s linear'; // fast tracking transition

                    // Update glare position
                    glare.style.opacity = '1';
                    glare.style.setProperty('--glare-x', `${(x / rect.width) * 100}%`);
                    glare.style.setProperty('--glare-y', `${(y / rect.height) * 100}%`);
                    
                    ticking = false;
                });
                ticking = true;
            }
        });

        card.addEventListener('mouseleave', () => {
            rect = null;
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
            glare.style.opacity = '0';
        });
    });

    // (Flashlight Grid Background Tracker logic combined into Section 8 for better performance)

    // 12. Easter Egg Terminal Keylogger
    const secretCode = "root";
    let typedBuffer = "";
    const terminalOverlay = document.getElementById('secret-terminal-overlay');
    const closeTop = document.getElementById('terminal-close-top');
    const closeBottom = document.getElementById('terminal-close-bottom');

    window.addEventListener('keydown', (e) => {
        // Prevent keylogger recording when user is typing in form input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Play typing sound for the easter egg keypresses
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
            playTypeSound();
        }

        typedBuffer += e.key.toLowerCase();
        
        // Match only the trailing characters of the buffer matching keycode length
        if (typedBuffer.length > secretCode.length) {
            typedBuffer = typedBuffer.slice(-secretCode.length);
        }

        if (typedBuffer === secretCode) {
            typedBuffer = ""; // Reset buffer
            
            // Trigger sudden screen glitch
            document.body.classList.add('glitch-active');
            
            setTimeout(() => {
                document.body.classList.remove('glitch-active');
                if (terminalOverlay) {
                    terminalOverlay.classList.add('active');
                    document.body.classList.add('terminal-active');
                }
            }, 600);
        }
    });

    // Close logic
    const closeTerminal = () => {
        if (terminalOverlay) {
            terminalOverlay.classList.remove('active');
            document.body.classList.remove('terminal-active');
        }
    };

    if (closeTop) closeTop.addEventListener('click', closeTerminal);
    if (closeBottom) closeBottom.addEventListener('click', closeTerminal);

    // 14. Levitating Data Core & Reactive Neural Nodes (Disabled to use pure CSS animations)
    /*
    const profileWrapper = document.getElementById('profile-interactive-wrapper');
    const dot1 = document.getElementById('dot-1');
    const dot2 = document.getElementById('dot-2');
    const dot3 = document.getElementById('dot-3');

    if (profileWrapper && dot1 && dot2 && dot3) {
        // Node state array
        const nodes = [
            {
                element: dot1,
                radius: 160, // Outer ring radius
                speed: 0.015,
                angle: 0,
                x: 0,
                y: 0,
                targetX: 0,
                targetY: 0
            },
            {
                element: dot2,
                radius: 135, // Middle ring radius
                speed: -0.011, // Counter-clockwise
                angle: Math.PI * 0.66,
                x: 0,
                y: 0,
                targetX: 0,
                targetY: 0
            },
            {
                element: dot3,
                radius: 110, // Inner ring radius
                speed: 0.008,
                angle: Math.PI * 1.33,
                x: 0,
                y: 0,
                targetX: 0,
                targetY: 0
            }
        ];

        // Cursor position tracking variables
        let cursorX = 0;
        let cursorY = 0;
        let isNear = false;

        profileWrapper.addEventListener('mousemove', (e) => {
            const rect = profileWrapper.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Cursor offset coordinates relative to center
            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;

            // Straight line distance
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Pull dots if within 150px proximity
            if (dist < 150) {
                isNear = true;
                cursorX = dx;
                // De-project Y coordinate to compensate for rotateX(75deg) tilt (cos(75deg) = 0.2588)
                cursorY = dy / 0.2588;
            } else {
                isNear = false;
            }
        });

        profileWrapper.addEventListener('mouseleave', () => {
            isNear = false;
        });

        // Animation update loop
        function updateNodes() {
            nodes.forEach((node) => {
                // Increment default orbiting angle
                node.angle += node.speed;

                // Orbit target location inside the tilted space
                const orbitX = node.radius * Math.cos(node.angle);
                const orbitY = node.radius * Math.sin(node.angle);

                if (isNear) {
                    // Pull neural nodes to follow the cursor with a spring pull weighting
                    const pullWeight = 0.8;
                    node.targetX = orbitX * (1 - pullWeight) + cursorX * pullWeight;
                    node.targetY = orbitY * (1 - pullWeight) + cursorY * pullWeight;
                } else {
                    node.targetX = orbitX;
                    node.targetY = orbitY;
                }

                // Spring physics lerp interpolation
                node.x += (node.targetX - node.x) * 0.1;
                node.y += (node.targetY - node.y) * 0.1;

                // Position the dot relative to the wrapper center inside the rotateX container
                node.element.style.transform = `translate3d(${node.x}px, ${node.y}px, 0) translate(-50%, -50%)`;
            });

            requestAnimationFrame(updateNodes);
        }

        // Pre-initialize node positions
        nodes.forEach((node) => {
            node.x = node.radius * Math.cos(node.angle);
            node.y = node.radius * Math.sin(node.angle);
        });
    }
    */

    // 8. Ambient Parallax Shift Background Effect (GPU Optimized)
    const auroraBg = document.querySelector('.aurora-bg');
    if (auroraBg) {
        let ticking = false;

        const updateParallax = () => {
            const currentScrollY = window.scrollY;
            // 0.1 parallax factor: translates up to 10% of scroll depth
            const shift = currentScrollY * 0.1; 
            auroraBg.style.transform = `translate3d(0, ${shift}px, 0)`;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        });
        
        // Run initial update on load
        updateParallax();
    }

    // ============================================================
    // FEATURE 10 — BOOT SEQUENCE
    // ============================================================
    const bootOverlay = document.getElementById('boot-overlay');
    const bootBar     = document.getElementById('boot-bar');
    const bootPercent = document.getElementById('boot-percent');
    const bootLines   = document.getElementById('boot-lines');

    const bootMessages = [
        'Loading kernel modules... ',
        'Mounting filesystems... ',
        'Starting UI renderer... ',
        'Injecting glassmorphic shaders... ',
        'Calibrating neural nodes... ',
        'Handshake with server... ',
        'Portfolio v2.0 ready. '
    ];

    if (bootOverlay && bootBar && bootPercent && bootLines) {
        // Prevent flash of main content during boot
        document.body.style.overflow = 'hidden';

        let progress = 0;
        let msgIdx   = 0;
        const totalDuration = 2400; // ms
        const interval = totalDuration / 100;

        const addBootLine = (msg, ok = true) => {
            const line = document.createElement('div');
            line.className = 'boot-line-item';
            line.innerHTML = `<span>${msg}</span><span class="ok">${ok ? '[ OK ]' : '[ .. ]'}</span>`;
            bootLines.appendChild(line);
        };

        const bootInterval = setInterval(() => {
            progress += 1;
            bootBar.style.width = progress + '%';
            bootPercent.textContent = progress + '%';

            // Add a boot line at certain progress milestones
            const msgThreshold = Math.floor((msgIdx + 1) * (100 / bootMessages.length));
            if (progress >= msgThreshold && msgIdx < bootMessages.length) {
                addBootLine(bootMessages[msgIdx], progress < 100);
                msgIdx++;
            }

            if (progress >= 100) {
                clearInterval(bootInterval);
                setTimeout(() => {
                    bootOverlay.classList.add('hide');
                    document.body.style.overflow = '';
                    // Trigger stat counter after boot
                    setTimeout(runStatCounters, 600);
                }, 300);
            }
        }, interval);
    } else {
        // If boot overlay missing, run counters immediately
        setTimeout(runStatCounters, 800);
    }

    // ============================================================
    // FEATURE 11 — LIGHT / DARK MODE TOGGLE
    // ============================================================
    const themeToggle = document.getElementById('theme-toggle');
    let isLightMode = localStorage.getItem('theme-mode') === 'light';

    const applyTheme = () => {
        if (isLightMode) {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    };

    applyTheme(); // Apply saved preference on load

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            isLightMode = !isLightMode;
            localStorage.setItem('theme-mode', isLightMode ? 'light' : 'dark');
            applyTheme();
            playClickSound();
        });
    }

    // ============================================================
    // FEATURE 4 — HERO STATS COUNTER ANIMATION
    // ============================================================
    function animateCounter(el, target, duration = 1200) {
        const start = performance.now();
        const update = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(ease * target);
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = target;
        };
        requestAnimationFrame(update);
    }

    function runStatCounters() {
        const statNums = document.querySelectorAll('.stat-number');
        statNums.forEach(el => {
            const target = parseInt(el.getAttribute('data-target'), 10);
            if (!isNaN(target)) animateCounter(el, target);
        });
    }

    // Also run when hero scrolls into view (in case boot overlay is removed)
    const heroStatsEl = document.getElementById('hero-stats');
    if (heroStatsEl) {
        const statsObserver = new IntersectionObserver((entries, obs) => {
            if (entries[0].isIntersecting) {
                runStatCounters();
                obs.disconnect();
            }
        }, { threshold: 0.5 });
        statsObserver.observe(heroStatsEl);
    }

    // ============================================================
    // FEATURE 6 — LEETCODE STATS WIDGET
    // ============================================================
    const lcWidget = document.getElementById('leetcode-widget');
    const lcEasy   = document.getElementById('lc-easy');
    const lcMedium = document.getElementById('lc-medium');
    const lcHard   = document.getElementById('lc-hard');
    const lcTotal  = document.getElementById('lc-total');

    // Show widget when it comes into view
    if (lcWidget) {
        const lcObserver = new IntersectionObserver((entries, obs) => {
            if (entries[0].isIntersecting) {
                lcWidget.classList.add('show');
                obs.disconnect();
                // Fetch LeetCode stats
                fetchLeetCodeStats();
            }
        }, { threshold: 0.2 });
        lcObserver.observe(lcWidget);
    }

    function fetchLeetCodeStats() {
        // Using a CORS-friendly unofficial API
        fetch('https://leetcode-stats-api.herokuapp.com/TECH9PATH-VISH', {
            signal: AbortSignal.timeout(6000)
        })
        .then(r => r.json())
        .then(data => {
            if (data && data.status === 'success') {
                setLcStat(lcEasy,   data.easySolved   ?? data.easy   ?? '?');
                setLcStat(lcMedium, data.mediumSolved ?? data.medium ?? '?');
                setLcStat(lcHard,   data.hardSolved   ?? data.hard   ?? '?');
                if (lcTotal) lcTotal.textContent = data.totalSolved ?? '?';
            } else {
                setLcFallback();
            }
        })
        .catch(() => setLcFallback());
    }

    function setLcStat(el, val) {
        if (el) el.textContent = val;
    }

    function setLcFallback() {
        // Show dashes — user can update manually if username doesn't match API
        if (lcEasy)   lcEasy.textContent   = '—';
        if (lcMedium) lcMedium.textContent = '—';
        if (lcHard)   lcHard.textContent   = '—';
        if (lcTotal)  lcTotal.textContent  = '— (update username)';
    }

    // ============================================================
    // FEATURE 7 — WIP PROGRESS BAR ANIMATION
    // ============================================================
    const wipFill = document.getElementById('wip-fill');
    const wipPct  = document.getElementById('wip-pct');

    if (wipFill) {
        const wipObserver = new IntersectionObserver((entries, obs) => {
            if (entries[0].isIntersecting) {
                const target = parseInt(wipFill.getAttribute('data-target'), 10) || 35;
                obs.disconnect();
                setTimeout(() => {
                    wipFill.style.width = target + '%';
                    if (wipPct) wipPct.textContent = target + '%';
                }, 300);
            }
        }, { threshold: 0.3 });
        wipObserver.observe(wipFill);
    }

    // ============================================================
    // FEATURE 13 — SECTION PARTICLE BURST ON REVEAL
    // ============================================================
    const colors = ['#00f0ff', '#00ff87', '#00ffcc', '#ffffff'];

    function burstParticles(section) {
        const titleEl = section.querySelector('.section-title');
        if (!titleEl) return;

        // Add relative positioning to section title if needed
        const titlePos = titleEl.style.position;
        titleEl.style.position = 'relative';

        const container = document.createElement('div');
        container.className = 'particle-burst';
        titleEl.appendChild(container);

        const count = 18;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'particle';

            const angle   = (Math.random() * 360) * (Math.PI / 180);
            const dist    = 30 + Math.random() * 80;
            const tx      = Math.cos(angle) * dist;
            const ty      = Math.sin(angle) * dist - 20;
            const dur     = 0.5 + Math.random() * 0.5;
            const color   = colors[Math.floor(Math.random() * colors.length)];
            const startX  = Math.random() * 100;

            p.style.setProperty('--tx0', '0px');
            p.style.setProperty('--ty0', '0px');
            p.style.setProperty('--txf', tx + 'px');
            p.style.setProperty('--tyf', ty + 'px');
            p.style.setProperty('--dur', dur + 's');
            p.style.left = startX + '%';
            p.style.background = color;
            p.style.boxShadow  = `0 0 6px ${color}`;
            p.style.animationDelay = (Math.random() * 0.15) + 's';
            p.style.width  = (2 + Math.random() * 3) + 'px';
            p.style.height = p.style.width;

            container.appendChild(p);

            // Remove particles after animation
            setTimeout(() => {
                if (container.parentNode) container.remove();
                titleEl.style.position = titlePos;
            }, (dur + 0.2) * 1000 + 150);
        }
    }

    // Patch into existing IntersectionObserver reveal logic
    // We do this by adding a MutationObserver that watches for .show being added
    const sectionEls = document.querySelectorAll('section.hidden');
    const particleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.classList.contains('show')) {
                burstParticles(entry.target);
                particleObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    // Use MutationObserver to detect when .show is added to sections
    const showObserver = new MutationObserver((mutations) => {
        mutations.forEach(m => {
            if (m.type === 'attributes' && m.attributeName === 'class') {
                const el = m.target;
                if (el.classList.contains('show') && el.tagName === 'SECTION') {
                    burstParticles(el);
                }
            }
        });
    });

    document.querySelectorAll('section').forEach(sec => {
        showObserver.observe(sec, { attributes: true });
    });

});
