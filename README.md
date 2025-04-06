# RuntimeEventDebug

运行时事件调试插件，适用于RMMV和RMMZ

QQ群：***792888538***   欢迎反馈遇到的问题和希望支持的功能

<br/>

## 插件功能：

1. 支持通过注释在事件列表中添加断点，运行时执行到断点注释会触发存档面板以供记录
   * 使用方式：添加注释并写入  ***断点***  即可

![断点](https://github.com/cafel176/RuntimeEventDebug_RMMV_RMMZ/blob/main/pic1.png?raw=true '断点')

<br/>

2. 支持指定一张地图，运行时该地图内的所有事件前都会触发存档面板以供记录
   * 使用方式：在地图备注中写入   ***断点调试***   即可

![断点调试](https://github.com/cafel176/RuntimeEventDebug_RMMV_RMMZ/blob/main/pic2.png?raw=true '断点调试')

<br/>

3. 支持运行时在任意时间打开读档界面，快捷键   ***F10***

<br/>

4. 支持运行时对事件进行调试编辑，快捷键   ***F9***   打开Debug面板
   
   * 可以修改事件的参数并保存，退出Debug面板时会自动保存事件的修改到地图数据中，修改后的事件再次触发即可按照修改后的效果执行
   
   * 退出Debug面板时会自动将旧的地图数据备份并用新的地图数据覆盖<br/>
     如果是MV，则需要关闭编辑器再打开以载入最新修改<br/>
     如果是MZ，编辑器会提示数据有变更并支持重新载入数据
   
   * 旧的地图数据备份位置为 RuntimeEventDebug/Copy，文件名中包含了 月 日 时 分 的时间信息以供识别，如：Map001_4_5_12_31.json

![Debug面板](https://github.com/cafel176/RuntimeEventDebug_RMMV_RMMZ/blob/main/pic3.png?raw=true 'Debug面板')
![Debug面板](https://github.com/cafel176/RuntimeEventDebug_RMMV_RMMZ/blob/main/pic4.png?raw=true 'Debug面板')
![Debug面板](https://github.com/cafel176/RuntimeEventDebug_RMMV_RMMZ/blob/main/pic5.png?raw=true 'Debug面板')   

<br/>

## 事件调试工作流：

1. 在事件列表中要检查的位置之前加入注释断点

2. 开始游戏，进入事件测试

3. 触发断点，保存

4. 执行事件，检查效果是否满意

5. 如效果未达预期，F9通过Debug面板对相应事件进行修改

6. F10读档，再次进行事件测试，如仍不满意，重复上述流程

7. 如效果达到预期，则可以退出游戏

8. RMMV下，编辑器不会自动检测数据修改，需要关闭编辑器重新打开以读取最新数据<br/>
   RMMZ下，编辑器会提示数据被外部修改，此时选择   ***是***   以更新编辑器数据

![重新载入](https://github.com/cafel176/RuntimeEventDebug_RMMV_RMMZ/blob/main/pic6.png?raw=true '重新载入')   

<br/>

> [!CAUTION]
> 警告：尽管有备份机制，仍不能排除因插件冲突导致本插件的运行出现问题的情况，因此为避免问题，使用本插件时请注意自行备份！

<br/>

## 当前支持的事件类型：

- 文本 

- 独立开关操作 

- 等待 

- 显示图片 

- 注释 

- 脚本 

- 设置移动路线 

- 场所移动 

- 插件指令 

- 气泡图标 

- 播放SE 

- 更改透明状态


<br/>

> [!NOTE] 
> 未支持的事件类型会在后续会逐步完善 

<br/>

> [!IMPORTANT] 
> 注意：本插件完全用于开发调试，开发完成后进入部署阶段时，请将本插件关闭避免影响到游戏流程

<br/>

> [!IMPORTANT] 
> 注意：MV版本下对鼠标的支持并不完善，因此请不要用鼠标点击RM的UI，有概率出现文本框自动跳过的问题。完全使用键盘进行调试和读档则可以避免


