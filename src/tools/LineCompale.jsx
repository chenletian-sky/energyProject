import React from 'react';
import * as d3 from 'd3';
import { dtw, DeletTemp } from './methods.js'
class LineCompale extends React.Component {
	theme
	data
	constructor(props) {
		super(props)
		this.state = {
			total: true
		}
		this.theme = this.props.theme
		this.data = this.props.data
		this.padding = {
			top: 10,
			left: 26,
			right: 20,
			bottom: 20,
			height: (this.theme.height - 20) / 4,
			width: this.theme.width,
		}
		this.date = null
		this.split = null
		this.times = null
		this.sourceKey = null
		this.mae = null
		this.name = []
		this.features = []
		this.xScale_A = null
		this.yScale_A = null
		this.irrMax_T = null
		this.mtMax_T = null
		this.atMax_T = null
		this.LineNumMin_T = null
		this.LineNumMax_T = null
		this.maeList = null
		this.SelectPieShow = {}
		this.LineLightArr = []
		this.datafilter = null
		this.SimilarCircle = []
		this.RectCircle = []
		this.SelectClickPie = {}
		this.CompareClickPie = {}
		this.generalday = 15
		this.generalmonth = 5
	}
	xAxis = (g, x) => {
		const padding = this.padding
		g.attr("transform", `translate(0,${padding.height - padding.bottom})`)
			.call(d3.axisBottom(x).tickSizeOuter(0))
	}
	yAxis = (g, y) => {
		const padding = this.padding
		g.attr("transform", `translate(${padding.left},0)`)
			.call(d3.axisRight(y).ticks(5))
			// .call(g => g.select(".domain").remove())	
			.call(g => g.selectAll("text").attr("fill", "black"))
			.call(g => g.selectAll("text")
				.attr("fill", "rgb(191,191,191)")
				.attr("x", (d, i) => {
					if (i === 0 || String(d).length === 2) {
						return "-10px"
					} else if (String(d).length > 3) {
						return "-27px"
					} else {
						return "-19px"
					}
				})
				// .attr("transform-origin", "center")
				// .attr("transform", "rotate(60)")
			)
			.call(g => g.selectAll("line")
				.attr("x2", (d, i) => {
					return this.theme.width - padding.right - padding.left
				})
				.attr("stroke", (d, i) => {
					if (i !== 0) {
						return "rgb(191,191,191)"
					}
				})
				.attr("value", (d) => d)
				.attr("class", "yScale")
			)
		const text = g.selectAll("text")
		// console.log(text["_groups"][0][0].getBoundingClientRect());

	}
	DelectAllg = () => {
		this.features = []
		d3.select("#select").selectAll("g").remove()
		d3.select("#compaleline").selectAll("g").remove()
	}

	SelectDataDeal = (data, name) => {
		let SelectData = []
		data[name].forEach((item) => {
			if (item.month === this.date.month && item.day === this.date.day) {
				if (item.hour >= parseInt(this.times.first) && item.hour < parseInt(this.times.end)) {
					SelectData.push(item)
				}
			}
		})
		return SelectData
	}

	SelectDataDealTotal = (data, name) => {
		let day = this.generalday
		let month = this.generalmonth
		let SelectData = []
		data[name].forEach((item) => {
			if (item.month === month && item.day === day) {
				SelectData.push(item)
			}
		})
		return SelectData
	}

	SelectDataBack = (data) => {
		let SelectDataDao = []
		for (let i = data.length - 1; i >= 0; i--) {
			SelectDataDao.push(data[i])
		}
		return SelectDataDao
	}

	xScaleCreat = (data) => {
		const xScale = d3.scaleTime()
			.domain(d3.extent(data, d => d.date_time))
			.range([this.padding.left, this.padding.width - this.padding.right])
		return xScale
	}
	yScaleCreat = (data) => {
		const yScale = d3.scaleLinear()
			.domain([0, d3.max(data, d => d.dc_power)])
			.range([this.padding.height - this.padding.bottom, this.padding.top])
		return yScale
	}
	/**
	 * 画曲线
	 */
	CureLineRender = (data, name, xScale, yScale) => {
		const line = d3.line()
			.curve(d3.curveBasis)
			.x(d => xScale(d.date_time))
			.y(d => yScale(d[name]))
		return line(data)
	}
	ScaleRender = (svg, xScale, yScale) => {
		svg.append("g")
			.call(this.xAxis, xScale)
		svg.append("g")
			.call(this.yAxis, yScale)
	}

	firstLineShow = (svg, data, xScale, yScale) => {
		svg.append("g")
			.datum(data)
			.append("path")
			.attr("class", "paths-L")
			.attr("fill", "none")
			.attr("stroke", "rgb(102,194,165)")
			.attr("stroke-width", 2.3)
			.attr("stroke-linejoin", "round")
			.attr("d", this.CureLineRender(data, "dc_power", xScale, yScale))
	}

	otherLineShow = (svg, data, xScale, yScale, baisLine, flag) => {
		const mae = flag === "none" ? this.mae : flag
		let reRenderPathBelow = []
		let reRenderPathAbove = []
		data.forEach((item) => {
			if (item.loss_mae > mae) {
				if (item.dc_power - item.testPre > 0) {
					item['lineRender_below'] = item.testPre
					reRenderPathBelow.push(item)
				} else if (item.dc_power - item.testPre < 0) {
					item['lineRender_below'] = item.dc_power
					reRenderPathBelow.push(item)
				}
			} else {
				item['lineRender_below'] = item.dc_power
				reRenderPathBelow.push(item)
			}
		})

		data.forEach((item) => {
			if (item.loss_mae > mae) {
				if (item.dc_power - item.testPre > 0) {
					item['lineRender_above'] = item.dc_power
					reRenderPathAbove.push(item)
				} else if (item.dc_power - item.testPre < 0) {
					item['lineRender_above'] = item.testPre
					reRenderPathAbove.push(item)
				}
			} else {
				item['lineRender_above'] = item.dc_power
				reRenderPathAbove.push(item)
			}
		})
		svg.append("g")
			.datum(reRenderPathBelow)
			.append("path")
			.attr("fill", "none")
			.attr("stroke-width", "1.3px")
			.attr("stroke", "blue")
			.attr("stroke-linejoin", "round")
			.attr("d", () => {
				return this.CureLineRender(reRenderPathBelow, "lineRender_below", xScale, yScale) + baisLine
			})
			.attr("stroke-dasharray", "0.5 0.5 10")
		svg.append("g")
			.datum(reRenderPathAbove)
			.append("path")
			.attr("fill", "none")
			.attr("stroke-width", "1.3px")
			.attr("stroke", "rgb(222,44,38)")
			.attr("stroke-linejoin", "round")
			.attr("stroke-dasharray", "0.5 0.5 10")
			.attr("d", () => {
				return this.CureLineRender(reRenderPathAbove, "lineRender_above", xScale, yScale) + baisLine
			})
	}


	/**
	 * @method LineCircleShow
	 * 线上画点
	 */
	LineCircleShow = (svg, circlePoint, num, data, name) => {
		let circles = []
		for (let i = 0; i < circlePoint.length; i++) {
			if (i !== 0 && i !== circlePoint.length - 1) {
				let part = circlePoint[i].split(",")
				circles.push([parseFloat(part[4]), parseFloat(part[5])])
			} else if (i === 0) {
				let part = circlePoint[i].split("L")[1].split(",")
				circles.push([parseFloat(part[0]), parseFloat(part[1])])
			} else {
				let part = circlePoint[i].split("L")[1].split(",")
				circles.push([parseFloat(part[0]), parseFloat(part[1])])
			}
		}
		if (num === 1) {
			svg.append("g")
				.attr("class", "circles")
				.selectAll(".circles-L")
				.data(circles)
				.join("circle")
				.attr("class", "circles-L")
				.attr("cx", d => d[0])
				.attr("cy", d => d[1])
				.attr("r", 2)
				.attr("fill", "white")
				.attr("stroke", "rgb(180,180,180)")
				.attr("value", (d, i) => data[i].dc_power)
				.attr("pre", (d, i) => data[i].testPre)
				.attr("mae", (d, i) => data[i].loss_mae)
				.attr("name", name)
				.attr("irr", (d, i) => data[i].irradiation)
				.attr("mt", (d, i) => data[i].module_temperature)
				.attr("at", (d, i) => data[i].ambient_temperature)
				.attr("num", (d, i) => i)
		}
		return circles
	}

