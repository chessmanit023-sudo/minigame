// 多语言文本配置（简体/繁体/英文）
export interface I18nTextItem {
    cn: string;  // 简体中文
    tw: string;  // 繁體中文
    en: string;  // English
}

// 所有多语言文本配置
export const I18N_TEXT: Record<string, I18nTextItem> = {
    // ========== Common Text ==========
    "common_diamond": {
        cn: "钻石",
        tw: "鑽石",
        en: "Gems"
    },
    "common_coming_soon": {
        cn: "敬请期待",
        tw: "敬請期待",
        en: "Coming Soon"
    },
    "common_watch_video": {
        cn: "视频免费",
        tw: "影片免費",
        en: "Watch Video"
    },
    "common_diamond_not_enough": {
        cn: "钻石不足",
        tw: "鑽石不足",
        en: "Not enough gems"
    },
    "common_link_copied": {
        cn: "链接已复制",
        tw: "連結已複製",
        en: "Link copied"
    },

    // ========== Prefab Label Strings ==========
    "gameOverPanel_btnGet_0": {
        cn: "领取",
        tw: "領取",
        en: "Claim"
    },
    "gameOverPanel_rankTitle_10": {
        cn: "第  名",
        tw: "第  名",
        en: "Rank"
    },
    "gameOverPanel_rankFormat": {
        cn: "第%s名",
        tw: "第%s名",
        en: "No. %s"
    },

    "gameOverPanel_benjufenshu": {
        cn: "本局分數：",
        tw: "本局分數：",
        en: "Score: "
    },
    "gameOverPanel_claimMulFormat": {
        cn: "领取x%s",
        tw: "領取x%s",
        en: "Claim ×%s"
    },
    "gameOverPanel_gemReward": {
        cn: "宝石奖励：%s",
        tw: "寶石獎勵：%s",
        en: "Gem Bonus: %s"
    },
    "closePanel_tip_0": {
        cn: "返回主页\n你将丢失当前关卡进度",
        tw: "返回主頁\n你將遺失當前關卡進度",
        en: "Return to Home\nCurrent level progress will be lost"
    },
    "resurrectionPanel_btnNext_0": {
        cn: "重玩",
        tw: "重玩",
        en: "Replay"
    },
    "shopPanel_clothes_1": {
        cn: "服饰",
        tw: "服飾",
        en: "Outfit"
    },
    "shopPanel_brick_2": {
        cn: "砖",
        tw: "磚塊",
        en: "Brick"
    },
    "shopPanel_randomSkin_3": {
        cn: "随机皮肤",
        tw: "隨機造型",
        en: "Random Skin"
    },
    "shopPanel_getGem_5": {
        cn: "获得宝石",
        tw: "獲得寶石",
        en: "Get Gems"
    },
    "gamePanel_gemProgress_0": {
        cn: "宝石收集：0/10",
        tw: "寶石收集：0/10",
        en: "Gems: 0/10"
    },
    "gamePanel_rankTitle_2": {
        cn: "排名:",
        tw: "排名:",
        en: "Rank:"
    },
    "gamePanel_guide_3": {
        cn: "滑动可转弯",
        tw: "滑動可轉彎",
        en: "Swipe to turn"
    },
    "gamePanel_jixu": {
        cn: "继续",
        tw: "繼續",
        en: "Continue"
    },
    "gamePanel_guize_level1": {
        cn: "第１关\n请避开全部障碍（炸弹）并收集周大福人寿拼圖，助您搭出全新道路，快速、安全通关。",
        tw: "第１關\n請避開全部障礙（炸彈）並收集周大福人壽拼圖，助您搭出全新道路，快速、安全通關。",
        en: "Level 1\nAvoid all obstacles (bombs) and collect CTF Life Puzzle to build a new path and complete the level quickly and safely."
    },
    "gamePanel_guize_level2": {
        cn: "第2关\n请收集以下5 款周大福人寿提供的宝石资源以增加游戏分数，并收集周大福人寿拼圖助您于终点后的「加分区」跑出更高成绩。",
        tw: "第２關\n請收集以下5 款周大福人壽提供的寶石資源以增加遊戲分數，並收集周大福人壽拼圖助您於終點後的「加分區」跑出更高成績。",
        en: "Level 2\nCollecting the following five types of gem resources provided by CTF Life will increase your game score. Continuing to collect CTF Life Puzzle will help you earn extra points in the Bonus Zone after reaching the finish line."
    },
    "rewardPanel_btnGet_0": {
        cn: "领取",
        tw: "領取",
        en: "Claim"
    },
    "settingPanel_title_0": {
        cn: "设置",
        tw: "設定",
        en: "Settings"
    },
    "settingPanel_options_1": {
        cn: "震动\n音乐\n",
        tw: "震動\n音樂\n",
        en: "Vibrate\nMusic\n"
    },
    "setting_label_title": {
        cn: "设置",
        tw: "設定",
        en: "Settings"
    },
    "setting_label_vibration": {
        cn: "震动",
        tw: "震動",
        en: "Vibration"
    },
    "setting_label_music": {
        cn: "音乐",
        tw: "音樂",
        en: "Music"
    },
    "mainPanel_shop_0": {
        cn: "商店",
        tw: "商店",
        en: "Shop"
    },
    "mainPanel_videoFree_6": {
        cn: "视频免费",
        tw: "影片免費",
        en: "Watch Video"
    },
    "mainPanel_language_9": {
        cn: "简体中文",
        tw: "繁體中文",
        en: "English"
    },
    "mainPanel_score_label": {
        cn: "分数：",
        tw: "分數：",
        en: "Score: "
    },
    "xiaohao_label": {
        cn: "消耗分数：",
        tw: "消耗分數：",
        en: "Consume Score: "
    },
    "mainPanel_diamond_label": {
        cn: "钻石等级：",
        tw: "鑽石等級：",
        en: "Diamond Level: "
    },

    "mainPanel_brick_label": {
        cn: "拼图 +1",
        tw: "拼圖 +1",
        en: "Puzzle +1"
    },
    "gameRule_controls_0": {
        cn: "周大福人寿凭借多元资源，为您的人生跑道提供强大支援，助您跑出属于自己的舞台。\n游戏共分为２关，请控制角色左右移动，依次完成挑战，解锁幸運卡片，赢取手摇饮品电子礼券：\n第１关\n请避开全部障碍（炸弹）并收集周大福人寿拼圖，助您搭出全新道路，快速、安全通关。",
        tw: "周大福人壽憑藉多元資源，為您的人生跑道提供強大支援，助您跑出屬於自己嘅舞台。\n遊戲共分為２關，請控制角色左右移動，依次完成挑戰，解鎖幸運卡片，贏取手搖飲品電子禮券：\n第１關\n請避開全部障礙（炸彈）並收集周大福人壽拼圖，助您搭出全新道路，快速、安全通關。",
        en: "CTF Life supports your journey with diverse resources, empowering you to shine on your own stage.\nThe game consists of 2 levels.Complete the challenges by controlling your character to move left and right, and unlock a Lucky Card to win a beverage e-voucher. \nLevel 1\nAvoid all obstacles (bombs) and collect CTF Life Puzzle to build a new path and complete the level quickly and safely. "
    },
    "gameRule_guide_1": {
        cn: "第2关\n请收集以下5 款周大福人寿提供的宝石资源以增加游戏分数，并收集周大福人寿拼圖助您于终点后的「加分区」跑出更高成绩。",
        tw: "第２關\n請收集以下5 款周大福人壽提供的寶石資源以增加遊戲分數，並收集周大福人壽拼圖助您於終點後的「加分區」跑出更高成績。",
        en: "Level 2\nCollecting the following five types of gem resources provided by CTF Life will increase your game score.Continuing to collect CTF Life Puzzle will help you earn extra points in the Bonus Zone after reaching the finish line."
    },
    "gameRule_benefit_1": {
        cn: "专业培训",
        tw: "專業培訓",
        en: "Training"
    },
    "gameRule_benefit_2": {
        cn: "海外会议",
        tw: "海外會議",
        en: "Overseas Conventions"
    },
    "gameRule_benefit_3": {
        cn: "优质生活",
        tw: "優質生活",
        en: "Quality of life"
    },
    "gameRule_benefit_4": {
        cn: "晋升机会",
        tw: "晉升機會",
        en: "Promotion"
    },
    "gameRule_benefit_5": {
        cn: "客户转介",
        tw: "客戶轉介",
        en: "Potential Customer Lead"
    },
    "gameRule_benefit_21": {
        cn: "周大福人寿拼图",
        tw: "周大福人壽拼圖",
        en: "CTF Life Puzzle"
    },
    "gameRule_benefit_22": {
        cn: "障碍",
        tw: "障礙",
        en: "Obstacle"
    },
    "gameRule_liucheng2": {
        cn: "\n幸运卡片\n完成挑战将解锁幸运卡片链接至礼劵登记问卷。填妥后，首100名最高分数玩家，即有机会获得手摇饮品电子礼券！\n\n温馨提示\n游戏将不限参与次数，分数（钻石）将累积计算。\n挑战失败可重新开始游戏。 \n參加者亦可活用主頁上之鑽石圖示，透過觀看視頻或使用分數增加等級，獲得更多倍加乘； 及透過周大福人壽拼圖圖示購買拼圖提升通關機會。",
        tw: "\n幸運卡片\n完成挑戰將解鎖幸運卡片連結至禮劵登記問卷。填妥後，首100名最高分数玩家，即有機會獲得手搖飲品電子禮券！\n\n溫馨提示\n遊戲不限參與次數，分數（鑽石）將累積計算。\n挑戰失敗可重新開始遊戲。 \n参加者亦可活用主页上之钻石图示，透过观看视频或使用分数增加等级，获得更多倍加乘； 及透过周大福人寿拼图图示购买拼图提升通关机会。",
        en: "\nLucky Card\nA lucky card will be unlocked after completing both levels, which directs you to voucher registration survey. Top 100 highest scorers will have a chance to receive a hand‑shaken beverage e-voucher.\n\nGame Tips\nScores (diamonds) are accumulative, and players can attempt the game unlimited times.\nThe diamond icon on the main page can be used to level up by watching video/ spending score.The CTF Life Puzzle icon  can be used to purchase “Puzzles”, increasing your chance of clearing the level."
    },
    "gameStartTips_desc": {
        cn: "人生，何尝不是一场跑酷？\n我们总在寻找人生的道路，\n我们相信，最好的路，\n是有人并肩而行。\n\n周大福人寿作为周大福企业的其中\n一员，身后是整个集团生态圈。\n依托集团多元生态圈的雄厚实力，\n您将享有优越体验与客户资源。\n资源护航前程，平台成就梦想！\n跑酷无限可能？\n加入我们，把生活的障碍，\n跑成无限的可能。",
        tw: "人生，何嘗不是一場跑酷？\n我們總在尋找人生的道路，\n我們相信，最好的路，\n是有人並肩而行。\n\n周大福人壽作為周大福企業的其中一\n員，身後是整個集團生態圈。\n依託集團多元生態圈的雄厚實力，您將\n享有優越體驗與客戶資源。\n資源護航前程，平台成就夢想！\n跑酷無限可能？\n加入我們，把生活的障礙，\n跑成無限的可能。",
        en: "Life, isn’t it just like a parkour challenge?\nWe are constantly searching for our\nown path in life.\nWe believe the best path\nis one where we move forward\ntogether.\n\nAs a member of Chow Tai Fook\nEnterprises Limited.\nCTF Life is supported by the Group\necosystem,\nLeveraging the Group’s robust\ncapabilities,\nyou will gain diverse lifestyle\nexperiences and client resources.\nResources safeguard your future; our\nplatform empowers your dreams.\nParkour with endless possibilities?\nJoin us and turn life’s obstacles\ninto limitless opportunities."
    },
    "mainPanel_language": {
        cn: "中文",
        tw: "中文",
        en: "CN"
    },
    "gamePanel_gemTitle": {
        cn: "宝石收集：",
        tw: "寶石收集：",
        en: "Gems: "
    },
    "resurrectionPanel_bombTitle": {
        cn: "踩到炸弹了！",
        tw: "踩到炸彈了！",
        en: "You hit a bomb!"
    },
    "resurrectionPanel_gameOverTitle": {
        cn: "游戏结束",
        tw: "遊戲結束",
        en: "Game Over"
    },
    // ========== Video Panel ==========
    "videoPanel_btn_close": {
        cn: "关闭",
        tw: "關閉",
        en: "Close"
    },
    "videoPanel_btn_claim": {
        cn: "领取",
        tw: "領取",
        en: "Claim"
    },
    "videoPanel_tap_to_play": {
        cn: "轻触屏幕播放",
        tw: "輕觸屏幕播放",
        en: "Tap to play"
    },
    "videoPanel_sec_suffix": {
        cn: "秒",
        tw: "秒",
        en: "s"
    },
    // ========== GameAnswer Panel ==========
    "gameAnswer_title": {
        cn: "问卷调查",
        tw: "問卷調查",
        en: "Questionnaire"
    },
    "gameAnswer_subtitle": {
        cn: "周大福人寿【跑酷无限可能】礼券登记问卷",
        tw: "周大福人壽【跑酷無限可能】禮券登記問卷",
        en: "CTF Life “Parkour with Endless Possibilities” Digital Voucher Registration Survey"
    },
    "gameAnswer_lab_1": {
        cn: "恭喜您",
        tw: "恭喜您",
        en: "Congratulations"
    },
    "gameAnswer_nextLevel_lab": {
        cn: "下一关",
        tw: "下一關",
        en: "Next level"
    },
    "gameAnswer_lab_2": {
        cn: "礼券登记问卷",
        tw: "禮券登記問卷",
        en: "Voucher registration survey"
    },
    "gameAnswer_lab_3": {
        cn: "于游戏限定期内，\n首100名最高分数玩家，\n即有机会获得手摇饮品电子礼券！",
        tw: "於遊戲限定期內，\n首100名最高分數玩家，\n即有機會獲得手搖飲品電子禮券！",
        en: "Within the promotion period,\nThe top 100 players with the highest scores will have the chance to receive a hand‑shaken beverage e‑voucher!"
    },
    "gameAnswer_lab_4": {
        cn: "礼券将由专员于活动完结后派发予合资格参加者。\n立即填写登记问卷以获取电子礼券！",
        tw: "禮券將由專員於活動完結後派發予合資格參加者。\n立即填寫登記問卷以獲取電子禮券！",
        en: "E-voucher will be distributed by a specialist to qualified participants after the campaign ends.\nComplete the survey now to receive your evoucher!"
    },
    "gameAnswer_lab_5": {
        cn: "<b><i><color=#000000>5. 本人按下「完成」按钮，即表示本人已阅读、理解并同\n意《</color><color=#59C9E6>个人资料收集声明</color><color=#000000>》、</color><color=#59C9E6>周大福人寿《中华人民共和\n国附录》</color><color=#000000>*及相关条款及细则所载的所有内容<size=28>（如适用）</size>。</color>",
        tw: "<b><i><color=#000000>5. 本人按下「完成」按鈕，即表示本人已閱讀、理解並同\n意《</color><color=#59C9E6>個人資料收集聲明</color><color=#000000>》、</color><color=#59C9E6>周大福人壽《中華人民共和\n國附錄》</color><color=#000000>*及相關條款及細則所載的所有內容<size=28>（如適用）</size>。</color>",
        en: "<b><i><color=#000000>5. By Clicking the \"Complete\" button,I indicate that\nI have read, understood and agreed to all content \ncontained in the </color><color=#59C9E6>Personal Information Collection \nStatement</color><color=#000000>, the </color><color=#59C9E6>CTF Life’s People’s Republic of\nChina Addendum</color><color=#000000>* and relevant terms and\nconditions <size=28>(where applicable)</size>.</color>",
    },
    "gameAnswer_lab_ruguo": {
        cn: "如果您是：\ni.	位于中国内地的个人，于中国内地访问周大福人寿相关网站或使用周大福人寿相关流动应用程式或从中国内地通过手机或任何其他方式使用周大福人寿产品及/或服务；及/或\nii.	持有中国内地护照及/或居民身份证的个人，到访周大福人寿在香港的客服中心或其他实体场所或在香港通过手机或任何其他方式使用周大福人寿产品及/或服务，\n除 (i)周大福人寿私隐政策; 及(ii) 本声明外，周大福人寿将根据周大福人寿《中华人民共和国附录》以及中国内地适用的资料保护法律法规处理您的个人资料。在使用周大福人寿产品及/或服务或向我们提供任何个人资料之前，请确保您已仔细阅读、理解并同意个人资料收集声明、周大福人寿私隐政策和本附录。就本附录目的而言，“中国内地”是指中华人民共和国除香港特别行政区（“香港”）、澳门特别行政区和台湾以外的地区。\n如您未能提供以下所有同意，周大福人寿或未能按相关方式处理您的个人资料。",
        tw: "如果您是：\ni.位於中國內地的個人，於中國內地訪問周大福人壽相關網站或使用周大福人壽相關流動應用程式或從中國內地通過手機或任何其他方式使用周大福人壽產品及/或服務；及/或\nii.持有中國內地護照及/或居民身份證的個人，到訪周大福人壽在香港的客服中心或其他實體場所或在香港通過手機或任何其他方式使用周大福人壽產品及/或服務，\n除 (i)周大福人壽私隱政策; 及(ii) 本聲明外，周大福人壽將根據周大福人壽《中華人民共和國附錄》以及中國內地適用的資料保護法律法規處理您的個人資料。在使用周大福人壽產品及/或服務或向我們提供任何個人資料之前，請確保您已仔細閱讀、理解並同意個人資料收集聲明、周大福人壽私隱政策和本附錄。就本附錄目的而言，“中國內地”是指中華人民共和國除香港特別行政區（“香港”）、澳門特別行政區和臺灣以外的地區。\n如您未能提供以下所有同意，周大福人壽或未能按相關方式處理您的個人資料。",
        en: "* If you are:\n1. an individual located in Mainland China who visits CTF Life's relevant website(s) or uses relevant mobile application(s) of CTF Life, or otherwise uses CTF Life's products and/or services by phone or any other means from Mainland China; and/or;\n2. an individual holding a Mainland China passport and/or resident identity card who visits the service centres or other physical premises of CTF Life in Hong Kong or otherwise uses CTF Life's products and/or services by phone or any other means in Hong Kong.\nYour personal data will be processed by CTF Life in accordance with the \"People's Republic of China Addendum\" in addition to the (i) CTF Life Privacy Policy Statement and (ii) this Statement, as well as the applicable data protection laws and regulations in Mainland China which, for the current purposes, excludes Hong Kong, the Macau Special Administrative Region of the People’s Republic of China and Taiwan.\nIf you do not provide all the consents below, then CTF Life may not be able to process your personal data accordingly."
    },
    "gameAnswer_toggle_1": {
        cn: "本人同意依本附录所列之目的对本人的个人资料（包括敏感个人资料）的收集、使用及处理。",
        tw: "本人同意依本附錄所列之目的對本人的個人資料（包括敏感個人資料）的收集、使用及處理。",
        en: "I consent to the collection, use and processing of my personal data (including sensitive personal data) in connection with the Purposes set out in the \"Addendum\" and \"Annex A\" (if applicable)."
    },
    "gameAnswer_toggle_2": {
        cn: "本人同意将本人的个人资料（包括敏感个人资料）转移至中国内地以外地区。",
        tw: "本人同意將本人的個人資料（包括敏感個人資料）轉移至中國內地以外地區。",
        en: "I consent to the transfer of my personal data (including sensitive personal data) to outside Mainland China."
    },
    "gameAnswer_toggle_3": {
        cn: "本人同意向第三方提供本人的个人资料（包括敏感个人资料）。",
        tw: "本人同意向第三方提供本人的个人资料（包括敏感个人资料）。",
        en: "I consent to providing personal data (including sensitive personal data) to third parties."
    },
    "gameAnswer_toggle_4": {
        cn: "本人特此确认本人已年满 18 岁。",
        tw: "本人特此確認本人已年滿 18 歲。",
        en: "I hereby certify that I have reached the age of 18."
    },
    "gameAnswer_lab_chizhi": {
        cn: "由第三方问卷平台提供服务与技术支持",
        tw: "由第三方問卷平臺提供服務與技術支持",
        en: "Services and technical support are provided by a third-party questionnaire platform"
    },
    "gameAnswer_nameLabel": {
        cn: "1.姓名：",
        tw: "1.姓名：",
        en: "1.Name:"
    },
    "gameAnswer_wechatLabel": {
        cn: "2.微信号：",
        tw: "2.微信號：",
        en: "2.WeChat ID:"
    },
    "gameAnswer_phoneLabel": {
        cn: "3.电话号码：",
        tw: "3.電話號碼：",
        en: "3.Mobile Number:"
    },
    "gameAnswer_giftChoiceTitle": {
        cn: "4.电子礼券选择 (二选一)",
        tw: "4.電子禮券選擇 (二選一)",
        en: "4.Selection of E-voucher (Choose One)"
    },
    "gameAnswer_giftOptionHK": {
        cn: "香港手摇饮品",
        tw: "香港手搖飲品",
        en: "Hand-shaken beverage voucher in Hong Kong"
    },
    "gameAnswer_giftOptionCN": {
        cn: "中国内地手摇饮品",
        tw: "中國內地手搖飲品",
        en: "Hand-shaken beverage voucher in Mainland China"
    },
    "gameAnswer_privacyLabel": {
        cn: "隐私协议",
        tw: "隱私協議",
        en: "Privacy Policy"
    },
    "gameAnswer_submitBtn": {
        cn: "上传",
        tw: "上傳",
        en: "Submit"
    },
    "gameAnswer_completeLabel": {
        cn: "完成",
        tw: "完成",
        en: "Complete"
    },
    "gameAnswer_qian100": {
        cn: "如您于游戏限定期内成为首100名最高分数玩家，即有机会获得手摇饮品电子礼券！周大福人寿将有专人联络您有关电子礼券的发送安排，请确保以上填写资料正确。",
        tw: "如您於遊戲限定期內成為首100名最高分數玩家，即有機會獲得手搖飲品電子禮券！ 周大福人壽將有專人聯絡您有關電子禮券的發送安排，請確保以上填寫資料正確。",
        en: "If you become one of the top 100 players with the highest scores within the game's promotional period, you will have the chance to receive a digital beverage voucher! A representative from CTF Life will contact you regarding the voucher arrangement. Please ensure the above information provided is accurate."
    },
    "gameAnswer_toggle_tips": {
        cn: "请全部同意后点击完成",
        tw: "請全部同意後點擊完成",
        en: "Please agree to all terms before continuing."
    },
    "gameAnswer_name_phone_wechat_tips": {
        cn: "请填写姓名、电话、微信号",
        tw: "請填寫姓名、電話、微信號",
        en: "Please fill in your name, phone number, and WeChat ID"
    },
};

// 获取当前语言的文本
export function getI18nText(key: string, language: '_01' | '_02' | '_03'): string {
    const item = I18N_TEXT[key];
    if (!item) return key;

    switch (language) {
        case '_01': return item.cn;
        case '_02': return item.tw;
        case '_03': return item.en;
        default: return item.cn;
    }
}
