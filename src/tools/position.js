/*
 * @Author: your name
 * @Date: 2021-10-28 10:18:47
 * @LastEditTime: 2022-01-23 21:04:51
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \myapp\src\tools\main.js
 */

// 展示框主题样式设置

export const Themes={
    // 控制台
    ControlTheme:{
        width:250, // 290 - 40 = 250
        height:445, // 525 - 80 = 435
        // border:"1px solid rgb(180,180,180)",
        borderTop:"1px solid rgb(180,180,180)",
        borderLeft:"1px solid rgb(180,180,180)",
        borderRight:"1px solid rgb(180,180,180)",
        borderBottom:"1px solid rgb(180,180,180)",
        top:95,
        left:10,
        title:{
            width:248, // 288 - 40 = 248
            height:20,
            background:"#F8F8FF"
        }
    },
    CompareTheme:{
        width:380,
        height:400,
        border:"1px solid rgb(180,180,180)",
        left:1030, // 1120 => 1030
        top:315     // 452 => 315
    },
    AbnormalTheme:{
        width:380,
        height:437,
        border:"1px solid rgb(180,180,180)",
        left:1120,
        top:10,
        title:{
            width:378,
            height:20,
            background:"#F8F8FF"
        }
    },
    AnalysisTheme:{
        width:760, // 810 - 50 = 760
        height:300,
        left:265, // 305 - 40 = 265
        border:"1px solid rgb(180,180,180)",
        top:10,
        title:{
            width:758, // 808 - 50 = 758
            height:20,
            background:"#F8F8FF"
        }
    },
    LineCompale:{
        width:760, // 810 => 760
        height:538,
        border:"1px solid rgb(180,180,180)",
        left:265, // 305 => 265
        top:315,
        title:{
            width:758, // 808 => 758
            height:20,
            background:"#F8F8FF"
        }
    },
    ScatterTheme:{
        width:290,
        height:290,
        border:"1px solid rgb(180,180,180)",
        top:245,
        left:10
    },
    AddInfoTheme:{
        width:380, // 290 => 380
        height:310, // 318 => 310
        // border:"1px solid rgb(180,180,180)",
        top:0,    // 535 => 0 
        left:1030, // 0 => 1030
        borderBottom:"1px solid rgb(180,180,180)",
        borderLeft:"1px solid rgb(180,180,180)",
        borderRight:"1px solid rgb(180,180,180)",
    },
    // 数据介绍框
    DataIntroduceTheme:{
        width: 250,
        height:80,
        top: 10,
        left: 10,
        border:'1px solid rgb(180, 180, 180)',
        title:{
            width:248,
            height:20,
            background:"#E9E9FF"
        }
    }
}