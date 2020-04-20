Editor.Panel.extend({
  style: `
    :host {
      padding-left: 10px;
      padding-right: 10px;

      height: auto;
    }

    .container {
      height: 100%;
      overflow-y: auto;
    }

    .button{
      

    }

    ui-box-container{
      min-height: 20px;
    }
  `,

  template: `
	<div class="container">
    <h2>输入</h2>
    <ui-box-container class="layout vertical">
      <div>
        <label>图片所在文件夹路径：</label> <label>assets/</label> <ui-input v-value="inputPath"></ui-input> <label>/</label>
        </br>
        <label>图片名称前缀：</label> <ui-input v-value="prefix"></ui-input>
        </br>
        <hr>
        <label>当前导入图片数量：<strong>{{ amount }}</strong></label>
      </div>
      </br>
      <div class="layout horizontal center around-justified">
        <ui-button class="button blue" @click="importByPath()">通过路径导入</ui-button>
        <ui-button class="button" style="background: purple;color: white" @click="importBySelection()">导入当前选中图片</ui-button>
        <ui-button class="button red" @click="clearImport()">清空</ui-button>
      </div>
    </ui-box-container>
    
    <h2>属性</h2>
    <ui-box-container class="layout vertical">
      <div>
        <label>Sample：</label> <ui-num-input step="1" v-value="sample"></ui-num-input>
        </br>
        <label>Speed：</label> <ui-num-input step="0.1" v-value="speed"></ui-num-input>
        </br>
        <label>Duration：{{ duration.toFixed(2) }}s</label>
        </br>
        <label>WrapMode：</label>
        <ui-select v-value="wrapMode">
          <option value="0">Default</option>
          <option value="1">Normal</option>
          <option value="2">Loop</option>
          <option value="3">PingPong</option>
          <option value="4">Reverse</option>
          <option value="5">LoopReverse</option>
          <option value="6">PingPongReverse</option>
        </ui-select>
      </div>
    </ui-box-container>

    <h2>输出</h2>
    <ui-box-container class="layout vertical">
      <div>
        <label>输出路径：</label> <label>assets/</label> <ui-input v-value="outputPath"></ui-input> <label>/</label>
        </br>
        <label>文件名：</label> <ui-input v-value="outputName"></ui-input> <label>.anim</label>
        </br>
        <hr>
        <ui-checkbox v-value="needBindToCurNode">将新建的动画片段绑定到当前选中的节点</ui-checkbox>
        </br>
      </div>
      </br>
      <div class="layout horizontal center around-justified">
        <ui-button class="button green big" v-disabled="isProcessing" @click="generate()">生成</ui-button>
      </div>
    </ui-box-container>
  </div>
  `,

  ready() {
    new window.Vue({
      el: this.shadowRoot,

      data() {
        return {
          inputPath: 'textures',
          prefix: '',
          amount: 0,

          duration: 0,
          sample: 60,
          speed: 1,
          wrapMode: 1,

          outputPath: 'animations',
          outputName: 'clip',

          needBindToCurNode: false,

          isProcessing: false,
        }
      },

      computed: {
        // 计算时长
        duration() {
          let duration = this.amount / this.sample / this.speed;
          return duration;
        }
      },

      methods: {
        // 导入当前路径
        importByPath() {
          let config = {
            inputPath: this.inputPath,
            prefix: this.prefix
          };
          Editor.Ipc.sendToMain('ccc-sf-ac-generator:import-path', config, (err, amount) => {
            this.amount = amount;
          });
        },

        // 导入当前选中
        importBySelection() {
          Editor.Ipc.sendToMain('ccc-sf-ac-generator:import-selection', (err, amount) => {
            this.amount = amount;
          });
        },

        // 清空导入
        clearImport() {
          Editor.Ipc.sendToMain('ccc-sf-ac-generator:clear-import', (err, amount) => {
            this.amount = amount;
          });
        },

        // 生成
        generate() {
          if (this.isProcessing) return;
          this.isProcessing = true;

          let config = {
            duration: this.duration,
            sample: this.sample,
            speed: this.speed,
            wrapMode: this.wrapMode,
            outputPath: this.outputPath,
            outputName: this.outputName,
            needBindToCurNode: this.needBindToCurNode
          };
          Editor.Ipc.sendToMain('ccc-sf-ac-generator:generate', config, (err, msg) => {
            this.isProcessing = false;
            this.amount = 0;
          });
        },
      },

    });
  },
});