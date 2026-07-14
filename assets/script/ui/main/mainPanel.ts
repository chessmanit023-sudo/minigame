
import { _decorator, Component, Node, Label, Vec3, ProgressBar, SpriteFrame, Sprite, game, PhysicsSystem, EventTouch } from 'cc';
import { AudioManager } from '../../framework/audioManager';
import { clientEvent } from '../../framework/clientEvent';
import { playerData } from '../../framework/playerData';
import { uiManager } from '../../framework/uiManager';
import { gameConstants } from '../../game/utils/gameConstants';
import { i18nManager, LanguageType, LANGUAGE_NAMES } from '../../framework/i18nManager';
import { loginManager } from '../../framework/loginManager';
import { getI18nText } from '../../i18nText';
const { ccclass, property } = _decorator;

const ICON_LIST = {
    VIDEO: 0,
    DIAMOND: 1,
}

@ccclass('MainPanel')
export class MainPanel extends Component {
    @property(Label)
    lbDiamond: Label = null!; //左上角 当前拥有钻石总数

    @property(Node)
    ndDiamodList: Array<Node> = []; //钻石按钮显示

    @property(Node)
    ndBrickList: Array<Node> = []; //砖块按钮显示

    @property(ProgressBar)
    pbLevel: ProgressBar = null!; //关卡进度条

    @property(Node)
    ndLevelNodeList: Array<Node> = []; //等级图片节点

    @property(Label)
    lbLevelList: Array<Label> = []; //等级数字节点

    @property(SpriteFrame)
    sfIconList: Array<SpriteFrame> = [];

    @property(Node)
    btnLanguage1: Node = null!; //语言切换按钮
    @property(Node)
    btnLanguage2: Node = null!; //语言切换按钮
    @property(Node)
    btnLanguage3: Node = null!; //语言切换按钮

    @property(Label)
    labZuanshiLevel: Label = null!; //钻石等级数字节点

    @property(Label)
    labJimuLevel: Label = null!; //积木等级数字节点

    private _languageList: LanguageType[] = [LanguageType.CN, LanguageType.TW, LanguageType.EN];
    private _currentLangIndex: number = 0;

    show() {
        // 初始化语言按钮显示
        this._initLanguageButton();
        this._hideUnusedUI();
        this._refreshMainCostDisplayByLanguage();
    }

    /**
     * 初始化语言按钮
     */
    private _initLanguageButton() {
        // 获取当前语言索引
        const currentLang = i18nManager.instance.getCurrentLanguage();
        console.log('[MainPanel] 当前语言:', currentLang, '=>', LANGUAGE_NAMES[currentLang]);
        this._currentLangIndex = this._languageList.indexOf(currentLang);
        if (this._currentLangIndex < 0) {
            this._currentLangIndex = 0;
        }

        this.btnLanguage1.active = currentLang !== LanguageType.CN;
        this.btnLanguage2.active = currentLang !== LanguageType.TW;
        this.btnLanguage3.active = currentLang !== LanguageType.EN;

        // 更新语言显示
        this._updateLanguageDisplay();
    }

    /**
     * 更新语言按钮显示
     */
    private _updateLanguageDisplay() {
        const currentLang = this._languageList[this._currentLangIndex];
        this.btnLanguage1.active = currentLang !== LanguageType.CN;
        this.btnLanguage2.active = currentLang !== LanguageType.TW;
        this.btnLanguage3.active = currentLang !== LanguageType.EN;
    }

    /**
     * 按当前语言刷新主界面价格显示文案
     */
    private _refreshMainCostDisplayByLanguage() {
        this._updateBrickBtn();
        this._updateDiamondBtn();
        this._updateDiamond();
    }

    /**
     * 获取当前语言对应文案
     */
    private _getCurrentLangText(key: string): string {
        const currentLang = i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
        return getI18nText(key, currentLang);
    }

    private _hideUnusedUI() {
        // 只隐藏与钻石无关的UI节点
        const hideNodeNameList: string[] = [];
        for (const nodeName of hideNodeNameList) {
            const node = this._findNodeByName(this.node, nodeName);
            if (node) {
                node.active = false;
            }
        }

        this.pbLevel.node.active = false;
        for (let i = 0; i < this.ndLevelNodeList.length; i++) {
            this.ndLevelNodeList[i].active = false;
        }
        for (let i = 0; i < this.lbLevelList.length; i++) {
            this.lbLevelList[i].node.active = false;
        }

        // 初始化钻石和砖块按钮显示
        this._updateDiamond();
        this._updateDiamondBtn();
        this._updateBrickBtn();
    }

    private _findNodeByName(root: Node, name: string): Node | null {
        if (root.name === name) {
            return root;
        }

        for (let i = 0; i < root.children.length; i++) {
            const child = root.children[i];
            const target = this._findNodeByName(child, name);
            if (target) {
                return target;
            }
        }

        return null;
    }

