import { _decorator, Component, Label, Node, ProgressBar, Toggle, Tween, Vec3, find, sys, tween, director, EditBox, EventTouch } from 'cc';
import { loginManager } from '../framework/loginManager';
import { AudioManager } from '../framework/audioManager';
import { constant } from '../framework/constant';
import { readClientPrefs } from '../framework/clientPrefs';
import { DEBUG, WECHAT } from 'cc/env';
import { i18nManager, LanguageType } from '../framework/i18nManager';
import { playerData } from '../framework/playerData';
const { ccclass, property } = _decorator;

const CACHE_KEY_AGREE_XIEYI = 'login_agree_xieyi_checked';
const CACHE_KEY_POP_XIEY2_SHOWN = 'login_pop_xiey2_shown';

@ccclass('loginScene')
export class loginScene extends Component {
    @property(Toggle)
    tongyiToggle: Toggle = null!;
    @property(Node)
    popXieyi: Node = null!;
    @property(Node)
    nodeYonghuxieyi: Node = null!;
    @property(Node)
    nodeYinsizhengce: Node = null!;
    @property(Node)
    popXiey2: Node = null!;
    @property(Node)
    xiyiEn: Node = null!;
    @property(Node)
    xiyiZh: Node = null!;
    @property(Node)
    xiyiTw: Node = null!;
    @property(Label)
    labLanguage: Label = null!;
    @property(Node)
    labLanguage1: Node = null!;
    @property(Node)
    labLanguage2: Node = null!;
    @property(Node)
    labLanguage3: Node = null!;
    @property(Label)
    labRuqren: Label = null!;
    @property(Label)
    labDengru: Label = null!;
    @property(Label)
    tips: Label = null!;
    @property(Label)
    tips2: Label = null!;
    @property(EditBox)
    editBoxPhone: EditBox = null!;
    @property(Node)
    nodePhoneTip: Node = null!;
    @property(Node)
    nodeTiaokuan: Node = null!;
    @property(Node)
    nodeShuru: Node = null!;
    @property(Node)
    labTiaokuanZh: Node = null!;
    @property(Node)
    labTiaokuanTw: Node = null!;
    @property(Node)
    labTiaokuanEn: Node = null!;
    @property(Node)
    labTiaokuanEn2: Node = null!;
    @property(Node)
    labPhone1: Node = null!;
    @property(Node)
    labPhone2: Node = null!;
    @property(Node)
    labPhone3: Node = null!;
    @property(Node)
    labPhone4: Node = null!;
    @property(Node)
    labPhone5: Node = null!;
    @property(Node)
    btn_dengru_0: Node = null!;
    @property(Node)
    node_shuru: Node = null!;

    private _btnLogin: Node | null = null;
    private _btnYonghuxieyi: Node | null = null;
    private _btnYinsizhengce: Node | null = null;
    private _btnClose: Node | null = null;
    private _layoutXieyi: Node | null = null;
    private _progressBarNode: Node | null = null;
    private _progressBar: ProgressBar | null = null;
    private _tipsTimer: ReturnType<typeof setTimeout> | null = null;
    private _isLoadingMain: boolean = false;
    private _isMainPreloaded: boolean = false;

    private _languageList: LanguageType[] = [LanguageType.CN, LanguageType.TW, LanguageType.EN];
    private _currentLangIndex: number = 0;

    protected onLoad(): void {
    }

    start() {
        this._btnLogin = find('login_pop/pop/btn_dengru', this.node);
        this._layoutXieyi = find('layout_xiyi', this.node);
        this._btnYonghuxieyi = find('layout_xiyi/btn_yonghuxieyi', this.node);
        this._btnYinsizhengce = find('layout_xiyi/btn_yinsizhengce', this.node);
        this._btnClose = find('pop_xieyi/sbg/btnClose', this.node);
        this._progressBarNode = find('ProgressBar', this.node);
        this._progressBar = this._progressBarNode?.getComponent(ProgressBar) ?? null;

        this._initToggleState();
        this._hidePopXieyi();
        this._restoreLanguageFromPrefs();
        this._initEntryUI();

        this.tongyiToggle.node.on(Toggle.EventType.TOGGLE, this._onToggleXieyiChanged, this);
        this._btnLogin?.on(Node.EventType.TOUCH_END, this._onBtnLoginClick, this);
        this._btnYonghuxieyi?.on(Node.EventType.TOUCH_END, this._onBtnYonghuxieyiClick, this);
        this._btnYinsizhengce?.on(Node.EventType.TOUCH_END, this._onBtnYinsizhengceClick, this);
        this._btnClose?.on(Node.EventType.TOUCH_END, this._onBtnCloseClick, this);

        this._preloadMainScene();
    }

    onDestroy() {
    }

    private _initEntryUI() {
        if (this.btn_dengru_0?.isValid) {
            this.btn_dengru_0.active = false;
        }
        if (this.node_shuru?.isValid) {
            this.node_shuru.active = false;
        }
    }

