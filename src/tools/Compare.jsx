import React from 'react';
import * as d3 from 'd3';
import textures from 'textures';
import $ from 'jquery';
import * as echarts from 'echarts'
import 'echarts-liquidfill';
import {modelConditionalScaleData} from '../constant/index'

const Compare_scaleLine_svg_zoom = 1.25

class Compare extends React.Component {
    theme
    data
    constructor(props) {
        super(props)
        this.state = {}
        this.theme = this.props.theme
        this.data = this.props.data
        this.padding = {
            top: 10,
            left: 20,
            right: 50,
            bottom: -7,
            /**
             * @var
             * 微调 
             */
            split: 3,
            /**
             * @var
             * temporary useless
             */
            split_width: 3, 
            height: (this.theme.height - 120)*Compare_scaleLine_svg_zoom*0.8,
            width: (280)*Compare_scaleLine_svg_zoom // 280
        }
        /**
         * @var
         * up -> down
         * yAxis label
         */
        this.name = ["module_temperature", "ambient_temperature", "irradiation", "dc_power"]
        // this.nameU = ["dc_power", "irradiation", "ambient_temperature", "module_temperature"]
        this.sourceKey = null
        this.month = null
        this.day = null
        this.MAE = 200
        this.irr_T = null
        this.at_T = null
        this.mt_T = null
        this.smae = null
        this.value = null
        this.pre = null
        this.maeList = null
        this.maxMAE = 787
    }
    yAxis = (g, y) => {
        const padding = this.padding
        g.attr("transform", `translate(${padding.left},0)`)
            .call(d3.axisLeft(y).ticks(5))
            .call(g => g.selectAll(".tick").selectAll("line").remove())
            .call(g => g.selectAll("text")
                .attr("x", -2)
                .attr("font-size", "8px")
            )
        // .call(g => g.selectAll("line")
        // 	.attr("x2", this.theme.width - 10 - padding.right)
        // 	.attr("stroke", (d, i) => {
        // 		if (i !== 0) {
        // 			return "rgb(236,236,236)"
        // 		}
        // 	})
        // 	.attr("value", (d) => d)
        // 	.attr("class", "yScale")
        // )

    }

