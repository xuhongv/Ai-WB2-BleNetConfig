import treaty from '/treaty.js'
import codec from '/codec.js'
import bleParams from '/bleParams.js'

//要写入的设备id，uuid固定
let deviceId = "";
//缓存的接受结果，用户存储分段传输的数据
let getDateResults = "";

//延时判断回调是否接收到数据
let delayedAction;

let resolve = null;
let reject = null;
//回调是否接收到数据
let receive = true;
//写入失败的次数
//读取失败的次数
let readErrorTime = 0;
//未接收到回调的次数

function log(title){
//   wx.showToast({  
//     title: title,  
//     icon: 'success',  
//     duration: 1500  
// }) 
}
function writeToBLE(buffer,time,resolve, reject){
  let writeSuccess = false;
  console.log("=======>准备开始写数据");
  wx.writeBLECharacteristicValue({
      deviceId: deviceId,
      serviceId: bleParams.UUID_SERVICE,
      characteristicId: bleParams.UUID_WRITE_CHARACTERISTIC,
      value: buffer,
      success: (res) => {
          console.log('写入成功:', res.errMsg);
          writeSuccess = true;
          resolve(res.errMsg) 
      },
      fail(res){
          console.log("失败")
          console.log('写入失败', res.errMsg)
          reject(res.errMsg)
      }
  });  
}

function stop(){
  delayedAction && clearTimeout(delayedAction);//如果t 不是 null，NaN 就调用clearTime（t），则会终止
 }

wx.onBLECharacteristicValueChange(function (res) {
  stop()
  
  receive = true;
  console.log("characteristicId：" + res.characteristicId)
  console.log("serviceId:" + res.serviceId)
  console.log("deviceId" + res.deviceId)
  console.log("Length:" + res.value.byteLength)
  var bytes = new Uint8Array(res.value);
  console.log("Uint8Array bytes:" + bytes)
  console.log("判断数据");
  log("判断数据");
 
  if (bytes==null||bytes.length<3||bytes==0||bytes[0]==0||bytes.length<2||res.value.byteLength==1) {
      setTimeout(() => {
        readErrorTime++;
          writeCallback(resolve, reject)
      }, 100)
  }else{
    
    log("准备回调");
    resolve(bytes)
  }
});

function writeCallback(mresolve, mreject){
  if (readErrorTime>5) {
    mreject("readErrorTimeFive")
    return
  }
    receive = false;
    //将状态重置，缓存回调便于失败后重新操作
    resolve = mresolve
    reject = mreject
    wx.readBLECharacteristicValue({
      deviceId: deviceId,
      serviceId: bleParams.UUID_SERVICE,
      characteristicId: bleParams.UUID_READ_CHARACTERISTIC,
      success: (res) => {
        receive = false;
        log("read success");
        delayedAction = setTimeout(() => {
          if (receive == false) {
            readErrorTime++;
            writeCallback(resolve, reject)
            log("read agaen");
          }
        }, 300)
        
      },
      fail: (res)=>{
        readErrorTime++;
          setTimeout(() => {
            writeCallback(resolve, reject)
          }, 300)
      }
  });
}

function sen8kDate(toDeviceId,mtu,seq,value,type,callback) {
  deviceId = toDeviceId
  let data = [];
  if (value==null||value=="") {
    //暂不可能触发或者密码可为空
    // callback("datanull")
  }else{
    data = codec.utf8.encode(value);
  }
  console.log(data);
  let everyDateLength = mtu - bleParams.everyDateLength;
  let firstDateLength = mtu - bleParams.firstDateLength;
  //此判断不够谨慎
  if (data.length>mtu) {
      //下面发送第一次数据
      let buffer =  treaty.pottingData(type,data.slice(0,firstDateLength),data.length,true,true,true,0,false);
      console.log(buffer);
      writeToWithDate(buffer);
      data = data.slice(firstDateLength);
      let result = sliceArr(data, size);
      console.log(result);
      //上面直接将数据分组 下面循环处理剩下数据和发送
      for (i = 0; i < result.length; i++) {
          if (i==result.length) {
              buffer = treaty.pottingData(type,result[i],everyDateLength,true,true,false, i+1,true);
          }else{
              buffer = treaty.pottingData(type,result[i],everyDateLength,true,true,false, i+1,false);
          }
          console.log(buffer); 
          writeToWithDate(buffer, 1, null);
        }
    }else{
      let buffer;
      if (data.length<firstDateLength) {
          buffer = treaty.pottingData(type,seq,data,data.length,false,true,true,0,true);
      } else {
          //暂时未处理 也不会出现这种情况
          //buffer = treaty.pottingData(type,this.data.seq,data.slice(0,firstDateLength),firstDateLength,false,true,true,0,true);
          // firstDateLength最值23-19等于4 
          buffer = treaty.pottingData(type,seq,data,data.length,false,true,true,0,true);
      }
      console.log(buffer); 
      writeToWithDate(buffer,1,callback);
  }
}
function writeToWithDate(buffer,time,callback){
  new Promise((resolve,reject)=>{
    writeToBLE(buffer,time,resolve, reject)
  }).then(res=>{
    console.log(res)
    new Promise((resolve,reject)=>{
      readErrorTime = 0
      writeCallback(resolve, reject)
    }).then(
        (res) => {
          console.log(res)
          callback(res)
        },  // 成功
        (err) => {
          console.log(err)
          callback(err)
        } // 失败
      )
  },err=>{
    console.log(err)
  })
}

