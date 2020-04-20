module.exports = {

    // 绑定动画至节点
    'bind-to-node': function (event, data) {
        Editor.log('[SPACG] 绑定新动画至当前选中节点...');
        let nodes = this.getCurrentSelectedNodes();
        if (nodes.length > 0) {
            cc.loader.load({ uuid: data.uuid, url: data.path, type: 'cc.AnimationClip' }, (err, res) => {
                for (let i = 0; i < nodes.length; i++) {
                    Editor.log('[SPACG] 绑定至 ' + nodes[i].name);
                    let animation = nodes[i].getComponent(cc.Animation);
                    if (!animation) animation = nodes[i].addComponent(cc.Animation);
                    animation.addClip(res);
                }
            });
        } else {
            Editor.warn('[SPACG] 当前未选中任何节点！');
        }
        event.reply(null, true);
    },

    // 获取当前选中的节点
    getCurrentSelectedNodes() {
        let scene = cc.director.getScene()
        let uuids = Editor.Selection.curSelection('node');
        let nodes = [];
        for (let i = 0; i < uuids.length; i++) {
            let node = scene.getChildByUuid(uuids[i]);
            if (node) nodes.push(node);
        }
        return nodes;
    }
};