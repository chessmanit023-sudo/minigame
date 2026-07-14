
import { _decorator, Component, Node, find, EventTouch, Label, tween, Vec3, TweenSystem, game, director, Vec2, Sprite, SpriteFrame } from 'cc';
import { AudioManager } from '../../framework/audioManager';
import { clientEvent } from '../../framework/clientEvent';
import { uiManager } from '../../framework/uiManager';
import { i18nManager } from '../../framework/i18nManager';
import { GameManager } from '../../game/gameManager';
import { Ai } from '../../game/role/ai';
import { gameConstants } from '../../game/utils/gameConstants';
import { gameUtils } from '../../game/utils/gameUtils';
import { getI18nText } from '../../i18nText';
const { ccclass, property } = _decorator;

const FINGER_Y = -40;
const FINGER_MOVE_Min_X = -100; //引导移动手指最小x
const FINGER_MOVE_MAX_X = 130; //引导移动手指最大x
const FINGER_MOVE_TIME = 1; //引导移动手指时间
const COUNTDOWN_ONCE_BIGGER = 2; //倒计时变大 大小 *dt
const COUNTDOWN_ONCE_SMALLER = 2; //倒计时变小 大小 *dt
const COUNTDOWN_MIN_TIME = 0.8; //倒计时变大时间
const COUNTDOWN_INIT_SIZE = 0.8; //倒计时初始大小

@ccclass('gamePanel')
export class gamePanel extends Component {
    @property(SpriteFrame)
    sfCountdownList: Array<SpriteFrame> = []; //倒计时图片

    @property(Node)
    ndReady: Node = null!; //可点击开始游戏节点

    @property(Node)
    ndCountdown: Node = null!; //倒计时节点

    @property(Node)
    ndFinger: Node = null!; //左右移动手指节点

    @property(Node)
    ndRank: Node = null!; //排名节点

    @property(Label)
    lbRank: Label = null!; //排名文字

    @property(Node)
    ndGemProgress: Node = null!; //宝石收集进度节点

    @property(Label)
    lbGemProgress: Label = null!; //宝石收集进度文字

    @property(Label)
    lbTips: Label = null!; 

    @property(Node)
    nodeGuize: Node = null!; //规则节点
    @property(Label)
    labGuize: Label = null!; //规则文字
    @property(Label)
    labJixu: Label = null!; //继续按钮文字
    @property(Node)
    nodeGuizeItem1: Node = null!; 
    @property(Node)
    nodeGuizeItem2: Node = null!;
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
    lab_21: Label = null!;
    @property(Label)
    lab_22: Label = null!;


    private spCountdown: Sprite = null!;
    private startPoint: Vec2 = null!;
    private _countdownCheck: boolean = false; //是否为开局倒计时
    private _countdownTime: number = 0; //倒计时当前时间
    private _endRoadPos: Vec3 = new Vec3(); //当前终点位置
    private _playerRankNum: number = 0; //角色排名
    private _countdownSize: number = 0; //倒计时大小

    onLoad() {
        this.spCountdown = this.ndCountdown.getComponent(Sprite)!;
        
        // 监听开始游戏倒计时事件（从规则面板关闭后触发）
        clientEvent.on(gameConstants.CLIENTEVENT_LIST.START_GAME_COUNTDOWN, this._startGameCountdown, this);
        
        // 监听宝石收集事件
        clientEvent.on(gameConstants.CLIENTEVENT_LIST.GEM_COLLECTED, this._updateGemProgress, this);
        clientEvent.on('languageChanged', this._onLanguageChanged, this);
    }
    
    onDestroy() {
        clientEvent.off(gameConstants.CLIENTEVENT_LIST.START_GAME_COUNTDOWN, this._startGameCountdown, this);
        clientEvent.off(gameConstants.CLIENTEVENT_LIST.GEM_COLLECTED, this._updateGemProgress, this);
        clientEvent.off('languageChanged', this._onLanguageChanged, this);
    }
    
    /**
     * 开始游戏倒计时（从规则面板关闭后触发）
     */
    private _startGameCountdown() {
        // 初始化倒计时
        this.ndReady.active = true;
        this._countdownCheck = true;
        this._countdownTime = 3;
        this.changeCountdownNum(2);
        this._countdownSize = COUNTDOWN_INIT_SIZE;
        this._guideFingerAni(true);
        
        // 开始角色倒计时
        this.rolestartCountdown();
        
        // 切换相机
        clientEvent.dispatchEvent(gameConstants.CLIENTEVENT_LIST.CHANGECAMERATYPE, gameConstants.CAMERA_TYPE_LIST.READY_TO_PLAYING);
        
        // 隐藏排名
        this.ndRank.active = false;
        
        this._endRoadPos.set(GameManager.ndRoadEnd.position);
    }

