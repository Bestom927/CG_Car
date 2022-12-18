
async function getRankList(){
    var rank_list;
    await axios({
        method: 'get',
        url: 'http://localhost:8081/rank',
    }).then(res=>{
        rank_list = res;
    }).catch(errMsg=>{
        console.log(errMsg);
    })
    return rank_list;
}
async function addRecord(userName,completionTime){
    // 获取当前时间，精确为秒，转为字符串
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth()+1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var date_str = year.toString() +'/'+ month.toString()+'/' + day.toString()+' ' + hour.toString() +':'+ minute.toString();

    var is_succeed
    await axios.post('http://localhost:8081/rank', {
        userName: userName,
        completionTime:completionTime,
        recordTime:date_str
    }).then(res=>{
        if(res.data.message=="OK"){
            is_succeed=true
        }
        else{
            is_succeed=false
        }
    }).catch(errMsg=>{
        console.log(errMsg)
    })
    return is_succeed
}