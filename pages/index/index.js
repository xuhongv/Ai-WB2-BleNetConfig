var treaty = require('../../utils/treaty.js');
import codec from '../../utils/codec.js'
import bleParams from '../../utils/bleParams.js'
import bleUtiles from '../../utils/bleUtils.js'

Page({
    data: {
        version: "1.0",
        ble: {
            devices: [],
            available: false,
            discovering: false,
        },
        device: null,
        characteristic: null,
        setMtuHasOk:null,
        wifiState: "正在获取中",
        six22version: "",
        working: false,
        acdNotEqualZore: 0,
        ifPassword: "password",
        workshowLoading: false,

        datatypes: ['HEX', 'DEC', 'BIN', 'TEXT'],
        encodetypes: ['ASCII', 'UTF8', 'GBK',],
        config: {
            datatype: 'HEX',
            encodetype: 'GBK',
            data: '',
        },
        logs: [],
        seq: 0,
        mtu: 23,
        maxMtu: 512,
        minMtu: 23,
        interval: null,
        i: 0,
        getDateResults: "",
        readBackDateUnit8Buff: null,
        showDialog: false,
        isRuleTrue: false,
        getDating: false,
        stmp: 1,
        userStapShut: false,

        passW: "",
        wifiname: null,
        rule: [],
    },
    logIx: 0,
    log() {
        console.log.apply(console, arguments);
        let args = [];
        for (let i = 0; i < arguments.length; ++i) {
            args.push(arguments[i]);
        }
        let t = args.join(" ");
        let logs = this.data.logs;
        let lastLog = {
            index: this.logIx++,
            content: t,
        };
        logs.push(lastLog)
        logs.splice(0, logs.length - 50);
        this.setData({ logs, lastLog });
    },
    onLoad: function (options) {
        let thiz = this
        this.getSetFun()
        wx.onBluetoothAdapterStateChange(function (res) {
            thiz.updateBleState(res);
        })
        wx.onBLEConnectionStateChange(function (res) {
            console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
            thiz.updateBleDevice(res.deviceId, { connected: res.connected });
        })
        wx.openBluetoothAdapter({
            success: function (res) {
                console.log(res)
                wx.getBluetoothAdapterState({
                    success: function (res) {
                        thiz.updateBleState(res);
                        thiz.startScanBle(null)
                    }
                })
                wx.onBluetoothDeviceFound(function (res) {
                    console.log('new device list has founded', res);
                    thiz.onBleDevicesFound(res);
                })
            },
            fail:function (err) {
                //这里是，手机的蓝牙关闭状态下，该接口会返回10001，执行fail方法，              
                if(err.errCode==10001){               
                wx.showToast({              
                title:'蓝牙开启失败,请检查手机蓝牙是否已打开',             
                              icon:'none',              
                              duration:2000              
                          })
                }
            }
        });

        try {
            let config = JSON.parse(wx.getStorageSync('config'));
            console.log(config)
            this.setData({ config });
        }
        catch (e) {

        }
        this.log("没有可显示设备，请打开蓝牙点击'搜索'来查找周围的BLE设备!");
    },
    onHide: function () {
        wx.closeBluetoothAdapter({
            success (res) {
              console.log(res)
            }
          })
      },
    onBleDevicesFound(res) {
        let thiz = this;
        let rawdevs = this.data.ble.devices;
        res.devices.forEach(device => {
            if (!device.name && !device.localName) {
              return
            }
          })
        res.devices.map(dev => {
            //此处过滤名字为空的外围设备
            if (!dev.name && !dev.localName) {
                return
            }
            let rawdev = rawdevs.find((a) => {
                return a.deviceId == dev.deviceId;
            });
            if (!rawdev) {
                thiz.log("found", dev.deviceId);
                rawdevs.push(dev);
            }
            else {
                Object.keys(dev).map(f => {
                    rawdev[f] = dev[f];
                });
            }
        });
        this.updateBleState({
            devices: rawdevs
        });
    },
    updateBleState(state) {
        let thiz = this;
        let ble = thiz.data.ble;
        let rawavailable = ble.available;
        let rawdiscovering = ble.discovering;
        Object.keys(state).map(k => {
            ble[k] = state[k];
        });
        thiz.setData({
            ble: ble
        });
        if (ble.available && !rawavailable) {
            this.log("bluetooth enable");
        }
        else if (!ble.available && rawavailable) {
            this.log("bluetooth disable");
        }
        if (ble.discovering && !rawdiscovering) {
            this.log("bluetooth scanning");
        }
        else if (!ble.discovering && rawdiscovering) {
            this.log("bluetooth scan stopped");
        }
    },
    updateBleDevice(deviceId, state) {
        console.log(`updateBleDevice`, deviceId, state)
        let thiz = this;
        let ble = thiz.data.ble;
        let dev = ble.devices.find((a) => {
            return a.deviceId == deviceId;
        });
        if (dev) {
            if (!dev.connected && state.connected) {
                thiz.log("connected", dev.deviceId);
                this.onGetDeviceServices(null, deviceId);
            }
            else if (dev.connected && state.connected === false) {
                thiz.log("disconnected", dev.deviceId);
                thiz.setData({
                    setMtuHasOk : null
                });
            }
            Object.keys(state).map(k => {
                dev[k] = state[k];
            });
            if (this.data.device && this.data.device.deviceId == deviceId) {
                thiz.setData({
                    ble: ble,
                    device: dev
                });
                
                let deviceId = thiz.data.device.deviceId;
                let serviceId = bleParams.UUID_SERVICE;
                thiz.log('getting characteristics...');
                wx.getBLEDeviceCharacteristics({
                    deviceId: deviceId,
                    serviceId: serviceId,
                    success: function (res) {
                        if (res && res.characteristics) {
                            thiz.log('characteristics got, count', res.characteristics.length);
                        }
                        wx.getSystemInfo({
                            success (res) {
                                if (res.platform!='ios') {
                                    setTimeout(()=>{
                                        console.log("res.platform!='ios'")
                                        thiz.setMtu(thiz.data.maxMtu,deviceId)
                                      },50);
                                  }else{
                                    wx.hideLoading()
                                    thiz.setData({
                                        setMtuHasOk : "ok"
                                    });
                                    //可能会出错的地方
                                    setTimeout(()=>{
                                        console.log("res.platform=='ios'")
                                        thiz.getWifiState(null)
                                      },150);
                                    
                                    wx.showToast({  
                                        title: '已建立连接',  
                                        icon: 'success',  
                                        duration: 1000  
                                    }) 
                                  }
                            }
                        })

                    }
                });
            }
            else {
                thiz.setData({
                    ble: ble,
                });
            }
        }
    },
    updateDeviceService(deviceId, serviceId, state) {
        let thiz = this;
        let ble = thiz.data.ble;
        let dev = ble.devices.find((a) => {
            return a.deviceId == deviceId;
        });
        if (dev) {
            let ser = dev.services.find((a) => {
                return a.uuid == serviceId;
            });
            if (ser) {
                Object.keys(state).map(k => {
                    ser[k] = state[k];
                });
                if (this.data.device && this.data.device.deviceId == deviceId) {
                    thiz.setData({
                        ble: ble,
                        device: dev
                    });
                }
                else {
                    thiz.setData({
                        ble: ble,
                    });
                }
            }
        }
    },
    startScanBle(e) {
        let thiz = this;
        thiz.log("stop scanning...");
        wx.openBluetoothAdapter({
            success: function (res) {
                console.log(res)
                wx.getBluetoothAdapterState({
                    success: function (res) {
                        thiz.updateBleState(res);
                    }
                })
                wx.onBluetoothDeviceFound(function (res) {
                    console.log('new device list has founded', res);
                    thiz.onBleDevicesFound(res);
                })
            },
            fail:function (err) {
                //这里是，手机的蓝牙关闭状态下，该接口会返回10001，执行fail方法，              
                if(err.errCode==10001){               
                wx.showToast({              
                title:'蓝牙开启失败,请检查手机蓝牙是否已打开',             
                              icon:'none',              
                              duration:2000              
                          })
                }
            }
        });
        
        wx.stopBluetoothDevicesDiscovery({
            success: function (res) {
                thiz.log("stop", res.errMsg)
            }
        })
        let rawdevs = [];
        if (this.data.device && this.data.device.connected) {
            rawdevs.push(this.data.device);
        }
        this.updateBleState({
            devices: rawdevs,
        });
        thiz.log("start scanning...");
        wx.startBluetoothDevicesDiscovery({
            allowDuplicatesKey: true,
            // services: ['FEE7'],
            success: function (res) {
                thiz.log("start", res.errMsg)
            }
        });

    },
    stopScanBle(e) {
        let thiz = this;
        thiz.log("stop scanning...");
        wx.stopBluetoothDevicesDiscovery({
            success: function (res) {
                thiz.log("stop", res.errMsg)
            }
        })
    },
    clearAll(e) {
        let ble = this.data.ble;
        ble.devices = [];
        wx.hideLoading()
        this.setData({
            device: null,
            char: null,
            lastLog: null,
            logs: [],
            ble: ble,
            setMtuHasOk : null
        });
    },
    onConnectDevice(e, devid) {
        let thiz = this;
        let deviceId = devid ? devid : this.data.device.deviceId;
        let ble = thiz.data.ble;
        let dev = ble.devices.find((a) => {
            return a.deviceId == deviceId;
        });

        if (dev.connected) {
            thiz.log('disconnect', deviceId);
            wx.closeBLEConnection({
                deviceId: deviceId,
            });
        }
        else {
            thiz.log('connecting', deviceId);
            wx.createBLEConnection({
                deviceId: deviceId,
            });
        }

    },
    onGetDeviceServices(e, devid) {
        wx.showLoading({
            title: '建立连接中...',
        });
        setTimeout(() => {
            this.safeCloseHiding()
            if (this.data.setMtuHasOk==null) {
                wx.showToast({  
                    title: '连接失败，请重试',  
                    icon: 'none',
                    image: '../../img/fail.png',
                    duration: 1500  
                })
            }

        }, 20000);
        this.data.working = false
        let thiz = this;
        let deviceId = devid ? devid : this.data.device.deviceId;
        
        if (!devid && !this.data.device.connected) {
            thiz.log("not connected", this.data.char.deviceId);
            return;
        }
        thiz.log('getting services...');
        wx.getBLEDeviceServices({
            deviceId: deviceId,
            success: function (res) {
                console.log('device services:', res.services)
                thiz.log('service got, count', res.services.length);
                thiz.updateBleDevice(deviceId, { services: res.services })
                wx.getSystemInfo({
                    success (res) {
                        if (res.platform!='ios') {
                    
                        }else{
                          wx.hideLoading()
                          thiz.setData({
                              setMtuHasOk : "ok"
                          });
                          setTimeout(()=>{
                              console.log("res.platform=='ios'")
                              thiz.getWifiState(null)
                            },150);
                          
                          wx.showToast({  
                              title: '已建立连接',  
                              icon: 'success',  
                              duration: 1000  
                          }) 
                        }
                    }
                })
            }
        });
    },
    setMtu(mtu,deviceId){
        mtu = parseInt(mtu);
        if (mtu<23) {
            mtu = 23;
        }
        wx.setBLEMTU({
            deviceId,
            mtu,
            success: (res) => {
                console.log('setBLEMTU:success:', res)
                let newMtu = (mtu + this.data.maxMtu)/2
                if (newMtu-mtu<3) {
                    this.data.mtu = mtu
                    wx.hideLoading()
                    this.setData({
                        setMtuHasOk : "ok"
                    });
                    wx.showToast({  
                        title: '设备连接成功',  
                        icon: 'success',  
                        duration: 1500  
                    }) 
                    this.getWifiState(null);
                    return
                }
                this.data.minMtu = mtu
                this.setMtu(newMtu,deviceId)  
            },
            fail:(res)=>{ 
                let newMtu = (mtu + this.data.minMtu)/2
                if (mtu-newMtu<3) {
                    this.data.maxMtu = this.data.minMtu
                    this.setMtu(this.data.minMtu,deviceId)
                    return
                }
                this.data.maxMtu = mtu
                this.setMtu(newMtu,deviceId)  
            },
            complete:(res)=>{ 
              console.error('setBLEMTU:complete:', res)
            }
          })
    },
    onSelectDevice(e) {
        wx.vibrateLong();
        let thiz = this;
        thiz.log("stop scanning...");
        wx.stopBluetoothDevicesDiscovery({
            success: function (res) {
                thiz.log("stop", res.errMsg)
            }
        })
        //先执行断开
        let deviceId = e.target.dataset.deviceid;
        if (this.data.device && this.data.device.deviceId == deviceId && this.data.device.connected) {
            // 断开
            this.onConnectDevice(null, deviceId);
            this.setData({
                device: null,
                char: null,
            });
        }
        else {
            let device = this.data.ble.devices.find(function (d) {
                return d.deviceId == deviceId;
            });
            this.setData({
                device: device
            });
            if (!device.connected) {
                thiz.log("deviceId is :", deviceId)
                this.onConnectDevice(null, deviceId);
            }
        }
    },
    onServiceSelected(e) {
        let thiz = this;
        let deviceId = this.data.device.deviceId;
        let serviceId = e.target.dataset.serviceid;
        thiz.log('getting characteristics...');
        console.log(serviceId)
        wx.getBLEDeviceCharacteristics({
            deviceId: deviceId,
            serviceId: serviceId,
            success: function (res) {
                if (res && res.characteristics) {
                    thiz.log('characteristics got, count', res.characteristics.length);
                    thiz.updateDeviceService(deviceId, serviceId, { characteristics: res.characteristics });
                }
            }
        });
    },
    onCharacteristicSelected(e) {
        let that = this;
        let deviceId = this.data.device.deviceId;
        let serviceId = e.target.dataset.serviceid;
        console.log(serviceId)

        let charId = e.target.dataset.charid;
        console.log(":charId")
        console.log(charId)
        let ble = this.data.ble;
        let dev = this.data.device;
        let ser = dev && dev.services.find((a) => {
            return a.uuid == serviceId;
        });
        let char = ser && ser.characteristics.find((a) => {
            return a.uuid == charId;
        });
        if (this.data.char && this.data.char.uuid == charId) {
            this.setData({
                char: null
            });
        }
        else {
            char.serviceId = serviceId;
            this.setData({
                char: char
            });
        }
        this.log("onCharacteristicSelected");
        wx.notifyBLECharacteristicValueChange({
            state: true, // 启用 notify 功能
            // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
            deviceId,
            // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
            serviceId,
            // 这里的 characteristicId 需要在 getBLEDeviceCharacteristics 接口中获取
            charId,
            success (res) {
                console.log('notifyBLECharacteristicValueChange success', res.errMsg)
            }
            })
    },
    onDataTypeChange(e) {
        let config = this.data.config;
        config.datatype = this.data.datatypes[e.detail.value];
        this.setData({
            config
        })
    },
    onEncodeTypeChange(e) {
        let config = this.data.config;
        config.encodetype = this.data.encodetypes[e.detail.value];
        this.setData({
            config
        })
    },
    onDataChange(e) {
        this.data.config.data = e.detail.value;
    },
    onEmpty(e) {
    },
    getVersion(e){
        wx.vibrateShort();
        let thiz = this;
        this.packingBle(bleParams.SUBTYPE_GET_VERSION,function(res){
            var fdStart = res.indexOf("v");
            if(fdStart == 0){

            }else if(fdStart == -1){
                getVersion()
                return
            }
            thiz.setData({ six22version: res});
            wx.showToast({  
                title: res,  
                icon: 'success',  
                duration: 500  
            }) 
       })
    },

    getWifiState(e){
        let thiz = this
        this.log(this.data.working)
        wx.vibrateShort();
        this.log("!")

        this.packingBle(bleParams.SUBTYPE_GET_WIFI_STATUS,function(res){
                let wifiStatusModel
                try {
                    wifiStatusModel  = JSON.parse(res);
                　　} catch(error) {
                    wx.hideLoading()
                    wx.showToast({  
                        title: '请稍后重试',  
                        icon: 'none',
                        image: '../../img/fail.png',
                        duration: 1500  
                    })
                        return
                　　} finally {
                        
                }
                console.log(wifiStatusModel)
                thiz.log(wifiStatusModel)
                console.log(wifiStatusModel.state)

                if (wifiStatusModel.state==bleParams.WIFI_STATE_ENUM_LIST.WIFI_STATE_IDLE) {
                    try {
                        wx.hideLoading()
                    } catch (error) {
                        
                    }
                    wx.showToast({  
                        title: 'wifi未连接',  
                        icon: 'none',
                        image: '../../img/fail.png',
                        duration: 1500  
                    }) 
                    thiz.setData({
                        wifiState: "断开连接",
                    })
                } else if(wifiStatusModel.state==bleParams.WIFI_STATE_ENUM_LIST.WIFI_STATE_CONNECTING) {
                    wx.showToast({
                        title: 'wifi努力连接中...',
                    })
                    thiz.setData({
                        wifiState: "正在努力连接中",
                    })
                    setTimeout(() => {
                        thiz.getWifiState(null)
                    }, 800);
                    
                }else if(wifiStatusModel.state==bleParams.WIFI_STATE_ENUM_LIST.WIFI_STATE_CONNECTED_IP_GETTING) {
                  wx.showLoading({
                    title: '已连接，正在获取ip地址中...',
                });
                  thiz.setData({
                      wifiState: "获取ip地址中",
                  })
                  thiz.data.working = true
                  setTimeout(() => {
                    thiz.data.working = false
                    thiz.getWifiState(null)
                  }, 600);
                  
                }else if(wifiStatusModel.state==bleParams.WIFI_STATE_ENUM_LIST.WIFI_STATE_CONNECTED_IP_GOT){
                    try {
                        wx.hideLoading()
                    } catch (error) {
                        
                    }
                    wx.showToast({  
                        title: 'wifi连接成功',  
                        icon: 'success',  
                        duration: 800  
                    }) 
                    thiz.setData({
                        wifiState: "连接成功",
                    })
                    if (wifiStatusModel.ssid) {
                        wx.showActionSheet({
                            itemList: ['ip:'+wifiStatusModel.ip, 'gw:'+wifiStatusModel.gw
                            , 'mask:'+wifiStatusModel.mask, 'ssid:'+wifiStatusModel.ssid, 'bssid:'+wifiStatusModel.bssid],
                            success: function (res) {
                              console.log(res);
                            }
                          })
                    }else{
                        wx.showActionSheet({
                            itemList: ['ip:'+wifiStatusModel.ip, 'gw:'+wifiStatusModel.gw
                            , 'mask:'+wifiStatusModel.mask],
                            success: function (res) {
                              console.log(res);
                            }
                          })
                    }
                   
                }else if (wifiStatusModel.state==bleParams.WIFI_STATE_ENUM_LIST.WIFI_STATE_PSK_ERROR){
                    try {
                        wx.hideLoading()
                    } catch (error) {
                        
                    }
                    wx.showToast({  
                        title: 'wifi连接密码错误',  
                        icon: 'none',
                        image: '../../img/fail.png',
                        duration: 1000  
                    }) 
                    thiz.setData({
                        wifiState: "密码错误",
                    })
                }else if (wifiStatusModel.state==bleParams.WIFI_STATE_ENUM_LIST.WIFI_STATE_NO_AP_FOUND){
                    try {
                        wx.hideLoading()
                    } catch (error) {
                        
                    }
                    wx.showToast({
                        title: '未找到该ap',  
                        icon: 'none',
                        image: '../../img/fail.png',
                        duration: 1000  
                    }) 
                    thiz.setData({
                        wifiState: "未找到ap",
                    })
                }else {
                    wx.hideLoading()
                    thiz.setData({
                        wifiState: "其他原因",
                    })
                }
        })
    },

    safeCloseHiding(){
        try {
            wx.hideLoading()
        } catch (error) {
            
        }
    },
    stopSta(e){
        if (this.data.working) {
            return
        }
        wx.vibrateShort();
        let thiz = this
        wx.showLoading({
            title: '发送断开指令中',
        });
        this.packingBleNoDate(bleParams.SUBTYPE_DISCONNECT_WIFI,function(res){
            wx.showLoading({
                title: '发送指令成功',
            });
            thiz.data.working = true 
            setTimeout(() => {
                thiz.data.working = false
                wx.showLoading({
                    title: '查看当前状态',
                });
                thiz.log("查看当前状态")
                thiz.getWifiState(null)
            }, 600);
        })        
    },
    
    dmsByBle(e){
        if (this.data.working) {
            return
        }
        this.data.wifiname = ""
        this.data.passW = ""
        wx.vibrateLong();
        let thiz = this
        this.data.userStapShut = false
        this.data.rule = [];
        let rule = this.data.rule;
        this.setData({
            rule,
            isRuleTrue: false,
            passW:null
        })
        wx.showLoading({
            title: '发送指令中',
        });
        this.packingBleNoDate(bleParams.SUBTYPE_GET_WIFI_LIST,function(res){
            wx.showLoading({
                title: '发送指令成功',
            });
            thiz.data.working = true
            setTimeout(function(){
                thiz.safeCloseHiding()
                wx.showLoading({
                    title: '等待设备扫描wifi',
                });
             },1000)
            setTimeout(() => {
                thiz.log("3秒后")
                thiz.data.working = false
                thiz.data.getDating = true;
                thiz.getWifiListDate()
            }, 3000);
        })
    },

    getWifiListDate(){
        if (!this.data.workshowLoading) {
             wx.showLoading({
                title: '接收数据中',
            });
            this.data.workshowLoading = true
        }
        let thiz = this
        thiz.packingBle(bleParams.SUBTYPE_GET_WIFI_EVERY_LIST,function(res){
            thiz.log("接收数据中...")
            if (!thiz.data.userStapShut) {
                thiz.showRule(res);
                thiz.getWifiListDate()
            }
        })
    },
    send2password(e){
        let that = this;
        // if (this.data.working) {
        //     if (this.data.wifiname == null||this.data.wifiname == "") {
        //         wx.showToast({
        //             title: '请耐心等待wifi接收',  
        //             icon: 'none',  
        //             duration: 600  
        //         })
        //         return
        //     }
        // }
        if (this.data.wifiname == null||this.data.wifiname == "") {
            wx.showToast({  
                title: '请选择一项wifi',  
                icon: 'none',
                image: '../../img/fail.png',
                duration: 1000  
            })
            return
        }
        if (this.data.working) {
            this.data.userStapShut = true
            this.setData({
                isRuleTrue: false
            })
            wx.showLoading({
                title: '打包数据中',
            });
            setTimeout(() => {
                this.send2passwordInterface()
            }, 500);
            return
        }
        this.send2passwordInterface()
    },
    send2passwordInterface(){
        let that = this;
        console.log('开始发送密码,密码如下');
        this.log("writing send..."+that.data.wifiname+":"+that.data.passW);
        console.log(that.data.wifiname);
        console.log(that.data.passW);
        wx.showLoading({
            title: '发送密码中',
        });
        this.setData({
            isRuleTrue: false
        });
        wx.vibrateShort();
        //bug 修改为配网前先断开连接
        this.packingBleNoDate(bleParams.SUBTYPE_DISCONNECT_WIFI,function(res){
            that.data.stmp=1;
            that.send2passwordImpl(null);
        }) 
    },
    send2passwordImpl(bytes){
        if(bytes=="datanull"){
            this.safeCloseHiding()
            wx.showToast({
                title: '传输失败，数据为空',
                icon: 'none',
                image: '../../img/fail.png',
                duration: 1500
            })
            return
        }else if(bytes=="readErrorTimeFive"){
            this.data.working = false
            this.safeCloseHiding()
            wx.showToast({
                title: '数据出错，读取5次失败',
                icon: 'none',
                image: '../../img/fail.png',
                duration: 1500
            })
            return
        }
        let thiz = this
        switch(this.data.stmp){
        case 1: 
            let type = bleParams.SUBTYPE_STA_WIFI_SSID;
            this.data.stmp++;
            this.data.seq++;
            bleUtiles.sen8kDate(this.data.device.deviceId,this.data.mtu,this.data.seq,this.data.wifiname,type,this.send2passwordImpl);
            break;
        case 2: 
            type = bleParams.SUBTYPE_STA_WIFI_PASSWORD;
            this.data.stmp++;
            this.data.seq++;
            bleUtiles.sen8kDate(this.data.device.deviceId,this.data.mtu,this.data.seq,this.data.passW,type,this.send2passwordImpl);
            break;
        case 3: 
            this.packingBleNoDate(bleParams.SUBTYPE_CONNECT_WIFI,function(res){
                wx.showLoading({
                    title: '正在连接wifi',
                });
                setTimeout(() => {
                    wx.showLoading({
                        title: '正在查询连接结果',
                    });
                    thiz.log("正在查询连接结果")
                    thiz.getWifiState(null)
                }, 600);
            }) 
            break;
        }   
    },

    packingBle(type,callback){
        console.log(this.data.working)
        if (this.data.working) {
            return
        }
        new Promise((resolve,reject)=>{
            this.data.working = true
            this.log("3秒后开始了")
            bleUtiles.getVersion(this.data.device.deviceId,this.data.seq,type,resolve,reject)
          }).then(res=>{
            this.log("4秒后")
            this.data.working = false
                this.data.seq++
                console.log(res)
                callback(res)
          },err=>{
            this.data.working = false
            console.log(err)
            if (err=="date2Stringis0") {
                this.data.workshowLoading = false
                wx.hideLoading()
                wx.showToast({
                    title: 'wifi已全部接收',  
                    icon: 'success',  
                    duration: 1000  
                }) 
            }else if(err=="acd!=0") {
                this.data.acdNotEqualZore++
                if (this.data.acdNotEqualZore>5) {
                    wx.showToast({
                        title: '解析失败，请稍后重试',
                        icon: 'none',
                        image: '../../img/fail.png',
                        duration: 1500
                    })
                    this.data.acdNotEqualZore = 0
                }else{
                    //接受的adc不等于0
                    setTimeout(() => {
                        this.packingBle(type,callback);
                    }, 100);
                }
            }else{
                // this.packingBle(type,callback);
                wx.hideLoading()
                wx.showToast({
                    title: '获取失败',
                    icon: 'none',
                    image: '../../img/fail.png',
                    duration: 1500
                })
            }
            
          })
    },
    packingBleNoDate(type,callback){
        if (this.data.working) {
            return
        }
        this.data.working = true
        new Promise((resolve,reject)=>{
            bleUtiles.sendIfSucc(this.data.device.deviceId,this.data.seq,type,resolve,reject)
          }).then(
              (res) => {
                this.data.working = false
                this.data.seq++
                console.log(res)
                callback(res)
              },
              (err) => {
                this.data.working = false
                wx.hideLoading()
                wx.showToast({
                    title: '获取失败',
                    icon: 'none',
                    image: '../../img/fail.png',
                    duration: 1500
                })
            }
        )
    },

    sliceArr(array, size) {
        var result = [];
        for (var x = 0; x < Math.ceil(array.length / size); x++) {
                var start = x * size;
                    var end = start + size;
                    result.push(array.slice(start, end));
        }
     return result;
    },
    writeBLECharacteristicValue() {
        // 向蓝牙设备发送一个0x00的16进制数据
        let buffer = new ArrayBuffer(1)
        let dataView = new DataView(buffer)
        dataView.setUint8(0, Math.random() * 255 | 0)
        wx.writeBLECharacteristicValue({
          deviceId: this._deviceId,
          serviceId: this._deviceId,
          characteristicId: this._characteristicId,
          value: buffer,
        })
    },

    showRule(res) {
        // if (this.data.rule.length==0) {
        //     setTimeout(function(){
        //         wx.hideLoading()
        //      },2000)
        // } 
        var wifiModel
        try {
            wifiModel  = JSON.parse(res);
        　　} catch(error) {
                console.log("发生一条错误的json解析")
                return
        　　} finally {
                
        }
        if (wifiModel.ssid==null||wifiModel.ssid.byteLength==0) {
            console.log("名字为空")
        } else {
            wifiModel.isChecked = false;
            this.data.rule.push(wifiModel);
            let rule =  this.data.rule;
            this.setData({
                rule,
                isRuleTrue: true
            })
        }
        
    },
    hideRule(e){
        this.data.userStapShut = true
        wx.hideLoading({
          complete: (res) => {},
        })
        this.setData({
            isRuleTrue: false
        })
    },
    seepass(e){
        console.log(this.data.ifPassword)
        if (this.data.ifPassword==false) {
            this.data.ifPassword=="true"
            this.setData({
                ifPassword:true
            })
        } else {
            this.data.ifPassword==false
            this.setData({
                ifPassword:false
            })
        }
    },
    checkboxChange(e) {
        console.log('checkbox发生change事件，携带value值为：', e.detail.value)
        const values = e.detail.value
        this.data.wifiname = values;
    },
    passWdInput:function(e){
        this.setData({
          passW:e.detail.value
        })
    },

    ab2hex(buffer) {
        var hexArr = Array.prototype.map.call(
        new Uint8Array(buffer),
        function (bit) {
            return ('00' + bit.toString(16)).slice(-2)
        })
        return hexArr.join('');
    },

    sleep(millis){
        var njf1 = njen(this,arguments,"millis");
        nj:while(1) {
        try{switch(njf1.cp) { 
        case 0:njf1._notifier=NjsRuntime.createNotifier();
        setTimeout(njf1._notifier,njf1._millis);
        njf1.cp = 1;
        njf1._notifier.wait(njf1);
        return;
        case 1:break nj;
        }} catch(ex) { 
        if(!njf1.except(ex,1)) 
        return; 
        }} 
        njf1.pf();
    },
    start(){//启动计时器函数
        if(this.data.interval!=null){//判断计时器是否为空
            clearInterval(this.data.interval);
            this.data.interval=null;
        }
        this.data.interval = setInterval(this.overs,1000);//启动计时器，调用overs函数，
    },
    overs(){
        var start = (new Date()).getTime();
        while((new Date()).getTime() - start < 20) {
            continue;
        };
    },
    stop(){
        clearInterval(this.data.interval);
        this.data.interval = null;
    },
    // 没有获取到位置，不停获取
    getSetFun() {
        let thiz = this
        wx.getLocation({
            // type: 'gcj02',//默认wgs84
            success: function (location) {
            console.log(location);
            },
            fail: function () {
            wx.getSetting({
                success: function (res) {
                if (!res.authSetting['scope.userLocation']) {
                    wx.showModal({
                    title: '提示',
                    content: '请允许获取您的定位',
                    confirmText: '授权',
                    success: function (res) {
                        if (res.confirm) {
                        } else {
                        console.log('get location fail');
                        }
                    }
                    })
                }else {
                    //用户已授权，但是获取地理位置失败，提示用户去系统设置中打开定位
                    wx.showModal({
                    title: '提示',
                    content: '请在系统设置中打开定位服务,并授予微信app权限',
                    confirmText: '确定',
                    success: function (res) {
                    }
                    })
                }
                }
            })
            }
        })
    },
})