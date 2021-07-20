import React, {Component} from 'react';
import {returnPlayerName} from './utils.js';
import ReactCheckers from './ReactCheckers.js';
import Board from './Board.js';
import { Router } from 'react-router-dom'
import createBrowserHistory from 'history/createBrowserHistory'
import Opponent from './Opponent.js';
import Popup from './Popup.js';


const browserHistory = createBrowserHistory();

class App extends Component {

    constructor(props) {
        super(props);

        this.columns = this.setColumns();
    
        this.ReactCheckers = new ReactCheckers(this.columns);
        this.Opponent = new Opponent(this.columns);
        
        this.state = {
            players: null,
            history: [{
                boardState: this.createBoard(),
                currentPlayer: true,
            }],
            activePiece: null,
            moves: [],
            jumpKills: null,
            hasJumped: null,
            stepNumber: 0,
            winner: null,
            popShown: false,
            
        }

        this.aboutPopOpen = this.aboutPopOpen.bind(this);
        this.aboutPopClose = this.aboutPopClose.bind(this);

    }

    setColumns() {
        const columns = {a:0,b:1,c:2,d:3,e:4,f:5,g:6,h:7};
        
        return columns;
    }

    createBoard() {

        let board = {};

        for (let key in this.columns) {
            

            if (this.columns.hasOwnProperty(key)) {
                for (let n = 1; n <= 8 ; ++n) {

                    let row = key + n;
                    board[row] = null;
                }
            }
            
        }

        board = this.initPlayers(board);

        return board;
    }

    initPlayers(board) {
        const player1 = ['a8', 'c8', 'e8', 'g8', 'b7', 'd7', 'f7', 'h7', 'a6', 'c6', 'e6', 'g6',];
        const player2 = ['b3', 'd3', 'f3', 'h3', 'a2', 'c2', 'e2', 'g2', 'b1', 'd1', 'f1', 'h1',];

        let self = this;

        player1.forEach(function (i) {
            board[i] = self.createPiece(i, 'player1');
        });

        player2.forEach(function (i) {
            board[i] = self.createPiece(i, 'player2');
        });

        return board;
    }

    createPiece(location, player) {
        let piece = {};
        
        piece.player   = player;
        piece.location = location;
        piece.isKing   = false;

        return piece;
    }

    getCurrentState() {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        return history[history.length - 1];
    }

    handleClick(coordinates) {

        if (this.state.winner !== null) {
            return;
        }
        
        const currentState = this.getCurrentState();
        const boardState = currentState.boardState;
        const clickedSquare = boardState[coordinates];
        
        // Clicked on a piece
        if (clickedSquare !== null) {

            // Can't select opponents pieces
            if (clickedSquare.player !== returnPlayerName(currentState.currentPlayer)) {
                return;
            }

            // Unset active piece if it's clicked
            if (this.state.activePiece === coordinates && this.state.hasJumped === null) {
                this.setState({
                    activePiece: null,
                    moves: [],
                    jumpKills: null,
                });
                return;
            }

            // Can't choose a new piece if player has already jumped.
            if (this.state.hasJumped !== null && boardState[coordinates] !== null) {
                return;
            }

            // Set active piece
            let movesData = this.ReactCheckers.getMoves(boardState, coordinates, clickedSquare.isKing, false);

            this.setState({
                activePiece: coordinates,
                moves: movesData[0],
                jumpKills: movesData[1],
            });

            return;
        }

        // Clicked on an empty square
        if (this.state.activePiece === null) {
            return;
        }

        // Moving a piece
        if (this.state.moves.length > 0) {
            const postMoveState = this.ReactCheckers.movePiece(coordinates, this.state);
            
            if (postMoveState === null) {
                return;
            }

            this.updateStatePostMove(postMoveState);

            // Start computer move is the player is finished
            if (postMoveState.currentPlayer === false && postMoveState.winner === null) {
                this.computerTurn();
            }
        }
    }

