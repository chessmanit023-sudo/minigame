import { _decorator, Component, Node, Label } from 'cc';
import { AudioManager } from '../../framework/audioManager';
import { clientEvent } from '../../framework/clientEvent';
import { i18nManager } from '../../framework/i18nManager';
import { uiManager } from '../../framework/uiManager';
import { gameConstants } from '../../game/utils/gameConstants';
import { getI18nText } from '../../i18nText';
const { ccclass, property } = _decorator;

@ccclass('ResurrectionPanel')
export class ResurrectionPanel extends Component {
    @property(Label)
    labNext: Label = null!; // 重玩（多语言）

    show() {
        const language = i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
        this.labNext.string = getI18nText('resurrectionPanel_btnNext_0', language);
    }

    /**
     * 跳过/再来一局按钮
     */
    public onBtnNextClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);

        // 回到主界面重新开始
        clientEvent.dispatchEvent(gameConstants.CLIENTEVENT_LIST.RESTARTGAME);
        uiManager.instance.hideDialog(gameConstants.PANEL_PATH.RESURRECTION_PANEL);
    }
}
