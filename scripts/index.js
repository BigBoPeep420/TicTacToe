const gameBoard = (function () {
  const board = [];

  for (let i = 0; i < 3; i++) {
    board[i] = [];
    for (let o = 0; o < 3; o++) {
      board[i].push("");
    }
  }

  const clear = () => {
    board.map((row) => {
      row.map((_, i) => (row[i] = ""));
    });
  };
  const placeMark = (mark, row = 1, col = 1) => {
    if (row < 1 || row > 3)
      throw new RangeError(
        `Error in gBoard.placeMark() - row must be 1-3. Given [row: ${row}:${typeof row}]`,
      );
    if (col < 1 || col > 3)
      throw new RangeError(
        `Error in gBoard.placeMark() - col must be 1-3. Given [col: ${col}:${typeof col}]`,
      );
    if (board[row - 1][col - 1] === "") {
      board[row - 1][col - 1] = mark;
      return true;
    } else
      throw new Error(
        `Error in gBoard.placeMark() - cell at [row: ${row}][col: ${col}] is taken`,
      );
  };
  const getEmptyCells = () => {
    const empties = [];
    board.map((row, rowInd) => {
      row.map((cell, colInd) => {
        if (cell == "") empties.push({ row: rowInd + 1, col: colInd + 1 });
      });
    });
    return empties;
  };
  const logBoard = () => {
    console.log("_______");
    board.map((row) => {
      let str = "|";
      row.map((v) => (str = str + (v != "" ? v : " ") + "|"));
      console.log(str);
    });
    console.log("‾‾‾‾‾‾‾");
  };
  const isCellEmpty = (row, col) => {
    if (board[row - 1][col - 1] == "") return true;
    else return false;
  };

  return { board, clear, placeMark, logBoard, getEmptyCells, isCellEmpty };
})();

const gameInstance = (function () {
  const players = { 1: null, 2: null };
  const callbacks = {
    onturnchange: null,
    onmarkplace: null,
    ongamewin: null,
    ongametie: null,
  };
  let currentPlayer;
  let inputLocked = true;

  const playGame = () => {
    gameBoard.clear();
    currentPlayer = Math.random() >= 0.4 ? players[1] : players[2];
    if (callbacks.onturnchange)
      callbacks.onturnchange(currentPlayer == players[1] ? 1 : 2);
    inputLocked = false;
    if (currentPlayer.getInfo().type === "npc") npcTurn();
  };
  const playTurn = (row, col) => {
    if (inputLocked) return;
    if (!gameBoard.placeMark(currentPlayer.getInfo().mark, row, col)) return;
    if (callbacks.onmarkplace)
      callbacks.onmarkplace(currentPlayer.getInfo().mark, row, col);
    const winRes = checkWin(row, col);
    if (winRes) {
      if (winRes === "win") {
        const winner = currentPlayer == players[1] ? 1 : 2;
        if (callbacks.ongamewin) callbacks.ongamewin(winner);
      } else {
        if (callbacks.ongametie) callbacks.ongametie();
      }
      inputLocked = true;
      return;
    }
    changeTurn();
  };
  const changeTurn = () => {
    currentPlayer = currentPlayer == players[1] ? players[2] : players[1];
    if (callbacks.onturnchange)
      callbacks.onturnchange(currentPlayer == players[1] ? 1 : 2);
    if (currentPlayer.getInfo().type == "npc") npcTurn();
  };
  const checkWin = (row, col) => {
    const currentMark = gameBoard.board[row - 1][col - 1];
    const rowWin = gameBoard.board[row - 1].every((v) => v == currentMark);
    const colWin = gameBoard.board.every((row) => row[col - 1] == currentMark);
    const diagWin =
      gameBoard.board[1][1] == currentMark &&
      ((gameBoard.board[0][0] == currentMark &&
        gameBoard.board[2][2] == currentMark) ||
        (gameBoard.board[0][2] == currentMark &&
          gameBoard.board[2][0] == currentMark));
    if (rowWin || colWin || diagWin) return "win";
    else if (gameBoard.getEmptyCells().length <= 0) return "tie";
    else return false;
  };
  const npcTurn = () => {
    inputLocked = true;
    setTimeout(() => {
      const empties = gameBoard.getEmptyCells();
      const pick = empties[Math.floor(Math.random() * empties.length)];
      inputLocked = false;
      playTurn(pick.row, pick.col);
    }, 2000);
  };
  const setCallbacks = (newCallbacks) => {
    for (let cb in callbacks) {
      if (cb in newCallbacks) callbacks[cb] = newCallbacks[cb];
    }
  };
  const getWaiting = () => {
    return inputLocked;
  };

  return { players, playGame, playTurn, setCallbacks, getWaiting };
})();

