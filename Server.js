const express = require('express');
const app = express(); 
const path = require('path');
const ws = require('express-ws')(app);
var url = require('url');

//const playerMasterWs = new ws.Server({ port: 3002 });
//const gameMasterWs = new ws.Server({ port: 3001 });

const PlayerMaster = require('./src/server/PlayerMaster.js');
const GameMaster = require('./src/server/GameMaster.js');
const AutoGameMaster = require('./src/server/AutoGameMaster.js');
const Game = require('./src/server/Game.js');
const Player = require('./src/server/Player.js');
const Display = require('./src/server/Display.js');

const port = process.env.PORT || 3000;

let games = [];

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/dist/', express.static(path.join(__dirname, './dist')));

function generateCode() {
  const SYMBOLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
  let code = '';

  for (let i = 0; i < 4; i++) {
    let index = Math.floor(Math.random() * SYMBOLS.length);
    code += SYMBOLS[index]; 
  }

  return code;
}

games.findGame = function(code) {
  for (let i = 0; i < games.length; i++) {
    if (!games[i]) continue;

    if (games[i].code == code) {
      return games[i]; 
    } 
  }
  return null;
}

games.setOnFree = function(game) {
  for (let i = 0; i < games.length + 1; i++) {
    if (!games[i]) {
      game.id = i;
      games[i] = game;
      return i;
    }
  } 
  return null;
}


function getReqCode(req) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  return query.code;
}

app.ws('/display', (ws, req) => {
  let code = getReqCode(req);
  if (process.env.NODE_ENV === 'development') {
    console.log(`got connection to game display with code = ${code}`);
  }

  let game = games.findGame(code); 

  if (!game) {
    console.log(`game with code ${code} not found`);
    ws.send(JSON.stringify({ type: 'ERR', code: 404 }));
    ws.close();
    return;
  }
  
  if (!game.freeDisplaySpaces) {
    console.log(`game with code ${code} all slots are full`);
    ws.send(JSON.stringify({ type: 'ERR', code: 405 }));
    ws.close();
    return;
  }

  let display = new Display(ws, game);
  display.addToGame();

  if (game.masterSet === true) return;
  
  let gameMaster = game.type === 'local' ? new GameMaster(game) :
                                           new AutoGameMaster(game);
  gameMaster.configurate(ws);
});

app.ws('/player', (ws, req) => {
  let code = getReqCode(req);

  console.log(`got connection to game players with code = ${code}`);

  let game = games.findGame(code);
  
  if (!game) {
    console.log(`game with code ${code} not found`);
    ws.send(JSON.stringify({ type: 'ERR', code: 404 }));
    ws.close();
    return;
  }

  if (!game.freePlayerSpaces) {
    console.log(`game with code ${code} all slots are full`);
    ws.send(JSON.stringify({ type: 'ERR', code: 405 }));
    ws.close();
    return;
  }

  let player = new Player(ws, game, customColor = null);
  player.addToGame();
  player.setInitialCoords();
  player.setInitialColor();
  
  game.sendPlayer(player);

  let playerMaster = new PlayerMaster(player); 
  playerMaster.configurate(ws);

  player.sendColor();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/game.html'));
});

app.get('/play', (req, res) => {
  res.sendFile(path.join(__dirname, '/controls.html'));
});

app.post('/generate', (req, res) => {
  let code = generateCode(); 
  while (games.findGame(code)) {
    code = generateCode(); 
  }

  let mode = req.body.mode;
  let type = 'local';

  let game = new Game(code, mode, type, games);

  games.setOnFree(game); 

  res.send(code);
});


app.post('/connect', (req, res) => {
  let code = req.body.code;

  console.log(`try to verify client with code ${code}`);
  
  if(games.findGame(code)) {
    return res.send('true'); 
  }
  console.log('not verified');
  res.send('false');
});

app.post('/play_online', (req, res) => {
  
  //find game with such type   
  //if no - create 
  //send code to player 
});

app.listen(port);


console.log(`Magic on port ${port}`);
