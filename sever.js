/*
 * @Author: your name
 * @Date: 2020-08-14 14:19:20
 * @LastEditTime: 2022-01-19 14:17:29
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \ajax\src\node\app.js
 */
const express = require('express');
const path = require('path');
const bodyParser = require("body-parser");
const child_process = require("child_process");
const fs = require('fs')
//创建web服务器
const app = express()
const position = []
//解决跨域问题
app.all("*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "PUT,GET,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "X-Request-With");
    res.header("Access-Control-Allow-Headers", ["mytoken", "Content-Type"]);
    next();
});
app.use(express.json());
app.use(
    express.urlencoded({
        extended: false,
    })
);
app.use(express.static(path.join(__dirname, 'public')))


app.post('/data', (req, res) => {
    let file = path.join(__dirname, './data/dataLast.json')
    fs.readFile(file, 'utf-8', function (err, data) {
        if (err) {
            res.send('失败')
        } else {
            var json = eval('(' + data + ')');
            res.send(json);
        }
    })
})
app.post('/MDS',(req,res)=>{
    const data = req.body
    const split = data.split
    // const mae = data.mae
    const month = data.month
    const day = data.day
    console.log(month,day)
    let workerProcess = child_process.exec(
        `python ./data/MDS(2).py ${split} ${month} ${day}`,
        (error, stdout, stderr)=>{
            if (error) {
                console.log(error.stack);
                console.log("Error code: " + error.code);
            }else{
                let json = eval('(' + stdout + ')');
                res.send(json)
            }
        }
    );
    workerProcess.on("exit", function (code) {
        console.log("子进程已退出，退出码 " + code);
    });
})

app.post('/MDS1',(req,res)=>{
    const data = req.body
    const split = data.split
    // const mae = data.mae
    const month = data.month
    const day = data.day
    // console.log(split,month,day)
    let workerProcess = child_process.exec(
        `python ./data/MDS1.py ${split} ${month} ${day}`,
        (error, stdout, stderr)=>{
            if (error) {
                console.log(error.stack);
                console.log("Error code: " + error.code);
            }else{
                let json = eval('(' + stdout + ')');
                res.send(json)
            }
        }
    );
    workerProcess.on("exit", function (code) {
        console.log("子进程已退出，退出码 " + code);
    });
})

app.post('/MDS2',(req,res)=>{
    const data = req.body
    // const mae = data.mae
    const time = data.time
    const month = data.month
    const day = data.day
    console.log(time, month,day)
    let workerProcess = child_process.exec(
        `python ./data/MDS2.py ${time} ${month} ${day}`,
        (error, stdout, stderr)=>{
            if (error) {
                console.log(error.stack);
                console.log("Error code: " + error.code);
            }else{
                let json = eval('(' + stdout + ')');
                res.send(json)
            }
        }
    );
    workerProcess.on("exit", function (code) {
        console.log("子进程已退出，退出码 " + code);
    });
})

app.post('/Kmeans',(req,res)=>{
    const data = req.body
    const split = data.split
    const k = data.k
    console.log(split,k)
    let workerProcess = child_process.exec(
        `python ./data/Kmeans.py ${split} ${k}`,
        (error, stdout, stderr)=>{
            if (error) {
                console.log(error.stack);
                console.log("Error code: " + error.code);
            }else{
                let json = eval('(' + stdout + ')');
                console.log(json)
                res.send(json)
            }
        }
    );
    workerProcess.on("exit", function (code) {
        console.log("子进程已退出，退出码 " + code);
    });
})

// 数据信息
app.post('/information',(req,res)=>{
    let workerProcess = child_process.exec(
        `python ./data/get_data_information.py`,
        (error, stdout, stderr)=>{
            if (error) {
                console.log(error.stack);
                console.log("Error code: " + error.code);
            }else{
                let json = eval('(' + stdout + ')');
                res.send(json)
            }
        }
    );
    workerProcess.on("exit", function (code) {
        console.log("子进程已退出，退出码 " + code);
    });
})

app.listen(5000);
console.log('启动成功')