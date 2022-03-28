import React, { Component } from 'react'
import MyHeader from "../components/MyHeader"
export default class TentativeCom extends Component {
  render() {
    return (
      <div 
        style={{...this.props.theme}}
      >
        <MyHeader title="TentativeCom"></MyHeader>

      </div>
    )
  }
}