function getVersion(toDeviceId,seq,type,indexresolve,indexreject){
  deviceId = toDeviceId
  let data = []
  data = codec.utf8.encode("1234")
  let buffer =  treaty.pottingData(type,seq,data,data.length,false,false,true,0,true)
  let time = 1
  new Promise((resolve,reject)=>{
      writeToBLE(buffer,time,resolve,reject)
    }).then(res=>{
      log("123444");
      console.log(res)
      new Promise((resolve,reject)=>{
        readErrorTime = 0
        writeCallback(resolve, reject)
        //此处添加长时间未接收到而
      }).then(
          (res) => {
            console.log(res)
            log("准备解析数据")
            getVersionDate(res,indexresolve,indexreject)
          },  // 成功
          (err) => {
            //数据还没准备好，或者解析有问题 就返回到这里重新写du 
            console.log(err)
            indexreject(err.errMsg)
          } // 失败
        )
    },err=>{
      console.log(err)
      indexreject(err.errMsg)
    })
}

function getVersionDate(bytes,indexresolve,indexreject){
  if (bytes==null) {
    log("准备解析数据")
  } else {
      let dateString = Uint8ArrayToString(bytes);
      let frag_ctrl = bytes[3]<<8|bytes[2];
      frag_ctrl &= 0x7fff;
      let ackCode;
      log("准备解析数据1")
      if (frag_ctrl == 0) {
          ackCode = bytes[17];
          let dataLength = bytes[6];
          if (dataLength<11) {
              console.error("数据解析失败，长度不够");
              return
          }
      } else {
          ackCode = bytes[7];
          let dataLength = bytes[6];
          if (dataLength<1) {
              console.error("数据解析失败，长度不够");
              return
          }
      }
      log("准备解析数据23")
      if (ackCode==0) {
          let date2String;
          log((frag_ctrl==0).toString())
          if (frag_ctrl==0) {
              date2String = bytes.slice(18,bytes[16]+18)
              log("出错2")
          } else {
              date2String = bytes.slice(8,bytes[6]+8)
              log("出错1")
          }
          log("准备解析数据456")
            if (date2String.length==0) {
                console.log("date2String.length==0");
                // if (this.data.seq>3) {
                //     return
                // } else {
                    
                // }
                indexreject("date2Stringis0")
            } else {
              log("准备解析数据7890-")
              let unit8Arr = new Uint8Array(date2String);
              let encodedString = String.fromCharCode.apply(null, unit8Arr);
              let decodedString;
              try { 
                  decodedString = decodeURIComponent(escape((encodedString)));
              } catch (error) { 
                  console.error("解码出错")
                  decodedString = dateString; 
              } 
              getDateResults += decodedString;
              let frag_ctrl_high = ( bytes[3]<<8) | bytes[2];
              let code = bitGet(frag_ctrl_high,15);
              if (code == 1) {
                  //解析和显示
                  indexresolve(getDateResults)
              }
              getDateResults = ""
          }
      }else{
        log("数据还没准备好")
        indexreject("acd!=0")
        // writeCallback(resolve, reject)
      }
  }
}

function sendIfSucc(toDeviceId,seq,type,indexresolve,indexreject){
  deviceId = toDeviceId
  let data = []
  data = codec.utf8.encode("1234")
  let buffer =  treaty.pottingData(type,seq,data,data.length,false,false,true,0,true)
  console.log(buffer)
  let time = 10

  new Promise((resolve,reject)=>{
      writeToBLE(buffer,time,resolve, reject)
    }).then(res=>{
      console.log(res)
      new Promise((resolve,reject)=>{
        readErrorTime = 0
        writeCallback(resolve, reject)
      }).then(
          (res) => {
            console.log(res)
            readIfSucc(res,indexresolve,indexreject)
          },  // 成功
          (err) => {
            console.log(err)
            indexreject(res.errMsg)
          } // 失败
        )
    },err=>{
      console.log(err)
      console.log("失败")
      indexreject(err.errMsg)
    })
}

function readIfSucc(bytes,indexresolve,indexreject){
  if (bytes==null) {
      
  } else {
      let frag_ctrl = bytes[3]<<8|bytes[2];
      frag_ctrl &= 0x7fff;
      let ackCode;
      if (frag_ctrl == 0) {
          ackCode = bytes[17];
          let dataLength = bytes[6];
          if (dataLength<11) {
              console.error("数据解析失败，长度不够");
              return
          }
      } else {
          ackCode = bytes[7];
          let dataLength = bytes[6];
          if (dataLength<1) {
              console.error("数据解析失败，长度不够");
              return
          }
      }
      if (ackCode==0) {
        indexresolve("发送指令成功")
      }else{
        indexreject("发送指令失败")
      }
    }
}

function Uint8ArrayToString(fileData){
  var dataString = "";
  for (var i = 0; i < fileData.length; i++) {
      dataString += String.fromCharCode(fileData[i]);
  }
  return dataString
}
function bitGet( dater, num){
  return ((dater & (1<<(num))) >> num) == 1 ? 1 : 0
}

module.exports = {
  writeToBLE: writeToBLE,
  //获取数据
  getVersion: getVersion,
  //指令操控
  sendIfSucc: sendIfSucc,
  sen8kDate: sen8kDate,
}