// ============================================================================= //
// RuntimeEventDebug.js
// ============================================================================= //
/*:
 * @plugindesc 当前版本 beta 0.1
 * 运行时事件调试插件，适用于RMMV和RMMZ
 * @author cafel
 * @target MZ
 * @url https://github.com/cafel176/RuntimeEventDebug_RMMV_RMMZ
 * @help QQ群：792888538 欢迎反馈遇到的问题和希望支持的功能
 * 视频教程：https://www.bilibili.com/video/BV1YURqYMETS/?spm_id_from=333.337.search-card.all.click&vd_source=1f5e08d6a2e054c354714c7090aed591
 * 
 * ★ 警告：本插件会修改data文件夹下的数据，为避免因插件冲突导致的问题，使用本
 *    插件前请注意自行备份data文件夹！！！
 * 
 * ★ 本插件提供如下支持：
 * 
 * 1. 支持通过注释在事件列表中添加断点，运行时执行到断点注释会触发存档面板以供
 *    记录
 *    ♦ 使用方式：添加注释并写入  断点  即可
 * 
 * 2. 支持指定一张地图，运行时该地图内的所有事件前都会触发存档面板以供记录
 *    ♦ 使用方式：在地图备注中写入  断点调试  即可
 * 
 * 3. 支持运行时在任意时间打开读档界面，快捷键F10
 * 
 * 4. 支持运行时对事件进行调试编辑，快捷键F9打开Debug面板
 *    ♦ 可以修改事件的参数并保存，退出Debug面板时会自动保存事件的修改到地图
 *      数据中，修改后的事件再次触发即可按照修改后的效果执行
 *    ♦ 退出Debug面板时会自动将旧的地图数据备份并用新的地图数据覆盖。如果是
 *      MZ，编辑器会提示数据有变更并支持重新载入数据；如果是MV，则需要关闭编
 *      辑器再打开以载入最新修改
 *    ♦ 旧的地图数据备份位置为 RuntimeEventDebug/Copy，文件名中包含了 月 日 
 *      时 分 的时间信息以供识别，如：Map001_4_5_12_31.json
 * 
 * ★ 结合各种功能后，对于一个长流程事件演出的调试工作流如下：
 *    ♦ 在事件列表中要检查的位置之前加入注释断点
 *    ♦ 开始游戏，进入事件测试
 *    ♦ 触发断点，保存
 *    ♦ 执行事件，检查效果是否满意
 *    ♦ 如效果未达预期，F9通过Debug面板对相应事件进行修改
 *    ♦ F10读档，再次进行事件测试，如仍不满意，重复上述流程
 *    ♦ 如效果达到预期，则可以退出游戏
 *    ♦ RMMZ下，编辑器会提示数据被外部修改，此时选择 是 以更新编辑器数据
 *    ♦ RMMV下，编辑器不会自动检测数据修改，需要关闭编辑器重新打开以读取最
 *      新数据
 * 
 * ★ 警告：尽管有备份机制，仍不能排除因插件冲突导致本插件的运行出现问题的情况，
 *    因此为避免问题，使用本插件前请注意自行备份data文件夹！！！
 * 
 * ★ 当前版本支持运行时编辑的事件类型如下，未支持的后续会逐步完善：
 *    ♦ 文本 
 *    ♦ 独立开关操作 
 *    ♦ 等待 
 *    ♦ 显示图片 
 *    ♦ 注释 
 *    ♦ 脚本 
 *    ♦ 设置移动路线 
 *    ♦ 场所移动 
 *    ♦ 插件指令 
 *    ♦ 气泡图标 
 *    ♦ 播放SE 
 *    ♦ 更改透明状态
 * 
 * ★ 注意：本插件完全用于开发调试，开发完成后进入部署阶段时，请将本插件
 *    关闭避免影响到游戏流程
 * ★ 注意：MV版本下对鼠标的支持并不完善，因此请不要用鼠标点击Debug面板
 *    的UI，否则有概率出现文本自动跳过的问题。
 *    完全使用键盘进行调试和读档则可以避免
 * 
 * @param 断点方式
 * @type select
 * @option 仅注释处
 * @value 仅注释处
 * @option 指定地图的所有事件
 * @value 指定地图的所有事件
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
RuntimeEventDebug.paraminfo.breakPoint.allInMap = "指定地图的所有事件"

// ============================================================================= //
// 插件文本
// ============================================================================= //
RuntimeEventDebug.string = {}

// 断点
RuntimeEventDebug.string.breakPoint = "断点"
RuntimeEventDebug.string.breakPointMap = "断点调试"

// ============================================================================= //
// 插件按键
// ============================================================================= //

// 读档
Input.keyMapper[121] = "load";

// ============================================================================= //
// 对所有的事件页进行处理，将其中的注释转化为对应的事件
// ============================================================================= //
// 备份原始事件
$dataMapOrigin = null;
// 当前的事件映射序号排到了哪一号
var CurEventItemIndex = 0;

var DataManager_loadMapData = DataManager.loadMapData;
DataManager.loadMapData = function (mapId) {
    // 加载新图的时候重置事件映射序号
    CurEventItemIndex = 0
    DataManager_loadMapData.call(this, mapId);

    // 备份原始事件
    if (mapId > 0) {
        const filename = "Map%1.json".format(mapId.padZero(3));
        if (Utils.RPGMAKER_NAME === 'MV') {
            // MV有一个mapLoader需要额外处理
            this._mapLoaderOrigin = ResourceHandler.createLoader('data/' + filename, this.loadDataFile.bind(this, '$dataMapOrigin', filename));
        }
        else if (Utils.RPGMAKER_NAME === 'MZ') {

        }
        this.loadDataFile("$dataMapOrigin", filename);
    } else {
        this.makeEmptyMap();
    }
};

// 记录data来源文件名
var DataMapSrc = ""
// 加载的是$dataMap
var loadDataMap = false
// 加载的是$dataMapOrigin
var loadDataMapOrigin = false

var DataManager_onXhrLoad = DataManager.onXhrLoad;
DataManager.onXhrLoad = function (xhr, name, src, url) {
    // 对$dataMap做标记处理
    if (name == "$dataMap") {
        loadDataMap = true;
        DataMapSrc = src;
    }
    // 对$dataMapOrigin做标记处理
    if (name == "$dataMapOrigin") {
        loadDataMapOrigin = true;
        DataMapSrc = src;
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

// 记录是否在进入地图前进行读档操作
var DoLoadGame = false

var DataManager_loadGame = DataManager.loadGame;
DataManager.loadGame = function (savefileId) {
    DoLoadGame = true
    return DataManager_loadGame.call(this, savefileId);
};

var DataManager_onLoad = DataManager.onLoad;
DataManager.onLoad = function (object) {
    DataManager_onLoad.call(this, object);

    if (Utils.RPGMAKER_NAME === 'MV') {
        // MV下这个函数和$dataMap事绑死的，因此需要抄过来改成$dataMapOrigin
        if (loadDataMapOrigin) {
            var array;
            if (object === $dataMapOrigin) {
                this.extractMetadata(object);
                array = object.events;
            } else {
                array = object;
            }
            if (Array.isArray(array)) {
                for (var i = 0; i < array.length; i++) {
                    var data = array[i];
                    if (data && data.note !== undefined) {
                        this.extractMetadata(data);
                    }
                }
            }
        }
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {

    }
    if (loadDataMap) {
        // 记录data来源文件名
        $dataMap.src = DataMapSrc
        // 添加事件映射序号
        let MaxIndex = this.markEventItemIndex($dataMap)
        CurEventItemIndex = Math.max(MaxIndex, CurEventItemIndex)

        for (let i = $dataMap.events.length - 1; i >= 0; --i) {
            if (!$dataMap.events[i])
                continue;

            // 对用于数据的事件全部进行注释处理
            for (let j = $dataMap.events[i].pages.length - 1; j >= 0; --j) {
                this.debug_setupEvents($dataMap.events[i].pages[j].list);
            }
        }

        loadDataMap = false
        DataMapSrc = ""

        // 读档后需要更新$gameMap以处理存档时正在执行事件的情况
        if (DoLoadGame) {
            if ($gameMap._interpreter._list) {
                // 找到存档时正在触发的事件
                const eventId = $gameMap._interpreter._eventId
                // 找到存档时正在执行的事件的EventItemIndex
                const checkEventItemIndex = $gameMap._interpreter._list[$gameMap._interpreter._index].EventItemIndex;
                // 对该事件的每一页遍历
                let find = false
                for (let i = 0; i < $dataMap.events[eventId].pages.length; ++i) {
                    for (let j = 0; j < $dataMap.events[eventId].pages[i].list.length; ++j) {
                        // 找到存档时正在执行的那一页
                        if (checkEventItemIndex === $dataMap.events[eventId].pages[i].list[j].EventItemIndex) {
                            // 更新$gameMap
                            $gameMap._interpreter._list = $dataMap.events[eventId].pages[i].list
                            $gameMap._interpreter._index = j

                            find = true
                            break
                        }
                    }
                    if (find)
                        break
                }
            }
            DoLoadGame = false
        }
    }
    if (loadDataMapOrigin) {
        // 记录data来源文件名
        $dataMapOrigin.src = DataMapSrc
        // 添加事件映射序号
        let MaxIndex = this.markEventItemIndex($dataMapOrigin)
        CurEventItemIndex = Math.max(MaxIndex, CurEventItemIndex)

        loadDataMapOrigin = false
        DataMapSrc = ""
    }
};

DataManager.markEventItemIndex = function (data) {
    let EventItemIndex = 0;
    for (let i = data.events.length - 1; i >= 0; --i) {
        if (!data.events[i])
            continue;

        for (let j = data.events[i].pages.length - 1; j >= 0; --j) {
            if (!data.events[i].pages[j])
                continue;

            for (let k = data.events[i].pages[j].list.length - 1; k >= 0; --k) {
                if (!data.events[i].pages[j].list[k])
                    continue;

                // 添加事件映射序号
                data.events[i].pages[j].list[k].EventItemIndex = EventItemIndex;
                EventItemIndex++;
            }
        }
    }
    return EventItemIndex;
}

var DataManager_makeEmptyMap = DataManager.makeEmptyMap;
DataManager.makeEmptyMap = function () {
    DataManager_makeEmptyMap.call(this);

    $dataMapOrigin = {};
    $dataMapOrigin.data = [];
    $dataMapOrigin.events = [];
    $dataMapOrigin.width = 100;
    $dataMapOrigin.height = 100;
    $dataMapOrigin.scrollType = 3;
};

DataManager.debug_setupEvents = function (list) {
    for (let index = list.length - 1; index >= 0; --index) {
        // 禁用
        if (RuntimeEventDebug.paraminfo.breakPoint.value == RuntimeEventDebug.paraminfo.breakPoint.never)
            continue;

        // 指定地图的所有事件都需要
        if (RuntimeEventDebug.paraminfo.breakPoint.value == RuntimeEventDebug.paraminfo.breakPoint.allInMap) {
            // 检查地图备注是否是指定标记 
            if ($dataMap.note.search(RuntimeEventDebug.string.breakPointMap) != -1) {
                // 检查当前事件是否是需要跳过的事件
                if (!this.debug_IfSkipEvent(list[index].code)) {
                    // 添加存档事件以供后续处理
                    list.splice(index, 0, {
                        code: 352,
                        indent: 0,
                        parameters: []
                    });
                }
            }
        }
        // 仅注释处
        else if (RuntimeEventDebug.paraminfo.breakPoint.value == RuntimeEventDebug.paraminfo.breakPoint.onlyDesc) {
            // 当前事件是否是注释
            if (list[index].code === 108) {
                let Str = list[index].parameters[0]
                // 检查当前注释是否是指定标记
                if (Str == RuntimeEventDebug.string.breakPoint) {
                    // 将注释转化为存档事件以供后续处理
                    list[index].code = 352
                }
            }
        }
    }
    return list;
};

DataManager.debug_IfSkipEvent = function (code) {
    // 某些事件不需要或者不能添加存档断点
    const codeList = [
        0, // 空白事件
        401, // 文本 - 文本
        108, // 注释
        352 // 打开存档画面
    ]
    return codeList.includes(code)
};

// ============================================================================= //
// 文件保存逻辑
// ============================================================================= //
// 获取游戏根目录
StorageManager.dataPath = function () {
    // 获取游戏根目录
    let path = require("path");
    path = path.dirname(process.mainModule.filename);
    if (Utils.RPGMAKER_NAME === 'MV') {
        path += "/"
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {

    }
    return path;
}

// 将json数据保存到data
StorageManager.dataToLocalFile = function (saveName, json) {
    const base = StorageManager.dataPath();
    const dirPath = base + "data/";
    const filePath = dirPath + saveName;

    const backupFilePath = filePath + "_";
    return new Promise((resolve, reject) => {
        this.fsMkdir(dirPath);
        this.fsUnlink(backupFilePath);
        this.fsRename(filePath, backupFilePath);
        try {
            this.fsWriteFile(filePath, json);
            this.fsUnlink(backupFilePath);
            resolve();
        } catch (e) {
            try {
                this.fsUnlink(filePath);
                this.fsRename(backupFilePath, filePath);
            } catch (e2) {
                //
            }
            reject(e);
        }
    });
};

// ============================================================================= //
// 需要补充的函数
// ============================================================================= //
if (Utils.RPGMAKER_NAME === 'MV') {
    Window_Base.prototype.itemPadding = function () {
        return 8;
    }

    Window_Base.prototype.baseTextRect = function () {
        const rect = new Rectangle(0, 0, this.innerWidth, this.innerHeight);
        rect.pad(-this.itemPadding(), 0);
        return rect;
    };

    Window_Base.prototype.playCursorSound = function () {
        SoundManager.playCursor();
    };

    Window_Selectable.prototype.itemRectWithPadding = function (index) {
        const rect = this.itemRect(index);
        const padding = this.itemPadding();
        rect.x += padding;
        rect.width -= padding * 2;
        return rect;
    }

    Window_Selectable.prototype.itemLineRect = function (index) {
        const rect = this.itemRectWithPadding(index);
        const padding = (rect.height - this.lineHeight()) / 2;
        rect.y += padding;
        rect.height -= padding * 2;
        return rect;
    }

    StorageManager.fsMkdir = function (path) {
        const fs = require("fs");
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    }

    StorageManager.fsRename = function (oldPath, newPath) {
        const fs = require("fs");
        if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
        }
    }

    StorageManager.fsUnlink = function (path) {
        const fs = require("fs");
        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
        }
    }

    StorageManager.fsWriteFile = function (path, data) {
        const fs = require("fs");
        fs.writeFileSync(path, data);
    }
}

Scene_Base.prototype.clearTextImgs = Window_Base.prototype.clearTextImgs = function () {
    if (this._textImgs) {
        for (let i = 0; i < this._textImgs.length; i++) {
            this.removeChild(this._textImgs[i]);
            this._textImgs[i].destroy();
        }
        this._textImgs = [];
    }
}

// ============================================================================= //
// Debug窗口一级列表
// ============================================================================= //
function Window_RuntimeEventDebugMain() {
    if (Utils.RPGMAKER_NAME === 'MV') {
        this.initialize.apply(this, arguments);
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        this.initialize(...arguments);
    }
}

Window_RuntimeEventDebugMain.prototype = Object.create(Window_Selectable.prototype);
Window_RuntimeEventDebugMain.prototype.constructor = Window_RuntimeEventDebugMain;

Window_RuntimeEventDebugMain.lastTopRow = 0;
Window_RuntimeEventDebugMain.lastIndex = 0;

if (Utils.RPGMAKER_NAME === 'MV') {
    Window_RuntimeEventDebugMain.prototype.initialize = function (x, y, width, height) {
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);

        this.init();
    }
}
else if (Utils.RPGMAKER_NAME === 'MZ') {
    Window_RuntimeEventDebugMain.prototype.initialize = function (rect) {
        Window_Selectable.prototype.initialize.call(this, rect);

        this.init();
    }
}

Window_RuntimeEventDebugMain.prototype.init = function () {
    // 开关数 10个一组
    this._maxSwitches = Math.ceil(($dataSystem.switches.length - 1) / 10);
    // 变量数 10个一组
    this._maxVariables = Math.ceil(($dataSystem.variables.length - 1) / 10);
    // 当前地图的事件数 1个一组
    this._maxEvents = $dataMapOrigin.events.length;

    this.refresh();
    this.setTopRow(Window_RuntimeEventDebugMain.lastTopRow);
    this.select(Window_RuntimeEventDebugMain.lastIndex);
    this.activate();
};

Window_RuntimeEventDebugMain.prototype.refresh = function () {
    if (Utils.RPGMAKER_NAME === 'MV') {
        this.createContents();
        this.drawAllItems();
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        Window_Selectable.prototype.refresh.call(this);
    }
};

Window_RuntimeEventDebugMain.prototype.maxItems = function () {
    return this._maxSwitches + this._maxVariables + this._maxEvents;
};

Window_RuntimeEventDebugMain.prototype.update = function () {
    Window_Selectable.prototype.update.call(this);
    // Main控制Range
    if (this._rangeWindow) {
        const index = this.index();
        this._rangeWindow.setMode(this.mode(index));
        this._rangeWindow.setTopId(this.topId(index));
    }
};

Window_RuntimeEventDebugMain.prototype.mode = function (index) {
    return this.isEventMode(index) ? "event" : (this.isSwitchMode(index) ? "switch" : "variable");
};

Window_RuntimeEventDebugMain.prototype.topId = function (index) {
    if (this.isEventMode(index)) {
        return index
    } else if (this.isSwitchMode(index)) {
        return (index - this._maxEvents) * 10 + 1;
    } else {
        return (index - this._maxEvents - this._maxSwitches) * 10 + 1;
    }
};

Window_RuntimeEventDebugMain.prototype.isEventMode = function (index) {
    return index < this._maxEvents;
};

Window_RuntimeEventDebugMain.prototype.isSwitchMode = function (index) {
    return index < this._maxEvents + this._maxSwitches;
};

Window_RuntimeEventDebugMain.prototype.isVariableMode = function (index) {
    return index >= this._maxEvents + this._maxSwitches;
};

Window_RuntimeEventDebugMain.prototype.drawItem = function (index) {
    const rect = this.itemLineRect(index);
    this.drawText(this.getItem(index), rect.x, rect.y, rect.width);
};

Window_RuntimeEventDebugMain.prototype.getItem = function (index) {
    const c = (this.isEventMode(index) ? "事件" : (this.isSwitchMode(index) ? "开关" : "变量"));

    let text = "";
    const start = this.topId(index);
    if (c === "事件") {
        if ($dataMapOrigin.events[start]) {
            text = c + " [" + start.padZero(3) + "] " + this.GetEventName(start);
        }
        else if (start === 0) {
            text = "空事件"
        }
        else {
            text = "空事件"
        }
    }
    else {
        const end = start + 9;
        text = c + " [" + start.padZero(4) + "-" + end.padZero(4) + "]";
    }
    return text
};

Window_RuntimeEventDebugMain.prototype.isCancelTriggered = function () {
    return (
        Window_Selectable.prototype.isCancelTriggered() ||
        Input.isTriggered("debug")
    );
};

Window_RuntimeEventDebugMain.prototype.processCancel = function () {
    Window_Selectable.prototype.processCancel.call(this);
    Window_RuntimeEventDebugMain.lastTopRow = this.topRow();
    Window_RuntimeEventDebugMain.lastIndex = this.index();
};

Window_RuntimeEventDebugMain.prototype.setRangeWindow = function (rangeWindow) {
    this._rangeWindow = rangeWindow;
};

Window_RuntimeEventDebugMain.prototype.GetEventName = function (dataId) {
    if ($dataMapOrigin.events[dataId]) {
        return $dataMapOrigin.events[dataId].name;
    }

    return ""
}

Window_RuntimeEventDebugMain.prototype.select = function (index) {
    Window_Selectable.prototype.select.call(this, index);
    this.callHandler("select");
};

// ============================================================================= //
// Debug窗口二级列表
// ============================================================================= //
function Window_RuntimeEventDebugRange() {
    if (Utils.RPGMAKER_NAME === 'MV') {
        this.initialize.apply(this, arguments);
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        this.initialize(...arguments);
    }
}

Window_RuntimeEventDebugRange.prototype = Object.create(Window_Selectable.prototype);
Window_RuntimeEventDebugRange.prototype.constructor = Window_RuntimeEventDebugRange;

Window_RuntimeEventDebugRange.lastTopRow = 0;
Window_RuntimeEventDebugRange.lastIndex = 0;

if (Utils.RPGMAKER_NAME === 'MV') {
    Window_RuntimeEventDebugRange.prototype.initialize = function (x, y, width, height) {
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);

        this.init();
    }
}
else if (Utils.RPGMAKER_NAME === 'MZ') {
    Window_RuntimeEventDebugRange.prototype.initialize = function (rect) {
        Window_Selectable.prototype.initialize.call(this, rect);

        this.init();
    }
}

Window_RuntimeEventDebugRange.prototype.init = function () {
    this._mode = "switch";
    this._topId = 1;

    this.refresh();
    this.setTopRow(Window_RuntimeEventDebugRange.lastTopRow);
    this.select(Window_RuntimeEventDebugRange.lastIndex);
};

Window_RuntimeEventDebugRange.prototype.maxItems = function () {
    if (this._mode === "event") {
        if ($dataMapOrigin.events[this._topId])
            return $dataMapOrigin.events[this._topId].pages.length;
        else
            return 0;
    } else {
        return 1;
    }
};

Window_RuntimeEventDebugRange.prototype.update = function () {
    Window_Selectable.prototype.update.call(this);
    // Range控制Edit
    if (this._editWindow) {
        const index = this.index();
        this._editWindow.setMode(this.mode());
        this._editWindow.setTopId(this.topId());
        this._editWindow.setRangeIndex(index);
    }
};

Window_RuntimeEventDebugRange.prototype.setMode = function (mode) {
    if (this._mode !== mode) {
        this._mode = mode;
        this.refresh();
    }
};

Window_RuntimeEventDebugRange.prototype.mode = function () {
    return this._mode;
};

Window_RuntimeEventDebugRange.prototype.setTopId = function (id) {
    if (this._topId !== id) {
        this._topId = id;
        this.refresh();
    }
};

Window_RuntimeEventDebugRange.prototype.topId = function () {
    return this._topId;
};

Window_RuntimeEventDebugRange.prototype.refresh = function () {
    if (Utils.RPGMAKER_NAME === 'MV') {
        this.createContents();
        this.drawAllItems();
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        Window_Selectable.prototype.refresh.call(this);
    }
};

Window_RuntimeEventDebugRange.prototype.drawItem = function (index) {
    const rect = this.itemLineRect(index);
    this.drawText(this.getItem(index), rect.x, rect.y, rect.width);
};

Window_RuntimeEventDebugRange.prototype.getItem = function (index) {
    let text = "值";
    if (this._mode === "event") {
        const c = "事件页"
        text = c + " " + (index + 1);
    }
    return text
};

Window_RuntimeEventDebugRange.prototype.processCancel = function () {
    Window_Selectable.prototype.processCancel.call(this);
    Window_RuntimeEventDebugRange.lastTopRow = this.topRow();
    Window_RuntimeEventDebugRange.lastIndex = this.index();
};

Window_RuntimeEventDebugRange.prototype.setEditWindow = function (editWindow) {
    this._editWindow = editWindow;
};

Window_RuntimeEventDebugRange.prototype.select = function (index) {
    Window_Selectable.prototype.select.call(this, index);
    this.callHandler("select");
};

// ============================================================================= //
// Debug窗口三级列表
// ============================================================================= //
function Window_RuntimeEventDebugEdit() {
    if (Utils.RPGMAKER_NAME === 'MV') {
        this.initialize.apply(this, arguments);
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        this.initialize(...arguments);
    }
}

Window_RuntimeEventDebugEdit.prototype = Object.create(Window_Selectable.prototype);
Window_RuntimeEventDebugEdit.prototype.constructor = Window_RuntimeEventDebugEdit;

if (Utils.RPGMAKER_NAME === 'MV') {
    Window_RuntimeEventDebugEdit.prototype.initialize = function (x, y, width, height) {
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);

        this.init();
    }
}
else if (Utils.RPGMAKER_NAME === 'MZ') {
    Window_RuntimeEventDebugEdit.prototype.initialize = function (rect) {
        Window_Selectable.prototype.initialize.call(this, rect);

        this.init();
    }
}

Window_RuntimeEventDebugEdit.prototype.init = function () {
    this._mode = "switch";
    this._topId = 1;
    this._rangeIndex = 1;

    this.refresh();
};

Window_RuntimeEventDebugEdit.prototype.maxItems = function () {
    if (this._mode === "event") {
        if ($dataMapOrigin.events[this._topId]) {
            if ($dataMapOrigin.events[this._topId].pages[this._rangeIndex]) {
                return $dataMapOrigin.events[this._topId].pages[this._rangeIndex].list.length;
            }
        }
        return 0;
    }
    else
        return 10;
};

Window_RuntimeEventDebugEdit.prototype.refresh = function () {
    if (Utils.RPGMAKER_NAME === 'MV') {
        this.contents.clear();
        this.drawAllItems();
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        Window_Selectable.prototype.refresh.call(this);
    }
};

Window_RuntimeEventDebugEdit.prototype.drawItem = function (index) {
    if (this._mode === "event") {
        const dataId = index;

        const name = this.itemName(dataId);
        const status = this.itemStatus(dataId);
        const text = name + "  " + status

        const rect = this.itemLineRect(index);
        this.resetTextColor();
        this.drawText(text, rect.x, rect.y, rect.width);
    }
    else {
        const dataId = this._topId + index;
        const idText = dataId.padZero(4) + ":";
        const idWidth = this.textWidth(idText);
        const statusWidth = this.textWidth("-00000000000000000000000");
        const name = this.itemName(dataId);
        const status = this.itemStatus(dataId);
        const rect = this.itemLineRect(index);
        this.resetTextColor();
        this.drawText(idText, rect.x, rect.y, rect.width);
        rect.x += idWidth;
        rect.width -= idWidth + statusWidth;
        this.drawText(name, rect.x, rect.y, rect.width);
        this.drawText(status, rect.x + rect.width, rect.y, statusWidth, "right");
    }
};

Window_RuntimeEventDebugEdit.prototype.itemName = function (dataId) {
    if (this._mode === "switch") {
        return $dataSystem.switches[dataId];
    } else if (this._mode === "variable") {
        return $dataSystem.variables[dataId];
    } else {
        const eventId = this._topId;
        const pageId = this._rangeIndex;
        const itemId = dataId;
        if ($dataMapOrigin.events[eventId]) {
            if ($dataMapOrigin.events[eventId].pages[pageId]) {
                let EventInfo = $dataMapOrigin.events[eventId].pages[pageId].list[itemId];
                return GetEventCodeName(EventInfo);
            }
        }
        return "";
    }
};

Window_RuntimeEventDebugEdit.prototype.itemStatus = function (dataId) {
    if (this._mode === "switch") {
        return $gameSwitches.value(dataId) ? "[ON]" : "[OFF]";
    } else if (this._mode === "variable") {
        return String($gameVariables.value(dataId));
    } else {
        const eventId = this._topId;
        const pageId = this._rangeIndex;
        const itemId = dataId;
        if ($dataMapOrigin.events[eventId]) {
            if ($dataMapOrigin.events[eventId].pages[pageId]) {
                let EventInfo = $dataMapOrigin.events[eventId].pages[pageId].list[itemId];
                return GetEventCodeStatus(EventInfo);
            }
        }
        return "";
    }
};

Window_RuntimeEventDebugEdit.prototype.mode = function () {
    return this._mode;
};

Window_RuntimeEventDebugEdit.prototype.setMode = function (mode) {
    if (this._mode !== mode) {
        this._mode = mode;
        this.refresh();
    }
};

Window_RuntimeEventDebugEdit.prototype.topId = function () {
    return this._topId;
};

Window_RuntimeEventDebugEdit.prototype.setTopId = function (id) {
    if (this._topId !== id) {
        this._topId = id;
        this.refresh();
    }
};

Window_RuntimeEventDebugEdit.prototype.rangeIndex = function () {
    return this._rangeIndex;
};

Window_RuntimeEventDebugEdit.prototype.setRangeIndex = function (index) {
    if (this._rangeIndex !== index) {
        this._rangeIndex = index;
        this.refresh();
    }
};

Window_RuntimeEventDebugEdit.prototype.currentId = function () {
    if (this._mode === "event") {
        return this.index();
    }
    else
        return this._topId + this.index();
};

Window_RuntimeEventDebugEdit.prototype.update = function () {
    Window_Selectable.prototype.update.call(this);
    if (this.active) {
        if (this._mode === "switch") {
            this.updateSwitch();
        } if (this._mode === "variable") {
            this.updateVariable();
        } else {
            this.updateEvent();
        }
    }
};

Window_RuntimeEventDebugEdit.prototype.updateSwitch = function () {
    if (Input.isRepeated("left") || Input.isRepeated("right")) {
        const switchId = this.currentId();
        this.playCursorSound();
        $gameSwitches.setValue(switchId, !$gameSwitches.value(switchId));
        this.redrawCurrentItem();
    }
};

Window_RuntimeEventDebugEdit.prototype.updateVariable = function () {
    const variableId = this.currentId();
    const value = $gameVariables.value(variableId);
    if (typeof value === "number") {
        const newValue = value + this.deltaForVariable();
        if (value !== newValue) {
            $gameVariables.setValue(variableId, newValue);
            this.playCursorSound();
            this.redrawCurrentItem();
        }
    }
};

Window_RuntimeEventDebugEdit.prototype.deltaForVariable = function () {
    if (Input.isRepeated("right")) {
        return 1;
    } else if (Input.isRepeated("left")) {
        return -1;
    } else if (Input.isRepeated("pagedown")) {
        return 10;
    } else if (Input.isRepeated("pageup")) {
        return -10;
    }
    return 0;
};

Window_RuntimeEventDebugEdit.prototype.updateEvent = function () {
    if (Input.isRepeated("control")) {
        const eventId = this._topId;
        const pageId = this._rangeIndex;
        const itemId = this.index();
        if ($dataMapOrigin.events[eventId]) {
            if ($dataMapOrigin.events[eventId].pages[pageId]) {
                let EventInfo = $dataMapOrigin.events[eventId].pages[pageId].list[itemId];
                if (EventInfo) {
                    let param = prompt('参数', JSON.stringify(EventInfo.parameters));
                    if (param !== null && param !== '') {
                        try {
                            let ParseResult = JSON.parse(param)
                            if (ChangeParameters(EventInfo, ParseResult, eventId, pageId, itemId)) {
                                this.refresh();
                            } else {
                                alert('操作失败: 参数的格式与原来不同或未找到对应参数，请重试！')
                            }
                        } catch (error) {
                            alert('操作失败: json的格式不正确，请重试！\n' + error.stack)
                        }
                    }
                }
            }
        }
    }
}

// ============================================================================= //
// 属性调整窗口
// ============================================================================= //
function Window_RuntimeEventDebugDetail() {
    if (Utils.RPGMAKER_NAME === 'MV') {
        this.initialize.apply(this, arguments);
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        this.initialize(...arguments);
    }
}

Window_RuntimeEventDebugDetail.prototype = Object.create(Window_Selectable.prototype);
Window_RuntimeEventDebugDetail.prototype.constructor = Window_RuntimeEventDebugDetail;

if (Utils.RPGMAKER_NAME === 'MV') {
    Window_RuntimeEventDebugDetail.prototype.initialize = function (x, y, width, height) {
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);

        this.init();
    }
}
else if (Utils.RPGMAKER_NAME === 'MZ') {
    Window_RuntimeEventDebugDetail.prototype.initialize = function (rect) {
        Window_Selectable.prototype.initialize.call(this, rect);

        this.init();
    }
}

Window_RuntimeEventDebugDetail.prototype.init = function () {
    this._object = null
    this.openness = 0;

    this.open();
};

Window_RuntimeEventDebugDetail.prototype.setObject = function (object) {
    if (this._object !== object) {
        this._object = object;
        this.refresh();
    }
}

Window_RuntimeEventDebugDetail.prototype.maxItems = function () {
    if (this._object) {
        return Object.keys(this._object.parameters).length;
    }
    return 0;
}

Window_RuntimeEventDebugDetail.prototype.getObject = function () {
    return this._object;
}

Window_RuntimeEventDebugDetail.prototype.drawItem = function (index) {
    if (this._object) {
        let paramInfo = ProcessParameter(this._object, index);
        const name = paramInfo[0];
        const status = paramInfo[1];
        const statusWidth = this.textWidth("-000000000000000000000000000000");
        const rect = this.itemLineRect(index);
        rect.width -= statusWidth;
        this.resetTextColor();
        this.drawText(name, rect.x, rect.y, rect.width);
        this.drawText(status, rect.x + rect.width, rect.y, statusWidth, "right");
    }
};

// ============================================================================= //
// 子参数属性调整窗口
// ============================================================================= //
function Window_RuntimeEventDebugSubDetail() {
    if (Utils.RPGMAKER_NAME === 'MV') {
        this.initialize.apply(this, arguments);
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        this.initialize(...arguments);
    }
}

Window_RuntimeEventDebugSubDetail.prototype = Object.create(Window_Selectable.prototype);
Window_RuntimeEventDebugSubDetail.prototype.constructor = Window_RuntimeEventDebugSubDetail;

if (Utils.RPGMAKER_NAME === 'MV') {
    Window_RuntimeEventDebugSubDetail.prototype.initialize = function (x, y, width, height) {
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);

        this.init();
    }
}
else if (Utils.RPGMAKER_NAME === 'MZ') {
    Window_RuntimeEventDebugSubDetail.prototype.initialize = function (rect) {
        Window_Selectable.prototype.initialize.call(this, rect);

        this.init();
    }
}

Window_RuntimeEventDebugSubDetail.prototype.init = function () {
    this._eventInfo = null
    this._object = null
    this.openness = 0;

    this.open();
};

Window_RuntimeEventDebugSubDetail.prototype.setEventInfo = function (eventInfo) {
    if (this._eventInfo !== eventInfo) {
        this._eventInfo = eventInfo;
        this.refresh();
    }
}

Window_RuntimeEventDebugSubDetail.prototype.setObject = function (object) {
    if (this._object !== object) {
        this._object = object;
        this.refresh();
    }
}

Window_RuntimeEventDebugSubDetail.prototype.maxItems = function () {
    if (this._object) {
        return Object.keys(this._object.parameters).length;
    }
    return 0;
}

Window_RuntimeEventDebugSubDetail.prototype.getEventInfo = function () {
    return this._eventInfo;
}

Window_RuntimeEventDebugSubDetail.prototype.getObject = function () {
    return this._object;
}

Window_RuntimeEventDebugSubDetail.prototype.drawItem = function (index) {
    if (this._object) {
        let paramInfo = ProcessSubParameter(this._eventInfo, this._object, index);
        const name = paramInfo[0];
        const status = paramInfo[1];
        const statusWidth = this.textWidth("-000000000000000000000000000000");
        const rect = this.itemLineRect(index);
        rect.width -= statusWidth;
        this.resetTextColor();
        this.drawText(name, rect.x, rect.y, rect.width);
        this.drawText(status, rect.x + rect.width, rect.y, statusWidth, "right");
    }
};


// ============================================================================= //
// Debug场景
// ============================================================================= //
// 用于判断自打开Debug面板后是否对事件做了任意修改
var changedAnyThing = false

function Scene_RuntimeEventDebug() {
    if (Utils.RPGMAKER_NAME === 'MV') {
        this.initialize.apply(this, arguments);
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        this.initialize(...arguments);
    }
}

Scene_RuntimeEventDebug.prototype = Object.create(Scene_MenuBase.prototype);
Scene_RuntimeEventDebug.prototype.constructor = Scene_RuntimeEventDebug;

Scene_RuntimeEventDebug.prototype.initialize = function () {
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_RuntimeEventDebug.prototype.create = function () {
    Scene_MenuBase.prototype.create.call(this);

    this.createMainWindow();
    this.createRangeWindow();
    this.createEditWindow();
    this.createDebugHelpWindow();
    this.createDebugTitleWindow();

    changedAnyThing = false
};

Scene_RuntimeEventDebug.prototype.needsCancelButton = function () {
    return false;
};

Scene_RuntimeEventDebug.prototype.createMainWindow = function () {
    const rect = this.mainWindowRect();
    if (Utils.RPGMAKER_NAME === 'MV') {
        this._mainWindow = new Window_RuntimeEventDebugMain(rect.x, rect.y, rect.width, rect.height);
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        this._mainWindow = new Window_RuntimeEventDebugMain(rect);
    }
    this._mainWindow.setHandler("ok", this.onMainOk.bind(this));
    this._mainWindow.setHandler("cancel", this.onMainCancel.bind(this));
    this._mainWindow.setHandler("select", this.refreshTitleWindow.bind(this));
    this.addWindow(this._mainWindow);
};

Scene_RuntimeEventDebug.prototype.mainWindowRect = function () {
    const wx = 0;
    const wy = 0;
    const ww = 246;
    const wh = Graphics.boxHeight * 0.6;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_RuntimeEventDebug.prototype.createRangeWindow = function () {
    const rect = this.rangeWindowRect();
    if (Utils.RPGMAKER_NAME === 'MV') {
        this._rangeWindow = new Window_RuntimeEventDebugRange(rect.x, rect.y, rect.width, rect.height);
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        this._rangeWindow = new Window_RuntimeEventDebugRange(rect);
    }
    this._rangeWindow.setHandler("ok", this.onRangeOk.bind(this));
    this._rangeWindow.setHandler("cancel", this.onRangeCancel.bind(this));
    this._rangeWindow.setHandler("select", this.refreshTitleWindow.bind(this));
    this._mainWindow.setRangeWindow(this._rangeWindow);
    this.addWindow(this._rangeWindow);
};

Scene_RuntimeEventDebug.prototype.rangeWindowRect = function () {
    const wx = 0;
    const wy = Graphics.boxHeight * 0.6;
    const ww = 246;
    const wh = Graphics.boxHeight * 0.4;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_RuntimeEventDebug.prototype.createEditWindow = function () {
    const rect = this.editWindowRect();
    if (Utils.RPGMAKER_NAME === 'MV') {
        this._editWindow = new Window_RuntimeEventDebugEdit(rect.x, rect.y, rect.width, rect.height);
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        this._editWindow = new Window_RuntimeEventDebugEdit(rect);
    }
    this._editWindow.setHandler("ok", this.onEditOk.bind(this));
    this._editWindow.setHandler("cancel", this.onEditCancel.bind(this));
    this._rangeWindow.setEditWindow(this._editWindow);
    this.addWindow(this._editWindow);
};

Scene_RuntimeEventDebug.prototype.editWindowRect = function () {
    const wx = this._rangeWindow.width;
    const wy = this.calcWindowHeight(1, false);
    const ww = Graphics.boxWidth - wx;
    const wh = this.calcWindowHeight(10, true);
    return new Rectangle(wx, wy, ww, wh);
};

Scene_RuntimeEventDebug.prototype.createDetailWindow = function (object) {
    const rect = this.detailWindowRect(object);
    if (Utils.RPGMAKER_NAME === 'MV') {
        this._detailWindow = new Window_RuntimeEventDebugDetail(rect.x, rect.y, rect.width, rect.height);
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        this._detailWindow = new Window_RuntimeEventDebugDetail(rect);
    }
    this._detailWindow.setHandler("ok", this.onDetailOk.bind(this));
    this._detailWindow.setHandler("cancel", this.onDetailCancel.bind(this));
    this._detailWindow.setObject(object);
    this.addWindow(this._detailWindow);
};

Scene_RuntimeEventDebug.prototype.detailWindowRect = function (EventInfo) {
    const ww = 600;
    const wh = this.calcWindowHeight(Math.min(10, EventInfo.parameters.length), true);
    const wx = (Graphics.boxWidth - ww) / 2;
    const wy = (Graphics.boxHeight - wh) / 2;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_RuntimeEventDebug.prototype.createSubDetailWindow = function (EventInfo, object) {
    const rect = this.subDetailWindowRect(object);
    if (Utils.RPGMAKER_NAME === 'MV') {
        this._subDetailWindow = new Window_RuntimeEventDebugSubDetail(rect.x, rect.y, rect.width, rect.height);
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        this._subDetailWindow = new Window_RuntimeEventDebugSubDetail(rect);
    }
    this._subDetailWindow.setHandler("ok", this.onSubDetailOk.bind(this));
    this._subDetailWindow.setHandler("cancel", this.onSubDetailCancel.bind(this));
    this._subDetailWindow.setEventInfo(EventInfo);
    this._subDetailWindow.setObject(object);
    this.addWindow(this._subDetailWindow);
};

Scene_RuntimeEventDebug.prototype.subDetailWindowRect = function (object) {
    const ww = 600;
    const wh = this.calcWindowHeight(Math.min(10, object.parameters.length), true);
    const wx = (Graphics.boxWidth - ww) / 2;
    const wy = (Graphics.boxHeight - wh) / 2;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_RuntimeEventDebug.prototype.createDebugHelpWindow = function () {
    const rect = this.debugHelpWindowRect();
    if (Utils.RPGMAKER_NAME === 'MV') {
        this._debugHelpWindow = new Window_Base(rect.x, rect.y, rect.width, rect.height);
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        this._debugHelpWindow = new Window_Base(rect);
    }
    this.addWindow(this._debugHelpWindow);
};

Scene_RuntimeEventDebug.prototype.debugHelpWindowRect = function () {
    const wx = this._editWindow.x;
    const wy = this._editWindow.y + this._editWindow.height;
    const ww = this._editWindow.width;
    const wh = Graphics.boxHeight - wy;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_RuntimeEventDebug.prototype.createDebugTitleWindow = function () {
    const rect = this.debugTitleWindowRect();
    if (Utils.RPGMAKER_NAME === 'MV') {
        this._debugTitleWindow = new Window_Base(rect.x, rect.y, rect.width, rect.height);
    }
    else if (Utils.RPGMAKER_NAME === 'MZ') {
        this._debugTitleWindow = new Window_Base(rect);
    }
    this.addWindow(this._debugTitleWindow);
};

Scene_RuntimeEventDebug.prototype.debugTitleWindowRect = function () {
    const wx = this._editWindow.x;
    const wy = 0;
    const ww = this._editWindow.width;
    const wh = this.calcWindowHeight(1, false);
    return new Rectangle(wx, wy, ww, wh);
};

Scene_RuntimeEventDebug.prototype.onMainOk = function () {
    this._rangeWindow.activate();
    this._rangeWindow.select(0);
    this.refreshHelpWindow();
    this.refreshTitleWindow();
};

Scene_RuntimeEventDebug.prototype.onMainCancel = function () {
    if (changedAnyThing) {
        const fs = require("fs");
        try {
            const base = StorageManager.dataPath();
            const source = base + "data/" + $dataMapOrigin.src;

            let destinationPath = base + "RuntimeEventDebug/";
            if (!fs.existsSync(destinationPath)) {
                fs.mkdirSync(destinationPath);
            }
            destinationPath += "Copy/"
            if (!fs.existsSync(destinationPath)) {
                fs.mkdirSync(destinationPath);
            }

            var currentDate = new Date();
            var month = currentDate.getMonth() + 1;
            var day = currentDate.getDate();
            var hour = currentDate.getHours();
            var minute = currentDate.getMinutes();
            let filenames = $dataMapOrigin.src.split('.');
            const destination = destinationPath + filenames[0] + "_" + month + "_" + day + "_" + hour + "_" + minute + "." + filenames[1];

            // 将原本的地图数据备份
            fs.copyFile(source, destination, (error) => {
                if (error) {
                    alert('文件操作失败: \n' + error.stack)
                }
                else {
                    // 备份成功后用新的数据覆盖
                    StorageManager.dataToLocalFile($dataMapOrigin.src, JSON.stringify($dataMapOrigin));
                }
            });
        } catch (error) {
            alert('文件操作失败: \n' + error.stack)
        }
    }
    this.popScene();
};

Scene_RuntimeEventDebug.prototype.onRangeOk = function () {
    this._editWindow.activate();
    this._editWindow.select(0);
    this.refreshHelpWindow();
};

Scene_RuntimeEventDebug.prototype.onRangeCancel = function () {
    this._mainWindow.activate();
    this._rangeWindow.deselect();
};

Scene_RuntimeEventDebug.prototype.onEditOk = function () {
    if (this._editWindow.mode() === "event") {
        const eventId = this._editWindow.topId();
        const pageId = this._editWindow.rangeIndex();
        const itemId = this._editWindow.index();
        if ($dataMapOrigin.events[eventId]) {
            if ($dataMapOrigin.events[eventId].pages[pageId]) {
                let EventInfo = $dataMapOrigin.events[eventId].pages[pageId].list[itemId];
                if (EventInfo && EventInfo.parameters.length > 0) {
                    this.createDetailWindow(EventInfo);
                    this._detailWindow.activate();
                    this._detailWindow.select(0);
                    return;
                }
            }
        }
    }
    this._editWindow.activate();
};

Scene_RuntimeEventDebug.prototype.onEditCancel = function () {
    this._rangeWindow.activate();
    this._editWindow.deselect();
    this.refreshHelpWindow();
};

Scene_RuntimeEventDebug.prototype.onDetailOk = function () {
    let EventInfo = this._detailWindow.getObject();
    if (EventInfo) {
        let paramIndex = this._detailWindow.index();
        let object = EventInfo.parameters[paramIndex];
        // 对于object，需要打开子参数面板继续编辑
        if (IfSubParameter(EventInfo, object, paramIndex)) {
            // 没有parameters的进行添加
            PrepareSubParameter(EventInfo, object, paramIndex);

            // 成功添加的，可以继续编辑
            if ('parameters' in object) {
                this.createSubDetailWindow(EventInfo, object);
                this._subDetailWindow.activate();
                this._subDetailWindow.select(0);
                return;
            }
        }
        // 非object，直接编辑
        else {
            let paramInfo = ProcessParameter(EventInfo, paramIndex);
            let param = prompt(paramInfo[0] + '  (' + paramInfo[2] + ')', JSON.stringify(EventInfo.parameters[paramIndex]));
            if (param !== null && param !== '') {
                const eventId = this._editWindow.topId();
                const pageId = this._editWindow.rangeIndex();
                const itemId = this._editWindow.index();
                try {
                    let ParseResult = JSON.parse(param)
                    if (ChangeParameter(EventInfo, paramIndex, ParseResult, eventId, pageId, itemId)) {
                        this._detailWindow.refresh();
                        this._editWindow.refresh();
                    } else {
                        alert('操作失败: 参数的格式与原来不同或未找到对应参数，请重试！')
                    }
                } catch (error) {
                    alert('操作失败: json的格式不正确，请重试！\n' + error.stack)
                }
            }
        }
    }
    this._detailWindow.activate();
};

Scene_RuntimeEventDebug.prototype.onDetailCancel = function () {
    this._editWindow.activate();
    this._detailWindow.close();
};

Scene_RuntimeEventDebug.prototype.onSubDetailOk = function () {
    let object = this._subDetailWindow.getObject();
    let EventInfo = this._subDetailWindow.getEventInfo();
    if (object) {
        let paramIndex = this._subDetailWindow.index();
        let paramInfo = ProcessSubParameter(EventInfo, object, paramIndex);
        let param = prompt(paramInfo[0] + '  (' + paramInfo[2] + ')', JSON.stringify(object.parameters[paramIndex]));
        if (param !== null && param !== '') {
            const eventId = this._editWindow.topId();
            const pageId = this._editWindow.rangeIndex();
            const itemId = this._editWindow.index();
            const paramId = this._detailWindow.index();
            try {
                let ParseResult = JSON.parse(param)
                if (ChangeSubParameter(EventInfo, object, paramIndex, ParseResult, eventId, pageId, itemId, paramId)) {
                    this._subDetailWindow.refresh();
                    this._detailWindow.refresh();
                    this._editWindow.refresh();
                } else {
                    alert('操作失败: 参数的格式与原来不同或未找到对应参数，请重试！')
                }
            } catch (error) {
                alert('操作失败: json的格式不正确，请重试！\n' + error.stack)
            }
        }
    }
    this._subDetailWindow.activate();
};

Scene_RuntimeEventDebug.prototype.onSubDetailCancel = function () {
    this._detailWindow.activate();
    this._subDetailWindow.close();
};

Scene_RuntimeEventDebug.prototype.refreshHelpWindow = function () {
    const helpWindow = this._debugHelpWindow;
    helpWindow.clearTextImgs();
    helpWindow.contents.clear();
    if (this._editWindow.active) {
        const rect = helpWindow.baseTextRect();
        helpWindow.drawTextEx(this.helpText(), rect.x, rect.y, rect.width);
    }
};

Scene_RuntimeEventDebug.prototype.helpText = function () {
    if (this._editWindow.mode() === "switch") {
        return "Left/Right: 更改 ON/OFF";
    } if (this._editWindow.mode() === "variable") {
        return (
            "Left: -1  Right: +1\nPageup: -10  Pagedown: +10"
        );
    } else {
        return (
            "Enter: UI修改  Control: 直接修改"
        );
    }
};

Scene_RuntimeEventDebug.prototype.refreshTitleWindow = function () {
    let titleWindow = this._debugTitleWindow;
    titleWindow.clearTextImgs();
    titleWindow.contents.clear();
    const rect = titleWindow.baseTextRect();
    titleWindow.drawTextEx(this.titleText(), rect.x, rect.y, rect.width);
};

Scene_RuntimeEventDebug.prototype.titleText = function () {
    const mainIndex = this._mainWindow.index()
    let Hint = this._mainWindow.getItem(mainIndex)
    if (this._mainWindow.isEventMode(mainIndex)) {
        const rangeIndex = this._rangeWindow.index()
        if (rangeIndex >= 0) {
            Hint += "  " + this._rangeWindow.getItem(rangeIndex)
        }
    }

    return Hint
};

Scene_RuntimeEventDebug.prototype.calcWindowHeight = function (numLines, selectable) {
    if (selectable) {
        return Window_Selectable.prototype.fittingHeight(numLines);
    } else {
        return Window_Base.prototype.fittingHeight(numLines);
    }
};

// ============================================================================= //
// Debug加入系统
// ============================================================================= //
Scene_Map.prototype.isDebugCalled = function () {
    return Input.isTriggered('debug');
};

Scene_Map.prototype.updateCallDebug = function () {
    if (this.isDebugCalled()) {
        SceneManager.push(Scene_RuntimeEventDebug);
    }
};

var Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function () {
    Scene_Map_update.call(this);
    if (this.isActive()) {
        // 即使显示了文本框，也可以调试
        if ($gameMessage.isBusy()) {
            if (!SceneManager.isSceneChanging()) {
                this.updateCallDebug();
            }
        }
        // 任何时候都可以读档
        if (Input.isTriggered("load")) {
            SceneManager.push(Scene_Load);
        }
    }
};

// ============================================================================= //
// 支持函数
// ============================================================================= //
// 用于处理单个参数的修改
var ChangeParameter = function (EventInfo, paramIndex, inParam, eventId, pageId, itemId) {
    if (typeof (inParam) !== typeof (EventInfo.parameters[paramIndex]))
        return false;

    let Newparam = CheckParameter(EventInfo, paramIndex, inParam);
    EventInfo.parameters[paramIndex] = Newparam;

    const EventItemIndex = EventInfo.EventItemIndex;
    for (let i = 0; i < $dataMap.events[eventId].pages[pageId].list.length; ++i) {
        let RealEventInfo = $dataMap.events[eventId].pages[pageId].list[i];
        if (RealEventInfo.EventItemIndex !== EventItemIndex)
            continue;

        RealEventInfo.parameters[paramIndex] = Newparam;

        changedAnyThing = true
        return true
    }
    alert('失败: 修改未正常同步！')
    return false
}

// 用于处理参数数组整体的修改
var ChangeParameters = function (EventInfo, Newparams, eventId, pageId, itemId) {
    if (typeof (Newparams) !== typeof (EventInfo.parameters))
        return false;

    EventInfo.parameters = Newparams;

    const EventItemIndex = EventInfo.EventItemIndex;
    for (let i = 0; i < $dataMap.events[eventId].pages[pageId].list.length; ++i) {
        let RealEventInfo = $dataMap.events[eventId].pages[pageId].list[i];
        if (RealEventInfo.EventItemIndex !== EventItemIndex)
            continue;

        RealEventInfo.parameters = Newparams;

        changedAnyThing = true
        return true
    }
    alert('失败: 修改未正常同步！')
    return false
}

// 用于处理参数中的单个子参数的修改
var ChangeSubParameter = function (EventInfo, object, paramIndex, inParam, eventId, pageId, itemId, paramId) {
    if (typeof (inParam) !== typeof (object.parameters[paramIndex]))
        return false;

    let Newparam = CheckSubParameter(EventInfo, object, paramIndex, inParam);
    object.parameters[paramIndex] = Newparam;
    // 将object的子参数从parameters拷贝回去
    ResolveSubParameter(EventInfo, object, paramIndex)

    const EventItemIndex = EventInfo.EventItemIndex;
    for (let i = 0; i < $dataMap.events[eventId].pages[pageId].list.length; ++i) {
        let RealEventInfo = $dataMap.events[eventId].pages[pageId].list[i];
        if (RealEventInfo.EventItemIndex !== EventItemIndex)
            continue;

        let realObject = RealEventInfo.parameters[paramId]
        PrepareSubParameter(RealEventInfo, realObject, paramId);
        realObject.parameters[paramIndex] = Newparam;
        // 将object的子参数从parameters拷贝回去
        ResolveSubParameter(RealEventInfo, realObject, paramIndex)

        changedAnyThing = true
        return true
    }
    alert('失败: 修改未正常同步！')
    return false
}

// ============================================================================= //
// 事件处理函数
// ============================================================================= //
// 获取事件的类型名
var GetEventCodeName = function (EventInfo) {
    if (EventInfo) {
        if (EventInfo.code === 0) {
            return ""
        }
        else if (EventInfo.code === 101) {
            return "文本-窗口:"
        }
        else if (EventInfo.code === 401) {
            return "文本-文字:"
        }
        else if (EventInfo.code === 123) {
            return "独立开关操作:"
        }
        else if (EventInfo.code === 230) {
            return "等待:"
        }
        else if (EventInfo.code === 231) {
            return "显示图片:"
        }
        else if (EventInfo.code === 108) {
            return "注释:"
        }
        else if (EventInfo.code === 352) {
            return "打开存档画面"
        }
        else if (EventInfo.code === 355) {
            return "脚本"
        }
        else if (EventInfo.code === 205) {
            return "设置移动路线-开始"
        }
        else if (EventInfo.code === 205) {
            return "设置移动路线-开始"
        }
        else if (EventInfo.code === 505) {
            return "设置移动路线-执行"
        }
        else if (EventInfo.code === 201) {
            return "场所移动"
        }
        else if (EventInfo.code === 356) {
            return "插件指令"
        }
        else if (EventInfo.code === 213) {
            return "显示气泡图标"
        }
        else if (EventInfo.code === 250) {
            return "播放SE"
        }
        else if (EventInfo.code === 211) {
            return "更改透明状态"
        }
        else
            return "暂未支持的事件"
    } else {
        return "";
    }
}

// 设置移动路线的执行类型
const MoveCodeType = ["",
    "向下移动", "向左移动", "向右移动", "向上移动", "向左下移动",
    "向右下移动", "向左上移动", "向右上移动", "随机移动", "接近玩家",
    "远离玩家", "前进一步", "后退一步", "跳跃", "等待",
    "朝向下方", "朝向左方", "朝向右方", "朝向上方", "右转90°",
    "左转90°", "后转180°", "向左或向右转90°", "随机转向", "朝向玩家",
    "背向玩家", "打开开关", "关闭开关", "更改移动速度", "更改移动频率",
    "开启步行动画", "关闭步行动画", "开启踏步动画", "关闭踏步动画", "开启固定朝向",
    "关闭固定朝向", "打开穿透", "关闭穿透", "开启透明状态", "关闭透明状态",
    "更改图像", "更改不透明度", "更改合成方式", "播放SE", "脚本"
];

// 气泡图标类型
const BallonsType = ["",
    "惊讶", "问号", "音符", "心形", "生气",
    "流汗", "纠结", "沉默", "灯泡", "Zzz",
    "自定义1", "自定义2", "自定义3", "自定义4", "自定义5"
];

// 处理指定参数并返回各种相关的信息
var ProcessParameter = function (EventInfo, paramIndex) {
    if (EventInfo) {
        // 空白事件
        if (EventInfo.code === 0) {
            return ["", "", ""]
        }
        // 文本 - 窗口
        else if (EventInfo.code === 101) {
            if (paramIndex === 0) {
                return ["脸图", EventInfo.parameters[paramIndex], "字符串的引号不能丢"];
            }
            else if (paramIndex === 1) {
                return ["脸图序号", EventInfo.parameters[paramIndex], ""];
            }
            else if (paramIndex === 2) {
                return ["背景",
                    EventInfo.parameters[paramIndex] === 0 ? "窗口" : (EventInfo.parameters[paramIndex] === 1 ? "暗淡" : "透明"),
                    "0: 窗口, 1: 暗淡, 2: 透明"
                ];
            }
            else if (paramIndex === 3) {
                return ["窗口位置",
                    EventInfo.parameters[paramIndex] === 0 ? "顶部" : (EventInfo.parameters[paramIndex] === 1 ? "中间" : "底部"),
                    "0: 顶部, 1: 中间, 2: 底部"
                ];
            }
            else if (paramIndex === 4) {
                return ["名称", EventInfo.parameters[paramIndex], "字符串的引号不能丢"];
            }
        }
        // 文本 - 文本
        else if (EventInfo.code === 401) {
            return ["文本", EventInfo.parameters[0], "字符串的引号不能丢"];
        }
        // 独立开关操作
        else if (EventInfo.code === 123) {
            if (paramIndex === 0) {
                return ["独立开关", EventInfo.parameters[paramIndex], "字符串的引号不能丢"];
            }
            else if (paramIndex === 1) {
                return ["操作",
                    EventInfo.parameters[paramIndex] === 0 ? "开启" : "关闭",
                    "0: 开启, 1: 关闭"
                ];
            }
        }
        // 等待
        else if (EventInfo.code === 230) {
            return ["持续时间", EventInfo.parameters[0] + "帧", ""];
        }
        // 显示图片
        else if (EventInfo.code === 231) {
            if (paramIndex === 0) {
                return ["编号", EventInfo.parameters[paramIndex], ""];
            }
            else if (paramIndex === 1) {
                return ["图像", EventInfo.parameters[paramIndex], "字符串的引号不能丢"];
            }
            else if (paramIndex === 2) {
                return ["原点",
                    EventInfo.parameters[paramIndex] === 0 ? "左上" : "中心",
                    "0: 左上, 1: 中心"
                ];
            }
            else if (paramIndex === 3) {
                return ["指定方式",
                    EventInfo.parameters[paramIndex] === 0 ? "直接指定" : "变量指定",
                    "0: 直接指定, 1: 变量指定"
                ];
            }
            else if (paramIndex === 4) {
                let useVar = (EventInfo.parameters[3] === 0 ? false : true)
                return ["横坐标",
                    useVar ? $dataSystem.variables[EventInfo.parameters[paramIndex]] : EventInfo.parameters[paramIndex],
                    "直接指定:填数值, 变量指定:填变量序号"
                ];
            }
            else if (paramIndex === 5) {
                let useVar = (EventInfo.parameters[3] === 0 ? false : true)
                return ["纵坐标",
                    useVar ? $dataSystem.variables[EventInfo.parameters[paramIndex]] : EventInfo.parameters[paramIndex],
                    "直接指定:填数值, 变量指定:填变量序号"
                ];
            }
            else if (paramIndex === 6) {
                return ["缩放率-宽", EventInfo.parameters[paramIndex] + "%", ""];
            }
            else if (paramIndex === 7) {
                return ["缩放率-高", EventInfo.parameters[paramIndex] + "%", ""];
            }
            else if (paramIndex === 8) {
                return ["不透明度", EventInfo.parameters[paramIndex], ""];
            }
            else if (paramIndex === 9) {
                let blend = EventInfo.parameters[paramIndex];
                return ["合成方式",
                    blend === 0 ? "正常" : (blend === 1 ? "叠加" : (blend === 2 ? "正片叠底" : "滤色")),
                    "0: 正常, 1: 叠加, 2: 正片叠底, 3: 滤色"
                ];
            }
        }
        // 注释
        else if (EventInfo.code === 108) {
            return ["注释", EventInfo.parameters[0], "字符串的引号不能丢"];
        }
        // 脚本
        else if (EventInfo.code === 355) {
            return ["脚本", EventInfo.parameters[0], "字符串的引号不能丢"];
        }
        // 设置移动路线-开始
        else if (EventInfo.code === 205) {
            if (paramIndex === 0) {
                return ["目标",
                    (EventInfo.parameters[paramIndex] === -1 ? "玩家" : (EventInfo.parameters[paramIndex] === 0 ? "本事件" : $dataMap.events[EventInfo.parameters[paramIndex]].name)),
                    "-1: 玩家, 0: 本事件, 其他：对应事件"
                ];
            }
            else if (paramIndex === 1) {
                const repeat = (EventInfo.parameters[paramIndex].repeat ? "循环执行" : "") + " ";
                const skippable = (EventInfo.parameters[paramIndex].skippable ? "无法移动时跳过指令" : "") + " ";
                const wait = (EventInfo.parameters[paramIndex].wait ? "等待完成" : "");
                return ["执行状态",
                    repeat + skippable + wait,
                    "repeat: 循环执行, skippable: 无法移动时跳过指令, wait: 等待完成"
                ];
            }
        }
        // 设置移动路线-执行
        else if (EventInfo.code === 505) {
            const code = EventInfo.parameters[0].code
            let final = MoveCodeType[code] + " ";
            let hint = ""
            // 跳跃
            if (code === 14) {
                const parameters = EventInfo.parameters[0].parameters;
                final += (parameters[0] >= 0 ? "+" : "") + parameters[0] + ", ";
                final += (parameters[1] >= 0 ? "+" : "") + parameters[1];
                hint = "parameters两个值分别是横纵偏移"
            }
            // 等待
            else if (code === 15) {
                const parameters = EventInfo.parameters[0].parameters;
                final += parameters[0] + "帧";
                hint = "parameters值是等待时间"
            }
            // 打开开关
            else if (code === 27) {
                const parameters = EventInfo.parameters[0].parameters;
                final += $dataSystem.switches[parameters[0]]
                hint = "parameters值是开关序号"
            }
            // 关闭开关
            else if (code === 28) {
                const parameters = EventInfo.parameters[0].parameters;
                final += $dataSystem.switches[parameters[0]]
                hint = "parameters值是开关序号"
            }
            // 移动速度
            else if (code === 29) {
                const parameters = EventInfo.parameters[0].parameters;
                let desc = ""
                if (parameters[0] === 1) 
                    desc = "1/8倍速"
                else if (parameters[0] === 2)
                    desc = "1/4倍速"
                else if (parameters[0] === 3)
                    desc = "1/2倍速"
                else if (parameters[0] === 4)
                    desc = "标准速度"
                else if (parameters[0] === 5)
                    desc = "2倍速"
                else if (parameters[0] === 6)
                    desc = "4倍速"
                final += desc;
                hint = "parameters值是速度值，1:1/8倍速 2:1/4倍速 3:1/2倍速 4:标准速度 5:2倍速 6:4倍速"
            }
            // 移动频率
            else if (code === 30) {
                const parameters = EventInfo.parameters[0].parameters;
                let desc = ""
                if (parameters[0] === 1)
                    desc = "最低"
                else if (parameters[0] === 2)
                    desc = "低"
                else if (parameters[0] === 3)
                    desc = "标准"
                else if (parameters[0] === 4)
                    desc = "高"
                else if (parameters[0] === 5)
                    desc = "最高"
                final += desc;
                hint = "parameters值是频率，1:最低 2:低 3:标准 4:高 5:最高"
            }
            // 图像
            else if (code === 41) {
                const parameters = EventInfo.parameters[0].parameters;
                final += parameters[0];
                final += "(" + parameters[1] + ")";
                hint = "parameters值是图像和序号"
            }
            // 不透明度
            else if (code === 42) {
                const parameters = EventInfo.parameters[0].parameters;
                final += parameters[0];
                hint = "parameters值是不透明度"
            }
            // 合成方式
            else if (code === 43) {
                const parameters = EventInfo.parameters[0].parameters;
                let desc = ""
                if (parameters[0] === 0)
                    desc = "正常"
                else if (parameters[0] === 1)
                    desc = "叠加"
                else if (parameters[0] === 2)
                    desc = "正片叠底"
                else if (parameters[0] === 3)
                    desc = "滤色"
                final += desc;
                hint = "parameters值是合成方式，0:正常 1:叠加 2:正片叠底 3:滤色"
            }
            // 播放SE
            else if (code === 44) {
                const parameters = EventInfo.parameters[0].parameters;

                const name = parameters[0].name;
                const volume = parameters[0].volume;
                const pitch = parameters[0].pitch;
                const pan = parameters[0].pan;
                final += name + "  (" + volume + ", " + pitch + ", " + pan + ")";
                hint = "parameters值是音效参数 name: SE, volume: 音量, pitch: 音调, pan: 声像"
            }
            // 脚本
            else if (code === 45) {
                const parameters = EventInfo.parameters[0].parameters;
                final += parameters[0];
                hint = "parameters值是脚本"
            }
            return ["执行", final, "code对应编辑器内从左到右的序号 " + hint];
        }
        // 场所移动
        else if (EventInfo.code === 201) {
            if (paramIndex === 0) {
                return ["类型",
                    EventInfo.parameters[paramIndex] === 0 ? "直接指定" : "变量指定",
                    "0: 直接指定, 1: 变量指定"
                ];
            }
            else if (paramIndex === 1) {             
                return ["地图", $dataMapInfos[EventInfo.parameters[paramIndex]].name, "地图ID"];
            }
            else if (paramIndex === 2) {
                let useVar = (EventInfo.parameters[0] === 0 ? false : true)
                return ["横坐标",
                    useVar ? $dataSystem.variables[EventInfo.parameters[paramIndex]] : EventInfo.parameters[paramIndex],
                    "直接指定:填数值, 变量指定:填变量序号"
                ];
            }
            else if (paramIndex === 3) {
                let useVar = (EventInfo.parameters[0] === 0 ? false : true)
                return ["纵坐标",
                    useVar ? $dataSystem.variables[EventInfo.parameters[paramIndex]] : EventInfo.parameters[paramIndex],
                    "直接指定:填数值, 变量指定:填变量序号"
                ];
            }
            else if (paramIndex === 4) {
                let dir = EventInfo.parameters[paramIndex];
                return ["方向",
                    dir === 0 ? "不变" : (dir === 1 ? "下" : (dir === 2 ? "左" : (dir === 3 ? "右" : "上"))),
                    "0: 不变, 1: 下, 2: 左, 3: 右, 4: 上"
                ];
            }
            else if (paramIndex === 5) {
                let fade = EventInfo.parameters[paramIndex];
                return ["淡入淡出",
                    fade === 0 ? "黑" : (fade === 1 ? "白" : "无"),
                    "0: 黑, 1: 白, 2: 无"
                ];
            }
        }
        // 插件指令
        else if (EventInfo.code === 356) {
            return ["插件指令", EventInfo.parameters[0], "字符串的引号不能丢"];
        }
        // 显示气泡图标
        else if (EventInfo.code === 213) {
            if (paramIndex === 0) {
                return ["人物",
                    (EventInfo.parameters[paramIndex] === -1 ? "玩家" : (EventInfo.parameters[paramIndex] === 0 ? "本事件" : $dataMap.events[EventInfo.parameters[paramIndex]].name)),
                    "-1: 玩家, 0: 本事件, 其他：对应事件"
                ];
            }
            else if (paramIndex === 1) {
                const hint = "1:惊讶, 2:问号, 3:音符, 4:心形, 5:生气, 6:流汗, 7:纠结, 8:沉默, 9:灯泡, 10:Zzz, 11:自定义1, 12:自定义2, 13:自定义3, 14:自定义4, 15:自定义5"
                return ["气泡图标", BallonsType[EventInfo.parameters[paramIndex]], hint];
            }
            else if (paramIndex === 2) {
                return ["等待完成",
                    EventInfo.parameters[paramIndex] ? "等待完成" : "",
                    "true: 是 false: 否"
                ];
            }
        }
        // 播放SE
        else if (EventInfo.code === 250) {
            const name = EventInfo.parameters[0].name;
            const volume = EventInfo.parameters[0].volume;
            const pitch = EventInfo.parameters[0].pitch;
            const pan = EventInfo.parameters[0].pan;
            return ["参数",
                name + "  (" + volume + ", " + pitch + ", " + pan + ")",
                "name: SE, volume: 音量, pitch: 音调, pan: 声像"
            ];
        }
        // 更改透明状态
        else if (EventInfo.code === 211) {
            if (paramIndex === 0) {
                return ["操作",
                    EventInfo.parameters[paramIndex] === 0 ? "开启" : "关闭",
                    "0: 开启, 1: 关闭"
                ];
            }
        }
        else {
            return ["暂未支持的参数", "", ""]
        }
    }
    else {
        return ["", "", ""]
    }
    return ["", "", ""]
}

// 是否是需要编辑子参数的object
var IfSubParameter = function (EventInfo, object, paramIndex) {
    if (EventInfo) {
        // 设置移动路线-开始
        if (EventInfo.code === 205) {
            // 执行状态
            if (paramIndex === 1)
                return true
        }
        // 设置移动路线-执行
        else if (EventInfo.code === 505) {
            return true
        }
        // 播放SE
        else if (EventInfo.code === 250) {
            return true
        }
    }
    return false
}

// 为没有parameters但是还需要编辑的object添加
var PrepareSubParameter = function (EventInfo, object, paramIndex) {
    if (EventInfo) {
        // 设置移动路线-开始
        if (EventInfo.code === 205) {
            // 执行状态
            if (paramIndex === 1) {
                object.parameters = [object.repeat, object.skippable, object.wait];
            }
        }
        // 设置移动路线-执行
        else if (EventInfo.code === 505) {
            // 播放SE
            if (object.code === 44) {
                const SE = object.parameters[0]
                object.parameters = [SE, SE.name, SE.volume, SE.pitch, SE.pan]
            }
        }
        // 播放SE
        else if (EventInfo.code === 250) {
            object.parameters = [object.name, object.volume, object.pitch, object.pan]
        }
    }
}

// 处理object参数的子参数并返回各种相关的信息
var ProcessSubParameter = function (EventInfo, object, paramIndex) {
    if (EventInfo) {
        // 设置移动路线-开始
        if (EventInfo.code === 205) {
            if (paramIndex === 0) {
                return ["循环执行", object.parameters[paramIndex], "true: 是, false: 否"];
            }
            else if (paramIndex === 1) {
                return ["无法移动时跳过指令", object.parameters[paramIndex], "true: 是, false: 否"];
            }
            else if (paramIndex === 2) {
                return ["等待完成", object.parameters[paramIndex], "true: 是, false: 否"];
            }
        }
        // 设置移动路线-执行
        else if (EventInfo.code === 505) {
            // 跳跃
            if (object.code === 14) {
                if (paramIndex === 0) {
                    return ["横坐标", (object.parameters[paramIndex] >= 0 ? "+" : "") + object.parameters[paramIndex], ""];
                }
                else if (paramIndex === 1) {
                    return ["纵坐标", (object.parameters[paramIndex] >= 0 ? "+" : "") + object.parameters[paramIndex], ""];
                }
            }
            // 等待
            else if (object.code === 15) {
                return ["等待时间", object.parameters[0] + "帧", ""];
            }
            // 打开开关
            else if (object.code === 27) {
                return ["开关", $dataSystem.switches[object.parameters[0]], "开关序号"];
            }
            // 关闭开关
            else if (object.code === 28) {
                return ["开关", $dataSystem.switches[object.parameters[0]], "开关序号"];
            }
            // 移动速度
            else if (object.code === 29) {
                const speed = object.parameters[0];
                let desc = ""
                if (speed === 1)
                    desc = "1/8倍速"
                else if (speed === 2)
                    desc = "1/4倍速"
                else if (speed === 3)
                    desc = "1/2倍速"
                else if (speed === 4)
                    desc = "标准速度"
                else if (speed === 5)
                    desc = "2倍速"
                else if (speed === 6)
                    desc = "4倍速"
                return ["移动速度", desc, "1:1/8倍速 2:1/4倍速 3:1/2倍速 4:标准速度 5:2倍速 6:4倍速"];
            }
            // 移动频率
            else if (object.code === 30) {
                let desc = ""
                if (object.parameters[0] === 1)
                    desc = "最低"
                else if (object.parameters[0] === 2)
                    desc = "低"
                else if (object.parameters[0] === 3)
                    desc = "标准"
                else if (object.parameters[0] === 4)
                    desc = "高"
                else if (object.parameters[0] === 5)
                    desc = "最高"
                return ["移动频率", desc, "1:最低 2:低 3:标准 4:高 5:最高"];
            }
            // 图像
            else if (object.code === 41) {
                if (paramIndex === 0) {
                    return ["图像", object.parameters[paramIndex], "字符串的引号不能丢"];
                }
                else if (paramIndex === 1) {
                    return ["编号", object.parameters[paramIndex], ""];
                }
            }
            // 不透明度
            else if (object.code === 42) {
                return ["不透明度", object.parameters[0], ""];
            }
            // 合成方式
            else if (object.code === 43) {
                let desc = ""
                if (object.parameters[0] === 0)
                    desc = "正常"
                else if (object.parameters[0] === 1)
                    desc = "叠加"
                else if (object.parameters[0] === 2)
                    desc = "正片叠底"
                else if (object.parameters[0] === 3)
                    desc = "滤色"
                return ["合成方式", desc, "0:正常 1:叠加 2:正片叠底 3:滤色"];
            }
            // 播放SE
            else if (object.code === 44) {
                if (paramIndex === 0) {
                    const name = object.parameters[paramIndex].name;
                    const volume = object.parameters[paramIndex].volume;
                    const pitch = object.parameters[paramIndex].pitch;
                    const pan = object.parameters[paramIndex].pan;
                    return ["参数",
                        name + "  (" + volume + ", " + pitch + ", " + pan + ")",
                        "name: SE, volume: 音量, pitch: 音调, pan: 声像"
                    ];
                }
                else if (paramIndex === 1) {
                    return ["SE", object.parameters[paramIndex], "字符串的引号不能丢"];
                }
                else if (paramIndex === 2) {
                    return ["音量", object.parameters[paramIndex], ""];
                }
                else if (paramIndex === 3) {
                    return ["音调", object.parameters[paramIndex], ""];
                }
                else if (paramIndex === 4) {
                    return ["声像", object.parameters[paramIndex], ""];
                }
            }
            // 脚本
            else if (object.code === 45) {
                return ["脚本", object.parameters[0], "字符串的引号不能丢"];
            }
        }
        // 播放SE
        else if (EventInfo.code === 250) {
            if (paramIndex === 0) {
                return ["SE", object.parameters[paramIndex], "字符串的引号不能丢"];
            }
            else if (paramIndex === 1) {
                return ["音量", object.parameters[paramIndex], ""];
            }
            else if (paramIndex === 2) {
                return ["音调", object.parameters[paramIndex], ""];
            }
            else if (paramIndex === 3) {
                return ["声像", object.parameters[paramIndex], ""];
            }
        }
        else {
            return ["暂未支持的参数", "", ""]
        }
    }
    else {
        return ["", "", ""]
    }
    return ["", "", ""]
}

// 检查非object参数的值是否合理，避免非法值
var CheckParameter = function (EventInfo, paramIndex, newParam) {
    if (EventInfo) {
        // 空白事件
        if (EventInfo.code === 0) {
            return newParam
        }
        // 文本 - 窗口
        else if (EventInfo.code === 101) {
            if (paramIndex === 0) {
                return newParam;
            }
            else if (paramIndex === 1) {
                // 脸图序号
                if (newParam < 0)
                    newParam = 0
                return newParam;
            }
            else if (paramIndex === 2) {
                // 背景
                if (newParam < 0)
                    newParam = 0
                if (newParam > 2)
                    newParam = 2
                return newParam;
            }
            else if (paramIndex === 3) {
                //窗口位置
                if (newParam < 0)
                    newParam = 0
                if (newParam > 2)
                    newParam = 2
                return newParam;
            }
            else if (paramIndex === 4) {
                //窗口位置
                if (newParam < 0)
                    newParam = 0
                if (newParam > 2)
                    newParam = 2
                return newParam;
            }
        }
        // 文本 - 文本
        else if (EventInfo.code === 401) {
            return newParam;
        }
        // 独立开关操作
        else if (EventInfo.code === 123) {
            if (paramIndex === 0) {
                return newParam;
            }
            else if (paramIndex === 1) {
                //操作
                if (newParam < 0)
                    newParam = 0
                if (newParam > 1)
                    newParam = 1
                return newParam;
            }
        }
        // 等待
        else if (EventInfo.code === 230) {
            //持续时间
            if (newParam < 0)
                newParam = 0
            return newParam;
        }
        // 显示图片
        else if (EventInfo.code === 231) {
            if (paramIndex === 0) {
                //编号
                if (newParam < 0)
                    newParam = 0
                return newParam;
            }
            else if (paramIndex === 1) {
                return newParam;
            }
            else if (paramIndex === 2) {
                //原点
                if (newParam < 0)
                    newParam = 0
                if (newParam > 1)
                    newParam = 1
                return newParam;
            }
            else if (paramIndex === 3) {
                //指定方式
                if (newParam < 0)
                    newParam = 0
                if (newParam > 1)
                    newParam = 1
                return newParam;
            }
            else if (paramIndex === 4) {
                let useVar = (EventInfo.parameters[3] === 0 ? false : true)
                if (useVar) {
                    //横坐标
                    if (newParam < 0)
                        newParam = 0
                }
                return newParam;
            }
            else if (paramIndex === 5) {
                let useVar = (EventInfo.parameters[3] === 0 ? false : true)
                if (useVar) {
                    //纵坐标
                    if (newParam < 0)
                        newParam = 0
                }
                return newParam;
            }
            else if (paramIndex === 6) {
                //缩放率-宽
                return newParam;
            }
            else if (paramIndex === 7) {
                //缩放率-高
                return newParam;
            }
            else if (paramIndex === 8) {
                //不透明度
                if (newParam < 0)
                    newParam = 0
                if (newParam > 255)
                    newParam = 255
                return newParam;
            }
            else if (paramIndex === 9) {
                //合成方式
                if (newParam < 0)
                    newParam = 0
                if (newParam > 3)
                    newParam = 3
                return newParam;
            }
        }
        // 注释
        else if (EventInfo.code === 108) {
            return newParam;
        }
        // 脚本
        else if (EventInfo.code === 355) {
            return newParam;
        }
        // 设置移动路线-开始
        else if (EventInfo.code === 205) {
            // 目标
            if (paramIndex === 0) {
                if (newParam < -1)
                    newParam = -1
                if (newParam >= $dataMap.events.length)
                    newParam = $dataMap.events.length - 1
                return newParam;
            }
            // 状态 object类型，由CheckSubParameter处理
            else if (paramIndex === 1) {
                return newParam;
            }
        }
        // 设置移动路线-执行
        else if (EventInfo.code === 505) {
            // object类型，由CheckSubParameter处理
            return newParam;
        }
        // 场所移动
        else if (EventInfo.code === 201) {
            // 类型
            if (paramIndex === 0) {
                if (newParam < 0)
                    newParam = 0
                if (newParam > 1)
                    newParam = 1
                return newParam;
            }
            // 地图
            else if (paramIndex === 1) {
                if (newParam < 1)
                    newParam = 1
                if (newParam >= $dataMapInfos.length)
                    newParam = $dataMapInfos.length - 1
                return newParam;
            }
            //横坐标
            else if (paramIndex === 2) {
                let useVar = (EventInfo.parameters[0] === 0 ? false : true)
                if (useVar) {
                    if (newParam < 0)
                        newParam = 0
                }
                return newParam;
            }
            //纵坐标
            else if (paramIndex === 3) {
                let useVar = (EventInfo.parameters[0] === 0 ? false : true)
                if (useVar) {
                    if (newParam < 0)
                        newParam = 0
                }
                return newParam;
            }
            // 方向
            else if (paramIndex === 4) {
                if (newParam < 0)
                    newParam = 0
                if (newParam > 4)
                    newParam = 4
                return newParam;
            }
            // 淡入淡出
            else if (paramIndex === 5) {
                if (newParam < 0)
                    newParam = 0
                if (newParam > 2)
                    newParam = 2
                return newParam;
            }
        }
        // 插件指令
        else if (EventInfo.code === 356) {
            return newParam;
        }
        // 气泡图标
        else if (EventInfo.code === 213) {
            // 目标
            if (paramIndex === 0) {
                if (newParam < -1)
                    newParam = -1
                if (newParam >= $dataMap.events.length)
                    newParam = $dataMap.events.length - 1
                return newParam;
            }
            // 气泡图标
            else if (paramIndex === 1) {
                if (newParam < 1)
                    newParam = 1
                if (newParam >= BallonsType.length)
                    newParam = BallonsType.length - 1
                return newParam;
            }
            // 等待完成
            else if (paramIndex === 2) {
                return newParam;
            }
        }
        // 播放SE
        else if (EventInfo.code === 250) {
            // object类型，由CheckSubParameter处理
            return newParam;
        }
        // 更改透明状态
        else if (EventInfo.code === 211) {
            //操作
            if (paramIndex === 0) {
                if (newParam < 0)
                    newParam = 0
                if (newParam > 1)
                    newParam = 1
                return newParam;
            }
        }
        else {
            return newParam;
        }
    }
    else {
        return newParam;
    }
    return newParam;
}

// 检查object参数的子参数的值是否合理，避免非法值
var CheckSubParameter = function (EventInfo, object, paramIndex, newParam) {
    if (EventInfo) {
        // 设置移动路线-开始
        if (EventInfo.code === 205) {
            return newParam;
        }
        // 设置移动路线-执行
        else if (EventInfo.code === 505) {
            // 跳跃
            if (object.code === 14) {
                return newParam;
            }
            // 等待
            else if (object.code === 15) {
                if (newParam < 0)
                    newParam = 0
                return newParam;
            }
            // 打开开关
            else if (object.code === 27) {
                if (newParam < 1)
                    newParam = 1
                return newParam;
            }
            // 关闭开关
            else if (object.code === 28) {
                if (newParam < 1)
                    newParam = 1
                return newParam;
            }
            // 移动速度
            else if (object.code === 29) {
                if (newParam < 1)
                    newParam = 1
                if (newParam > 6)
                    newParam = 6
                return newParam;
            }
            // 移动频率
            else if (object.code === 30) {
                if (newParam < 1)
                    newParam = 1
                if (newParam > 5)
                    newParam = 5
                return newParam;
            }
            // 图像
            else if (object.code === 41) {
                if (paramIndex === 1) {
                    if (newParam < 0)
                        newParam = 0
                    return newParam;
                }
            }
            // 不透明度
            else if (object.code === 42) {
                if (newParam < 0)
                    newParam = 0
                if (newParam > 255)
                    newParam = 255
                return newParam;
            }
            // 合成方式
            else if (object.code === 43) {
                if (newParam < 0)
                    newParam = 0
                if (newParam > 3)
                    newParam = 3
                return newParam;
            }
            // 播放SE
            else if (object.code === 44) {
                if (paramIndex == 0) {
                    if (newParam.volume < 0)
                        newParam.volume = 0
                    if (newParam.volume > 100)
                        newParam.volume = 100

                    if (newParam.pitch < 50)
                        newParam.pitch = 50
                    if (newParam.pitch > 150)
                        newParam.pitch = 150

                    if (newParam.pan < -100)
                        newParam.pan = -100
                    if (newParam.pan > 100)
                        newParam.pan = 100

                    return newParam
                }
                // 音量
                else if (paramIndex == 2) {
                    if (newParam < 0)
                        newParam = 0
                    if (newParam > 100)
                        newParam = 100
                    return newParam
                }
                // 音调
                else if (paramIndex == 3) {
                    if (newParam < 50)
                        newParam = 50
                    if (newParam > 150)
                        newParam = 150
                    return newParam
                }
                // 声像
                else if (paramIndex == 4) {
                    if (newParam < -100)
                        newParam = -100
                    if (newParam > 100)
                        newParam = 100
                    return newParam
                }

                return newParam;
            }
            // 脚本
            else if (object.code === 45) {
                return newParam;
            }
        }
        // 播放SE
        else if (EventInfo.code === 250) {
            // 音量
            if (paramIndex == 1) {
                if (newParam < 0)
                    newParam = 0
                if (newParam > 100)
                    newParam = 100
                return newParam
            }
            // 音调
            else if (paramIndex == 2) {
                if (newParam < 50)
                    newParam = 50
                if (newParam > 150)
                    newParam = 150
                return newParam
            }
            // 声像
            else if (paramIndex == 3) {
                if (newParam < -100)
                    newParam = -100
                if (newParam > 100)
                    newParam = 100
                return newParam
            }

            return newParam;
        }
        else {
            return newParam;
        }
    }
    else {
        return newParam;
    }
    return newParam;
}

// 将object参数的parameters拷贝回子参数
var ResolveSubParameter = function (EventInfo, object, paramIndex) {
    if (EventInfo) {
        // 设置移动路线-开始
        if (EventInfo.code === 205) {
            if (paramIndex === 0) {
                object.repeat = object.parameters[paramIndex]
            }
            else if (paramIndex === 1) {
                object.skippable = object.parameters[paramIndex]
            }
            else if (paramIndex === 2) {
                object.wait = object.parameters[paramIndex]
            }
        }
        // 设置移动路线-执行
        else if (EventInfo.code === 505) {
            // 播放SE
            if (object.code === 44) {
                let SE = object.parameters[0]
                if (paramIndex == 0) {
                    object.parameters[1] = SE.name
                    object.parameters[2] = SE.volume
                    object.parameters[3] = SE.pitch
                    object.parameters[4] = SE.pan
                }
                // SE
                else if (paramIndex == 1) {
                    SE.name = object.parameters[paramIndex]
                }
                // 音量
                else if (paramIndex == 2) {
                    SE.volume = object.parameters[paramIndex]
                }
                // 音调
                else if (paramIndex == 3) {
                    SE.pitch = object.parameters[paramIndex]
                }
                // 声像
                else if (paramIndex == 4) {
                    SE.pan = object.parameters[paramIndex]
                }
            }
        }
        // 播放SE
        else if (EventInfo.code === 250) {
            // SE
            if (paramIndex == 0) {
                object.name = object.parameters[paramIndex]
            }
            // 音量
            else if (paramIndex == 1) {
                object.volume = object.parameters[paramIndex]
            }
            // 音调
            else if (paramIndex == 2) {
                object.pitch = object.parameters[paramIndex]
            }
            // 声像
            else if (paramIndex == 3) {
                object.pan = object.parameters[paramIndex]
            }
        }
    }
}

// 获取事件的参数状态
var GetEventCodeStatus = function (EventInfo) {
    if (EventInfo) {
        // 空白事件
        if (EventInfo.code === 0) {
            return ""
        }
        // 文本 - 窗口
        else if (EventInfo.code === 101) {
            let face = ProcessParameter(EventInfo, 0)[1]
            let index = ProcessParameter(EventInfo, 1)[1]
            let background = ProcessParameter(EventInfo, 2)[1];
            let position = ProcessParameter(EventInfo, 3)[1];
            let name = ""
            if (Utils.RPGMAKER_NAME === 'MV') {

            }
            else if (Utils.RPGMAKER_NAME === 'MZ') {
                name = ProcessParameter(EventInfo, 4)[1] + " "
            }
            return name + face + "(" + index + ") " + background + " " + position;
        }
        // 文本 - 文本
        else if (EventInfo.code === 401) {
            return ProcessParameter(EventInfo, 0)[1];
        }
        // 独立开关操作
        else if (EventInfo.code === 123) {
            let name = ProcessParameter(EventInfo, 0)[1]
            let status = ProcessParameter(EventInfo, 1)[1]
            return name + "=" + status;
        }
        // 等待
        else if (EventInfo.code === 230) {
            return ProcessParameter(EventInfo, 0)[1];
        }
        // 显示图片
        else if (EventInfo.code === 231) {
            let id = ProcessParameter(EventInfo, 0)[1]
            let pic = ProcessParameter(EventInfo, 1)[1]

            let center = ProcessParameter(EventInfo, 2)[1]
            let useVar = (EventInfo.parameters[3] === 0 ? false : true)
            let param1 = ProcessParameter(EventInfo, 4)[1]
            let param2 = ProcessParameter(EventInfo, 5)[1]

            let width = ProcessParameter(EventInfo, 6)[1]
            let height = ProcessParameter(EventInfo, 7)[1]
            let alpha = ProcessParameter(EventInfo, 8)[1]
            let blend = ProcessParameter(EventInfo, 9)[1]

            let final = "#" + id + " " + pic + " " + center + " ";
            final += (useVar ? "({" + param1 + "}, {" + param2 + "})" : "(" + param1 + ", " + param2 + ")");
            final += " (" + width + ", " + height + ") " + alpha + " " + blend;
            return final;
        }
        // 注释
        else if (EventInfo.code === 108) {
            return ProcessParameter(EventInfo, 0)[1]
        }
        // 脚本
        else if (EventInfo.code === 355) {
            return ProcessParameter(EventInfo, 0)[1]
        }
        // 设置移动路线-开始
        else if (EventInfo.code === 205) {
            const target = ProcessParameter(EventInfo, 0)[1];
            const status = ProcessParameter(EventInfo, 1)[1];
            return target + " " + status;
        }
        // 设置移动路线-执行
        else if (EventInfo.code === 505) {
            return ProcessParameter(EventInfo, 0)[1];
        }
        // 场所移动
        else if (EventInfo.code === 201) {
            const type = ProcessParameter(EventInfo, 0)[1];
            const map = ProcessParameter(EventInfo, 1)[1];
            let useVar = (EventInfo.parameters[0] === 0 ? false : true)
            let param1 = ProcessParameter(EventInfo, 2)[1]
            let param2 = ProcessParameter(EventInfo, 3)[1]
            const dir = ProcessParameter(EventInfo, 4)[1];
            const fade = ProcessParameter(EventInfo, 5)[1];

            let final = type + " " + map + " ";
            final += (useVar ? "({" + param1 + "}, {" + param2 + "})" : "(" + param1 + ", " + param2 + ") ");
            final += dir + " " + fade;
            return final;
        }
        // 插件指令
        else if (EventInfo.code === 356) {
            return ProcessParameter(EventInfo, 0)[1]
        }
        // 气泡图标
        else if (EventInfo.code === 213) {
            // 目标
            const target = ProcessParameter(EventInfo, 0)[1];
            const ballon = ProcessParameter(EventInfo, 1)[1];
            const wait = ProcessParameter(EventInfo, 2)[1];
            return target + " " + ballon + " " + wait
        }
        // 播放SE
        else if (EventInfo.code === 250) {
            return ProcessParameter(EventInfo, 0)[1];
        }
        // 更改透明状态
        else if (EventInfo.code === 211) {
            return ProcessParameter(EventInfo, 0)[1]
        }
        else
            return "";
    } else {
        return "";
    }
    return "";
}



