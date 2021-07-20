import React, { Component } from 'react';


class Popup extends Component{
  render(){
      
    if (this.props.shown) {
      return(
        <div className="pop" onClick={this.props.close} >
          <div className="internal" >
            <ul>
                <li>Pink checkers are yours. You moves first.</li>
                <li>Moves are allowed only on the white squares.</li>
                <li>pieces only move diagonally forward toward the opponent.</li>
                <li>However, Kings, as you’ll see, can also move backwards.</li>
                <li>A piece may only move one square unless it is making a jump.</li>
            </ul>
                 
            <button onClick={this.props.close} className="close">x</button>
          </div>
        </div>
      )
    }
    else {
      return(
        <div style={{display: 'none'}}></div>
      )
    }
    
  }
};

export default Popup;