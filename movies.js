
let superagent = require("superagent"),
    cheerio = require("cheerio"),
    eventproxy = require('eventproxy');
let ep = new eventproxy();

let movies = [];//用于存放发爬取到的movie信息，movie是一个js对象
let targetUrlList = [];//用于存放10个页面的url
for(let index = 0; index < 250;){
    let url = `https://movie.douban.com/top250?start=${index}&filter=`;
    targetUrlList.push(url);
    index += 25;
}
for(let url of targetUrlList) {
    superagent.get(url)
        .end(function (err,pres) {
            let $ = cheerio.load(pres.text);//pres.text 里面存储着请求返回的 html 内容，将它传给 cheerio.load 之后
            let movieInfos = $("div.info ");//就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
            for(let index = 0; index < movieInfos.length; index ++){//剩下就都是利用$ 使用 jquery 的语法了
                let title = movieInfos.eq(index).find('a').find('span:first-child').text();//电影名称
                let infoText = movieInfos.eq(index).find('.bd p').text();
                let infoItemsStr = infoText.split('\n')[2];
                let infoItems = infoItemsStr.split('/');
                let year = parseInt(trim(infoItems[0]));//电影出版年份
                let country = trim(infoItems[1]);//电影所属国家
                let tags = trim(infoItems[2]);//电影类型
                let ratingNum = parseInt(movieInfos.eq(index).find('span.rating_num').text());//电影豆瓣评分
                let appraiseNumStr = movieInfos.eq(index).find('div.star').find('span:last-child').text();
                let appraiseNumList = /^\d+/.exec(appraiseNumStr);
                let appraiseNum = parseInt(appraiseNumList[0]);//电影的评价人数
                let newMovie = {title,year,country,tags,ratingNum,appraiseNum};
                movies.push(newMovie);
                ep.emit('getAllMovies',newMovie);//相当于一个计数器
            }
        });
}



ep.after('getAllMovies',250,function (){
    let moviesBefore2000 = [];
    let moviesAfter2010 = [];
    let countryObj = {};
    let tagObj = {};
    for(let movie of movies){
        if(movie.title === '大闹天宫'){
            movie.year = 1961;
            movie.tags = '动画 奇幻';
            movie.country = '中国大陆';
        }
        //console.log(movie.country + ' '+  movie.title);
        if(movie.year < 2000){
            moviesBefore2000.push(movie.title);
        }else if(movie.year > 2010){
            moviesAfter2010.push(movie.title);
        }
        let countryList = movie.country.split(' ');
        for(let country of countryList){
            let isExisted = false;
            for(let existedCountry in countryObj){
                if(country === existedCountry){
                    isExisted = true;
                    countryObj[existedCountry] ++;
                    break;
                }
            }
            if(! isExisted){
                countryObj[country] = 1;
            }
        }
        let tagsList = movie.tags.split(' ');
        for(let tag of tagsList){
            let isExisted = false;
            for(let existedTag in tagObj){
                if(tag === existedTag){
                    isExisted = true;
                    tagObj[existedTag] ++;
                    break;
                }
            }
            if(! isExisted){
                tagObj[tag] = 1;
            }
        }
        // if(movie.tags.indexOf('同性') !== -1){
        //     console.log(movie.title + '  ' + movie.country)
        // }
        if(movie.year === 1994){
            console.log(movie.title)
        }

    }
    let sortedCountry = sortObj(countryObj);
    let sortedTags = sortObj(tagObj);
    //console.log(sortedTags);
    //console.log(sortedCountry);
    //console.log(`2000年以前的电影共有: ${moviesBefore2000.length}部`);
   // console.log(`2010年以后的电影共有: ${moviesAfter2010.length}部`);
    let moviesSortedtByYear = sortMoviesByYear(movies);
    //console.log(moviesSortedtByYear[0]);
    //console.log(moviesSortedtByYear[moviesSortedtByYear.length - 1]);
    let moviesSortedtByAppraiseNum = sortMoviesByAppraiseNum(movies);
    //console.log(moviesSortedtByAppraiseNum[0]);
    //console.log(moviesSortedtByAppraiseNum[1]);
    //console.log(moviesSortedtByAppraiseNum[2]);

    // console.log(moviesSortedtByAppraiseNum[moviesSortedtByAppraiseNum.length - 1]);
    // console.log(moviesSortedtByAppraiseNum[moviesSortedtByAppraiseNum.length - 2]);
    // console.log(moviesSortedtByAppraiseNum[moviesSortedtByAppraiseNum.length - 3]);


});

//把字符串开头和结尾的空格删除
function trim(str) {
    return str ? str.replace(/^\s+|\s+$/g, "") : '';
}

//对js对象按照属性排序
function sortObj(obj) {
    let arr = [];
    for (let i in obj) {
        arr.push([obj[i],i]);
    }
    arr.sort(function (a,b) {
        return b[0] - a[0];
    });
    //console.log(arr);
    let len = arr.length,
        outputObj = {};
    for (let i = 0; i < len; i++) {
        outputObj[arr[i][1]] = arr[i][0];
    }
    //console.log(outputObj);
    return outputObj;
}

function sortMoviesByYear(movies) {
    if(movies.length <= 1){
        return movies;
    }
    let pivotIndex = Math.floor(movies.length / 2);
    let pivot = movies.splice(pivotIndex,1)[0];
    let leftArr = [];
    let rightArr = [];
    for(let movie of movies){
        if(movie.year <= pivot.year){
            leftArr.push(movie);
        }else {
            rightArr.push(movie);
        }
    }
    return sortMoviesByYear(leftArr).concat([pivot],sortMoviesByYear(rightArr));
}

function sortMoviesByAppraiseNum(movies) {
    if(movies.length <= 1){
        return movies;
    }
    let pivotIndex = Math.floor(movies.length / 2);
    let pivot = movies.splice(pivotIndex,1)[0];
    let leftArr = [];
    let rightArr = [];
    for(let movie of movies){
        if(movie.appraiseNum <= pivot.appraiseNum){
            leftArr.push(movie);
        }else {
            rightArr.push(movie);
        }
    }
    return sortMoviesByAppraiseNum(leftArr).concat([pivot],sortMoviesByAppraiseNum(rightArr));
}

