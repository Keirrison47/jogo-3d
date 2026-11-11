// Configuração da Cena, Câmera e Renderizador
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050510, 0.035);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 7);
camera.lookAt(0, 0, -5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Iluminação
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x00ffcc, 1);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// Chão com Grade Neon (Efeito de Velocidade)
const gridHelper = new THREE.GridHelper(100, 50, 0x00ffcc, 0x1a1a40);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

// Nave do Jogador
const playerGeometry = new THREE.ConeGeometry(0.6, 1.8, 4);
const playerMaterial = new THREE.MeshStandardMaterial({
  color: 0x00ffcc,
  emissive: 0x004433,
  roughness: 0.3
});
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.rotation.x = -Math.PI / 2;
player.position.y = 0.2;
scene.add(player);

// Variáveis de Estado do Jogo
let obstacles = [];
let score = 0;
let speed = 0.35;
let isGameOver = false;
let targetX = 0;
const laneLimit = 5.5;

// Controles do Teclado
document.addEventListener('keydown', (event) => {
  if (isGameOver) return;
  if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
    targetX = Math.max(targetX - 1.8, -laneLimit);
  } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
    targetX = Math.min(targetX + 1.8, laneLimit);
  }
});

// Ajuste de Tela Responsivo
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Função para Criar Obstáculos
function spawnObstacle() {
  const size = Math.random() * 0.8 + 0.7;
  const geometry = new THREE.DodecahedronGeometry(size);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff4757,
    roughness: 0.7
  });
  const obstacle = new THREE.Mesh(geometry, material);

  obstacle.position.x = (Math.random() - 0.5) * (laneLimit * 2.2);
  obstacle.position.y = 0.3;
  obstacle.position.z = -50;

  scene.add(obstacle);
  obstacles.push(obstacle);
}

// Função para Reiniciar o Jogo
function resetGame() {
  obstacles.forEach(obs => scene.remove(obs));
  obstacles = [];
  score = 0;
  speed = 0.35;
  targetX = 0;
  player.position.x = 0;
  isGameOver = false;

  document.getElementById('score').innerText = '0';
  document.getElementById('game-over').style.display = 'none';
  animate();
}

// Loop Principal de Animação
let frameCount = 0;

function animate() {
  if (isGameOver) return;
  requestAnimationFrame(animate);

  frameCount++;

  // Suaviza o movimento lateral da nave e inclina levemente
  player.position.x += (targetX - player.position.x) * 0.15;
  player.rotation.z = (player.position.x - targetX) * 0.5;

  // Move a grade do chão para simular movimento
  gridHelper.position.z += speed;
  if (gridHelper.position.z > 2) {
    gridHelper.position.z = 0;
  }

  // Gera novos obstáculos periodicamente
  const spawnRate = Math.max(15, 45 - Math.floor(score / 100));
  if (frameCount % spawnRate === 0) {
    spawnObstacle();
  }

  // Atualiza obstáculos e verifica colisão
  const playerBox = new THREE.Box3().setFromObject(player);
  // Reduz levemente a caixa de colisão para a jogabilidade ficar justa
  playerBox.expandByScalar(-0.2);

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.position.z += speed;
    obs.rotation.x += 0.03;
    obs.rotation.y += 0.03;

    const obsBox = new THREE.Box3().setFromObject(obs);

    if (playerBox.intersectsBox(obsBox)) {
      isGameOver = true;
      document.getElementById('final-score').innerText = Math.floor(score);
      document.getElementById('game-over').style.display = 'block';
      return;
    }

    // Remove obstáculos que passaram da câmera
    if (obs.position.z > 10) {
      scene.remove(obs);
      obstacles.splice(i, 1);
    }
  }

  // Aumenta pontuação e velocidade gradualmente
  score += 0.5;
  speed += 0.0001;
  document.getElementById('score').innerText = Math.floor(score);

  renderer.render(scene, camera);
}

// Inicia o Jogo
animate();