    yScaleB = (pos) => {
        let xDomain = ["SE", "AVE"]
        xDomain = new d3.InternSet(xDomain)
        const yScale = d3.scaleBand(xDomain, pos).padding(0.3)
        return yScale
    }
    xAxis = (g, y) => {
        g.attr("transform", `translate(${0},80)`)
            .call(d3.axisBottom(y).ticks(5))
            .call(g => g.selectAll(".tick").selectAll("line").remove())
            .call(g => g.selectAll("text"))
    }
    xScale = (pos) => {
        let xDomain = ["irradiation", "moduleT", "ambientT"]
        xDomain = new d3.InternSet(xDomain)
        const xScale = d3.scaleBand(xDomain, pos).padding(0.3)
        return xScale
    }
    // 水印制造
    WaterRender = () => {
        const chart = echarts.init(document.getElementById('liquidfills'), 'wonderland', { renderer: 'svg' })
        let color = null
        // console.log(this.value, this.pre);
        if (this.smae > this.MAE) {
            if (this.value - this.pre >= 0) {
                color = "rgba(101,169,211,0.5)"
            } else {
                color = "rgba(255,0,0,0.5)"
            }
        } else {
            color = "rgba(0,255,0,0.5)"
        }
        let option = {
            backgroundColor: 'white',
            toolbox: {
                show: false
            },
            // x轴
            xAxis: {
                show: false, // 不显示
            },
            // y轴
            yAxis: {
                show: false, // 不显示
            },
            series: [{
                type: 'liquidFill',
                amplitude: 0,
                radius: '130%',
                name: "MAE",
                data: [{
                    value: this.smae / this.maxMAE,
                    name: parseInt(this.smae),
                    itemStyle: {
                        normal: {
                            color: color
                        }
                    }
                }],
                label: {
                    normal: {
                        formatter: '{a}\n{b}\n',
                        textStyle: {
                            color: "black",
                            fontSize: 10
                        }
                    }
                },
                waveAnimation: false,
                outline: { // 轮廓设置
                    show: true,
                    borderDistance: 2, // 轮廓间距
                    itemStyle: {
                        borderColor: 'white', // 轮廓颜色
                        borderWidth: 20, // 轮廓大小
                    }
                },
            }]
        };
        chart.setOption(option);
        // console.log(this.smae);
    }
    /**
     * @method
     * 给select avg 绘制背景
     */
    RectShow = (data, yScale, color, name) => {
        const ave = d3.sum(data) / data.length
        const se = data[0]
        const svg = d3.select("#ploat")
        const datas = [
            { "name": "SE", "value": se },
            { "name": "AVE", "value": ave }
        ]
        // console.log(data, se);
        const xScale = d3.scaleLinear().domain([0, d3.max([ave, se])]).range([this.padding.left, 150])
        const gs = svg.append("g")
            .attr("class", "two")
        gs.append("text")
            .attr("x", this.padding.left + 10)
            .attr("y", yScale(datas[0].name) - 5)
            .text(name)
            .attr("fill", "rgb(180,180,180)")
            .attr("font-size", "10px")
        gs.selectAll("rect")
            .data(datas)
            .join("rect")
            .attr("y", d => yScale(d.name))
            .attr("x", this.padding.left + 1)
            .attr("height", "8px")
            .attr("width", d => xScale(d.value))
            .attr("fill", color)
        
            // this.WaterRender()
    }
    /**
     * @method
     * 绘制 select ave 柱形
     */
    AverageShow = () => {
        d3.select("#ploat").selectAll(".two").remove()
        
        const irr_Y = this.yScaleB([30, 60])
        const at_Y = this.yScaleB([115, 145])
        const mt_Y = this.yScaleB([75, 105])
        const svg = d3.select("#ploat")
        
        svg.append("g")
            .attr("class", "two")
            .call(this.yAxis, irr_Y)
        svg.append("g")
            .attr("class", "two")
            .call(this.yAxis, at_Y)
        svg.append("g")
            .attr("class", "two")
            .call(this.yAxis, mt_Y)
        this.RectShow(this.irr_T, irr_Y, "rgba(255,236,139,0.5)", "irradiation")
        this.RectShow(this.mt_T, mt_Y, "rgba(50,205,50,0.5)", "module_temperature")
        this.RectShow(this.at_T, at_Y, "rgba(255,127,0,0.5)", "ambient_temperature")
    }

