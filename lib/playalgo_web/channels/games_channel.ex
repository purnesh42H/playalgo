defmodule PlayalgoWeb.GamesChannel do
  use PlayalgoWeb, :channel

  alias Playalgo.Game

  defp form_leaderboard_response(leaderboard, new_leaderboard, rank, rem) when rem == 0 do
    new_leaderboard
  end

  defp form_leaderboard_response(leaderboard, new_leaderboard, rank, rem) do
    player = (hd leaderboard)
    key = elem(player, 0)
    val = elem(player, 1)
    new = Map.put_new(%{}, key, val)
    new = Map.put(new, :rank, rank)
    form_leaderboard_response((tl leaderboard), new_leaderboard ++ [new], rank + 1, rem - 1)
  end

  def join("games:" <> name, payload, socket) do
    if authorized?(payload) do
      game = Playalgo.GameBackup.load(name) || Game.new()
      socket = socket
      |> assign(:game, game)
      |> assign(:name, name)

      response = nil
      if payload["type"] == "player" do
        response = {:ok, %{"join" => name, "game" => Game.client_view(game, name, payload["player"]), "player" => payload["player"]}, socket}
      end
      if payload["type"] == "viewer" do
        response = {:ok, %{"join" => name, "view" => Game.viewer_view(game, name, payload["player"]), "player" => payload["player"]}, socket}
      end
    else
      response = {:error, %{reason: "unauthorized"}}
    end
    response
  end

  # Channels can be used in a request/response fashion
  # by sending replies to requests from the client
  def handle_in("join_game", %{"game_channel" => game_channel, "game_name" => game_name,
    "player_name" => player_name, "challenge" => challenge}, socket) do
    game = Game.join(socket.assigns[:game], game_channel, game_name, player_name, challenge)
    Playalgo.GameBackup.save(socket.assigns[:name], game)
    socket = assign(socket, :game, game)
    opponent_name = Game.get_opponent_name(game, game_channel, game_name, player_name)
    if opponent_name != "" do
      broadcast socket, "join_game", %{ "game" => Game.client_view(game, game_channel, game_name, opponent_name),
        "view" => Game.viewer_view(game, game_channel, game_name, player_name)}
    end
    {:reply, {:ok, %{ "game" => Game.client_view(game, game_channel, game_name, player_name)}}, socket}
  end

  def handle_in("join_game", %{"game_channel" => game_channel, "game_name" => game_name,
    "player_name" => player_name}, socket) do
    game = Playalgo.GameBackup.load(game_channel)
    Playalgo.GameBackup.save(socket.assigns[:name], game)
    socket = assign(socket, :game, game)
    opponent_name = Game.get_opponent_name(game, game_channel, game_name, player_name)
    if opponent_name != "" do
      broadcast socket, "join_game", %{ "game" => Game.client_view(game, game_channel, game_name, opponent_name),
        "view" => Game.viewer_view(game, game_channel, game_name, player_name)}
    end
    {:reply, {:ok, %{ "game" => Game.client_view(game, game_channel, game_name, player_name)}}, socket}
  end

  def handle_in("guess", %{"game_channel" => game_channel,
    "game_name" => game_name, "player_name" => player_name, "guess" => guess}, socket) do
    game = Playalgo.GameBackup.load(game_channel)
    {res, game} = Game.guess(game, game_channel, game_name, player_name, guess)
    Playalgo.GameBackup.save(socket.assigns[:name], game)
    socket = assign(socket, :game, game)
    opponent_name = Game.get_opponent_name(game, game_channel, game_name, player_name)
    if opponent_name != "" do
      broadcast socket, "guess", %{ "game" => Game.client_view(game, game_channel, game_name, opponent_name),
        "view" => Game.viewer_view(game, game_channel, game_name, player_name)}
    end
    {:reply, {:ok, %{ "game" => Game.client_view(game, game_channel, game_name, player_name), "result" => res}}, socket}
  end

  def handle_in("view_game", %{"game_channel" => game_channel, "game_name" => game_name,
    "player_name" => player_name}, socket) do
    game = Game.view(socket.assigns[:game], game_channel, game_name, player_name)
    socket = assign(socket, :game, game)
    {:reply, {:ok, %{ "view" => Game.viewer_view(game, game_channel, game_name, player_name)}}, socket}
  end

  def handle_in("leaderboard", %{"game_channel" => game_channel}, socket) do
    game = Playalgo.GameBackup.load(game_channel) || Game.new()
    socket = assign(socket, :game, game)
    leaderboard = Game.leaderboard(game, game_channel)
    leaderboard = form_leaderboard_response(leaderboard, [], 1, length(leaderboard))
    {:reply, {:ok, %{ "leaderboard" => leaderboard}}, socket}
  end

  def handle_in("chat", %{"game_channel" => game_channel}, socket) do
    game = Playalgo.GameBackup.load(game_channel) || Game.new()
    socket = assign(socket, :game, game)
    chat = Game.chat(game, game_channel)
    {:reply, {:ok, %{ "chat" => chat}}, socket}
  end

#Attribution: https://elixircasts.io/chat-room-in-8-minutes

  def handle_in("shout",  %{"game_channel" => game_channel, "name" => name, "type" => type, "body" => body }, socket) do
    game = Playalgo.GameBackup.load(game_channel) || Game.new()
    game = Game.shout(game, game_channel, name, type, body)
    Playalgo.GameBackup.save(socket.assigns[:name], game)
    socket = assign(socket, :game, game)
    broadcast socket, "shout", %{ "chat" => Game.chat(game, game_channel)}
    {:noreply ,socket}
  end

  # Add authorization logic here as required.
  defp authorized?(_payload) do
    true
  end
end
