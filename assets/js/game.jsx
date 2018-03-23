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
        this.state.player = resp.player;
        this.gotView(resp);
    })
    .receive("error", resp => { console.log("Unable to join", resp) });
    this.channel.on("join_game", resp => {
      if (!this.has_opponents && this.state.game_name == resp.game.game_name) {
      	this.gotView(resp);
      }
    });
    this.channel.on("guess", resp => {
      if (this.state.game_name == resp.game.game_name) {
        this.gotView(resp);
      }
    });
  }

  challenge_guess_your_opponent(game_name, player_name, challenge) {
    this.channel.push("join_game", {game_channel: "guess_your_opponent", game_name: game_name, player_name: player_name, challenge: challenge})
    .receive("ok", this.gotView.bind(this))
  }

  guess_guess_your_opponent(game_name, player_name, guess) {
    this.channel.push("guess", {game_channel: "guess_your_opponent", game_name: game_name, player_name: player_name, guess: guess})
      .receive("ok", resp => {
        this.gotView(resp);
      });
  }

  gotView(view) {
    if (view.game.player_state) {
    this.setState({
        player: this.state.player,
        game_list: view.game.games,
        player_state: view.game.player_state,
        has_opponent: view.game.has_opponent,
        game_name: view.game.game_name
      });
    } else {
      this.setState({
        player: this.state.player,
        game_list: view.game.games,
        player_state: null,
        has_opponent: false,
        game_name: ""
      });
    }
    if(view.result) {
      console.log(view.result);
      this.state.result = view.result;
      this.setState(this.state);
    }
    if(view.game.winner){
      this.state.winner = view.game.winner;
      this.setState(this.state);
    }
    if (this.state.has_opponent) {
      this.update_track();
      this.setState(this.state);
    }
    console.log(this.state);
  }

  update_track() {
    if (this.state.player_state.player_state.id == 1) {
      changePosCar(this.state.player_state.player_state.score, "car1");
      changePosCar(this.state.player_state.player_state.opponent_score, "car2");
    } else {
      changePosCar(this.state.player_state.player_state.score, "car2");
      changePosCar(this.state.player_state.player_state.opponent_score, "car1");
    }
    if(this.state.winner && this.state.winner == this.state.player){
      if (this.state.player_state.player_state.id == 1) {
        document.getElementById("car1").style.right = "87.5%";
      }
      else {
        document.getElementById("car2").style.right = "87.5%";
      }
    }
    if (this.state.winner && this.state.winner == this.state.player_state.player_state.opponent_name){
      console.log("opponent")
      if (this.state.player_state.player_state.id == 1) {
        document.getElementById("car2").style.right = "87.5%";
      }
      else {
        document.getElementById("car1").style.right = "87.5%";
      }
    }
  }


  render() {
    if (!this.state.has_opponent) {

      if(!this.state.player_state){

      let game_list = _.map(this.state.game_list, (game, ii) => {
        return <GameInstance player={this.state.player} game={game} challenge_guess_your_opponent={this.challenge_guess_your_opponent.bind(this)} key={ii} />;
      });
      return (
        <div className="row">
            <h1>Guess Your Opponent: Welcome {this.state.player}</h1>
            <RuleList />
            <GameInfo />
          <GuessOpponentGame player={this.state.player} challenge_guess_your_opponent={this.challenge_guess_your_opponent.bind(this)} />
          <p>
            <h3>Existing Games:</h3><br/>
            <h3>Join:</h3>
            { game_list }<br/>
            <h3>Full games:(view only)</h3>
          </p>
        </div>
      )
    } else {
        return (
          <div className="row">
              <h1>Guess Your Opponent: Welcome {this.state.player}</h1>
              <h1 id="wait"> Waiting for player to join........</h1>
              <RuleList />
          </div>
        )
      }
    } else {
      let nums = _.map(this.state.player_state.player_state.guess_list, (num, ii) => {
        return <RenderList num={num}  game_name={this.state.game_name}
  player_name={this.state.player} guess_guess_your_opponent={this.guess_guess_your_opponent.bind(this)} key={ii}/>;
      });

      let guesses = _.map(this.state.player_state.player_state.guess_list, (num, ii) => {
        return <RenderGuessList num={num} key={ii}/>;
      });

      if( this.state.winner){
        return (
          <div className="rows flex-container">
            <p>
            <div id="game-stuff">
              <div className="cols">
                <pre/>Winner is:<span>{this.state.winner}</span>
            </div>
            <div>
              Stats:<br></br>
            <p>Guesses in this round:</p>
              {guesses}
              <GameStats state={this.state}/>
            </div>
          </div>
          <br></br>
          <div id="car-stuff">
            <img src="/images/1.png" id="car1"></img><img src="/images/finish.png" className="endline"></img><br></br>
            <img src="/images/2.png" id="car2"></img><img src="/images/finish.png" className="endline"></img>
          </div>
          </p>
        </div>
        )
      } else {
      return (
        <div className="rows flex-container">
          <div id="game-stuff">
            <p>
            <div className="cols">
              &nbsp;Welcome player:<span>{this.state.player}</span>
          </div>
          <div className="cols cols-3">
            <pre/>&nbsp;List of Numbers:<br></br>
            <ul>{nums}</ul>
          </div><br></br>
          <div>
            <pre/>&nbsp;Guessed Numbers:<br/><br/>
            <ul>{guesses}</ul>
          </div>
          <br></br>
          <div>
          <pre/>&nbsp;Clue:<b>{this.state.result}</b></div>
          </p>
        </div>
        <br></br>
        <div id="car-stuff">
          <img src="/images/1.png" id="car1"></img><img src="/images/finish.png" className="endline"></img><br></br>
          <img src="/images/2.png" id="car2"></img><img src="/images/finish.png" className="endline"></img>
        </div>
      </div>
    )
  }
}
}
}

