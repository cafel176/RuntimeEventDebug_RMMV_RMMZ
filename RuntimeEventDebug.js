// ============================================================================= //
// RuntimeEventDebug.js
// ============================================================================= //
/*:
 * @plugindesc 当前版本 V2
 * 运行时事件调试插件，适用于RMMV和RMMZ
 * @author cafel
 * @target MZ
 * @url https://github.com/cafel176/RuntimeEventDebug_RMMV_RMMZ
 * @help QQ群：792888538 欢迎反馈遇到的问题和希望支持的功能
 * 视频教程：https://www.bilibili.com/video/BV1YURqYMETS/?spm_id_from=333.337.search-card.all.click&vd_source=1f5e08d6a2e054c354714c7090aed591
 * 
 * ★ 本插件提供如下支持：
 * 
 * 1. 支持通过注释在事件列表中添加断点，运行时执行到断点注释会触发存档面板以供
 *    记录
 *    ♦ 使用方式：添加注释并写入“断点#任意字符”即可
 *      此处的任意字符要保证每个事件内的所有事件页都不重复
 *    ♦ 例如：事件A内3个事件页，则事件页1用了断点#001，其他断点都不能再用，当前
 *      事件页和事件页2、3内的所有其他断点都不能再用001
 *      但是另外一个事件B则无此限制，每个事件是彼此独立的
 * 
 * 2. 支持运行时在任意时间打开读档界面，快捷键F10
 * 
 * 3. 支持运行时对事件进行调试编辑，当在注释断点处保存游戏后，再次读档会识别上
 *    次保存的注释断点位置，并将最新的修改直接应用到该位置
 *    ♦ 注意：本功能仅限通过注释断点保存的存档，其他插件或普通的存档事件无法
 *      触发
 * 
 * ★ 结合各种功能后，对于一个长流程事件演出的调试工作流如下：
 *    ♦ 在事件列表中要检查的位置之前加入注释断点
 *    ♦ 开始游戏，进入事件测试
 *    ♦ 触发断点，保存
 *    ♦ 执行事件，检查效果是否满意
 *    ♦ 如效果未达预期，直接在编辑器中对事件进行修改
 *    ♦ 此时注意，一定要保存工程！！！
 *    ♦ F10读档，再次进行事件测试，如仍不满意，重复上述流程
 *    ♦ 如效果达到预期，则可以退出游戏
 * 
 * ★ 注意：本插件完全用于开发调试，开发完成后进入部署阶段时，请将本插件
 *    关闭避免影响到游戏流程
 * 
 * @param 断点方式
 * @type select
 * @option 仅注释处
 * @value 仅注释处
 * @option 禁用
 * @value 禁用
 * @desc 断点触发存档界面的方式
 * @default 仅注释处
 * 
 */

var RuntimeEventDebug = RuntimeEventDebug || {};
RuntimeEventDebug.param = PluginManager.parameters('RuntimeEventDebug');

// ============================================================================= //
// 插件参数
// ============================================================================= //
RuntimeEventDebug.paraminfo = {}

// 断点
RuntimeEventDebug.paraminfo.breakPoint = {}
RuntimeEventDebug.paraminfo.breakPoint.type = "断点方式"
RuntimeEventDebug.paraminfo.breakPoint.value = String(RuntimeEventDebug.param[RuntimeEventDebug.paraminfo.breakPoint.type] || "")
RuntimeEventDebug.paraminfo.breakPoint.onlyDesc = "仅注释处"
RuntimeEventDebug.paraminfo.breakPoint.never = "禁用"

// ============================================================================= //
// 插件文本
// ============================================================================= //
RuntimeEventDebug.string = {}

// 断点
RuntimeEventDebug.string.breakPoint = "断点"

// ============================================================================= //
// 插件按键
// ============================================================================= //

// 读档
Input.keyMapper[121] = "load";

// ============================================================================= //
// 对所有的事件页进行处理，将其中的注释转化为对应的事件
// ============================================================================= //
var DataManager_loadDataFile = DataManager.loadDataFile;
DataManager.loadDataFile = function (name, src) {
    if (Utils.RPGMAKER_NAME === 'MV') {
        // MV下需要接管xhr
        var xhr = new XMLHttpRequest();
        var url = 'data/' + src;
        xhr.open('GET', url);
        xhr.overrideMimeType('application/json');
        // 更改onload为绑定到onXhrLoad
        xhr.onload = () => this.onXhrLoad(xhr, name, src, url);
        xhr.onerror = this._mapLoader || function () {
            DataManager._errorUrl = DataManager._errorUrl || url;
        };
        window[name] = null;
        xhr.send();
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        DataManager_loadDataFile.call(this, name, src);
    }
};

