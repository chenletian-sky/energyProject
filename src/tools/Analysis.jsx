import React from 'react';
import * as d3 from 'd3';
import { Spin } from 'antd';
import {DeletTemp} from "./methods"
import MyHeader from "../components/MyHeader"
class Analysis extends React.Component {
    theme
    data
    constructor(props) {
        super(props)
        this.state = {}
        this.theme = this.props.theme
        this.data = this.props.data
        this.MAE = 200
        this.keyName = []
        this.padding = {
            top: 1,
            left: 35,
            right: 10,
            bottom: 20,
            height: this.theme.height,
            width: this.theme.width,
            linePos: 120,
        }
        this.padding_float = {
            top: 1,
            left: 35,
            right: 10,
            bottom: 20,
            height: this.theme.height * 0.4,
            width: this.theme.width * 0.4,
            linePos: 120,
        }
        this.percent = 1
        this.TimeDate = null
        this.Xscale_ = null
        this.Yscale_ = null
        this.Xscale_float = null
        this.Yscale_float = null
    }
    // x坐标轴部分 对应的构造函数
    xAxis = (g, x) => {
        const padding = this.padding
        g.attr("transform", `translate(0,${padding.top})`)
            // .call()函数：对整体集合进行操作，后面括号里的是回调函数。
            .call(d3.axisBottom(x)) // 坐标生成器
            .call(g => {
                g.selectAll("text").attr("dy", -0.9)
                const text = g.selectAll("text")
                const textList = text["_groups"][0]
                for (let i = 0; i < textList.length; i++) {
                    const strs = textList[i].innerHTML.split(":")
                    if (strs[1] === "00") {
                        textList[i].innerHTML = strs[0]
                    } else {
                        textList[i].innerHTML = ""
                    }
                }
            })
            .call(g => g.selectAll("path").remove())
            .call(g => g.selectAll("line").remove())
    }
    formatDay = () => {
        const formatMonth = d3.timeFormat("%b %-d")
        const formatDate = d3.timeFormat("%-d")
        return d => (d.getDate() === 1 ? formatMonth : formatDate)(d);
    }
    // y坐标轴部分 对应的构造函数
    yAxis = (g, y) => {
        const padding = this.padding
        g.attr("transform", `translate(${padding.left},0)`)
            // .call(d3.axisLeft(y).tickFormat(this.formatDay()))
            .call(d3.axisLeft(y).tickFormat((d,index) => index+1))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text").attr("font-size", "8px"))
            .call(g => g.selectAll("line").attr("stroke", "rgb(140,140,140)"))
    }
    xAxis_float = (g, x) => {
        const padding = this.padding_float
        g.attr("transform", `translate(0,${padding.top})`)
            // .call()函数：对整体集合进行操作，后面括号里的是回调函数。
            .call(d3.axisBottom(x)) // 坐标生成器
            .call(g => {
                g.selectAll("text").attr("dy", -0.9)
                const text = g.selectAll("text")
                const textList = text["_groups"][0]
                for (let i = 0; i < textList.length; i++) {
                    const strs = textList[i].innerHTML.split(":")
                    if (strs[1] === "00") {
                        textList[i].innerHTML = strs[0]
                    } else {
                        textList[i].innerHTML = ""
                    }
                }
            })
            .call(g => g.selectAll("text").attr("font-size", `${8 * 0.4}px`))
            .call(g => g.selectAll("path").remove())
            .call(g => g.selectAll("line").remove())
    }
    yAxis_float = (g, y) => {
        const padding = this.padding_float
        g.attr("transform", `translate(${padding.left},0)`)
            // .call(d3.axisLeft(y).tickFormat(this.formatDay()))
            .call(d3.axisLeft(y).tickFormat((d,index) => index+1))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text").attr("font-size", `${8 * 0.4}px`))
            .call(g => g.selectAll("line").attr("stroke", "rgb(140,140,140)"))
    }
    pathareas = (P, N, xScale, yscale) => {
        let path = "M" + (xScale(P[0].date)) + " " + yscale(P[0].number)
        for (let i = 1; i < P.length; i++) {
            path += "L" + (xScale(P[i].date)) + " " + yscale(P[i].number)
        }
        for (let i = N.length - 1; i >= 0; i--) {
            path += "L" + (xScale(N[i].date)) + " " + yscale(-N[i].number)
        }
        path += "L" + (xScale(P[0].date)) + " " + yscale(-P[0].number)
        return path
    }
    /**没用 */
    // forceShow = () => {
    //     const data = this.data
    //     const padding = this.padding
    //     const mae = this.MAE
    //     const that = this
    //     for (let key in data) {
    //         this.keyName.push(key)
    //     }
    //     /**
    //      * 绘制横坐标
    //      */
    //     const dataSection = data[this.keyName[0]]
    //     const number = data[this.keyName[0]].length
    //     const xScale = d3.scaleTime()
    //         .domain(d3.extent(dataSection, d => new Date(d.date_time)))
    //         .range([padding.left, padding.width - padding.right])
    //     const svg = d3.select("#bubble")
    //         .attr("viewBox", [0, 0, padding.width, padding.height])
    //     const gx = svg.select("#xScale")
    //         .call(this.xAxis, xScale)
    //     const Line_id = document.getElementById("xScale")
    //     const Line = Line_id.getElementsByClassName("tick")
    //     for (let i = 0; i < Line.length; i++) {
    //         let line = Line[i].childNodes[0]
    //         line.setAttribute("stroke", "rgb(140,140,140)")
    //         line.setAttribute("stroke-width", "1px")
    //         if (Line[i].childNodes.length === 2) {
    //             let text = Line[i].childNodes[1]
    //             text.setAttribute("fill", "rgb(140,140,140)")
    //             if (text.innerHTML === "June") {
    //                 line.setAttribute("y2", 0)
    //                 line.setAttribute("y1", -250)
    //                 line.setAttribute("stroke-dasharray", "5,5")
    //                 text.setAttribute("y", -230)
    //             }
    //         }
    //     }
    //     const yScale = d3.scaleLinear()
    //         .domain([-22, 22])
    //         .range([padding.linePos + 100, padding.linePos - 100])
    //     svg.select("#yScale")
    //         .call(this.yAxis, yScale, data)
    //     let RectTime = []
    //     for (let key in data) {
    //         data[key].forEach((item) => {
    //             let timeString = new Date(item.date_time).getFullYear() + "-" + (new Date(item.date_time).getMonth() + 1) + "-" + new Date(item.date_time).getDate()
    //             RectTime.push(timeString)
    //         })
    //     }
    //     RectTime = Array.from(new Set(RectTime))
    //     RectTime = RectTime.map((item) => {
    //         return new Date(item)
    //     })
    //     const rectBack = svg.select("#backRect")
    //         .selectAll(".backrect")
    //         .data(RectTime)
    //         .join("rect")
    //         .attr("class", "backrect")
    //         .attr("x", d => xScale(d))
    //         .attr("y", 0)
    //         .attr("width", (d, i) => {
    //             if (i + 1 < RectTime.length) {
    //                 return xScale(RectTime[i + 1]) - xScale(d)
    //             } else {
    //                 return 0
    //             }
    //         })
    //         .attr("height", "250px")
    //         .attr("fill", (d, i) => {
    //             if (i % 2 === 0) {
    //                 return "rgb(186,186,186)"
    //             } else {
    //                 return "white"
    //             }
    //         })
    //         .attr("opacity", 0.3)
    //     let circle_P = []
    //     let circle_N = []
    //     for (let i = 0; i < number; i++) {
    //         let numP = 0
    //         let numN = 0
    //         let dataTime = []
    //         let dateNow = ""
    //         for (let key in data) {
    //             dataTime.push(data[key][i])
    //             dateNow = data[key][i].date_time
    //         }
    //         dataTime.forEach((item) => {
    //             if (item.loss_mae > mae) {
    //                 if (item.testPre - item.dc_power > 0) {
    //                     circle_P.push({
    //                         "id": item.source_key,
    //                         "date": item.date_time,
    //                         "num": numP,
    //                         "pre": item.testPre,
    //                         "loss_mae": item.loss_mae,
    //                         "tru": item.dc_power
    //                     })
    //                     numP += 1
    //                 } else {
    //                     circle_N.push({
    //                         "id": item.source_key,
    //                         "date": item.date_time,
    //                         "num": numN,
    //                         "pre": item.testPre,
    //                         "loss_mae": item.loss_mae,
    //                         "tru": item.dc_power
    //                     })
    //                     numN += 1
    //                 }
    //             }
    //         })
    //     }
    //     const maxP = d3.max(circle_P, d => d.loss_mae)
    //     const maxN = d3.max(circle_N, d => d.loss_mae)
    //     const scalePos = d3.scaleSequential([0, maxP], d3.interpolateReds)
    //     const scaleNev = d3.scaleSequential([0, maxN], d3.interpolateBlues)
    //     let rectP = []
    //     let rectN = []
    //     for (let i = maxP; i >= 0; i -= 5) {
    //         rectP.push(i)
    //     }
    //     for (let i = maxN; i >= 0; i -= 2.5) {
    //         rectN.push(i)
    //     }
    //     const svgTag = d3.select("#tags")
    //     svgTag.selectAll(".rectP")
    //         .data(rectP)
    //         .join("rect")
    //         .attr("class", "rectP")
    //         .attr("x", (d, i) => (630 + i * 1))
    //         .attr("y", "2px")
    //         .attr("width", "1px")
    //         .attr("height", "8px")
    //         .attr("fill", d => scalePos(d))
    //     svgTag.selectAll(".textMax")
    //         .data([maxP, maxN])
    //         .join("text")
    //         .attr("class", "textMax")
    //         .attr("x", "610px")
    //         .attr("y", (d, i) => 10 + i * 8)
    //         .text(d => parseInt(d))
    //         .attr("fill", "rgb(140,140,140)")
    //         .attr("font-size", "10px")
    //     svgTag.selectAll(".rectN")
    //         .data(rectN)
    //         .join("rect")
    //         .attr("class", "rectN")
    //         .attr("x", (d, i) => (630 + i * 1))
    //         .attr("y", "10px")
    //         .attr("width", "1px")
    //         .attr("height", "8px")
    //         .attr("fill", d => scaleNev(d))
    //     svgTag.selectAll(".textMin")
    //         .data([0, 0])
    //         .join("text")
    //         .attr("class", "textMin")
    //         .attr("x", "790px")
    //         .attr("y", (d, i) => 10 + i * 8)
    //         .text(d => parseInt(d))
    //         .attr("fill", "rgb(140,140,140)")
    //         .attr("font-size", "10px")
    //     const PosCircle = svg.selectAll(".circleP")
    //         .data(circle_P)
    //         .join("circle")
    //         .attr("class", "circleP")
    //         .attr("r", "2px")
    //         .attr("cx", d => xScale(d.date))
    //         .attr("cy", d => d.num === 0 ? (padding.linePos) : (padding.linePos + ((d.num - 1) * 4 + 2)))
    //         .attr("fill", d => scalePos(d.loss_mae))
    //     const NevCircle = svg.selectAll(".circleN")
    //         .data(circle_N)
    //         .join("circle")
    //         .attr("class", "circleN")
    //         .attr("r", "2px")
    //         .attr("cx", d => xScale(d.date))
    //         .attr("cy", d => d.num === 0 ? (padding.linePos) : (padding.linePos - ((d.num - 1) * 4 + 2)))
    //         .attr("fill", d => scaleNev(d.loss_mae))
    //     function zoomed(event) {
    //         const xz = event.transform.rescaleX(xScale)
    //         PosCircle.attr("cx", d => xz(d.date))
    //         NevCircle.attr("cx", d => xz(d.date))
    //         rectBack.attr("x", d => xz(d))
    //         rectBack.attr("width", (d, i) => {
    //             if (i + 1 < RectTime.length) {
    //                 return xz(RectTime[i + 1]) - xz(d)
    //             } else {
    //                 return 0
    //             }
    //         })
    //         // const pathUpdate = that.pathareas(pathP, pathN, xz, yScale)
    //         // path_an.attr("d", pathUpdate)
    //         gx.call(that.xAxis, xz);
    //         for (let i = 0; i < Line.length; i++) {
    //             let line = Line[i].childNodes[0]
    //             line.setAttribute("stroke", "rgb(140,140,140)")
    //             line.setAttribute("stroke-width", "1px")
    //             if (Line[i].childNodes.length === 2) {
    //                 let text = Line[i].childNodes[1]
    //                 text.setAttribute("fill", "rgb(140,140,140)")
    //                 if (text.innerHTML === "June") {
    //                     line.setAttribute("y2", 0)
    //                     line.setAttribute("y1", -250)
    //                     line.setAttribute("stroke-dasharray", "5,5")
    //                     text.setAttribute("y", -230)
    //                 }
    //             }
    //         }
    //     }
    //     const zoom = d3.zoom()
    //         .scaleExtent([1, 2000])
    //         .extent([[padding.left, 0], [padding.width - padding.right, padding.height]])
    //         .translateExtent([[padding.left, -Infinity], [padding.width - padding.right, Infinity]])
    //         .on("zoom", zoomed)
    //     svg.call(zoom)
    //         .transition()
    //         .duration(750)
    // }

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



