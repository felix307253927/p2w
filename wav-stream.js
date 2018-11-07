/**
 * @author:  felix
 * @email:  307253927@qq.com
 * @date:  2018-07-18 14:53:04
 * @last Modified by:   felix
 * @last Modified time: 2018-07-18 14:53:04
 */
'use strict';

const {Transform} = require('stream')

class WavStream extends Transform {
  constructor(options) {
    super(options)
    this.count        = 0
    this.sampleRate   = options.sampleRate || 44100
    this.sampleBits   = options.sampleBits || 16
    this.channelCount = options.channelCount || 1
    this.bufSize      = options.bufSize || 0
  }
  
  _transform(chunk, encodintg, next) {
    if (!this.count) {
      this.writeWavHeader(chunk, this.bufSize, this.sampleRate, this.sampleBits, this.channelCount)
    }
    this.count++
    this.push(chunk)
    next()
  }
  
  writeString(buf, offset, str) {
    for (let i = 0; i < str.length; i++) {
      buf.writeInt8(str.charCodeAt(i), offset + i);
    }
  }
  
  writeWavHeader(buf, dataLength = 0, sampleRate = 44100, sampleBits = 16, channelCount = 1) {
    let offset = 0;
    /* 资源交换文件标识符 */
    this.writeString(buf, offset, 'RIFF');
    offset += 4;
    /* 下个地址开始到文件尾总字节数,即文件大小-8 */
    buf.writeInt32LE(36 + dataLength, offset /*32这里地方栗子中的值错了,但是不知道为什么依然可以运行成功*/);
    offset += 4;
    /* WAV文件标志 */
    this.writeString(buf, offset, 'WAVE');
    offset += 4;
    /* 波形格式标志 */
    this.writeString(buf, offset, 'fmt ');
    offset += 4;
    /* 过滤字节,一般为 0x10 = 16 */
    buf.writeInt32LE(16, offset);
    offset += 4;
    /* 格式类别 (PCM形式采样数据) */
    buf.writeInt16LE(1, offset);
    offset += 2;
    /* 通道数 */
    buf.writeInt16LE(channelCount, offset);
    offset += 2;
    /* 采样率,每秒样本数,表示每个通道的播放速度 */
    buf.writeInt32LE(sampleRate, offset);
    offset += 4;
    /* 波形数据传输率 (每秒平均字节数) 通道数×每秒数据位数×每样本数据位/8 */
    buf.writeInt32LE(sampleRate * channelCount * (sampleBits / 8), offset);
    offset += 4;
    /* 快数据调整数 采样一次占用字节数 通道数×每样本的数据位数/8 */
    buf.writeInt16LE(channelCount * (sampleBits / 8), offset);
    offset += 2;
    /* 每样本数据位数 */
    buf.writeInt16LE(sampleBits, offset);
    offset += 2;
    /* 数据标识符 */
    this.writeString(buf, offset, 'data');
    offset += 4;
    /* 采样数据总数,即数据总大小-44 */
    buf.writeInt32LE(dataLength, offset);
  }
}

module.exports = WavStream