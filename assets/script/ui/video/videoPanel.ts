import { _decorator, Component, VideoPlayer, Node, Label, Input, Button, UITransform, sys } from 'cc';
import { i18nManager } from '../../framework/i18nManager';
import { uiManager } from '../../framework/uiManager';
import { gameConstants } from '../../game/utils/gameConstants';
import { getI18nText } from '../../i18nText';

const { ccclass, property } = _decorator;

const VIDEO_URLS = [
    'https://ctfl-bucket.oss-cn-shenzhen.aliyuncs.com/PK_Planner.mp4',
    'https://ctfl-bucket.oss-cn-shenzhen.aliyuncs.com/PK_ThematicAd.mp4',
];

const COUNTDOWN_SECONDS = 30;
const BTN_SHOW_DELAY_SECONDS = 10;
const VIDEO_MAX_WIDTH = 720;
const VIDEO_MAX_HEIGHT = 900;

@ccclass('videoPanel')
export class videoPanel extends Component {
    @property(VideoPlayer)
    videoPlayer: VideoPlayer = null!;
    @property(Label)
    labTime: Label = null!;
    @property(Label)
    labBtn: Label = null!;

    private _callback: (() => void) | null = null;

    private _countdownLeft = COUNTDOWN_SECONDS;
    private _countdownFinished = false;
    private _btnBoundNode: Node | null = null;
    /** show() 已设置新 URL，等待 READY_TO_PLAY 后再 play */
    private _awaitingReadyToPlay = false;
    private _pendingVideoUrl = '';

    private _lang (): '_01' | '_02' | '_03' {
        return i18nManager.instance.getCurrentLanguage() as '_01' | '_02' | '_03';
    }

    onLoad () {
        const n = this.labBtn?.node;
        if (n) {
            const btn = n.getComponent(Button) ?? n.parent?.getComponent(Button);
            const target = btn ? btn.node : n;
            this._btnBoundNode = target;
            if (btn) {
                target.on(Button.EventType.CLICK, this._onBtnClick, this);
            } else {
                target.on(Input.EventType.TOUCH_END, this._onBtnClick, this);
            }
        }

        const vp = this.videoPlayer;
        if (vp?.node?.isValid) {
            vp.node.on(VideoPlayer.EventType.READY_TO_PLAY, this._onVideoReadyToPlay, this);
            vp.node.on(VideoPlayer.EventType.META_LOADED, this._onVideoMetaLoaded, this);
        }

        this._hideBtn();
    }

    onDestroy () {
        this._stopCountdown();
        this._stopBtnShowDelay();
        if (this._btnBoundNode?.isValid) {
            this._btnBoundNode.off(Button.EventType.CLICK, this._onBtnClick, this);
            this._btnBoundNode.off(Input.EventType.TOUCH_END, this._onBtnClick, this);
            this._btnBoundNode = null;
        }
        if (this.videoPlayer?.node?.isValid) {
            this.videoPlayer.node.off(VideoPlayer.EventType.READY_TO_PLAY, this._onVideoReadyToPlay, this);
            this.videoPlayer.node.off(VideoPlayer.EventType.META_LOADED, this._onVideoMetaLoaded, this);
            this.videoPlayer.node.off(VideoPlayer.EventType.COMPLETED, this._onVideoCompleted, this);
        }
    }

    onDisable () {
        this._stopCountdown();
        this._stopBtnShowDelay();
        this._resetVideoPlayer();
    }

    private _isWebVideoPlayer (): boolean {
        return sys.isBrowser;
    }

    private _applyDefaultVideoLayout () {
        const ui = this.videoPlayer?.node?.getComponent(UITransform);
        if (ui) {
            ui.setContentSize(VIDEO_MAX_WIDTH, VIDEO_MAX_HEIGHT);
        }
    }

    /** 按视频原始比例缩放节点，保证完整显示在面板内 */
    private _fitVideoNodeSize (videoW: number, videoH: number) {
        const ui = this.videoPlayer?.node?.getComponent(UITransform);
        if (!ui || videoW <= 0 || videoH <= 0) {
            return;
        }

        const scale = Math.min(VIDEO_MAX_WIDTH / videoW, VIDEO_MAX_HEIGHT / videoH);
        ui.setContentSize(Math.round(videoW * scale), Math.round(videoH * scale));

        const vp = this.videoPlayer;
        if (this._isWebVideoPlayer()) {
            // H5 下引擎 keepAspectRatio 容易与 canvas 缩放不同步，改为节点尺寸控制
            vp.keepAspectRatio = false;
            const impl = (vp as any)._impl;
            if (impl) {
                impl._dirty = true;
            }
        } else {
            vp.keepAspectRatio = true;
        }
    }

    private _readVideoIntrinsicSize (): { w: number; h: number } {
        const vp = this.videoPlayer;
        if (!vp?.isValid) {
            return { w: 0, h: 0 };
        }

        if (this._isWebVideoPlayer()) {
            const video = (vp as any)._impl?._video as HTMLVideoElement | undefined;
            if (video?.videoWidth && video?.videoHeight) {
                return { w: video.videoWidth, h: video.videoHeight };
            }
        }

        return { w: 0, h: 0 };
    }

    private _onVideoMetaLoaded () {
        const { w, h } = this._readVideoIntrinsicSize();
        if (w > 0 && h > 0) {
            this._fitVideoNodeSize(w, h);
            return;
        }
        // 远程广告视频常见横屏 16:9，作为兜底避免裁剪
        this._fitVideoNodeSize(1280, 720);
    }

