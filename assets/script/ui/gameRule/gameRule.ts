import { _decorator, Component, Node, Input, EventTouch, Button, Color, Sprite, UITransform, Label } from 'cc';
import { BlockInputEvents } from 'cc';
import { AudioManager } from '../../framework/audioManager';
import { clientEvent } from '../../framework/clientEvent';
import { i18nManager } from '../../framework/i18nManager';
import { uiManager } from '../../framework/uiManager';
import { playerData } from '../../framework/playerData';
import { gameConstants } from '../../game/utils/gameConstants';
import { getI18nText } from '../../i18nText';
const { ccclass, property } = _decorator;

@ccclass('gameRule')
export class gameRule extends Component {
    @property(Node)
    ndCloseBtn: Node = null!; // 关闭按钮

    @property(Label)
    lab_shuoming: Label = null!;

    @property(Label)
    lab_liucheng: Label = null!;

    @property(Label)
    lab_1: Label = null!;
    @property(Label)
    lab_2: Label = null!;
    @property(Label)
    lab_3: Label = null!;
    @property(Label)
    lab_4: Label = null!;
    @property(Label)
    lab_5: Label = null!;
    @property(Label)
    lab_liucheng2: Label = null!;
    @property(Label)
    lab_21: Label = null!;
    @property(Label)
    lab_22: Label = null!;

    private _isClosing: boolean = false; // 是否正在关闭，防止重复触发

    onLoad() {
        // 创建半透明黑色背景
        this._createBackground();
        
        // 点击关闭按钮
        if (this.ndCloseBtn) {
            this.ndCloseBtn.on(Button.EventType.CLICK, this._onCloseClick, this);
        }

        // 点击任意位置关闭（只在背景层，不拦截内容点击）
        this.node.on(Input.EventType.TOUCH_START, this._onTouchStart, this);
    }

    onDestroy() {
        if (this.ndCloseBtn) {
            this.ndCloseBtn.off(Button.EventType.CLICK, this._onCloseClick, this);
        }
        this.node.off(Input.EventType.TOUCH_START, this._onTouchStart, this);
    }
    
    /**
     * 创建半透明黑色背景
     */
    private _createBackground() {
        // 检查是否已有背景
        if (this.node.getChildByName('bg')) return;
        
        const bgNode = new Node('bg');
        bgNode.parent = this.node;
        bgNode.setSiblingIndex(0); // 放到最底层
        
        const uiTransform = bgNode.addComponent(UITransform);
        uiTransform.setContentSize(720, 1280);
        
        const sprite = bgNode.addComponent(Sprite);
        sprite.color = new Color(0, 0, 0, 180); // 半透明黑色
    }
    
    show() {
        this._isClosing = false;
        this.node.active = true;

        const language = i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
        this.lab_shuoming.string = getI18nText('gameRule_controls_0', language);
        this.lab_liucheng.string = getI18nText('gameRule_guide_1', language);
        this.lab_1.string = getI18nText('gameRule_benefit_1', language);
        this.lab_2.string = getI18nText('gameRule_benefit_2', language);
        this.lab_3.string = getI18nText('gameRule_benefit_3', language);
        this.lab_4.string = getI18nText('gameRule_benefit_4', language);
        this.lab_5.string = getI18nText('gameRule_benefit_5', language);
        this.lab_21.string = getI18nText('gameRule_benefit_21', language);
        this.lab_22.string = getI18nText('gameRule_benefit_22', language);
        if (this.lab_liucheng2) {
            this.lab_liucheng2.string = getI18nText('gameRule_liucheng2', language);
        }

        // 播放打开音效（可选）
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);
    }

    /**
     * 关闭按钮点击
     */
    private _onCloseClick() {
        this._closePanel();
    }

    /**
     * 点击背景关闭（点击内容区域不关闭）
     */
    private _onTouchStart(event: EventTouch) {
        // 获取点击位置
        const touchLocation = event.getUILocation();
        
        // 如果点击的是关闭按钮，不处理（让按钮事件处理）
        if (this.ndCloseBtn) {
            const btnRect = this.ndCloseBtn.getComponent(UITransform);
            if (btnRect) {
                const btnPos = this.ndCloseBtn.worldPosition;
                const btnSize = btnRect.contentSize;
                const halfWidth = btnSize.width / 2;
                const halfHeight = btnSize.height / 2;
                
                if (touchLocation.x >= btnPos.x - halfWidth && 
                    touchLocation.x <= btnPos.x + halfWidth &&
                    touchLocation.y >= btnPos.y - halfHeight && 
                    touchLocation.y <= btnPos.y + halfHeight) {
                    return; // 点击在按钮上，让按钮处理
                }
            }
        }
        
        // 点击背景任意位置关闭
        this._closePanel();
    }

    /**
     * 关闭面板，留在主界面
     */
    private _closePanel() {
        if (this._isClosing) return;
        this._isClosing = true;

        // 播放关闭音效
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);

        // 标记为已展示（关闭后才算真正看过）
        console.log('[GameRule] 关闭面板，标记为已展示');
        playerData.instance.updatePlayerInfo('hasShownGameRule', true);
        playerData.instance.savePlayerInfoToLocalCache();
        
        // 验证保存成功
        const verify = playerData.instance.playerInfo['hasShownGameRule'];
        console.log('[GameRule] 验证标记:', verify);

        // 隐藏规则面板
        this.node.active = false;
        uiManager.instance.hideDialog(gameConstants.PANEL_PATH.GAME_RULE);

        // 回到主界面，不自动进入游戏
        // 用户需要点击"开始游戏"按钮才会进入游戏
    }
}
