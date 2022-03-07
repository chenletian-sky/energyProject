import React, { Component } from 'react'
import * as d3 from 'd3';

import Chart from "./chart.js";
const data = require("./data.json")

const config = {
    // margins: {top: 80, left: 50, bottom: 50, right: 50},
    textColor: 'black',
    title: '日历热力图',
    hoverColor: 'red',
    startTime: '2018-01-01',
    endTime: '2018-01-31',
    cellWidth: 20,
    cellHeight: 20,
    cellPadding: 1,
    cellColor1: 'white',
    cellColor2: 'green',
    lineColor: 'yellow',
    lineWidth: 2
}

export default class Calendar extends Component {
    

    constructor(props){
        super(props)
        
        this.chart = new Chart()
        
        // this.chart.margins(config.margins);



        this.state = {
            startTime : new Date(config.startTime),
            endTime : new Date(config.endTime),
            widthOffset : config.cellWidth + config.cellPadding,
            heightOffset : config.cellHeight + config.cellPadding
        }

        
            

    }
    
    componentDidMount(){
        

        this.calendarRender()
    }

    calendarRender(){
        const {chart} = this
        const {startTime,endTime,widthOffset,heightOffset} = this.state
        
        chart.scaleColor = d3.scaleLinear()
                                .domain([0, d3.max(Object.values(data))])
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

                monthGroup
                    .append('g')
                    .attr('class', 'g ' + currentDate.join('-'))
                    .datum(currentDate.join('-'))
                    .append('rect')
                    .attr('width', config.cellWidth)
                    .attr('height', config.cellHeight)
                    // .attr('x', Math.floor(currentDay / 7) * widthOffset)
                    // .attr('y', currentDay % 7 * heightOffset);
                    .attr('x', currentDay % 7 * widthOffset)
                    .attr('y', Math.floor(currentDay / 7) * heightOffset);

                currentDay++;
            }

            d3.selectAll('.g')
                .each(function(d){
                    d3.select(this)
                        .attr('fill', chart.scaleColor(data[d] || 0))
                        .datum({time: d, value: data[d] || 0});
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
        // chart.renderLine = function(){
        //     const initDay = startTime.getDay();
        //     const days = [initDay-1];
        //     const linePaths = getLinePath();

        //     d3.select('.date')
        //             .append('g')
        //             .attr('class', 'lines')
        //             .selectAll('path')
        //             .data(linePaths)
        //             .enter()
        //             .append('path')
        //             .attr('stroke', config.lineColor)
        //             .attr('stroke-width', config.lineWidth)
        //             .attr('fill', 'none')
        //             .attr('d', (d) => d);

        //     function getLinePath(){
        //         const paths = [];

        //         d3.selectAll('.month')
        //             .each(function(d,i){
        //                 days[i+1] = days[i] + this.childNodes.length;
        //             });

        //         days.forEach((day,i) => {
        //             let path = 'M';
        //             let weekDay = day < 0 ? 6 : day % 7;

        //             if (weekDay !== 6) {
        //                 path += Math.floor(day / 7) * widthOffset + ' ' + 7 * heightOffset;
        //                 path +=  ' l' + '0' + ' ' + (weekDay - 6) * heightOffset;
        //                 path += ' l' + widthOffset + ' ' + '0';
        //                 path += ' l' + '0' + ' ' + (-weekDay - 1) * heightOffset;
        //             } else {
        //                 path += (Math.floor(day / 7) + 1) * widthOffset + ' ' + 7 * heightOffset;
        //                 path +=  ' l' + '0' + ' ' + (-7) * heightOffset;
        //             }

        //             paths.push(path);
        //         });

        //         return paths;
        //     }

        // }

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

            let months = d3.timeMonth.range(new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate()), new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate()));

            months = months.map((d) => d3.timeFormat("%b")(d));

            d3.select('.year')
                .append('g')
                .attr('class', 'month-label')
                .selectAll('text')
                .data(months)
                .enter()
                .append('text')
                .attr('y', (d,i) => i*widthOffset*4.25 + widthOffset*2)
                .attr('x', -30)
                .text((d) => d)

        }

        /* ----------------------------渲染图标题------------------------  */
        chart.renderTitle = function(){

            chart.svg().append('text')
                    .classed('title', true)
                    .attr('x', chart.width()/2)
                    .attr('y', 0)
                    .attr('dy', '2em')
                    .text(config.title)
                    .attr('fill', config.textColor)
                    .attr('text-anchor', 'middle')
                    .attr('stroke', config.textColor);

        }

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
                .on('mouseenter', function(d){
                    // const e = currentEvent;
                    // const position = d3.mouse(chart.svg().node());

                    // d3.select(d.target)
                    //     .attr('fill', config.hoverColor);

                    // chart.svg()
                    //     .append('text')
                    //     .classed('tip', true)
                    //     .attr('x', position[0]+5)
                    //     .attr('y', position[1])
                    //     .attr('fill', config.textColor)
                    //     .text(d.time);
                })
                .on('mouseleave', function(d){
                    // const e = currentEvent;

                    // d3.select(e.target)
                    //     .attr('fill', chart.scaleColor(d.value));

                    d3.select('.tip').remove();
                })
                // .on('mousemove', debounce(function(){
                //         const position = d3.mouse(chart.svg().node());
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

            // chart.addMouseOn();

        }

        chart.renderChart();
    }

    render() {
        return (
        <div id="Calendar" 
            style={{
                // position:"relative",
                // left:"15px"
            }}
        ></div>
        )
    }
}


// d3.json('./data.json').then(function(data){

    


// });














