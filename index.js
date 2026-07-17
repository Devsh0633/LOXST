// index.js

document.addEventListener('DOMContentLoaded', () => {
  
  // Extract globals loaded via script tags
  const anime = window.anime;
  const { animate } = window.Motion || {};

  // Add js-enabled class to body to trigger initial hidden styles
  document.body.classList.add('js-enabled');
  
  // 1. Accessibility Checks (Reduced Motion)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 2. Custom DOM Word Splitter for GSAP Hero Animation
  const headline = document.getElementById('main-headline');
  if (headline) {
    const text = headline.textContent.trim();
    const words = text.split(/\s+/);
    headline.innerHTML = words.map(word => {
      return `<span class="word-wrapper"><span class="word">${word}</span></span>`;
    }).join(' ');
  }

  // 3. Custom DOM Word Splitter for Strengths Paragraph (Scroll Scrub Reveal)
  const strengthsParagraph = document.getElementById('pairing-paragraph');
  if (strengthsParagraph) {
    // Walk through DOM tree and wrap words, treating highlights as single units to prevent clip breaking
    function wrapWords(node) {
      if (node.nodeType === Node.ELEMENT_NODE && 
         (node.classList.contains('text-highlight-orange') || 
          node.classList.contains('text-highlight-green') || 
          node.classList.contains('text-highlight-purple'))) {
        // Treat highlight blocks as single reveal units and do not split their internal text nodes
        node.classList.add('reveal-word');
        return;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const words = text.split(/(\s+)/);
        const fragment = document.createDocumentFragment();
        
        words.forEach(word => {
          if (word.trim() === '') {
            fragment.appendChild(document.createTextNode(word));
          } else {
            const span = document.createElement('span');
            span.className = 'reveal-word';
            span.textContent = word;
            fragment.appendChild(span);
          }
        });
        
        node.parentNode.replaceChild(fragment, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const childNodes = Array.from(node.childNodes);
        childNodes.forEach(child => wrapWords(child));
      }
    }
    wrapWords(strengthsParagraph);
  }

  // 4. GSAP Timelines (Hero Entrance & Diagram Paths)
  if (window.gsap && !prefersReducedMotion) {
    try {
      // Safely register ScrollTrigger if it is loaded
      if (window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
      }

      // Hero word stagger timeline
      const wordElements = document.querySelectorAll('.word');
      const heroTl = window.gsap.timeline({ delay: 0.2 });
      
      heroTl
        .from('.hero-section .eyebrow', { opacity: 0, y: -15, duration: 0.5, ease: 'power2.out' })
        .from(wordElements, {
          yPercent: 110,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.08
        }, '-=0.35')
        .from('.hero-subhead', { opacity: 0, y: 12, duration: 0.5, ease: 'power2.out' }, '-=0.35')
        .from('.hero-support', { opacity: 0, y: 12, duration: 0.5, ease: 'power2.out' }, '-=0.35');

      // Hero path draw active flow
      if (document.getElementById('hero-flow-active')) {
        window.gsap.fromTo('#hero-flow-active', 
          { strokeDashoffset: 210 }, 
          { strokeDashoffset: 0, duration: 2.5, ease: 'power1.inOut', repeat: -1 }
        );
      }

      // Section 3 Connect Line Draw on Scroll if ScrollTrigger is active
      if (document.getElementById('how-path-active') && window.ScrollTrigger) {
        window.gsap.from('#how-path-active', {
          scrollTrigger: {
            trigger: '.how-it-works-section',
            start: 'top 75%',
          },
          strokeDashoffset: 192,
          duration: 1.2,
          ease: 'power2.out'
        });
      }

      // Strengths Section Word Reveal Scroll Scrub
      const revealWords = document.querySelectorAll('#pairing-paragraph .reveal-word');
      if (revealWords.length > 0 && window.ScrollTrigger) {
        window.gsap.fromTo(revealWords, 
          { opacity: 0.15 }, 
          {
            opacity: 1,
            stagger: 0.05,
            scrollTrigger: {
              trigger: '.pairing-section',
              start: 'top 75%',
              end: 'top 30%',
              scrub: true,
            }
          }
        );
      }
    } catch (e) {
      console.warn('GSAP animation error:', e);
      // Fallback: make all elements visible if GSAP fails
      document.querySelectorAll('.word').forEach(el => el.style.transform = 'none');
      document.querySelectorAll('#pairing-paragraph .reveal-word').forEach(el => el.style.opacity = '1');
    }
  } else {
    // Fallbacks
    document.querySelectorAll('.word').forEach(el => el.style.transform = 'none');
    document.querySelectorAll('#pairing-paragraph .reveal-word').forEach(el => el.style.opacity = '1');
  }

  // 5. Scroll Reveal IntersectionObserver initialization
  initScrollObserver();

  // 6. "How It Works" Tab Segmented Switcher
  const toggleBtnExisting = document.getElementById('btn-path-existing');
  const toggleBtnNew = document.getElementById('btn-path-new');
  const pathActiveBg = document.querySelector('.segment-active-bg');
  
  const pathExistingContent = document.querySelector('.path-existing');
  const pathNewContent = document.querySelector('.path-new');
  const flowPathLine = document.getElementById('how-path-active');

  if (toggleBtnExisting && toggleBtnNew && pathActiveBg) {
    toggleBtnExisting.addEventListener('click', () => {
      toggleBtnExisting.classList.add('active');
      toggleBtnNew.classList.remove('active');
      pathActiveBg.style.transform = 'translateX(0)';
      switchPath('existing');
    });

    toggleBtnNew.addEventListener('click', () => {
      toggleBtnNew.classList.add('active');
      toggleBtnExisting.classList.remove('active');
      pathActiveBg.style.transform = 'translateX(100%)';
      switchPath('new');
    });
  }

  function switchPath(mode) {
    if (prefersReducedMotion) {
      if (mode === 'existing') {
        pathExistingContent.classList.add('active');
        pathNewContent.classList.remove('active');
      } else {
        pathNewContent.classList.add('active');
        pathExistingContent.classList.remove('active');
      }
      return;
    }

    if (window.gsap) {
      if (mode === 'existing') {
        window.gsap.to(pathNewContent, { opacity: 0, y: 12, duration: 0.25, onComplete: () => {
          pathNewContent.classList.remove('active');
          pathExistingContent.classList.add('active');
          window.gsap.fromTo(pathExistingContent, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.35 });
        }});
        if (flowPathLine) {
          window.gsap.to(flowPathLine, { stroke: '#1d5fe0', duration: 0.3 });
        }
      } else {
        window.gsap.to(pathExistingContent, { opacity: 0, y: 12, duration: 0.25, onComplete: () => {
          pathExistingContent.classList.remove('active');
          pathNewContent.classList.add('active');
          window.gsap.fromTo(pathNewContent, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.35 });
        }});
        if (flowPathLine) {
          window.gsap.to(flowPathLine, { stroke: '#3b82f6', duration: 0.3 });
        }
      }
    } else {
      // JS Switch Fallback
      if (mode === 'existing') {
        pathNewContent.classList.remove('active');
        pathExistingContent.classList.add('active');
        pathExistingContent.style.opacity = '1';
      } else {
        pathExistingContent.classList.remove('active');
        pathNewContent.classList.add('active');
        pathNewContent.style.opacity = '1';
      }
    }
  }

  // 7. "What's Included" Grid Stagger (Anime.js)
  const gridEl = document.querySelector('.included-features-grid');
  if (gridEl && anime && !prefersReducedMotion) {
    const includedObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          anime({
            targets: '.feature-card',
            translateY: [30, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
            duration: 800,
            easing: 'easeOutCubic'
          });
          includedObserver.unobserve(gridEl);
        }
      });
    }, { threshold: 0.15 });
    includedObserver.observe(gridEl);
  } else if (gridEl) {
    document.querySelectorAll('.feature-card').forEach(card => card.style.opacity = '1');
  }

  // 8. 3D Card Hover Tilt Effect (Micro-interactions)
  if (!prefersReducedMotion) {
    const tiltElements = document.querySelectorAll('.feature-card, .diagram-node, .partner-card');
    tiltElements.forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const width = rect.width;
        const height = rect.height;
        
        // Tilt calculations
        const rotateX = ((y / height) - 0.5) * -12;
        const rotateY = ((x / width) - 0.5) * 12;
        
        const translationY = card.classList.contains('diagram-node') ? -2 : -4;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${translationY}px)`;
        
        // Gradient shine position
        const shineX = (x / width) * 100;
        const shineY = (y / height) * 100;
        card.style.setProperty('--shine-x', `${shineX}%`);
        card.style.setProperty('--shine-y', `${shineY}%`);
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        card.style.setProperty('--shine-x', '50%');
        card.style.setProperty('--shine-y', '50%');
      });
    });
  }

  // 9. FAQ Accordion (Motion.dev - height: auto slider animation)
  document.querySelectorAll('.accordion-trigger').forEach(triggerBtn => {
    triggerBtn.addEventListener('click', () => {
      const contentPanel = triggerBtn.nextElementSibling;
      const isExpanded = triggerBtn.getAttribute('aria-expanded') === 'true';

      // Set expanded state
      triggerBtn.setAttribute('aria-expanded', !isExpanded);

      if (prefersReducedMotion) {
        if (!isExpanded) {
          contentPanel.classList.add('open');
          contentPanel.style.height = 'auto';
          contentPanel.style.opacity = '1';
        } else {
          contentPanel.classList.remove('open');
          contentPanel.style.height = '0px';
          contentPanel.style.opacity = '0';
        }
        return;
      }

      if (!isExpanded) {
        // OPENING: animate height to scrollHeight
        contentPanel.classList.add('open');
        const scrollHeight = contentPanel.scrollHeight;
        contentPanel.style.height = '0px';

        if (animate) {
          animate(
            contentPanel,
            { height: [0, scrollHeight], opacity: [0, 1] },
            { duration: 0.32, easing: 'ease-out' }
          ).then(() => {
            if (triggerBtn.getAttribute('aria-expanded') === 'true') {
              contentPanel.style.height = 'auto';
            }
          });
        } else {
          contentPanel.style.height = 'auto';
          contentPanel.style.opacity = '1';
        }
      } else {
        // CLOSING: animate height back to 0
        const currentHeight = contentPanel.offsetHeight;
        contentPanel.style.height = `${currentHeight}px`;

        if (animate) {
          animate(
            contentPanel,
            { height: [currentHeight, 0], opacity: [1, 0] },
            { duration: 0.28, easing: 'ease-in-out' }
          ).then(() => {
            if (triggerBtn.getAttribute('aria-expanded') === 'false') {
              contentPanel.classList.remove('open');
              contentPanel.style.height = '0px';
            }
          });
        } else {
          contentPanel.classList.remove('open');
          contentPanel.style.height = '0px';
          contentPanel.style.opacity = '0';
        }
      }
    });
  });

  // 10. Showcase Slider/Carousel Navigation
  initShowcaseSlider();

  function initShowcaseSlider() {
    const track = document.querySelector('.showcase-track');
    const slides = document.querySelectorAll('.showcase-slide');
    const btnPrev = document.getElementById('btn-showcase-prev');
    const btnNext = document.getElementById('btn-showcase-next');
    const titleEl = document.getElementById('showcase-item-title');
    const tagsEl = document.getElementById('showcase-item-tags');

    if (!track || slides.length === 0) return;

    let activeIndex = 2;

    function updateSlider() {
      // Toggle active states
      slides.forEach((slide, idx) => {
        if (idx === activeIndex) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });

      // Centering offset calculations
      const activeSlide = slides[activeIndex];
      const parentWidth = track.parentElement.offsetWidth;
      const slideWidth = activeSlide.offsetWidth;
      const slideLeft = activeSlide.offsetLeft;

      const offset = (parentWidth / 2) - slideLeft - (slideWidth / 2);
      track.style.transform = `translateX(${offset}px)`;

      // Update text information
      const title = activeSlide.getAttribute('data-title');
      const tags = activeSlide.getAttribute('data-tags');
      if (titleEl) titleEl.textContent = title;
      if (tagsEl) tagsEl.textContent = `{ ${tags} }`;
    }

    // Set initial position after slight delay to ensure correct offsets are computed
    setTimeout(updateSlider, 100);

    // Event listeners for navigation triggers
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        activeIndex = (activeIndex - 1 + slides.length) % slides.length;
        updateSlider();
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        activeIndex = (activeIndex + 1) % slides.length;
        updateSlider();
      });
    }

    // Update alignment dynamically on screen resize
    window.addEventListener('resize', updateSlider);
  }

  // 11. Scroll Reveal Observer using simple class additions
  function initScrollObserver() {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -5% 0px' });

    document.querySelectorAll('[string="progress"]').forEach(el => {
      revealObserver.observe(el);
    });

    document.querySelectorAll('[string="split"]').forEach(el => {
      revealObserver.observe(el);
    });
  }
});
