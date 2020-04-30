let Fs = require('fs');
let Path = require('path');

module.exports = {

  templateUrl: 'packages://ccc-sf-ac-generator/res/template.anim', // 模板路径
  templateString: '', // 模板字符串
  importUuids: [], // 当前导入的图片资源 uuid

  load() { },

  unload() { },

  messages: {

    // 打开面板
    'open-panel'() {
      Editor.log('[SPACG] 图片动画生成器');
      Editor.Panel.open('ccc-sf-ac-generator');
    },

    // 导入目标路径的图片
    'import-path'(event, config) {
      Editor.log('[SPACG] 导入目标路径图片...');
      this.importUuids = [];
      let path = Editor.url('db://assets/' + config.inputPath, 'utf8');
      if (Fs.existsSync(path)) {
        this.importUuids = this.getUuidsViaPath(path, config.prefix);
        Editor.log('[SPACG] 导入共 ' + this.importUuids.length + ' 张图片');
      } else {
        Editor.warn('[SPACG] 指定目录不存在！');
      }
      event.reply(null, this.importUuids.length);
    },

    // 导入当前选中的图片
    'import-selection'(event) {
      Editor.log('[SPACG] 导入当前选中图片...');
      this.importUuids = [];
      let uuids = Editor.Selection.curSelection('asset');
      if (uuids.length > 0) {
        this.importUuids = this.getUuidsViaCurSelection(uuids);
        Editor.log('[SPACG] 共导入 ' + this.importUuids.length + ' 张图片');
      } else {
        Editor.warn('[SPACG] 当前未选中图片！');
      }
      event.reply(null, this.importUuids.length);
    },

    // 清除当前导入的图片
    'clear-import'(event) {
      Editor.log('[SPACG] 已清空导入！');
      this.importUuids = [];
      event.reply(null, this.importUuids.length);
    },

    // 生成
    async 'generate'(event, config) {
      if (this.importUuids.length > 0) await this.generateAnimFile(this.importUuids, config);
      else Editor.warn('[SPACG] 请先导入图片！');
      this.importUuids = [];
      event.reply(null, true);
    }

  },

  // 获取目标路径的图片资源 uuid
  getUuidsViaPath(dirPath, prefix) {
    let uuids = [];
    let list = '[SPACG] 图片列表 >>>';
    let fileNames = Fs.readdirSync(dirPath);
    for (let fileName of fileNames) {
      if (fileName.includes(prefix) && fileName.includes('.meta')) {
        let fullPath = Path.join(dirPath, fileName);
        let meta = JSON.parse(Fs.readFileSync(fullPath));
        if (meta['type'] == 'sprite') {
          let name = fileName.substring(0, fileName.indexOf('.'));
          let uuid = meta['subMetas'][name]['uuid'];
          uuids.push(uuid);
          list += '\n' + name;
        }
      }
    }
    Editor.log(list);

    return uuids;
  },

  // 获取当前选中的图片资源 uuid
  getUuidsViaCurSelection(curSelection) {
    let uuids = [];
    let list = '[SPACG] 图片列表 >>>';
    for (let i = 0; i < curSelection.length; i++) {
      let url = Editor.assetdb.uuidToUrl(curSelection[i])
      let path = Editor.url(url, 'utf8');
      let meta = JSON.parse(Fs.readFileSync(path + '.meta'));
      if (meta['type'] == 'sprite') {
        let name = url.substring(url.lastIndexOf('/') + 1, url.indexOf('.'));
        let uuid = meta['subMetas'][name]['uuid'];
        uuids.push(uuid);
        list += '\n' + name;
      }
    }
    Editor.log(list);

    return uuids;
  },

  // 获取模板
  getTemplate() {
    if (!this.templateString) {
      this.templateString = Fs.readFileSync(Editor.url(this.templateUrl));
    }
    return JSON.parse(this.templateString);
  },

  // 生成动画文件
  async generateAnimFile(uuids, config) {
    Editor.log('[SPACG] 正在生成动画文件...');
    let template = this.getTemplate();
    // 配置参数
    template['_name'] = config.outputName;
    template['_duration'] = parseFloat(config.duration.toFixed(17));
    template['sample'] = config.sample;
    template['speed'] = config.speed;
    template['wrapMode'] = config.wrapMode;
    // 写入图片数据
    for (let i = 0; i < uuids.length; i++) {
      let spriteFrame = {
        "frame": parseFloat((i / config.sample).toFixed(18)),
        "value": {
          "__uuid__": uuids[i]
        }
      };
      template['curveData']['comps']['cc.Sprite']['spriteFrame'].push(spriteFrame);
    }
    // 输出
    if (Editor.assetdb.exists('db://assets/' + config.outputPath)) {
      // 确认名称
      let destUrl = 'db://assets/' + config.outputPath + '/' + config.outputName + '.anim';
      if (Editor.assetdb.exists(destUrl)) {
        let count = 1;
        let name = config.outputName + '_';
        while (Editor.assetdb.exists('db://assets/' + config.outputPath + '/' + name + (count > 10 ? '0' : '00') + count + '.anim')) {
          count++;
        }
        config.outputName += '_' + (count > 10 ? '0' : '00') + count;
        destUrl = 'db://assets/' + config.outputPath + '/' + config.outputName + '.anim';
      }
      // 生成文件
      let stringData = JSON.stringify(template, null, '  ');
      let results = await this.createFile(stringData, destUrl);
      if (config.needBindToCurNode) await this.bindToNode(results)
    } else {
      Editor.warn('[SPACG] 输出路径不存在！');
    }
    Editor.log('\n');
  },

  // 创建文件
  createFile(stringData, destUrl) {
    return new Promise(async res => {
      Editor.assetdb.create(destUrl, stringData, async (err, results) => {
        if (!err) Editor.log('[SPACG] 动画文件创建成功 ' + destUrl);
        else Editor.warn('[SPACG] 创建失败！' + err);
        res(results);
      });
    });
  },

  // 绑定至选中节点
  bindToNode(results) {
    return new Promise(res => {
      let args = {
        uuid: results[0]['uuid'],
        path: results[0]['path'],
        url: results[0]['url']
      };
      Editor.Scene.callSceneScript('ccc-sf-ac-generator', 'bind-to-node', args, (err, msg) => {
        res();
      });
    });
  }

}