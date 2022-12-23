const Utils = require('./utils');
const mqtt = require('mqtt');
// const raspi = require('raspi');
// const gpio = require('raspi-gpio');

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
mqttClient.on('connect', () => {
  console.warn('mqtt 已连接');
  isConnected=true;
  sendCli(`from ${Utils.getIp()}`)
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
  //要小车发回信息才能操作
  // message is Buffer
  console.log(topic, message.toString());
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