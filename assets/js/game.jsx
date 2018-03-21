import React from 'react';
import ReactDOM from 'react-dom';

export default function game_init(root, channel) {
  ReactDOM.render(<Game channel={channel} />, root);
}

class Game extends React.Component{
  constructor(props)  {
    super(props);
    this.channel = props.channel;
    this.state = {}
    this.channel.join()
      .receive("ok", resp => {
        this.setState({player: resp.player});
	this.gotView(resp);
      })
      .receive("error", resp => { console.log("Unable to join", resp) });
  }
  
  challenge_guess_your_opponent(game_name, player_name, challenge) {
    this.channel.push("join_game", {game_channel: "guess_your_opponent", game_name: game_name, player_name: player_name, challenge: challenge})
      .receive("ok", this.gotView.bind(this))
  }

  gotView(view) {
    this.setState({
      player: this.state.player,
      game_list: view.game
    });
    console.log(this.state);
  }

  render() {
    let game_list = _.map(this.state.game_list, (game, ii) => {
      return <GameInstance player={this.state.player} game={game} challenge_guess_your_opponent={this.challenge_guess_your_opponent.bind(this)} key={ii} />;
    });
    return (
      <div className="row">
          <GuessOpponentGame player={this.state.player} challenge_guess_your_opponent={this.challenge_guess_your_opponent.bind(this)} />
          { game_list }
      </div>
    )
  }
}

function GuessOpponentGame(params) {
  return (
    <div className="info col-12">
    <span><h1>Guess Your Opponent: Welcome {params.player}</h1>
      <p><input type="text" id="challenge" placeholder="Challenge Number" /></p>
      <p><input type="text" id="game-name" placeholder="New Game Name" /></p>
      <p><input type="button" onClick={() =>
        params.challenge_guess_your_opponent(document.getElementById("game-name").value,
        params.player, document.getElementById("challenge").value)} value="Challenge" /></p></span>
    </div>
  )
}

function GameInstance(params) {
  return (<div className="col-6 game-item" onClick={() =>
    params.challenge_guess_your_opponent(params.game, params.player, document.getElementById("challenge").value)}>
      Join {params.game}
  </div>)
}
