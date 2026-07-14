
import { _decorator, Component, Node, director, Label } from 'cc';
import { AudioManager } from '../../framework/audioManager';
import { clientEvent } from '../../framework/clientEvent';
import { i18nManager } from '../../framework/i18nManager';
import { uiManager } from '../../framework/uiManager';
import { gameConstants } from '../../game/utils/gameConstants';
import { getI18nText } from '../../i18nText';
const { ccclass, property } = _decorator;

@ccclass('ClosePanel')
export class ClosePanel extends Component {
    @property(Label)
    lbTips: Label = null!; 
    show() {
        const language = i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
        this.lbTips.string = getI18nText('closePanel_tip_0', language);
    }

    /**
     * 确定按钮
     */
    public onBtnDetermineClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);

        uiManager.instance.hideDialog(gameConstants.PANEL_PATH.CLOSEPANEL);
        uiManager.instance.showDialog(gameConstants.PANEL_PATH.MAIN_PANEL);

        //重新开始游戏
        clientEvent.dispatchEvent(gameConstants.CLIENTEVENT_LIST.RESTARTGAME);

        director.resume();
    }

    /**
     * 取消按钮
     */
    public onBtnCancelClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);

        uiManager.instance.hideDialog(gameConstants.PANEL_PATH.CLOSEPANEL);
        uiManager.instance.showDialog(gameConstants.PANEL_PATH.GAME_PANEL);

        director.resume();
    }
}