    private _onVideoReadyToPlay () {
        if (!this._awaitingReadyToPlay) {
            return;
        }
        this._awaitingReadyToPlay = false;
        const vp = this.videoPlayer;
        if (!vp?.isValid) {
            return;
        }
        vp.currentTime = 0;
        vp.play();
    }

    private _tickCountdown = () => {
        this._countdownLeft--;
        if (this._countdownLeft <= 0) {
            this.unschedule(this._tickCountdown);
            this._onCountdownEnd();
            return;
        }
        this._updateTimeLabel();
    };

    private _btnNode (): Node | null {
        return this._btnBoundNode ?? this.labBtn?.node ?? null;
    }

    private _hideBtn () {
        const n = this._btnNode();
        if (n?.isValid) {
            n.active = false;
        }
    }

    private _showBtnDelayed = () => {
        const n = this._btnNode();
        if (n?.isValid) {
            n.active = true;
        }
    };

    private _startBtnShowDelay () {
        this._stopBtnShowDelay();
        this._hideBtn();
        this.scheduleOnce(this._showBtnDelayed, BTN_SHOW_DELAY_SECONDS);
    }

    private _stopBtnShowDelay () {
        this.unschedule(this._showBtnDelayed);
    }

    private _startCountdown () {
        this.unschedule(this._tickCountdown);
        this._countdownLeft = COUNTDOWN_SECONDS;
        this._countdownFinished = false;
        if (this.labTime?.isValid) {
            this.labTime.node.active = true;
        }
        if (this.labBtn?.isValid) {
            this.labBtn.string = getI18nText('videoPanel_btn_close', this._lang());
        }
        this._startBtnShowDelay();
        this._updateTimeLabel();
        this.schedule(this._tickCountdown, 1);
    }

    private _stopCountdown () {
        this.unschedule(this._tickCountdown);
    }

    private _updateTimeLabel () {
        if (this.labTime?.isValid) {
            const suf = getI18nText('videoPanel_sec_suffix', this._lang());
            this.labTime.string = `${this._countdownLeft}${suf}`;
        }
    }

    private _onCountdownEnd () {
        this._countdownFinished = true;
        if (this.labTime?.isValid) {
            this.labTime.node.active = false;
        }
        if (this.labBtn?.isValid) {
            this.labBtn.string = getI18nText('videoPanel_btn_claim', this._lang());
        }
    }

    private _onBtnClick () {
        if (this._countdownFinished) {
            this._closePanel(true);
        } else {
            this._closePanel(false);
        }
    }

    private _resetVideoPlayer () {
        this._awaitingReadyToPlay = false;
        this._pendingVideoUrl = '';
        this.unschedule(this._deferredLoadVideo);
        const vp = this.videoPlayer;
        if (!vp?.isValid) {
            return;
        }
        vp.node.off(VideoPlayer.EventType.COMPLETED, this._onVideoCompleted, this);
        vp.currentTime = 0;
        vp.stop();
        vp.remoteURL = '';
    }

    private _closePanel (invokeCallback: boolean) {
        this._stopCountdown();
        this._stopBtnShowDelay();
        this._resetVideoPlayer();

        const cb = invokeCallback ? this._callback : null;
        this._callback = null;
        if (invokeCallback && typeof cb === 'function') {
            cb();
        }
        uiManager.instance.hideDialog(gameConstants.PANEL_PATH.VIDEO_PANEL);
    }

    private _pickVideoUrl (): string {
        const base = VIDEO_URLS[Math.floor(Math.random() * VIDEO_URLS.length)];
        console.warn('base', base);
        // 避免二次打开同一地址时浏览器复用缓存进度
        return `${base}?t=${Date.now()}`;
    }

    show (...args: any[]) {
        this._callback = typeof args[0] === 'function' ? args[0] : null;
        this._startCountdown();

        const vp = this.videoPlayer;
        vp.node.off(VideoPlayer.EventType.COMPLETED, this._onVideoCompleted, this);
        vp.node.once(VideoPlayer.EventType.COMPLETED, this._onVideoCompleted, this);

        vp.stop();
        vp.currentTime = 0;
        vp.playOnAwake = false;
        vp.loop = false;
        vp.resourceType = VideoPlayer.ResourceType.REMOTE;
        vp.clip = null;
        this._applyDefaultVideoLayout();

        if (this._isWebVideoPlayer()) {
            vp.keepAspectRatio = false;
            vp.stayOnBottom = false;
        } else {
            vp.keepAspectRatio = true;
        }

        this._awaitingReadyToPlay = true;
        this._pendingVideoUrl = this._pickVideoUrl();
        vp.remoteURL = '';

        this.unschedule(this._deferredLoadVideo);
        this.scheduleOnce(this._deferredLoadVideo, 0);
    }

    private _deferredLoadVideo = () => {
        const vp = this.videoPlayer;
        if (!this._awaitingReadyToPlay || !this._pendingVideoUrl || !vp?.isValid) {
            return;
        }
        vp.remoteURL = this._pendingVideoUrl;
    };

    private _onVideoCompleted () {
        const vp = this.videoPlayer;
        if (vp?.node?.isValid) {
            vp.node.off(VideoPlayer.EventType.COMPLETED, this._onVideoCompleted, this);
            vp.stop();
        }
    }
}
