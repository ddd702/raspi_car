const Utils = require('./utils');
const mqtt = require('mqtt');
const { exec } = require('child_process');
// const raspi = require('raspi');
const Gpio = require('pigpio').Gpio;

let isConnected = false; //是否连接mqtt
const {PRODUCT_ID,DEVICE_NAME,MQTT_URL,clientId,MQTT_PORT,username,password} = Utils.getMqttConf()
const mqttOpt = {
  keepalive: 60,
  clientId,
  port:MQTT_PORT,
  username,
  password
};
const mqttClient = mqtt.connect(MQTT_URL, mqttOpt);

const led = new Gpio(16, {mode:Gpio.OUTPUT});//led用16接口

mqttClient.on('connect', () => {
  console.warn('mqtt 已连接');
  console.warn('led',led)
  isConnected=true;
  exec('play /home/ddd/Desktop/smb/ok.mp3', (error, stdout) => {
    if (error) {
      console.error('error:', error.message);
      return;
    }
    console.log('has paly video: ' + stdout);
  })
  mqttClient.subscribe(
    `${PRODUCT_ID}/${DEVICE_NAME}/control`,
    { qos: 0 },
    (error, granted) => {
      if (error) {
        console.log(error);
      } else {
        console.log(`${granted[0].topic} was subscribed`);
      }
    }
  );
});
mqttClient.on('message', function (topic, message) {
  //小车控制端发来的消息
  
  const msgObj = JSON.parse(message.toString());
  console.log(topic, msgObj);
  const op = msgObj.op||'';
  if(op ==='ready'){//控制端发送的指令
    sendCli(`ip:${Utils.getIp()}`)
  }
  if(op ==='sound'){//喇叭
    exec('play /home/ddd/Desktop/smb/car_laba.mp3', (error, stdout) => {
      if (error) {
        console.error('error:', error.message);
        return;
      }
      console.log('stdout: ' + stdout);
    })
  }
  if (/^light/.test(op)) {
    const sign = Number(op.split(':')[1]);
    led.digitalWrite(sign)
    console.log('led is ',sign);
  }
});
mqttClient.on('close', () => {
  isConnected = false;
  console.log('mqtt 已断开');
});

function sendCli(msg) {//发送事件
  if (isConnected) {
    if (!!!msg.trim()) {
      return;
    }
    mqttClient.publish(
      `${PRODUCT_ID}/${DEVICE_NAME}/event`,
      `{ "op": "${msg}" }`,
      { qos: 0 },
      (error) => {
        if (error) {
          console.warn('指令发送失败:' + error.message);
        } else {
          // ElMessage.success('指令已发送');
          //addLog(`发送ok:${msg}`);
          console.log(`was published`);
        }
      }
    );
  } else {
    console.warn('请等待连接设备');
  }
}
console.warn('app start:',Utils.getIp(),Utils.getMqttConf());