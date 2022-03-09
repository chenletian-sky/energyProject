import React from 'react'
import './all.css'
import 'antd/dist/antd.css'
import { Slider, InputNumber, Row, Col, Select, Spin } from 'antd'
import { Popover } from 'antd';
import { debounce, DelectAllg, DeletTemp } from './methods.js'
import axios from 'axios'
import { Divider } from 'antd';
// import { LoadingOutlined } from '@ant-design/icons'
// import { Spin } from 'antd'
import * as d3 from 'd3';
import $ from 'jquery'
// import Calendar from "./calendar/index"
import Chart from "./calendar/chart";
const calendar_data = require("./calendar/data.json")




class Control extends React.Component {
    theme
    data
    constructor(props) {
        super(props)
        this.chart = new Chart()
        this.state = {
            inputValue: 4,
            inputValue2: 3,
            date: "2020-05-15",
            display: "none",
            month: 4,
            Selectday: 15,
            week: "Fri",
            scatterLoading: false,
            disabled: true,
            Statistics: NaN,
            anomalyThresholdData:[],
            hour1: 7,
            minute1: 0,
            hour2: 8,
            minute2: 0

        }
        
        this.theme = this.props.theme
        this.data = this.props.data
        this.MonthDayDict = this.props.MonthDayDict
        this.attrLabel = []
        this.select = null
        this.rectS = null
        this.name = null
        this.matrixRender = null
        this.hover = true
        this.click = true
        this.key = []
        this.ifRender = true
        this.split = {
            height: 20,
            flowwidth: 20,
            wNum: 20,
            wId: 105,
            wNumber: 30,
            wyear: 30,
            wdate: 75
        }
        this.isLegal = debounce(this.isLegal, 500)
        // this.Statistics = NaN
        this.ListData = null

        this.timeDate = '2020-05-15' // 确定当前矩阵视图所对应的时间
    }

    // 处理时间信息的方法
    getTime = (date) => {
        let m = date.getMonth() + 1
        m = m < 10 ? ('0' + m) : m
        let d = date.getDate()
        d = d < 10 ? ('0' + d) : d
        let h = date.getHours()
        h = h < 10 ? ('0' + h) : h
        let minute = date.getMinutes()
        minute = minute < 10 ? ('0' + minute) : minute
        let second = date.getSeconds()
        second = second < 10 ? ('0' + second) : second
        return h + ':' + minute + ':' + second
    }
    getdate = (date) => {
        var y = date.getFullYear()
        var m = date.getMonth() + 1
        m = m < 10 ? ('0' + m) : m
        var d = date.getDate()
        d = d < 10 ? ('0' + d) : d
        return y + '-' + m + '-' + d
    }

