/*
 * @Author: your name
 * @Date: 2021-09-26 14:10:51
 * @LastEditTime: 2022-01-23 15:39:34
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \myapp\src\App.js
 */
import React from 'react';
import Control from './tools/Control.jsx'
import { Themes } from './tools/position.js'
// import Scatter from './tools/Scatter.jsx'
import Compare from './tools/Compare.jsx'
import axios from 'axios'
import Analysis from './tools/Analysis'
import Abnormal from './tools/Abnormal'
import AddInfo from './tools/AddInfo'
// import AddInfo from './tools/AddInfo_before'
import { rTime } from './tools/methods.js'
import * as d3 from 'd3'
import LineCompale from './tools/LineCompale.jsx'
import Flag from './tools/flag.jsx'
import 'antd/dist/antd.css';
import {Spin} from 'antd'
import AbnormalCalendar from './tools/AbnormalCalendar.jsx';
import DataIntroduce from './tools/DataIntroduce.jsx';
import { URL } from './constant/index.js';
import TentativeCom from './tools/TentativeCom.jsx';

class App extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			num: 0
		}
		// 各展示框主题样式初始化
		// this.ControlTheme = null
		// this.ScatterTheme = null
		// this.CompareTheme = null
		// this.AnalysisTheme = null
		// this.AbnormalTheme = null
		// this.AddInfoTheme = null
		// this.LineCompaleTheme = null
		// this.DataIntroduceTheme = null
		this.ControlTheme = Themes.ControlTheme
		this.ScatterTheme = Themes.ScatterTheme
		this.CompareTheme = Themes.CompareTheme
		this.AnalysisTheme = Themes.AnalysisTheme
		this.AbnormalTheme = Themes.AbnormalTheme
		this.AddInfoTheme = Themes.AddInfoTheme
		this.LineCompaleTheme = Themes.LineCompale
		this.DataIntroduceTheme = Themes.DataIntroduceTheme
		this.AbnormalCalendarTheme = Themes.AbnormalCalendarTheme
		this.StatisticsTheme = Themes.StatisticsTheme
		this.TentativeComTheme = Themes.TentativeComTheme
		// 创建 ref 附加到react属性中 方便调用
		this.myControl = React.createRef()
		this.myScatter = React.createRef()
		this.myCompare = React.createRef()
		this.myAnalysis = React.createRef()
		this.myAbnormal = React.createRef()
		this.myAddInfo = React.createRef()
		this.myLineCompale = React.createRef()
		this.myFlag = React.createRef()
		this.myDataIntroduce = React.createRef()
		this.myAbnormalCalendar = React.createRef()

		this.selectCurrentCategory = null
	}
	// PagePass = (value) => {
	// 	this.myAddInfo.current.page = value
	// 	if (this.myAddInfo.current.dataAll[parseInt(value / 2) - 1] === undefined) {
	// 		alert("data is unloading")
	// 	} else {
	// 		this.myAddInfo.current.LineHeightRender()
	// 	}
	// }

	MAEChangeDe = (value) => {
		this.myCompare.current.MAE = value
		// if (isNaN(this.myCompare.current.sourceKey)) {
		// 	this.myCompare.current.scaleLine()
		// }
	}
	MAEChange = (value) => {
		this.myAddInfo.current.mae = value
		const sc = document.getElementsByClassName("circleC")
		if (sc.length !== 0) {
			this.myAddInfo.current.AbnormalData()
		}
		// this.myAnalysis.current.MAE = value
		// this.myAnalysis.current.matirxRender()
		// this.myAnalysis.current.forceShow()
	}
	MDSFetch = (data, value, date, month) => {
		// console.log("mdsFetch ",data,value,date,month)
		this.myLineCompale.current.date = { "day": date, "month": month }
		this.myLineCompale.current.split = value
		
		this.myAbnormal.current.date = { "day": date, "month": month }
		this.myAbnormal.current.split = value
		
		this.myAddInfo.current.day = date
		this.myAddInfo.current.month = month
		// this.myLineCompale.current.mae = mae
		this.myAddInfo.current.split = value
		this.myAddInfo.current.data = data
		this.myAddInfo.current.dataAll[parseInt(value / 2) - 1] = data

		this.myAddInfo.current.LineHeightRender()
		this.myAddInfo.current.AbnormalData()
		this.myAddInfo.current.setState({
			disable: false
		})
	}

	/**
	 * 
	 * @param {*} category
	 * 所选类别 
	 * @param {*} name 
	 * @param {*} month 
	 * @param {*} day 
	 * @param {*} maeList 
	 */
	renderBeforeKeyNameChange = (category,name,month,day,maeList) => {
		if(isNaN(this.selectCurrentCategory)){
			this.KeyNameChange(name,month,day,maeList)
			this.selectCurrentCategory = category
		}else{
				if(category !== this.selectCurrentCategory){
					this.KeyNameChange(name,month,day,maeList)
					this.selectCurrentCategory = category
				}
		}
	}
	/**
	 * 
	 * @param {*} name
	 * 逆变器id 
	 * @param {*} month
	 * 选中日期的月份 
	 * @param {*} day
	 * 选中日期的天 
	 * @param {*} maeList
	 * 选中 
	 */
	KeyNameChange = (name, month, day, maeList) => {
		this.myCompare.current.sourceKey = name
		this.myCompare.current.month = month
		this.myCompare.current.day = day
		this.myCompare.current.maeList = maeList
		// console.log("keyNameChange maeList",maeList)
		// TODO: 待定 
		this.myCompare.current.scaleLine()
		// this.myCompare.current.d3MatrixRender()
	}

	LineCompareChange = (name, time, mae, maeList) => {
		
		this.myLineCompale.current.DelectAllg()
		// 柱状图更新
		this.myAbnormal.current.sourceKey = name
		// 曲线图参数更新
		this.myLineCompale.current.sourceKey = name
		this.myLineCompale.current.mae = parseInt(mae) - 1
		this.myLineCompale.current.times = time
		this.myLineCompale.current.maeList = maeList

		this.myLineCompale.current.setState({ total: false }, () => {
			this.myLineCompale.current.LineRender()
		})
		// 右下角 对比图更新 重要程度柱形图
		// this.myCompare.current.ImportShow()
	}
	SimilarSelect = (distance) => {
		this.myAbnormal.current.distance = distance
		this.myAbnormal.current.NumberDistribution()
	}
	FilterRender = (distance) => {
		this.myLineCompale.current.datafilter = distance
		this.myLineCompale.current.FilterLineRender()
	}
	/**
	 * @method
	 * 绘制select avg 柱形图
	 */
	AveCompare = (irr_T, at_T, mt_T, MAE, Value, Pre) => {
		this.myCompare.current.irr_T = irr_T
		this.myCompare.current.at_T = at_T
		this.myCompare.current.mt_T = mt_T
		this.myCompare.current.smae = MAE
		this.myCompare.current.value = Value
		this.myCompare.current.pre = Pre
		// this.myCompare.current.AverageShow()
	}

	/**
	 * @method
	 * 绘制多层次扇形图
	 */
	MultiSectorRender = (irr_T, at_T, mt_T) => {
		this.myCompare.current.multilayerSectorChartShow(irr_T, at_T, mt_T)
	}

	KmeansR = (label,currentDate) => {
		// 初始化中上矩阵图的信息
		this.myAnalysis.current.matirxRender(label,currentDate)
	}
	ColorC = (data) => {
		this.myAnalysis.current.Csanangle(data)
	}

	FloatKmeans = (currentDate,Klabel,anomalyThresholdData) => {
		this.myAnalysis.current.floatingWindowRender(currentDate,Klabel,anomalyThresholdData)
	}

	GeneralLineRander = (day, month) => {
		this.myLineCompale.current.generalday = parseInt(day)
		this.myLineCompale.current.generalmonth = parseInt(month) + 1
		this.myLineCompale.current.setState({ total: true }, () => {
			this.myLineCompale.current.GeneralLine()
		})

	}
	// 修改矩阵视图的时间
	ChangeTime = (timeDate) => {
		this.myAnalysis.current.changeTime(timeDate)
	}
	// mds2 用
	beforeMDSFetch = (currentData) => {
		// console.log("app currentData",currentData)
		// console.log("current",this.myControl.current)
		this.myControl.current.setState({ scatterLoading: true })
		// const url = "http://localhost:5000/MDS2"
		const currentTime = currentData.time.split(":")
		const currentDate = currentData.date.split("-")
		axios({
				method: "post",
				url: URL+"/MDS2",
				data: {
						// "time": this.state.hour1*4+this.state.minute1/15,
						"time":parseInt(currentTime[0])*4 + parseInt(currentTime[1])/15,
						// "mae": inputValue,
						// "month": parseInt(this.state.month) + 1,
						
						// "day": this.state.Selectday

						// "month":parseInt(currentDate[1]),
						// "day":parseInt(currentDate[2])
				}
		}).then(responer => {
				//  
				// console.log("control mds2\n",this.state.hour1*4+this.state.minute1/15,parseInt(this.state.month) + 1,this.state.Selectday)
				// test
				// this.setState({ scatterLoading: false })


				this.myControl.current.setState({ scatterLoading: false })
				this.MDSFetch(responer.data, this.myControl.current.state.inputValue2, parseInt(currentDate[2]), parseInt(currentDate[1]))
		
		})
	}
	/**
	 * @method
	 * 联系矩阵图和散点图
	 * @param currentData
	 * 包含 id currentTime 
	 */
	MDSFetchWithMatrix = (currentData) => {
		console.log("currentData",currentData)
		
		axios({
			method:"POST",
			url:URL + "/MDS3",
			data: currentData
		}).then((response) => {
			console.log("mds3发送成功",response.data)
		})
	}

	/**
	 * @method
	 * flag 渲染 环形图用
	*/ 
	flagRenderPie = (piePathes) => {
		// this.myFlag.current
		this.myFlag.current.PieRender(piePathes)
	}

	/**
	 * @method 
	 * 联系 日历图和控制台
	 */
	MyAbnormalCalendarRender =() => {
		this.myAbnormalCalendar.current.calendarRender()	
	}

	/**
	 * @method
	 * 联系 日历图和矩阵图
	 */
	connectCalendarAndMatrix = (currentDate) => {
		// console.log("connect matrix",this.myControl.current.attrLabel)
		this.KmeansR(this.myControl.current.attrLabel,currentDate)
		this.ColorC(this.myControl.current.ListData)
		// this.myControl.current.AttrsAdjust()
	}

	/**
	 * @method
	 * 联系 日历图 和 散点图
	 */
	connectCalendarAndScatter = (currentDate) => {
		let selectCurrentDate = null
		if(currentDate !== null){
			selectCurrentDate = currentDate.split('-');
		}else{
			selectCurrentDate = this.myAbnormalCalendar.current.selectDay.split("-")
		}
		
		// const myMae = []
		// for (let i = 0; i < document.getElementsByClassName('textmae').length; i++) {
		// 		myMae.push(document.getElementsByClassName('textmae')[i].textContent)
		// }
		// console.log("connect matrix inputValue2",this.myControl.current)
		const step = this.myControl.current.state.inputValue2
		axios({
			method:"POST",
			url:`${URL}/MDS`,
			data:{
				"split":step,
				"month":selectCurrentDate[1],
				"day":selectCurrentDate[2],
				// "mae":myMae
			}
		}).then((responser) => {
			// console.log("connectCalendarAndScatter",responser.data, selectCurrentDate[2], selectCurrentDate[1])
			this.MDSFetch(responser.data, step, parseInt( selectCurrentDate[2]),parseInt( selectCurrentDate[1]))
		})
	}

	componentDidMount() {
		const url = "http://localhost:5000/data" // 读取每个逆变器的信息
		const url_inform = 'http://localhost:5000/information' // 数据信息读取
		axios({
			method: "post",
			url: URL +'/data',
		}).then(event => {
			this.dataT = event.data
			axios({
				method:'post',
				url: URL +"/information",
			}).then(inform => {
				this.data_inform = inform.data
				let sourceKey = []
				let dateTotal = []
				let keyIndex = 0
				let MonthDayDict = {}
				for (let key in this.dataT) {
					keyIndex += 1
					for (let i = 0; i < this.dataT[key].length; i++) {
						this.dataT[key][i]['date_time'] = new Date(rTime(this.dataT[key][i]['date_time']))
						let month = new Date(rTime(this.dataT[key][i]['date_time'])).getMonth() + 1
						let day = new Date(rTime(this.dataT[key][i]['date_time'])).getDate()
						day = (String(day).length === 1 ? "0" + String(day) : String(day))
						dateTotal.push("0" + month + "-" + day)
					}
					let date = d3.extent(this.dataT[key], d => d.date_time)
					let date0_month = String(date[0].getMonth() + 1).length === 1 ? "0" + String(date[0].getMonth() + 1) : String(date[0].getMonth() + 1)
					let date0_day = String(date[0].getDate()).length === 1 ? "0" + String(date[0].getDate()) : String(date[0].getDate())
					let date1_month = String(date[1].getMonth() + 1).length === 1 ? "0" + String(date[1].getMonth() + 1) : String(date[1].getMonth() + 1)
					let date1_day = String(date[1].getDate()).length === 1 ? "0" + String(date[1].getDate()) : String(date[1].getDate())
					sourceKey.push({
						"num": keyIndex,
						"id": key,
						"number": this.dataT[key].length,
						"year": new Date(date[0]).getFullYear(),
						"date": date0_month + "/" + date0_day + "-" + date1_month + "/" + date1_day
					})
				}
				dateTotal = Array.from(new Set(dateTotal))
				this.source = sourceKey
				for (let key in this.dataT) {
					this.dataT[key].forEach((item) => {
						let month = new Date(item.date).getMonth() + 1
						let Day = new Date(item.date).getDate()
						let tag = `${month}-${Day}`
						if (tag in MonthDayDict === false) {
							MonthDayDict[tag] = []
						}
						MonthDayDict[tag].push({ "mae": item.loss_mae, "score": item.testPre - item.dc_power })
					})
				}
				this.MonthDayDicts = MonthDayDict
				// console.log("dataT",this.dataT)
				this.setState({ num: 1 }, () => {
					// this.myAnalysis.current.forceShow()
					// this.myAnalysis.current.matirxRender()
					// this.myFlag.current.PieRender()
				})
			})
			
		})
	}
	render() {
		const { num } = this.state
		if (num === 0) {
			return (
				<div className='App'>
					<Spin tip='loading...' size='large' style={{position:'absolute', left:750, top:300, fontSize:'20px'}} />
				</div>
			)
		} else {
			return (
				<div className='App'>
					{/* <Scatter
						ref={this.myScatter}
						theme={this.ScatterTheme}>
					</Scatter> */}
					{/* 数据介绍 */}
					
					{/* 原来的散点图栏，含有时间选择选项 */}

					

					
					{/* 弃用的柱形图 */}
					<Abnormal
						ref={this.myAbnormal}
						theme={this.AbnormalTheme}
						data={this.dataT}
						FilterRender={this.FilterRender}>
					</Abnormal>

					
					
					{/* 原控制台(含原信息框) */}
					

					<div className="left-container" id='left-container'>
						<DataIntroduce
							ref={this.myDataIntroduce}
							theme={this.DataIntroduceTheme}
							data={this.data_inform}>
						</DataIntroduce>
						<Control
							ref={this.myControl}
							theme={this.ControlTheme}
							StatisticsTheme={this.StatisticsTheme}
							data={this.source}
							dataT={this.dataT}
							MonthDayDict={this.MonthDayDicts}
							MAEChange={this.MAEChange}
							KeyNameChange={this.KeyNameChange}
							MAEChangeDe={this.MAEChangeDe}
							MDSFetch={this.MDSFetch}
							PagePass={this.PagePass}
							KmeansR={this.KmeansR}
							FloatKmeans={this.FloatKmeans}
							ColorC={this.ColorC}
							GeneralLineRander={this.GeneralLineRander}
							ChangeTime={this.ChangeTime}
							MyLineCompale={this.myLineCompale}
							MyAbnormalCalendarRender={this.MyAbnormalCalendarRender}
							connectCalendarAndScatter={this.connectCalendarAndScatter}
						>
						</Control>
						<AbnormalCalendar
							ref={this.myAbnormalCalendar}
							dataT={this.dataT}
							theme={this.AbnormalCalendarTheme}
							connectCalendarAndMatrix={this.connectCalendarAndMatrix}
							GeneralLineRander={this.GeneralLineRander}
							connectCalendarAndScatter={this.connectCalendarAndScatter}
						></AbnormalCalendar>
						<TentativeCom
							theme={this.TentativeComTheme}
						></TentativeCom>
						{/* <Flag 
							ref={this.myFlag}
							theme={Themes.FlagTheme}	
						></Flag> */}
					</div>
					<div className="center-container">
						<Analysis
							ref={this.myAnalysis}
							theme={this.AnalysisTheme}
							data={this.dataT}
							beforeMDSFetch={this.beforeMDSFetch}
							LineCompareChange={this.LineCompareChange}
							MDSFetchWithMatrix={this.MDSFetchWithMatrix}
							KeyNameChange={this.KeyNameChange}
							renderBeforeKeyNameChange={this.renderBeforeKeyNameChange}
						>
						</Analysis>
						<LineCompale
							ref={this.myLineCompale}
							theme={this.LineCompaleTheme}
							data={this.dataT}
							SimilarSelect={this.SimilarSelect}
							AveCompare={this.AveCompare}
							flagRenderPie={this.flagRenderPie}	
							MultiSectorRender={this.MultiSectorRender}
						>
						</LineCompale>
					</div>
					<div className="right-container">
						<AddInfo  
							ref={this.myAddInfo}
							theme={this.AddInfoTheme}
							dataT={this.dataT}
							LineCompareChange={this.LineCompareChange}
							KeyNameChange={this.KeyNameChange}
							renderBeforeKeyNameChange={this.renderBeforeKeyNameChange}
							>
						</AddInfo>
						<Compare
							ref={this.myCompare}
							theme={this.CompareTheme}
							data={this.dataT}>
						</Compare>
					</div>
				</div>
			)
		}
	}
}
export default App;
