import React from 'react';
import * as d3 from 'd3';
import { Slider, InputNumber, Row, Col, Divider ,Spin} from 'antd'
import { DeletTemp } from './methods.js'
import MyHeader from "../components/MyHeader"
class AddInfo extends React.Component {
    theme
    data
    constructor(props) {
        super(props)
        this.state = {
            inputValue: 20,
            disable: true,
            isLoading:false
        }
        this.theme = this.props.theme
        this.data = null
        this.margin = {
            left: 50,
            top: 50,
            right: 50,
            bottom: 50,
            width: this.theme.width,
            height: this.theme.height - 30
        }
        this.split = null
        this.page = undefined
        this.dataAll = []
        this.selectCircle = null
        this.month = null
        this.day = null
        this.mae = []
    }
    AbnormalData = () => {
        const circle = document.getElementsByClassName("circleC")
        let times = []
        const maedict = {}
        const dataT = this.props.dataT
        const abDict = {}
        const number = []
        const timeLabel = {}
        for (let i = 7; i < 19; i = i + this.split) {
            times.push([i, i + this.split])
        }
        this.mae.forEach((item) => {
            let mae = item.mae
            item.time.forEach((t) => {
                let times = t.split("~")
                maedict[t] = mae
                for (let i = parseInt(times[0]); i < parseInt(times[1]); i++) {
                    timeLabel[i] = item.label
                }
            })
        })
        for (let key in dataT) {
            times.forEach((t) => {
                let timeString = t[0] + "~" + t[1]
                abDict[key + timeString] = 0
            })
        }

        for (let key in dataT) {
            dataT[key].forEach((item) => {
                if (item.month === this.month) {
                    if (item.day === this.day) {
                        times.forEach((t) => {
                            if (item.hour >= t[0] && item.hour < t[1]) {
                                if (item.loss_mae > maedict[t[0] + "~" + t[1]]) {
                                    abDict[key + t[0] + "~" + t[1]] += 1
                                }
                            }
                        })
                    }
                }

            })
        }
        // console.log(abDict);
        // console.log(maedict);
        for (let key in abDict) {
            number.push(abDict[key])
        }
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
        const scale = d3.scaleLinear()
            .domain([0, 10])
            .range([3, 7])
        for (let i = 0; i < circle.length; i++) {
            let timefirst = circle[i].getAttribute("timefirst")
            let timelast = circle[i].getAttribute("timelast")
            let name = circle[i].getAttribute("name")
            let abnum = abDict[name + timefirst + "~" + timelast]
            circle[i].setAttribute("mae", maedict[timefirst + "~" + timelast])
            let label = parseInt(timeLabel[timefirst])
            // console.log(isNaN(label), label);
            if (isNaN(label) === true) {
                circle[i].setAttribute("fill", "rgb(252,146,115)")
            } else {
                circle[i].setAttribute("fill", colorLabel[label])
            }
            if (abnum > 0 && abnum < 10) {
                circle[i].setAttribute("r", scale(abnum) + "px")
                if (isNaN(label) === true) {
                    circle[i].setAttribute("fill", "rgb(252,146,115)")
                } else {
                    circle[i].setAttribute("fill", colorLabel[label])
                }
            } else if (abnum >= 10) {
                circle[i].setAttribute("r", 10 + "px")
                circle[i].setAttribute("fill", "red")
            }
            else {
                circle[i].setAttribute("r", "2px")
                if (isNaN(label) === true) {
                    circle[i].setAttribute("fill", "rgb(252,146,115)")
                } else {
                    circle[i].setAttribute("fill", colorLabel[label])
                }
            }
        }
    }
    LineHeightRender = () => {
        let data = this.data
        if (this.page !== undefined && this.dataAll[parseInt(this.page / 2) - 1] !== undefined) {
            data = this.dataAll[parseInt(this.page / 2) - 1]
        }
        // const data = this.data
        // console.log("lineheightrender",this.page)
        const svg = d3.select("#lineHeight")
        // const color = ["rgb(245,170,38)", "rgb(233,241,239)", "rgb(199,220,239)", "rgb(140,193,255)", "rgb(36,112,169)"]
        // const size = d3.scaleLinear().domain([0, d3.max(data, d => d.abnum)]).range([2, 5])
        // const colorC = d3.scaleSequential([0, parseInt(24 / this.split) + 2], d3.interpolateReds)
        const xScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.x)).nice()
            .rangeRound([this.margin.left, this.margin.width - this.margin.right])
        const yScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.y)).nice()
            .rangeRound([this.margin.height - this.margin.bottom, this.margin.top])
        const contours = d3.contourDensity()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y))
            .size([this.margin.width, this.margin.height])
            .bandwidth(this.state.inputValue)
            .thresholds(10)
            (data)
        const pathLength = contours.length
        let censhu = []
        for (let i = pathLength - 1; i >= 0; i--) {
            if (i - 1 >= 0) {
                censhu.push([i - 1, i])
            }
        }
        // const color = d3.scaleSequential([1, pathLength], d3.interpolateBlues)
        let colorb = d3.interpolateRgb("rgb(137,159,173)", "rgb(255,254,247)")
        let lenthColorbar = d3.scaleLinear().domain([1, pathLength]).range([0, 1])
        svg.select("#circlepath")
            .selectAll(".pathC")
            .data(contours)
            .join("path")
            .attr("class", "pathC")
            .attr("fill", (d, i) => {
                if (i === pathLength - 1) {
                    return "rgb(126,150,166)"
                } else if (i === 0) {
                    return "rgb(255,254,247)"
                }
                else {
                    for (let j = 0; j < censhu.length; j++) {
                        if (i >= censhu[j][0] && i < censhu[j][1]) {
                            return colorb(lenthColorbar(j))
                        }
                    }
                }
            })
            .attr("stroke", "rgb(104,169,156)")
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", (d, i) => i % 5 ? 0.25 : 1)
            .attr("d", d3.geoPath())
        svg.select("#circle")
            .selectAll(".circleC")
            .data(data)
            .join("circle")
            .attr("class", "circleC")
            .attr("stroke", "white")
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y))
            .attr("r", "2px")
            .attr("fill", d => {
                return "rgb(252,146,115)"
            })
            .attr("name", d => d.id)
            .attr("timefirst", d => d.split[0])
            .attr("timelast", d => d.split[1])
            .on("click", (e,d) => {
                // DeletTemp()
                // d3.select("#compaleline").selectAll("g").remove()
                // if (isNaN(this.selectCircle)) {
                //     this.selectCircle.setAttribute("stroke", "white")
                // }
                // e.target.setAttribute("stroke", "black")
                // this.selectCircle = e.target
                // const name = e.target.getAttribute("name")
                // const times = { "first": e.target.getAttribute("timefirst"), "end": e.target.getAttribute("timelast") }
                // const maes = e.target.getAttribute("mae")
                // this.props.LineCompareChange(name, times, maes, this.mae)
                // this.props.KeyNameChange(name, this.month, this.day, this.mae)
                
                DeletTemp()
                
                d3.select("#compaleline").selectAll("g").remove()
                
                if (isNaN(this.selectCircle)) {
                    this.selectCircle.setAttribute("stroke", "white")
                }

                e.target.setAttribute("stroke", "black")
                this.selectCircle = e.target
                // 逆变器 id
                const name = e.target.getAttribute("name")
                // 所处的时间段 eg: 9 ~ 19
                const times = { "first": e.target.getAttribute("timefirst"), "end": e.target.getAttribute("timelast") }
                // 当前类别下的 阈值 (即跟随滑动条变化的阈值)
                const maes = e.target.getAttribute("mae")
                // 当前的类别的总阈值数据 (即当前滑动条绘制数据)
                // this.mae
                // console.log("this.mae addInfo",this.mae,e,d)
                const selectCategory = []
                this.mae.forEach((item,index) => {
                    let itemSplit = item.time[0].split("~")
                    if(
                        parseInt( itemSplit[0] ) === parseInt( d.split[0]) &&
                        parseInt( itemSplit[1] ) === parseInt( d.split[1])
                    ){
                        selectCategory.push(item)
                    }
                })
                // console.log("selectCategory",selectCategory)
                // 核心LineCompareChange 
                // 交互传参 当前逆变器的id 时间段(聚类的时间段 eg:["13~16"]) 当前类别的设定阈值(mae) 当前聚类，步长 以及阈值的总数据
                this.props.LineCompareChange(name, times, maes, this.mae)
                // 右下角 compare 改变
                // this.props.KeyNameChange(name, this.month, this.day, this.mae)

                // this.props.KeyNameChange(name, this.month, this.day, selectCategory)
                // console.log("add info ",selectCategory,name)
                this.props.renderBeforeKeyNameChange(selectCategory[0].label,name, this.month, this.day, selectCategory)
            })
    }
    // AbnormalData = () => {
    //     const circle = document.getElementsByClassName("circleC")
    //     let times = []
    //     const maedict = {}
    //     const dataT = this.props.dataT
    //     const abDict = {}
    //     const number = []
    //     const timeLabel = {}
    //     for (let i = 7; i < 19; i = i + this.split) {
    //         times.push([i, i + this.split])
    //     }
    //     this.mae.forEach((item) => {
    //         let mae = item.mae
    //         item.time.forEach((t) => {
    //             let times = t.split("~")
    //             maedict[t] = mae
    //             for (let i = parseInt(times[0]); i < parseInt(times[1]); i++) {
    //                 timeLabel[i] = item.label
    //             }
    //         }) 
    //     })
    //     for (let key in dataT) {
    //         times.forEach((t) => {
    //             let timeString = t[0] + "~" + t[1]
    //             abDict[key + timeString] = 0
    //         })
    //     }

    //     for (let key in dataT) {
    //         dataT[key].forEach((item) => {
    //             if (item.month === this.month) {
    //                 if (item.day === this.day) {
    //                     times.forEach((t) => {
    //                         if (item.hour >= t[0] && item.hour < t[1]) {
    //                             if (item.loss_mae > maedict[t[0] + "~" + t[1]]) {
    //                                 abDict[key + t[0] + "~" + t[1]] += 1
    //                             }
    //                         }
    //                     })
    //                 }
    //             }

    //         })
    //     }

    //     // test
    //     // console.log("@",abDict);
    //     // console.log("@@",maedict);

    //     for (let key in abDict) {
    //         number.push(abDict[key])
    //     }
    //     const colorLabel = [
    //         "#99cc99",
    //         "rgb(250,210,131)",
    //         "rgb(190,186,218)",
    //         "rgb(204,204,204)",
    //         "#FFCC99",
    //         "#CCCCFF",
    //         "rgb(126,232,154)",
    //         "rgb(150,151,177)",
    //         "rgb(242,169,104)",
    //         "rgb(160,142,216)",
    //         "rgb(243,230,136)",
    //     ]
    //     // const colorLabel = d3.schemeCategory10;
    //     const scale = d3.scaleLinear()
    //         .domain([0, 10])
    //         .range([3, 7])
    //     for (let i = 0; i < circle.length; i++) {
    //         let timefirst = circle[i].getAttribute("timefirst")
    //         let timelast = circle[i].getAttribute("timelast")
    //         let name = circle[i].getAttribute("name")
    //         let abnum = abDict[name + timefirst + "~" + timelast]
    //         circle[i].setAttribute("mae", maedict[timefirst + "~" + timelast])
    //         let label = parseInt(timeLabel[timefirst])
    //         // let label = this.data[i].color;

    //         // console.log(this.data[i].color)
            
    //         // console.log(isNaN(label), label);
    //         if (isNaN(label) === true) {
    //             circle[i].setAttribute("fill", "rgb(252,146,115)")
    //         } else {
    //             circle[i].setAttribute("fill", colorLabel[label])
    //         }
    //         if (abnum > 0 && abnum < 10) {
    //             circle[i].setAttribute("r", scale(abnum) + "px")
    //             // circle[i].setAttribute("r","2px")
    //             if (isNaN(label) === true) {
    //                 circle[i].setAttribute("fill", "rgb(252,146,115)")
    //             } else {
    //                 circle[i].setAttribute("fill", colorLabel[label])
    //             }
    //         } else if (abnum >= 10) {
    //             circle[i].setAttribute("r", 10 + "px")
    //             // circle[i].setAttribute("r","2px")
    //             circle[i].setAttribute("fill", "red")
    //         }
    //         else {
    //             circle[i].setAttribute("r", "2px")
    //             if (isNaN(label) === true) {
    //                 circle[i].setAttribute("fill", "rgb(252,146,115)")
    //             } else {
    //                 circle[i].setAttribute("fill", colorLabel[label])
    //             }
    //         }
    //     }
    // }
    // LineHeightRender = () => {
    //     let data = this.data
    //     // console.log(data)
    //     if (this.page !== undefined && this.dataAll[parseInt(this.page / 2) - 1] !== undefined) {
    //         data = this.dataAll[parseInt(this.page / 2) - 1]
    //     }
    //     // const data = this.data
    //     const svg = d3.select("#lineHeight")
    //     // const color = ["rgb(245,170,38)", "rgb(233,241,239)", "rgb(199,220,239)", "rgb(140,193,255)", "rgb(36,112,169)"]
    //     // const size = d3.scaleLinear().domain([0, d3.max(data, d => d.abnum)]).range([2, 5])
    //     // const colorC = d3.scaleSequential([0, parseInt(24 / this.split) + 2], d3.interpolateReds)
    //     const xScale = d3.scaleLinear()
    //         .domain(d3.extent(data, d => d.x)).nice()
    //         .rangeRound([this.margin.left, this.margin.width - this.margin.right])
    //     const yScale = d3.scaleLinear()
    //         .domain(d3.extent(data, d => d.y)).nice()
    //         .rangeRound([this.margin.height - this.margin.bottom, this.margin.top])
    //     const contours = d3.contourDensity()
    //         .x(d => xScale(d.x))
    //         .y(d => yScale(d.y))
    //         .size([this.margin.width, this.margin.height])
    //         .bandwidth(this.state.inputValue)
    //         .thresholds(10)
    //         (data)
    //     const pathLength = contours.length
    //     let censhu = []
    //     for (let i = pathLength - 1; i >= 0; i--) {
    //         if (i - 1 >= 0) {
    //             censhu.push([i - 1, i])
    //         }
    //     }
    //     // const color = d3.scaleSequential([1, pathLength], d3.interpolateBlues)
    //     let colorb = d3.interpolateRgb("rgb(137,159,173)", "rgb(255,254,247)")
    //     let lenthColorbar = d3.scaleLinear().domain([1, pathLength]).range([0, 1])
    //     svg.select("#circlepath")
    //         .selectAll(".pathC")
    //         .data(contours)
    //         .join("path")
    //         .attr("class", "pathC")
    //         .attr("fill", (d, i) => {
    //             if (i === pathLength - 1) {
    //                 return "rgb(126,150,166)"
    //             } else if (i === 0) {
    //                 return "rgb(255,254,247)"
    //             }
    //             else {
    //                 for (let j = 0; j < censhu.length; j++) {
    //                     if (i >= censhu[j][0] && i < censhu[j][1]) {
    //                         return colorb(lenthColorbar(j))
    //                     }
    //                 }
    //             }
    //         })
    //         .attr("stroke", "rgb(104,169,156)")
    //         .attr("stroke-linejoin", "round")
    //         .attr("stroke-width", (d, i) => i % 5 ? 0.25 : 1)
    //         .attr("d", d3.geoPath())

    //     svg.select("#circle")
    //         .selectAll(".circleC")
    //         .data(data)
    //         .join("circle")
    //         .attr("class", "circleC")
    //         .attr("stroke", "white")
    //         .attr("cx", d => xScale(d.x))
    //         .attr("cy", d => yScale(d.y))
    //         .attr("r", "2px")
    //         .attr("fill", d => {
    //             return "rgb(252,146,115)"
    //         })
    //         .attr("name", d => d.id)
    //         .attr("timefirst", d => d.split[0])
    //         .attr("timelast", d => d.split[1])
    //         .on("click", (e) => {
    //             DeletTemp()
                
    //             d3.select("#compaleline").selectAll("g").remove()
                
    //             if (isNaN(this.selectCircle)) {
    //                 this.selectCircle.setAttribute("stroke", "white")
    //             }

    //             e.target.setAttribute("stroke", "black")
    //             this.selectCircle = e.target
    //             // 逆变器 id
    //             const name = e.target.getAttribute("name")
    //             // 所处的时间段 eg: 9 ~ 19
    //             const times = { "first": e.target.getAttribute("timefirst"), "end": e.target.getAttribute("timelast") }
    //             // 当前类别下的 阈值 (即跟随滑动条变化的阈值)
    //             const maes = e.target.getAttribute("mae")
    //             // 当前的类别的总阈值数据 (即当前滑动条绘制数据)
    //             // this.mae

    //             // test console
    //             // console.log('addInfo test lineCompareChange',name,times,maes,this.mae)

    //             // 核心LineCompareChange 
    //             // 交互传参 当前逆变器的id 时间段(聚类的时间段 eg:["13~16"]) 当前类别的设定阈值(mae) 当前聚类，步长 以及阈值的总数据
    //             this.props.LineCompareChange(name, times, maes, this.mae)
    //             // 右下角 compare 改变
    //             this.props.KeyNameChange(name, this.month, this.day, this.mae)
    //         })
    // }
    onChange = (value) => {
        this.setState({
            inputValue: value
        }, () => {
            this.LineHeightRender()
            this.AbnormalData()
        })
    }
    componentDidMount() {
        const input1 = document.getElementsByClassName("ant-input-number-input")
        input1[0].style.height = "20px"
        input1[0].style.marginLeft = "-10px"
    }
    isLoadingChange = (value) => {
        const {isLoading} = this.state
        this.setState({isLoading: value})
    }
    render() {
        const { inputValue, disable } = this.state
        const marks = {
            1: {
                style: {
                    fontSize: "10px",
                    marginTop: "-26px"
                },
                label: <span>1</span>,
            },
            50: {
                style: {
                    fontSize: "10px",
                    marginTop: "-26px"
                },
                label: <span>50</span>,
            }
        }
        const {isLoading} = this.state
        if(isLoading){
            return(<div className='AddInfo' style={{ position: 'absolute', ...this.theme }}>
            <MyHeader title="Contour Scatter Plot"></MyHeader>
            <Spin  size='large' style={{position:'absolute', fontSize:'20px',left:"156px",top:"141px"}} />
        </div>)
        }else{
            return (
            <div className='AddInfo' style={{ position: 'absolute', ...this.theme }}>
            <MyHeader title="Contour Scatter Plot"></MyHeader>
                {/* <Divider style={{ margin: "8px 0" }} /> */}
                {/* <div style={{
                    width: this.theme.width,
                    height: 30
                }}>
                    <Row>
                        <span style={{ marginTop: "4px", marginLeft: "3px", marginRight: "3px" }}>BW:</span>
                        <Col span={16}>
                            <Slider
                                disabled={disable}
                                marks={marks}
                                min={1}
                                max={50}
                                onChange={this.onChange}
                                value={typeof inputValue === 'number' ? inputValue : 0}
                                step={1}
                            />
                        </Col>
                        <Col span={4}>
                            <InputNumber
                                disabled={disable}
                                min={1}
                                max={50}
                                style={{ margin: '0 5px', height: "20px", width: "50px", marginTop: "5px" }}
                                step={1}
                                value={inputValue}
                                onChange={this.onChange}
                            />
                        </Col>
                    </Row>
                </div> */}
                <svg style={{
                    width: this.theme.width,
                    height: this.theme.height - 30,
                    // background: "rgb(7,70,139)"
                }} id="lineHeight">
                    <g id="circlepath"></g>
                    <g id="circle"></g>
                </svg>
            </div>
        )
        }
        
    }
}
export default AddInfo;