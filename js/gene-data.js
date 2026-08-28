/* ==========================================================================
 * 基因系统数据（单一数据源）
 * 来源：《附录2：基因.md》+《附录2：基因（补充1）.md》+《基因的扮演提示.txt》
 * 稀有度：common=普通（白）/ rare=罕见（蓝）/ epic=稀有（金）；负面基因无稀有度（红）
 * 字段说明：
 *   name      基因名（含等级）
 *   rarity    common | rare | epic
 *   effect    效果描述
 *   hint      扮演提示
 *   note      备注（无关扮演/效果的说明，如互斥关系；玩家可见）
 *   gmNote    讲述者备注（仅讲述者可见，可选）
 *   exclusive 互斥组 id：同组基因不可同选（跨正负面）
 *   mods      数值修正（供角色卡创建器联动计算）
 *     phy/acu/wil           基础属性修正
 *     phyCap/acuCap/wilCap  对应属性上限修正
 *     minPhy/minAcu/minWil  对应属性下限
 *     res                   物理抗性修正
 *     resHalf               物理抗性减半
 *     hp                    生命上限修正
 *     specPoints            初始可分配专精点数修正
 *     attrPoints            初始可分配基础属性点数修正
 *     specs                 专精修正 {专精名: 修正}
 * ========================================================================== */
