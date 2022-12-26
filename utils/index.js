const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto-js');


function  randStr(num = 8) { //获取随机字符
  function randomString(length, chars) {
    let result = '';
    for (let i = length; i > 0; --i)
      result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }
  return randomString(
    num,
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  );
}

function getIp(){
  let netDict = os.networkInterfaces();
  for (const devName in netDict) {
    let netList = netDict[devName];
    for (var i = 0; i < netList.length; i++) {
        let { address, family, internal } = netList[i];
        if (family === 'IPv4' && address !== '127.0.0.1' && !internal) {
            return address;
        }
    }
  }
}
function getMqttConf (){
  const mqttKeysFile = path.join(__dirname, '../mqtt_key/conf.json');
  let mqttConf = fs.readJSONSync(mqttKeysFile);
  const {PRODUCT_ID,DEVICE_NAME,SDK_APPID,DEVICE_KEY}=mqttConf;
  const CONN_ID = randStr(5);
  const EXPIRY = Math.round(new Date().getTime() / 1000) + 3600 * 24;
  //开始按照腾讯云的文档加密参数，https://cloud.tencent.com/document/product/634/32546
  mqttConf.username = `${PRODUCT_ID}${DEVICE_NAME};${SDK_APPID};${CONN_ID};${EXPIRY}`;
  const rawKey = crypto.enc.Base64.parse(DEVICE_KEY); // 对设备密钥进行base64解码
  const token = crypto.HmacSHA256(mqttConf.username, rawKey);
  mqttConf.password = token.toString(crypto.enc.Hex) + ';hmacsha256';
  mqttConf.clientId = `${PRODUCT_ID}${DEVICE_NAME}`;

  return mqttConf;
}

module.exports ={
  randStr,
  getIp,
  getMqttConf,
}