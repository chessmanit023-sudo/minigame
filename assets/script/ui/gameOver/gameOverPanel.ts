
import { _decorator, Component, Node, Vec3, Label } from 'cc';
import { AudioManager } from '../../framework/audioManager';
import { clientEvent } from '../../framework/clientEvent';
import { EffectManager } from '../../framework/effectManager';
import { playerData } from '../../framework/playerData';
import { i18nManager } from '../../framework/i18nManager';
import { uiManager } from '../../framework/uiManager';
import { GameManager } from '../../game/gameManager';
import { gameConstants } from '../../game/utils/gameConstants';
import { getI18nText } from '../../i18nText';
const { ccclass, property } = _decorator;

const pointEul = new Vec3(); //指针角度

const POINT_EUL_Z = 85; //指针的z轴取值范围 [-POINT_EUL_Z,POINT_EUL_Z]
const POINT_ADD_ONCE_EUL_Z = 100; //每帧添加角度
const CHECK_ONE_RANGE = 180 / 5 / 2; //180度五个倍数区域  正中央被分为左右两部分因此再/2

@ccclass('gameOverPanel')
export class gameOverPanel extends Component {
    @property(Node)
    ndWinGet: Node = null!; //胜利结算节点

    @property(Node)
    ndPoint: Node = null!; //指针节点

    @property(Label)
    lbGetDiamond: Label = null!; //领取获得钻石

    @property(Label)
    lbGetDiamondMul: Label = null!; //领取倍数获得钻石

    @property(Label)
    lbGetMul: Label = null!; //领取倍数

    @property(Label)
    lbRank: Label = null!; //排名文字
    @property(Label)
    lbQueren: Label = null!; // 确认（多语言）
    @property(Label)
    lbBaoshiJiangli: Label = null!; // 宝石奖励（多语言）

    private _claimMulFormat = ''; // 领取x倍数（多语言模板，%s 为倍数）
    private _nowRotationZ: number = 0; //可以旋转
    private addRotationState: boolean = true;
    private _nowResultDiamond: number = 0;
    private _gemRewardDiamond: number = 0; // 宝石奖励钻石（每颗 GEM_DIAMOND_REWARD）

    public show() {
        const language = i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
        this.lbQueren.string = getI18nText('gameOverPanel_btnGet_0', language);
        this._claimMulFormat = getI18nText('gameOverPanel_claimMulFormat', language);
        this.lbRank.string = getI18nText('gameOverPanel_rankFormat', language).replace('%s', GameManager.scriptPlayer.rankNum.toString());

        if (GameManager.isWin) {
            this.ndWinGet.active = true;

            this._nowRotationZ = -POINT_EUL_Z;
            this.addRotationState = true;

            pointEul.set(0, 0, POINT_EUL_Z)
            this.ndPoint.setRotationFromEuler(pointEul);

            playerData.instance.updatePlayerInfo('level', 1);
        } else {
            this.ndWinGet.active = false;
        }

        let mul = Number(GameManager.ndEndReward.children[0].name); //gameManager将所有倍数地面第一个子节点名称改为倍数
        if (GameManager.ndEndReward === GameManager.ndEndReward) { //特殊情况——结束地面1倍
            mul = 1;
        }
        this._nowResultDiamond = Math.floor(Number(mul) * gameConstants.GAMEOVER_BASIS_DIAMOND * Math.pow(gameConstants.MAIN_MUL, playerData.instance.playerInfo['mainDiamondMul']));
        const gemCount = GameManager.gemCollectedCount || 0;
        this._gemRewardDiamond = gemCount * gameConstants.GEM_DIAMOND_REWARD;

        const scoreTitle = getI18nText('gameOverPanel_benjufenshu', language);
        this.lbGetDiamond.string = scoreTitle + this._nowResultDiamond.toString();

        if (this.lbBaoshiJiangli) {
            this.lbBaoshiJiangli.node.active = true;
            const gemTitle = getI18nText('gameOverPanel_gemReward', language);
            this.lbBaoshiJiangli.string = gemTitle.replace('%s', String(this._gemRewardDiamond));
        }
    }

    public onBtnRestart(addNum: number) {
        const pi = playerData.instance.playerInfo;
        if (pi) {
            pi['level'] = 1;
            playerData.instance.savePlayerInfoToLocalCache();
        }
        AudioManager.instance.playSound(gameConstants.MUSIC_LIST.CLICK);

        uiManager.instance.hideDialog(gameConstants.PANEL_PATH.GAMEOVER_PANEL);

        EffectManager.instance.showFlyReward(addNum, () => {
            playerData.instance.updatePlayerInfo('diamond', addNum);
            clientEvent.dispatchEvent(gameConstants.CLIENTEVENT_LIST.RESTARTGAME);
        })
    }

    /**
     * 领取按钮
     */
    public onBtnGetClick() {
        this.onBtnRestart(this._nowResultDiamond + this._gemRewardDiamond);

        // playerData.instance.updatePlayerInfo('diamond', this._nowResultDiamond);
    }

    /**
     * 倍数领取按钮
     */
    public onBtnGetMulClick() {
        const diamond = this._checkEulToMul() * this._nowResultDiamond + this._gemRewardDiamond;
        uiManager.instance.showDialog(gameConstants.PANEL_PATH.VIDEO_PANEL, ()=>{
            this.onBtnRestart(diamond);
        });

        // playerData.instance.updatePlayerInfo('diamond', (this._checkEulToMul() * this._nowResultDiamond));
    }

    /**
     * 当前角度对应倍数
     * @returns 
     */
    private _checkEulToMul() {
        const mul = Math.floor(this._nowRotationZ / CHECK_ONE_RANGE);
        const rangeNum = Math.ceil(mul / 2);
        if (rangeNum === 2 || rangeNum === -2) {
            return 3;
        } else if (rangeNum === 1 || rangeNum === -1) {
            return 2;
        } else {
            return 4;
        }
    }

    update(dt: number) {
        if (!this.ndWinGet.active) return;
        if (this.addRotationState) {
            this._nowRotationZ += POINT_ADD_ONCE_EUL_Z * dt;
        } else {
            this._nowRotationZ -= POINT_ADD_ONCE_EUL_Z * dt;
        }

        if (this._nowRotationZ > POINT_EUL_Z) {
            this._nowRotationZ = POINT_EUL_Z;
            this.addRotationState = false;
        } else if (this._nowRotationZ < -POINT_EUL_Z) {
            this._nowRotationZ = -POINT_EUL_Z;
            this.addRotationState = true;
        }

        pointEul.set(0, 0, this._nowRotationZ);
        this.ndPoint.setRotationFromEuler(pointEul);
        const nowMul = this._checkEulToMul();
        this.lbGetMul.string = this._claimMulFormat.replace('%s', String(nowMul));
        this.lbGetDiamondMul.string = (nowMul * this._nowResultDiamond + this._gemRewardDiamond).toString();
    }
}