    onChange = (value) => {
        DelectAllg()
        DeletTemp()
        d3.select("#attrs").selectAll("g").remove() // 删除MAE参数滑动条
        d3.select("#bubble").select("#pathangle").selectAll("path").remove() 
        // this.isLegal(value)
        this.setState({ // 刷新render()
            inputValue: value,
        });
    }
    isLegal = (value) => {
        this.props.MAEChangeDe(value)
    }
    onChange1 = (value) => {
        DelectAllg()
        DeletTemp()
        d3.select("#attrs").selectAll("g").remove()
        this.setState({
            inputValue2: value,
        });
    }
    componentDidMount() {
        const input1 = document.getElementsByClassName("ant-input-number-input")
        // console.log(input1);
        input1[0].style.height = "20px"
        input1[0].style.marginLeft = "-10px"
        input1[1].style.height = "20px"
        input1[1].style.marginLeft = "-10px"
        input1[2].style.height = "20px"
        input1[2].style.marginLeft = "-10px"
    }
    // 绘制滑动条的函数
    AttrsAdjust = () => {
        const dataT = this.props.dataT
        const timestep = []
        const timedict = {}
        const timeNum = {}
        const totaldict = {}
        const tags = []
        // 时间：每日早7：00到19：00
        for (let i = 7; i < 19; i += this.state.inputValue2) {
            timestep.push([i, i + this.state.inputValue2]) // 获取时间步长
        }
        // 获取每段时间步长内的loss_mae数据(异常阈值)
        timestep.forEach((time) => { 
            let dataset = []
            for (let key in dataT) {
                dataT[key].forEach((item) => { 
                    if (item.hour >= time[0] && item.hour < time[1]) {
                        dataset.push(item.loss_mae) // mae: 异常阈值、loss_mae: 损失异常阈值
                    }
                })
            }
            // 获取该段时间内异常阈值的最大值和最小值
            timedict[time[0] + "~" + time[1]] = d3.extent(dataset) // d3.extent(): 获取数组中的最大值和最小值。
            totaldict[time[0] + "~" + time[1]] = dataset // 存入所有数据
        });
        // 存入无效时间的loss_mae数据(计数每个无效时间的逆变器个数)
        [0, 1, 2, 3, 4, 5, 6, 19, 20, 21, 22, 23].forEach((t) => {
            let dataset = []
            for (let key in dataT) {
                dataT[key].forEach((item) => {
                    if (item.hour === t) {
                        dataset.push(item.loss_mae)
                    }
                })
            }
            timeNum[t] = dataset.length
        })
        const data = []
        const colorLabel = [
            "#99cc99",
            "rgb(250,210,131)",
            "rgb(190,186,218)",
            "rgb(204,204,204)",
            "#FFCC99",
            "#CCCCFF",
            "rgb(126,232,154)",
            "rgb(150,151,177)",
            "rgb(242,169,104)",
            "rgb(160,142,216)",
            "rgb(243,230,136)",
        ]
        for (let i = 0; i < this.state.inputValue; i++) { // 按照聚类的每类各储存一组数据
            let time = []
            this.attrLabel.forEach((item) => {
                if (item.label === i) {
                    time.push(item.time)
                }
            })
            data.push({ "label": i, "time": time, "color": colorLabel[i], "mae": 0 })
        }
        // 遍历每类数据
        data.forEach((item, index) => {
            let dataset = []
            let datatotal = []
            let decline = 0 
            item.time.forEach(time => {
                dataset = dataset.concat(timedict[time]) // .concat(): 链接两个数组，返回连接后的数组
                datatotal = datatotal.concat(totaldict[time])
            })
            datatotal = datatotal.sort((a, b) => { return a - b })
            item.time.forEach((time) => {
                let times = time.split("~")
                for (let i = parseInt(times[0]); i < parseInt(times[1]); i++) {
                    if (i in timeNum) {
                        decline += timeNum[i]
                    }
                }
            })
            // 确定阈值mae
            if (datatotal - decline <= 0) { // 如果该类datatotal里没有数据
                item["mae"] = 0
                item["advice"] = 0
                tags.push({ "mae": 0, "range": d3.extent(dataset) })
            } else {                        // 如果该类有数据
                let advice = 0
                // 找出最大的lose_mae值
                let max = parseInt(d3.extent(dataset)[1]) + 1

                while (1) {
                    let sum = 0
                    for (let i = datatotal.length; i >= 0; i--) {
                        if (datatotal[i] > max) {
                            sum += 1
                        }
                    }
                    if (sum / (datatotal.length - decline) >= 0.01) { // 要使得大于 max 阈值的数据数在这个比例里面 >= 0.01 
                        advice = max
                        break
                    } else {
                        max--
                    }
                }

                if (index === 0) {
                    item["mae"] = max + 10
                    item["advice"] = max + 10 // 阈值建议点
                    tags.push({ "mae": max + 10, "range": d3.extent(dataset) })
                } else {
                    item["mae"] = max
                    item["advice"] = max
                    tags.push({ "mae": max, "range": d3.extent(dataset) })
                }
            }

            item["range"] = d3.extent(dataset) // 范围为所有数据的最大值和最小值
            // item["mae"] = parseInt(d3.extent(dataset)[1]) + 1
        })
        // this.ListData = data
        this.props.MAEChange(data) // 散点图部分

        
        this.props.ColorC(data)    // 中上侧聚类图
        // 存储 分类后的数据
        this.setState({anomalyThresholdData:data})

        const svg = d3.select("#attrs")
        d3.select("#attrs g").remove()
        const gs = svg.append("g")
        gs.selectAll(".circleLabel") // 绘制每行左侧固定的圆标志
            .data(data)
            .join("circle")
            .attr("class", "circleLabel")
            .attr("cx", "8px")
            .attr("cy", (d, i) => 12.5 + 25 * i)
            .attr("r", 6)
            .attr("fill", d => colorLabel[d.label])
        gs.selectAll("textLabel") // 每行的名称
            .data(data)
            .join("text")
            .attr("class", "textLabel")
            .attr("x", "17px")
            .attr("y", (d, i) => 17 + 25 * i)
            .attr("font-size", "11px")
            .text((d) => "MAE" + d.label)
        gs.selectAll(".rectLabel") // 每行滑动条底部条
            .data(data)
            .join("rect")
            .attr("class", "rectLabel")
            .attr("x", "55px")
            .attr("y", (d, i) => 10 + 25 * i)
            .attr("width", "140px") // 160 - 20 = 140
            .attr("height", "4px")
            .attr("fill", "rgb(245,245,245)")
            .attr("rx", "2px")
            .attr("ry", "2px")
        gs.selectAll(".rectback") // 滑动条划出的蓝色条
            .data(data)
            .join("rect")
            .attr("class", "rectback")
            .attr("x", "55px")
            .attr("id", (d, i) => {
                return "back" + i
            })
            .attr("y", (d, i) => 10 + 25 * i)
            .attr("width", d => {
                const scaleL = d3.scaleLinear()
                    .domain([parseInt(d.range[0]), parseInt(d.range[1]) + 1])
                    .range([55, 195]) // 215 - 20 = 195
                return scaleL(d.mae) - 55
            })
            .attr("height", "4px")
            .attr("fill", "rgb(145,213,255)")
            .attr("rx", "2px")
            .attr("ry", "2px")
        gs.selectAll(".rectBorder") // 每行数据值展示框
            .data(data)
            .join("rect")
            .attr("class", "rectBorder")
            .attr("x", "205px") // 225 - 20 = 205
            .attr("y", (d, i) => 4 + 25 * i)
            .attr("width", "32px") // 52 - 20 = 32
            .attr("height", "20px")
            .attr("fill", "white")
            .attr("stroke", "rgb(217,217,217)")
            .attr("rx", "2px")
            .attr("ry", "2px")
        gs.selectAll(".circleAdvice") // 固定的点(展示数值)
            .data(tags)
            .join("circle")
            .attr("class", "circleAdvice")
            .attr("cy", (d, i) => 12 + 25 * i)
            .attr("cx", d => {
                const scaleL = d3.scaleLinear()
                    .domain([parseInt(d.range[0]), parseInt(d.range[1]) + 1])
                    .range([55, 195]) // 215 - 20 = 195
                return scaleL(d.mae)
            })
            .attr("r", "2px")
            .attr("fill", "white")
            .attr("stroke", "red")
            .attr("cursor", "pointer")
        const circleD = gs.selectAll(".circleDrag") // 用于滑动的点
            .data(data)
            .join("circle")
            .attr("class", "circleDrag")
            .attr("cx", d => {
                const scaleL = d3.scaleLinear()
                    .domain([parseInt(d.range[0]), parseInt(d.range[1]) + 1])
                    .range([55, 195]) // 215 - 20 = 195
                return scaleL(d.mae)
            })
            .attr("cy", (d, i) => 13 + 25 * i)
            .attr("r", "4px")
            .attr("index", (d, i) => i)
            .attr("fill", "white")
            .attr("stroke", "rgb(145,213,255)")
            .attr("cursor", "pointer")
            .call(d3.drag()
                .on("start", (event, d) => {
                    circleD.filter(p => p === d).attr("stroke", "rgb(24,142,251)")
                })
                .on("drag", (event, d) => {
                    const c = circleD.filter(p => p === d)["_groups"][0][0]
                    const index = c.getAttribute("index")
                    const backrect = document.getElementById("back" + index)
                    const textmae = document.getElementById("textmae" + index)
                    const scaleL = d3.scaleLinear()
                        .domain([55, 195]) // 215 - 20 = 195
                        .range([parseInt(d.range[0]), parseInt(d.range[1]) + 1])
                    let newx = 0
                    if (event.x < 55) {
                        newx = 55
                    } else if (event.x > 195) {
                        newx = 195 // 215 - 20 = 195
                    } else {
                        newx = event.x
                    }
                    circleD.filter(p => p === d).attr("cx", newx)
                    backrect.setAttribute("width", newx - 55)
                    textmae.innerHTML = parseInt(scaleL(newx))
                })
                .on("end", (event, d) => {
                    d3.select("#lineHeight").select("#circlepath").selectAll("path").remove()
                    d3.select("#lineHeight").select("#circle").selectAll("circle").remove()
                    let newx = 0
                    if (event.x < 55) {
                        newx = 55
                    } else if (event.x > 195) {
                        newx = 195 // 215 - 20 = 195
                    } else {
                        newx = event.x
                    }
                    const scaleL = d3.scaleLinear()
                        .domain([55, 195]) // 215 - 20 = 195
                        .range([parseInt(d.range[0]), parseInt(d.range[1]) + 1])
                    d.mae = parseInt(scaleL(newx)) // 修改data数据里的mae阈值的情况。
                    
                    this.props.ColorC(data) // 修改矩阵视图的异常显示情况
                    
                    this.props.MAEChange(data)
                    // this.ListData = data
                    // this.StatisticsRender()
                    circleD.filter(p => p === d).attr("stroke", "rgb(145,213,255)")
                })
            )


        for (let i = 0; i < 2; i++) { // 每个滑动轴两侧的数值
            gs.selectAll(".textRange" + i)
                .data(data)
                .join("text")
                .attr("class", "textRange" + i)
                .attr("x", () => {
                    if (i === 0) {
                        return "55px"
                    } else {
                        return "175px" // 195 - 20 = 175
                    }
                })
                .attr("y", (d, z) => 24 + 25 * z)
                .text(d => {
                    if (i === 1) {
                        return parseInt(d.range[i]) + 1
                    } else {
                        return parseInt(d.range[i])
                    }
                })
                .attr("font-size", "9px")
                .attr("fill", "rgb(140,140,140)")
        }
        gs.selectAll(".textmae") // 右侧显示框的数值
            .data(data)
            .join("text")
            .attr("class", "textmae")
            .attr("id", (d, i) => {
                return "textmae" + i
            })
            .attr("x", "208px") // 228 - 20 = 208
            .attr("y", (d, z) => 20 + 25 * z)
            .text((d) => d.mae)
            .attr("font-size", "13px")
            .attr("fill", "black")
        gs.selectAll(".textadvice") // 滑动轴中间固定点的数值
            .data(tags)
            .join("text")
            .attr("class", "textadvice")
            .attr("x", d => {
                const scaleL = d3.scaleLinear()
                    .domain([parseInt(d.range[0]), parseInt(d.range[1]) + 1])
                    .range([55, 195]) // 215 - 20 = 195
                return scaleL(d.mae) - 5
            })
            .attr("y", (d, z) => 24 + 25 * z)
            .text((d) => d.mae)
            .attr("font-size", "9px")
            .attr("fill", "rgb(140,140,140)")
    }
    // StatisticsRender(): 用于更新ID框
    // StatisticsRender = () => {
    //     const dataT = this.props.dataT
    //     const dataMae = this.ListData
    //     const datalast = []
    //     console.log(dataMae);
    //     let num = 0
    //     for (let key in dataT) {
    //         let dataset_avg = []
    //         let dataset_abnor = []
    //         dataMae.forEach((label) => {
    //             let timeList = []
    //             let mae = label.mae
    //             let dc_power = []
    //             let abnormal = 0
    //             label.time.forEach((t) => {
    //                 let times = t.split("~")
    //                 for (let i = parseInt(times[0]); i < parseInt(times[1]); i++) {
    //                     timeList.push(i)
    //                 }
    //             })
    //             dataT[key].forEach((item) => {
    //                 if (timeList.indexOf(item.hour) > -1) {
    //                     if (item.loss_mae > mae) {
    //                         abnormal += 1
    //                     }
    //                     dc_power.push(item.dc_power)
    //                 }
    //             })
    //             let dc_avg = d3.sum(dc_power) / dc_power.length
    //             dataset_avg.push(dc_avg)
    //             dataset_abnor.push(abnormal)
    //         })
    //         datalast.push({ "name": num, "dc_avg": dataset_avg, "abnomal": dataset_abnor })
    //         num += 1
    //     }
    //     const update = datalast.map((item, index) => {
    //         let LabelString = `${100 / item.abnomal.length}%`
    //         for (let i = 0; i < item.abnomal.length; i++) {
    //             if (i !== 0) {
    //                 LabelString += " " + 100 / item.abnomal.length + "%"
    //             }
    //         }
    //         const dc_avg = item.dc_avg.map((d, i) => {
    //             return (
    //                 <div key={"dc" + i + index}>{parseInt(d)}</div>
    //             )
    //         })
    //         const abnor = item.abnomal.map((d, i) => {
    //             return (
    //                 <div key={"ab" + i + index}>{parseInt(d)}</div>
    //             )
    //         })
    //         return (
    //             <div key={"Statistics" + index} style={{ width: this.theme.width - 2, height: (142.5 / 8) }} className='grid-sta'>
    //                 <div>{item.name}</div>
    //                 <div style={{ display: "grid", gridTemplateRows: "100%", gridTemplateColumns: LabelString }}>
    //                     {dc_avg}
    //                 </div>
    //                 <div style={{ display: "grid", gridTemplateRows: "100%", gridTemplateColumns: LabelString }}>
    //                     {abnor}
    //                 </div>
    //             </div>
    //         )
    //     })
    //     this.setState({ Statistics: update })
    // }