    private _onBtnDengru0Click() {
        if (this.btn_dengru_0?.isValid) {
            this.btn_dengru_0.active = false;
        }
        if (this.node_shuru?.isValid) {
            this.node_shuru.active = true;
        }
    }

    private _preloadMainScene() {
        this._setLoadingState(true);

        director.preloadScene(
            'main',
            (completedCount: number, totalCount: number) => {
                if (!this._progressBar) {
                    return;
                }
                const progress = totalCount > 0 ? completedCount / totalCount : 0;
                this._progressBar.progress = Math.max(0, Math.min(1, progress));
            },
            (err?: Error | null) => {
                this._setLoadingState(false);
                if (err) {
                    console.error('[loginScene] preload main failed:', err);
                    return;
                }
                if (this._progressBar) {
                    this._progressBar.progress = 1;
                }
                this._isMainPreloaded = true;
                if (this.btn_dengru_0?.isValid) {
                    this.btn_dengru_0.active = true;
                    this.btn_dengru_0.on(Node.EventType.TOUCH_END, this._onBtnDengru0Click, this);
                }
            }
        );
    }

    onEditBoxPhoneChanged() {
        const text = this.editBoxPhone.string.replace(/\D/g, '').slice(0, 5);
        const phoneLabels = [this.labPhone1, this.labPhone2, this.labPhone3, this.labPhone4, this.labPhone5];
        for (let i = 0; i < phoneLabels.length; i++) {
            const label = phoneLabels[i]?.getComponent(Label);
            if (label) {
                label.string = text[i] ?? '';
            }
        }
    }

    private _initToggleState() {
        const cacheValue = sys.localStorage.getItem(CACHE_KEY_AGREE_XIEYI);
        this.tongyiToggle.isChecked = cacheValue === '1';
    }

    private _onToggleXieyiChanged() {
        const isChecked = this.tongyiToggle.isChecked;
        sys.localStorage.setItem(CACHE_KEY_AGREE_XIEYI, isChecked ? '1' : '0');
    }

    private _onBtnLoginClick() {
        if (this._isLoadingMain) {
            return;
        }

        let phone = this.editBoxPhone.string.replace(/\D/g, '');
        if (DEBUG && !phone) {
            phone = '12345';
        }

        if (!/^\d{5}$/.test(phone)) {
            if (this.nodePhoneTip?.isValid) {
                this.nodePhoneTip.active = true;
            }
            return;
        }

        if (WECHAT) {
            loginManager.fullLogin((success, error) => {
                if (success) {
                    this._enterMainScene();
                } else {
                    console.error('[loginScene] 登录失败:', error);
                }
            });
        } else {
            loginManager.testLogin(phone, (success, error) => {
                if (success) {
                    this.nodePhoneTip.active = false;
                    playerData.instance.playerInfo['level'] = 1;
                    this._enterMainScene();
                } else {
                    console.error('[loginScene] 登录失败:', error);
                }
            });
        }
    }

    private _enterMainScene() {
        if (this._isLoadingMain) {
            return;
        }
        const lang = this._languageList[this._currentLangIndex];
        i18nManager.instance.setLanguage(lang);

        if (this._isMainPreloaded) {
            director.loadScene('main');
            return;
        }

        this._loadMainScene();
    }

    public onQuerenClick() {
        const newLang = this._languageList[this._currentLangIndex];
        i18nManager.instance.setLanguage(newLang);
        sys.localStorage.setItem(CACHE_KEY_POP_XIEY2_SHOWN, '1');
        if (this.popXiey2?.isValid) {
            this.popXiey2.active = false;
        }
        this._enterMainScene();
    }

    private _restoreLanguageFromPrefs() {
        const saved = readClientPrefs().language as LanguageType | undefined;
        if (saved && this._languageList.indexOf(saved) >= 0) {
            this._currentLangIndex = this._languageList.indexOf(saved);
        }
        this._applyLanguageUI(this._languageList[this._currentLangIndex]);
        i18nManager.instance.setLanguage(this._languageList[this._currentLangIndex]);
    }

    private _applyLanguageUI(newLang: LanguageType) {
        this.xiyiEn.active = newLang === LanguageType.EN;
        this.xiyiZh.active = newLang === LanguageType.CN;
        this.xiyiTw.active = newLang === LanguageType.TW;
        this.labLanguage.string = newLang === LanguageType.CN ? '中文简体' : newLang === LanguageType.TW ? '中文繁體' : 'English';
        this.labLanguage1.active = newLang !== LanguageType.CN;
        this.labLanguage2.active = newLang !== LanguageType.TW;
        this.labLanguage3.active = newLang !== LanguageType.EN;
        this.labRuqren.string = newLang === LanguageType.CN ? '确认' : newLang === LanguageType.TW ? '確認' : 'Confirm';
        this.labDengru.string = newLang === LanguageType.CN ? '登入' : newLang === LanguageType.TW ? '登入' : 'Login';
        this.tips.string = newLang === LanguageType.CN ? '请输入阁下手提电话首4位及尾1位数字以参与游戏，须与接收手摇饮品电子礼券安排之电话一致。' : newLang === LanguageType.TW ? '請輸入閣下手提電話首4位及尾1位數字以參與遊戲 ，須與接收手搖飲品電子禮券安排之電話一致。' : 'Please enter the first 4 and last digit of your mobile number to start the game. This must match the phone number used for receiving hand-shaken beverage e-voucher arrangement.';
        this.tips2.string = newLang === LanguageType.CN ? '条款及细则' : newLang === LanguageType.TW ? '條款及細則' : 'Terms & Conditions';
    }

