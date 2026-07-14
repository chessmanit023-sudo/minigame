import { _decorator, Component, Label } from 'cc';
import { AudioManager } from '../../framework/audioManager';
import { clientEvent } from '../../framework/clientEvent';
import { playerData } from '../../framework/playerData';
import { uiManager } from '../../framework/uiManager';
import { gameConstants } from '../../game/utils/gameConstants';
import { GameManager } from '../../game/gameManager';
import { i18nManager } from '../../framework/i18nManager';
import { getI18nText } from '../../i18nText';
const { ccclass , property} = _decorator;

@ccclass('nextLevelPanel')
export class nextLevelPanel extends Component {
    @property(Label)
    lab_1: Label = null!;

    show() {
        const language = i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
        const t = (key: string) => getI18nText(key, language);
        if (this.lab_1?.isValid) this.lab_1.string = t('gameAnswer_nextLevel_lab');
    }

    
    

    public onNextLevelClick() {
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);
        uiManager.instance.hideDialog(gameConstants.PANEL_PATH.NEXT_LEVEL_PANEL);

        const now = Number(playerData.instance.playerInfo['level']) || 1;
        if (now < gameConstants.MAX_LEVEL_NUM) {
            playerData.instance.updatePlayerInfo('level', 1);
        }
        GameManager.skipMainPanelAfterMapLoad = true;
        clientEvent.dispatchEvent(gameConstants.CLIENTEVENT_LIST.RESTARTGAME);
        uiManager.instance.showDialog(gameConstants.PANEL_PATH.GAME_PANEL, [true]);
    }
}