    // 绘制日历图
    calendarRender(){
        const config = {
            // margins: {top: 80, left: 50, bottom: 50, right: 50},
            textColor: 'black',
            title: '日历热力图',
            hoverColor: 'red',
            startTime: '2020-05-15',
            endTime: '2020-06-17',
            cellWidth: 15,
            cellHeight: 15,
            cellPadding: 1,
            cellColor1: 'white',
            cellColor2: 'green',
            lineColor: 'yellow',
            lineWidth: 2
        }

        const startTime = new Date(config.startTime)
        const endTime = new Date(config.endTime)
        const widthOffset = config.cellWidth + config.cellPadding
        const heightOffset = config.cellHeight + config.cellPadding
        const _this = this

        // 数据处理
        const dataT = this.props.dataT
        const timestep = []
        const timedict = {}
        const timeNum = {}
        const totaldict = {}
        const tags = []
        // 时间：每日早7：00到19：00

        timestep.push([7, 18]) // 获取时间步长
        
        // 获取每段时间步长内的loss_mae数据(异常阈值)
        timestep.forEach((time) => { 
            let dataset = []
            for (let key in dataT) {
                dataT[key].forEach((item) => { 
                    if (item.hour >= time[0] && item.hour < time[1]) {
                        dataset.push(item.loss_mae) // mae: 异常阈值、loss_mae: 损失异常阈值
                    }
                })
            }
            // 获取该段时间内异常阈值的最大值和最小值
            timedict[time[0] + "~" + time[1]] = d3.extent(dataset) // d3.extent(): 获取数组中的最大值和最小值。
            totaldict[time[0] + "~" + time[1]] = dataset // 存入所有数据
        });
        // 存入无效时间的loss_mae数据(计数每个无效时间的逆变器个数)
        [0, 1, 2, 3, 4, 5, 6, 19, 20, 21, 22, 23].forEach((t) => {
            let dataset = []
            for (let key in dataT) {
                dataT[key].forEach((item) => {
                    if (item.hour === t) {
                        dataset.push(item.loss_mae)
                    }
                })
            }
            timeNum[t] = dataset.length
        })
        const thresholdRecommendations = []
        thresholdRecommendations.push({ "label": 0, "time": ["7~18"], "mae": 0 })
        // 遍历每类数据
        thresholdRecommendations.forEach((item, index) => {
            let dataset = []
            let datatotal = []
            let decline = 0 
            item.time.forEach(time => {
                dataset = dataset.concat(timedict[time]) // .concat(): 链接两个数组，返回连接后的数组
                datatotal = datatotal.concat(totaldict[time])
            })
            datatotal = datatotal.sort((a, b) => { return a - b })
            item.time.forEach((time) => {
                let times = time.split("~")
                for (let i = parseInt(times[0]); i < parseInt(times[1]); i++) {
                    if (i in timeNum) {
                        decline += timeNum[i]
                    }
                }
            })
            // 确定阈值mae
            // if (datatotal - decline <= 0) { // 如果该类datatotal里没有数据
            //     item["mae"] = 0
            //     item["advice"] = 0
            //     tags.push({ "mae": 0, "range": d3.extent(dataset) })
            // } else {                        // 如果该类有数据
            // debugger
                let advice = 0
                // 找出最大的lose_mae值
                let max = parseInt(d3.extent(dataset)[1]) + 1
                let min = parseInt(d3.extent(dataset)[0])
                while (1) {
                    let sum = 0
                    for (let i = datatotal.length; i >= 0; i--) {
                        if (datatotal[i] > max) {
                            sum += 1
                        }
                    }
                    if (sum / (datatotal.length - decline) >= 0.01) { // 要使得大于 max 阈值的数据数在这个比例里面 >= 0.01 
                        advice = max
                        break
                    } else {
                        max--
                    }
                    if(max < min){
                        break
                    }
                }

                if (index === 0) {
                    item["mae"] = max + 10
                    item["advice"] = max + 10 // 阈值建议点
                    tags.push({ "mae": max + 10, "range": d3.extent(dataset) })
                } else {
                    item["mae"] = max
                    item["advice"] = max
                    tags.push({ "mae": max, "range": d3.extent(dataset) })
                }
            // }

            item["range"] = d3.extent(dataset) // 范围为所有数据的最大值和最小值
            // item["mae"] = parseInt(d3.extent(dataset)[1]) + 1
        })
        
        const dataSection = dataT["1BY6WEcLGh8j5v7"]
        const timeDict = {}
        const timeDate = {}
        const timeDateList = []
        dataSection.forEach((item) => {
            let time = this.getTime(item.date_time) // 获得 h:m:s 结构的时间
            let date = this.getdate(item.date_time) // 获得 y-m-d 结构的时间
            // 判断现在数据的时间是不是不在被排除的时间里
            if ([0, 1, 2, 3, 4, 5, 6, 19, 20, 21, 22, 23].indexOf(item.hour) <= -1) {
                if (time in timeDict === false) { // 将没有存入的时存入字典中
                    timeDict[time] = 0
                }
            }
            if (date in timeDate === false) {
                timeDate[date] = 0 // 存入日期
            }
        })

        for (let key in timeDate) {
            timeDateList.push({"date":key,"above": 0, "below": 0, "label":0,"mae": []}) // 存入 y-m-d
        }

        // 处理出数据
        for (let key in dataT) {
            dataT[key].forEach((item) => {
                // 再次处理出我们所需的时间数据
                let date = this.getdate(item.date_time)
                // let time = this.getTime(item.date_time)
                timeDateList.forEach((label) => {
                    if (label.date === date) {
                        label['mae'].push(item.testPre - item.dc_power) // testPre: 预测发电数据，dc_power原始发电数据，依次存入所有逆变器的mae数据
                    }
                })
            })
        }

        // 程度判断
        const labelMae = {}
        const labels = []
        thresholdRecommendations.forEach((item) => {
            let mae = item.mae // 阈值
            labelMae[item.label] = mae // 存入每类的阈值(之前计算出的阈值)
            labels.push(item.label) // 存入类别标签
        })
        // let dataInfo = this.TimeDate // 每个数据的信息
        // dataInfo.forEach((item) => { // 初始化
        //     item.above = 0
        //     item.below = 0
        // })
        labels.forEach((l) => {
            let dataset = []
            timeDateList.forEach((item) => {
                if (parseInt(item.label) === parseInt(l)) {
                    dataset.push(item) // dataset存入每类的数据
                }
            })
            dataset.forEach((item) => {
                let above_avg = []
                let below_avg = []
                let mae = labelMae[item.label]
                // 依次遍历该天所有逆变器的mae
                item.mae.forEach((m) => {
                    // 绝对值超过阈值的数据
                    if (Math.abs(m) > mae) {
                        // 上下范围
                        if (m > 0) {        // 大于阈值的
                            item["above"] = 1
                            above_avg.push(m) 
                        } else if (m < 0) { // 小于阈值负值的
                            item["below"] = 1
                            below_avg.push(Math.abs(m))
                        }
                    }
                })
                // 根据上下范围确定数据
                if (above_avg.length === 0) {
                    item["aboveAvg"] = 0
                    item["aboveAll"] = 0
                } else {
                    item["aboveAvg"] = d3.sum(above_avg) / above_avg.length
                    item["aboveAll"] = above_avg
                }
                if (below_avg.length === 0) {
                    item["belowAvg"] = 0
                    item["belowAll"] = 0
                } else {
                    item["belowAvg"] = d3.sum(below_avg) / below_avg.length
                    item["belowAll"] = below_avg
                }
            })
        })

        // 以15min为间隔找出每段时间的mae异常值的最大值
        const aboveMax = d3.max(timeDateList, d => d.aboveAvg)
        const belowMax = d3.max(timeDateList, d => d.belowAvg)
        // 创建比例尺
        const scaleA = d3.scaleLinear()
            .domain([0, aboveMax])
            .range([0, 1])
        const scaleB = d3.scaleLinear()
            .domain([0, belowMax])
            .range([0, 1])


        const {chart} = this
        // this.timeDate
        // const {startTime,endTime,widthOffset,heightOffset} = this.state
        
        chart.scaleColor = d3.scaleLinear()
                                .domain([0, d3.max(Object.values(calendar_data))])
                                .range([config.cellColor1, config.cellColor2]);
        
        /* ----------------------------渲染矩形------------------------  */
        chart.renderRect = function(){
            let currentYear, currentMonth;
            let yearGroup, monthGroup;
            const initDay = startTime.getDay();
            let currentDay = initDay;
            const totalDays = getTotalDays(startTime, endTime) + initDay;

            const mainBody = chart.body()
                                    .append('g')
                                    .attr('class', 'date')
                                    .attr('transform', 'translate(' + 45 + ',' + 20 + ')')
            
            while(currentDay <= totalDays){
                let currentDate = getDate(startTime, currentDay).split('-');
                timeDateList.forEach((item) => {
                    if(item.date === currentDate.join("-")){
                        

                    if(!currentYear || currentDate[0] !== currentYear){
                        currentYear = currentDate[0];

                        yearGroup = mainBody
                                        .append('g')
                                        .attr('class', 'year ' + currentYear);
                    }

                    if (!currentMonth || currentDate[1] !== currentMonth){
                        currentMonth = currentDate[1];

                        monthGroup = yearGroup.append('g').attr('class', 'month ' + currentMonth);
                    }
                    // monthGroup
                    monthGroup
                        .append('g')
                        .attr('class', 'g ' + currentDate.join('-'))
                        .datum(item)
                        .append('rect')
                        .attr("class",'g rect' + currentDate.join('-'))
                        .attr('width', config.cellWidth)
                        .attr('height', config.cellHeight)
                        // .attr('x', Math.floor(currentDay / 7) * widthOffset)
                        // .attr('y', currentDay % 7 * heightOffset);
                        .attr('x', currentDay % 7 * widthOffset)
                        .attr('y', Math.floor(currentDay / 7) * heightOffset)
                        .attr('fill',"rgb(204,204,204)")
                    
                        const svg = monthGroup.append('g')
                            .attr('class','pathAngle' + currentDate.join('-'))
                    // 先绘制上部的红色三角形
                    // svg.select("#pathangle")
                    // .selectAll(".path-angle1")

                        svg.append("path")
                        // d3.select(".g pathAngle" + currentDate.join("-"))
                        .datum(item)
                        
                        .attr("class", "g path-angle1" + currentDate.join('-'))
                        // .attr("time", d => {
                        //     let time = parseInt(d.time.split(":")[0])
                        //     return time // d的格式：h:m:s
                        // })
                        .attr("d", d => {
                            // let width = this.Xscale_.bandwidth() + 2 // .bandwidth(): 刻度宽度
                            // let height = this.Yscale_.bandwidth() - 2
                            // let x = this.Xscale_(d.time)
                            // let y = this.Yscale_(d3.timeDay(d.date_dic))
                            let x = currentDay % 7 * widthOffset
                            let y = Math.floor(currentDay / 7) * heightOffset
                            return `M${x} ${y} L${x + widthOffset} ${y} L${x} ${y + heightOffset} L${x} ${y}`
                        })
                        .attr("stroke", "none")
                        .attr("fill", d => {
                            // 判断是否上下阈值都超过了，超过了即填充颜色
                            if (d.above === 1 && d.below === 1) {
                                return d3.interpolateReds(scaleA(d.aboveAvg))
                            } else {
                                return "none"
                            }
                        })
                    // 绘制下部蓝色
                    // svg.select("#pathangle")
                    //     .selectAll(".path-angle2" + currentDate.join("-"))
                    // monthGroup.append("g") 
                    
                    // d3.select("g pathAngle" + currentDate.join("-"))
                        svg
                        .append("path")
                        .datum(item)
                        .attr("class", "g path-angle2" + currentDate.join("-"))
                        // .attr("time", d => {
                        //     let time = parseInt(d.time.split(":")[0])
                        //     return time
                        // })
                        .attr("d", d => {
                            // let width = this.Xscale_.bandwidth() + 2
                            // let height = this.Yscale_.bandwidth() - 2
                            // let x = this.Xscale_(d.time)
                            // let y = this.Yscale_(d3.timeDay(d.date_dic))
                            let x = currentDay % 7 * widthOffset
                            let y = Math.floor(currentDay / 7) * heightOffset
                            return `M${x} ${y + heightOffset} L${x + widthOffset} ${y + heightOffset} L${x + widthOffset} ${y} L${x} ${y + heightOffset}`
                        })
                        .attr("stroke", "none")
                        .attr("fill", d => {
                            if (d.above === 1 && d.below === 1) {
                                return d3.interpolateBlues(scaleB(d.belowAvg))
                            } else {
                                return "none"
                            }
                        })

                    
                    
                // 对于上下两个阈值没有同时超过的
                // svg.select("#pathangle")
                //     .selectAll(".path-angle3")
                // monthGroup.append("g")
                // d3.select("g.g pathAngle" + currentDate.join("-"))
                    svg
                    .append("path")
                    .datum(item)
                    .attr("class", "g path-angle3" + currentDate.join("-"))
                    // .attr("time", d => {
                    //     let time = parseInt(d.time.split(":")[0])
                    //     return time
                    // })
                    .attr("d", d => {
                        // let width = this.Xscale_.bandwidth() + 2
                        // let height = this.Yscale_.bandwidth() - 2
                        // let x = this.Xscale_(d.time)
                        // let y = this.Yscale_(d3.timeDay(d.date_dic))
                        let x = currentDay % 7 * widthOffset
                        let y = Math.floor(currentDay / 7) * heightOffset
                        return `M${x} ${y} L${x + widthOffset} ${y} L${x + widthOffset} ${y + heightOffset} L${x} ${y + heightOffset} L${x} ${y}`
                    })
                    .attr("stroke", "none")
                    .attr("fill", d => {
                        if (d.above === 1 && d.below === 0) {
                            return d3.interpolateReds(scaleB(d.aboveAvg))
                        } else if (d.above === 0 && d.below === 1) {
                            return d3.interpolateBlues(scaleB(d.belowAvg))
                        }
                        else {
                            return "none"
                        }
                    })


            

                        }
                    })

                    
                
                currentDay++;
            }

            d3.selectAll('.g')
                .each(function(d){
                    d3.select(this)
                        // .attr('fill', chart.scaleColor(calendar_data[d] || 0))
                        // .attr('fill',"rgb(204,204,204)")
                        // .datum(item);
                });

            function getTotalDays(startTime, endTime){
                return Math.floor((endTime.getTime() - startTime.getTime()) / 86400000);
            }

            function getDate(startTime, day){
                const date =  new Date(startTime.getTime() + 86400000 * (day - initDay));
                return d3.timeFormat("%Y-%m-%d")(date);
            }
        }

        /* ----------------------------渲染分隔线------------------------  */
        chart.renderLine = function(){
            const initDay = startTime.getDay();
            const days = [initDay-1];
            const linePaths = getLinePath();

            d3.select('.date')
                    .append('g')
                    .attr('class', 'lines')
                    .selectAll('path')
                    .data(linePaths)
                    .enter()
                    .append('path')
                    .attr('stroke', config.lineColor)
                    .attr('stroke-width', config.lineWidth)
                    .attr('fill', 'none')
                    .attr('d', (d) => d);

            function getLinePath(){
                const paths = [];

                d3.selectAll('.month')
                    .each(function(d,i){
                        days[i+1] = days[i] + this.childNodes.length;
                    });

                days.forEach((day,i) => {
                    let path = 'M';
                    let weekDay = day < 0 ? 6 : day % 7;

                    if (weekDay !== 6) {
                        path += Math.floor(day / 7) * widthOffset + ' ' + 7 * heightOffset;
                        path +=  ' l' + '0' + ' ' + (weekDay - 6) * heightOffset;
                        path += ' l' + widthOffset + ' ' + '0';
                        path += ' l' + '0' + ' ' + (-weekDay - 1) * heightOffset;
                    } else {
                        path += (Math.floor(day / 7) + 1) * widthOffset + ' ' + 7 * heightOffset;
                        path +=  ' l' + '0' + ' ' + (-7) * heightOffset;
                    }

                    paths.push(path);
                });

                return paths;
            }

        }

        /* ----------------------------渲染文本标签------------------------ */
        chart.renderText = function(){
            // let week = ['Sun', 'Mon', 'Tue', 'Wed', 'Tur', 'Fri', 'Sat'];
            let week = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

            d3.select('.year')
                .append('g')
                .attr('class', 'week')
                .selectAll('.label')
                .data(week)
                .enter()
                .append('text')
                .attr('class', 'label')
                .attr('x', 0)
                .attr('y',  -10)
                .attr('dx', (d,i) => i * heightOffset + 4)
                .text((d)=>d);

            let months = d3.timeMonth.range(
                                            new Date(startTime.getFullYear(), startTime.getMonth()+1, startTime.getDate()), 
                                            new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate())
                                            );

            months = months.map((d) => d3.timeFormat("%b")(d));

            d3.select('.year')
                .append('g')
                .attr('class', 'month-label')
                .selectAll('text')
                .data(["May","June"])
                .enter()
                .append('text')
                .attr('y', (d,i) => i*widthOffset*4.25 + widthOffset*2)
                .attr('x', -30)
                .text((d) => d.date)

        }