    /**
     * 判断当前钻石数是否够升级
     */
    private _checkVideo(costNum: number) {
        if (costNum > playerData.instance.playerInfo['diamond']) {
            return true;
        }
        return false;
    }

    /**
     * 更新砖块显示
     */
    private _updateBrickBtn() {
        const nowNum = this._getNowBrick();
        const isVideo = this._checkVideo(nowNum);
        const str = this._getCurrentLangText('xiaohao_label');
        this.labJimuLevel.string = this._getCurrentLangText('mainPanel_brick_label');
        if (isVideo) {
            // this.ndBrickList[0].getComponent(Sprite)!.spriteFrame = this.sfIconList[ICON_LIST.VIDEO];
            this.ndBrickList[1].getComponent(Label)!.string = this._getCurrentLangText(gameConstants.LANGUAGE_LIST.VIDEO);
        } else {
            // this.ndBrickList[0].getComponent(Sprite)!.spriteFrame = this.sfIconList[ICON_LIST.DIAMOND];
            this.ndBrickList[1].getComponent(Label)!.string = str + nowNum.toString();
        }
    }

    /**
     * 更新钻石显示
     */
    private _updateDiamondBtn() {
        const nowNum = this._getNowDiamond();
        const isVideo = this._checkVideo(nowNum);
        const str = this._getCurrentLangText('xiaohao_label');
        const strLevel = this._getCurrentLangText('mainPanel_diamond_label');
        this.labZuanshiLevel.string = strLevel + playerData.instance.playerInfo['mainDiamondMul'].toString();
        if (isVideo) {
            // this.ndDiamodList[0].getComponent(Sprite)!.spriteFrame = this.sfIconList[ICON_LIST.VIDEO];
            this.ndDiamodList[1].getComponent(Label)!.string = this._getCurrentLangText(gameConstants.LANGUAGE_LIST.VIDEO);
        } else {
            // this.ndDiamodList[0].getComponent(Sprite)!.spriteFrame = this.sfIconList[ICON_LIST.DIAMOND];
            this.ndDiamodList[1].getComponent(Label)!.string = str + nowNum.toString();
        }
    }

    /**
     * 更新关卡等级
     */
    private _updateLevel() {
        const levelNum = Number(playerData.instance.playerInfo['level']);
        if (levelNum === Number(this.lbLevelList[2].string)) return;

        this.pbLevel.node.setScale(1, 1, 1);
        for (let i = 0; i < this.ndLevelNodeList.length; i++) {
            this.ndLevelNodeList[i].active = true;
        }
        for (let i = 0; i < this.lbLevelList.length; i++) {
            this.lbLevelList[i].node.active = true;
        }

        if (levelNum === 1) {
            this.pbLevel.progress = 0;
            this.pbLevel.node.setPosition(new Vec3(96, 0, 0));
            this.pbLevel.node.setScale(0.6, 1, 1);

            this.lbLevelList[0].node.active = false;
            this.lbLevelList[1].node.active = false;

            this.ndLevelNodeList[0].active = false;
            this.ndLevelNodeList[1].active = false;
        } else if (levelNum === 2) {
            this.pbLevel.progress = 0.3;
            this.pbLevel.node.setPosition(new Vec3(50, 0, 0));

            this.ndLevelNodeList[0].active = false;

            this.lbLevelList[0].node.active = false;

            this.lbLevelList[1].string = (levelNum - 1).toString();
        } else {
            this.pbLevel.progress = 0.5;
            this.pbLevel.node.setPosition(new Vec3(0, 0, 0));

            this.lbLevelList[1].string = (levelNum - 1).toString();
            this.lbLevelList[0].string = (levelNum - 2).toString();
        }

        this.lbLevelList[2].string = levelNum.toString();
        this.lbLevelList[3].string = (levelNum + 1).toString();
        this.lbLevelList[4].string = (levelNum + 2).toString();
    }

    /**
     * 更新钻石
     */
    private _updateDiamond() {
        const diaMondNum = playerData.instance.playerInfo['diamond'];
        const str = this._getCurrentLangText('mainPanel_score_label');
        this.lbDiamond.string = str + diaMondNum.toString();
    }

