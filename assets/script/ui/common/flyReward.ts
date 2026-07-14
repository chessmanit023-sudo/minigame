import { _decorator, Component, Node, Prefab, AnimationComponent, SpriteFrame, SpriteComponent, Vec3, tween, LabelComponent } from 'cc';
import { AudioManager } from '../../framework/audioManager';
import { i18nManager } from '../../framework/i18nManager';
import { poolManager } from '../../framework/poolManager';
import { gameConstants } from '../../game/utils/gameConstants';
import { getI18nText } from '../../i18nText';
//奖励飞入弹窗
const { ccclass, property } = _decorator;

@ccclass('FlyReward')
export class FlyReward extends Component {
    @property(Prefab)
    public pbReward: Prefab = null!;

    @property(SpriteFrame)
    public sfDiamond: SpriteFrame = null!;

    @property(Node)
    public ndRewardParent: Node = null!;

    @property(Node)
    public ndDiamond: Node = null!;

    @property(LabelComponent)
    public lbDiamondNum: LabelComponent = null!;

    public static isRewardFlying: boolean = false;//奖励是否还在飞行

    private _callback: Function = () => { };
    private _maxRewardCount: number = 15;
    private _scoreTitle: string = '';

    public createReward(targetNum: number, callback: Function) {
        this._callback = callback;
        FlyReward.isRewardFlying = true;

        const language = i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
        this._scoreTitle = getI18nText('gameOverPanel_benjufenshu', language);
        this._updateScoreLabel(0);

        const targetPos = this.ndDiamond.position;
        const arrPromise: Promise<void>[] = [];
        let completedCount = 0;

        for (let i = 0; i < this._maxRewardCount; i++) {
            const p = new Promise<void>((resolve) => {
                const ndRewardItem = poolManager.instance.getNode(this.pbReward, this.ndRewardParent) as Node;
                const spCom = ndRewardItem.getComponent(SpriteComponent) as SpriteComponent;
                spCom.spriteFrame = this.sfDiamond;

                const randTargetPos = new Vec3(
                    Math.floor(Math.random() * 300) - 150,
                    Math.floor(Math.random() * 300 - 150),
                    0
                );
                const pos = new Vec3();
                Vec3.subtract(pos, randTargetPos, new Vec3(0, 0, 0));
                const costTime = pos.length() / 400;

                let randRotation = 120 + Math.floor(Math.random() * 60);
                randRotation = Math.floor(Math.random() * 2) === 1 ? randRotation : -randRotation;

                const pos2 = new Vec3();
                Vec3.subtract(pos2, randTargetPos, targetPos);
                const move2TargetTime = pos2.length() / 1000;

                tween(ndRewardItem)
                    .to(costTime, { position: randTargetPos })
                    .to(costTime, { eulerAngles: new Vec3(0, 0, randRotation) })
                    .to(costTime * 2 / 3, { scale: new Vec3(1.5, 1.5, 1.5) })
                    .to(costTime / 3, { scale: new Vec3(1, 1, 1) })
                    .union()
                    .call(() => {
                        ndRewardItem.getComponentInChildren(AnimationComponent)?.play();
                        tween(ndRewardItem)
                            .to(move2TargetTime, { position: targetPos })
                            .call(() => {
                                completedCount++;
                                const displayNum = completedCount >= this._maxRewardCount
                                    ? targetNum
                                    : Math.floor(targetNum * completedCount / this._maxRewardCount);
                                this._updateScoreLabel(displayNum);

                                AudioManager.instance.playSound(gameConstants.MUSIC_LIST.GETDIAMOND);
                                poolManager.instance.putNode(ndRewardItem);
                                resolve();
                            })
                            .start();
                    })
                    .start();
            });

            arrPromise.push(p);
        }

        Promise.all(arrPromise)
            .then(() => {
                this._updateScoreLabel(targetNum);
                setTimeout(() => {
                    FlyReward.isRewardFlying = false;
                    this._callback && this._callback();
                    this.node.destroy();
                }, 1000);
            })
            .catch((e) => {
                console.log('e', e);
                FlyReward.isRewardFlying = false;
                this._callback && this._callback();
                this.node.destroy();
            });
    }

    private _updateScoreLabel(num: number) {
        if (!this.lbDiamondNum) return;
        this.lbDiamondNum.string = this._scoreTitle + num.toString();
    }
}
