const PluginError = require('plugin-error');
const through = require('through2');
const fs = require('fs')
const rp = require('request-promise');
const parser = require('@babel/parser').parse
const traverse = require('@babel/traverse').default
const pluginName = 'gulp-dynamic-import-css'
const path = require('path')
let loadedCssFile = []
module.exports = opt => through.obj(function (file, enc, cb) {
  if (file.isNull()) {
    cb();
    return
   }
   const include = opt.include
   const generatorCssPath = opt.generatorCssPath
   let cssFile = []
   if (!generatorCssPath || typeof generatorCssPath !== 'function') { // 必须是函数
     cb(new PluginError(`${pluginName}, generatorCssPath should be a function`));
     return
   }
   // 解析文件内的依赖
   const content = file.contents.toString()
   // 获得 AST
   const ast = parser(content, {
     sourceType: 'module',
     plugins: ['jsx']
   })

   // 遍历 AST 并获取依赖
   traverse(ast, {
      enter (ele) {
        if (
          ele.node.type === 'ImportDeclaration' // 判断其中的 import 模块
        ) {
          const _path = ele.node.source.value
          let relativePath = ''
          // 相对路径
          if (_path.includes('.')) {
            relativePath = path.join(path.dirname(file.relative), _path)
          } else { // node_modules 引入
            relativePath = `node_modules/${_path}`
          }
          
          // 根据暴露的规则，以及模块的相对路径，判断是否有对应的 CSS 资源文件需要加载
          if (generatorCssPath(relativePath) && (!include || (include && include.test(relativePath))) && !loadedCssFile.includes(relativePath)) {
            cssFile.push(generatorCssPath(relativePath)) // 加入加载队列
            loadedCssFile.push(relativePath) // 设为已加载完成，防止重复加载
          }
        }
      }
    })
    if (!cssFile.length) {
      return cb()
    }
    const promises = cssFile.map((link) => {
      return loadCssFile(link)   
    })
    Promise.all(promises)
      .then((reses) => {
        file.contents = Buffer.concat(reses)
        cb(null, file)  
      })
      .catch(error => {
        cb(new PluginError(`${pluginName}', ${error}`))  
      })
    
    // 加载 CSS 资源内容，支持本地和远程资源
    function loadCssFile (filePath) {
      return new Promise((resolve, reject) => {
        if (/^http[s]?:/.test(filePath)) { // 加载远程资源
          rp(filePath)
          .catch((e) => {
              reject(new PluginError(`${pluginName}', 'fetch css url: ${filePath} fail`, e));
          })
          .then((res) => {
            resolve(Buffer.from(res))
          })
        } else { // 加载本地资源
          fs.readFile(filePath, (err, data) => {
            if (err) reject(new PluginError(`${pluginName}', 'fetch css file: ${filePath} fail`, err));
            resolve(data)
          })
        }
      })  
    }
});