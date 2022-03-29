import React, { Component } from 'react'
import * as d3 from 'd3'
import axios from 'axios'
import {thresholdPercentage,URL} from "../constant/index"
import MyHeader from "../components/MyHeader"
import {getTime,getdate,DeletTemp} from "./methods"
import Chart from "./calendar/chart"
const calendar_data = require("./calendar/data.json")

export default class AbnormalCalendar extends Component {

    constructor(props){
        super(props)
        this.chart = new Chart()
        this.selectDay = null
        
    }


    calendarRender(){
    const config = {
        // margins: {top: 80, left: 50, bottom: 50, right: 50},
        textColor: 'black',
        title: '日历热力图',
        hoverColor: 'red',
        startTime: '2020-05-15',
        endTime: '2020-06-17',
        cellWidth: 25,
        cellHeight: 25,
        cellPadding: 4,
        cellColor1: 'white',
        cellColor2: 'green',
        lineColor: 'yellow',
        lineWidth: 2,
        rectRxRy:5
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
            // 取得该时间段的 极值
            dataset = dataset.concat(timedict[time]) // .concat(): 链接两个数组，返回连接后的数组
            // 取得该时间段的所有 lose_mae
            datatotal = datatotal.concat(totaldict[time])
        })
        // 所有lose_mae 从大到小排列
        datatotal = datatotal.sort((a, b) => { return a - b })
        // 根据此类的时间段 得到所有无效逆变器的lose_mae的数值
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
                if (sum / (datatotal.length - decline) >= thresholdPercentage) { // 要使得大于 max 阈值的数据数在这个比例里面 >= 0.01 
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
    const inverterID = []
    for (let key in dataT) { // 存入逆变器名称
        inverterID.push(key)
    }
    const dataSection = dataT[inverterID[0]]
    const timeDict = {}
    const timeDate = {}
    const timeDateList = []
    dataSection.forEach((item) => {
        let time = getTime(item.date_time) // 获得 h:m:s 结构的时间
        let date = getdate(item.date_time) // 获得 y-m-d 结构的时间
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
            let date = getdate(item.date_time)
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

    const scaleAB = d3.scaleLinear()
                        .domain([0,aboveMax + belowMax])
                        .range([0,1])
    
    const myBackgroundColor = "RGB(240,240,240)"

    const computeGreen = d3.interpolateRgb(myBackgroundColor,"rgb(0, 148, 50)")
    const computeRed = d3.interpolateRgb("rgb(204, 204, 204)","rgb(244, 67, 54)")


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
                                .attr('transform', 'translate(' + 40 + ',' + 20 + ')')  // 45 -> 
        
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
                    .attr("class",'g rect ' + currentDate.join('-'))
                    .attr('width', config.cellWidth)
                    .attr('height', config.cellHeight)
                    // .attr('x', Math.floor(currentDay / 7) * widthOffset)
                    // .attr('y', currentDay % 7 * heightOffset);
                    .attr('x', currentDay % 7 * widthOffset + config.cellPadding)
                    .attr('y', Math.floor(currentDay / 7) * heightOffset + config.cellPadding)
                    .attr('rx',() => {
                        return config.rectRxRy
                    })
                    .attr('ry',() => {
                        return config.rectRxRy
                    })
                    .attr('fill',myBackgroundColor)
                    .attr("stroke",(d) => {
                        // console.log("rect",d)
                        // return "red"
                    })
                
                    const svg = monthGroup.append('g')
                        .attr('class','pathAngle ' + currentDate.join('-'))

                monthGroup.append('text')
                .datum(item)
                .attr('class', "g path-text " + currentDate.join("-"))
                .attr("x",d => {
                    let x = currentDay % 7 * widthOffset + config.cellWidth/3
                    return x 
                })
                .attr("y",d => {
                    let y = Math.floor(currentDay / 7) * heightOffset + config.cellHeight*7/8
                    return y
                })
                .attr("font-size","15px")
                // .attr("z-index","99")
                .text((d)=>{

                    const date = d.date.split("-")
                    return date[2]
                });
                // 先绘制上部的红色三角形
                // svg.select("#pathangle")
                // .selectAll(".path-angle1")

                    svg
                    // .append("path")
                    // d3.select(".g pathAngle" + currentDate.join("-"))
                    .datum(item)
                    
                    .attr("class", "g path-angle1 " + currentDate.join('-'))
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
                            return computeRed(scaleA(d.aboveAvg))
                            // return d3.interpolateReds(scaleA(d.aboveAvg))
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
                    // .append("path")
                    .datum(item)
                    .attr("class", "g path-angle2 " + currentDate.join("-"))
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
                            return computeGreen(scaleB(d.belowAvg))
                            // return d3.interpolateBlues(scaleB(d.belowAvg))
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
                .append("rect")
                .datum(item)
                .attr("class", "g path-angle3 " + currentDate.join("-"))
                // .attr("time", d => {
                //     let time = parseInt(d.time.split(":")[0])
                //     return time
                // })
                // .attr("d", d => {
                //     // let width = this.Xscale_.bandwidth() + 2
                //     // let height = this.Yscale_.bandwidth() - 2
                //     // let x = this.Xscale_(d.time)
                //     // let y = this.Yscale_(d3.timeDay(d.date_dic))
                //     let x = currentDay % 7 * widthOffset
                //     let y = Math.floor(currentDay / 7) * heightOffset
                //     return `M${x} ${y} L${x + widthOffset} ${y} L${x + widthOffset} ${y + heightOffset} L${x} ${y + heightOffset} L${x} ${y}`
                // })
                .attr("x",d => {
                    let x = currentDay % 7 * widthOffset
                    return x + config.cellPadding
                })
                .attr("y",d => {
                    let y = Math.floor(currentDay / 7) * heightOffset
                    return y + config.cellPadding
                })
                .attr("height" , d => {
                    return config.cellHeight
                } )
                .attr("width",d => {
                    return config.cellWidth
                })
                .attr('rx',() => {
                    return config.rectRxRy
                })
                .attr('ry',() => {
                    return config.rectRxRy
                })
                .attr("stroke", "none")
                .attr("border-radius","4px 4px")
                .attr("border","1px")
                .attr("fill", d => {
                    // if (d.above === 1 && d.below === 0) {
                    //     return computeRed(scaleB(d.aboveAvg))
                    //     // return d3.interpolateReds(scaleB(d.aboveAvg))
                    // } 
                    
                    if (d.above === 1 || d.below === 1) {
                        // return d3.interpolateGreens(scaleAB(d.belowAvg + d.aboveAvg))
                        return computeGreen(scaleAB(d.belowAvg + d.aboveAvg))
                        // return d3.interpolateBlues(scaleB(d.belowAvg))
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

        // 绘制颜色比例尺
        let linear = d3.scaleLinear().domain([0, 100]).range([0, 1])
        // let compute = d3.interpolate('red', 'blue')
        // computeGreen

        const myColorScale =  d3.select('.body')
                                .append('g')
                                .attr("transform",`translate(${10},${0})`)
                                // .attr("viewBox", [0, 0, 100, 100])
        
        myColorScale.selectAll('.rect colorScale').data(d3.range(100)).enter()
                    .append('rect')
                    .attr("class",'rect colorScale')
                    .attr('y', (d,i) => i * 1.8)
                    .attr('x', 0)
                    .attr('width', 15)
                    .attr('height', 18)
                    .style('fill', (d,i) => computeGreen(linear(d)))

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
        // let week = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        let week = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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
            .attr('dx', (d,i) => i * widthOffset + 6)
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

        d3.selectAll('.g.path-text')
            .on("click",function(event,d){
                // console.log("abnormalCalendar",event,d)
                // console.log("path",event.path)
                d3.selectAll("text.g").attr("stroke","none")
                d3.select(event.path[0])
                        .attr("stroke","red")
                
                // 更新日历图选中的 日期
                _this.selectDay = d.date 
                
                // TODO: 与散点图联系（首要）
                _this.props.connectCalendarAndScatter(d.date)
                // TODO: 与矩阵图联系（首要）
                _this.props.connectCalendarAndMatrix(d.date)
                
                // TODO: 与 时序图联系 （待定）
                DeletTemp()
                d3.select("#lineHeight").select("#circlepath").selectAll("path").remove()
                d3.select("#lineHeight").select("#circle").selectAll("circle").remove()
                const selectCurrentDay = d.date.split("-")
                
                _this.props.GeneralLineRander(selectCurrentDay[2],selectCurrentDay[1]-1)
                
            })
            .on('mouseenter', function(event,d){
                // const e = d3.event

                // const e = event
                // const position = d3.pointer(event,chart.svg().node());
                
                // console.log("mouseEnter",event,d)
                // d3.select(e.target)
                //     .attr('fill', config.hoverColor);
                // console.log("node mouseEnter",d)
                // d3.select(".floatWindow")

                // chart.svg()
                // .append('text')
                // .classed('tip', true)
                // .attr('x', position[0]+5)
                // .attr('y', position[1])
                // .attr('fill', config.textColor)
                // .text(d.date);

                // const floatWindows_martix = document.getElementById("floatWindow-matrix")
                // floatWindows_martix.style.display = "block"
                
                // _this.props.FloatKmeans(d.date,_this.attrLabel,_this.state.anomalyThresholdData)
                // d3.select("div.LineCompale").attr("display","none")
                // .attr('fill', config.textColor)
                    // .text(d.date);
            })
            .on('mouseleave', function(event,d){
                // const e = d3.event;
                // const e = event

                // d3.select(e.target)
                //     .attr('fill', chart.scaleColor(d));

                // d3.select(".tip").remove()

                // const floatWindows_martix = document.getElementById("floatWindow-matrix")
                // floatWindows_martix.style.display = "none"
                // d3.select('.floatWindow').remove();
                // d3.select("div.LineCompale").attr("display","inline")
            })

            // .on('mousemove', debounce(function(event,d){
            //         const position = d3.pointer(event,chart.svg().node());
            //         d3.select('.tip')
            //         .attr('x', position[0]+5)
            //         .attr('y', position[1]-5);
            //     }, 6)
            // );
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
    return (
      <div id="Calendar" style={{...this.props.theme}}>
        <MyHeader title="Abnormal Calendar" position={false}></MyHeader>
      </div>
    )
  }
}