    onEnable() {
        this.node.on(Node.EventType.TOUCH_MOVE, this._touchMove, this)
        this.node.on(Node.EventType.TOUCH_END, this._touchEnd, this)
        this.node.on(Node.EventType.TOUCH_CANCEL, this._touchEnd, this)
    }
    onDisable() {
        this.node.off(Node.EventType.TOUCH_MOVE, this._touchMove, this)
        this.node.off(Node.EventType.TOUCH_END, this._touchEnd, this)
        this.node.off(Node.EventType.TOUCH_CANCEL, this._touchEnd, this)

        this._guideFingerAni(false);
    }

    onJixuClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);
        if (this.nodeGuize) {
            this.nodeGuize.active = false;
        }
        this._startGameCountdown();
    }

    private _touchMove(event: EventTouch) {
        if (!GameManager.isGameStart) return;

        if (!this.startPoint) {
            this.startPoint = event.getStartLocation();
        }
        //主角仅左右转向，因此只需要x轴的变化值
        let moveX = event.getLocation().x - this.startPoint.x;
        this.startPoint = event.getLocation();
        moveX = Math.min(moveX, 50);
        moveX = Math.max(moveX, -50);
        clientEvent.dispatchEvent(gameConstants.CLIENTEVENT_LIST.TOUCHMOVEPLAYER, moveX * gameConstants.GAME_TOUCH_MUL);
    }

    private _touchEnd(event: EventTouch) {
        if (!GameManager.isGameStart) return;
        this.startPoint = null!;
        clientEvent.dispatchEvent(gameConstants.CLIENTEVENT_LIST.TOUCHMOVEPLAYER, 0);
    }

    public show(countdownCheck: boolean) {
        this._updateTipsText();

        if (countdownCheck) {
            // 先展示关卡规则，点击继续后再倒计时
            if (this.nodeGuize) {
                this.nodeGuize.active = true;
            }
            this.ndReady.active = false;
            this._countdownCheck = false;
            this._updateGuizeText();
            this._updateJixuText();
            this.ndRank.active = false;
        } else {
            // 从暂停返回，直接恢复游戏界面
            if (this.nodeGuize) {
                this.nodeGuize.active = false;
            }
            this.ndReady.active = false;
            this._countdownCheck = false;
        }
        
        this._endRoadPos.set(GameManager.ndRoadEnd.position);
        this._changeRank(1); //暂时默认第一名
        
        // 更新宝石收集进度显示
        this._updateGemProgress();
    }

    /**
     * 更新宝石收集进度显示
     */
    private _updateGemProgress() {
        // 检查当前关卡是否需要收集宝石
        const needShowGem = GameManager.currentLevel >= gameConstants.GEM_REWARD_LEVEL;
        
        if (this.ndGemProgress) {
            this.ndGemProgress.active = needShowGem;
        }
        
        if (needShowGem && this.lbGemProgress) {
            const collected = GameManager.gemCollectedCount || 0;
            const total = GameManager.gemTotalCount || 0;
            const language = i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
            const gemTitle = getI18nText('gamePanel_gemTitle', language);
            this.lbGemProgress.string = `${gemTitle}${collected}/${total}`;
        }
    }

    /**
     * 所有角色执行 开始倒计时 相关操作
     */
    private rolestartCountdown() {
        GameManager.scriptPlayer.startCountdown();
        for (let i = 0; i < GameManager.scriptAiList.length; i++) {
            GameManager.scriptAiList[i].startCountdown();
        }
    }

    /**
     * 开始游戏
     */
    private rolePlayerStart() {
        GameManager.scriptPlayer.playerStart();
        for (let i = 0; i < GameManager.scriptAiList.length; i++) {
            GameManager.scriptAiList[i].playerStart();
        }
    }

    /**
     * 手指的引导动画
     * @param state 
     */
    private _guideFingerAni(state: boolean) {
        if (state) {
            this.ndFinger.setPosition(FINGER_MOVE_Min_X, FINGER_Y, 0);
            tween(this.ndFinger)
                .to(FINGER_MOVE_TIME, { position: new Vec3(FINGER_MOVE_MAX_X, FINGER_Y, 0) })
                .to(FINGER_MOVE_TIME, { position: new Vec3(FINGER_MOVE_Min_X, FINGER_Y, 0) })
                .union()
                .repeatForever()
                .start()
        } else {
            TweenSystem.instance.ActionManager.removeAllActionsFromTarget(this.ndFinger);
        }
    }

    /**
     * 更新名次显示
     * @param rankNum 当前名次
     */
    private _changeRank(rankNum: number) {
        this._updateRankText(rankNum);
    }

    /**
     * 语言切换后刷新本面板文案
     */
    private _onLanguageChanged() {
        this._updateTipsText();
        this._updateGuizeText();
        this._updateJixuText();
        this._updateGemProgress();
        this._updateRankText(this._playerRankNum > 0 ? this._playerRankNum : 1);
    }

    /**
     * 按当前关卡刷新规则文案
     */
    private _updateGuizeText() {
        if (!this.labGuize) return;
        const language = i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
        const level = GameManager.currentLevel || 1;
        this.nodeGuizeItem1.active = level == 1;
        this.nodeGuizeItem2.active = level >= 2;
        const key = level >= gameConstants.GEM_REWARD_LEVEL
            ? 'gamePanel_guize_level2'
            : 'gamePanel_guize_level1';
        this.labGuize.string = getI18nText(key, language);

        this.lab_1.string = getI18nText('gameRule_benefit_1', language);
        this.lab_2.string = getI18nText('gameRule_benefit_2', language);
        this.lab_3.string = getI18nText('gameRule_benefit_3', language);
        this.lab_4.string = getI18nText('gameRule_benefit_4', language);
        this.lab_5.string = getI18nText('gameRule_benefit_5', language);
        this.lab_21.string = getI18nText('gameRule_benefit_21', language);
        this.lab_22.string = getI18nText('gameRule_benefit_22', language);
    }

    /**
     * 刷新继续按钮文案
     */
    private _updateJixuText() {
        if (!this.labJixu) return;
        const language = i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
        this.labJixu.string = getI18nText('gamePanel_jixu', language);
    }

    /**
     * 刷新引导文案
     */
    private _updateTipsText() {
        if (!this.lbTips) return;
        const language = i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
        this.lbTips.string = getI18nText('gamePanel_guide_3', language);
    }

    /**
     * 刷新排名文案（多语言前缀 + 数字）
     */
    private _updateRankText(rankNum: number) {
        const language = i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
        const rankTitle = getI18nText('gamePanel_rankTitle_2', language);
        this.lbRank.string = `${rankTitle}${rankNum}`;
    }

    /**
     * 返回主界面
     */
    public onBtnHomeClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);

        uiManager.instance.showDialog(gameConstants.PANEL_PATH.CLOSEPANEL);
        uiManager.instance.hideDialog(gameConstants.PANEL_PATH.GAME_PANEL);

        director.pause();
    }

    /**
     * 改变倒计时图片
     * @param num sfCountdownList的图片下标
     */
    private changeCountdownNum(num: number) {
        this.spCountdown.spriteFrame = this.sfCountdownList[num];
    }

    update(dt: number) {
        if (this._countdownCheck) {
            let countdownTime = this._countdownTime - dt;

            if (Math.floor(countdownTime) === -1) {
                AudioManager.instance.playSound(gameConstants.MUSIC_LIST.COUNTDOWN_END);

                this._countdownCheck = false;
                this.ndReady.active = false;
                this._guideFingerAni(false);

                clientEvent.dispatchEvent(gameConstants.CLIENTEVENT_LIST.CHANGECAMERATYPE, gameConstants.CAMERA_TYPE_LIST.PLAYING);

                GameManager.isGameStart = true;

                this.rolePlayerStart();

                this.checkPlayerRankNum();
                // this.ndRank.active = true;
            } else {
                //切换图片
                if (Math.floor(countdownTime) !== Math.floor(this._countdownTime)) {
                    AudioManager.instance.playSound(gameConstants.MUSIC_LIST.COUNTDOWN);

                    this.changeCountdownNum(Math.floor(countdownTime));
                    this._countdownSize = COUNTDOWN_INIT_SIZE;
                }

                //动画
                const aniTime = countdownTime % 1;
                if (aniTime > COUNTDOWN_MIN_TIME) {
                    this._countdownSize += dt * COUNTDOWN_ONCE_BIGGER;
                } else {
                    this._countdownSize -= dt * COUNTDOWN_ONCE_SMALLER;
                    if (this._countdownSize < 0) {
                        this._countdownSize = 0
                    }
                }
                this.ndCountdown.setScale(this._countdownSize, this._countdownSize, this._countdownSize);

                this._countdownTime = countdownTime;
            }
        }

        if (!GameManager.isGameStart) return;

        if (director.getTotalFrames() % 3 === 0) { //排名三帧更新一次
            this.checkPlayerRankNum();
        }
    }

    /**
     * 计算当前主角排名
     */
    private checkPlayerRankNum() {
        if (GameManager.isWin) return;
        let rankNum = 1;
        const selfPos = GameManager.scriptPlayer.node.position;
        const selfLen = gameUtils.getTwoPosXZLength(selfPos.x, selfPos.z, this._endRoadPos.x, this._endRoadPos.z);

        const aiLength = GameManager.scriptAiList.length;
        for (let i = 0; i < aiLength; i++) {
            const scriptAi = GameManager.scriptAiList[i] as Ai;
            const aiPos = scriptAi.node.position;
            if (!scriptAi.checkAiDead() && //角色如果死亡 不判断
                gameUtils.getTwoPosXZLength(aiPos.x, aiPos.z, this._endRoadPos.x, this._endRoadPos.z) < selfLen) {
                //当前的ai相对于终点的距离比主角近
                rankNum++;
            }
            if (i === aiLength - 1 && rankNum !== this._playerRankNum) {
                this.updateRankNum(rankNum);
            }
        }
    }

    /**
     * 更新当前主角排名
     * @param rankNum 
     */
    private updateRankNum(rankNum: number) {
        this._playerRankNum = rankNum;
        this._updateRankText(this._playerRankNum);
    }
}