    //------------------------------------------------------

    // 绘制聚类图函数
    // 绘制显示的层次
    Csanangle = (data) => { // data：聚类的类别数据
        const padding = this.padding
        const svg = d3.select("#bubble")
            // viewbox：可以根据父级大小缩放svg绘制出来的大小，具体内容就是：[x轴起点，y轴起点，要截取的宽度，要截取的高度] 
            .attr("viewBox", [0, 0, padding.width, padding.height])
        const labelMae = {}
        const labels = []
        data.forEach((item) => {
            let mae = item.mae // 阈值
            labelMae[item.label] = mae // 存入每类的阈值(之前计算出的阈值)
            labels.push(item.label) // 存入类别标签
        })
        let dataInfo = this.TimeDate // 每个数据的信息
        dataInfo.forEach((item) => { // 初始化
            item.above = 0
            item.below = 0
        })
        labels.forEach((l) => {
            let dataset = []
            dataInfo.forEach((item) => {
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
                } else {
                    item["aboveAvg"] = d3.sum(above_avg) / above_avg.length
                }
                if (below_avg.length === 0) {
                    item["belowAvg"] = 0
                } else {
                    item["belowAvg"] = d3.sum(below_avg) / below_avg.length
                }
            })
        })

        // 以15min为间隔找出每段时间的mae异常值的最大值
        const aboveMax = d3.max(dataInfo, d => d.aboveAvg)
        const belowMax = d3.max(dataInfo, d => d.belowAvg)
        // 创建比例尺
        const scaleA = d3.scaleLinear()
            .domain([0, aboveMax])
            .range([0, 1])
        const scaleB = d3.scaleLinear()
            .domain([0, belowMax])
            .range([0, 1])
        
