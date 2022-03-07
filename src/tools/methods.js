/*
 * @Author: your name
 * @Date: 2021-11-17 21:01:26
 * @LastEditTime: 2021-12-08 16:30:37
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: \myapp\src\tools\methods.js
 */
import $ from 'jquery'
import * as d3 from 'd3'
export const  rTime = (date) => {
    const json_date = new Date(date).toJSON();
    return new Date(new Date(json_date) + 8 * 3600 * 1000).toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '')
}
//防抖方法
export function debounce(fn, ms = 500) {
    let timeoutId
    return function () {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
            fn.apply(this, arguments)
        }, ms)
    }
}
export const dtw = (arr1, arr2)=>{
    let matrix = [];
    arr1.forEach((value1)=>{
        let line = [];
        matrix.push(line);
        arr2.forEach((value2)=>{
            line.push(distance(value1, value2));
        });
    });
    const dis = minSearch(matrix, arr2.length, arr1.length)
    return dis
}

const minSearch = (matrix, i, j)=>{
    if(i === 0 || j === 0){
        return 0;
    }
    let d = matrix[j - 1][i - 1];
    let a = minSearch(matrix, i - 1, j) + d;
    let b = minSearch(matrix, i, j - 1) + d;
    let c = minSearch(matrix, i - 1, j - 1) + d * 2;
    return Math.min(a, b, c);
}

const distance=(value1, value2)=>{
    return Math.abs(value1 - value2);
}


export const sort_object = (obj) => {
    let items = Object.keys(obj).map(function (key) {
        return [key, obj[key]];
    })
    items.sort(function (first, second) {
        return (first[1]- second[1]);
    })
    let sorted_obj = {}
    $.each(items, function (k, v) {
        let use_key = v[0]
        let use_value = v[1]
        sorted_obj[use_key] = use_value
    })
    return (sorted_obj)
}



export const DeletTemp = ()=>{
    let div = document.getElementsByClassName("tempDiv")
    let len = div.length
    div.removeNode = []
    for (let i = 0; i < len; i++) {
        div.removeNode.push({
            parent: div[i].parentNode,
            inner: div[i].outerHTML,
            next: div[i].nextSibling
        })
    }
    for (let i = 0; i < len; i++) {
        div[0].parentNode.removeChild(div[0]);
}
}


export const DelectAllg = () => {
    d3.select("#ploat").selectAll("g").remove()
    // d3.select("#liquidfills").selectAll("svg").remove()
    d3.select("#select").selectAll("g").remove()
    d3.select("#compaleline").selectAll("g").remove()
    d3.select("#distribute").selectAll("g").remove()
}






// LineLight = (data, id) => {
	// 	const Max = d3.max(data)
	// 	const Min = d3.min(data)
	// 	const svg = document.getElementById(id)
	// 	const Line = svg.getElementsByClassName("yScale")
	// 	let values = []
	// 	for (let i = 0; i < Line.length; i++) {
	// 		values.push(parseInt(Line[i].getAttribute("value")))
	// 	}
	// 	let MinNum = 10000
	// 	let LineNumMax = null
	// 	for (let i = 0; i < values.length; i++) {
	// 		if (values[i] > Max) {
	// 			if ((values[i] - Max) < MinNum) {
	// 				MinNum = (values[i] - Max)
	// 				LineNumMax = values[i]
	// 			}
	// 		} else if (values[i] === Max) {
	// 			LineNumMax = values[i]
	// 			break
	// 		}
	// 	}
	// 	this.LineNumMax_T = LineNumMax
	// 	MinNum = 10000
	// 	let LineNumMin = null
	// 	for (let i = 0; i < values.length; i++) {
	// 		if (values[i] < Min) {
	// 			if ((Min - values[i]) < MinNum) {
	// 				MinNum = (Min - values[i])
	// 				LineNumMin = values[i]
	// 			}
	// 		} else if (values[i] === Min) {
	// 			LineNumMin = values[i]
	// 			break
	// 		}
	// 	}
	// 	this.LineNumMin_T = LineNumMin
	// 	for (let i = 0; i < Line.length; i++) {
	// 		if (parseInt(Line[i].getAttribute("value")) === LineNumMin || parseInt(Line[i].getAttribute("value")) === LineNumMax) {
	// 			Line[i].setAttribute("stroke", "rgba(255,127,80,0.5)")
	// 			this.LineLightArr.push(Line[i])
	// 		}
	// 	}
	// }
	// LineLight_ = (id) => {
	// 	const svg = document.getElementById(id)
	// 	const Line = svg.getElementsByClassName("yScale")
	// 	for (let i = 0; i < Line.length; i++) {
	// 		if (parseInt(Line[i].getAttribute("value")) === this.LineNumMin_T || parseInt(Line[i].getAttribute("value")) === this.LineNumMax_T) {
	// 			Line[i].setAttribute("stroke", "rgba(255,127,80,0.5)")
	// 			this.LineLightArr.push(Line[i])
	// 		}
	// 	}
	// }