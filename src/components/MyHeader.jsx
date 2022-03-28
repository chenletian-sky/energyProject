import React from "react";

export default function Heading (props){
    const position =  props.position ? "absolute" : "relative"
    const HeadingStyle = {
      position:`${position}`,
      // top:"1rem",
      // left:"1px",
      height: "20px",
      // width: "fit-content",
      width:"calc(100%)",
      background:
        "-webkit-linear-gradient(top,rgb(244,244,244),rgb(233,233,233))",
      color: "black",
      float: "left",
      fontSize: "10px",
      fontFamily: "Verdana, Arial, Helvetica, sans-serif",
      // padding: "2.5px 20px",
      padding:"0 0 0 4px",
      
      fontWeight: 600,
      // borderRadius:"5px"
    };
    const SpanStyle = {
      marginLeft: "5px",
      marginTop: "10px",
      marginBottom:"20px",
      color:"rgba(86,86,86,.9)"
      // float:"left"
    };
    return (
      <div className="Heading" style={HeadingStyle}>
        <span style={SpanStyle}>{props.title}</span>
      </div>
    );
  }



  