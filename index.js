#!/usr/bin/env node
/**
 * @author Created by felix on 18-11-6.
 * @email   307253927@qq.com
 */
'use strict';

const fs      = require("fs")
const path    = require("path")
const WStream = require("./wav-stream")
// const dataPath = "/home/felix/Downloads/csvResult/data/data"

let count = 0

const suf  = /\.(wav|pcm)$/
const wav  = /\.wav$/
const prex = /\\|\//g

async function readFile(dPath, audio, rate = 16000, bit = 16, channel = 1) {
  if (+rate >= 8000 || +bit >= 2 || +channel >= 1) {
    const files = fs.readdirSync(dPath)
    for (let i = 0, len = files.length; i < len; i++) {
      let f      = files[i]
      const p    = path.join(dPath, f)
      const stat = fs.statSync(p)
      if (stat.isDirectory()) {
        await readFile(p, rate, bit, channel)
      } else if (stat.isFile()) {
        // const name = f.toLowerCase()
        // if (suf.test(name)) {
        if (f === audio) {
          const fPath = path.join(dPath, `${f}.wav`)
          // fs.renameSync(p, fPath)
          await new Promise((resolve, reject) => {
            fs.createReadStream(p).pipe(new WStream({
              bufSize     : stat.size,
              sampleRate  : rate,
              sampleBits  : bit,
              channelCount: channel
            })).pipe(fs.createWriteStream(fPath))
              .on("close", () => {
                // fs.unlinkSync(fPath)
                resolve()
              })
              .on('error', (err) => {
                console.log(err)
                reject()
              })
          })
          ++count
        }
      }
    }
    console.log("已转码音频:", count)
  } else {
    console.log("参数 -r -b -c 错误")
  }
}

/**
 * 提取音频
 * @param rootPath
 */
async function extractAudio(rootPath) {
  const audioPath = path.join(rootPath, 'extract_audio')
  if (fs.existsSync(audioPath)) {
    rmdir(audioPath)
  }
  fs.mkdirSync(audioPath)
  await extract(rootPath, rootPath, audioPath)
  console.log("已提取音频:", count)
}

async function extract(dPath, rootPath, audioPath) {
  const files = fs.readdirSync(dPath)
  for (let i = 0, len = files.length; i < len; i++) {
    let f = files[i]
    if (f === "extract_audio") {
      continue;
    }
    const p    = path.join(dPath, f)
    const stat = fs.statSync(p)
    if (stat.isDirectory()) {
      await extract(p, rootPath, audioPath)
    } else if (stat.isFile()) {
      const name = f.toLowerCase()
      if (suf.test(name)) {
        const name = p.replace(rootPath, "").replace(prex, "_")
        await new Promise((resolve, reject) => {
          fs.createReadStream(p).pipe(fs.createWriteStream(path.join(audioPath, name)))
            .on('close', () => {
              resolve()
            })
            .on('error', (err) => {
              console.error(err)
              reject()
            })
        })
        console.log('已提取--->', name)
        ++count
      }
    }
  }
}

function rmdir(pth) {
  if (fs.existsSync(pth)) {
    const files = fs.readdirSync(pth)
    for (let i = 0, len = files.length; i < len; i++) {
      const p    = path.join(pth, files[i])
      const stat = fs.statSync(p)
      if (stat.isDirectory()) {
        rmdir(p)
      } else {
        fs.unlinkSync(p)
      }
    }
    fs.rmdirSync(pth)
  }
}

const args = process.argv.slice(2)

if (!args.length) {
  console.log('请输入参数 如: -d="文件目录地址" -r=16000 -b=16 -c=1')
  console.log('\t-d 文件目录地址 必须')
  console.log('\t-n 操作文件名 [不可与 -ex 参数一起使用]')
  console.log('\t-r 采样率 默认 16000 可不传')
  console.log('\t-b 比特率 默认 16 可不传')
  console.log('\t-c 声道数 默认 1  可不传')
  console.log('\t-ex 提取音频到 -d 指定的目录/extract_audio下')
} else {
  const arg = {}
  const rex = /^-/
  args.forEach(a => {
    const [name, value]        = a.split('=')
    arg[name.replace(rex, '')] = value || true
  })
  if (!arg.d) {
    console.log("必须传入参数 -d 文件目录地址")
  } else if (!fs.existsSync(arg.d)) {
    console.log("文件目录地址不存在")
  } else {
    const stat = fs.statSync(arg.d)
    if (stat.isDirectory()) {
      console.log("指定目录:", arg.d)
      if (!arg.ex) {
        if(!arg.n){
          console.log("参数 -n 音频文件名 是必须的")
        } else {
          console.log("参数:", "采样率:", arg.r || 16000, "比特率:", arg.b || 16, "声道:", arg.c || 1)
          readFile(arg.d, arg.n, arg.r, arg.b, arg.c)
        }
      } else {
        extractAudio(arg.d)
      }
    } else {
      console.log("传入的目录地址不是一个目录")
    }
  }
}

