// 数据介绍框
import React from "react";
import 'antd/dist/antd.css';
import {Table} from 'antd';
import MyHeader from "../components/MyHeader"
class DataIntroduce extends React.Component {
    constructor(props){
        super(props);
        this.state = {};
        this.data = this.props.data
        this.theme = this.props.theme
    }
    render(){
        let titles = ['number', 'start time', 'end time']
        let names = ['number', 'start_time', 'end_time']
        let w = (this.theme.width - 2 - 2) / 3
        let h = 29
        let label = titles.map((item, i) => {
            return(
                <div key={'dataIntroduce_title' + i} style={{float:'left', width: w, height: h, marginLeft: i === 0 ? '0px' : '1px', fontWeight:'600', fontSize:"12px", background:'#E6E6E6', lineHeight:"29px", textAlign:'center'}}>{item}</div>
            )
        })
        let table = names.map((item, i) => {
            return(
                <div key={'dataIntroduce_table' + i} style={{float:'left', width: i !== (names.length - 1) ? (w + 1) : w, height: h + 0.5, borderRight: i !== (names.length - 1) ? "1px solid rgb(180, 180, 180)" : '', fontWeight:'600', fontSize:"12px", background:'white', lineHeight: i === 0 ? "29px" : "14.5px", textAlign:'center'}}>{this.data[item]}</div>
            )
        })
        return(
            <div className="DataIntroduce" style={{position:'absolute', ...this.theme}}>
                {/* <div style={{position:'relative', float:'left', ...this.theme.title, lineHeight: this.theme.title.height + 'px'}}>dataset1</div> */}
                <MyHeader title="Dataset" position={false}></MyHeader>
                <div style={{float:'left', width: this.theme.width, height: 29}}>
                    {label}
                </div>
                <div style={{float:'left', width: this.theme.width, height: 29}}>
                    {table}
                </div>
            </div>
        )
    }
}

export default DataIntroduce;