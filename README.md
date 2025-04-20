# RuntimeEventDebug

运行时事件调试插件V2

——***以创作者为本，让RM没有难做的演出***

<br/>

适用于RMUnite、RMMZ、RMMV、RMVA、RMVX、RMXP

QQ群：***792888538***   欢迎反馈遇到的问题和希望支持的功能

Unite 视频教程(必看)：https://www.bilibili.com/video/BV1u35WzPEEr/?share_source=copy_web&vd_source=83959be6660f3ec16d301ccce33457e7

<br/>

Unite Project1：https://rpg.blue/forum.php?mod=viewthread&tid=497267&fromuid=2681370

<br/>

MZ/MV 视频教程(必看)：https://www.bilibili.com/video/BV1YURqYMETS/?spm_id_from=333.337.search-card.all.click&vd_source=1f5e08d6a2e054c354714c7090aed591

<br/>

MZ/MV Project1：https://rpg.blue/thread-497192-1-1.html

<br/>

VA/VX/XP 视频教程(必看)：https://www.bilibili.com/video/BV1xbdfYWEQp/?vd_source=1f5e08d6a2e054c354714c7090aed591

<br/>

VA/VX/XP Project1：https://rpg.blue/forum.php?mod=viewthread&tid=497237&fromuid=2681370

<br/>

## 插件功能：

1. 支持通过注释在事件列表中添加断点，运行时执行到断点注释会触发存档面板以供记录
   * 使用方式：添加注释并写入  ***断点#任意字符***  即可；Unite版本下，则最好是  ***断点#任意数字***  ；此处的任意字符要保证每个事件内的所有事件页都不重复
   * 例如：事件A内3个事件页，则事件页1用了断点#001，其他断点都不能再用，即当前事件页1和事件页2、3内的所有其他断点都不能再用001。但是另外一个事件B则无此限制，每个事件是彼此独立的

![断点](https://github.com/cafel176/RuntimeEventDebug/blob/v2/pic1.png?raw=true '断点')

<br/>

2. Unite/MZ/MV 支持运行时在任意时间打开读档界面，快捷键   ***F10***  <br/>
   VA/VX/XP 支持非编辑器测试环境的运行时任意时间打开读档界面，快捷键 ***F9***

<br/>

3. 支持运行时通过编辑器对事件进行调试编辑，当在注释断点处保存游戏后，再次读档会识别上次保存的注释断点位置，并将最新的修改直接应用到该位置
   * ***注意：非Unite版本下，本功能仅限通过注释断点保存的存档，其他插件或普通的存档事件无法触发***
   * ***Unite版本下，由于一些限制，请不要在你保存位置的注释断点前面增删事件项！***
<br/>

## 结合各种功能后，对于一个长流程事件演出的调试工作流如下：

1. 在事件列表中要检查的位置之前加入注释断点

2. Unite/MZ/MV 开始游戏，进入事件测试 <br/>
   VA/VX/XP 在工程双击exe开始游戏，进入事件测试(因为编辑器在测试时是无法修改的)

3. 触发断点，保存

4. 执行事件，检查效果是否满意

5. 如效果未达预期，直接在编辑器中对事件进行修改

6. 此时注意，一定要保存工程！！！

7. (F10 / F9) 读档，再次进行事件测试，如仍不满意，重复上述流程

8. 如效果达到预期，则可以退出游戏

<br/>

> [!IMPORTANT] 
> 注意：本插件完全用于开发调试，开发完成后进入部署阶段时，请将本插件关闭避免影响到游戏流程，VA/VX/XP 则是将$debug_active关闭
