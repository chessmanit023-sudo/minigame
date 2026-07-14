
import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('rewardPanel')
export class rewardPanel extends Component {
    @property(Label)
    lab_title: Label = null!; // 标题

    protected onLoad(): void {
        
    }
}