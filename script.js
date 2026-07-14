// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navMobile = document.getElementById('navMobile');
const nav = document.getElementById('nav');

navToggle.addEventListener('click', () => {
  const isOpen = navMobile.classList.toggle('open');
  nav.classList.toggle('menu-open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navMobile.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navMobile.classList.remove('open');
    nav.classList.remove('menu-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

// Animated counters
const counters = document.querySelectorAll('.stat-num');
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.count, 10);
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    countObserver.unobserve(el);
  });
}, { threshold: 0.5 });

counters.forEach(el => countObserver.observe(el));

// 3D tilt interactions
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  // Hero pipeline graph — subtle parallax tilt following the cursor
  const heroSection = document.querySelector('.hero');
  const heroVisual = document.querySelector('.hero-visual');
  const heroGraph = document.querySelector('.hero-graph');

  if (heroSection && heroVisual && heroGraph) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroVisual.getBoundingClientRect();
      const relX = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const relY = (e.clientY - rect.top - rect.height / 2) / rect.height;
      const rotateY = Math.max(-1, Math.min(1, relX)) * 14;
      const rotateX = Math.max(-1, Math.min(1, relY)) * -10;
      heroGraph.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    });
    heroSection.addEventListener('mouseleave', () => {
      heroGraph.style.transform = '';
    });
  }

  // Card tilt — experience, skills and education cards tilt toward the cursor
  const tiltCards = document.querySelectorAll('.tl-card, .skill-card, .edu-card');
  const TILT_MAX = 6;

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      const rotateY = relX * TILT_MAX * 2;
      const rotateX = relY * -TILT_MAX * 2;
      card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-3px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// Hero gear + particle network — animated canvas illustration
(function heroCanvasAnim(){
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const wrapper = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let W = 0, H = 0;
  let parX = 0, parY = 0;
  let particles = [];

  const gears = [
    { fx: 0.36, fy: 0.40, rFrac: 0.165, teeth: 14, dir: 1,  speed: 0.0055,            angle: 0,   holeFrac: 0.28 },
    { fx: 0.66, fy: 0.34, rFrac: 0.115, teeth: 10, dir: -1, speed: 0.0055 * 14 / 10,   angle: 0.2, holeFrac: 0.26 },
    { fx: 0.72, fy: 0.64, rFrac: 0.085, teeth: 8,  dir: 1,  speed: 0.0055 * 14 / 8,    angle: 0.6, holeFrac: 0.30 }
  ];

  let colors = {};
  function refreshColors(){
    const cs = getComputedStyle(document.documentElement);
    colors = {
      accent: cs.getPropertyValue('--accent').trim() || '#2563eb',
      accent2: cs.getPropertyValue('--accent-2').trim() || '#0ea5e9',
      surface: cs.getPropertyValue('--surface').trim() || '#ffffff'
    };
  }
  refreshColors();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', refreshColors);

  function initParticles(){
    particles = Array.from({ length: 26 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      glow: Math.random() < 0.22
    }));
  }

  function resize(){
    const rect = wrapper.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  }

  function drawGear(g){
    const cx = g.fx * W, cy = g.fy * H;
    const outerR = g.rFrac * Math.min(W, H) * 2;
    const innerR = outerR * 0.82;
    const holeR = outerR * g.holeFrac;
    const step = (Math.PI * 2) / g.teeth;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(g.angle);

    ctx.beginPath();
    for (let i = 0; i < g.teeth; i++){
      const a0 = i * step;
      const a1 = a0 + step * 0.28;
      const a3 = a0 + step * 0.78;
      const a4 = a0 + step;
      ctx.lineTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
      ctx.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
      ctx.lineTo(Math.cos(a3) * outerR, Math.sin(a3) * outerR);
      ctx.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR);
    }
    ctx.closePath();
    ctx.fillStyle = colors.surface;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = colors.accent;
    ctx.globalAlpha = 0.85;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, holeR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    for (let s = 0; s < 4; s++){
      const sa = s * (Math.PI / 2) + g.angle * 0.3;
      ctx.moveTo(Math.cos(sa) * holeR, Math.sin(sa) * holeR);
      ctx.lineTo(Math.cos(sa) * innerR * 0.55, Math.sin(sa) * innerR * 0.55);
    }
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawParticles(){
    const offX = parX * 6, offY = parY * 6;
    const threshold = Math.min(W, H) * 0.22;

    for (let i = 0; i < particles.length; i++){
      const p = particles[i];
      for (let j = i + 1; j < particles.length; j++){
        const q = particles[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < threshold){
          ctx.strokeStyle = colors.accent;
          ctx.globalAlpha = (1 - dist / threshold) * 0.22;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x + offX, p.y + offY);
          ctx.lineTo(q.x + offX, q.y + offY);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    particles.forEach(p => {
      if (!reduceMotion){
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      }
      ctx.beginPath();
      ctx.fillStyle = p.glow ? colors.accent2 : colors.accent;
      ctx.globalAlpha = p.glow ? 0.85 : 0.55;
      ctx.shadowColor = colors.accent2;
      ctx.shadowBlur = p.glow ? 8 : 0;
      ctx.arc(p.x + offX, p.y + offY, p.glow ? 2.6 : 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });
  }

  function frame(){
    if (document.hidden){ requestAnimationFrame(frame); return; }

    ctx.clearRect(0, 0, W, H);
    drawParticles();

    ctx.save();
    ctx.translate(parX * 10, parY * 10);
    gears.forEach(g => {
      if (!reduceMotion) g.angle += g.speed * g.dir;
      drawGear(g);
    });
    ctx.restore();

    if (!reduceMotion) requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);

  if (!reduceMotion){
    wrapper.addEventListener('mousemove', (e) => {
      const rect = wrapper.getBoundingClientRect();
      parX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      parY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });
    wrapper.addEventListener('mouseleave', () => { parX = 0; parY = 0; });
  }

  requestAnimationFrame(frame);
})();
