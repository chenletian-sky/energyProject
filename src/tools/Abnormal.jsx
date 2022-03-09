/*
 * @Author: your name
 * @Date: 2021-10-28 10:17:48
 * @LastEditTime: 2021-12-09 11:14:04
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \myapp\src\tools\Abnormal.js
 */
import React from 'react';
import * as d3 from 'd3';
class Abnormal extends React.Component {
    theme
    data
    constructor(props) {
        super(props)
        this.state = {}
        this.theme = this.props.theme
        this.data = this.props.data
        this.sourceKey = null
        this.date = null
        this.split = null
        this.distance = null
        this.padding = {
            top: 20,
            left: 20,
            right: 20,
            bottom: 60,
            height: this.theme.height - 20
        }
        this.step = 50
        this.newDis = []
        this.RightPosT = this.theme.width - this.padding.right
    }
    xAxis = (g, x) => {
        const padding = this.padding
        g.attr("transform", `translate(0,${padding.height - padding.bottom})`)
            .call(d3.axisBottom(x).tickSizeOuter(0))
            .call(g => g.selectAll("text").attr("fill", "rgb(140,140,140)").text(d => (d / 100)))
            .call(g => g.selectAll("line").attr("stroke", "rgb(140,140,140)"))
    }
    yAxis = (g, y) => {
        const padding = this.padding
        g.attr("transform", `translate(${padding.left},0)`)
            .call(d3.axisLeft(y).ticks(5))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text")
                .attr("x", 0)
                // .attr("dy", "-0.5em")
                .attr("fill", "rgb(140,140,140)")
                .text(d => (d / 1000))
            )
            .call(g => g.selectAll("line")
                .attr("x2", this.theme.width - 10 - padding.right)
                .attr("stroke", (d, i) => {
                    if (i !== 0) {
                        return "rgb(236,236,236)"
                    }
                })
                .attr("value", (d) => d)
            )

    }
    BothRectRender = () => {
        const padding = this.padding
        const svg = d3.select("#distribute")
        svg.append("g")
            .append("rect")
            .attr("id", "first-rect")
            .attr("x", padding.left)
            .attr("y", padding.top)
            .attr("width", "0px")
            .attr("height", padding.height - padding.top - padding.bottom)
        svg.append("g")
            .append("rect")
            .attr("id", "end-rect")
            .attr("x", this.theme.width - padding.right)
            .attr("y", padding.top)
            .attr("width", "0px")
            .attr("height", padding.height - padding.top - padding.bottom)
    }
    SelectRectRender = (value, stepDis, xScale, yScale, data) => {
        const svg = d3.select("#distribute")
        let stepNum = []
        for (let i = 0; i < stepDis.length; i++) {
            let num = 0
            if (stepDis[i][1] > value[0] && stepDis[i][0] <= value[0]) {
                data.forEach((item) => {
                    if (item.value >= value[0] && item.value < stepDis[i][1]) {
                        num += 1
                    }
                })
            }
            else if (stepDis[i][0] >= value[0] && stepDis[i][1] < value[1]) {
                data.forEach((item) => {
                    if (item.value >= stepDis[i][0] && item.value < stepDis[i][1]) {
                        num += 1
                    }
                })
            }
            else if (stepDis[i][0] <= value[1] && stepDis[i][1] > value[1]) {
                data.forEach((item) => {
                    if (item.value >= stepDis[i][0] && item.value < value[1]) {
                        num += 1
                    }
                })
            }
            else {
                num = 0
            }
            stepNum.push(num)
        }
        svg.select("#rectSelect")
            .selectAll("rect")
            .data(stepNum)
            .join("rect")
            .attr("x", (d, i) => {
                return xScale(stepDis[i][0])
            })
            .attr("y", d => yScale(d))
            .attr("width", (d, i) => {
                return xScale(stepDis[i][1]) - xScale(stepDis[i][0])
            })
            .attr("height", d => (yScale(0) - yScale(d)))
            .attr("stroke", "white")
            .attr("stroke-width", "0.5px")
            .attr("fill", "rgb(15,154,90)")
    }
    NumberDistribution = () => {
        d3.select("#distribute").selectAll("g").remove()
        this.RightPosT = this.theme.width - this.padding.right
        let LeftStopPos = 0
        let RightStopPos = 0
        const data = this.distance
        const padding = this.padding
        let stepDis = []
        let stepNum = []
        const svg = d3.select("#distribute")
        const max = d3.max(data, d => d.value)
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .range([padding.left, this.theme.width - padding.right])
        svg.append("g")
            .call(this.xAxis, xScale)
        for (let i = 0; i < max; i += this.step) {
            if (i + this.step < max) {
                stepDis.push([i, i + this.step])
            } else {
                stepDis.push([i, max])
            }
        }
        for (let i = 0; i < stepDis.length; i++) {
            let num = 0
            data.forEach((item) => {
                if (item.value >= stepDis[i][0] && item.value < stepDis[i][1]) {
                    num += 1
                }
            })
            stepNum.push(num)
        }
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(stepNum)])
            .range([padding.height - padding.bottom, padding.top])
        const xScaleBack = d3.scaleLinear()
            .domain([padding.left, this.theme.width - padding.right])
            .range([0, d3.max(data, d => d.value)])
        svg.append("g")
            .call(this.yAxis, yScale)
        svg.append("g")
            .selectAll("rect")
            .data(stepNum)
            .join("rect")
            .attr("x", (d, i) => {
                return xScale(stepDis[i][0])
            })
            .attr("y", d => yScale(d))
            .attr("width", (d, i) => {
                return xScale(stepDis[i][1]) - xScale(stepDis[i][0])
            })
            .attr("height", d => (yScale(0) - yScale(d)))
            .attr("fill", "rgb(90,90,90)")
            .attr("opacity", 0.8)
        svg.append("g")
            .attr("id", "rectSelect")
            .selectAll("rect")
            .data(stepNum)
            .join("rect")
            .attr("x", (d, i) => {
                return xScale(stepDis[i][0])
            })
            .attr("y", d => yScale(d))
            .attr("width", (d, i) => {
                return xScale(stepDis[i][1]) - xScale(stepDis[i][0])
            })
            .attr("height", d => (yScale(0) - yScale(d)))
            .attr("fill", "rgb(180,180,180)")
        this.BothRectRender()
        let firstPos = 0
        let flag = 0
        svg.append("g")
            .append("line")
            .attr("id", "left-line")
            .attr("x1", padding.left)
            .attr("x2", padding.left)
            .attr("y2", padding.height - padding.bottom)
            .attr("y1", padding.top)
            .attr("stroke", "black")
            .on("mousemove", (e) => {
                e.target.setAttribute("stroke-width", "3px")
            })
            .on("mouseout", (e) => {
                e.target.setAttribute("stroke-width", "1px")
            })
            .call(d3.drag()
                .on("start", (e) => {
                    if (flag === 0) {
                        firstPos = e.x
                    }
                    d3.select("#first-rect")
                        .attr("width", Math.abs(e.x - firstPos))
                        .attr("opacity", 0.5)
                        .attr("fill", "rgb(230,230,230)")
                })
                .on("drag", (e) => {
                    let pos = e.x
                    if (pos <= padding.left) {
                        pos = padding.left
                    } else if (pos >= this.theme.width - padding.right) {
                        pos = this.theme.width - padding.right
                    }
                    d3.select("#left-line")
                        .attr("x1", pos)
                        .attr("x2", pos)
                        .attr("y1", padding.top)
                        .attr("y2", padding.height - padding.bottom)
                        .attr("stroke-width", "3px")
                    d3.select("#first-rect")
                        .attr("width", Math.abs(pos - firstPos))
                        .attr("opacity", 0.5)
                        .attr("fill", "rgb(230,230,230)")
                })
                .on("end", (e) => {
                    LeftStopPos = e.x
                    RightStopPos = this.RightPosT
                    const selectValue = [xScaleBack(LeftStopPos), xScaleBack(RightStopPos)]
                    this.SelectRectRender(selectValue, stepDis, xScale, yScale, data)
                    this.newDis = []
                    data.forEach((item) => {
                        if (item.value >= xScaleBack(LeftStopPos) && item.value < xScaleBack(RightStopPos)) {
                            this.newDis.push(item)
                        }
                    })
                    flag = 1
                })
            )
        let SecondPos = 0
        let flag_ = 0
        svg.append("g")
            .append("line")
            .attr("id", "right-line")
            .attr("x1", this.theme.width - padding.right)
            .attr("x2", this.theme.width - padding.right)
            .attr("y2", padding.height - padding.bottom)
            .attr("y1", padding.top)
            .attr("stroke", "black")
            .on("mousemove", (e) => {
                e.target.setAttribute("stroke-width", "3px")
            })
            .on("mouseout", (e) => {
                e.target.setAttribute("stroke-width", "1px")
            })
            .call(d3.drag()
                .on("start", (e) => {
                    if (flag_ === 0) {
                        SecondPos = e.x
                    }
                    d3.select("#end-rect")
                        .attr("x", e.x)
                        .attr("width", Math.abs(e.x - SecondPos))
                        .attr("opacity", 0.5)
                        .attr("fill", "rgb(230,230,230)")
                })
                .on("drag", (e) => {
                    let pos = e.x
                    if (pos <= padding.left) {
                        pos = padding.left
                    } else if (pos >= this.theme.width - padding.right) {
                        pos = this.theme.width - padding.right
                    }
                    d3.select("#right-line")
                        .attr("x1", pos)
                        .attr("x2", pos)
                        .attr("y1", padding.top)
                        .attr("y2", padding.height - padding.bottom)
                        .attr("stroke-width", "3px")
                    d3.select("#end-rect")
                        .attr("x", pos)
                        .attr("width", Math.abs(pos - SecondPos))
                        .attr("opacity", 0.5)
                        .attr("fill", "rgb(230,230,230)")
                })
                .on("end", (e) => {
                    RightStopPos = e.x
                    this.RightPosT = e.x
                    flag_ = 1
                    this.newDis = []
                    data.forEach((item) => {
                        if (item.value >= xScaleBack(LeftStopPos) && item.value < xScaleBack(RightStopPos)) {
                            this.newDis.push(item)
                        }
                    })
                    const selectValue = [xScaleBack(LeftStopPos), xScaleBack(RightStopPos)]
                    this.SelectRectRender(selectValue, stepDis, xScale, yScale, data)
                })
            )
        svg.append("g")
            .selectAll("text")
            .data([
                { "name": "(most similar)", "pos": padding.left - 10 },
                { "name": "(distance)", "pos": this.theme.width / 2 - 30 },
                { "name": "(least similar)", "pos": this.theme.width - padding.right - 70 }
            ])
            .join("text")
            .attr("x", d => d.pos)
            .attr("y", padding.height - padding.bottom + 30)
            .text(d => d.name)
        svg.append("g")
            .append("text")
            .attr("x", 5)
            .attr("y", 9)
            .text("/k")
            .attr("fill", "rgb(140,140,140)")
    }
    render() {
        return (
            <div className='Abnormal' style={{ position: 'absolute', ...this.theme ,display:"none"}}>
                <div style={{ ...this.theme.title }}>
                    <button id="filterb" onClick={() => {
                        this.props.FilterRender(this.newDis)
                        console.log(this.newDis)
                    }}>Filter</button>
                </div>
                <svg style={{ width: this.theme.width, height: this.theme.height - 20 }} id="distribute"></svg>
            </div>
        )
    }
}
export default Abnormal;