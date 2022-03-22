import React from 'react';
import * as d3 from 'd3';
import 'antd/dist/antd.css';
import { Slider, InputNumber, Row, Col } from 'antd';
class Analysis extends React.Component {
    theme
    data
    constructor(props) {
        super(props)
        this.state = {
            inputValue: 4
        }
        this.theme = this.props.theme
        this.data = this.props.data
        this.events = this.props.events
        this.true = "2111.yc45"
        this.pre = "pre"
        this.padding = {
            top: 10,
            left: 20,
            right: 15,
            bottom: 40,
            width: this.props.theme.width,
            height: this.props.theme.height - 40
        }
        this.color = {
            true: "steelblue",
            events: "rgb(254,111,70)",
            abnormal: "red",
            forecast: "rgb(238,216,176)"
        }
    }
    rTime = (date) => {
        const json_date = new Date(date).toJSON();
        return new Date(new Date(json_date) + 8 * 3600 * 1000).toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '')
    }
    xAxis = (g, x) => {
        const padding = this.padding
        g.attr("transform", `translate(0,${padding.height * 1 / 3 - padding.bottom})`).call(d3.axisBottom(x).ticks(padding.width / 55).tickSizeOuter(0))
    }
    yAxis = (g, y, data) => {
        const padding = this.padding
        g.attr("transform", `translate(${padding.left},0)`).call(d3.axisLeft(y).ticks(5))
            .call(g => g.select(".domain").remove())
            .call(g => g.select(".tick:last-of-type text").clone()
                .attr("x", 3)
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .text(data.y)
            )
    }
    area = (data, xScale, yScale, sort) => {
        const dataset = d3.area()
            .curve(d3.curveStepAfter)
            .x(d => xScale(d.date_time))
            .y0(yScale(0))
            .y1(d => yScale(d[sort]))
            (data)
        return dataset
    }
    LineShow = () => {
        const that = this
        const data = this.data
        const events = this.events
        const padding = this.padding
        let abnormal = []
        let events_test = []
        const maxP = d3.max(data, d => d[this.true])
        for (let i = 0; i < data.length; i++) {
            data[i].date_time = new Date(this.rTime(data[i].date_time))
        }
        for (let i = 0; i < data.length; i++) {
            if (parseInt(data[i]['RMSE']) < parseInt(data[i]['abs'])) {
                abnormal.push(data[i])
            }
        }
        for (let i = 0; i < events.length; i++) {
            events[i].date_time_first = new Date(events[i].date_time_first)
            events[i].date_time_end = new Date(events[i].date_time_end)
        }
        const date_range = d3.extent(data, d => d.date_time)
        for (let i = 0; i < events.length; i++) {
            if (events[i].date_time_first.getTime() >= date_range[0].getTime()) {
                events_test.push(events[i])
            }
        }
        const xScale = d3.scaleUtc()
            .domain(d3.extent(data, d => d.date_time))
            .range([padding.left, padding.width - padding.right])
        const yScale = d3.scaleLinear()
            .domain([0, maxP]).nice()
            .range([padding.height * 1 / 3 - padding.bottom, padding.top])
        const svg = d3.select("#line")
            .attr("viewBox", [0, 0, padding.width, padding.height * 1 / 3])
        const gx = svg.select("#xScale")
            .call(this.xAxis, xScale)
        svg.select("#yScale")
            .call(this.yAxis, yScale, data)
        // const area = d3.area()
        //     .curve(d3.curveStepAfter)
        //     .x(d => xScale(d.date_time))
        //     .y0(yScale(0))
        //     .y1(d => yScale(d['2111.yc45']))
        //     (data)
        const rectEvents = svg.selectAll(".rectEvent")
            .data(events_test)
            .join("rect")
            .attr("class", "rectEvent")
            .attr("x", d => xScale(d.date_time_first))
            .attr("y", yScale(maxP) - padding.top)
            .attr("width", d => (xScale(d.date_time_end) - xScale(d.date_time_first)))
            .attr("height", yScale(0) - padding.top)
            .attr("fill", this.color.events)
            .attr("opacity", 0.5)
        const path_true = svg.selectAll(".paths_true")
            .data([this.area(data, xScale, yScale, this.true)])
            .join("path")
            .attr("class", "paths_true")
            .attr("stroke", this.color.true)
            .attr("fill", "none")
            .attr("d", d => d)
        const path_pre = svg.selectAll(".paths_pre")
            .data([this.area(data, xScale, yScale, this.pre)])
            .join("path")
            .attr("class", "paths_pre")
            .attr("stroke", this.color.forecast)
            .attr("fill", "none")
            .attr("d", d => d)
        const circles = svg.selectAll(".scatters")
            .data(abnormal)
            .join("circle")
            .attr("class", "scatters")
            .attr("cx", d => xScale(d.date_time))
            .attr("cy", d => yScale(d[this.true]))
            .attr("r", "2px")
            .attr("fill", "red")
            .attr("title", "555")



        function zoomed(event) {
            const xz = event.transform.rescaleX(xScale)
            const pathUpdate = that.area(data, xz, yScale, that.true)
            const pathUpdate_ = that.area(data, xz, yScale, that.pre)
            path_true.attr("d", pathUpdate)
            path_pre.attr("d", pathUpdate_)
            rectEvents.attr("x", d => xz(d.date_time_first))
            rectEvents.attr("width", (d, i) => {
                return xz(d.date_time_end) - xz(d.date_time_first)
            })
            circles.attr("cx", d => xz(d.date_time))
            gx.call(that.xAxis, xz);
        }
        const zoom = d3.zoom()
            .scaleExtent([1, 2000])
            .extent([[padding.left, 0], [padding.width - padding.right, padding.height * 1 / 3]])
            .translateExtent([[padding.left, -Infinity], [padding.width - padding.right, Infinity]])
            .on("zoom", zoomed)
        svg.call(zoom)
            .transition()
            .duration(750)

    }
    onChange = (value) => {
        this.setState({
            inputValue: value
        })
    }
    componentDidMount() {
        const input1 = document.getElementsByClassName("ant-input-number-input")
        // console.log(input1);
        input1[0].style.height = "20px"
    }
    render() {
        // console.log(this.data)
        const { inputValue } = this.state
        let tags = []
        for (let key in this.color) {
            tags.push({ "name": key, "color": this.color[key] })
        }
        const label = tags.map((item, index) => {
            return (
                <g key={"labels" + index}>
                    <text x={index === 0 ? 530 : 510 + 70 * index} y={13} style={{ fontSize: "12px" }}>{item.name}</text>
                    <circle cx={index === 0 ? 520 : 500 + 70 * index} cy={10} r={3.5} fill={item.color}></circle>
                </g>
            )
        })
        return (
            <div className='Analysis' style={{ position: 'absolute', ...this.theme }}>
                <div style={{
                    ...this.theme.title,
                }}>
                    <svg style={{
                        width: this.theme.title.width,
                        height: this.theme.title.height
                    }}>
                        {label}
                    </svg>
                </div>
                <div style={{
                    width: this.theme.width,
                    height: (this.theme.height - 40) * 1 / 3
                }}>
                    <svg style={{ width: this.theme.width, height: this.theme.height * 1 / 3 }} id="line">
                        <g id="all">
                            <g id="xScale"></g>
                            <g id="yScale"></g>
                        </g>
                    </svg>
                </div>
                <div style={{
                    ...this.theme.title,
                }}>
                    <div style={{ width: "200px", float: "right" }}>
                        <Row>
                            <Col>
                                <Slider
                                    min={1}
                                    max={8}
                                    onChange={this.onChange}
                                    style={{ width: "100px", marginTop: "3px" }}
                                    value={typeof inputValue === 'number' ? inputValue : 0}
                                />
                            </Col>
                            <Col span={2}>
                                <InputNumber
                                    min={1}
                                    max={8}
                                    style={{ margin: '0 0px', width: "50px", height: "20px" }}
                                    value={inputValue}
                                    onChange={this.onChange}
                                />
                            </Col>
                        </Row>
                    </div>

                </div>
                <div style={{
                    width: this.theme.width,
                    height: (this.theme.height - 40) * 2 / 3
                }}></div>

            </div>
        )
    }
}
export default Analysis;