function GuessOpponentGame(params) {
  return (
    <div className="info col-12">
      <span>
        <p><input type="text" id="challenge" placeholder="Challenge Number" /></p>
        <p><input type="text" id="game-name" placeholder="New Game Name" /></p>
        <p><input type="button" onClick={() =>
            params.challenge_guess_your_opponent(document.getElementById("game-name").value,
            params.player, document.getElementById("challenge").value)} value="Challenge" /></p>
        </span>
      </div>
    )
  }

  function GameInstance(params) {
    return (<div className="col-6 game-item" onClick={() =>
    params.challenge_guess_your_opponent(params.game, params.player, document.getElementById("challenge").value)}>
    Join {params.game}
  </div>)
}

function RenderList(props) {
  let listData = props.num;
  let num = listData.number;

  return (
    <span className="rows">
      <li>
        <span className="cols-3" id="num" onClick={()=> props.guess_guess_your_opponent(props.game_name, props.player_name, num)}>
          {num}
        </span>
      </li>
    </span>
  )
}

function RenderGuessList(props) {
  let listData = props.num;
  let num = listData.number;
  let click = listData.click;

  if(click === true){
    return (
      <span className="rows">
        <span id="guess">
          {num}
        </span>
      </span>
    )
  }
  else{
    return null;
  }
}

function changePosCar(value, car_id) {
  let car = document.getElementById(car_id);
  if (car) {
    let x = document.getElementById(car_id).style.right;
    if (x) {
      document.getElementById(car_id).style.right = value + "px";
    } else {
      value = value + 1;
      document.getElementById(car_id).style.right = value + "px";
    }
  }
}

function GameInfo(){
  return(
    <table>
      <tbody>
        <tr>
          <th><b>How to join:</b></th>
        </tr>
        <tr>
          <td>
            You can join any of the existing games(if any) or Issue a new game challenge!
          </td>
        </tr>
        <tr>
          <td>
            <b>To start a new Game:</b>
          </td>
        </tr>
        <tr>
          <td>
            Enter a challenge number for your opponent to guess.
          </td>
        </tr>
        <tr>
          <td>
            And enter a new game name (it should be unique from the existing ones)
          </td>
        </tr>
        <tr>
          <td>
            <b>To join an existing Game:</b>
          </td>
        </tr>
        <tr>
          <td>
            Enter a challenge number for your opponent to guess.
          </td>
        </tr>
        <tr>
          <td>
            And click on the game you want to join from the exisitng game list.
          </td>
        </tr>
    </tbody>
  </table>
  )
}

function RuleList() {
  return(
    <table>
      <tbody>
      <tr>
        <th> RULES:</th>
      </tr>
      <tr>
        <td>1. You will guess the number choosen by your opponent from the list of numbers.</td>
      </tr>
      <tr>
        <td>2. For each guess you will get a clue about your distance from the correct guess.</td>
      </tr>
      <tr>
        <td>3. The <b>clues</b> will be like </td>
      </tr>
      <tr>
        <td> a) very_high => Your guess is very large than the number.
        </td>
      </tr>
      <tr>
        <td> b) very_low => Your guess is very small than the number.
        </td>
      </tr>
      <tr>
        <td> c) high => Your guess is just large than the number.
        </td>
      </tr>
      <tr>
        <td> d) low => Your guess is just small than the number.
        </td>
      </tr>
      <tr>
        <td> e) match => Your guess is correct.
        </td>
      </tr>
        <tr>
          <td><b>Hint:</b>
          </td>
        </tr>
        <tr>
          <td> <i>To win you must try to click as minimum tiles as possible.</i>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

function GameStats(params){
  return(
    <table>
    <tbody>
      <tr><td>Game Name:</td><td>{params.state.game_name}</td></tr>
      <tr><td>Name:</td><td>{params.state.player}</td></tr>
        <tr><td>Opponent's Name:</td><td>{params.state.player_state.player_state.opponent_name}</td></tr>
        <tr><td>Your score:</td><td>{params.state.player_state.player_state.score}</td></tr>
        <tr><td>Opponent's Score:</td><td>{params.state.player_state.player_state.opponent_score}</td></tr>
      <tr><td>Clicks:</td><td>{params.state.player_state.player_state.clicks}</td></tr>

    </tbody></table>
  )
}