        // 此种情况暂时不需要绘制
        // 绘制上下阈值都超过了的矩形
        // 先绘制上部的红色三角形

        /* svg.select("#pathangle")
            .selectAll(".path-angle1")
            .data(dataInfo)
            .join("path")
            .attr("class", "path-angle1")
            .attr("time", d => {
                let time = parseInt(d.time.split(":")[0])
                return time // d的格式：h:m:s
            })
            .attr("d", d => {
                let width = this.Xscale_.bandwidth() + 2 // .bandwidth(): 刻度宽度
                let height = this.Yscale_.bandwidth() - 2
                let x = this.Xscale_(d.time) 
                let y = this.Yscale_(d3.timeDay(d.date_dic))
                return `M${x} ${y} L${x + width} ${y} L${x} ${y + height} L${x} ${y}`
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
            .on("click",(event,d) => {
                console.log("pathAngle",event,d)

                this.props.beforeMDSFetch(d)
            }) */

        // 绘制下部蓝色

        /* svg.select("#pathangle")
            .selectAll(".path-angle2")
            .data(dataInfo)
            .join("path")
            .attr("class", "path-angle2")
            .attr("time", d => {
                let time = parseInt(d.time.split(":")[0])
                return time
            })
            .attr("d", d => {
                let width = this.Xscale_.bandwidth() + 2
                let height = this.Yscale_.bandwidth() - 2
                let x = this.Xscale_(d.time)
                let y = this.Yscale_(d3.timeDay(d.date_dic))
                return `M${x} ${y + height} L${x + width} ${y + height} L${x + width} ${y} L${x} ${y + height}`
            })
            .attr("stroke", "none")
            .attr("fill", d => {
                if (d.above === 1 && d.below === 1) {
                    return d3.interpolateBlues(scaleB(d.belowAvg))
                } else {
                    return "none"
                }
            })
            .on("click",(event,d) => {
                
                this.props.beforeMDSFetch(d)
            }) */