    scaleLine = () => {
        d3.select("#ploat").selectAll("g").remove()
        const timeMae = {}

        this.maeList.forEach((item) => {
            item.time.forEach((t) => {
                let times = t.split("~")
                for (let i = parseInt(times[0]); i < parseInt(times[1]); i++) {
                    timeMae[i] = item.mae
                }
            })
        })
        let data = this.data
        let dataOne = this.data[this.sourceKey]
        let datasetAll = []
        for (let key in data) {
            data[key].forEach((item) => {
                if (item.month === this.month && item.day === this.day) {
                    datasetAll.push(item)
                }
            })
        }
        data = dataOne
        const padding = this.padding
        const name = this.name
        /**
         * @var
         * x axis data
         * left -> right
         */
        const dataName = []
        const dataNameU = []
        /**
         * @var
         * y axis data
         * up -> down
         */
        const dataNameT = []
        // padding.split = 3
        for (let i = padding.split; i >= 0; i--) {
            // 
            // dataName.push(name.slice(i))
            dataName.push(name)
        }
        dataName.forEach((item) => {
            // dataNameU.push(this.name.slice(0, item.length))
            dataNameU.push(this.name)
        })
        dataNameU.forEach((item) => {
            let nam = []
            for (let i = item.length - 1; i >= 0; i--) {
                nam.push(item[i])
            }
            dataNameT.push(nam)
        })
        // const width = (this.theme.width - padding.left - padding.right - 80 - padding.split * padding.split_width) / (padding.split + 1)
        const width = padding.width / 4
        let ScaleYRange = []
        let ScaleXRange = []
        /**
         * @member
         * 矩形图 4*4 Group
         */
        const svg = d3.select("#ploat")
                        .append("g")
                        .attr("class","all-g")
                        .attr("transform",`translate(${26},${-80})`)
                        // .attr("zoom",2)
        
        console.log("dataName",dataName)
        console.log("dataNameT",dataNameT)

        const gs = svg.selectAll(".gs")
            .data(dataName)
            .join("g")
            .attr("class", "gs")
            .attr("transform", (d, i) => {
                // i = i % 4
                ScaleYRange.push([padding.height - padding.bottom - (width) * (dataName.length - i), 
                                    padding.height - padding.bottom - (width) * (dataName.length - i) + width])
                console.log("transform i",i,d)
                // return `translate( ${this.theme.width - padding.right - ((width) * (i + 1)) + padding.split},
                return `translate( ${this.theme.width - padding.right - ((width) * (3 + 1)) + padding.split},
                                    ${padding.height - padding.bottom - (width) * (dataName.length - i)} )`
            })

        gs.selectAll(".rects")
            .data(d => d)
            .join("rect")
            .attr("class", "rects")
            .attr("x", (d, i, z) => {
                ScaleXRange.push([this.theme.width - padding.right - (width) * (z.length) + i * (width), this.theme.width - padding.right - (width) * (z.length) + i * (width) + width])
                return (width) * i - 2
            })
            .attr("y", 0)
            .attr("width", width)
            .attr("height", width)
            .attr("fill", "rgb(234,234,242)")
        // .attr("stroke", "white")
        let ScaleXRange_C = []
        // ScaleXRange_C.push([ScaleXRange[0]])
        // ScaleXRange_C.push([ScaleXRange[1], ScaleXRange[2]])
        // ScaleXRange_C.push([ScaleXRange[3], ScaleXRange[4], ScaleXRange[5]])
        // ScaleXRange_C.push([ScaleXRange[6], ScaleXRange[7], ScaleXRange[8], ScaleXRange[9]])
        ScaleXRange_C.push([ScaleXRange[0], ScaleXRange[1], ScaleXRange[2], ScaleXRange[3]])
        ScaleXRange_C.push([ScaleXRange[4], ScaleXRange[5], ScaleXRange[6], ScaleXRange[7]])
        ScaleXRange_C.push([ScaleXRange[8], ScaleXRange[9], ScaleXRange[10], ScaleXRange[11]])
        ScaleXRange_C.push([ScaleXRange[12], ScaleXRange[13], ScaleXRange[14], ScaleXRange[15]])
        
        
        ScaleXRange = ScaleXRange_C
        
        this.name.forEach((name, indexY) => {
            let dataset1 = []
            let dataset1_copy = []
            data.forEach((item1) => {
                if (item1.loss_mae > this.MAE) {
                    dataset1.push({ "num": item1[name], "lable": 1, "loss_mea": item1.loss_mae, "tru": item1.dc_power, "pre": item1.testPre, "hour": item1.hour })
                } else {
                    dataset1.push({ "num": item1[name], "lable": 0, "loss_mae": item1.loss_mae, "tru": item1.dc_power, "pre": item1.testPre, "hour": item1.hour })
                }
            })
            // deepCopy dataset1_copy <-  dataset1
            $.extend(true, dataset1_copy, dataset1)
            dataset1_copy = dataset1_copy.sort((a, b) => { return a.num - b.num })
            let dis = dataset1_copy.slice(-1)[0]['num'] - dataset1_copy[0]['num']
            let YLine = [dataset1_copy[0]['num'], dataset1_copy[0]['num'] + dis / 4, dataset1_copy[0]['num'] + 2 * dis / 4, dataset1_copy[0]['num'] + 3 * dis / 4, dataset1_copy.slice(-1)[0]['num']]
            let domainY = []
            domainY = [
                d3.min(dataset1, d => d.num),
                d3.max(dataset1, d => d.num)
            ]
            let scaleY = d3.scaleLinear()
                .domain(domainY)
                .range([ScaleYRange[indexY][1] - 2, ScaleYRange[indexY][0] + 2])
            
            dataNameT[indexY].forEach((flag, indexX) => {
                let dataset2 = []
                let dataset2_copy = []
                let domainX = []
                data.forEach((item) => {
                    dataset2.push(item[flag])
                })
                domainX = [
                    Math.min.apply(null, dataset2),
                    Math.max.apply(null, dataset2)
                ]
                let scaleX = d3.scaleLinear()
                    .domain(domainX)
                    .range([ScaleXRange[indexY][indexX][0] + 2, ScaleXRange[indexY][indexX][1] - 2])
                $.extend(true, dataset2_copy, dataset2)
                dataset2_copy = dataset2_copy.sort((a, b) => { return a - b })
                let dis_ = dataset2_copy.slice(-1)[0] - dataset2_copy[0]
                let XLine = [dataset2_copy[0], dataset2_copy[0] + dis_ / 4, dataset2_copy[0] + 2 * dis_ / 4, dataset2_copy[0] + 3 * dis_ / 4, dataset2_copy.slice(-1)[0]]
                // 暂定 没有问题
                svg.append("g")
                    .selectAll(".lines" + indexX + indexY + "X")
                    .data(XLine)
                    .join("line")
                    .attr("class", "lines" + indexX + indexY + "X")
                    .attr("x1", (d, i) => scaleX(XLine[i]))
                    .attr("x2", (d, i) => scaleX(XLine[i]))
                    .attr("y1", padding.height - padding.bottom - (width) * (dataName.length - indexY))
                    .attr("y2", padding.height - padding.bottom - (width) * (dataName.length - indexY) + width)
                    .attr("stroke", "white")
                    .attr("stroke-width", "1px")
                // TODO: 修改对齐
                svg.append("g")
                    .selectAll(".lines" + indexY + indexX + "Y")
                    .data(YLine)
                    .join("line")
                    .attr("class", "lines" + indexY + indexX + "Y")
                    // .attr("x1", padding.width + 97 - padding.right - (width) * (dataName[indexY].length) + indexX * width)
                    // .attr("x2", padding.width + 97 - padding.right - (width) * (dataName[indexY].length) + indexX * width + width)
                    .attr("x1", padding.width + 38 - padding.right - (width) * (dataName[indexY].length) + indexX * width)
                    .attr("x2", padding.width + 38 - padding.right - (width) * (dataName[indexY].length) + indexX * width + width)
                    .attr("y1", (d, i) => {
                        return scaleY(YLine[i])
                    })
                    .attr("y2", (d, i) => scaleY(YLine[i]))
                    .attr("stroke", "white")
                    .attr("stroke-width", "1px")
                // 自相关
                if (flag === name) {
                    let dataRect = []
                    let dataNumSum = []
                    let domainRect = []
                    let distance = dis_ / 15
                    for (let i = 0; i < 15; i++) {
                        let sums = 0
                        for (let j = 0; j < dataset2.length; j++) {
                            if (dataset2[j] >= dataset2_copy[0] + i * distance && dataset2[j] < dataset2_copy[0] + (i + 1) * distance) {
                                sums += 1
                            }
                        }
                        dataNumSum.push(sums)
                        dataRect.push({ "num": sums, "left": dataset2_copy[0] + i * distance, "right": dataset2_copy[0] + (i + 1) * distance })
                    }
                    domainRect = [
                        Math.min.apply(null, dataNumSum),
                        Math.max.apply(null, dataNumSum)
                    ]
                    let scaleRect = d3.scaleLinear()
                        .domain(domainRect)
                        .range([ScaleYRange[indexY][1] - 2, ScaleYRange[indexY][0] + 2])
                    svg.append("g")
                        .selectAll(".rect" + indexX + "R")
                        .data(dataRect)
                        .join("rect")
                        .attr("class", "rect" + indexX + "R")
                        .attr("x", (d, i) => scaleX(d.left))
                        .attr("y", d => scaleRect(d.num))
                        .attr("width", d => scaleX(d.right) - scaleX(d.left))
                        .attr("height", d => scaleRect(domainRect[0]) - scaleRect(d.num) + 2)
                        .attr("fill", "rgb(255,140,0)")
                    svg.append("g")
                        .selectAll(".text" + indexY + "Y")
                        .data([name])
                        .join("text")
                        .attr("class", "text" + indexY + "Y")
                        .text(d => {
                            if (indexY === 0 || indexY === 1) {
                                return d.replace("_temperature", "T")
                            } else {
                                return d
                            }
                        })
                        .attr("x", 340 + 10)
                        .attr("y", () => {
                            return scaleY(dataset2_copy[0]) - 15
                        })
                        .attr("font-size", "10px")
                        .attr("transform-origin", () => {
                            return `345 ${scaleY(dataset2_copy[0]) - 15}`
                        })
                        .attr("transform", () => {
                            return `rotate(270)`
                        })
                    svg.append("g")
                        .selectAll(".text" + indexY + "X")
                        .data([name])
                        .join("text")
                        .attr("class", "text" + indexY + "X")
                        .text(d => {
                            if (indexY === 0 || indexY === 1) {
                                return d.replace("_temperature", "T")
                            } else {
                                return d
                            }
                        })
                        .attr("x", () => {
                            return scaleX(dataset2_copy[0]) + 20
                        })
                        // x轴对应的横纵坐标
                        // .attr("y", 295)
                        .attr("y",432)// 432 
                        .attr("font-size", "10px")
                }
                else {
                    // console.log("scatter index",indexX,indexY)
                    if (indexY < 3 && indexX === 0 ||
                        indexY < 2 && indexX === 1 ||
                        indexY < 1 && indexX === 2 
                    )
                    {
                        svg.append("g")
                        .selectAll(".scatters" + indexX + indexY)
                        .data(dataset1)
                        .join("circle")
                        .attr("class", "scatters" + indexX + indexY)
                        .attr("cx", (d, i) => {
                            return scaleX(dataset2[i])
                            // return scaleY(dataset2[i])

                        })
                        .attr("cy", (d, i) => {
                            return scaleY(dataset1[i]['num'])
                            // return scaleX(dataset1[i]['num'])
                        })
                        .attr("r", "1.5px")
                        .attr("fill", d => {
                            if (d.loss_mae > timeMae[d.hour]) {
                                if (d.pre - d.tru > 0) {
                                    return "red"
                                } else {
                                    return "blue"
                                }
                            } else {
                                return "rgb(255,140,0)"
                            }
                        })
                        .attr("stroke", "white")
                        .attr("stroke-width", "0.1px")
                        .attr("loss_mae", d => d.loss_mae)
                    }else
                    svg.append("g")
                        .selectAll(".scatters" + indexX + indexY)
                        .data(dataset1)
                        .join("circle")
                        .attr("class", "scatters" + indexX + indexY)
                        .attr("cx", (d, i) => {
                            return scaleX(dataset2[i])
                        })
                        .attr("cy", (d, i) => {
                            return scaleY(dataset1[i]['num'])
                        })
                        .attr("r", "1.5px")
                        .attr("fill", d => {
                            if (d.loss_mae > timeMae[d.hour]) {
                                if (d.pre - d.tru > 0) {
                                    return "red"
                                } else {
                                    return "blue"
                                }
                            } else {
                                return "rgb(255,140,0)"
                            }
                        })
                        .attr("stroke", "white")
                        .attr("stroke-width", "0.1px")
                        .attr("loss_mae", d => d.loss_mae)
                }
            })

        })
    }

