
const gBoard = (function () {
    const board = [];

    for(let i = 0; i < 3; i++){
        board[i] = [];
        for(let o = 0; o < 3; o++){
            board[i].push('');
        }
    }

    const clear = () => {
        board.map((row) => {row.map((_, i) => row[i] = '')});
    }

    const placeMark = (mark, row = 1, col = 1) => {
        if(row < 1 || row > 3) throw new RangeError(`Error in gBoard.placeMark() - row must be 1-3. Given [row: ${row}:${typeof row}]`);
        if(col < 1 || col > 3) throw new RangeError(`Error in gBoard.placeMark() - col must be 1-3. Given [col: ${col}:${typeof col}]`);
        if(board[row - 1][col - 1] === ''){
            board[row - 1][col - 1] = mark;
            return true;
        } else throw new Error(`Error in gBoard.placeMark() - cell at [row: ${row}][col: ${col}] is taken`)
    }

    const logBoard = () => {
        console.log('_______');
        board.map(row => {
            let str = '|';
            row.map(v => str = str + ((v != '') ? v : ' ') + '|');
            console.log(str);
        });
        console.log('‾‾‾‾‾‾‾');
    }
    return {board, clear, placeMark, logBoard};
})();

function createPlayer(playerName, playerMark){
    let mark;
    let name;

    if(playerMark === 'x' || playerMark === 'o') mark = playerMark;
    else throw new RangeError("Error creating player - createPlayer() requires playerMark to be 'x' or 'o'");

    if(playerName.length >= 3) name = playerName;
    else throw new RangeError("Error creating player - createPlayer() requires playerName to be at least 3 chars");

    return {name, mark};
};

const gameInst = (function () {
    const players = [];

    const registerPlayer = (playerName, playerMark) => {
        if(players.length < 2){
            const markTaken = players.some(v => v.mark == playerMark);
            if(markTaken) throw new RangeError("Error in gameInst.registerPlayer() - Player Mark already taken");
            else{
                players.push(createPlayer(playerName, playerMark));
            }
        }else throw new Error("Error in gameInst.registerPlayer() - Too many players");
    };
    const deletePlayer = (playerMark) => {
        players.forEach((v, i) => {
            if(v.mark == playerMark){
                players.splice(i, 1);
                return true;
            }
        });
        throw new Error(`Error in gameInst.deletePlayer() - Couldn't find player with [mark: ${playerMark}:${typeof playerMark}]`);
    };
    const playGame = () => {
        gBoard.clear();
        for(let round = 0; round <= 8; round++){
            const result = takeTurn(players[round % 2]);
            if(result){
                console.log(`${players[round % 2].name} wins!`);
                return;
            }
        }
        console.log('Tie!')
    };
    const takeTurn = (player, row, col) => {

        if(gBoard.placeMark(player.mark, row, col)){
            const rowWin = gBoard.board[row - 1].every(v => v == player.mark);
            const colWin = gBoard.board.every(r => r[col - 1] == player.mark);
            const diagWin1 = (gBoard.board[0][0] == player.mark) && (gBoard.board[1][1] == player.mark) && (gBoard.board[2][2] == player.mark);
            const diagWin2 = (gBoard.board[0][2] == player.mark) && (gBoard.board[1][1] == player.mark) && (gBoard.board[2][0] == player.mark);
            if(rowWin || colWin || diagWin1 || diagWin2) return true;
            else return false;
        };
    };

    return {registerPlayer, deletePlayer, playGame, players};
})();

const gameInterface = (function () {

})();

