#!/usr/bin/env node
/**
 * @author Created by felix on 18-11-6.
 * @email   307253927@qq.com
 */
'use strict';

const fs       = require("fs")
const path     = require("path")
const WStream  = require("./wav-stream")
const dataPath = "/home/felix/Downloads/csvResult/data/data"

let count = 0

const suf = /\.(wav|pcm)$/
const wav = /\.wav$/

function readFile(dPath, rate = 16000, bit = 16, channel = 1) {
  const files = fs.readdirSync(dPath)
  files.forEach(f => {
    const p    = path.join(dPath, f)
    const stat = fs.statSync(p)
    if (stat.isDirectory()) {
      readFile(p)
    } else if (stat.isFile()) {
      const name = f.toLowerCase()
      if (suf.test(name)) {
        const fPath = path.join(dPath, name.replace(wav, '_org.pcm'))
        fs.renameSync(p, fPath)
        fs.createReadStream(fPath).pipe(new WStream({
          bufSize     : stat.size,
          sampleRate  : rate,
          sampleBits  : bit,
          channelCount: channel
        })).pipe(fs.createWriteStream(p))
          .on("close", () => {
            fs.unlinkSync(fPath)
          })
        ++count
      }
    }
  })
}

const args = process.argv.slice(2)

if (!args.length) {
  console.log('请输入参数 如: -d="文件目录地址" -r=16000 -b=16 -c=1')
  console.log('\t-d 文件目录地址 必须')
  console.log('\t-r 采样率 默认 16000 可不传')
  console.log('\t-b 比特率 默认 16 可不传')
  console.log('\t-c 声道数 默认 1  可不传')
} else {
  const arg = {}
  const rex = /^-/
  args.forEach(a => {
    const [name, value]        = a.split('=')
    arg[name.replace(rex, '')] = value
  })
  if (!arg.d) {
    console.log("必须传入参数 -d 文件目录地址")
  } else if (!fs.existsSync(arg.d)) {
    console.log("文件目录地址不存在")
  } else {
    const stat = fs.statSync(arg.d)
    if (stat.isDirectory()) {
      readFile(arg.d, arg.r, arg.b, arg.c)
      console.log("已转码:", count)
    } else {
      console.log("传入的目录地址不是一个目录")
    }
  }
}