    ImportShow = () => {
        // 各种 条件的重要程度
        const data = [
            { "name": "irradiation", "import": 1.144 },
            { "name": "moduleT", "import": 0.812 },
            { "name": "ambientT", "import": 0.246 }
        ]
        const features = [
            { "name": "features", "x": 200, "y": 20 },
            { "name": "importance", "x": 245, "y": 20 }
        ]
        const svg = d3.select("#import")
        const imports = this.xScale([10, this.theme.width - 10])
        const yScale = d3.scaleLinear().domain([0, d3.max(data, d => d.import)]).range([80, 10])
        svg.select("#scales")
            .call(this.xAxis, imports)
        svg.select("#imrect")
            .selectAll("rect")
            .data(data)
            .join("rect")
            .attr("x", d => imports(d.name))
            .attr("y", d => yScale(d.import))
            .attr("height", d => (yScale(0) - yScale(d.import)))
            .attr("width", 80)
            .attr("fill", (d) => {
                if (d.name === "irradiation") {
                    return "rgba(255,236,139,0.5)"
                } else if (d.name === "moduleT") {
                    return "rgba(50,205,50,0.5)"
                } else {
                    return "rgba(255,127,0,0.5)"
                }
            })
        svg.select("#tagrect")
            .selectAll("rect")
            .data(["tag"])
            .join("rect")
            .attr("x", 250)
            .attr("y", 10)
            .attr("width", 120)
            .attr("height", 15)
            .attr("fill", "rgb(180,180,180)")
            .attr("rx", 10)
            .attr("ry", 10)

        svg.select("#tag")
            .selectAll("text")
            .data(features)
            .join("text")
            .attr("x", d => d.x + 60)
            .attr("y", d => d.y)
            .text(d => d.name)
            .attr("font-size", "11px")
            .attr("fill", "white")

    }
    
