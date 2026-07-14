import { _decorator, Component, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 宝石悬浮动画组件
 * 实现上下浮动和旋转效果
 */
@ccclass('GemAnimation')
export class GemAnimation extends Component {
    private _baseY: number = 0;      // 基础高度
    private _offset: number = 0;    // 动画偏移量
    private _time: number = 0;     // 时间累计
    
    @property
    public offset: number = 0;       // 动画相位偏移
    
    @property
    public floatSpeed: number = 2;   // 浮动速度
    
    @property
    public floatHeight: number = 0.3; // 浮动高度

    onLoad() {
        this._baseY = this.node.position.y;
        this._offset = this.offset;
    }

    update(dt: number) {
        this._time += dt;
        
        // 计算悬浮高度
        const floatY = Math.sin((this._time + this._offset) * this.floatSpeed) * this.floatHeight;
        
        // 计算旋转
        const rotY = this._time * 90; // 每秒旋转90度
        
        // 应用位置
        this.node.position = new Vec3(
            this.node.position.x,
            this._baseY + floatY,
            this.node.position.z
        );
        
        // 应用旋转
        this.node.eulerAngles = new Vec3(0, rotY, 0);
    }
}