const gameInterface = (function () {
  const elements = {
    notifcation: document.getElementById("notification"),
    displayBoard: document.getElementById("gameBoard"),
    editPlayers: document.getElementById("editPlayers"),
    p1Sel: document.getElementById("player1ControlSel"),
    p2Sel: document.getElementById("player2ControlSel"),
    p1NameInp: document.getElementById("player1NameInput"),
    p2NameInp: document.getElementById("player2NameInput"),
    p1MarkSel: document.getElementById("player1MarkSel"),
    p2MarkSel: document.getElementById("player2MarkSel"),
    p1Name: document.getElementById("player1Name"),
    p1Mark: document.getElementById("player1Mark"),
    p1Won: document.getElementById("player1Won"),
    p2Name: document.getElementById("player2Name"),
    p2Mark: document.getElementById("player2Mark"),
    p2Won: document.getElementById("player2Won"),
    gameInfo: document.getElementById("gameInfo"),
    p1Info: document.getElementById("player1Info"),
    p2Info: document.getElementById("player2Info"),
    gamesPlayed: document.getElementById("gamesPlayed"),
    highlight: document.getElementById("playerHighlight"),
    helpDlg: document.getElementById("helpDialog"),
  };
  let notifTimer = null;
  gameInstance.players[1] = createPlayer("human", "Odin", "x");
  gameInstance.players[2] = createPlayer("npc", "NPC", "o");
  updatePlayersInfo();
  gameInstance.setCallbacks({
    onmarkplace: placeMark,
    ongametie: onGameTie,
    onturnchange: onTurnChange,
    ongamewin: onGameWin,
  });

  document.addEventListener("click", (e) => {
    let targ = e.target.closest(".cell");
    if (targ) {
      e.preventDefault();
      const row = targ.dataset.row;
      const col = targ.dataset.col;
      if (!gameBoard.isCellEmpty(row, col)) return;
      if (!gameInstance.getWaiting()) {
        gameInstance.playTurn(row, col);
      }
      return;
    }

    targ = e.target.closest("#editPlayersBtn");
    if (targ) {
      e.preventDefault();
      showEditPlayers(true);
      return;
    }

    targ = e.target.closest("#editPlayers .close");
    if (targ) {
      e.preventDefault();
      showEditPlayers(false);
      return;
    }

    targ = e.target.closest("#startGameBtn");
    if (targ) {
      e.preventDefault();
      const num = parseInt(elements.gamesPlayed.textContent);
      elements.gamesPlayed.textContent = num + 1;
      gameInstance.playGame();
      changeHighlightColor();
      elements.displayBoard.querySelectorAll("svg use").forEach((v) => {
        const newUse = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "use",
        );
        v.replaceWith(newUse);
      });
      return;
    }

    targ = e.target.closest("#help");
    if (targ) {
      e.preventDefault();
      elements.helpDlg.showPopover();
      return;
    }

    targ = e.target.closest("#helpDialog .close");
    if (targ) {
      e.preventDefault();
      elements.helpDlg.hidePopover();
    }
  });
  elements.p1Sel.addEventListener("change", (e) => {
    updateEditPlayersInputs(1);
  });
  elements.p2Sel.addEventListener("change", (e) => {
    updateEditPlayersInputs(2);
  });
  elements.p1MarkSel.addEventListener("change", (e) => {
    if (e.target.value == "x") elements.p2MarkSel.value = "o";
    else elements.p2MarkSel.value = "x";
  });
  elements.p2MarkSel.addEventListener("change", (e) => {
    if (e.target.value == "x") elements.p1MarkSel.value = "o";
    else elements.p1MarkSel.value = "x";
  });
  editPlayers.querySelector("form").addEventListener("submit", (e) => {
    gameInstance.players[1].setName(elements.p1NameInp.value);
    gameInstance.players[1].setType(elements.p1Sel.value);
    gameInstance.players[1].setMark(elements.p1MarkSel.value);
    gameInstance.players[2].setName(elements.p2NameInp.value);
    gameInstance.players[2].setType(elements.p2Sel.value);
    gameInstance.players[2].setMark(elements.p2MarkSel.value);
    updatePlayersInfo();
    showEditPlayers(false);
  });

  function notify(icon = "iconWarn", message = []) {
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `/styles/icons.svg#${icon}`);
    notification.querySelector(".icon use").replaceWith(use);
    const para = notification.querySelector(".message");
    para.replaceChildren();
    if (!message[0] || message[0] == "") {
      const p = document.createElement("p");
      p.textContent =
        "Uh oh. Someone forgot to put a notification message here.";
      para.append(p);
    } else {
      message.forEach((v) => {
        const p = document.createElement("p");
        p.textContent = v;
        para.append(p);
      });
    }
    if (notifTimer) {
      clearTimeout(notifTimer);
      notifTimer = null;
    }
    notifTimer = setTimeout(() => {
      notification.hidePopover();
      clearTimeout(notifTimer);
      notifTimer = null;
    }, 5000);
    notification.showPopover();
  }
  function showEditPlayers(bool) {
    if (bool) {
      updateEditPlayersInputs(1);
      updateEditPlayersInputs(2);
      elements.p1MarkSel.value = gameInstance.players[1].getInfo().mark;
      elements.p2MarkSel.value = gameInstance.players[2].getInfo().mark;
      elements.editPlayers.showPopover();
    } else elements.editPlayers.hidePopover();
  }
  function updateEditPlayersInputs(playerNum) {
    let player;
    let sel;
    let inp;
    if (playerNum == 1) {
      player = gameInstance.players[1];
      sel = elements.p1Sel;
      inp = elements.p1NameInp;
    } else {
      player = gameInstance.players[2];
      sel = elements.p2Sel;
      inp = elements.p2NameInp;
    }

    if (sel.value == "npc") {
      inp.value = "NPC";
      inp.classList.add("hidden");
    } else {
      inp.value = player.getInfo().name;
      inp.classList.remove("hidden");
    }
  }
  function updatePlayersInfo() {
    elements.p1Name.textContent = gameInstance.players[1].getInfo().name;
    elements.p1Mark.textContent = gameInstance.players[1]
      .getInfo()
      .mark.toUpperCase();
    elements.p2Name.textContent = gameInstance.players[2].getInfo().name;
    elements.p2Mark.textContent = gameInstance.players[2]
      .getInfo()
      .mark.toUpperCase();
    resetScores();
  }
  function onGameTie() {
    moveHighlight(1, true);
    changeHighlightColor("#ffe60038");
  }
  function onGameWin(player) {
    moveHighlight(player);
    changeHighlightColor("#52ce0044");
    const num = parseInt(elements[`p${player}Won`].textContent);
    elements[`p${player}Won`].textContent = num + 1;
  }
  function placeMark(mark, row, col) {
    const iconID = `/styles/icons.svg?v=1#${mark === "x" ? "iconCross" : "iconCircle"}`;
    const newUse = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "use",
    );
    newUse.setAttribute("href", iconID);
    const svg = elements.displayBoard.querySelector(
      `[data-row="${row}"][data-col="${col}"] svg`,
    );
    svg.querySelector("use").replaceWith(newUse);
  }
  function onTurnChange(player) {
    moveHighlight(player);
  }
  function resetScores() {
    elements.p1Won.textContent = "0";
    elements.p2Won.textContent = "0";
  }
  function moveHighlight(playerNum, tie = false) {
    const targ = playerNum === 1 ? elements.p1Info : elements.p2Info;
    const outerRect = elements.gameInfo.getBoundingClientRect();
    const infoRect = targ.getBoundingClientRect();
    const left = infoRect.left - outerRect.left;
    const top = infoRect.top - outerRect.top;
    elements.highlight.style.width = tie
      ? `${outerRect.width}px`
      : `${infoRect.width}px`;
    elements.highlight.style.height = `${infoRect.height}px`;
    elements.highlight.style.transform = tie
      ? "translate(0, 0)"
      : `translate(${left}px, ${top}px)`;
  }
  function changeHighlightColor(hex) {
    if (!hex) elements.highlight.style.backgroundColor = "#0000001a";
    else elements.highlight.style.backgroundColor = hex;
  }
})();

function createPlayer(playerType, playerName, playerMark) {
  let mark;
  let name;
  let type;

  const setMark = (newMark) => {
    if (newMark === "x" || newMark === "o") mark = newMark;
    else
      throw new RangeError(
        "Error in createPlayer().setMark() - Requires mark to be 'x' or 'o'",
      );
  };

  const setName = (newName) => {
    if (newName.length >= 3) name = newName;
    else
      throw new RangeError(
        "Error in createPlayer().setName() - Requires name to be at least 3 chars",
      );
  };

  const setType = (newType) => {
    if (newType == "npc" || newType == "human") type = newType;
    else {
      throw new RangeError(
        "Error in createPlayer().setType() - Requires type " +
          `to be 'npc' or 'human'. Given: [Type: ${newType}:${typeof newType}]`,
      );
    }
  };

  const getInfo = () => {
    return { type, name, mark };
  };

  setMark(playerMark);
  setName(playerName);
  setType(playerType);

  return { getInfo, setMark, setName, setType };
}
