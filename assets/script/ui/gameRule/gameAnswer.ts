import { _decorator, Component, Node, Toggle, Button, EditBox, Label, ToggleContainer, Color, Sprite, RichText } from 'cc';
import { playerData } from '../../framework/playerData';
import { uiManager } from '../../framework/uiManager';
import { i18nManager } from '../../framework/i18nManager';
import { getI18nText } from '../../i18nText';
import { AudioManager } from '../../framework/audioManager';
import { gameConstants } from '../../game/utils/gameConstants';
import { constant } from '../../framework/constant';
const { ccclass, property } = _decorator;

// 隐私协议链接（请在编辑器中绑定对应的 Label 节点）
const PRIVACY_POLICY_URL = 'https://www.example.com/privacy-policy';

// 问卷答案数据结构
export interface IGameAnswer {
    userId: string;           // 用户ID
    giftChoice: string;       // 电子礼券选择 (toggle1/toggle2)
    name: string;             // 姓名
    phone: string;            // 电话号码
    wechat: string;           // 微信号
    privacyAgreed: boolean;   // 是否同意隐私条款
}

@ccclass('GameAnswer')
export class GameAnswer extends Component {
    @property(Node)
    ndCloseBtn: Node = null!;

    @property(Node)
    ndSubmitBtn: Node = null!;

    @property(Label)
    lab_des: Label = null!;
    @property(Label)
    lab_xingming: Label = null!;
    @property(Label)
    lab_weixin: Label = null!;
    @property(Label)
    lab_dianhua: Label = null!;
    @property(Label)
    lab_liwu: Label = null!;
    @property(Label)
    lab_yinpin1: Label = null!;
    @property(Label)
    lab_yinpin2: Label = null!;
    @property(Label)
    lab_qian100: Label = null!;
    @property(Label)
    lab_yinsixieyi: Label = null!;
    @property(Label)
    lab_wancheng: Label = null!;
    @property(Label)
    lab_1: Label = null!;
    @property(Label)
    lab_2: Label = null!;
    @property(Label)
    lab_3: Label = null!;
    @property(Label)
    lab_4: Label = null!;
    @property(RichText)
    lab_5: RichText = null!;
    @property(Label)
    lab_ruguo: Label = null!;
    @property(Label)
    lab_toggle_1: Label = null!;
    @property(Label)
    lab_toggle_2: Label = null!;
    @property(Label)
    lab_toggle_3: Label = null!;
    @property(Label)
    lab_toggle_4: Label = null!;
    @property(Node)
    nodeStep1: Node = null!;
    @property(Node)
    nodeStep2: Node = null!;
    @property(Toggle)
    toggle1: Toggle = null!;
    @property(Toggle)
    toggle2: Toggle = null!;
    @property(Toggle)
    toggle3: Toggle = null!;
    @property(Toggle)
    toggle4: Toggle = null!;
    @property(Label)
    lab_zhici: Label = null!;
    @property(Node)
    nodeWeb: Node = null!;

    private _toggleContainer: ToggleContainer | null = null;
    private _editBoxes: EditBox[] = [];
    private _selectedToggle: string = 'toggle1'; // 'toggle1' 或 'toggle2'
    private _callback: Function | null = null;
    private _level: number = 1;
    private _gemCount: number = 0;

    onLoad() {
        // 动态查找组件（避免在 prefab 修改时属性丢失）
        this._findComponents();
        this._refreshI18nLabels();

        // 绑定按钮事件
        this.ndCloseBtn?.getComponent(Button)?.node.on(Button.EventType.CLICK, this._onCloseClick, this);
        this.ndSubmitBtn?.getComponent(Button)?.node.on(Button.EventType.CLICK, this._onSubmitClick, this);

        // 监听 Toggle 选择变化
        if (this._toggleContainer) {
            this._toggleContainer.node.children.forEach((toggleNode, index) => {
                const toggle = toggleNode.getComponent(Toggle);
                if (toggle) {
                    toggle.node.on(Toggle.EventType.TOGGLE, () => {
                        if (toggle.isChecked) {
                            this._selectedToggle = index === 0 ? 'toggle1' : 'toggle2';
                            console.log(`[GameAnswer] 选择: ${this._selectedToggle}`);
                        }
                    }, this);
                }
            });
        }
       
    }