        /* ----------------------------渲染图标题------------------------  */
        // chart.renderTitle = function(){

        //     chart.svg().append('text')
        //             .classed('title', true)
        //             .attr('x', chart.width()/2)
        //             .attr('y', 0)
        //             .attr('dy', '2em')
        //             .text(config.title)
        //             .attr('fill', config.textColor)
        //             .attr('text-anchor', 'middle')
        //             .attr('stroke', config.textColor);

        // }

        

        /* ----------------------------绑定鼠标交互事件------------------------  */
        chart.addMouseOn = function(){
            //防抖函数
            // function debounce(fn, time){
            //     let timeId = null;
            //     return function(){
            //         const context = this;
            //         const event = d3.event;
            //         timeId && clearTimeout(timeId)
            //         timeId = setTimeout(function(){
            //             d3.event = event;
            //             fn.apply(context, arguments);
            //         }, time);
            //     }
            // }

            function debounce(fn, time) {
                let timeoutId
                return function () {
                    clearTimeout(timeoutId)
                    timeoutId = setTimeout(() => {
                        fn.apply(this, arguments)
                    }, time)
                }
            }
    
            d3.selectAll('.g')
                .on('mouseenter', function(event,d){
                    // const e = d3.event
                    const e = event
                    const position = d3.pointer(event,chart.svg().node());
    
                    // d3.select(e.target)
                    //     .attr('fill', config.hoverColor);
                    // console.log("node mouseEnter",d)
                    // d3.select(".floatWindow")
                    chart.svg()
                    .append('text')
                    .classed('tip', true)
                    .attr('x', position[0]+5)
                    .attr('y', position[1])
                    .attr('fill', config.textColor)
                    .text(d.date);

                    const floatWindows_martix = document.getElementById("floatWindow-matrix")
					floatWindows_martix.style.display = "block"
                    
                    _this.props.FloatKmeans(d.date,_this.attrLabel,_this.state.anomalyThresholdData)
                    // d3.select("div.LineCompale").attr("display","none")
                    // .attr('fill', config.textColor)
                        // .text(d.date);
                })
                .on('mouseleave', function(event,d){
                    // const e = d3.event;
                    // const e = event
    
                    // d3.select(e.target)
                    //     .attr('fill', chart.scaleColor(d));
                    d3.select(".tip").remove()
                    const floatWindows_martix = document.getElementById("floatWindow-matrix")
					floatWindows_martix.style.display = "none"
                    d3.select('.floatWindow').remove();
                    // d3.select("div.LineCompale").attr("display","inline")
                })
                .on('mousemove', debounce(function(event,d){
                        const position = d3.pointer(event,chart.svg().node());
                        d3.select('.tip')
                        .attr('x', position[0]+5)
                        .attr('y', position[1]-5);
                    }, 6)
                );
        }

