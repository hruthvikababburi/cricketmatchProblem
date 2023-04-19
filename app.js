const express = require("express");
const app = express();

app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
    process.exit(1);
  }
};

const convertToResponseObjPlayersList = (each) => {
  return {
    playerId: each.player_id,
    playerName: each.player_name,
  };
};

const convertToResponseObjMatchDetails = (each) => {
  return {
    matchId: each.match_id,
    match: each.match,
    year: each.year,
  };
};

const convertToResponseObjPlayersStats = (each) => {
  return {
    playerId: each.player_id,
    playerName: each.player_name,
    totalScore: each["SUM(score)"],
    totalFours: each["SUM(fours)"],
    totalSixes: each["SUM(sixes)"],
  };
};

initializeDbAndServer();

//get players list
app.get("/players/", async (request, response) => {
  const getPlayersDetailsQuery = `
    SELECT *
    FROM player_details;`;
  const getPlayersList = await db.all(getPlayersDetailsQuery);
  response.send(
    getPlayersList.map((eachObj) => convertToResponseObjPlayersList(eachObj))
  );
});

//get specific player based on playerid
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId};`;
  const getPlayer = await db.get(getPlayerQuery);
  response.send(convertToResponseObjPlayersList(getPlayer));
});

//update player by id
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerDetailsQuery = `
    UPDATE player_details
    SET player_name = '${playerName}';`;
  const updatePlayerDetails = await db.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

//get match details of specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};`;
  const getMatchDetails = await db.get(getMatchDetailsQuery);
  response.send(convertToResponseObjMatchDetails(getMatchDetails));
});

//get all matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchIdQuery = `
    SELECT match_id, match, year
    FROM player_match_score NATURAL JOIN match_details
    WHERE player_id = ${playerId};`;
  const matchId = await db.all(getMatchIdQuery);
  response.send(matchId.map((each) => convertToResponseObjMatchDetails(each)));
});

//get players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerIdQuery = `
    SELECT player_id AS playerId, player_name AS playerName
    FROM player_match_score NATURAL JOIN player_details
    WHERE match_id = ${matchId};`;
  const playerIds = await db.all(getPlayerIdQuery);
  response.send(playerIds);
});

//get playerid,name,totals of -scores,fours,sixes
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersStatsQuery = `
    SELECT player_id, player_name, SUM(score), SUM(fours), SUM(sixes)
    FROM player_match_score NATURAL JOIN player_details
    WHERE player_id = ${playerId};`;
  const getPlayersStats = await db.get(getPlayersStatsQuery);
  response.send(convertToResponseObjPlayersStats(getPlayersStats));
});

module.exports = app;
