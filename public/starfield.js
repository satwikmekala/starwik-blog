// Parallax Starfield by mouse movement
const STAR_LAYERS = [
  { count: 100, size: 1, speed: 0.03, color: '#fff' },
  { count: 60, size: 2, speed: 0.06, color: '#ffe066' },
  { count: 30, size: 3, speed: 0.09, color: '#4fd1c5' }
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
}

document.addEventListener('DOMContentLoaded', setupParallaxStarfield); 