    /**
     * 语言切换按钮点击（str: 1=简体中文, 2=繁体中文, 3=英文）
     */
    public onBtnLanguageClick(e: EventTouch, str: string) {
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
        this._applyLanguageUI(newLang);
    }

    public onTiaokuanClick() {
        this.nodeTiaokuan.active = true;
        this.nodeShuru.active = false;
        const newLang = this._languageList[this._currentLangIndex];
        this.labTiaokuanZh.active = newLang === LanguageType.CN;
        this.labTiaokuanTw.active = newLang === LanguageType.TW;
        this.labTiaokuanEn.active = newLang === LanguageType.EN;
        this.labTiaokuanEn2.active = newLang === LanguageType.EN;
    }

    public onTiaokuanCloseClick() {
        this.nodeTiaokuan.active = false;
        this.nodeShuru.active = true;
    }

    private _loadMainScene() {
        if (this._isLoadingMain) {
            return;
        }
        this._setLoadingState(true);

        director.preloadScene(
            'main',
            (completedCount: number, totalCount: number) => {
                if (!this._progressBar) {
                    return;
                }
                const progress = totalCount > 0 ? completedCount / totalCount : 0;
                this._progressBar.progress = Math.max(0, Math.min(1, progress));
            },
            (err?: Error | null) => {
                if (err) {
                    console.error('[loginScene] preload main failed:', err);
                    this._setLoadingState(false);
                    return;
                }
                this._progressBar && (this._progressBar.progress = 1);
                this._isMainPreloaded = true;
                director.loadScene('main');
            }
        );
    }

    private _onBtnYonghuxieyiClick() {
        this.popXieyi.active = true;
        this.nodeYonghuxieyi.active = true;
        this.nodeYinsizhengce.active = false;
    }

    private _onBtnYinsizhengceClick() {
        this.popXieyi.active = true;
        this.nodeYonghuxieyi.active = false;
        this.nodeYinsizhengce.active = true;
    }

    private _onBtnCloseClick() {
        this._hidePopXieyi();
    }

    private _hidePopXieyi() {
        this.popXieyi.active = false;
        this.nodeYonghuxieyi.active = false;
        this.nodeYinsizhengce.active = false;
    }

    private _playLayoutXieyiShake() {
        const layoutNode = this._layoutXieyi;
        if (!layoutNode || !layoutNode.isValid) {
            return;
        }

        const originPos = layoutNode.position.clone();
        Tween.stopAllByTarget(layoutNode);
        layoutNode.setPosition(originPos);

        tween(layoutNode)
            .to(0.03, { position: new Vec3(originPos.x - 12, originPos.y, originPos.z) })
            .to(0.03, { position: new Vec3(originPos.x + 12, originPos.y, originPos.z) })
            .to(0.03, { position: new Vec3(originPos.x - 10, originPos.y, originPos.z) })
            .to(0.03, { position: new Vec3(originPos.x + 10, originPos.y, originPos.z) })
            .to(0.03, { position: new Vec3(originPos.x - 6, originPos.y, originPos.z) })
            .to(0.03, { position: new Vec3(originPos.x + 6, originPos.y, originPos.z) })
            .to(0.03, { position: originPos })
            .start();
    }

    private _setLoadingState(isLoading: boolean) {
        this._isLoadingMain = isLoading;

        if (this._progressBarNode && this._progressBarNode.isValid) {
            this._progressBarNode.active = isLoading;
        }
        if (this._progressBar) {
            this._progressBar.progress = isLoading ? 0 : this._progressBar.progress;
        }

        this.tongyiToggle.interactable = !isLoading;
        this._setNodeInputEnabled(this.btn_dengru_0, !isLoading);
        this._setNodeInputEnabled(this._btnYonghuxieyi, !isLoading);
        this._setNodeInputEnabled(this._btnYinsizhengce, !isLoading);
        this._setNodeInputEnabled(this._btnClose, !isLoading);
    }

    private _setNodeInputEnabled(target: Node | null, enabled: boolean) {
        if (!target || !target.isValid) {
            return;
        }
        if (enabled) {
            target.resumeSystemEvents(true);
        } else {
            target.pauseSystemEvents(true);
        }
    }
}

