# ============================================================================= //
# RuntimeEventDebug
# ============================================================================= //
#
# 当前版本：V2
# 运行时事件调试插件，适用于RMXP
# 作者： cafel
# QQ群：792888538 
# github地址：https://github.com/cafel176/RuntimeEventDebug
# Project1：https://rpg.blue/forum.php?mod=viewthread&tid=497237&fromuid=2681370
# 视频教程：https://www.bilibili.com/video/BV1xbdfYWEQp/?vd_source=1f5e08d6a2e054c354714c7090aed591
#  
#  ★ 本插件提供如下支持：
#  
#  1. 支持通过注释在事件列表中添加断点，运行时执行到断点注释会触发存档面板以供
#     记录
#     ♦ 使用方式：添加注释并写入“断点#任意字符”即可
#       此处的任意字符要保证每个事件内的所有事件页都不重复
#     ♦ 例如：事件A内3个事件页，则事件页1用了断点#001，其他断点都不能再用，当前
#       事件页和事件页2、3内的所有其他断点都不能再用001
#       但是另外一个事件B则无此限制，每个事件是彼此独立的
#  
#  2. 支持非编辑器测试环境的运行时任意时间打开读档界面，快捷键F9
#  
#  3. 支持运行时对事件进行调试编辑，当在注释断点处保存游戏后，再次读档会识别上
#     次保存的注释断点位置，并将最新的修改直接应用到该位置
#     ♦ 注意：本功能仅限通过注释断点保存的存档，其他插件或普通的存档事件无法
#       触发
#  
#  ★ 结合各种功能后，对于一个长流程事件演出的调试工作流如下：
#     ♦ 在事件列表中要检查的位置之前加入注释断点
#     ♦ 在工程双击exe开始游戏，进入事件测试(因为编辑器在测试时是无法修改的)
#     ♦ 触发断点，保存
#     ♦ 执行事件，检查效果是否满意
#     ♦ 如效果未达预期，直接在编辑器中对事件进行修改
#     ♦ 此时注意，一定要保存工程！！！
#     ♦ F9读档，再次进行事件测试，如仍不满意，重复上述流程
#     ♦ 如效果达到预期，则可以退出游戏
#  
#  ★ 注意：本插件完全用于开发调试，开发完成后进入部署阶段时，请将$debug_active关闭避免影响到游戏流程
$debug_active = true

#--------------------------------------------------------------------------
# * 调试逻辑
#--------------------------------------------------------------------------

# 关键词设置
$break_point = "断点"

# 函数库
module RuntimeEventDebug
  #--------------------------------------------------------------------------
  # * 某些事件不需要或者不能添加存档断点
  #--------------------------------------------------------------------------
  def self.debug_if_skip_event(code)
    # 空白事件，文本 - 文本，注释，打开存档画面
    code_list = [0, 401, 108, 352]
    return code_list.include?(code)
  end

  #--------------------------------------------------------------------------
  # * 对注释文本进行处理
  #--------------------------------------------------------------------------
  def self.debug_process_token(token)
    # 以指定标记开头，一般格式为“断点#任意字符”
    if token.include?($break_point)
        arr = token.split("#")
        if arr.length == 2 && arr[0] == $break_point
            return [true, arr[1]]
        end
    end
    return [false, ""]
  end

  #--------------------------------------------------------------------------
  # * 将注释转化为对应的事件
  #--------------------------------------------------------------------------
  def self.debug_setup_events(list)
    # 事件项表是个数组
    list.each_with_index do |value, index|
        next if value == nil
        # 当前事件是否是注释
        if value.code == 108
            str = value.parameters[0]
            # 检查当前注释是否是指定标记开头
            arr = self.debug_process_token(str)
            if arr[0]
                value.code = 352
            end
        end
    end
    return list
  end

  #--------------------------------------------------------------------------
  # * 对注释事件进行搜索
  #--------------------------------------------------------------------------
  def self.debug_find_comment(interpreter, event, comment)
    find = false
    # 对该事件的每一页遍历
    event.pages.each_with_index do |page, i|
        next if page == nil
        # 事件项表是个数组
        page.list.each_with_index do |itrEvent, j|
            next if itrEvent == nil                                        
            # 当前事件是否是注释
            if itrEvent.code === 352 && itrEvent.parameters.length > 0
                itrStr = itrEvent.parameters[0]
                # 检查当前注释是否是指定标记开头
                itrArr = self.debug_process_token(itrStr)
                # 是注释断点，允许载入
                if itrArr[0]
                    # 注释对得上
                    if comment == itrArr[1]
                        interpreter.list = page.list
                        interpreter.index = j + 1

                        find = true
                        break
                    end
                end
            end
        end

        break if find
    end
  end

  #--------------------------------------------------------------------------
  # * 对上次存档位置进行提取
  #--------------------------------------------------------------------------
  def self.debug_find_save_comment(interpreter, data_map_events)
    # 找到存档时正在触发的事件ID
    eventId = interpreter.event_id
    # 当前场景中仍存在该事件，哈希判断键值存在
    if data_map_events.has_key?(eventId)
        if interpreter.index > 0
            # 找到存档时正在执行的事件项
            checkEvent = interpreter.list[interpreter.index - 1]
            # 当前事件是否是注释断点
            if checkEvent.code === 352 && checkEvent.parameters.length > 0
                checkStr = checkEvent.parameters[0]
                # 检查当前注释是否是指定标记开头
                checkArr = self.debug_process_token(checkStr)
                # 是注释断点，允许载入
                if checkArr[0]
                    self.debug_find_comment(interpreter, data_map_events[eventId], checkArr[1]) 
                end
            end
        end
    end 
  end