    /**
     * @method
     * 绘制多层次扇形图
     * 用于展示 irradiation moduleT ambientT  根据重要程度
     * 绘制 select 和 avg 数据的比较
     */
    multilayerSectorChartShow = (irr_T, at_T, mt_T) => {
        // const containerHeight = document.getElementsByClassName("myChange-sector").clientHeight
        // const containerWidth = document.getElementsByClassName("myChange-sector").clientWidth

        const containerHeight = 200
        const containerWidth = 380
        const margin = {
            top: 20,
            left:20,
            bottom:20,
            right:20
        }
        const height = containerHeight - margin.top - margin.bottom
        const width = containerWidth - margin.left - margin.right
        const radius = d3.min([height,width])/2
        
        // console.log("container",containerHeight,containerWidth,radius)
        
        const irr_ave = d3.sum(irr_T)/irr_T.length
        const irr_select = irr_T[0]

        const at_ave = d3.sum(at_T)/at_T.length
        const at_select = at_T[0]

        const mt_ave = d3.sum(mt_T)/mt_T.length
        const mt_select = mt_T[0]

        const finalData =  modelConditionalScaleData.map((item,index) => {
            if(item.name === "irr"){
                item = {...item,ave:irr_ave,select:irr_select,max:d3.max(irr_T),min:d3.min(irr_T)}
            }else if(item.name === "mt"){
                item = {...item,ave:mt_ave,select:mt_select,max:d3.max(mt_T),min:d3.min(mt_T)}
            }else{
                item = {...item,ave:at_ave,select:at_select,max:d3.max(at_T),min:d3.min(at_T)}
            }
            return item
        })
        console.log("finalData",finalData,modelConditionalScaleData)
        // modelConditionalScaleData
        console.log("irr_ave irr_select at_ave at_select mt_ave mt_select",irr_ave,irr_select,at_ave,at_select,mt_ave,mt_select)

        const arc = d3.arc()
                        .outerRadius(radius)
                        .innerRadius(0)
        // 纹理
        const texture = textures
                        .lines()
                        .thicker();
        const myTextures = [
            textures
            .lines()
            // .size(10)
            .size(8)
            .strokeWidth(2)
            .orientation("3/8")
            // .heavier()
            .stroke('rgb(255,236,139)'),
            textures
            .lines()
            // .size(10)
            .size(8)
            .strokeWidth(2)
            .orientation("3/8")
            // .heavier()
            .stroke('rgb(50,205,50)'),
            textures
            .lines()
            // .size(10)
            .size(8)
            .strokeWidth(2)
            .orientation("3/8")
            // .heavier()
            .stroke('rgb(255,127,0)'),
            textures
            .lines()
            // .size(10)
            .size(8)
            .strokeWidth(2)
            .orientation("7/8")
            // .heavier()
            .stroke('rgb(255,236,139)'),
            textures
            .lines()
            // .size(10)
            .size(8)
            .strokeWidth(2)
            .orientation("7/8")
            // .heavier()
            .stroke('rgb(50,205,50)'),
            textures
            .lines()
            // .size(10)
            .size(8)
            .strokeWidth(2)
            .orientation("7/8")
            // .heavier()
            .stroke('rgb(255,127,0)'),
            // textures
            //     .lines()
            //     .orientation("vertical", "horizontal")
            //     .size(4)
            //     .strokeWidth(1)
            //     .shapeRendering("crispEdges")
            //     .stroke("rgb(255,236,139)"),
            // textures
            //     .lines()
            //     .orientation("vertical", "horizontal")
            //     .size(4)
            //     .strokeWidth(1)
            //     .shapeRendering("crispEdges")
            //     .stroke("rgb(50,205,50)"),
            // textures
            //     .lines()
            //     .orientation("vertical", "horizontal")
            //     .size(4)
            //     .strokeWidth(1)
            //     .shapeRendering("crispEdges")
            //     .stroke("rgb(255,127,0)"),
            // textures
            //     .paths()
            //     .d("crosses")
            //     .lighter()
            //     .thicker()
            //     .stroke("rgb(255,236,139)")
            //     // .background("rgba(255,236,139,0.3)")
            //     ,
            // textures
            //     .paths()
            //     .d("crosses")
            //     .lighter()
            //     .thicker()
            //     .stroke("rgb(50,205,50)"),
            // textures
            //     .paths()
            //     .d("crosses")
            //     .lighter()
            //     .thicker()
            //     .stroke("rgb(255,127,0)"),
            // textures
            // .lines()
            // .orientation("3/8", "7/8")
            // .stroke("darkorange")
            ]
        
        
        // const myArcScale = (max,pointValue) => {
        //     const arcScale = d3.scaleLinear()
        //                     .domain([0,max])
        //                     .range([0,radius])
        //     return d3.arc().outerRadius(arcScale(pointValue)).innerRadius(0)
        // }
        
        // 弧度文字构造器
        const labelArc = d3.arc()
                            .outerRadius(radius/1.5)
                            .innerRadius(radius/1.5)

        const pie = d3.pie()
                        .sort(null)
                        .value((d) => {
                            return d.value
                        })

        // const ave_pie = d3.pie()
        //                     .sort(null)
        //                     .value((d) => {
        //                         return 
        //                     })
        d3.select(".template-sector-svg").remove()
        var svg = d3.select("div.myChange-sector")
                    .append("svg")
                    .attr("class","template-sector-svg")
                    .attr("height",containerHeight)
                    .attr("width",containerWidth)
                    .append("g")
                    .attr("transform", `translate(${containerWidth/2},${containerHeight/2 - 14})`)

        myTextures.forEach((t) => d3.select(".template-sector-svg").call(t))
    
        var g = svg.selectAll(".arc")
                    .data( pie(finalData) )
                    .enter()
                    .append("g")
                    .attr("class","arc")
        // 绘制 底部扇形
        g.append("path")
            .attr("d",arc)
            .style("fill", (d) => {
                const {name} = d.data
                // return myTextures[0].url()
                console.log("arc d",d)
                if(name === "irr"){
                    return "rgb(255,236,139)"
                }else if(name === "mt"){
                    return "rgb(50,205,50)"
                }else if(name === "at"){
                    return "rgb(255,127,0)"
                }
            })
            .attr("opacity",0.4)
            .attr("zIndex",-1)

            
            // 绘制 ave 扇形
            g.append("path")
            .attr("d",d3.arc()
                        .innerRadius(radius/8)
                        .outerRadius( (d) => {
                        console.log("d",d)
                        return    (d3.scaleRadial().domain([d.data["min"],d.data["max"]]).range([0,radius])(d.data['ave']) ) } )
            )
            .style("fill", (d) => {
                const {name} = d.data
                if(name === "irr"){
                    // return "rgb(255,236,139)"
                    return myTextures[0].url()
                }else if(name === "mt"){
                    // return "rgb(50,205,50)"
                    return myTextures[1].url()
                }else if(name === "at"){
                    // return "rgb(255,127,0)"
                    return myTextures[2].url()
                }
                // return "red"
            })
            .attr("opacity",(d) => {
                console.log("opacity",d)
                const {ave,select} = d.data 
                return 0.8
                if( ave > select){
                    return 0.8
                }else{
                    return 0.5
                }
            })
            // 绘制 ave 的边界
            g.append("path")
            .attr("d",d3.arc()
                        .innerRadius((d) => (d3.scaleRadial().domain([d.data["min"],d.data["max"]]).range([0,radius])(d.data['ave']) ))
                        .outerRadius( (d) => {
                        console.log("d",d)
                        return    (d3.scaleRadial().domain([d.data["min"],d.data["max"]]).range([0,radius])(d.data['ave']) )*1.02 } )
            )
            .style("fill", (d) => {
                const {name} = d.data
                if(name === "irr"){
                    return "rgb(255,236,139)"
                    // return myTextures[0].url()
                }else if(name === "mt"){
                    return "rgb(50,205,50)"
                    // return myTextures[1].url()
                }else if(name === "at"){
                    return "rgb(255,127,0)"
                    // return myTextures[2].url()
                }
                // return "red"
            })
            .attr("opacity",(d) => {
                console.log("opacity",d)
                const {ave,select} = d.data 
                return 1
                if( ave > select){
                    return 0.8
                }else{
                    return 0.5
                }
            })

            // 绘制 选中扇形
            g.append("path")
            .attr("d",d3.arc()
                        .innerRadius(radius/8)
                        .outerRadius( (d) => {
                        console.log("d",d)
                        return    (d3.scaleRadial().domain([d.data["min"],d.data["max"]]).range([0,radius])(d.data['select']) ) } )
            )
            .style("fill", (d) => {
                const {name} = d.data
                if(name === "irr"){
                    // return "rgb(255,236,139)"
                    return myTextures[3].url()
                }else if(name === "mt"){
                    // return "rgb(50,205,50)"
                    return myTextures[4].url()
                }else if(name === "at"){
                    // return "rgb(255,127,0)"
                    return myTextures[5].url()
                }
                return "red"
            })
            .attr("opacity",(d) => {
                const {ave,select} = d.data 
                return 0.8
                if( ave > select){
                    return 0.8
                }else{
                    return 0.5
                }
            } )
            // .transition()
            // .ease(d3.easeLinear)
            // .duration(2000)
            // .attrTween("d",pieTween)

            // 绘制 选中扇形 的边框
            g.append("path")
            .attr("d",d3.arc()
                        .innerRadius((d) => (d3.scaleRadial().domain([d.data["min"],d.data["max"]]).range([0,radius])(d.data['select']) ))
                        .outerRadius( (d) => {
                        console.log("d",d)
                        return    (d3.scaleRadial().domain([d.data["min"],d.data["max"]]).range([0,radius])(d.data['select']) )*1.02 } )
            )
            .style("fill", (d) => {
                const {name} = d.data
                if(name === "irr"){
                    return "rgb(255,236,139)"
                    // return myTextures[3].url()
                }else if(name === "mt"){
                    return "rgb(50,205,50)"
                    // return myTextures[4].url()
                }else if(name === "at"){
                    return "rgb(255,127,0)"
                    // return myTextures[5].url()
                }
                // return "red"
            })
            .attr("opacity",(d) => {
                const {ave,select} = d.data 
                return 1
                if( ave > select){
                    return 0.8
                }else{
                    return 0.5
                }
            } )
            
        // g.append('text')
        //     .transition()
        //     .ease(d3.easeLinear)
        //     .duration(2000)
        //     .attr("transform",(d) => {
        //         return `translate(${ labelArc.centroid(d) })`
        //     })
        //     .attr("dy",".35em")
        //     .text((d) => {
        //         console.log(d)
        //         return d.data["name"].substring(0,3)
        //     })

        function pieTween(b) {
            b.innerRadius = 0
            var i = d3.interpolate({startAngle:0,endAngle:0},b)
            return function(t){ return arc(i(t))}
        }
            

        
    }


    render() {
        return (
            <div className='Compare' style={{ position: 'absolute', ...this.theme }}>
                <div style={{ width: this.theme.width, height: 180 }} className="myChange-sector">

                </div>
                {/* <div style={{ width: this.theme.width, height: 100 }}>
                    <svg style={{ width: this.theme.width, height: 100 }} id="import">
                        <g id="imrect"></g>
                        <g id="tagrect"></g>
                        <g id="scales"></g>
                        <g id="tag"></g>
                        <line x1={0} x2={this.theme.width - 2} y1={99} y2={99} stroke={"rgb(180,180,180)"} strokeDasharray="3 2"></line>
                    </svg>
                </div> */}
                <svg style={{ width: this.theme.width, height: this.theme.height - 180}}  id="ploat">
                    <g className="gs"></g>
                </svg>
                {/* <div style={{ width: 70, height: 70, position: "absolute", top: 240, left: 20, background: "white" }} id="liquidfills">

                </div> */}
            </div>
        )
    }
}
export default Compare;