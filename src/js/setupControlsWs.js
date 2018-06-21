function setup(code) {
  let ws = new WebSocket('ws:192.168.1.38:3002?code=' + code);
 
  ws.onopen = () => {
    this.setState({ mode: 'wait' }); 
  }

  ws.onclose = () => {
    alert('websocket closed');
  }

  ws.onmessage = msg => {
    let data = JSON.parse(msg.data); 

    switch(data.type) {
      case 'SET_COLOR':
        this.setState({ colorIndex: data.colorIndex });
        break;
      case 'GAME_OVER':
        this.setState({ mode: 'game-over' });
        break;
      case 'WINNER':
        this.setState({ isWinner: true, mode: 'game-over' });
        break;
      case 'START_GAME':
        this.setState({ mode: 'play' });
        break;
      case 'START_SCREEN':
        this.setState({ mode: 'connect-start' });
        ws.close();
        break;
      case 'ERR':
        switch(data.code) {
        case 404:
          alert('game not found');
          //game not found
          break;
        case 405:
          alert('game is full');
          //game is full
          break;
        }
       break;

      default:
        alert('not such case in client socket switch');
        break;
    }
  }
  
  ws.onerror = function(e) {
    alert('client socket err ' + e.code); 
  }

  return ws;
}

export default setup;
