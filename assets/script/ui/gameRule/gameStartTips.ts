import { _decorator, Component, Node, Input, EventTouch, Button, Color, Sprite, UITransform, Label } from 'cc';
import { AudioManager } from '../../framework/audioManager';
import { i18nManager } from '../../framework/i18nManager';
import { gameConstants } from '../../game/utils/gameConstants';
import { uiManager } from '../../framework/uiManager';
import { getI18nText } from '../../i18nText';
const { ccclass, property } = _decorator;

@ccclass('gameStartTips')
export class gameStartTips extends Component {
    @property(Label)
    labDes: Label = null!;

    private _callback: Function | null = null;
    show(_callback: Function) {
        this._callback = _callback;
        const language = i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
        this.labDes.string = getI18nText('gameStartTips_desc', language);
    }

    public onBtnStartClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);
        this._callback && this._callback();
        uiManager.instance.hideDialog(gameConstants.PANEL_PATH.GAME_START_TIPS);
    }
}