    /**
     * 开始游戏按钮
     * 完整的微信登录流程集成
     */
    public onBtnStartClick() {
        // 已登录，播放音效
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);
        uiManager.instance.showDialog(gameConstants.PANEL_PATH.GAME_START_TIPS, [()=>{
            this._startGame();
        }]);
    }

    /**
     * 显示用户信息（可选：在界面上显示头像和昵称）
     */
    private _showUserInfo() {
        const userInfo = loginManager.getUserInfo();
        if (userInfo) {
            // 可以在这里更新 UI 显示用户头像和昵称
            // this.lbNickName.string = userInfo.nickName;
            // this.spriteAvatar.spriteFrame = ... 加载头像
            console.log('[MainPanel] 显示用户信息:', userInfo.nickName, userInfo.avatarUrl);
        }
    }

    /**
     * 实际开始游戏（每次从第一关开始）
     */
    private _startGame() {
        clientEvent.dispatchEvent(gameConstants.CLIENTEVENT_LIST.RESTARTGAME);
        uiManager.instance.showDialog(gameConstants.PANEL_PATH.GAME_PANEL, [true], ()=>{
            uiManager.instance.hideDialog(gameConstants.PANEL_PATH.MAIN_PANEL)
        });
    }

    /**
     * 设置按钮
     */
    public onBtnSettingClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);

        uiManager.instance.showDialog(gameConstants.PANEL_PATH.SETTING_PANEL);
        uiManager.instance.hideDialog(gameConstants.PANEL_PATH.MAIN_PANEL);
    }

    /**
     * 商店按钮
     */
    public onBtnShopClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);

        uiManager.instance.showDialog(gameConstants.PANEL_PATH.SHOP_PANEL);
        uiManager.instance.hideDialog(gameConstants.PANEL_PATH.MAIN_PANEL);
    }

    public onBtnRuleClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);

        uiManager.instance.showDialog(gameConstants.PANEL_PATH.GAME_RULE);
    }

    /**
     * 砖块添加按钮
     */
    public onBtnAddBrickClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);

        if (this._checkVideo(this._getNowBrick())) { //视频观看
            uiManager.instance.showDialog(gameConstants.PANEL_PATH.VIDEO_PANEL, ()=>{
                clientEvent.dispatchEvent(gameConstants.CLIENTEVENT_LIST.ADDROLEBRICK, 1, true);
                playerData.instance.updatePlayerInfo('mainBrickAdd', 1);

                this._updateDiamondBtn();
                this._updateBrickBtn();
                this._updateDiamond();
            });
            // uiManager.instance.showDialog(gameConstants.PANEL_PATH.TIPS_PANEL, [this._getCurrentLangText(gameConstants.LANGUAGE_LIST.DIAMOND_NOT_ENOUGH)])
        } else {
            clientEvent.dispatchEvent(gameConstants.CLIENTEVENT_LIST.ADDROLEBRICK, 1, true);

            playerData.instance.updatePlayerInfo('diamond', -this._getNowBrick());
            playerData.instance.updatePlayerInfo('mainBrickAdd', 1);

            this._updateDiamondBtn();
            this._updateBrickBtn();
            this._updateDiamond();
        }
    }

    /**
     * 钻石添加按钮
     */
    public onBtnAddDiamondClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);

        if (this._checkVideo(this._getNowDiamond())) { //视频观看
            uiManager.instance.showDialog(gameConstants.PANEL_PATH.VIDEO_PANEL, ()=>{
                playerData.instance.updatePlayerInfo('mainDiamondMul', 1);

                this._updateDiamondBtn();
                this._updateBrickBtn();
                this._updateDiamond();
            });
            // uiManager.instance.showDialog(gameConstants.PANEL_PATH.TIPS_PANEL, [this._getCurrentLangText(gameConstants.LANGUAGE_LIST.DIAMOND_NOT_ENOUGH)])
        } else {
            playerData.instance.updatePlayerInfo('diamond', -this._getNowDiamond());
            playerData.instance.updatePlayerInfo('mainDiamondMul', 1);

            this._updateDiamondBtn();
            this._updateBrickBtn();
            this._updateDiamond();
        }
    }

    /**
     * 获取当前砖块等级价格
     */
    private _getNowBrick() {
        return Math.round(gameConstants.MAIN_BASIS_BRICK * Math.pow(gameConstants.MAIN_MUL, playerData.instance.playerInfo['mainBrickAdd']));
    }

    /**
     * 获取当前钻石 等级价格
     */
    private _getNowDiamond() {
        return Math.round(gameConstants.MAIN_BASIS_BRICK * Math.pow(gameConstants.MAIN_MUL, playerData.instance.playerInfo['mainDiamondMul']));
    }

    /**
     * 语言切换按钮点击（str: 1=简体中文, 2=繁体中文, 3=英文）
     */
    public onBtnLanguageClick(e: EventTouch, str: string) {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);

        const langMap: Record<string, LanguageType> = {
            '1': LanguageType.CN,
            '2': LanguageType.TW,
            '3': LanguageType.EN,
        };
        const newLang = langMap[str];
        if (!newLang) {
            return;
        }
        this._currentLangIndex = this._languageList.indexOf(newLang);
        i18nManager.instance.setLanguage(newLang);
        this._updateLanguageDisplay();
        this._refreshMainCostDisplayByLanguage();
    }
}