    computerTurn(piece = null) {
        if (this.state.players > 1) {
            return;
        }

        setTimeout(()=> {
            const currentState = this.getCurrentState();
            const boardState = currentState.boardState;

            let computerMove;
            let coordinates;
            let moveTo;

            // If var piece != null, the piece has previously jumped.
            if (piece === null) {
                //computerMove = this.Opponent.getRandomMove(boardState, 'player2');
                computerMove = this.Opponent.getSmartMove(this.state, boardState, 'player2');
                
                coordinates = computerMove.piece;
                moveTo = computerMove.moveTo;
            } else {
                // Prevent the computer player from choosing another piece to move. It must move the active piece
                computerMove = this.ReactCheckers.getMoves(boardState, piece, boardState[piece].isKing, true);
                coordinates = piece;
                moveTo = computerMove[0][Math.floor(Math.random()*computerMove[0].length)];
            }

            const clickedSquare = boardState[coordinates];

            let movesData = this.ReactCheckers.getMoves(boardState, coordinates, clickedSquare.isKing, false);

            this.setState({
                activePiece: coordinates,
                moves: movesData[0],
                jumpKills: movesData[1],
            });

            setTimeout(()=> {
                const postMoveState = this.ReactCheckers.movePiece(moveTo, this.state);

                if (postMoveState === null) {
                    return;
                }

                this.updateStatePostMove(postMoveState);

                // If the computer player has jumped and is still moving, continue jump with active piece
                if (postMoveState.currentPlayer === false) {
                    this.computerTurn(postMoveState.activePiece);
                }
            },
            500);
        },
        1000);
    }

    updateStatePostMove(postMoveState) {
        this.setState({
            history: this.state.history.concat([{
                boardState: postMoveState.boardState,
                currentPlayer: postMoveState.currentPlayer,
            }]),
            activePiece: postMoveState.activePiece,
            moves: postMoveState.moves,
            jumpKills: postMoveState.jumpKills,
            hasJumped: postMoveState.hasJumped,
            stepNumber: this.state.history.length,
            winner: postMoveState.winner,
        });
    }
    // undo the last move
    undo() {
        const backStep = parseInt(this.state.stepNumber, 10) -1;
        if (backStep < 0) {
            return;
        }
        
        const unsetHistory = this.state.history.slice(0, backStep+1);
        this.setState({
            history: unsetHistory,
            activePiece: null,
            moves: [],
            jumpKills: null,
            hasJumped: null,
            stepNumber: backStep,
            winner: null,
        });
    }
// reset the game by setting initital states
    reset(){
        this.setState({
            
                players: null,
                history: [{
                    boardState: this.createBoard(),
                    currentPlayer: true,
                }],
                activePiece: null,
                moves: [],
                jumpKills: null,
                hasJumped: null,
                stepNumber: 0,
                winner: null,
                popShown: false,
                
            

        })
    }
// to open game rules popup
    aboutPopOpen() {
        this.setState({popShown: true});
      }
// to close game rules popup
    aboutPopClose() {
        this.setState({popShown: false});
      }

    render() {
        const columns = this.columns;
        const stateHistory = this.state.history;
        const activePiece = this.state.activePiece;
        const currentState = stateHistory[this.state.stepNumber];
        const boardState = currentState.boardState;
        const currentPlayer = currentState.currentPlayer;
        const moves = this.state.moves;


        
        let gameStatus;

        let undoClass = 'features';

        if (this.state.stepNumber < 1) {
            undoClass += ' disabled';
        }
        

        switch (this.state.winner) {
            case 'player1pieces':
                gameStatus = 'You Win!';
                break;
            case 'player2pieces':
                gameStatus = 'Computer Wins!';
                break;
            case 'player1moves':
                gameStatus = 'No moves left - You Win!';
                break;
            case 'player2moves':
                gameStatus = 'No moves left - Computer Wins!';
                break;
            default:
                gameStatus = currentState.currentPlayer === true ? 'Your Turn ' : 'Computer Turn';
                break;
        }

        if (gameStatus === 'Your Turn '){
            undoClass += ' disabled';
        }


        return(
            <Router history={browserHistory} basename={'react-checkers'} >
                <div className="reactCheckers">
                    
                    <div className="playerDisplay">
                        {gameStatus}
                    </div>           
                    
                    <div className="game-board">
                        
                        <Board
                            boardState = {boardState}
                            currentPlayer = {currentPlayer}
                            activePiece = {activePiece}
                            moves = {moves}
                            columns = {columns}
                            onClick = {(coordinates) => this.handleClick(coordinates)}
                        />
                        
                    </div>
                
                    <div className="gameFeatures">
                    
                    <button className="features score">Your Checkers <span className="you">{this.ReactCheckers.displayCheckers(boardState)[0]}</span></button>
                    <button className="features score">Computer Checkers <span className="computer">{this.ReactCheckers.displayCheckers(boardState)[1]}</span></button>
                    <button className="features" onClick={this.aboutPopOpen}>Game Rules!</button>  
                    <Popup shown={this.state.popShown} close={this.aboutPopClose} />
                    <button className={undoClass} onClick={()=>this.undo()}>Undo</button>
                    <button className="features " onClick = {() =>this.reset()} >Reset</button>
                   
                    
                    </div>
                    
                    
                    
                    
                </div>
            </Router>
        );
    }
}

export default App;