
import { _decorator, Component, Node, SpriteFrame, Sprite, Vec3, profiler, Label } from 'cc';
import { AudioManager } from '../../framework/audioManager';
import { mergeWriteClientPrefs } from '../../framework/clientPrefs';
import { playerData } from '../../framework/playerData';
import { uiManager } from '../../framework/uiManager';
import { gameConstants } from '../../game/utils/gameConstants';
import { i18nManager } from '../../framework/i18nManager';
import { getI18nText } from '../../i18nText';
const { ccclass, property } = _decorator;

const DOT_RANGE_X = 30;

@ccclass('SettingPanel')
export class SettingPanel extends Component {

    @property(SpriteFrame)
    public sfSelect: SpriteFrame = null!;

    @property(SpriteFrame)
    public sfUnSelect: SpriteFrame = null!;

    @property(Node)
    public ndBtnVibration: Node = null!;

    @property(Node)
    public ndBtnMusic: Node = null!;

    @property(Node)
    public ndBtnDebug: Node = null!;

    @property(Label)
    public lbSheZhi: Label = null!;

    @property(Label)
    public lbZhenDong: Label = null!;

    @property(Label)
    public lbYinYue: Label = null!;

    private _isMusicOpen: boolean = false;
    private _isVibrationOpen: boolean = false;
    private _isDebugOpen: boolean = false;

    public show() {
        this._refreshI18nLabels();

        this._isMusicOpen = !!AudioManager.instance.getMusicVolume();
        this._changeState(this.ndBtnMusic, this._isMusicOpen);

        const pi = playerData.instance.playerInfo as Record<string, unknown> | null;
        this._isVibrationOpen = pi ? pi['vibrationOn'] !== false : true;
        this._changeState(this.ndBtnVibration, this._isVibrationOpen);

        this._isDebugOpen = !!(pi && pi['debugStats']);
        this._changeState(this.ndBtnDebug, this._isDebugOpen);
    }

    private _refreshI18nLabels() {
        const currentLang = i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
        this.lbSheZhi.string = getI18nText('setting_label_title', currentLang);
        this.lbZhenDong.string = getI18nText('setting_label_vibration', currentLang);
        this.lbYinYue.string = getI18nText('setting_label_music', currentLang);
    }

    private _changeState(ndParget: Node, isOpen: boolean) {
        let spCom = ndParget.getComponent(Sprite) as Sprite;
        let ndDot = ndParget.getChildByName("dot") as Node;
        let ndDotPos = ndDot.position.clone();

        if (isOpen) {
            spCom.spriteFrame = this.sfSelect;
            ndDot.setPosition(new Vec3(DOT_RANGE_X, ndDotPos.y, ndDotPos.z));
        } else {
            spCom.spriteFrame = this.sfUnSelect;
            ndDot.setPosition(new Vec3(-DOT_RANGE_X, ndDotPos.y, ndDotPos.z));
        }
    }

    public onBtnVibrationClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);
        // GameLogic.vibrateShort();

        this._isVibrationOpen = !this._isVibrationOpen;
        this._changeState(this.ndBtnVibration, this._isVibrationOpen);
        mergeWriteClientPrefs({ vibrationOn: this._isVibrationOpen });
        if (playerData.instance.playerInfo) {
            playerData.instance.updatePlayerInfo('vibrationOn', this._isVibrationOpen);
        }
    }

    public onBtnMusicClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);
        // GameLogic.vibrateShort();

        this._isMusicOpen = !this._isMusicOpen;
        this._changeState(this.ndBtnMusic, this._isMusicOpen);

        if (this._isMusicOpen) {
            AudioManager.instance.openMusic();
            AudioManager.instance.openSound();
        } else {
            AudioManager.instance.closeMusic();
            AudioManager.instance.closeSound();
        }
    }

    public onBtnDebugClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);
        // GameLogic.vibrateShort();

        this._isDebugOpen = !this._isDebugOpen;
        this._changeState(this.ndBtnDebug, this._isDebugOpen);
        if (playerData.instance.playerInfo) {
            playerData.instance.updatePlayerInfo('debugStats', this._isDebugOpen);
        }

        this._isDebugOpen === true ? profiler.showStats() : profiler.hideStats();
    }

    public onBtnCloseClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);
        // GameLogic.vibrateShort();

        uiManager.instance.hideDialog(gameConstants.PANEL_PATH.SETTING_PANEL);
        uiManager.instance.showDialog(gameConstants.PANEL_PATH.MAIN_PANEL);
    }

}