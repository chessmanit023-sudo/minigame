import { _decorator, Component } from "cc";
import { applyClientPrefsToPlayerInfo, readClientPrefs } from "./clientPrefs";
import { constant } from "./constant";
import { util } from "./util";

const { ccclass } = _decorator;

@ccclass("playerData")
export class playerData extends Component {
    static _instance: playerData;

    public serverTime: number = 0;
    public localTime: number = 0;

    public static get instance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new playerData();
        return this._instance;
    }

    private _userId: string = '';
    private _playerInfo: any = null;
    private _history: any = null;
    private _settings: any = null;
    private _isNewBee: boolean = false;
    private _dataVersion: string = '';

    /** 登录态 token，仅内存；登录后由 loginManager 写入 settings.userData */
    private _authToken: string = '';
    /** 只有玩家数据真实变化后才置脏；登录/初始化服务端数据不置脏 */
    private _isUserDataDirty: boolean = false;

    private _uploadDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    public phone: string = '';

    public get userId() {
        return this._userId;
    }

    public set userId(v: string) {
        this._userId = v;
    }

    public get settings() {
        return this._settings;
    }

    public set settings(v: any) {
        this._settings = v;
    }

    public get playerInfo() {
        return this._playerInfo;
    }

    public get history() {
        return this._history;
    }

    public get isNewBee() {
        return this._isNewBee;
    }

    public set isNewBee(v: boolean) {
        this._isNewBee = v;
    }

    /**
     * 设置会话（微信登录成功后调用）
     */
    public setAuthSession(token: string, userId: string) {
        this._authToken = token || '';
        if (userId) {
            this.saveAccount(userId);
        }
    }

    public clearAuthSession() {
        this._authToken = '';
        this._isUserDataDirty = false;
    }

    public hasAuthSession(): boolean {
        return !!this._authToken;
    }

    public get authToken() {
        return this._authToken;
    }

    /**
     * 登录成功后用服务端 user 记录覆盖/合并本地 playerInfo（主要来自 user.user_data）
     */
    public applyServerUserAfterLogin(serverUser: any) {
        if (!serverUser || typeof serverUser !== 'object') {
            return;
        }

        const remote = serverUser.user_data;
        const hasRemoteGameData =
            remote &&
            typeof remote === 'object' &&
            !Array.isArray(remote) &&
            Object.keys(remote).length > 0;

        if (hasRemoteGameData) {
            this._playerInfo = this._mergePlayerInfoWithDefaults(remote);
            this._isNewBee = false;
            this._applyClientPrefsForKeysMissingInRemote(remote);
            this._isUserDataDirty = false;
        } else {
            // 新用户无 user_data 时，仅初始化本地运行态；登录本身不回写，等真实数据变化再上传。
            this.createPlayerInfo();
            this._isUserDataDirty = false;
            return;
        }

        if (typeof serverUser.score === 'number' && this._playerInfo) {
            this._playerInfo['score'] = serverUser.score;
        }

        if (this._playerInfo && this._playerInfo['hasShownGameRule'] === undefined) {
            this._playerInfo['hasShownGameRule'] = false;
        }
    }

    /**
     * 登录合并服务端数据后，用本机 clientPrefs 覆盖语言等本地偏好（不使用服务端 language）
     */
    private _applyClientPrefsForKeysMissingInRemote(remote: any) {
        if (!this._playerInfo) {
            return;
        }
        const prefs = readClientPrefs();
        if (typeof prefs.language === 'string' && prefs.language.length > 0) {
            this._playerInfo['language'] = prefs.language;
        } else if (typeof this._settings?.language === 'string' && this._settings.language) {
            this._playerInfo['language'] = this._settings.language;
        }
        const r = remote && typeof remote === 'object' && !Array.isArray(remote) ? remote : {};
        for (const k of ['musicOn', 'soundOn', 'vibrationOn'] as const) {
            if (!(k in r)) {
                if (typeof prefs[k] === 'boolean') {
                    this._playerInfo[k] = prefs[k];
                }
            }
        }
    }

    /**
     * 无本地盘归档；userId 仅内存，由 generateRandomAccount / 登录覆盖
     */
    public loadGlobalCache() {
    }

    /**
     * 仅初始化内存；权威数据以登录后服务端 user_data 为准
     */
    public loadFromCache() {
        // 登录场景可能已经通过 wxLogin/testLogin 把服务端 user_data 写入内存。
        // 进入主场景时不能再清空，否则会回退到默认 diamond=100 等本地默认值。
        if (!this._history) {
            this._history = {};
        }
        if (!this._settings) {
            this._settings = {};
        }
        this._isUserDataDirty = false;
    }

    private _createDefaultPlayerInfo() {
        return {
            diamond: 100,
            level: 1,
            createDate: new Date(),
            mainBrickAdd: 0,
            mainDiamondMul: 0,
            roleSkinId: 1,
            hasShownGameRule: false,
            language: '_01',
            musicOn: true,
            soundOn: true,
            vibrationOn: true,
            debugStats: false,
        };
    }

    private _mergePlayerInfoWithDefaults(raw: any) {
        const defaults = this._createDefaultPlayerInfo();
        const merged: any = { ...defaults };
        for (const k of Object.keys(raw)) {
            if (k === 'language') {
                continue;
            }
            merged[k] = raw[k];
        }
        applyClientPrefsToPlayerInfo(merged);
        return merged;
    }

    /**
     * 创建角色数据
     */
    public createPlayerInfo(loginData?: any) {
        this._playerInfo = this._createDefaultPlayerInfo();

        this._isNewBee = true;

        if (loginData) {
            for (let key in loginData) {
                this._playerInfo[key] = loginData[key];
            }
        }

        applyClientPrefsToPlayerInfo(this._playerInfo);

        this._isUserDataDirty = false;
    }

    /**
     * 生成随机账户（内存）
     */
    public generateRandomAccount() {
        this.userId = `${Date.now()}${util.getRandomInt(0, 1000)}`;
    }

    /**
     * 存用户 id（内存）
     */
    public saveAccount(userId: any) {
        this._userId = userId;
    }

    /**
     * 玩家数据发生真实变化时调用：标记脏数据，并在已登录后延迟上传 user_data。
     */
    public savePlayerInfoToLocalCache() {
        this._isUserDataDirty = true;
        this._scheduleUploadUserData();
    }

    public saveSettingsToLocalCache() {
    }

    public saveAll() {
        // 不主动制造一次 user_data 上传；仅当之前已有脏数据时才继续调度。
        this._scheduleUploadUserData();
    }

    /**
     * POST /api/user/v1/updateUserData，body: { user_data: 与本地 playerInfo 一致的 JSON }
     */
    private _scheduleUploadUserData() {
        if (!this._authToken || !this._playerInfo || !this._isUserDataDirty) {
            return;
        }
        if (this._uploadDebounceTimer !== null) {
            clearTimeout(this._uploadDebounceTimer);
        }
        this._uploadDebounceTimer = setTimeout(() => {
            this._uploadDebounceTimer = null;
            this._flushUploadUserData();
        }, 400);
    }

    private _flushUploadUserData() {
        if (!this._authToken || !this._playerInfo || !this._isUserDataDirty) {
            return;
        }

        const url = `${constant.SERVER_URL}/api/user/v1/updateUserData`;
        const body = JSON.stringify({ user_data: this._playerInfo });
        this._isUserDataDirty = false;

        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xhr.setRequestHeader('Authorization', `Bearer ${this._authToken}`);

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status !== 200) {
                this._isUserDataDirty = true;
                console.error('[playerData] updateUserData 失败:', xhr.status, xhr.responseText);
            }
        };
        xhr.onerror = () => {
            this._isUserDataDirty = true;
            console.error('[playerData] updateUserData 网络错误');
        };

        xhr.send(body);
    }

    /**
     * 更新用户信息
     */
    public updatePlayerInfo(key: string, value: any) {
        let isChanged: boolean = false;
        if (this._playerInfo.hasOwnProperty(key)) {
            if (typeof value === 'number') {
                const oldVal = Number(this._playerInfo[key]) || 0;
                const nextVal = Math.max(0, oldVal + value);
                if (nextVal !== oldVal) {
                    isChanged = true;
                    this._playerInfo[key] = nextVal;
                }
                if (this._playerInfo[key] < 0) {
                    this._playerInfo[key] = 0;
                }
            } else if (typeof value === 'boolean' || typeof value === 'string') {
                if (this._playerInfo[key] !== value) {
                    isChanged = true;
                    this._playerInfo[key] = value;
                }
            }
        }
        if (isChanged) {
            this.savePlayerInfoToLocalCache();
        }
    }

    public getSetting(key: string) {
        if (!this._settings) {
            return null;
        }

        if (!this._settings.hasOwnProperty(key)) {
            return null;
        }

        return this._settings[key];
    }

    public setSetting(key: string, value: any) {
        if (!this._settings) {
            this._settings = {};
        }

        this._settings[key] = value;

        this.saveSettingsToLocalCache();
    }

    public clear() {
        this._playerInfo = {};
        this._settings = {};
        this._authToken = '';
        this._isUserDataDirty = false;
        this.saveAll();
    }
}
