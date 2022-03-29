import React, { Component } from 'react'
import MyHeader from "../components/MyHeader"
export default class TentativeCom extends Component {

  render() {
    const {theme} = this.props
    return (
      <div 
        style={{...this.props.theme}}
      >
        <MyHeader title="TentativeCom"></MyHeader>
        <div 
          style={{ 
            width: theme.width, 
            height: theme.height-20,
            position:"relative",
            top:"20px"
          }} className="myChange-sector">

        </div>
      </div>
    )
  }
}
