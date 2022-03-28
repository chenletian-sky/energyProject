import React from "react";

export default function Heading (props){
    const HeadingStyle = {
      position:"absolute",
      // top:"1rem",
      // left:"1rem",
      height: "30rem",
      // width: "fit-content",
      width:"calc(100% - 4rem)",
      background:
        "-webkit-linear-gradient(top,rgb(244,244,244),rgb(233,233,233))",
      color: "black",
      float: "left",
      fontSize: "24rem",
      fontFamily: "Verdana, Arial, Helvetica, sans-serif",
      // padding: "2.5rem 20rem",
      padding:"0 0 0 4rem",
      
      fontWeight: 600,
      borderRadius:"5rem"
    };
    const SpanStyle = {
      marginLeft: "5rem",
      marginTop: "15rem",
      color:"rgba(86,86,86,.9)"
      // float:"left"
    };
    return (
      <div className="Heading" style={HeadingStyle}>
        <span style={SpanStyle}>{props.title}</span>
      </div>
    );
  }



  