        chart.render = function(){

            // chart.renderTitle();

            chart.renderRect();

            // chart.renderLine();

            chart.renderText();

            chart.addMouseOn();

        }

        chart.renderChart();
    }

    

    render() {
        const { inputValue, inputValue2, display, scatterLoading, disabled, Statistics } = this.state
        const dataT = this.props.dataT

        // const scLoading = scatterLoading === false ? ("Reduced-Dimension Map") : (<Spin />)
        const scLoading = scatterLoading === false ? ("RDM") : (<Spin />)

        const sourceKey = this.data
        const keyLength = sourceKey.length
        const MonthE = { 4: "May", 5: "June" }
        const colorLabel = [
            "#99cc99",
            "rgb(250,210,131)",
            "rgb(190,186,218)",
            "rgb(204,204,204)",
            "#FFCC99",
            "#CCCCFF",
            "rgb(126,232,154)",
            "rgb(150,151,177)",
            "rgb(242,169,104)",
            "rgb(160,142,216)",
            "rgb(243,230,136)",
        ]
        const NameLabel = []
        const Pname = []

        // zd-
        const selectHour = []
        const selectMinute = [0, 15, 30, 45]
        for (let i = 0; i < 24; i++) {
            selectHour.push(i)
        }

        
        for (let key in dataT) {
            Pname.push(key)
        }
        let LabelString = `${100 / inputValue}%`
        for (let i = 0; i < inputValue; i++) {
            NameLabel.push(i)
            if (i !== 0) {
                LabelString += " " + 100 / inputValue + "%"
            }
        }
        // const divLabel = NameLabel.map((item, index) => {
        //     return (
        //         <div key={"grid-div" + index} style={{ background: colorLabel[index], borderRight: index === 3 ? "0px" : "1px solid rgb(180,180,180)" }}></div>
        //     )
        // })
        const daydict = {
            "4": [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
            "5": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
        }
        const content_child = daydict[this.state.month].map((item) => {
            return (
                <div style={{ boxSizing: "border-box", float: "left", border: "1px solid white", width: "20px", height: "20px", cursor: "pointer" }} onClick={(e) => {
                    DeletTemp()
                    let weekd = {
                        "0": "SUN",
                        "1": "MON",
                        "2": "TUES",
                        "3": "WED",
                        "4": "THUR",
                        "5": "FRI",
                        "6": "SAT"
                    }
                    let d = String(item).length === 2 ? String(item) : "0" + item
                    let date = "2020-0" + (this.state.month + 1) + "-" + d
                    let week = new Date(date).getDay()

                    this.props.GeneralLineRander(item, this.state.month)
                    
                    this.timeDate = '2020-' + (this.state.month + 1 >= 10 ? String(this.state.month + 1) : "0" + String(this.state.month + 1)) + '-' + (item >= 10 ? String(item) : '0' + String(item))
                    
                    this.props.KmeansR(this.attrLabel,this.timeDate)
                    this.AttrsAdjust()

                    this.setState({ Selectday: item, week: weekd[week] })
                    d3.select("#lineHeight").select("#circlepath").selectAll("path").remove()
                    d3.select("#lineHeight").select("#circle").selectAll("circle").remove()
                }}>
                    {item}
                </div>
            )
        })
        const content = (
            <div style={{ width: "150px", height: "60px" }}>
                {content_child}
            </div>
        )
        const source_key = sourceKey.map((item, index) => {
            return (
                <div key={"key" + index} className="keyName" id={"keyname" + index} style={{
                    height: this.split.height,
                    width: this.theme.width - 4,
                    marginTop: "5px",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontWeight: 800,
                }} onClick={(e) => {
                    if (isNaN(this.select)) {
                        this.select.style.color = "black"
                    }
                    e.target.parentNode.style.color = "red"
                    let childs = e.target.parentNode.childNodes[1]
                    this.select = e.target.parentNode
                    let keyName = childs.innerHTML
                    this.name = keyName
                    this.props.KeyNameChange(this.name, this.state.month + 1, this.state.Selectday)
                }}>
                    <div style={{
                        width: this.split.wNum,
                        height: this.split.height,
                        float: "left",
                        marginLeft: "10px",
                    }}>{item.num}</div>
                    <div style={{
                        width: this.split.wId,
                        height: this.split.height,
                        float: "left",
                    }}>{item.id}</div>
                    <div style={{
                        width: this.split.wNumber,
                        height: this.split.height,
                        float: "left",
                    }}>{item.number}</div>
                    <div style={{
                        width: this.split.wyear,
                        height: this.split.height,
                        float: "left",
                    }}>{item.year}</div>
                    <div style={{
                        width: this.split.wdate,
                        height: this.split.height,
                        float: "left"
                    }}>{item.date}</div>
                </div>
            )
        })
        return (
            <div className='Control' style={{ position: 'absolute', ...this.theme }}>
                <div style={{ ...this.theme.title }}></div>
                {/* <div style={{ width: this.theme.width, height: "180px" }}> */}
                {/* <table className="gridtable">
                        <thead>
                            <tr>
                                <th>Year</th>
                                <th>Date</th>
                                <th>Inverters</th>
                                <th>TrainNum</th>
                                <th>MAE</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>2020</td>
                                <td>05/15 06/17</td>
                                <td>22</td>
                                <td>28723</td>
                                <td>200</td>
                            </tr>
                        </tbody>
                    </table> */}
                {/* </div> */}
                {/* <Divider style={{ margin: "8px 0" }} /> */}
                {/* <div style={{ width: this.theme.width, height: 100 }}></div> */}
                {/* <Divider style={{ margin: "8px 0" }} /> */}

                <div id="mouthChoice" style={{ width: this.theme.width, height: 200 }}>
                    {/* Row标签表示行，Col标签表示列，span属性代表此行要放多少列 */}
                    {/* 确定聚类的k值以及步长 */}
                    <Row>
                        <span style={{ marginTop: "4px", marginLeft: "2px", marginRight: "1px" }}>Knum:</span>
                        <Col span={14}> {/*span: 15 - 1 = 14 */}
                            <Slider
                                min={1}
                                max={6}
                                onChange={this.onChange}
                                value={typeof inputValue === 'number' ? inputValue : 0}
                                step={1}
                            />
                        </Col>
                        <Col span={4}>
                            <InputNumber
                                min={1}
                                max={6}
                                style={{ margin: '0 5px', height: "20px", width: "50px", marginTop: "5px" }}
                                step={1}
                                value={inputValue}
                                onChange={this.onChange}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <span style={{ marginTop: "4px", marginLeft: "2px", marginRight: "3px" }}>Step:</span>
                        <Col span={14} style={{ marginLeft: "6px" }}>

                            <Slider
                                min={1}
                                max={6}
                                onChange={this.onChange1}
                                value={typeof inputValue2 === 'number' ? inputValue2 : 0}
                                step={1}
                            />
                        </Col>
                        <Col span={4}>
                            <InputNumber
                                min={1}
                                max={6}
                                style={{ margin: '0 5px', height: "20px", width: "50px", marginTop: "5px" }}
                                step={1}
                                value={inputValue2}
                                onChange={this.onChange1}
                            />
                        </Col>
                    </Row>
                    {/* 参数设置活动条 */}
                    <div style={{ width: this.theme.width, height: "100px", overflow: "auto" }}>
                        <svg id="attrs" style={{ width: this.theme.width - 2, height: 100 / 4 * inputValue, background: "#EDEDED" }}>
                            <g id="gs"></g>
                        </svg>
                    </div>
                    <div style={{ width: this.theme.width, height: "20px", marginTop: "10px" }}>
                        <button style={{width: this.theme.width - 10}} className="myButton" onClick={() => {
                            if (inputValue2 === 5) {
                                alert("Change time step") // 如果Step是5，则会显示一个提示框(因为5不能整除12)
                            } else {
                                let labelnum = parseInt(12 / inputValue2)
                                if (labelnum < inputValue) {
                                    alert("Category exceeded") // 超出类别警告
                                } else {
                                    this.attrLabel = []
                                    const Lo = document.getElementById("t-loading")
                                    Lo.style.display = "block" // 修改其他jsx模块的标签的属性
                                    const url = "http://localhost:5000/Kmeans"
                                    axios({
                                        method: "post",
                                        url: url,
                                        data: {
                                            "split": inputValue2, // 小时间隔
                                            "k": inputValue,
                                        }
                                    }).then(responer => {
                                        let num = 0
                                        let label = {}
                                        // 重新确定分类时间段
                                        for (let key in responer.data) {
                                            if (responer.data[key] in label === false) {
                                                label[responer.data[key]] = num
                                                num += 1
                                            }
                                        }
                                        // this.attrLabel: 储存聚类后的数据
                                        for (let key in responer.data) {
                                            this.attrLabel.push({ "time": key, "label": parseInt(label[responer.data[key]]) })
                                        }
                                        
                                        this.props.KmeansR(this.attrLabel,this.timeDate)
                                        this.AttrsAdjust()//分类的滑动条

                                        // 绘制日历图
                                        this.calendarRender()
                                        // this.StatisticsRender()//统计信息
                                        this.setState({ disabled: false })
                                        Lo.style.display = "none"
                                    })
                                }
                            }
                        }}>Matrix View</button>
                    </div>
                </div>
                {/* <Divider style={{ margin: "8px 0" }} /> */}

                {/* 原ID部分 */}
                {/* <div style={{ width: this.theme.width - 2, height: "190px" }} id="grid"> */}
                    {/* 表格头部分 */}
                    {/* <div id="grid-one">
                        <div style={{ textAlign: "center", borderTop: "1px solid rgb(180,180,180)", borderBottom: "1px solid rgb(180,180,180)", lineHeight: "200%" }}>
                            ID
                        </div>
                        <div id="grid-one-1" style={{ border: "1px solid rgb(180,180,180)" }}>
                            <div style={{ textAlign: "center", borderBottom: "1px solid rgb(180,180,180)", lineHeight: "200%" }}>DC-AVG</div>
                            <div style={{ display: "grid", gridTemplateRows: "100%", gridTemplateColumns: LabelString }}>
                                {divLabel}
                            </div>
                        </div>
                        <div id="grid-one-2">
                            <div style={{ textAlign: "center", borderBottom: "1px solid rgb(180,180,180)", lineHeight: "200%" }}>Anomaly-Num</div>
                            <div style={{ display: "grid", gridTemplateRows: "100%", gridTemplateColumns: LabelString }}>
                                {divLabel}
                            </div>
                        </div>
                    </div> */}
                    {/* 表格数据部分 */}
                    {/* <div id="grid-two" style={{ overflow: "auto", borderBottom: "1px solid rgb(180,180,180)" }}>
                        <div style={{ width: this.theme.width - 2, height: (142.5 / 8) * Pname.length }}>
                            {Statistics}
                        </div>
                    </div>
                </div> */}


                {/* 悬浮框(不知是否有用) */}
                <div style={{ width: this.theme.width - 4, height: "130px", position: "absolute", top: "170px", left: "1px", display: display }} id="scole">
                    <div style={{ width: this.theme.width - 4, height: "20px" }}>
                        <svg style={{ marginLeft: "230px" }} t="1637551712519" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3580" width="20" height="20"><path d="M878.933333 426.666667H938.666667l-85.333334 85.333333-42.666666 42.666667v-21.333334C810.666667 358.4 665.6 213.333333 490.666667 213.333333S170.666667 358.4 170.666667 533.333333 315.733333 853.333333 490.666667 853.333333c145.066667 0 264.533333-93.866667 307.2-226.133333l55.466666-55.466667c-21.333333 183.466667-174.933333 324.266667-358.4 324.266667C290.133333 896 128 733.866667 128 533.333333S290.133333 170.666667 490.666667 170.666667c174.933333 0 320 123.733333 354.133333 290.133333l34.133333-34.133333z" fill="#515151" p-id="3581"></path></svg>
                        <svg id="wrong" t="1637551642942" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2416" width="20" height="20" ><path d="M558.933333 529.066667l285.866667 285.866666-29.866667 29.866667-285.866666-285.866667-285.866667 285.866667-29.866667-29.866667 285.866667-285.866666L213.333333 243.2l29.866667-29.866667 285.866667 285.866667L814.933333 213.333333l29.866667 29.866667-285.866667 285.866667z" fill="#515151" p-id="2417"></path></svg>
                    </div>
                    <div style={{ width: this.theme.width - 4, height: "110px", overflow: "auto" }}>
                        <div style={{ width: this.theme.width - this.flowwidth - 4, height: keyLength * this.split.height }}>
                            {source_key}
                        </div>
                    </div>
                </div>


                <Divider style={{ margin: "8px 0" }} />

                <div style={{ width: this.theme.width, height: "80px" }}>
                    {/* 选择日期, width: 280 - 40 - 40 = 200 */}
                    <div style={{ padding: 1, width: "217px" , float:"left"}}>
                        <Row gutter={5}>
                            {/* gutter: 6 - 1 = 5 */}
                            <Col>
                                <Select
                                    size="small"
                                    dropdownMatchSelectWidth={false}
                                    className="my-year-select"
                                    value={String(2020)}>
                                    <Select.Option key={2020} value={2020} className="year-item">
                                        {2020}
                                    </Select.Option>,
                                </Select>
                            </Col>
                            <Col>
                                {/* <div style={{ border: "1px solid rgb(217,217,217)", width: "60px", height: "24px", borderRadius: "2px", textAlign: "center" }}> */}
                                {/* {
                                        MonthE[this.state.month]
                                    } */}
                                <Select
                                    size="small"
                                    dropdownMatchSelectWidth={false}
                                    className="my-year-select"
                                    value={MonthE[this.state.month]}
                                    onChange={month => {
                                        this.setState({ "month": month })
                                    }}>
                                    <Select.Option key={"may"} value={4} className='month-item'>
                                        {"May"}
                                    </Select.Option>,
                                    <Select.Option key={"june"} value={5} className='month-item'>
                                        {"June"}
                                    </Select.Option>,
                                </Select>
                                {/* </div> */}
                            </Col>
                            <Col>
                                {/* width: 60 - 20 = 40 */}
                                <div style={{ border: "1px solid rgb(217,217,217)", width: "40px", height: "24px", borderRadius: "2px", textAlign: "center" }}>
                                    {
                                        this.state.week
                                    }
                                </div>
                            </Col>
                            <Popover trigger="hover" title={MonthE[this.state.month]} content={content}>
                                <Col style={{ cursor: "pointer" }}>
                                    <div style={{ border: "1px solid rgb(217,217,217)", width: "24px", height: "24px", borderRadius: "2px", textAlign: "center" }}>
                                        {this.state.Selectday}
                                    </div>
                                </Col>
                            </Popover>
                        </Row>
                    </div>
                    <div style={{ padding: 1, width: "217px" , float:"left",display:"none"}}>
                        <Row gutter={5}>
                            <Col>
                                <Select
                                    size="small"
                                    dropdownMatchSelectWidth={false}
                                    className="my-day-select"
                                    value={this.state.hour1}
                                    onChange={hour => {
                                        this.setState({ "hour1": hour })
                                    }}>
                                    {selectHour.map( hour => {
                                        return (
                                            <Select.Option key={hour} value={hour} className='hour-item'>
                                                {hour}时
                                            </Select.Option>
                                        )
                                    })}
                                </Select>
                            </Col>
                            <Col>
                                <Select
                                    size="small"
                                    dropdownMatchSelectWidth={false}
                                    className="my-day-select"
                                    value={this.state.minute1}
                                    onChange={minute => {
                                        this.setState({ "minute1": minute })
                                    }}>
                                    {selectMinute.map( minute => {
                                        return (
                                            <Select.Option key={minute} value={minute} className='hour-item'>
                                                {minute}分
                                            </Select.Option>
                                        )
                                    })}
                                </Select>
                            </Col>
                            {/* 至
                            <Col>
                                <Select
                                    size="small"
                                    dropdownMatchSelectWidth={false}
                                    className="my-day-select"
                                    value={this.state.hour2}
                                    onChange={hour => {
                                        this.setState({ "hour2": hour })
                                    }}>
                                    {selectHour.map( hour => {
                                        if (hour >= this.state.hour1) {
                                            return (
                                                <Select.Option key={hour} value={hour} className='hour-item'>
                                                    {hour}时
                                                </Select.Option>
                                            )
                                        }
                                    })}
                                </Select>
                            </Col>
                            <Col>
                                <Select
                                    size="small"
                                    dropdownMatchSelectWidth={false}
                                    className="my-day-select"
                                    value={this.state.minute2}
                                    onChange={minute => {
                                        this.setState({ "minute2": minute })
                                    }}>
                                    {selectMinute.map( minute => {
                                        return (
                                            <Select.Option key={minute} value={minute} className='hour-item'>
                                                {minute}分
                                            </Select.Option>
                                        )
                                    })}
                                </Select>
                            </Col> */}
                        </Row>
                    </div>
                    {/* 更新矩阵视图的按钮 */}
                    <div style={{id:'fix_button', background:"linear-gradient(to bottom, #ffffff 5%, #f6f6f6 100%)", backgroundColor:"#ffffff", fontWeight: "bold", fontFamily:"Arial", fontSize: "15px", textShadow:"0px 1px 0px #ffffff", color:"#666666", cursor:'pointer', marginTop:"2px", borderRadius:"2px", textAlign:"center", lineHeight:"23px", width: '25px', float:"left", height:"23.5px", marginLeft:"1px", border:"1px solid rgb(180,180,180)",display:"none"}}
                        onClick={(e) => {
                            this.timeDate = '2020-' + (this.state.month + 1 >= 10 ? String(this.state.month + 1) : "0" + String(this.state.month + 1)) + '-' + (this.state.Selectday >= 10 ? String(this.state.Selectday) : '0' + String(this.state.Selectday))
                            // this.props.FloatKmeans(this.attrLabel)
                        }}
                        onMouseOut={() => {
                            $('#fix_button').css('background', 'linear-gradient(to bottom, #f6f6f6 5%, #ffffff 100%)')
                            $('#fix_button').css('background-color', '#f6f6f6')
                        }}
                        onMouseOver={() => {
                            $('#fix_button').css('background', 'linear-gradient(to bottom, #ffffff 5%, #f6f6f6 100%)')
                            $('#fix_button').css('background-color', '#ffffff')
                        }}>
                        fix
                    </div>
                    {/* 确认按钮 */}
                    {/* <div style={{ width: this.theme.width, height: "35px", marginTop: "10px", float:"left" }}>
                        <button style={{width: this.theme.width - 10}} disabled={disabled} className="myButton" onClick={() => {
                            const url = "http://localhost:5000/MDS"
                            this.setState({ scatterLoading: true })
                            axios({
                                method: "post",
                                url: url,
                                data: {
                                    "split": inputValue2,
                                    // "mae": inputValue,
                                    "month": parseInt(this.state.month) + 1,
                                    "day": this.state.Selectday
                                }
                            }).then(responer => {
                                this.setState({ scatterLoading: false })
                                this.props.MDSFetch(responer.data, inputValue2, this.state.Selectday, parseInt(this.state.month) + 1)
                            })
                        }}>{scLoading}</button>
                    </div> */}

                    <div style={{ width: this.theme.width/2, height: "35px", marginTop: "10px", float:"left" }}>
                        <button style={{width: (this.theme.width - 20)/2}} disabled={disabled} className="myButton" onClick={() => {
                            const url = "http://localhost:5000/MDS1"
                            this.setState({ scatterLoading: true })
                            axios({
                                method: "post",
                                url: url,
                                data: {
                                    "split": inputValue2,
                                    // "mae": inputValue,
                                    "month": parseInt(this.state.month) + 1,
                                    "day": this.state.Selectday
                                }
                            }).then(responer => {
                                this.setState({ scatterLoading: false })
                                this.props.MDSFetch(responer.data, inputValue2, this.state.Selectday, parseInt(this.state.month) + 1)
                            })
                        }}>{scLoading}1</button>
                    </div>
                    <div style={{ width: this.theme.width/2, height: "35px", marginTop: "10px", float:"left" }}>
                        <button style={{width: (this.theme.width - 20)/2}} disabled={disabled} className="myButton" onClick={() => {
                            const url = "http://localhost:5000/MDS2"
                            this.setState({ scatterLoading: true })
                            axios({
                                method: "post",
                                url: url,
                                data: {
                                    "time": this.state.hour1*4+this.state.minute1/15,
                                    // "mae": inputValue,
                                    "month": parseInt(this.state.month) + 1,
                                    "day": this.state.Selectday
                                }
                            }).then(responer => {
                                //  
                                console.log("control mds2\n",this.state.hour1*4+this.state.minute1/15,parseInt(this.state.month) + 1,this.state.Selectday)
                                // test
                                this.setState({ scatterLoading: false })
                                this.props.MDSFetch(responer.data, inputValue2, this.state.Selectday, parseInt(this.state.month) + 1)
                            
                            })
                        }}>{scLoading}2</button>
                    </div>

                    <div id="Calendar"></div>
                    {/* <Calendar currentTimeDate={this.timeDate} allData={this.dataT}></Calendar> */}
                </div>
            </div>
        )
    }
}
export default Control;