    /**
     * 动态查找界面组件
     */
    private _findComponents() {
        // 查找 ToggleContainer
        this._toggleContainer = this.node.getComponentInChildren(ToggleContainer);

        // 查找所有 EditBox
        this._editBoxes = this.node.getComponentsInChildren(EditBox);
        console.log(`[GameAnswer] 找到 ${this._editBoxes.length} 个 EditBox`);
    }

    /**
     * 显示问卷界面
     * 兼容两种调用方式：
     * 1) show([level, gemCount, callback])
     * 2) show(level, gemCount, callback)
     */
    show(levelOrArgs?: number | any[], gemCount?: number, callback?: Function) {
        console.log('[GameAnswer] 显示问卷界面');

        if (Array.isArray(levelOrArgs)) {
            this._level = levelOrArgs[0] || 1;
            this._gemCount = levelOrArgs[1] || 0;
            this._callback = levelOrArgs[2] || null;
        } else {
            this._level = levelOrArgs || 1;
            this._gemCount = gemCount || 0;
            this._callback = callback || null;
        }

        // 重置表单
        this._resetForm();

        console.log(`[GameAnswer] 关卡: ${this._level}, 宝石: ${this._gemCount}`);

        if (this.nodeWeb) {
            this.nodeWeb.active = false;
        }
        if (this.nodeStep1) {
            this.nodeStep1.active = true;
        }
        if (this.nodeStep2) {
            this.nodeStep2.active = false;
        }

        this._refreshI18nLabels();
    }

    private _refreshI18nLabels() {
        const language = i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
        const t = (key: string) => getI18nText(key, language);

        if (this.lab_des?.isValid) this.lab_des.string = t('gameAnswer_subtitle');
        if (this.lab_xingming?.isValid) this.lab_xingming.string = t('gameAnswer_nameLabel');
        if (this.lab_weixin?.isValid) this.lab_weixin.string = t('gameAnswer_wechatLabel');
        if (this.lab_dianhua?.isValid) this.lab_dianhua.string = t('gameAnswer_phoneLabel');
        if (this.lab_liwu?.isValid) this.lab_liwu.string = t('gameAnswer_giftChoiceTitle');
        if (this.lab_yinpin1?.isValid) this.lab_yinpin1.string = t('gameAnswer_giftOptionHK');
        if (this.lab_yinpin2?.isValid) this.lab_yinpin2.string = t('gameAnswer_giftOptionCN');
        if (this.lab_qian100?.isValid) this.lab_qian100.string = t('gameAnswer_qian100');
        if (this.lab_yinsixieyi?.isValid) this.lab_yinsixieyi.string = t('gameAnswer_privacyLabel');
        if (this.lab_wancheng?.isValid) this.lab_wancheng.string = t('gameAnswer_completeLabel');
        if (this.lab_1?.isValid) this.lab_1.string = t('gameAnswer_lab_1');
        if (this.lab_2?.isValid) this.lab_2.string = t('gameAnswer_lab_2');
        if (this.lab_3?.isValid) this.lab_3.string = t('gameAnswer_lab_3');
        if (this.lab_4?.isValid) this.lab_4.string = t('gameAnswer_lab_4');
        if (this.lab_5?.isValid) this.lab_5.string = t('gameAnswer_lab_5');
        if (this.lab_ruguo?.isValid) this.lab_ruguo.string = t('gameAnswer_lab_ruguo');
        if (this.lab_toggle_1?.isValid) this.lab_toggle_1.string = t('gameAnswer_toggle_1');
        if (this.lab_toggle_2?.isValid) this.lab_toggle_2.string = t('gameAnswer_toggle_2');
        if (this.lab_toggle_3?.isValid) this.lab_toggle_3.string = t('gameAnswer_toggle_3');
        if (this.lab_toggle_4?.isValid) this.lab_toggle_4.string = t('gameAnswer_toggle_4');
        if (this.lab_zhici?.isValid) this.lab_zhici.string = t('gameAnswer_lab_chizhi');
        
    }