// 加载的是$dataMap
var loadDataMap = false
var DataManager_onXhrLoad = DataManager.onXhrLoad;
DataManager.onXhrLoad = function (xhr, name, src, url) {
    // 对$dataMap做标记处理
    if (name == "$dataMap") {
        loadDataMap = true;
    }
    if (Utils.RPGMAKER_NAME === 'MV') {
        // MV的xhr.onload
        if (xhr.status < 400) {
            window[name] = JSON.parse(xhr.responseText);
            DataManager.onLoad(window[name]);
        }
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        DataManager_onXhrLoad.call(this, xhr, name, src, url);
    }
};

// 读档时根据文件进行数据更新
var DataManager_onLoad = DataManager.onLoad;
DataManager.onLoad = function (object) {
    DataManager_onLoad.call(this, object);

    if (loadDataMap) {
        // 对用于数据的事件全部进行注释处理
        for (let i = $dataMap.events.length - 1; i >= 0; --i) {
            if (!$dataMap.events[i])
                continue;

            for (let j = $dataMap.events[i].pages.length - 1; j >= 0; --j) {
                this.debug_setupEvents($dataMap.events[i].pages[j].list);
            }
        }

        // 读档后需要更新$gameMap以处理存档时正在执行事件的情况
        if ($gameMap._interpreter._list) {
            // 找到存档时正在触发的事件ID
            const eventId = $gameMap._interpreter._eventId
            // 当前场景中仍存在该事件
            if (eventId >= 0 && eventId < $dataMap.events.length) {
                if ($gameMap._interpreter._index > 0) {
                    // 找到存档时正在执行的事件项
                    const checkEvent = $gameMap._interpreter._list[$gameMap._interpreter._index - 1]
                    // 当前事件是否是注释断点
                    if (checkEvent.code === 352) {
                        let checkStr = checkEvent.parameters[0]
                        // 检查当前注释是否是指定标记开头
                        let checkArr = this.debug_processToken(checkStr)
                        // 是注释断点，允许载入
                        if (checkArr[0]) {
                            // 对该事件的每一页遍历
                            let find = false
                            for (let i = 0; i < $dataMap.events[eventId].pages.length; ++i) {
                                for (let j = 0; j < $dataMap.events[eventId].pages[i].list.length; ++j) {
                                    const itrEvent = $dataMap.events[eventId].pages[i].list[j]
                                    if (!itrEvent)
                                        continue;

                                    // 当前事件是否是注释
                                    if (itrEvent.code === 352) {
                                        let itrStr = itrEvent.parameters[0]
                                        // 检查当前注释是否是指定标记开头
                                        let itrArr = this.debug_processToken(itrStr)
                                        // 是注释断点，允许载入
                                        if (itrArr[0]) {
                                            // 注释对得上
                                            if (checkArr[1] === itrArr[1]) {
                                                // 更新$gameMap
                                                $gameMap._interpreter._list = $dataMap.events[eventId].pages[i].list
                                                $gameMap._interpreter._index = j + 1

                                                find = true
                                                break
                                            }
                                        }
                                    }
                                }
                                if (find)
                                    break
                            }
                        }
                    }
                }
            }
        }

        loadDataMap = false;
    }

};

// 将注释转化为对应的事件
DataManager.debug_setupEvents = function (list) {
    for (let index = list.length - 1; index >= 0; --index) {
        // 禁用
        if (RuntimeEventDebug.paraminfo.breakPoint.value == RuntimeEventDebug.paraminfo.breakPoint.never)
            continue;

        // 仅注释处
        else if (RuntimeEventDebug.paraminfo.breakPoint.value == RuntimeEventDebug.paraminfo.breakPoint.onlyDesc) {
            // 当前事件是否是注释
            if (list[index].code === 108) {
                let Str = list[index].parameters[0]
                // 检查当前注释是否是指定标记开头
                let arr = this.debug_processToken(Str)
                if (arr[0]) {
                    // 将注释转化为存档事件以供后续处理
                    list[index].code = 352
                }
            }
        }
    }
    return list;
};

// 某些事件不需要或者不能添加存档断点
DataManager.debug_IfSkipEvent = function (code) {
    const codeList = [
        0, // 空白事件
        401, // 文本 - 文本
        108, // 注释
        352 // 打开存档画面
    ]
    return codeList.includes(code)
};

// 对注释文本进行处理
DataManager.debug_processToken = function (Token) {
    // 以指定标记开头，一般格式为“断点#任意字符”
    if (Token.startsWith(RuntimeEventDebug.string.breakPoint)) {
        let arr = Token.split("#")
        if (arr.length === 2 && arr[0] === RuntimeEventDebug.string.breakPoint) {
            return [true, arr[1]]
        }
    }
    return [false, ""]
};

// ============================================================================= //
// 读档修改
// ============================================================================= //
var Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function () {
    Scene_Map_update.call(this);
    if (this.isActive()) {
        // 任何时候都可以读档
        if (Input.isTriggered("load")) {
            SceneManager.push(Scene_Load);
        }
    }
};
