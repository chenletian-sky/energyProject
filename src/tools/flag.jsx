/*
 * @Author: your name
 * @Date: 2021-12-10 20:51:05
 * @LastEditTime: 2021-12-10 21:29:40
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: \myapp\src\tools\flag.js
 */
import React from 'react';
import * as d3 from 'd3';
class Flag extends React.Component {
    theme
    data
    constructor(props) {
        super(props)
        this.state = {
            startRadius :10, 
            spacing :30
        }
        this.theme = this.props.theme
        this.data = this.props.data
    }
    dataDeal = (data) => {
        const padAngle = 0
        let arcs = []
        let N = d3.map(data, d => d.name)
        let V = d3.map(data, d => d.value)
        let I = d3.range(N.length).filter(i => !isNaN(V[i]));
        arcs.push(d3.pie().padAngle(padAngle).sort(null).value(i => V[i])(I))
        return arcs
    }
    PieShow = (arcs, inr, outr, m) => {
        const strokeWidth = 0.5
        const stroke = "rgb(180,180,180)"
        const strokeLinejoin = "round"
        const arc = d3.arc().innerRadius(inr).outerRadius(outr)
        const svg = d3.select("#p")
        // console.log(arcs);
        const gs = svg.select("#pie")
            .append("g")
        gs.selectAll("path")
            .data(arcs[0])
            .join("path")
            .attr("d", d => arc(d))
            .attr("stroke", stroke)
            .attr("stroke-width", strokeWidth)
            .attr("stroke-linejoin", strokeLinejoin)
            .attr("fill", (d) => {
                if (m === "ir") {
                    if (d.data === 0) {
                        return "rgb(255,236,139)"
                    } else {
                        return "white"
                    }
                } else if (m === "mt") {
                    if (d.data === 0) {
                        return "rgb(50,205,50)"
                    } else {
                        return "white"
                    }
                } else {
                    if (d.data === 0) {
                        return "rgb(255,127,0)"
                    } else {
                        return "white"
                    }
                }
            })
    }
    // 环形图 主渲染函数
    PieRender = (piePath) => {
        const {startRadius,spacing} = this.state
        // test  
        const data1 = [
            { "name": "ir", "value": 1.8 },
            { "name": "none", "value": 0.2 }
        ]
        const data2 = [
            { "name": "mt", "value": 0.5 },
            { "name": "none", "value": 0.5 }
        ]
        const data3 = [
            { "name": "at", "value": 0.6 },
            { "name": "none", "value": 0.4 }
        ]
        // 渲染环形 最外侧
        let arcs1 = this.dataDeal(data1)
        // ir
        this.PieShow(piePath["ir"],startRadius+spacing*2, startRadius+spacing*3, "ir")
        // mt
        let arcs2 = this.dataDeal(data2)
        this.PieShow(piePath["mt"], startRadius+spacing, startRadius+spacing*2, "mt")
        // at
        let arcs3 = this.dataDeal(data3)
        this.PieShow(piePath["at"], startRadius, startRadius + spacing, "at")
        
        // console.log("flag",[arcs1,arcs2,arcs3],piePath)
    }
    render() {
        const {width,height} = this.props.theme
        return (
            <div className='Flag' 
                style={{...this.props.theme}} 
            >
                {/* 测试用 */}
                {/* <button id="renderPie" onClick={() => this.PieRender()}>renderPie</button> */}
                <svg style={{ width: this.props.theme.width, height: this.props.theme.height }} id="p">
                    <g id="pie" 
                        transform={`translate(${width/2},${height/2})`}
                    ></g>
                </svg>
            </div>
        )
    }
}
export default Flag;
