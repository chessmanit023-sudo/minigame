import { _decorator, Component, find, Node, Vec3 } from 'cc';

const { ccclass } = _decorator;

const v3_pos = new Vec3();
const CAMERA_NAME = 'Main Camera';

/**
 * 天空盒穹顶跟随主相机水平位置，保证任意朝向（含往回跑）相机都在穹顶内侧。
 */
@ccclass('SkyBoxFollow')
export class SkyBoxFollow extends Component {
    private _offsetY = 0;
    private _ndCamera: Node | null = null;

    onLoad () {
        this._offsetY = this.node.worldPosition.y;
        this._ndCamera = find(CAMERA_NAME);
    }

    lateUpdate () {
        const cam = this._ndCamera;
        if (!cam?.isValid) {
            this._ndCamera = find(CAMERA_NAME);
            return;
        }
        cam.getWorldPosition(v3_pos);
        v3_pos.y = this._offsetY;
        this.node.setWorldPosition(v3_pos);
    }
}
