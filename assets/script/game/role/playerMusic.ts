
import { _decorator, Component, Node } from 'cc';
import { AudioManager } from '../../framework/audioManager';
import { gameConstants } from '../utils/gameConstants';
import { gameUtils } from '../utils/gameUtils';
const { ccclass, property } = _decorator;

@ccclass('PlayerMusic')
export class PlayerMusic extends Component {
    /**
     * 播放走动声音——目前玩家使用 girl1 模型
     */
    private playWalk() {
        AudioManager.instance.playSound(
            gameConstants.MUSIC_LIST.WALK +
            gameUtils.getMusicNum(gameConstants.MUSIC_RANDOM.WALK));
    }
}