        // 对于上下两个阈值没有同时超过的
        svg.select("#pathangle")
            .selectAll(".path-angle3")
            .data(dataInfo)
            .join("path")
            .attr("class", "path-angle3")
            .attr("time", d => {
                let time = parseInt(d.time.split(":")[0])
                return time
            })
            .attr("d", d => {
                let width = this.Xscale_.bandwidth() + 2
                let height = this.Yscale_.bandwidth() - 2
                let x = this.Xscale_(d.time)
                // let y = this.Yscale_(d3.timeDay(d.date_dic))
                let y = this.Yscale_(d.id)
                return `M${x} ${y} L${x + width} ${y} L${x + width} ${y + height} L${x} ${y + height} L${x} ${y}`
            })
            .attr("inverterId",(d) => d.id)
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
            .on("click" , (event,d) => {
                // 与 散点图 联系
                // this.props.beforeMDSFetch(d)
                
                const times = data[d.label].time[0].split("~")
                // const firstNumber =  parseInt(times[0])  
                const sendTimes = {
                    first:times[0],
                    end:times[1]
                }
                // 预处理
                DeletTemp()
                d3.select("#compaleline").selectAll("g").remove()

                console.log("test lineCompareChange",d.id,sendTimes,data[d.label].mae,data,d.time)
                const selectCurrentData = d.date.split("-")
                var sendObject = {
                    id:d.id,
                    time:d.time,
                    // mae:data[d.label]
                }
                // 与散点图进行交互
                // this.props.MDSFetchWithMatrix(sendObject)
                // 交互传参 当前逆变器的id 时间段(聚类的时间段 eg:["13~16"]) 当前类别的设定阈值(mae) 当前聚类，步长 以及阈值的总数据
                this.props.LineCompareChange(d.id,sendTimes,data[d.label].mae,data)
                // 右下角 compare 改变
                // console.log("analysis time",d.time,d.id, data,d)
                this.props.KeyNameChange(d.id, parseInt(selectCurrentData[1]),parseInt(selectCurrentData[2]), data)
            })
    }

    // 聚好类后再运行的部分(处理数据，绘制背景矩阵图)
    matirxRender = (Klabel,currentTimeDate) => { // 这里的Klabel数据为聚类返回的数据，每个元素都为{时间, 标签值}
        const KLabeldict = {}
        Klabel.forEach((item) => {
            let time = item.time.split("~")
            for (let i = parseInt(time[0]); i < parseInt(time[1]); i++) {
                KLabeldict[i] = item.label
            }
        })
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
        const data = this.data
        const padding = this.padding
        for (let key in data) { // 存入逆变器名称
            this.keyName.push(key)
        }
        const dataSection = data[this.keyName[0]] // 存入data里面第一个逆变器的数据
        const timeDay = []
        const timeDict = {} // 时 这一数据的字典
        const timeDate = {}
        const timeDateList = []
        const timeInfo = []
        const TimePercent = []

        // 获取所有的时 和 y:m:d 数据
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

        for (let key in timeDict) {
            if (key.split(":")[0] !== "05") {
                timeDay.push(key) // 存入 h:m:s
            }
        }
        for (let key in timeDate) {
            timeDateList.push(key) // 存入 y-m-d
        }
        // timeDateList_copy 多存入 2020-05-14 这一天
        const timeDateList_copy = ["2020-05-14"]
        timeDateList.forEach((item) => {
            timeDateList_copy.push(item) // 存入 y-m-d
        })

        const dateExtent = d3.extent(timeDateList, d => new Date(d)) // 存入日期的最大最小区间
        const dateExtent_copy = d3.extent(timeDateList_copy, d => new Date(d)) // 同上
        // 将数据储存入 timeInfo 列表里面，每个的间隔是默认的15分钟
        timeDateList.forEach((date, index) => { // y-m-d
            timeDay.forEach((time) => { // h:m:s
                let times = parseInt(time.split(":")[0]) // 提取 hour 数据，用于后面确定聚类标签
                timeInfo.push({ "date": date, "time": time, "above": 0, "below": 0, "mae":[], "date_dic": d3.timeDays(...dateExtent_copy)[index], "label": KLabeldict[times] })
            })
        })

        // 处理出 timeInfo 里面的mae数据(预测发电量于实际发电量的差值)
        for (let key in data) {
            data[key].forEach((item) => {
                // 再次处理出我们所需的时间数据
                let date = this.getdate(item.date_time)
                let time = this.getTime(item.date_time)
                timeInfo.forEach((label) => {
                    if (label.date === date && label.time === time) {
                        label['mae'].push(key,item.testPre - item.dc_power) // testPre: 预测发电数据，dc_power原始发电数据，依次存入所有逆变器的mae数据
                        // if (item.loss_mae > this.MAE) {
                        // if (item.testPre - item.dc_power > 0) {
                        //     label["above"] += 1
                        //     label["aboveList"].push(item.loss_mae)

                        // } else if (item.testPre - item.dc_power < 0) {
                        //     label["below"] += 1
                        //     label["belowList"].push(item.loss_mae)
                        // }
                        // }
                    }
                })
            })
        }
        // 时间数据
        // this.TimeDate = timeInfo
        // console.log("analysis",timeInfo)
        const inverterID = Object.keys(data)
        const analysis_timeInfo = []
        inverterID.forEach((id,index) => {
            timeDay.forEach((time) => {
                let times = parseInt(time.split(":")[0])
                analysis_timeInfo.push({"date":currentTimeDate,"id":id,"time":time,"above":0,"below":0,"mae":[], "label": KLabeldict[times]})
            })
        })

        // 处理出 timeInfo 里面的mae数据(预测发电量于实际发电量的差值)
        for (let key in data) {
            data[key].forEach((item) => {
                // 再次处理出我们所需的时间数据
                let date = this.getdate(item.date_time)
                let time = this.getTime(item.date_time)
                analysis_timeInfo.forEach((label) => {
                    
                    if (label.date === date && label.time === time && label.id === key) {
                        label['mae'].push( item.testPre - item.dc_power ) // testPre: 预测发电数据，dc_power原始发电数据，依次存入所有逆变器的mae数据
                        // if (item.loss_mae > this.MAE) {
                        // if (item.testPre - item.dc_power > 0) {
                        //     label["above"] += 1
                        //     label["aboveList"].push(item.loss_mae)

                        // } else if (item.testPre - item.dc_power < 0) {
                        //     label["below"] += 1
                        //     label["belowList"].push(item.loss_mae)
                        // }
                        // }
                    }
                })
            })
        }

        this.TimeDate = analysis_timeInfo
        // this.TimeDate = timeInfo

        const xDomainx = new d3.InternSet(timeDay) // 对时间排序
        // 创建x、y轴比例尺
        const xScale = d3.scaleBand(xDomainx, [35, padding.width - padding.right]).padding(0.3)
        // const yScale = d3.scaleBand(d3.timeDays(...dateExtent_copy), [6, padding.height - 18]).round(true) // .round(): 为true,表示启用取整操作。
        const yScale = d3.scaleBand(inverterID, [6, padding.height - 18]).round(true) // .round(): 为true,表示启用取整操作。
        // const yScale = d3.scaleOrdinal(inverterID,[6, padding.height - 18]).round(true)
        this.Xscale_ = xScale
        this.Yscale_ = yScale
        const svg = d3.select("#bubble")
            .attr("viewBox", [0, 0, padding.width, padding.height])
        // 填入坐标轴和比例尺
        svg.select("#xScale")
            .call(this.xAxis, xScale)
        svg.select("#yScale")
            .call(this.yAxis, yScale)

        

        // 绘制背景矩阵图
        svg.select("#rectangle")
            .selectAll(".rect-angle")
            // .data(timeInfo) 
            .data(analysis_timeInfo)
            .join("rect")
            .attr("class", "rect-angle")
            .attr("x", d => xScale(d.time))
            .attr("y", d => {
                // return yScale(d3.timeDay(d.date_dic))
                return yScale(d.id)
            })
            .attr("width", xScale.bandwidth() + 2)
            .attr("height", yScale.bandwidth() - 2)
            .attr("fill", d => {
                let time = parseInt(d.time.split(":")[0])
                return colorLabel[KLabeldict[time]]
            })
            .attr("stroke", "none")
            .attr("opacity", 0.3)
            .attr("time", d => {
                let time = parseInt(d.time.split(":")[0])
                return time
            })
            .on("click",(event,d) => {
                // console.log("analysis matrix",event,d,yScale(d3.timeDay(d.date_dic)))

                // 添加 矩阵方块点击事件
                /* this.props.beforeMDSFetch(d)
                
                d3.select(".momentHighlightRectangle").remove()
                svg.append("rect")
                    .attr("class","momentHighlightRectangle")
                    .attr("x", xScale(d.time))
                    .attr("y",8)
                    .attr("width",xScale.bandwidth() + 2)
                    .attr("height",(yScale.bandwidth() - 2)*45)
                    .attr("fill","#7e96a6")
                    .attr("opacity",0.8) */
            })

        // svg.select("#pathangle")
        //     .selectAll(".path-angle1")
        //     .data(timeInfo)
        //     .join("path")
        //     .attr("class", "path-angle1")
        //     .attr("time", d => {
        //         let time = parseInt(d.time.split(":")[0])
        //         return time
        //     })
        //     .attr("d", d => {
        //         let width = xScale.bandwidth() + 2
        //         let height = yScale.bandwidth() - 2
        //         let x = xScale(d.time)
        //         let y = yScale(d3.timeDay(d.date_dic))
        //         return `M${x} ${y} L${x + width} ${y} L${x} ${y + height} L${x} ${y}`
        //     })
        //     .attr("stroke", "black")
        //     .attr("fill", "none")
    }

    floatingWindowRender = (currentDate,Klabel,anomalyThresholdData) => {
        const KLabeldict = {}
        Klabel.forEach((item) => {
            let time = item.time.split("~")
            for (let i = parseInt(time[0]); i < parseInt(time[1]); i++) {
                KLabeldict[i] = item.label
            }
        })

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

        const AllData = this.data
        const padding = this.padding_float
        const inverterID = []
        for (let key in AllData) { // 存入逆变器名称
            inverterID.push(key)
        }
        const dataSection = AllData[inverterID[0]] // 存入data里面第一个逆变器的数据
        const timeDay = []
        const timeDict = {} // 时 这一数据的字典
        const timeDate = {}
        const timeDateList = []
        const timeInfo = []

        // 获取所有的时 和 y:m:d 数据
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

        for (let key in timeDict) {
            if (key.split(":")[0] !== "05") {
                timeDay.push(key) // 存入 h:m:s
            }
        }
        for (let key in timeDate) {
            timeDateList.push(key) // 存入 y-m-d
        }
        // timeDateList_copy 多存入 2020-05-14 这一天
        const timeDateList_copy = ["2020-05-14"]
        timeDateList.forEach((item) => {
            timeDateList_copy.push(item) // 存入 y-m-d
        })

        const analysis_timeInfo = []
        inverterID.forEach((id,index) => {
            timeDay.forEach((time) => {
                let times = parseInt(time.split(":")[0])
                // currentTimeDate
                analysis_timeInfo.push({"date":currentDate,"id":id,"time":time,"above":0,"below":0,"mae":[], "label": KLabeldict[times]})
            })
        })

        // 处理出 timeInfo 里面的mae数据(预测发电量于实际发电量的差值)
        for (let key in AllData) {
            AllData[key].forEach((item) => {
                // 再次处理出我们所需的时间数据
                let date = this.getdate(item.date_time)
                let time = this.getTime(item.date_time)
                analysis_timeInfo.forEach((label) => {
                    
                    if (label.date === date && label.time === time && label.id === key) {
                        label['mae'].push( item.testPre - item.dc_power ) // testPre: 预测发电数据，dc_power原始发电数据，依次存入所有逆变器的mae数据
                        // if (item.loss_mae > this.MAE) {
                        // if (item.testPre - item.dc_power > 0) {
                        //     label["above"] += 1
                        //     label["aboveList"].push(item.loss_mae)

                        // } else if (item.testPre - item.dc_power < 0) {
                        //     label["below"] += 1
                        //     label["belowList"].push(item.loss_mae)
                        // }
                        // }
                    }
                })
            })
        }

        // console.log("floating window render",analysis_timeInfo)

        const xDomainx = new d3.InternSet(timeDay) // 对时间排序
        // 创建x、y轴比例尺
        const xScale = d3.scaleBand(xDomainx, [35, padding.width - padding.right]).padding(0.3)
        // const yScale = d3.scaleBand(d3.timeDays(...dateExtent_copy), [6, padding.height - 18]).round(true) // .round(): 为true,表示启用取整操作。
        const yScale = d3.scaleBand(inverterID, [6, padding.height - 18]).round(true) // .round(): 为true,表示启用取整操作。
        // const yScale = d3.scaleOrdinal(inverterID,[6, padding.height - 18]).round(true)
        
        d3.select("svg.floatWindow").remove()
        // const divAppend = d3.select(".Analysis").append("div").attr("background-color","blue")
        const svg = d3.select("#floatWindow-matrix")
            .append('svg')
            .attr("class","floatWindow").attr("background","white")
            .attr("viewBox", [0, 0, padding.width, padding.height])
        // 填入坐标轴和比例尺
        svg.append("g")
            .attr("id","xScale_float")
            .call(this.xAxis_float, xScale)
        svg.append("g")
            .attr("id",'yScale_float')
            .call(this.yAxis_float, yScale)

            svg.append("g")
            .attr("id","rectangle_float")
            .selectAll(".rect-angle")
            .data(analysis_timeInfo) // 
            .join("rect")
            .attr("class", "rect-angle")
            .attr("x", d => xScale(d.time))
            .attr("y", d => {
                // return yScale(d3.timeDay(d.date_dic))
                return yScale(d.id)
            })
            .attr("width", xScale.bandwidth() + 2)
            .attr("height", yScale.bandwidth() - 2)
            .attr("fill", d => {
                let time = parseInt(d.time.split(":")[0])
                return colorLabel[KLabeldict[time]]
            })
            .attr("stroke", "none")
            .attr("opacity", 0.3)
            .attr("time", d => {
                let time = parseInt(d.time.split(":")[0])
                return time
            })
        // 绘制 红色 和 蓝色 方块
        const labelMae = {}
        const labels = []

        anomalyThresholdData.forEach((item) => {
            let mae = item.mae // 阈值
            labelMae[item.label] = mae // 存入每类的阈值(之前计算出的阈值)
            labels.push(item.label) // 存入类别标签
        })
        let dataInfo = analysis_timeInfo // 每个数据的信息
        dataInfo.forEach((item) => { // 初始化
            item.above = 0
            item.below = 0
        })
        labels.forEach((l) => {
            let dataset = []
            dataInfo.forEach((item) => {
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
                } else {
                    item["aboveAvg"] = d3.sum(above_avg) / above_avg.length
                }
                if (below_avg.length === 0) {
                    item["belowAvg"] = 0
                } else {
                    item["belowAvg"] = d3.sum(below_avg) / below_avg.length
                }
            })
        })

        // 以15min为间隔找出每段时间的mae异常值的最大值
        const aboveMax = d3.max(dataInfo, d => d.aboveAvg)
        const belowMax = d3.max(dataInfo, d => d.belowAvg)
        // 创建比例尺
        const scaleA = d3.scaleLinear()
            .domain([0, aboveMax])
            .range([0, 1])
        const scaleB = d3.scaleLinear()
            .domain([0, belowMax])
            .range([0, 1])

        const computeGreen = d3.interpolateRgb("rgb(204, 204, 204)","rgb(139, 195, 74)")
        const computeRed = d3.interpolateRgb("rgb(204, 204, 204)","rgb(244, 67, 54)")

        
        const pathSvg = d3.select(".floatWindow").append("g").attr("id","pathangle")
        // 对于上下两个阈值没有同时超过的
        // pathSvg.select("#pathangle")
        pathSvg
            .selectAll(".path-angle3")
            .data(dataInfo)
            .join("path")
            .attr("class", "path-angle3")
            .attr("time", d => {
                let time = parseInt(d.time.split(":")[0])
                return time
            })
            .attr("d", d => {
                let width = xScale.bandwidth() + 2
                let height = yScale.bandwidth() - 2
                let x = xScale(d.time)
                // let y = this.Yscale_(d3.timeDay(d.date_dic))
                let y = yScale(d.id)
                return `M${x} ${y} L${x + width} ${y} L${x + width} ${y + height} L${x} ${y + height} L${x} ${y}`
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

    render() {
        const padding = this.padding
        return (
            <div className='Analysis' style={{ position: 'absolute', ...this.theme }}>
                {/* 上侧标题 */}
                <MyHeader title="Matrix Analysis"></MyHeader>
                {/* <div style={{
                    ...this.theme.title,
                }}> */}
                    {/* <svg id="tags" style={{ width: this.theme.title.width, height: this.theme.title.height }}></svg> */}
                {/* </div> */}
                {/* 主要展示部分 */}
                <div style={{
                    width: this.theme.width,
                    height: "300px"
                }}>
                    <svg id="bubble" style={{
                        width: this.theme.width,
                        height: "300px"
                    }}>
                        {/* <line x1={padding.left} y1={padding.linePos} x2={padding.width - padding.right} y2={padding.linePos} stroke={"rgb(140,140,140)"}></line>*/}
                        <g id="backRect"></g>
                        <g id="frontRect"></g>
                        <g className="gs"></g>
                        <g id="xScale"></g>
                        <g id="yScale"></g>
                        <g id="rectangle"></g>
                        <g id="pathangle"></g>
                    </svg>
                </div>
                {/* 加载图标 */}
                <div id="t-loading" style={{ width: "50px", height: "60px", position: "absolute", top: "130px", left: "400px", display: "none" }}>
                    <Spin size="large" />
                </div>
                <div id="floatWindow-matrix" style={{zIndex:99,backgroundColor:"white",display: "none",
                position:'absolute',
                // left:'20px', 
                top:"300px", 
                height:0.45 * this.props.theme.height, width: 0.45 * this.props.theme.width,
                border:"1px solid rgb(180,180,180)",
                }}></div>
            </div>
        )
    }
}
export default Analysis;