// Parallax Starfield by mouse movement
const STAR_LAYERS = [
  { count: 220, size: 1, speed: 0.03, color: '#fff' },
  { count: 140, size: 2, speed: 0.06, color: '#ffe066' },
  { count: 80, size: 3, speed: 0.09, color: '#4fd1c5' }
];

function createStars(count, size, color) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.background = color;
    star.style.position = 'absolute';
    star.style.borderRadius = '50%';
    star.style.top = `${Math.random() * 100}%`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.opacity = Math.random() * 0.7 + 0.3;
    stars.push(star);
  }
  return stars;
}

function createStarLayer(layerConfig, zIndex) {
  const layer = document.createElement('div');
  layer.className = 'star-layer';
  layer.style.position = 'fixed';
  layer.style.top = 0;
  layer.style.left = 0;
  layer.style.width = '100vw';
  layer.style.height = '100vh';
  layer.style.pointerEvents = 'none';
  layer.style.zIndex = zIndex;
  layer.style.overflow = 'hidden';
  createStars(layerConfig.count, layerConfig.size, layerConfig.color).forEach(star => layer.appendChild(star));
  return layer;
}

function setupParallaxStarfield() {
  const container = document.createElement('div');
  container.className = 'starfield-parallax';
  container.style.position = 'fixed';
  container.style.top = 0;
  container.style.left = 0;
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.zIndex = 0;
  container.style.pointerEvents = 'none';
  document.body.prepend(container);

  const layers = STAR_LAYERS.map((config, i) => {
    const layer = createStarLayer(config, i);
    container.appendChild(layer);
    return { layer, speed: config.speed };
  });

  window.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    layers.forEach(({ layer, speed }) => {
      layer.style.transform = `translate(${x * 120 * speed}px, ${y * 120 * speed}px)`;
    });
  });

  // Subtle twinkle effect: randomly apply to a small subset of stars
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    const allStars = Array.from(container.querySelectorAll('.star'));
    const maxConcurrentRatio = 0.22; // up to 22% of stars can twinkle concurrently
    const maxConcurrent = Math.max(1, Math.floor(allStars.length * maxConcurrentRatio));
    const activeTwinkles = new Set();

    function scheduleTwinkleOnStar(star) {
      if (activeTwinkles.has(star)) return;

      // Random chance each scheduling tick
      const chance = 0.28; // 28% chance to twinkle this star on tick
      if (Math.random() > chance) return;

      if (activeTwinkles.size >= maxConcurrent) return;

      activeTwinkles.add(star);

      // Random duration and brightness level
      const duration = (0.8 + Math.random() * 1.4).toFixed(2) + 's'; // 0.8s - 2.2s
      const brightness = Math.random() < 0.7 ? 1.9 : 2.5; // more punchy, occasional stronger
      star.style.setProperty('--twinkle-duration', duration);
      star.style.setProperty('--twinkle-brightness', String(brightness));

      // Trigger animation via class
      star.classList.add('twinkle');

      const handleEnd = () => {
        star.classList.remove('twinkle');
        star.removeEventListener('animationend', handleEnd);
        activeTwinkles.delete(star);
      };
      star.addEventListener('animationend', handleEnd, { once: true });
    }

    // Spread checks over time to avoid bursts; lightweight loop
    const tickIntervalMs = 320;
    const twinkleTimer = setInterval(() => {
      if (document.hidden) return; // pause when tab hidden
      // Pick a subset of stars to attempt twinkle
      const attempts = Math.min(Math.ceil(allStars.length * 0.08), 60);
      for (let i = 0; i < attempts; i++) {
        const idx = Math.floor(Math.random() * allStars.length);
        scheduleTwinkleOnStar(allStars[idx]);
      }
    }, tickIntervalMs);

    // Clean up on page hide/unload
    window.addEventListener('beforeunload', () => clearInterval(twinkleTimer));
  }
}

document.addEventListener('DOMContentLoaded', setupParallaxStarfield); 