	/**
	 * @method PieShow
	 * 绘制线上饼图
	 * 交互点击事件
	 */
	PieShow = (svg, data, circle, innerRadiu, outerRadiu, method, id) => {
		const innerRadius = innerRadiu
		const outerRadius = outerRadiu
		const strokeWidth = 0.5
		const stroke = "rgb(180,180,180)"
		const strokeLinejoin = "round"
		const padAngle = stroke === "none" ? 1 / outerRadius : 0
		let arcs = []
		data.forEach((item) => {
			let N = d3.map(item, d => d.name)
			let V = d3.map(item, d => d.value)
			let I = d3.range(N.length).filter(i => !isNaN(V[i]));
			arcs.push(d3.pie().padAngle(padAngle).sort(null).value(i => V[i])(I))
		})
		// console.log("pieShow arcs",arcs)
		const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius)
		const gs = svg.append("g")
		const gp = gs.selectAll("g")
			.data(arcs)
			.join("g")
			.attr("class", method)
			.attr("transform", (d, i) => `translate(${circle[i][0]},${circle[i][1]})`)
		gp.selectAll("path")
			.data(d => {
				// console.log("pie show path d",d)
				return d
			})
			.join("path")
			.attr("d", arc)
			.attr("stroke", stroke)
			.attr("stroke-width", strokeWidth)
			.attr("stroke-linejoin", strokeLinejoin)
			.attr("fill", (d) => {
				if (method === "ir") {
					if (d.data === 0) {
						return "rgb(255,236,139)"
					} else {
						return "white"
					}
				} else if (method === "mt") {
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
			.attr("method", method)
			// .attr("data",d => d.data)
			.on("click", (e) => {
				if (id === "select") {
					// console.log("select pie ",e)

					let posx = e.clientX - this.theme.left + document.documentElement.scrollLeft
					let posy = e.clientY - this.theme.top - 20 + document.documentElement.scrollTop
					let Num = 0
					let Number = 0
					let Numbers = []
					let MAE = 0
					let Pre = 0
					let Value = 0
					let irr_T = []
					let at_T = []
					let mt_T = []
					for (let i = 0; i < this.RectCircle.length; i++) {
						let cx = parseFloat(this.RectCircle[i].getAttribute("cx"))
						let cy = parseFloat(this.RectCircle[i].getAttribute("cy"))
						let x1 = cx - 10
						let x2 = cx + 10
						let y1 = cy - 10
						let y2 = cy + 10
						if (posx >= x1 && posx <= x2 && posy >= y1 && posy <= y2) {
							Num = i
							Number = parseInt(this.RectCircle[i].getAttribute("num"))
							MAE = parseFloat(this.RectCircle[i].getAttribute("mae"))
							Pre = parseFloat(this.RectCircle[i].getAttribute("pre"))
							Value = parseFloat(this.RectCircle[i].getAttribute("value"))
							let irr = parseFloat(this.RectCircle[i].getAttribute("irr"))
							let at = parseFloat(this.RectCircle[i].getAttribute("at"))
							let mt = parseFloat(this.RectCircle[i].getAttribute("mt"))
							irr_T.push(irr)
							at_T.push(at)
							mt_T.push(mt)
							// console.log("select pie",irr,at,mt,this.RectCircle[i])
						}
					}

					// console.log(this.RectCircle)
					// console.log(this.SimilarCircle)
					// console.log(Num)

					for (let i = 0; i < this.SimilarCircle.length; i++) {
						Numbers.push(parseInt(this.SimilarCircle[i][Num].getAttribute("num")))
						let irr = parseFloat(this.SimilarCircle[i][Num].getAttribute("irr"))
						let at = parseFloat(this.SimilarCircle[i][Num].getAttribute("at"))
						let mt = parseFloat(this.SimilarCircle[i][Num].getAttribute("mt"))
						irr_T.push(irr)
						at_T.push(at)
						mt_T.push(mt)
					}

					this.AllPieRender(id)
					// 渲染 主视图 中的环形图
					const sendInfo = []
					for (let key in this.SelectClickPie) {
						let r1 = 0
						let r2 = 0
						if (key === "ir") {
							r1 = 13
							r2 = 16
						} else if (key === "mt") {
							r1 = 10
							r2 = 13
						} else {
							r1 = 7
							r2 = 10
						}
						this.SelectClickPie[key].forEach((item) => {
							this.LightPieRender(Number, item[Number], id, key, r1, r2)

							const data = item[Number]
							const innerRadiu = r1
							const outerRadiu = r2
							const stroke = "rgb(180,180,180)"
							const padAngle = stroke === "none" ? 1 / outerRadiu : 0	
							const temptNode = (document.getElementById(id).getElementsByClassName(key)[Number]).children
							let arcs = []
							let N = d3.map(data, d => d.name)
							let V = d3.map(data, d => d.value)
							let I = d3.range(N.length).filter(i => !isNaN(V[i]));
							arcs.push(d3.pie().padAngle(padAngle).sort(null).value(i => V[i])(I))
							const arc = d3.arc().innerRadius(innerRadiu).outerRadius(outerRadiu)
							sendInfo[key] = arcs
						})
					}
					// 
					// console.log("sendInfo flagRenderPie",sendInfo)
					this.props.flagRenderPie(sendInfo)

					let abs = 0
					for (let key in this.CompareClickPie) {
						if (abs >= Numbers.length) {
							break
						}
						let r1 = 0
						let r2 = 0
						let id = key.split("-")[0]
						let name = key.split("-")[1]
						if (name === "ir") {
							r1 = 13
							r2 = 16
						} else if (name === "mt") {
							r1 = 10
							r2 = 13
						} else {
							r1 = 7
							r2 = 10
						}
						this.CompareClickPie[key].forEach((item) => {
							this.LightPieRender(Numbers[abs], item[Numbers[abs]], id, name, r1, r2)
						})
						if (name === "at") {
							abs += 1
						}
					}
					
					// console.log("test aveCompare irr_T, at_T, mt_T, MAE, Value, Pre",irr_T, at_T, mt_T, MAE, Value, Pre,sendInfo)
					// TODO:add multisector params
					// this.props.AveCompare(irr_T, at_T, mt_T, MAE, Value, Pre)
					// test
					this.props.MultiSectorRender(irr_T, at_T, mt_T)
				}
			})

		// .on("mouseover", (e, d) => {
		// 	const arc_c = d3.arc().innerRadius(8).outerRadius(15)
		// 	e.target.setAttribute("d", arc_c(d))
		// })
		// .on("mouseout", (e, d) => {
		// 	const arc_c = d3.arc().innerRadius(innerRadiu).outerRadius(outerRadiu)
		// 	e.target.setAttribute("d", arc_c(d))
		// })
		// console.log(data, circle);
	}
	AllPieRender = (ids) => {
		for (let key in this.SelectClickPie) {
			let r1 = 0
			let r2 = 0
			if (key === "ir") {
				r1 = 7
				r2 = 10
			} else if (key === "mt") {
				r1 = 3
				r2 = 6
			} else {
				r1 = 0
				r2 = 3
			}
			this.LightBackPie(this.SelectClickPie[key][0], ids, key, r1, r2)
		}
		for (let key in this.CompareClickPie) {
			let id = key.split("-")[0]
			let name = key.split("-")[1]
			let r1 = 0
			let r2 = 0
			if (name === "ir") {
				r1 = 7
				r2 = 10
			} else if (name === "mt") {
				r1 = 3
				r2 = 6
			} else {
				r1 = 0
				r2 = 3
			}
			this.LightBackPie(this.CompareClickPie[key][0], id, name, r1, r2)
		}
	}

	LightBackPie = (data, nameID, nameClass, innerRadiu, outerRadiu) => {
		const stroke = "rgb(180,180,180)"
		const padAngle = stroke === "none" ? 1 / outerRadiu : 0
		const LightPie = document.getElementById(nameID).getElementsByClassName(nameClass)
		for (let i = 0; i < LightPie.length; i++) {
			let arcs = []
			let N = d3.map(data[i], d => d.name)
			let V = d3.map(data[i], d => d.value)
			let I = d3.range(N.length).filter(i => !isNaN(V[i]));
			arcs.push(d3.pie().padAngle(padAngle).sort(null).value(i => V[i])(I))
			const arc = d3.arc().innerRadius(innerRadiu).outerRadius(outerRadiu)
			LightPie[i].children[0].setAttribute("d", arc(arcs[0][0]))
			LightPie[i].children[1].setAttribute("d", arc(arcs[0][1]))
		}
	}

	LightPieRender = (Number, data, nameID, nameClass, innerRadiu, outerRadiu) => {
		const stroke = "rgb(180,180,180)"
		const padAngle = stroke === "none" ? 1 / outerRadiu : 0
		const LightPie = document.getElementById(nameID).getElementsByClassName(nameClass)[Number]
		let arcs = []
		let N = d3.map(data, d => d.name)
		let V = d3.map(data, d => d.value)
		let I = d3.range(N.length).filter(i => !isNaN(V[i]));
		arcs.push(d3.pie().padAngle(padAngle).sort(null).value(i => V[i])(I))
		const arc = d3.arc().innerRadius(innerRadiu).outerRadius(outerRadiu)
		LightPie.children[0].setAttribute("d", arc(arcs[0][0]))
		LightPie.children[1].setAttribute("d", arc(arcs[0][1]))
		// console.log(arcs);
		// console.log(LightPie.children[0]);
	}


	/**
	 * @normalBack
	 */
	normalBack = (data, name) => {
		const datalast = []
		let length = 0
		name.forEach((n) => {
			const select = this.SelectDataDeal(data, n)
			length = select.length
			datalast.push(select)
		})
		const maxP = []
		const minP = []
		for (let i = 0; i < length; i++) {
			let dataset = []
			datalast.forEach((item) => {
				if (item[i].loss_mae < this.mae) {
					dataset.push(item[i].dc_power)
				}
			})
			let [min, max] = d3.extent(dataset)
			maxP.push(max)
			minP.push(min)
		}
		return [minP, maxP]
	}

	/**
	 * @GeneralLine
	 * 显示选中天数的全局发电量
	 */
	GeneralLine = () => {
		d3.select("#compaleline").selectAll("g").remove()
		const svg = d3.select("#compaleline")
		const data = this.data
		// console.log(this.name);
		this.name.forEach((item, index) => {
			svg.append("g")
				.attr("id", "total" + item + index)
				.attr("transform", `translate(${0},${(this.theme.height - 20) / 4 * index})`)
		})
		this.name.forEach((item, index) => {
			const select = this.SelectDataDealTotal(data, item)
			const gs = d3.select("#total" + item + index)
			const xScale = this.xScaleCreat(select)
			const yScale = this.yScaleCreat(select)
			this.ScaleRender(gs, xScale, yScale)
			const circleLine_ = this.CureLineRender(select, "dc_power", xScale, yScale).replace("M", "L")
			this.firstLineShow(gs, select, xScale, yScale)
			// console.log(select);
			const circlePoint_ = circleLine_.split("C")
			this.LineCircleShow(gs, circlePoint_, 1, select, item)

		})
	}

	/**
	 * @method LineRender
	 * 加载选中异常点的曲线图
	 */
	LineRender = () => {
		this.features = []
		this.SelectClickPie = {}
		this.CompareClickPie = {}
		this.SimilarCircle = []
		this.RectCircle = []
		const data = this.data
		let irrArr = []
		let atArr = []
		let mtArr = []
		let ClickIrr = []
		let ClickAt = []
		let ClickMt = []
		for (let key in data) {
			data[key].forEach((item) => {
				irrArr.push(item.irradiation)
				atArr.push(item.module_temperature)
				mtArr.push(item.ambient_temperature)
			})
		}
		this.irrMax_T = d3.max(irrArr)
		this.atMax_T = d3.max(atArr)
		this.mtMax_T = d3.max(mtArr)
		const SelectData = this.SelectDataDeal(data, this.sourceKey)
		const normal = this.normalBack(data, this.name)
		// console.log(normal);
		let splitfeature = []
		SelectData.forEach((item) => {
			splitfeature.push({
				"irradiation": item.irradiation,
				"ambient_temperature": item.ambient_temperature,
				"module_temperature": item.module_temperature
			})
		})

		this.features.push(splitfeature)
		const SelectDataDao = this.SelectDataBack(SelectData)
		const SvgSelect = d3.select("#select")
		const xScale = this.xScaleCreat(SelectData)
		const yScale = this.yScaleCreat(SelectData)
		this.xScale_A = xScale
		this.yScale_A = yScale
		const maxLi_ = normal[1]
		const minLi_ = normal[0]
		let maxPower_ = []
		let minPower_ = []
		for (let i = 0; i < SelectData.length; i++) {
			maxPower_.push({ "date_time": SelectData[i].date_time, "dc_power": maxLi_[i] })
			minPower_.push({ "date_time": SelectData[i].date_time, "dc_power": minLi_[i] })
		}
		const selectDao_ = this.SelectDataBack(minPower_)
		const baisLine_B = this.CureLineRender(maxPower_, "dc_power", xScale, yScale)
		const circleLine_B = this.CureLineRender(selectDao_, "dc_power", xScale, yScale).replace("M", "L")
		SvgSelect.append("g")
			.append("path")
			.attr("class", "paths-L-B")
			.attr("fill", "none")
			.attr("stroke", "none")
			.attr("stroke-linejoin", "round")
			.attr("fill", "rgba(127,127,127,0.5)")
			.attr("d", baisLine_B + circleLine_B)
		this.ScaleRender(SvgSelect, xScale, yScale)
		const baisLine = this.CureLineRender(SelectDataDao, "dc_power", xScale, yScale).replace("M", "L")
		const circleLine = this.CureLineRender(SelectData, "dc_power", xScale, yScale).replace("M", "L")
		this.otherLineShow(SvgSelect, SelectData, xScale, yScale, baisLine, "none")
		this.firstLineShow(SvgSelect, SelectData, xScale, yScale)
		const circlePoint = circleLine.split("C")
		const selectCircle = this.LineCircleShow(SvgSelect, circlePoint, 1, SelectData, this.sourceKey)
		const svg = d3.select("#compaleline")
		let namesCompale = []
		this.name.forEach((item) => {
			if (item !== this.sourceKey) {
				namesCompale.push(item)
			}
		})
		namesCompale.forEach((item, index) => {
			svg.append("g")
				.attr("id", "rect" + item + index)
				.attr("transform", `translate(${0},${(this.theme.height - 20) / 4 * index})`)
			// gs.append("rect")
			// 	.attr("x", 0)
			// 	.attr("y", 0)
			// 	.attr("width", this.theme.width - 2)
			// 	.attr("height", this.theme.height / 4)
			// 	// .attr("fill", index % 2 === 0 ? "rgba(127,127,127,0.5)" : "white")
			// 	.attr("fill", index % 2 === 0 ? "white" : "white")
		})
		namesCompale.forEach((item, index) => {
			const select = this.SelectDataDeal(data, item)
			const maxLi = normal[1]
			const minLi = normal[0]
			let maxPower = []
			let minPower = []
			for (let i = 0; i < select.length; i++) {
				maxPower.push({ "date_time": select[i].date_time, "dc_power": maxLi[i] })
				minPower.push({ "date_time": select[i].date_time, "dc_power": minLi[i] })
			}
			const selectDao = this.SelectDataBack(minPower)
			const gs = d3.select("#rect" + item + index)
			const baisLine_ = this.CureLineRender(maxPower, "dc_power", xScale, yScale)
			const circleLine_ = this.CureLineRender(selectDao, "dc_power", xScale, yScale).replace("M", "L")
			gs.append("g")
				.append("path")
				.attr("class", "paths-L-B")
				.attr("fill", "none")
				.attr("stroke", "none")
				// .attr("stroke-width", 1.5)
				.attr("stroke-linejoin", "round")
				.attr("fill", "rgba(127,127,127,0.5)")
				.attr("d", baisLine_ + circleLine_)

		})
		namesCompale.forEach((item, index) => {
			let splitfeatures = []
			if (item !== this.sourceKey) {
				const select = this.SelectDataDeal(data, item)
				select.forEach((item) => {
					splitfeatures.push({
						"irradiation": item.irradiation,
						"ambient_temperature": item.ambient_temperature,
						"module_temperature": item.module_temperature
					})
				})
				this.features.push(splitfeatures)
				const selectDao = this.SelectDataBack(select)
				const gs = d3.select("#rect" + item + index)
				// const xScale_ = this.xScaleCreat(select)
				// const yScale_ = this.yScaleCreat(select)
				this.ScaleRender(gs, xScale, yScale)

				const baisLine_ = this.CureLineRender(selectDao, "dc_power", xScale, yScale).replace("M", "L")
				const circleLine_ = this.CureLineRender(select, "dc_power", xScale, yScale).replace("M", "L")
				this.otherLineShow(gs, select, xScale, yScale, baisLine_, "none")
				this.firstLineShow(gs, select, xScale, yScale)
				const circlePoint_ = circleLine_.split("C")
				this.LineCircleShow(gs, circlePoint_, 1, select, item)
			}
		})
		const irrMax = this.irrMax_T
		const mtMax = this.mtMax_T
		const atMax = this.atMax_T
		let pieSelect_ir = []
		let pieSelect_mt = []
		let pieSelect_at = []
		splitfeature.forEach((item) => {
			let dataset = []
			let dataset_mt = []
			let dataset_at = []
			dataset.push({ "name": "irradiation", "value": item.irradiation })
			dataset.push({ "name": "none", "value": irrMax - item.irradiation })
			dataset_mt.push({ "name": "module_temperature", "value": item.module_temperature })
			dataset_mt.push({ "name": "none", "value": mtMax - item.module_temperature })
			dataset_at.push({ "name": "ambient_temperature", "value": item.ambient_temperature })
			dataset_at.push({ "name": "none", "value": atMax - item.ambient_temperature })
			pieSelect_ir.push(dataset)
			pieSelect_mt.push(dataset_mt)
			pieSelect_at.push(dataset_at)
		})
		ClickIrr.push(pieSelect_ir)
		ClickAt.push(pieSelect_at)
		ClickMt.push(pieSelect_mt)
		this.SelectPieShow["ir"] = [SvgSelect, pieSelect_ir, selectCircle, 7, 10, "ir", "select"]
		this.SelectPieShow["mt"] = [SvgSelect, pieSelect_mt, selectCircle, 3, 6, "mt", "select"]
		this.SelectPieShow["at"] = [SvgSelect, pieSelect_at, selectCircle, 0, 3, "at", "select"]
		// this.PieShow(SvgSelect, pieSelect_ir, selectCircle, 7, 10, "ir", "select")
		// this.PieShow(SvgSelect, pieSelect_mt, selectCircle, 3, 6, "mt", "select")
		// this.PieShow(SvgSelect, pieSelect_at, selectCircle, 0, 3, "at", "select")
		this.SelectClickPie['ir'] = ClickIrr
		this.SelectClickPie['at'] = ClickAt
		this.SelectClickPie['mt'] = ClickMt

		namesCompale.forEach((item, index) => {
			if (item !== this.sourceKey) {
				let ClickIrr = []
				let ClickMt = []
				let ClickAt = []
				let splitfeatures = []
				let pieSelect = []
				let pieSelect_mt = []
				let pieSelect_at = []
				const select = this.SelectDataDeal(data, item)
				const gs = d3.select("#rect" + item + index)
				select.forEach((item) => {
					splitfeatures.push({
						"irradiation": item.irradiation,
						"ambient_temperature": item.ambient_temperature,
						"module_temperature": item.module_temperature
					})
				})
				// const xScale_ = this.xScaleCreat(select)
				// const yScale_ = this.yScaleCreat(select)
				const circleLine_ = this.CureLineRender(select, "dc_power", xScale, yScale).replace("M", "L")
				const circlePoint_ = circleLine_.split("C")
				const selectC = this.LineCircleShow(gs, circlePoint_, 2, [], "")
				splitfeatures.forEach((th) => {
					let dataset = []
					let dataset_mt = []
					let dataset_at = []
					dataset.push({ "name": "irradiation", "value": th.irradiation })
					dataset.push({ "name": "none", "value": irrMax - th.irradiation })
					dataset_mt.push({ "name": "module_temperature", "value": th.module_temperature })
					dataset_mt.push({ "name": "none", "value": mtMax - th.module_temperature })
					dataset_at.push({ "name": "ambient_temperature", "value": th.ambient_temperature })
					dataset_at.push({ "name": "none", "value": atMax - th.ambient_temperature })
					pieSelect_mt.push(dataset_mt)
					pieSelect.push(dataset)
					pieSelect_at.push(dataset_at)
				})
				ClickIrr.push(pieSelect)
				ClickMt.push(pieSelect_mt)
				ClickAt.push(pieSelect_at)
				// this.PieShow(gs, pieSelect, selectC, 7, 10, "ir", "rect" + item + index)
				// this.PieShow(gs, pieSelect_mt, selectC, 3, 6, "mt", "rect" + item + index)
				// this.PieShow(gs, pieSelect_at, selectC, 0, 3, "at", "rect" + item + index)
				let idd = String("rect" + item + index)
				this.CompareClickPie[idd + "-ir"] = ClickIrr
				this.CompareClickPie[idd + "-mt"] = ClickMt
				this.CompareClickPie[idd + "-at"] = ClickAt
			}
		})
	}

	/**
	 * @method SimilarBackLight
	 * 给框选出的点的最相似的那部分加上背景颜色
	 */
	SimilarBackLight = (svg, time, xScale, id) => {
		svg.append("rect")
			.attr("class", "similarRect")
			.attr("x", xScale(time[0]))
			.attr("y", 0)
			.attr("width", xScale(time[1]) - xScale(time[0]))
			.attr("height", (this.theme.height - 20) / 4 - this.padding.bottom)
			.attr("fill", "rgb(180,180,180)")
			.attr("opacity", 0.5)
		const circle = document.getElementById(id).getElementsByTagName("circle")
		let select = []
		for (let i = 0; i < circle.length; i++) {
			let x = parseFloat(circle[i].getAttribute("cx"))
			if (x >= (xScale(time[0]) - 1) && x <= (xScale(time[1]) + 1)) {
				select.push(circle[i])
			}
		}
		this.SimilarCircle.push(select)
	}
	/**
	 * @method FilterLineRender
	 * 过滤后重新加载compare
	 */
	FilterLineRender = () => {
		this.AllPieRender("select")
		const timeMae = {}
		this.maeList.forEach((item) => {
			item.time.forEach((t) => {
				let times = t.split("~")
				for (let i = parseInt(times[0]); i < parseInt(times[1]); i++) {
					timeMae[i] = item.mae
				}
			})
		})
		this.SimilarCircle = []
		this.CompareClickPie = {}
		let number = 20
		const data = this.data
		d3.select("#compaleline").selectAll("g").remove()
		const distance = this.datafilter
		let similarSelect = []
		for (let i = 0; i < distance.length; i++) {
			let info = distance[i].name.split("-")
			let name = info[0]
			let month = parseInt(info[1])
			let day = parseInt(info[2])
			let first = parseInt(info[3])
			let end = parseInt(info[4])
			similarSelect.push({ "name": name, "month": month, "day": day, "first": first, "end": end, "Source": distance[i].valueArr, "time": distance[i].Time })
			if (i === number) {
				break
			}
		}
		const svg = d3.select("#compaleline")
		similarSelect.forEach((item, index) => {
			const gs = svg.append("g")
				.attr("id", "rect" + item.name + index)
				.attr("transform", `translate(${0},${(this.theme.height - 20) / 4 * index})`)
			// gs.append("rect")
			// 	.attr("x", 0)
			// 	.attr("y", 0)
			// 	.attr("width", this.theme.width - 2)
			// 	.attr("height", this.theme.height / 4)
			// 	// .attr("fill", index % 2 === 0 ? "rgb(234,234,234)" : "white")
			// 	.attr("fill", index % 2 === 0 ? "white" : "white")
		})
		similarSelect.forEach((item, index) => {
			let name = item.name
			let month = item.month
			let day = item.day
			let first = item.first
			let end = item.end
			let select = []
			let splitfeatures = []
			data[name].forEach((d) => {
				if (d.month === month && d.day === day) {
					if (d.hour >= parseInt(first) && d.hour < parseInt(end)) {
						select.push(d)
					}
				}
			})
			select.forEach((d) => {
				splitfeatures.push({
					"irradiation": d.irradiation,
					"ambient_temperature": d.ambient_temperature,
					"module_temperature": d.module_temperature
				})
			})
			const xScale_ = this.xScaleCreat(select)
			const selectDao = this.SelectDataBack(select)
			const gs = d3.select("#rect" + name + index)

			this.ScaleRender(gs, xScale_, this.yScale_A)

			const baisLine_ = this.CureLineRender(selectDao, "dc_power", xScale_, this.yScale_A).replace("M", "L")
			const circleLine_ = this.CureLineRender(select, "dc_power", xScale_, this.yScale_A).replace("M", "L")
			this.otherLineShow(gs, select, xScale_, this.yScale_A, baisLine_, timeMae[first])
			this.firstLineShow(gs, select, xScale_, this.yScale_A)
			const circlePoint_ = circleLine_.split("C")
			this.LineCircleShow(gs, circlePoint_, 1, select, name)
			this.SimilarBackLight(gs, item.time, xScale_, "rect" + name + index)
			// this.LineLight_("rect" + name + index)
		})
		similarSelect.forEach((item, index) => {
			let ClickIrr = []
			let ClickMt = []
			let ClickAt = []
			const irrMax = this.irrMax_T
			const mtMax = this.mtMax_T
			const atMax = this.atMax_T
			let name = item.name
			let month = item.month
			let day = item.day
			let first = item.first
			let end = item.end
			let select = []
			data[name].forEach((d) => {
				if (d.month === month && d.day === day) {
					if (d.hour >= parseInt(first) && d.hour < parseInt(end)) {
						select.push(d)
					}
				}
			})
			let splitfeatures = []
			let pieSelect = []
			let pieSelect_mt = []
			let pieSelect_at = []
			const gs = d3.select("#rect" + name + index)
			select.forEach((item) => {
				splitfeatures.push({
					"irradiation": item.irradiation,
					"ambient_temperature": item.ambient_temperature,
					"module_temperature": item.module_temperature
				})
			})
			const xScale_ = this.xScaleCreat(select)
			const circleLine_ = this.CureLineRender(select, "dc_power", xScale_, this.yScale_A).replace("M", "L")
			const circlePoint_ = circleLine_.split("C")
			const selectC = this.LineCircleShow(gs, circlePoint_, 2, [], "")
			splitfeatures.forEach((th) => {
				let dataset = []
				let dataset_mt = []
				let dataset_at = []
				dataset.push({ "name": "irradiation", "value": th.irradiation })
				dataset.push({ "name": "none", "value": irrMax - th.irradiation })
				dataset_mt.push({ "name": "module_temperature", "value": th.module_temperature })
				dataset_mt.push({ "name": "none", "value": mtMax - th.module_temperature })
				dataset_at.push({ "name": "ambient_temperature", "value": th.ambient_temperature })
				dataset_at.push({ "name": "none", "value": atMax - th.ambient_temperature })
				pieSelect_mt.push(dataset_mt)
				pieSelect.push(dataset)
				pieSelect_at.push(dataset_at)
			})
			ClickIrr.push(pieSelect)
			ClickMt.push(pieSelect_mt)
			ClickAt.push(pieSelect_at)
			this.PieShow(gs, pieSelect, selectC, 7, 10, "ir", "rect" + name + index)
			this.PieShow(gs, pieSelect_mt, selectC, 3, 6, "mt", "rect" + name + index)
			this.PieShow(gs, pieSelect_at, selectC, 0, 3, "at", "rect" + name + index)
			let idd = String("rect" + name + index)
			this.CompareClickPie[idd + "-ir"] = ClickIrr
			this.CompareClickPie[idd + "-mt"] = ClickMt
			this.CompareClickPie[idd + "-at"] = ClickAt
		})
	}
	/**
	*@method LineBackShow  
	*给选中线条添加背景
	*/
	LineBackShow = () => {
		let MaxValue = []
		let MinValue = []
		for (let i = 0; i < this.SimilarCircle[0].length; i++) {
			let values = []
			for (let j = 0; j < this.SimilarCircle.length; j++) {
				let x = parseFloat(this.SimilarCircle[j][i].getAttribute("cx"))
				let y = parseFloat(this.SimilarCircle[j][i].getAttribute("cy"))
				let power = parseFloat(this.SimilarCircle[j][i].getAttribute("value"))
				values.push({ "x": x, "y": y, "v": power })
			}
			let Cy = 0
			let Cmax = d3.max(values, d => d.v)
			values.forEach((item) => {
				if (item.v === Cmax) {
					Cy = item.y
				}
			})
			let Sy = parseFloat(this.RectCircle[i].getAttribute("cy"))
			let Smax = parseFloat(this.RectCircle[i].getAttribute("value"))
			let max = Smax > Cmax ? Smax : Cmax
			let Y_Max = Smax > Cmax ? Sy : Cy
			for (let j = 0; j < values.length; j++) {
				values[j]['v'] = max
				values[j]['y'] = Y_Max
			}
			MaxValue.push(values)
		}
		for (let i = 0; i < this.SimilarCircle[0].length; i++) {
			let values = []
			for (let j = 0; j < this.SimilarCircle.length; j++) {
				let x = parseFloat(this.SimilarCircle[j][i].getAttribute("cx"))
				let y = parseFloat(this.SimilarCircle[j][i].getAttribute("cy"))
				let power = parseFloat(this.SimilarCircle[j][i].getAttribute("value"))
				values.push({ "x": x, "y": y, "v": power })
			}
			let Cy = 0
			let Cmin = d3.min(values, d => d.v)
			values.forEach((item) => {
				if (item.v === Cmin) {
					Cy = item.y
					// console.log(Cy);
				}
			})
			let Sy = parseFloat(this.RectCircle[i].getAttribute("cy"))
			let Smin = parseFloat(this.RectCircle[i].getAttribute("value"))
			let min = Smin > Cmin ? Cmin : Smin
			let Y_Min = Smin > Cmin ? Cy : Sy
			for (let j = 0; j < values.length; j++) {
				values[j]['v'] = min
				values[j]['y'] = Y_Min
			}
			MinValue.push(values)
		}
		const data = MaxValue.concat(MinValue)


		// let length = MaxValue.length
		// for (let i = 0; i < length; i++) {
		// 	let dataset = []
		// 	for (let j = 0; j < MaxValue[i].length; j++) {

		// 	}
		// }
		// let length = MaxValue[0].length
		// for (let i = 0; i < length; i++) {
		// 	let dataset = []
		// 	for (let j = 0; j < MaxValue.length; j++) {
		// 		dataset.push({ "x": MaxValue[i][j].x, "y": MaxValue[i][j].y })
		// 	}
		// 	for (let j = 0; j < MinValue.length; j++) {
		// 		dataset.push({ "x": MinValue[i][j].x, "y": MinValue[i][j].y })
		// 	}
		// 	console.log(dataset);
		// }
		// console.log(this.SimilarCircle);
		// console.log(this.RectCircle);
	}
	/**
	 * @method AbnornalCircleSelect
	 * 框选操作并跑通dtw更新compare
	 */
	AbnornalCircleSelect = (start, end) => {
		d3.select("#compaleline").selectAll("g").remove()
		const timeMae = {}
		this.maeList.forEach((item) => {
			item.time.forEach((t) => {
				let times = t.split("~")
				for (let i = parseInt(times[0]); i < parseInt(times[1]); i++) {
					timeMae[i] = item.mae
				}
			})
		})
		for (let name in this.SelectPieShow) {
			let svg = this.SelectPieShow[name][0]
			let pieSelect_ir = this.SelectPieShow[name][1]
			let selectCircle = this.SelectPieShow[name][2]
			let inner = this.SelectPieShow[name][3]
			let outer = this.SelectPieShow[name][4]
			let ir = this.SelectPieShow[name][5]
			let se = this.SelectPieShow[name][6]

			this.PieShow(svg, pieSelect_ir, selectCircle, inner, outer, ir, se)
		}

		this.CompareClickPie = {}
		const loading = document.getElementById("loading")
		const data = this.data
		let number = 20
		let startX = parseFloat(start[0])
		let endX = parseFloat(end[0])
		let startY = parseFloat(start[1])
		let endY = parseFloat(end[0])
		let selectCircle = []
		let TargetArr = []
		let time = []
		let distance = []
		let date = {}
		const circle = document.getElementById("select").getElementsByTagName("circle")
		for (let i = 0; i < circle.length; i++) {
			let cx = parseFloat(circle[i].getAttribute("cx"))
			let cy = parseFloat(circle[i].getAttribute("cy"))
			if (cx >= startX && cx <= endX && cy >= startY && cy <= endY) {
				selectCircle.push(circle[i])
			}
		}
		for (let i = 0; i < selectCircle.length; i++) {
			TargetArr.push(parseFloat(selectCircle[i].getAttribute("value")))
		}
		// this.LineLight(TargetArr, "select")
		for (let i = 0; i < 24; i += this.split) {
			time.push([i, i + this.split])
		}
		for (let key in data) {
			data[key].forEach((item) => {
				if (item.month in date === false) {
					date[item.month] = []
				}
				if (date[item.month].indexOf(item.day) < 0) {
					date[item.month].push(item.day)
				}
			})
		}
		for (let key in data) {
			for (let m in date) {
				date[m].forEach((d) => {
					time.forEach((t) => {
						let SourceArr = []
						let SimilarSource = []
						data[key].forEach((item) => {
							if (key === this.sourceKey && parseInt(item.month) === parseInt(this.date.month) && parseInt(item.day) === parseInt(this.date.day)) {
								if (parseInt(item.hour) >= parseInt(this.times.first) && parseInt(item.hour) < parseInt(this.times.end)) {
									return
								}
							} else {
								if (item.month === parseInt(m) && item.day === parseInt(d) && item.hour >= t[0] && item.hour < t[1]) {
									SourceArr.push(item.dc_power)
									SimilarSource.push({ "time": item.date_time, "power": item.dc_power })
								}
							}
						})
						if (SourceArr.length !== 0) {
							let TargetLength = TargetArr.length
							let TimeDis = []
							for (let i = 0; i < SimilarSource.length - TargetLength + 1; i++) {
								let sumDis = 0
								for (let j = 0; j < TargetLength; j++) {
									sumDis += Math.abs(SimilarSource[i + j]['power'] - TargetArr[j])
								}
								TimeDis.push({ "first": SimilarSource[i]['time'], "end": SimilarSource[i + TargetLength - 1]['time'], "dis": sumDis })
							}
							TimeDis = TimeDis.sort((a, b) => { return a.dis - b.dis })
							distance.push({ "name": `${key}-${m}-${d}-${t[0]}-${t[1]}`, "value": dtw(TargetArr, SourceArr), "valueArr": SourceArr, "Time": [TimeDis[0]['first'], TimeDis[0]['end']] })
						}
					})
				})
			}
		}
		distance = distance.sort((a, b) => { return a.value - b.value })
		this.props.SimilarSelect(distance)
		let similarSelect = []
		for (let i = 0; i < distance.length; i++) {
			let info = distance[i].name.split("-")
			let name = info[0]
			let month = parseInt(info[1])
			let day = parseInt(info[2])
			let first = parseInt(info[3])
			let end = parseInt(info[4])
			similarSelect.push({ "name": name, "month": month, "day": day, "first": first, "end": end, "Source": distance[i].valueArr, "time": distance[i].Time })
			if (i === number) {
				break
			}
		}
		const svg = d3.select("#compaleline")
		similarSelect.forEach((item, index) => {
			svg.append("g")
				.attr("id", "rect" + item.name + index)
				.attr("transform", `translate(${0},${(this.theme.height - 20) / 4 * index})`)
			// gs.append("rect")
			// 	.attr("x", 0)
			// 	.attr("y", 0)
			// 	.attr("width", this.theme.width - 2)
			// 	.attr("height", this.theme.height / 5)
			// 	// .attr("fill", index % 2 === 0 ? "rgb(234,234,234)" : "white")
			// 	.attr("fill", index % 2 === 0 ? "white" : "white")
		})
		similarSelect.forEach((item, index) => {
			let name = item.name
			let month = item.month
			let day = item.day
			let first = item.first
			let end = item.end
			let select = []
			// console.log(first);
			let splitfeatures = []
			data[name].forEach((d) => {
				if (d.month === month && d.day === day) {
					if (d.hour >= parseInt(first) && d.hour < parseInt(end)) {
						select.push(d)
					}
				}
			})
			select.forEach((d) => {
				splitfeatures.push({
					"irradiation": d.irradiation,
					"ambient_temperature": d.ambient_temperature,
					"module_temperature": d.module_temperature
				})
			})
			const xScale_ = this.xScaleCreat(select)
			const selectDao = this.SelectDataBack(select)
			const gs = d3.select("#rect" + name + index)
			this.ScaleRender(gs, xScale_, this.yScale_A)
			const baisLine_ = this.CureLineRender(selectDao, "dc_power", xScale_, this.yScale_A).replace("M", "L")
			const circleLine_ = this.CureLineRender(select, "dc_power", xScale_, this.yScale_A).replace("M", "L")
			this.otherLineShow(gs, select, xScale_, this.yScale_A, baisLine_, timeMae[first])
			this.firstLineShow(gs, select, xScale_, this.yScale_A)
			const circlePoint_ = circleLine_.split("C")
			this.LineCircleShow(gs, circlePoint_, 1, select, name)
			this.SimilarBackLight(gs, item.time, xScale_, "rect" + name + index)
			// this.LineLight_("rect" + name + index)
		})
		similarSelect.forEach((item, index) => {
			let ClickIrr = []
			let ClickMt = []
			let ClickAt = []
			const irrMax = this.irrMax_T
			const mtMax = this.mtMax_T
			const atMax = this.atMax_T
			let name = item.name
			let month = item.month
			let day = item.day
			let first = item.first
			let end = item.end
			let select = []
			data[name].forEach((d) => {
				if (d.month === month && d.day === day) {
					if (d.hour >= parseInt(first) && d.hour < parseInt(end)) {
						select.push(d)
					}
				}
			})
			let splitfeatures = []
			let pieSelect = []
			let pieSelect_mt = []
			let pieSelect_at = []
			const gs = d3.select("#rect" + name + index)
			select.forEach((item) => {
				splitfeatures.push({
					"irradiation": item.irradiation,
					"ambient_temperature": item.ambient_temperature,
					"module_temperature": item.module_temperature
				})
			})
			const xScale_ = this.xScaleCreat(select)
			const circleLine_ = this.CureLineRender(select, "dc_power", xScale_, this.yScale_A).replace("M", "L")
			const circlePoint_ = circleLine_.split("C")
			const selectC = this.LineCircleShow(gs, circlePoint_, 2, [], "")
			splitfeatures.forEach((th) => {
				let dataset = []
				let dataset_mt = []
				let dataset_at = []
				dataset.push({ "name": "irradiation", "value": th.irradiation })
				dataset.push({ "name": "none", "value": irrMax - th.irradiation })
				dataset_mt.push({ "name": "module_temperature", "value": th.module_temperature })
				dataset_mt.push({ "name": "none", "value": mtMax - th.module_temperature })
				dataset_at.push({ "name": "ambient_temperature", "value": th.ambient_temperature })
				dataset_at.push({ "name": "none", "value": atMax - th.ambient_temperature })
				pieSelect_mt.push(dataset_mt)
				pieSelect.push(dataset)
				pieSelect_at.push(dataset_at)
			})
			ClickIrr.push(pieSelect)
			ClickMt.push(pieSelect_mt)
			ClickAt.push(pieSelect_at)
			this.PieShow(gs, pieSelect, selectC, 7, 10, "ir", "rect" + name + index)
			this.PieShow(gs, pieSelect_mt, selectC, 3, 6, "mt", "rect" + name + index)
			this.PieShow(gs, pieSelect_at, selectC, 0, 3, "at", "rect" + name + index)
			let idd = String("rect" + name + index)
			this.CompareClickPie[idd + "-ir"] = ClickIrr
			this.CompareClickPie[idd + "-mt"] = ClickMt
			this.CompareClickPie[idd + "-at"] = ClickAt
		})
		// this.LineBackShow()
		loading.style.display = "none"
	}

	componentDidMount() {
		this.GeneralLine()
		// console.log("lineCompare state componentDidMount",1)
	}
	render() {
		const data = this.data
		const { total } = this.state
		let renders = null
		this.name = []
		for (let key in data) {
			this.name.push(key)
		}
		if (total === true) {
			renders = (
				<div style={{ width: this.theme.width, height: this.theme.height - 25, overflow: "auto" }}>
					<svg style={{ width: this.theme.width, height: ((this.theme.height - 20) / 4) * (this.name.length) }} id="compaleline"></svg>
				</div>
			)
		} else {
			renders = (
				<div>
					<svg style={{ width: this.theme.width - 2, height: (this.theme.height - 20) / 4 }} id="select"></svg>
					<div style={{ width: this.theme.width, height: this.theme.height - (this.theme.height - 20) / 4 - 25, overflow: "auto" }}>
						<svg style={{ width: this.theme.width, height: ((this.theme.height - 20) / 4) * (this.name.length - 1) }} id="compaleline"></svg>
					</div>
				</div>
			)
		}

		return (
			<div className='LineCompale' style={{ position: 'absolute', ...this.theme }}>
				<div style={{ ...this.theme.title }}>
				{/* 750 => 700 */}
					<div style={{ width: "20px", height: "20px", position: "absolute", top: "0px", left: "700px" }} id="kuan" className="small-icon" onClick={() => {
						let stateBar = document.getElementById("select")
						const loading = document.getElementById("loading")
						loading.style.display = "block"
						document.onselectstart = () => { return false }
						stateBar.onmousedown = (e) => {
							let posx = e.clientX + document.documentElement.scrollLeft
							let posy = e.clientY + document.documentElement.scrollTop
							// console.log(document.documentElement.scrollTop);
							let MousePoseStart = [posx - this.theme.left, posy - this.theme.top - 20]
							let div = document.createElement("div")
							div.className = "tempDiv"
							div.style.left = e.clientX + document.documentElement.scrollLeft + "px"
							div.style.top = e.clientY + document.documentElement.scrollTop + "px"
							div.style.pointerEvents = "none"
							document.body.appendChild(div)
							stateBar.onmousemove = (ev) => {
								div.style.left = Math.min(ev.clientX + document.documentElement.scrollLeft, posx) + "px"
								div.style.top = Math.min(ev.clientY + document.documentElement.scrollTop, posy) + "px"
								div.style.width = Math.abs(posx - (ev.clientX + document.documentElement.scrollLeft)) + "px"
								div.style.height = Math.abs(posy - (ev.clientY + document.documentElement.scrollTop)) + "px"
							}
							stateBar.onmouseup = (evn) => {
								let docX = evn.clientX + document.documentElement.scrollLeft
								let docY = evn.clientY + document.documentElement.scrollTop
								let MousePosLast = [docX - this.theme.left, docY - this.theme.top - 20]
								const circle = document.getElementById("select").getElementsByTagName("circle")
								for (let i = 0; i < circle.length; i++) {
									let x = parseFloat(circle[i].getAttribute("cx"))
									if (x >= (posx - this.theme.left) && x <= (docX - this.theme.left)) {
										this.RectCircle.push(circle[i])
									}
								}
								this.AbnornalCircleSelect(MousePoseStart, MousePosLast)
								stateBar.onmousemove = null
								stateBar.onmouseup = null
								stateBar.onmousedown = null
							}
						}
					}}>
						<svg t="1638443538744" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7130" width="20" height="20"><path d="M170.666667 128 213.333333 128 213.333333 213.333333 128 213.333333 128 170.666667C128 147.2 147.2 128 170.666667 128M853.333333 128C876.8 128 896 147.2 896 170.666667L896 213.333333 810.666667 213.333333 810.666667 128 853.333333 128M640 213.333333 640 128 725.333333 128 725.333333 213.333333 640 213.333333M469.333333 213.333333 469.333333 128 554.666667 128 554.666667 213.333333 469.333333 213.333333M298.666667 213.333333 298.666667 128 384 128 384 213.333333 298.666667 213.333333M896 853.333333C896 876.8 876.8 896 853.333333 896L810.666667 896 810.666667 810.666667 896 810.666667 896 853.333333M640 896 640 810.666667 725.333333 810.666667 725.333333 896 640 896M469.333333 896 469.333333 810.666667 554.666667 810.666667 554.666667 896 469.333333 896M298.666667 896 298.666667 810.666667 384 810.666667 384 896 298.666667 896M170.666667 896C147.2 896 128 876.8 128 853.333333L128 810.666667 213.333333 810.666667 213.333333 896 170.666667 896M128 640 213.333333 640 213.333333 725.333333 128 725.333333 128 640M896 640 896 725.333333 810.666667 725.333333 810.666667 640 896 640M128 469.333333 213.333333 469.333333 213.333333 554.666667 128 554.666667 128 469.333333M896 469.333333 896 554.666667 810.666667 554.666667 810.666667 469.333333 896 469.333333M128 298.666667 213.333333 298.666667 213.333333 384 128 384 128 298.666667M896 298.666667 896 384 810.666667 384 810.666667 298.666667 896 298.666667Z" p-id="7131" fill="#707070"></path></svg>
					</div>
					<div style={{ width: "20px", height: "20px", position: "absolute", top: "0px", left: "725px" }} className="small-icon" onClick={() => {
						let stateBar = document.getElementById("select")
						stateBar.onmousedown = null
						DeletTemp()
						for (let i = 0; i < this.LineLightArr.length; i++) {
							this.LineLightArr[i].setAttribute("stroke", "rgb(236,236,236)")
						}
						this.AllPieRender("select")
						this.LineLightArr = []
						this.SimilarCircle = []
						this.RectCircle = []
						this.LineNumMax_T = null
						this.LineNumMin_T = null
					}}>
						<svg t="1638443654183" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8243" width="20" height="20"><path d="M435.2 921.6s-4.266667 0 0 0c-25.6-4.266667-51.2-12.8-81.066667-21.333333C128 819.2 17.066667 580.266667 98.133333 354.133333c81.066667-221.866667 320-332.8 546.133334-256 221.866667 81.066667 337.066667 328.533333 256 546.133334-4.266667 12.8-8.533333 25.6-17.066667 38.4l-4.266667 12.8c-4.266667 8.533333-17.066667 12.8-29.866666 8.533333-8.533333-4.266667-12.8-17.066667-8.533334-29.866667l8.533334-12.8c4.266667-12.8 8.533333-21.333333 12.8-29.866666 72.533333-200.533333-29.866667-422.4-230.4-494.933334-204.8-72.533333-422.4 29.866667-490.666667 230.4-72.533333 204.8 29.866667 422.4 230.4 494.933334 25.6 8.533333 46.933333 17.066667 68.266667 21.333333 12.8 0 21.333333 12.8 17.066666 25.6 0 4.266667-12.8 12.8-21.333333 12.8z" fill="#515151" p-id="8244"></path><path d="M516.266667 921.6c-12.8 0-21.333333-8.533333-21.333334-21.333333s8.533333-21.333333 21.333334-21.333334c106.666667-4.266667 213.333333-55.466667 281.6-140.8 8.533333-8.533333 21.333333-8.533333 29.866666-4.266666s8.533333 21.333333 4.266667 29.866666c-76.8 93.866667-192 153.6-315.733333 157.866667z" fill="#515151" p-id="8245"></path><path d="M439.466667 930.133333c-8.533333 0-17.066667-4.266667-21.333334-12.8l-51.2-115.2c-4.266667-12.8 0-21.333333 12.8-29.866666 12.8-4.266667 21.333333 0 29.866667 12.8l51.2 115.2c4.266667 12.8 0 21.333333-12.8 29.866666h-8.533333z" fill="#515151" p-id="8246"></path><path d="M324.266667 981.333333c-8.533333 0-17.066667-4.266667-21.333334-12.8-4.266667-12.8 0-21.333333 12.8-29.866666l115.2-51.2c12.8-4.266667 21.333333 0 29.866667 12.8 4.266667 12.8 0 21.333333-12.8 29.866666L332.8 981.333333h-8.533333z" fill="#515151" p-id="8247"></path></svg>
					</div>
					<div className="small-icon" style={{ width: "20px", height: "20px", position: "absolute", top: "0px", left: "675px" }} onClick={() => {
						DeletTemp()
						this.DelectAllg()
						this.LineRender()
					}}>
						<svg t="1638848147125" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2439" width="20" height="20"><path d="M885.333333 85.333333H309.333333a53.393333 53.393333 0 0 0-53.333333 53.333334v117.333333H138.666667a53.393333 53.393333 0 0 0-53.333334 53.333333v576a53.393333 53.393333 0 0 0 53.333334 53.333334h576a53.393333 53.393333 0 0 0 53.333333-53.333334v-117.333333h117.333333a53.393333 53.393333 0 0 0 53.333334-53.333333V138.666667a53.393333 53.393333 0 0 0-53.333334-53.333334z m-160 800a10.666667 10.666667 0 0 1-10.666666 10.666667H138.666667a10.666667 10.666667 0 0 1-10.666667-10.666667V309.333333a10.666667 10.666667 0 0 1 10.666667-10.666666h576a10.666667 10.666667 0 0 1 10.666666 10.666666z m170.666667-170.666666a10.666667 10.666667 0 0 1-10.666667 10.666666h-117.333333V309.333333a53.393333 53.393333 0 0 0-53.333333-53.333333H298.666667V138.666667a10.666667 10.666667 0 0 1 10.666666-10.666667h576a10.666667 10.666667 0 0 1 10.666667 10.666667z" fill="#707070" p-id="2440"></path></svg>
					</div>
					<div className="small-icon" style={{ width: "20px", height: "20px", position: "absolute", top: "0px", left: "650px" }} onClick={() => {
						DeletTemp()
						this.DelectAllg()
						this.setState({ total: true }, () => {
							this.GeneralLine()
						})
					}}>
						<svg t="1642923391337" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2726" width="20" height="20"><path d="M675.328 117.717333A425.429333 425.429333 0 0 0 512 85.333333C276.352 85.333333 85.333333 276.352 85.333333 512s191.018667 426.666667 426.666667 426.666667 426.666667-191.018667 426.666667-426.666667c0-56.746667-11.093333-112-32.384-163.328a21.333333 21.333333 0 0 0-39.402667 16.341333A382.762667 382.762667 0 0 1 896 512c0 212.074667-171.925333 384-384 384S128 724.074667 128 512 299.925333 128 512 128c51.114667 0 100.8 9.984 146.986667 29.12a21.333333 21.333333 0 0 0 16.341333-39.402667z m-324.693333 373.013334l174.464-174.485334a21.141333 21.141333 0 0 0-0.192-29.973333 21.141333 21.141333 0 0 0-29.973334-0.192l-208.256 208.256a20.821333 20.821333 0 0 0-6.122666 14.976c0.042667 5.418667 2.133333 10.837333 6.314666 14.997333l211.178667 211.2a21.141333 21.141333 0 0 0 29.973333 0.213334 21.141333 21.141333 0 0 0-0.213333-29.973334l-172.629333-172.629333 374.997333 2.602667a20.693333 20.693333 0 0 0 21.034667-21.034667 21.482667 21.482667 0 0 0-21.333334-21.333333l-379.242666-2.624z" fill="#707070" p-id="2727"></path></svg>
					</div>
				</div>
				{renders}
				{/* <svg style={{ width: this.theme.width - 2, height: (this.theme.height - 20) / 5 }} id="select"></svg>
				<div style={{ width: this.theme.width, height: this.theme.height - (this.theme.height) / 5 - 25, overflow: "auto" }}>
					<svg style={{ width: this.theme.width, height: ((this.theme.height - 20) / 5) * (this.name.length - 1) }} id="compaleline"></svg>
				</div> */}
				<div style={{
					width: this.theme.width - 2,
					height: this.theme.height - (this.theme.height - 20) / 5 - 20,
					position: "absolute",
					left: "0px",
					top: (this.theme.height - 20) / 5 + 20,
					background: "rgb(180,180,180)",
					opacity: 0.5,
					display: "none"
				}} id="loading"></div>
			</div>
		)
	}
}
export default LineCompale;