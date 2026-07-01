let campo, jogador, bola;


const FIELD_DRAW_W = 1500, FIELD_DRAW_H = 1000; 
const CANVAS_W = 1000, CANVAS_H = 900;          
const ORIGINAL_W = 1000, ORIGINAL_H = 600;      
const SCALE_X = FIELD_DRAW_W / ORIGINAL_W;     
const SCALE_Y = FIELD_DRAW_H / ORIGINAL_H;      


const playerW = 40;
const playerH = 60;
const playerSpeed = 4 * SCALE_Y;
let px = 50 * SCALE_X; 
let py;

const goalX = 55 * SCALE_X;
const goalTop = 240 * SCALE_Y;
const goalBottom = 353 * SCALE_Y;

let ballX, ballY, ballStartY, ballTargetY;
let ballSpeed = 4;
let ballActive = false;
const ballSize = 14 * ((SCALE_X + SCALE_Y) / 2);

let temCurva = false;
let curvaProgresso = 0.6; 
let ballMidY = 0;        

let dificuldade = 0;

let state = "jogando";     
let resultMsg = "";
let resultTimer = 0;
const RESULT_DURATION = 60; 

let placar = { defesas: 0, gols: 0 };

function preload() {
  campo = loadImage("img_campo.png");
  jogador = loadImage("img_jogador.png");
  bola = loadImage("bola.png");
}

function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  py = (goalTop + goalBottom) / 2 - playerH / 2; 
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


function atualizarJogador() {
  if (state !== "jogando") return; 

  if (keyIsDown(87)) {         
    py -= playerSpeed;
  } else if (keyIsDown(83)) {   
    py += playerSpeed;
  }
  py = constrain(py, goalTop, goalBottom - playerH);
}

function novaBola() {
  ballX = width - 60;
  ballStartY = random(30, height - 30);
  ballY = ballStartY;
  ballTargetY = random(goalTop + ballSize, goalBottom - ballSize);
  ballSpeed = random(8, 12) + dificuldade; 
  ballActive = true;
  state = "jogando";


  temCurva = random() < 0.55;
  if (temCurva) {
    curvaProgresso = random(0.45, 0.75);
    ballMidY = random(goalTop + ballSize, goalBottom - ballSize);
  }
}


function atualizarBola() {
  const distanciaTotal = (width - 60) - goalX;
  const progresso = constrain((width - 60 - ballX) / distanciaTotal, 0, 1);

  if (temCurva) {
    if (progresso < curvaProgresso) {
      const p = progresso / curvaProgresso;
      ballY = lerp(ballStartY, ballMidY, p);
    } else {
      const p = (progresso - curvaProgresso) / (1 - curvaProgresso);
      ballY = lerp(ballMidY, ballTargetY, p);
    }
  } else {
    ballY = lerp(ballStartY, ballTargetY, progresso);
  }

  ballX -= ballSpeed;

  if (colidiu(ballX, ballY, px, py)) {
    finalizarJogada("DEFESA!", true);
    return;
  }

  if (ballX <= goalX) {
    ballX = goalX;
    finalizarJogada("GOL!", false);
  }
}


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
    dificuldade += 0.6; 
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