end

#--------------------------------------------------------------------------
# * 暴露相应的变量
#--------------------------------------------------------------------------

class Interpreter
  attr_reader   :map_id             # Map ID
  attr_reader   :event_id           # Event ID (normal events only)
  attr_accessor   :list             # list
  attr_accessor   :index            # index
end

#--------------------------------------------------------------------------
# * 载入调试逻辑
#--------------------------------------------------------------------------

class Game_Map
  #--------------------------------------------------------------------------
  # * 暴露@map.events
  #--------------------------------------------------------------------------
  def data_map_events()
    return @map.events
  end

  #--------------------------------------------------------------------------
  # * 载入后处理
  #--------------------------------------------------------------------------
  def before_start()
        # 对用于数据的事件全部进行注释处理
        data_map_events = self.data_map_events()
        # 外层事件表是个哈希
        data_map_events.each do |i, event|  
            next if event == nil
            # 内层事件页列表是个数组，参数顺序是反的
            event.pages.each_with_index do |page, j|
                next if page == nil
                RuntimeEventDebug.debug_setup_events(page.list)
            end
        end

        # 不触发事件的时候也要更新
        # Set map event data
        @events = {}
        for i in @map.events.keys
            @events[i] = Game_Event.new(@map_id, @map.events[i])
        end
        # Set common event data
        @common_events = {}
        for i in 1...$data_common_events.size
            @common_events[i] = Game_CommonEvent.new(i)
        end

        # 更新读档后事件
        RuntimeEventDebug.debug_find_save_comment($game_system.map_interpreter, data_map_events)
  end

  #--------------------------------------------------------------------------
  # * Setup，用于New Game
  #--------------------------------------------------------------------------
  alias origin_setup setup
  def setup(map_id)
    origin_setup(map_id)
    # 非active下不执行
    return if !$debug_active
    self.before_start()
  end
end

#--------------------------------------------------------------------------
# * 允许任意时刻读档
#--------------------------------------------------------------------------

# 读档标记
$debug_load_from_map = false

class Scene_Map
  #--------------------------------------------------------------------------
  # * Frame Update
  #--------------------------------------------------------------------------
  alias origin_update update
  def update()
    origin_update
    # 非active下不执行
    return if !$debug_active
    if !$DEBUG and Input.press?(Input::F9)
        $debug_load_from_map = true
        $scene = Scene_Load.new
    end
  end
end

#--------------------------------------------------------------------------
# * 读档时触发更新以免setup没有执行
#--------------------------------------------------------------------------

class Scene_Load
  #--------------------------------------------------------------------------
  # * Read Save Data
  #     file : file object for reading (opened)
  #--------------------------------------------------------------------------
  alias origin_read_save_data read_save_data
  def read_save_data(file)
    origin_read_save_data(file)
    return if !$debug_active
    if $game_system.magic_number == $data_system.magic_number
      # Load map
      $game_map.setup($game_map.map_id)
      $game_player.center($game_player.x, $game_player.y)
    end
  end

  #--------------------------------------------------------------------------
  # * Decision Processing
  #--------------------------------------------------------------------------
  alias origin_on_decision on_decision
  def on_decision(filename)
    $debug_load_from_map = false
    origin_on_decision(filename)
  end

  #--------------------------------------------------------------------------
  # * Cancel Processing
  #--------------------------------------------------------------------------
  alias origin_on_cancel on_cancel
  def on_cancel
    origin_on_cancel
    return if !$debug_active
    if $debug_load_from_map
        $scene = Scene_Map.new
        $debug_load_from_map = false
    end
  end
end