    onCloseClick(){
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);
        this._close();
    }

    onCloseWebClick(){
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);
        this.nodeWeb.active = false;
    }

    /**
     * 重置表单
     */
    private _resetForm() {
        this._selectedToggle = '';

        // 重置 Toggle
        if (this._toggleContainer) {
            this._toggleContainer.node.children.forEach((toggleNode, index) => {
                const toggle = toggleNode.getComponent(Toggle);
                if (toggle) {
                    toggle.isChecked = false; // 取消选中，强制用户选择
                }
            });
        }

        // 重置所有输入框
        this._editBoxes.forEach(editBox => {
            if (editBox) editBox.string = '';
        });
    }

    /**
     * 关闭按钮点击
     */
    private _onCloseClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);
        console.log('[GameAnswer] 点击关闭按钮');
        this._close();
    }

    onStartClick(){
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);
        this.nodeWeb.active = true;
    }

    /**
     * 提交按钮点击
     */
    private _onSubmitClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);
        console.log('[GameAnswer] 点击提交按钮');

        // 验证必填项
        if (!this._validateForm()) {
            return;
        }
        const language = i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
        const t = (key: string) => getI18nText(key, language);

        if(!this.toggle1.isChecked || !this.toggle2.isChecked || !this.toggle3.isChecked || !this.toggle4.isChecked){
            uiManager.instance.showDialog(gameConstants.PANEL_PATH.TIPS_PANEL, t('gameAnswer_toggle_tips'))
            return;
        }

        // 收集答案（根据 EditBox 顺序：姓名、电话、电邮、微信）
        const answer: IGameAnswer = {
            userId: this._getUserId(),
            giftChoice: this._selectedToggle,
            name: this._getEditBoxValue(0),
            phone: this._getEditBoxValue(1),
            wechat: this._getEditBoxValue(2),
            privacyAgreed: true,
        };

        if(answer.name.trim() === '' || answer.phone.trim() === '' || answer.wechat.trim() === ''){
            uiManager.instance.showDialog(gameConstants.PANEL_PATH.TIPS_PANEL, t('gameAnswer_name_phone_wechat_tips'))
            return;
        }

        // 提交到服务器
        this._submitToServer(answer);

        // 关闭界面
        this._close();

    }

    /**
     * 提交奖励信息到服务器
     */
    private _submitToServer(answer: IGameAnswer): void {
        const url = `${constant.SERVER_URL}/api/user/v1/submitRewardInfo`;

        // 转换奖励选择：toggle1 -> '1', toggle2 -> '2'
        const reward = answer.giftChoice === 'toggle1' ? '1' : '2';

        const requestData = {
            name: answer.name,
            phone: answer.phone,
            reward: reward,
            wechat: answer.wechat
        };

        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xhr.setRequestHeader('Authorization', `Bearer ${playerData.instance.authToken}`);

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        console.log('[GameAnswer] 服务器提交成功:', response);
                    } catch (e) {
                        console.error('[GameAnswer] 解析服务器响应失败:', e);
                    }
                } else {
                    console.error('[GameAnswer] 服务器提交失败:', xhr.status, xhr.responseText);
                }
            }
        };

        xhr.onerror = () => {
            console.error('[GameAnswer] 网络请求失败，无法提交到服务器');
        };

        xhr.send(JSON.stringify(requestData));
        console.log('[GameAnswer] 正在提交到服务器:', requestData);
    }

    /**
     * 检查表单是否全部完成
     */
    private _checkFormComplete(): boolean {
        // 检查礼券选择
        if (!this._selectedToggle) {
            return false;
        }

        // 检查所有 EditBox 是否都已填写
        for (const editBox of this._editBoxes) {
            if (!editBox?.string?.trim()) {
                return false;
            }
        }

        return true;
    }

    /**
     * 验证表单（提交前最终检查）
     */
    private _validateForm(): boolean {
        return this._checkFormComplete();
    }

    /**
     * 获取指定索引的 EditBox 值
     */
    private _getEditBoxValue(index: number): string {
        if (index >= 0 && index < this._editBoxes.length) {
            return this._editBoxes[index]?.string?.trim() || '';
        }
        return '';
    }

    /**
     * 保存答案到玩家数据
     */
    private _saveAnswer(answer: IGameAnswer) {
        // 获取已有答案数组
        const allAnswers = this._getAllAnswers();
        allAnswers.push(answer);

        // 保存到玩家数据
        playerData.instance.setSetting('gameAnswers', allAnswers);
        playerData.instance.saveAll();

        console.log(`[GameAnswer] 答案已保存，当前共 ${allAnswers.length} 条记录`);
    }

    /**
     * 获取所有历史答案
     */
    private _getAllAnswers(): IGameAnswer[] {
        const answers = playerData.instance.settings?.gameAnswers;
        if (answers && Array.isArray(answers)) {
            return answers;
        }
        return [];
    }

    /**
     * 获取用户ID
     */
    private _getUserId(): string {
        let userId = playerData.instance.settings?.userId;
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            playerData.instance.setSetting('userId', userId);
        }
        return userId;
    }

    /**
     * 隐私协议点击事件
     * 请在编辑器中将此方法绑定到 privacyLabel 节点的 Button 组件点击事件
     */
    public onPrivacyClick() {
        console.log('[GameAnswer] 点击隐私协议');
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);
        this._copyToClipboard(PRIVACY_POLICY_URL);
    }

    /**
     * 复制文本到剪贴板（兼容微信小游戏、Web、桌面端）
     */
    private _copyToClipboard(text: string) {
        // 1. 优先尝试微信小游戏 API
        //@ts-ignore
        if (typeof wx !== 'undefined' && wx.setClipboardData) {
            //@ts-ignore
            wx.setClipboardData({
                data: text,
                success: () => {
                    console.log(`[GameAnswer] 隐私链接已复制(wx): ${text}`);
                    const language = i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
                    const toastTitle = getI18nText('common_link_copied', language);
                    //@ts-ignore
                    wx.showToast({ title: toastTitle, icon: 'success', duration: 1500 });
                },
                fail: (err: any) => {
                    console.error('[GameAnswer] 微信复制失败:', err);
                    this._tryNativeClipboard(text);
                }
            });
            return;
        }

        // 2. 尝试原生 JavaScript Clipboard API
        this._tryNativeClipboard(text);
    }

    /**
     * 尝试使用原生 Clipboard API
     */
    private _tryNativeClipboard(text: string) {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                console.log(`[GameAnswer] 隐私链接已复制(navigator): ${text}`);
            }).catch((err) => {
                console.error('[GameAnswer] navigator.clipboard 失败:', err);
                this._fallbackCopy(text);
            });
        } else {
            // 3. 降级方案
            this._fallbackCopy(text);
        }
    }

    /**
     * 降级复制方案（兼容旧浏览器）
     */
    private _fallbackCopy(text: string) {
        // 检查是否在浏览器环境
        if (typeof document === 'undefined') {
            console.warn('[GameAnswer] 无法复制，document 不可用');
            return;
        }

        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.select();
        textArea.setSelectionRange(0, 99999); // 兼容移动端
        try {
            const success = document.execCommand('copy');
            console.log(`[GameAnswer] 隐私链接已复制(fallback): ${text}, success=${success}`);
        } catch (err) {
            console.error('[GameAnswer] fallback 复制失败:', err);
        }
        document.body.removeChild(textArea);
    }

    /**
     * 关闭界面
     */
    private _close() {
        // 执行回调
        if (this._callback) {
            this._callback();
        }

        // 不缓存的面板：直接销毁节点
        this.node.destroy();
    }

    onDestroy() {
        // 移除事件监听（安全移除，避免节点已被销毁时报错）
        try {
            if (this.ndCloseBtn && this.ndCloseBtn.isValid) {
                const btn = this.ndCloseBtn.getComponent(Button);
                if (btn) {
                    btn.node.off(Button.EventType.CLICK, this._onCloseClick, this);
                }
            }
        } catch (e) {
            // 忽略销毁时的错误
        }

        try {
            if (this.ndSubmitBtn && this.ndSubmitBtn.isValid) {
                const btn = this.ndSubmitBtn.getComponent(Button);
                if (btn) {
                    btn.node.off(Button.EventType.CLICK, this._onSubmitClick, this);
                }
            }
        } catch (e) {
            // 忽略销毁时的错误
        }
    }
}
