const CTRL_RETRY = 0x00;
const CTRL_FRAG = 0x01;
const CTRL_PROT = 0x02;
const CTRL_ACK = 0x03;
const CTRL_TYPE = 0x04;
const CTRL_TYPE_HIGH = 0x05;
const CTRL_VERSION = 0x06;
const CTRL_VERSION_HIGH = 0x07;

//type为真为data isFirst只有在分包第二次后才为假  typeKey是类型编号 首次dateLength代表总长度
function pottingData(typeKey,seq,data,dateLength,isFrag,type,isFirst,i,isLast) {
    let ctrl = 0;
    ctrl = bitClear(ctrl,CTRL_RETRY);
    ctrl = isFrag?bitSet(ctrl,CTRL_FRAG):bitClear(ctrl,CTRL_FRAG);
    ctrl = type?bitSet(ctrl,CTRL_PROT): bitClear(ctrl,CTRL_PROT);
    ctrl = bitClear(ctrl,CTRL_ACK);
    ctrl = type?bitSet(ctrl,CTRL_TYPE):bitClear(ctrl,CTRL_TYPE);
    ctrl = bitClear(ctrl,CTRL_TYPE_HIGH);
    ctrl = bitClear(ctrl,CTRL_VERSION);
    ctrl = type?bitSet(ctrl,CTRL_VERSION_HIGH):bitClear(ctrl,CTRL_VERSION_HIGH);
    let buffer;
    if (isFirst) {
      if (type) {
        buffer = new ArrayBuffer(data.length+18);
      }else{
        buffer = new ArrayBuffer(data.length+17);
      }
     
    }else{
      buffer = new ArrayBuffer(data.length+8);
    }
     
    let dataView = new DataView(buffer);
    dataView.setUint8(0,ctrl);
    dataView.setUint8(1,seq);
    if (isFirst) {
      let frag_ctrl = 0;
      if (!type) {
        frag_ctrl = bitSet(frag_ctrl,15);
      }
      dataView.setUint8(2,frag_ctrl&0xff);
      dataView.setUint8(3,frag_ctrl>>0x88);
      dataView.setUint8(4,dateLength&0xff);
      dataView.setUint8(5,dateLength>>0x08);
      let i = 6;
      if (!type) {
        dataView.setUint8(i,data.length+9+1);
      }else{
        dataView.setUint8(i,data.length+9+2);
      }
      dataView.setUint8(7,1);
      dataView.setUint8(8,1);
      dataView.setUint8(9,1);
      dataView.setUint8(10,1);
      dataView.setUint8(11,1);
      dataView.setUint8(12,2);
      dataView.setUint8(13,2);
      dataView.setUint8(14,2);
      dataView.setUint8(15,2);
      if (!type) {
        dataView.setUint8(16,typeKey);
        for (let i = 0; i < data.length; i++) {
          dataView.setUint8(i+17, data[i]);
        }
      }else{
        
        dataView.setUint8(16,data.length);
        dataView.setUint8(17,typeKey);
        for (let i = 0; i < data.length; i++) {
          dataView.setUint8(i+18, data[i]);
      }
      }
      
    }else{
      if (isLast) {
        let newFragCtrl = bitSet(i+1,15)
        dataView.setUint8(2,i+1&0xff);
        dataView.setUint8(3,newFragCtrl>>0x88);
      }else{
        dataView.setUint8(2,i+1&0xff);
        dataView.setUint8(3,i+1>>0x88);
      }
      dataView.setUint8(4,dateLength+3);
      dataView.setUint8(5,1);
      dataView.setUint8(6,data.length);
      dataView.setUint8(7,typeKey);
      for (let i = 0; i < data.length; i++) {
        dataView.setUint8(i+8, data[i]);
     }
    }
    return buffer;
}

function bitClear(ctrl,num) {
  let newctrl = ctrl &= ~(1<<num);
  return newctrl;
}
function bitSet(ctrl,num) {
  let newctrl = ctrl |= (1<<num);
  return newctrl;
}

module.exports = {
  pottingData: pottingData,
}