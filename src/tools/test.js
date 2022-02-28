/*
 * @Author: your name
 * @Date: 2021-12-03 10:05:05
 * @LastEditTime: 2021-12-08 21:31:59
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: \myapp\src\tools\test.js
 */
// dtw = (arr1, arr2)=>{
//     let matrix = [];
//     arr1.forEach((value1)=>{
//         let line = [];
//         matrix.push(line);
//         arr2.forEach((value2)=>{
//             line.push(distance(value1, value2));
//         });
//     });
//     console.log(matrix);
//     const dis = minSearch(matrix, arr2.length, arr1.length)
//     console.log(dis)
//     return dis
// }

// minSearch = (matrix, i, j)=>{
//     if(i == 0 || j == 0){
//         return 0;
//     }
//     let d = matrix[j - 1][i - 1];
//     let a = minSearch(matrix, i - 1, j) + d;
//     let b = minSearch(matrix, i, j - 1) + d;
//     let c = minSearch(matrix, i - 1, j - 1) + d * 2;
//     return Math.min(a, b, c);
// }

// distance=(value1, value2)=>{
//     return Math.abs(value1 - value2);
// }

// dtw([2],[1,5,8,7,9]);