(function (global) {
  "use strict";

  var GENE_DATA = {
    warning: "此系统为可选规则，对游戏体验与扮演方向影响较大。**使用前请务必征询所有参与者的意见**。基因选择为角色创建阶段行为，一经确定不可更改（除非剧情特殊事件允许）。本系统旨在为角色创建增加额外维度与个性化选项，而非强制平衡性调整。",
    randomWeight: { common: 50, rare: 35, epic: 15 },

    nonNegative: [
      // ---- 属性增强类 ----
      { name: "蛮力 Lv.1", rarity: "common", effect: "初始体魄 +1，初始体魄上限 +1", hint: "你的体魄天生比别人强一些。", mods: { phy: 1, phyCap: 1 } },
      { name: "蛮力 Lv.2", rarity: "rare", effect: "初始体魄 +2，初始体魄上限 +2", hint: "你的体魄天生比别人强一些。", mods: { phy: 2, phyCap: 2 } },
      { name: "蛮力 Lv.3", rarity: "epic", effect: "初始体魄 +3，初始体魄上限 +3", hint: "你的体魄天生比别人强一些。", mods: { phy: 3, phyCap: 3 } },
      { name: "聪慧 Lv.1", rarity: "common", effect: "初始算力 +1，初始算力上限 +1", hint: "你从小就发现自己比别人聪明。", mods: { acu: 1, acuCap: 1 } },
      { name: "聪慧 Lv.2", rarity: "rare", effect: "初始算力 +2，初始算力上限 +2", hint: "你从小就发现自己比别人聪明。", mods: { acu: 2, acuCap: 2 } },
      { name: "聪慧 Lv.3", rarity: "epic", effect: "初始算力 +3，初始算力上限 +3", hint: "你从小就发现自己比别人聪明。", mods: { acu: 3, acuCap: 3 } },
      { name: "感性 Lv.1", rarity: "common", effect: "初始愿力 +1，初始愿力上限 +1", hint: "你总是能获得更强烈的情感体验。", note: "与「西格玛」互斥", exclusive: "ganxing-xigema", mods: { wil: 1, wilCap: 1 } },
      { name: "感性 Lv.2", rarity: "rare", effect: "初始愿力 +2，初始愿力上限 +2", hint: "你总是能获得更强烈的情感体验。", note: "与「西格玛」互斥", exclusive: "ganxing-xigema", mods: { wil: 2, wilCap: 2 } },
      { name: "感性 Lv.3", rarity: "epic", effect: "初始愿力 +3，初始愿力上限 +3", hint: "你总是能获得更强烈的情感体验。", note: "与「西格玛」互斥", exclusive: "ganxing-xigema", mods: { wil: 3, wilCap: 3 } },
      { name: "均衡", rarity: "rare", effect: "初始体魄/算力/愿力各 +1", hint: "感觉像买中了什么基因彩票。", mods: { phy: 1, acu: 1, wil: 1 } },

      // ---- 专精增强类 ----
      { name: "好奇 Lv.1", rarity: "common", effect: "初始神秘学 +1", hint: "你对神秘的事物更感兴趣。", mods: { specs: { 神秘学: 1 } } },
      { name: "好奇 Lv.2", rarity: "rare", effect: "初始神秘学 +2", hint: "你对神秘的事物更感兴趣。", mods: { specs: { 神秘学: 2 } } },
      { name: "孩子王 Lv.1", rarity: "common", effect: "初始格斗 +1", hint: "你从小打架就很猛。", mods: { specs: { 格斗: 1 } } },
      { name: "孩子王 Lv.2", rarity: "rare", effect: "初始格斗 +2", hint: "你从小打架就很猛。", mods: { specs: { 格斗: 2 } } },
      { name: "调查员 Lv.1", rarity: "common", effect: "初始调查 +1", hint: "你的直觉比常人更加敏锐。", mods: { specs: { 调查: 1 } } },
      { name: "调查员 Lv.2", rarity: "rare", effect: "初始调查 +2", hint: "你的直觉比常人更加敏锐。", mods: { specs: { 调查: 2 } } },
      { name: "自来熟 Lv.1", rarity: "common", effect: "初始话术 +1", hint: "你很喜欢和人打交道。", mods: { specs: { 话术: 1 } } },
      { name: "自来熟 Lv.2", rarity: "rare", effect: "初始话术 +2", hint: "你很喜欢和人打交道。", mods: { specs: { 话术: 2 } } },
      { name: "刺客 Lv.1", rarity: "common", effect: "初始潜行 +1", hint: "你不喜欢被人盯着的感觉。", mods: { specs: { 潜行: 1 } } },
      { name: "刺客 Lv.2", rarity: "rare", effect: "初始潜行 +2", hint: "你不喜欢被人盯着的感觉。", mods: { specs: { 潜行: 2 } } },
      { name: "猎人 Lv.1", rarity: "common", effect: "初始追踪 +1", hint: "敏锐的嗅觉也许很适合拿来狩猎。", mods: { specs: { 追踪: 1 } } },
      { name: "猎人 Lv.2", rarity: "rare", effect: "初始追踪 +2", hint: "敏锐的嗅觉也许很适合拿来狩猎。", mods: { specs: { 追踪: 2 } } },
      { name: "乖巧 Lv.1", rarity: "common", effect: "初始察言观色 +1", hint: "大家都说你是个听话的孩子。", mods: { specs: { 察言观色: 1 } } },
      { name: "乖巧 Lv.2", rarity: "rare", effect: "初始察言观色 +2", hint: "大家都说你是个听话的孩子。", mods: { specs: { 察言观色: 2 } } },
      { name: "耐饿 Lv.1", rarity: "common", effect: "初始野外生存 +1", hint: "三天不吃饭也没什么大碍。", mods: { specs: { 野外生存: 1 } } },
      { name: "耐饿 Lv.2", rarity: "rare", effect: "初始野外生存 +2", hint: "三天不吃饭也没什么大碍。", mods: { specs: { 野外生存: 2 } } },
      { name: "多邻国 Lv.1", rarity: "common", effect: "初始外语 +1", hint: "你的语言天赋很强。", mods: { specs: { 外语: 1 } } },
      { name: "多邻国 Lv.2", rarity: "rare", effect: "初始外语 +2", hint: "你的语言天赋很强。", mods: { specs: { 外语: 2 } } },
      { name: "共情 Lv.1", rarity: "common", effect: "初始急救 +1", hint: "你不忍心看到他人遭受苦难。", mods: { specs: { 急救: 1 } } },
      { name: "共情 Lv.2", rarity: "rare", effect: "初始急救 +2", hint: "你不忍心看到他人遭受苦难。", mods: { specs: { 急救: 2 } } },
      { name: "巧手 Lv.1", rarity: "common", effect: "初始机械修理 +1", hint: "小时候手工比赛好像拿过第一。", mods: { specs: { 机械修理: 1 } } },
      { name: "巧手 Lv.2", rarity: "rare", effect: "初始机械修理 +2", hint: "小时候手工比赛好像拿过第一。", mods: { specs: { 机械修理: 2 } } },
      { name: "发散 Lv.1", rarity: "common", effect: "初始灵感 +1", hint: "你的思维总是很具有跳跃性。", mods: { specs: { 灵感: 1 } } },
      { name: "发散 Lv.2", rarity: "rare", effect: "初始灵感 +2", hint: "你的思维总是很具有跳跃性。", mods: { specs: { 灵感: 2 } } },

      // ---- 符文/战斗机制类 ----
      { name: "灵体", rarity: "epic", effect: "使用意识系符文时检定**优势**；受到物理伤害时**不适用物理抗性**", hint: "你的灵魂和肉体结合过于紧密。", gmNote: "可能具有肉身踏足基耶夏韦的潜质" },
      { name: "木头人", rarity: "epic", effect: "「德墨忒尔之心」算力消耗降低10点；物理攻击不能对你造成致命伤害（肢体可像植物一样愈合）", hint: "你似乎能与植物产生奇妙的共鸣。" },
      { name: "太阳之子", rarity: "epic", effect: "使用因果系符文时检定**优势**", hint: "你的基因里混入了……嗯？", gmNote: "此为海德里斯人基因，该角色参与事件时更容易遭遇混沌，检定时增加一个暗骰取优势" },
      { name: "笛卡尔", rarity: "epic", effect: "使用空间系符文时检定**优势**", hint: "你的空间想象能力极强。" },
      { name: "西格玛", rarity: "epic", effect: "初始愿力 -1，初始算力 +1；发动解构攻击时检定**优势**", hint: "你的理性总是走在感性之前。", note: "与「感性」互斥", exclusive: "ganxing-xigema", mods: { wil: -1, acu: 1 } },
      { name: "真·轮回者", rarity: "epic", effect: "选择一个符文作为灵魂记忆，**不占用初始符文槽位**", hint: "顾名思义。" },
      { name: "远梦之光", rarity: "epic", effect: "他们都说你会成为人类的希望。", hint: "准备好成为人类的希望了吗？", gmNote: "持有者可被分配一个奇迹，**强烈不建议**多玩家同时持有" },
      { name: "兽性", rarity: "rare", effect: "物理抗性 +1，近战时造成的物理伤害 +1；更容易受到意识系符文的影响，进行抵抗检定时获得**劣势**", hint: "你的基因里似乎包含某些猛兽的片段。", mods: { res: 1 } },

      // ---- 环境/适应类 ----
      { name: "向日葵", rarity: "rare", effect: "日间/明亮环境时，**非战斗检定优势**", hint: "你更喜欢明亮的环境。", note: "与「畏光」互斥", exclusive: "solar" },
      { name: "畏光", rarity: "rare", effect: "夜间/黑暗环境时，**非战斗检定优势**", hint: "你更喜欢黑暗的环境。", note: "与「向日葵」互斥", exclusive: "solar" },

      // ---- 社交/风格类（补充1） ----
      { name: "魅力", rarity: "rare", effect: "发动「请」时检定获得**优势**；触发词中的“请”可替换为别的口癖（如“拜托”“求你了”等）", hint: "你在哪都会成为团宠。", note: "更换触发词为一次性行为；与「自闭」互斥", exclusive: "charm" },
      { name: "随性", rarity: "rare", effect: "所有**非战斗检定**获得 **+1加值**", hint: "你做事总是很从容，因为你擅长随机应变。", note: "与「刻板」互斥", exclusive: "casual-rigid" },
      { name: "抗压王", rarity: "epic", effect: "**非战斗检定**不受劣势影响（即劣势被抵消为普通检定）", hint: "泰山崩于前而面不改色。", note: "与「易垮」互斥", exclusive: "stress" },
      { name: "乐观", rarity: "rare", effect: "在**优势检定**中额外获得 **+1加值**", hint: "你总是相信事情会朝好的方向发展。", note: "与「悲观」互斥", exclusive: "mood" },

      // ---- 资源/分配类（补充1） ----
      { name: "万事通 Lv.1", rarity: "common", effect: "初始可分配专精点数 **+1**", hint: "什么都懂一点但懂得不多。", note: "与「单科生」互斥", exclusive: "wanshitong", mods: { specPoints: 1 } },
      { name: "万事通 Lv.2", rarity: "rare", effect: "初始可分配专精点数 **+2**", hint: "什么都懂一点但懂得不多。", note: "与「单科生」互斥", exclusive: "wanshitong", mods: { specPoints: 2 } },
      { name: "三好学生 Lv.1", rarity: "rare", effect: "初始可分配基础属性点数 **+1**", hint: "你的表现从小就比别人突出一些。", note: "与「输在起跑线」互斥", exclusive: "sanhao", mods: { attrPoints: 1 } },
      { name: "三好学生 Lv.2", rarity: "epic", effect: "初始可分配基础属性点数 **+2**", hint: "你的表现从小就比别人突出一些。", note: "与「输在起跑线」互斥", exclusive: "sanhao", mods: { attrPoints: 2 } },
      { name: "三好学生 Lv.3", rarity: "epic", effect: "初始可分配基础属性点数 **+3**", hint: "你的表现从小就比别人突出一些。", note: "与「输在起跑线」互斥", exclusive: "sanhao", mods: { attrPoints: 3 } },

      // ---- 代价型（补充1，按非负面处理） ----
      { name: "双刃剑", rarity: "epic", effect: "所有检定**首次获得优势时额外+2**，但所有检定**首次获得劣势时额外-2**", hint: "你做事总是走极端，要么大获全胜，要么一败涂地", note: "与「易燃」效果重叠，不可同选", exclusive: "blaze" },
      { name: "易燃", rarity: "rare", effect: "在优势检定中获得 **+2加值**；但劣势检定中额外承受 **-2减值**", hint: "你的情绪就像汽油，一点火星就能点燃，但也极易燃烧殆尽", note: "与「双刃剑」效果重叠，不可同选", exclusive: "blaze" },
      { name: "赌徒", rarity: "epic", effect: "可主动将一次**普通检定**转为**劣势检定**；若成功，该次效果翻倍；若失败，承受双倍后果", hint: "你信奉“一无所有或者赢下所有”，没有中间选项" },

      // ---- 极端型（三选一，取消对应属性分配上限） ----
      { name: "Ⅰ型极端", rarity: "epic", effect: "取消**算力**的点数分配上限。", hint: "你这是把技能全部点到同一个地方了吗……", note: "与「Ⅱ型极端」「Ⅲ型极端」互斥（仅可选一个）", exclusive: "extreme", mods: { uncap: "acu" } },
      { name: "Ⅱ型极端", rarity: "epic", effect: "取消**愿力**的点数分配上限。", hint: "你这是把技能全部点到同一个地方了吗……", note: "与「Ⅰ型极端」「Ⅲ型极端」互斥（仅可选一个）", exclusive: "extreme", mods: { uncap: "wil" } },
      { name: "Ⅲ型极端", rarity: "epic", effect: "取消**体魄**的点数分配上限。", hint: "你这是把技能全部点到同一个地方了吗……", note: "与「Ⅰ型极端」「Ⅱ型极端」互斥（仅可选一个）", exclusive: "extreme", mods: { uncap: "phy" } }
    ],

    negative: [
      // ---- 属性削弱类 ----
      { name: "脆弱", effect: "初始体魄 -2（最低为3），物理抗性**减半**（向下取整）", hint: "你比常人更容易受伤，一个轻微的撞击就可能让你倒下", mods: { phy: -2, minPhy: 3, resHalf: true } },
      { name: "呆滞", effect: "初始算力 -2（最低为3），调查类检定**劣势**", hint: "你总是反应慢半拍，需要更多时间才能理解眼前的情况", mods: { acu: -2, minAcu: 3 } },
      { name: "麻木", effect: "初始愿力 -2（最低为3），愿力恢复速度**减半**", hint: "你很难被任何事情真正触动，情绪像隔着一层磨砂玻璃", mods: { wil: -2, minWil: 3 } },
      { name: "四体不勤", effect: "初始体魄 -1，初始算力 -1，初始愿力 +1", hint: "书没读好，活也没干好——但你感觉挺敏锐的", mods: { phy: -1, acu: -1, wil: 1 } },
      // ---- 战斗限制类 ----
      { name: "贫血", effect: "生命上限 **-10**，流血状态的伤害**翻倍**", hint: "你总觉得自己有点头晕，伤口也比别人更难愈合", mods: { hp: -10 } },
      { name: "夜盲", effect: "在黑暗环境中，**所有战斗检定劣势**", hint: "天一黑你就看不太清楚东西了" },
      { name: "惧火", effect: "受到火焰/高温类伤害时，额外受到 **+1d6** 伤害", hint: "你对火有一种本能的恐惧——也许和某段记忆有关" },
      { name: "玻璃心", effect: "受到**灵魂伤害**时额外受 **+1d4** 伤害", hint: "你比其他人更容易在精神上被击垮" },
      { name: "怯场", effect: "当成为**唯一被攻击目标**时，所有检定**劣势**", hint: "你无法忍受被人注视的感觉，尤其是在战斗中" },
      { name: "笨手笨脚", effect: "进行**机械修理/巧手类**检定时**劣势**，且失败时可能触发意外后果（讲述者裁定）", hint: "你从小到大打碎的东西可以堆满一整个仓库" },
      // ---- 社交/认知限制类 ----
      { name: "结巴", effect: "**话术**检定时**劣势**，且难以进行需要清晰发音的符文施放（讲述者裁定）", hint: "你说话时总会卡在某个音节上，这让交流变得吃力" },
      { name: "脸盲", effect: "**察言观色**检定时**劣势**，难以辨认见过的人", hint: "你总是分不清谁是谁，这让你得罪了不少人" },
      { name: "疑心", effect: "初始**话术 -2**，初始**察言观色 +1**；在与他人合作时，所有团队检定**劣势**", hint: "你总觉得别人在打你的主意——即使是队友", mods: { specs: { 话术: -2, 察言观色: 1 } } },
      { name: "迷信", effect: "初始**神秘学 +2**，但使用符文时若检定**失败**，额外受到 1d4 灵魂伤害（心理暗示）", hint: "你相信每个符文背后都有一位神明，并且你害怕惹怒它们", mods: { specs: { 神秘学: 2 } } },
      { name: "恐高", effect: "在高处/悬崖附近时，所有敏捷/体魄类检定**劣势**", hint: "只要脚离地超过三米，你的腿就开始发抖" },
      { name: "幽闭", effect: "在狭小/封闭空间中，每回合开始进行 **D20+体魄 DC=12**，失败则获得**恐惧**状态", hint: "你无法忍受被关在狭小空间里的感觉，这让你想起一些不太好的回忆" },
      // ---- 特殊诅咒类 ----
      { name: "灾星", effect: "角色参与的每场战斗中，讲述者可**骰一次暗骰**，若结果为1，则该轮**出现意外事故**", hint: "你走到哪，哪就出事。这不是你的错，但别人总这么觉得" },
      { name: "回声", effect: "你偶尔会**听到不属于当前时刻的声音**（讲述者可在关键情节中提供虚假/混淆的信息）", hint: "你的耳朵里总是有些杂音。有些是过去的回响，有些是……别的东西" },
      { name: "罪孽", effect: "使用**任何禁忌符文**后，进行一次灵感检定，未通过则额外承受 **2d6 混沌伤害**（不可减免）", hint: "你的身上有某种印记。每一次触碰禁忌，它就会加深一分" },

      // ---- 社交/风格类（补充1） ----
      { name: "自闭", effect: "在公共场合或人数超过5人的场合时，所有检定获得**劣势**", hint: "你不太擅长用语言影响别人，每次开口都担心说错话", note: "与「魅力」互斥", exclusive: "charm" },
      { name: "刻板", effect: "所有**非战斗检定**获得 **-1减值**", hint: "你做事一板一眼，严格按照流程来，稍微超出计划就不知所措", note: "与「随性」互斥", exclusive: "casual-rigid" },
      { name: "易垮", effect: "**非战斗检定**中，劣势的影响加重（劣势时额外 -2）", hint: "你承受压力的能力比常人弱一些，一点点风吹草动就能让你心态崩盘", note: "与「抗压王」互斥", exclusive: "stress" },
      { name: "悲观", effect: "在**劣势检定**中额外承受 **-1减值**", hint: "你总觉得事情会往坏的方向发展……而且通常你是对的", note: "与「乐观」互斥", exclusive: "mood" },

      // ---- 资源/分配类（补充1） ----
      { name: "单科生 Lv.1", effect: "初始可分配专精点数 **-1**（最低为0）", hint: "你只对特定领域感兴趣，其他方面几乎一窍不通", note: "与「万事通」互斥", exclusive: "wanshitong", mods: { specPoints: -1 } },
      { name: "单科生 Lv.2", effect: "初始可分配专精点数 **-2**（最低为0）", hint: "你只对特定领域感兴趣，其他方面几乎一窍不通", note: "与「万事通」互斥", exclusive: "wanshitong", mods: { specPoints: -2 } },
      { name: "输在起跑线 Lv.1", effect: "初始可分配基础属性点数 **-1**", hint: "你从小就没有别人那种“天赋”，只能靠后天努力弥补", note: "与「三好学生」互斥", exclusive: "sanhao", mods: { attrPoints: -1 } },
      { name: "输在起跑线 Lv.2", effect: "初始可分配基础属性点数 **-2**", hint: "你从小就没有别人那种“天赋”，只能靠后天努力弥补", note: "与「三好学生」互斥", exclusive: "sanhao", mods: { attrPoints: -2 } },
      { name: "输在起跑线 Lv.3", effect: "初始可分配基础属性点数 **-3**", hint: "你从小就没有别人那种“天赋”，只能靠后天努力弥补", note: "与「三好学生」互斥", exclusive: "sanhao", mods: { attrPoints: -3 } }
    ]
  };

  if (typeof module !== "undefined" && module.exports) module.exports = GENE_DATA;
  if (global) global.GENE_DATA = GENE_DATA;
})(typeof window !== "undefined" ? window : null);
