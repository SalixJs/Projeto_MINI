// ===== ASSETS =====
let campo, jogador, bola;

// ===== ESCALA DO CAMPO =====
// Os limites do gol abaixo foram calibrados originalmente com o campo
// desenhado em 1000x600. Agora ele é desenhado em 1500x1000, então
// escalamos tudo proporcionalmente. Se você mudar o tamanho do campo de
// novo, só precisa atualizar FIELD_DRAW_W/H (e CANVAS_W/H no setup).
const FIELD_DRAW_W = 1500, FIELD_DRAW_H = 1000; // tamanho de desenho do campo
const CANVAS_W = 1000, CANVAS_H = 900;          // tamanho do canvas
const ORIGINAL_W = 1000, ORIGINAL_H = 600;      // tamanho usado na calibração original
const SCALE_X = FIELD_DRAW_W / ORIGINAL_W;      // 1.5
const SCALE_Y = FIELD_DRAW_H / ORIGINAL_H;      // 1.667

// ===== JOGADOR (GOLEIRO) =====
// Tamanho FIXO (não escala com o campo) — assim, quanto maior você deixar
// o campo/gol, relativamente menor (e mais difícil de cobrir) o goleiro fica.
const playerW = 40;
const playerH = 60;
const playerSpeed = 4 * SCALE_Y;
let px = 50 * SCALE_X; // posição ainda acompanha a escala, só o tamanho é fixo
let py;

// ===== LIMITES DO GOL =====
// Baseados nos retângulos originais: rect(0,240,55,-233) e rect(0,353,55,233)
// (já escalados para o novo tamanho do campo)
const goalX = 55 * SCALE_X;
const goalTop = 240 * SCALE_Y;
const goalBottom = 353 * SCALE_Y;

// ===== BOLA =====
let ballX, ballY, ballStartY, ballTargetY;
let ballSpeed = 4;
let ballActive = false;
const ballSize = 14 * ((SCALE_X + SCALE_Y) / 2);

// Efeito de curva/fake: a bola muda de direção de repente no meio do trajeto
let temCurva = false;
let curvaProgresso = 0.6; // em que ponto do trajeto (0-1) a bola muda de rumo
let ballMidY = 0;         // "alvo falso" antes da curva

// ===== DIFICULDADE =====
let dificuldade = 0; // sobe a cada defesa, deixa a bola mais rápida

// ===== ESTADO DO JOGO =====
let state = "jogando";     // "jogando" | "resultado"
let resultMsg = "";
let resultTimer = 0;
const RESULT_DURATION = 60; // frames (~1s a 60fps)

let placar = { defesas: 0, gols: 0 };

function preload() {
  campo = loadImage("img_campo.png");
  jogador = loadImage("img_jogador.png");
  bola = loadImage("bola.png");
}

function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  py = (goalTop + goalBottom) / 2 - playerH / 2; // centraliza o goleiro no gol
  novaBola();
}

function draw() {
  image(campo, 0, 0, FIELD_DRAW_W, FIELD_DRAW_H);

  atualizarJogador();
  image(jogador, px, py, playerW, playerH);

  if (ballActive) {
    atualizarBola();
  }
  image(bola, ballX - ballSize / 2, ballY - ballSize / 2, ballSize, ballSize);

  if (state === "resultado") {
    mostrarResultado();
  }

  desenharPlacar();
}

// ---- Jogador se move só no eixo Y, preso à área do gol ----
function atualizarJogador() {
  if (state !== "jogando") return; // trava o goleiro durante a exibição do resultado

  if (keyIsDown(87)) {          // W
    py -= playerSpeed;
  } else if (keyIsDown(83)) {   // S
    py += playerSpeed;
  }
  py = constrain(py, goalTop, goalBottom - playerH);
}

// ---- Cria uma bola nova vindo da direita, mirando um ponto aleatório do gol ----
function novaBola() {
  ballX = width - 60;
  ballStartY = random(30, height - 30);
  ballY = ballStartY;
  ballTargetY = random(goalTop + ballSize, goalBottom - ballSize);
  ballSpeed = random(8, 12) + dificuldade; // bola bem mais rápida
  ballActive = true;
  state = "jogando";

  // ~55% de chance da bola ter uma curva/fake no meio do caminho
  temCurva = random() < 0.55;
  if (temCurva) {
    curvaProgresso = random(0.45, 0.75);
    ballMidY = random(goalTop + ballSize, goalBottom - ballSize);
  }
}

// ---- Move a bola em linha reta (ou com curva/fake) até a linha do gol ----
function atualizarBola() {
  const distanciaTotal = (width - 60) - goalX;
  const progresso = constrain((width - 60 - ballX) / distanciaTotal, 0, 1);

  if (temCurva) {
    if (progresso < curvaProgresso) {
      // fase 1: vai em direção ao alvo falso
      const p = progresso / curvaProgresso;
      ballY = lerp(ballStartY, ballMidY, p);
    } else {
      // fase 2: muda de repente para o alvo real
      const p = (progresso - curvaProgresso) / (1 - curvaProgresso);
      ballY = lerp(ballMidY, ballTargetY, p);
    }
  } else {
    ballY = lerp(ballStartY, ballTargetY, progresso);
  }

  ballX -= ballSpeed;

  // Checa colisão em TODO frame enquanto a bola atravessa a faixa do goleiro
  if (colidiu(ballX, ballY, px, py)) {
    finalizarJogada("DEFESA!", true);
    return;
  }

  // Se passou da linha do gol sem colidir, é gol
  if (ballX <= goalX) {
    ballX = goalX; // trava a bola na linha da rede pra não sumir do campo
    finalizarJogada("GOL!", false);
  }
}

// ---- Checagem simples de colisão (retângulo bola x retângulo jogador) ----
function colidiu(bx, by, jx, jy) {
  return (
    bx + ballSize / 2 > jx &&
    bx - ballSize / 2 < jx + playerW &&
    by + ballSize / 2 > jy &&
    by - ballSize / 2 < jy + playerH
  );
}

function finalizarJogada(msg, defendeu) {
  ballActive = false;
  state = "resultado";
  resultMsg = msg;
  resultTimer = frameCount;
  if (defendeu) {
    placar.defesas++;
    dificuldade += 0.6; // cada defesa deixa o próximo chute mais rápido
  } else {
    placar.gols++;
  }
}

function mostrarResultado() {
  push();
  textAlign(CENTER, CENTER);
  textSize(48);
  stroke(0);
  strokeWeight(4);
  fill(resultMsg === "GOL!" ? color(255, 60, 60) : color(255, 255, 0));
  text(resultMsg, width / 2, height / 2);
  pop();

  if (frameCount - resultTimer > RESULT_DURATION) {
    novaBola();
  }
}

function desenharPlacar() {
  push();
  fill(255);
  stroke(0);
  strokeWeight(2);
  textSize(20);
  textAlign(LEFT, TOP);
  text(`Defesas: ${placar.defesas}   Gols sofridos: ${placar.gols}`, 15, 10);
  pop();
}