import { _decorator, sys } from 'cc';
import { playerData } from './playerData';
import { constant } from './constant';
import { i18nManager } from './i18nManager';

/** 微信小游戏全局（非微信环境由调用方判断） */
declare const wx: any;

const { ccclass } = _decorator;

// ==================== 数据接口 ====================

/**
 * 登录接口返回的用户（后端字段）
 */
export interface IServerUser {
    id?: number | string;
    openid?: string;
    nickname?: string;
    avatar?: string;
    user_data?: any;
    score?: number;
    [key: string]: any;
    phone?: string;
}

/**
 * 登录响应数据（兼容直接返回或包在 data 内）
 */
export interface ILoginResponse {
    token: string;
    userId: string;
    isNewUser: boolean;
    user?: IServerUser;
}

/**
 * 微信用户信息
 */
export interface IWxUserInfo {
    nickName: string;      // 微信昵称
    avatarUrl: string;     // 头像 URL
    gender: number;        // 性别 0未知 1男 2女
    city: string;          // 城市
    province: string;      // 省份
    country: string;       // 国家
    openId?: string;       // 用户唯一标识（可选）
}

/**
 * 完整的用户数据（存储在本地）
 */
export interface IUserData {
    userId: string;           // 用户ID
    token: string;            // 登录令牌
    nickName: string;         // 昵称
    avatarUrl: string;        // 头像
    gender: number;           // 性别
    isNewUser: boolean;       // 是否新用户
    loginTime: number;        // 登录时间戳
    lastUpdateTime: number;   // 最后更新时间
    phone: string;            // 电话号码
}

// ==================== 登录管理器 ====================

@ccclass('LoginManager')
export class LoginManager {
    private static _instance: LoginManager | null = null;
    
    // 内存缓存的用户数据
    private _userData: IUserData | null = null;

    public static get instance(): LoginManager {
        if (!this._instance) {
            this._instance = new LoginManager();
        }
        return this._instance;
    }

    // ==================== 初始化 ====================

    /**
     * 初始化登录管理器（游戏启动时调用）
     * 检查本地是否有登录凭证，尝试自动登录
     */
    public init(): boolean {
        console.log('[LoginManager] 初始化登录管理器');
        
        // 从本地加载用户数据
        this._loadUserDataFromStorage();
        
        // 检查登录是否有效
        if (this.isLoggedIn()) {
            console.log('[LoginManager] 用户已登录:', this._userData?.nickName);
            return true;
        }
        
        console.log('[LoginManager] 用户未登录');
        return false;
    }

    /**
     * 测试/编辑器用：直接传入微信登录 code，不调 wx.login。
     * @param mockWxInfo 可选，模拟授权用户信息（不传则昵称头像仅用服务端 user）
     */
    public testLogin(
        code: string,
        callback?: (success: boolean, error?: string) => void,
        mockWxInfo?: IWxUserInfo
    ): void {
        this._sendCodeToServer(code, (loginSuccess, rawLogin, loginError) => {
            if (!loginSuccess || !rawLogin) {
                callback?.(false, loginError || '登录失败');
                return;
            }

            const parsed = this._parseWxLoginResponse(rawLogin);
            if (!parsed) {
                callback?.(false, '登录数据不完整');
                return;
            }

            const userData = this._buildUserData(parsed, mockWxInfo);
            this._saveUserData(userData, parsed.serverUser);

            if (mockWxInfo) {
                this._updateUserInfoToServer(mockWxInfo);
            }

            console.log('[LoginManager] testLogin 成功:', userData.nickName);
            callback?.(true);
        }, true);
    }


    /**
     * 完整登录（获取用户信息，会弹出授权框）
     * 适合点击"开始游戏"时的登录
     * 
     * 重要：此方法必须在用户点击事件的同步调用栈中调用，
     * 否则微信授权框无法弹出。
     */
    public fullLogin(callback?: (success: boolean, error?: string) => void): void {
        // 检查微信环境
        if (typeof wx === 'undefined') {
            console.error('[LoginManager] 非微信环境');
            callback?.(false, '非微信环境');
            return;
        }

        console.log('[LoginManager] 开始完整登录流程（调起授权）');

        // 立即同步调用 getUserProfile（必须在点击事件的同步调用栈中）
        // wx.getUserProfile({
        //     desc: '用于完善用户资料',
        //     success: (profileRes: any) => {
        //         const wxInfo: IWxUserInfo = {
        //             nickName: profileRes.userInfo?.nickName || '玩家',
        //             avatarUrl: profileRes.userInfo?.avatarUrl || '',
        //             gender: profileRes.userInfo?.gender || 0,
        //             city: profileRes.userInfo?.city || '',
        //             province: profileRes.userInfo?.province || '',
        //             country: profileRes.userInfo?.country || ''
        //         };
        //         console.log('[LoginManager] 用户授权成功:', wxInfo.nickName);
                
        //         // 获取到用户信息后，继续执行登录流程
        //         this._doLoginWithWxInfo(wxInfo, callback);
        //     },
        //     fail: (err: any) => {
        //         console.warn('[LoginManager] 用户拒绝授权或授权失败:', err);
        //         // 用户拒绝授权，继续执行静默登录（不带用户信息）
                this._doLoginWithWxInfo(null, callback);
        //     }
        // });
    }

    /**
     * 使用微信用户信息执行登录
     * @param wxInfo 微信用户信息（可能为null）
     * @param callback 回调函数
     */
    private _doLoginWithWxInfo(
        wxInfo: IWxUserInfo | null,
        callback?: (success: boolean, error?: string) => void
    ): void {
        // 获取微信登录 code
        wx.login({
            success: (loginRes: any) => {
                if (!loginRes.code) {
                    const error = '获取微信 code 失败';
                    console.error('[LoginManager]', error, loginRes);
                    callback?.(false, error);
                    return;
                }

                console.log('[LoginManager] 获取 code 成功');

                // 发送 code 到服务器
                this._sendCodeToServer(loginRes.code, (loginSuccess, rawLogin, loginError) => {
                    if (!loginSuccess || !rawLogin) {
                        callback?.(false, loginError || '登录失败');
                        return;
                    }

                    const parsed = this._parseWxLoginResponse(rawLogin);
                    if (!parsed) {
                        callback?.(false, '登录数据不完整');
                        return;
                    }

                    const userData = this._buildUserData(parsed, wxInfo || undefined);
                    this._saveUserData(userData, parsed.serverUser);

                    // 如果有用户信息，发送到服务器更新
                    if (wxInfo) {
                        this._updateUserInfoToServer(wxInfo);
                    }

                    console.log('[LoginManager] 登录成功:', userData.nickName);
                    callback?.(true);
                });
            },
            fail: (err: any) => {
                const error = '微信登录调用失败';
                console.error('[LoginManager]', error, err);
                callback?.(false, error);
            }
        });
    }

    // ==================== 用户信息 ====================

    /**
     * 更新用户信息（重新获取微信用户信息）
     */
    public updateUserInfo(callback?: (success: boolean, error?: string) => void): void {
        if (!this.isLoggedIn()) {
            callback?.(false, '未登录');
            return;
        }

        this._getWxUserProfile((success, infoData, error) => {
            if (success && infoData && this._userData) {
                // 更新本地数据
                this._userData.nickName = infoData.nickName;
                this._userData.avatarUrl = infoData.avatarUrl;
                this._userData.gender = infoData.gender || 0;
                this._userData.lastUpdateTime = Date.now();
                this._saveUserData(this._userData);

                // 发送到服务器
                this._updateUserInfoToServer(infoData);

                callback?.(true);
            } else {
                callback?.(false, error);
            }
        });
    }

    /**
     * 获取当前用户信息
     */
    public getUserInfo(): IUserData | null {
        return this._userData;
    }

    /**
     * 获取用户昵称
     */
    public getNickName(): string {
        return this._userData?.nickName || '玩家';
    }

    /**
     * 获取用户头像
     */
    public getAvatarUrl(): string {
        return this._userData?.avatarUrl || '';
    }

    // ==================== 状态检查 ====================

    /**
     * 检查是否已登录
     */
    public isLoggedIn(): boolean {
        return !!this._userData && !!this._userData.token && !!this._userData.userId;
    }

    /**
     * 是否新用户
     */
    public isNewUser(): boolean {
        return this._userData?.isNewUser || false;
    }

    /**
     * 获取 Token（用于 API 请求）
     */
    public getToken(): string {
        return this._userData?.token || '';
    }

    /**
     * 获取 UserId
     */
    public getUserId(): string {
        return this._userData?.userId || '';
    }

    // ==================== 退出登录 ====================

    /**
     * 退出登录
     */
    public logout(): void {
        console.log('[LoginManager] 用户退出登录');
        
        this._userData = null;

        playerData.instance.clearAuthSession();
        // 清除本地存储
        playerData.instance.setSetting('userData', null);
        playerData.instance.saveAll();
    }

    // ==================== 私有方法 ====================

    /**
     * 发送 code 到服务器登录
     */
    private _sendCodeToServer(
        code: string,
        callback: (success: boolean, raw?: any, error?: string) => void,
        debug: boolean = false,
    ): void {
        const url = `${constant.SERVER_URL}/api/auth/v1/wxLogin`;
        
        const requestData = { "code":code, "debug":debug };

        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response?.errcode !== undefined && response.errcode !== 0) {
                            console.error('[LoginManager] 业务失败:', response.errmsg, response);
                            callback(false, undefined, response.errmsg || '登录失败');
                            return;
                        }
                        console.log('[LoginManager] 服务器登录成功');
                        callback(true, response);
                    } catch (e) {
                        console.error('[LoginManager] 解析响应失败:', e);
                        callback(false, undefined, '解析响应失败');
                    }
                } else {
                    console.error('[LoginManager] 服务器登录失败:', xhr.status);
                    callback(false, undefined, `服务器错误: ${xhr.status}`);
                }
            }
        };

        xhr.onerror = () => {
            console.error('[LoginManager] 网络请求失败');
            callback(false, undefined, '网络请求失败');
        };

        xhr.send(JSON.stringify(requestData));
    }

    /**
     * 获取微信用户信息（需要用户授权）
     */
    private _getWxUserProfile(
        callback: (success: boolean, data?: IWxUserInfo, error?: string) => void
    ): void {
        wx.getUserProfile({
            desc: '用于完善用户资料',
            success: (res: any) => {
                const userInfo: IWxUserInfo = {
                    nickName: res.userInfo?.nickName || '玩家',
                    avatarUrl: res.userInfo?.avatarUrl || '',
                    gender: res.userInfo?.gender || 0,
                    city: res.userInfo?.city || '',
                    province: res.userInfo?.province || '',
                    country: res.userInfo?.country || ''
                };
                callback(true, userInfo);
            },
            fail: (err: any) => {
                console.error('[LoginManager] 获取用户信息失败:', err);
                callback(false, undefined, '用户拒绝授权');
            }
        });
    }

    /**
     * 发送用户信息到服务器更新
     */
    private _updateUserInfoToServer(userInfo: IWxUserInfo): void {
        // TODO: 调用服务器接口更新用户信息
        // 接口: POST /api/user/v1/getWxUserInfo
        // 参数: encrypted_data, iv
        // 这里需要根据实际接口调整
        // console.log('[LoginManager] 更新用户信息到服务器:', userInfo.nickName);
    }

    /**
     * 解析 wxLogin 接口返回
     * 兼容：{ errcode, errmsg, data: { access_token, user } } 以及扁平 { token, user }
     */
    private _parseWxLoginResponse(raw: any): { token: string; userId: string; isNewUser: boolean; serverUser?: IServerUser } | null {
        const root = raw?.data ?? raw;
        const user: IServerUser | undefined = root?.user ?? raw?.user;
        const token =
            root?.access_token ??
            root?.token ??
            raw?.access_token ??
            raw?.token ??
            '';
        const userId =
            user?.id != null
                ? String(user.id)
                : root?.userId != null
                  ? String(root.userId)
                  : raw?.userId != null
                    ? String(raw.userId)
                    : '';
        if (!token || !userId) {
            console.error('[LoginManager] 登录响应缺少 token/access_token 或 user.id', raw);
            return null;
        }
        const isNewUser = !!(
            root?.isNewUser ??
            raw?.isNewUser ??
            root?.is_new_user ??
            false
        );
        return { token, userId, isNewUser, serverUser: user };
    }

    /**
     * 构建用户数据对象
     */
    private _buildUserData(
        parsed: { token: string; userId: string; isNewUser: boolean; serverUser?: IServerUser; },
        wxInfo?: IWxUserInfo
    ): IUserData {
        const nick = wxInfo?.nickName ?? parsed.serverUser?.nickname ?? '玩家';
        const avatar = wxInfo?.avatarUrl ?? parsed.serverUser?.avatar ?? '';
        console.warn('parsed', parsed);
        return {
            userId: parsed.userId,
            token: parsed.token,
            nickName: nick,
            avatarUrl: avatar,
            gender: wxInfo?.gender || 0,
            isNewUser: parsed.isNewUser,
            loginTime: Date.now(),
            lastUpdateTime: Date.now(),
            phone: parsed?.serverUser?.phone ?? ''
        };
    }

    /**
     * 保存用户数据到本地存储，并把服务端 user_data 应用到 playerData
     */
    private _saveUserData(userData: IUserData, serverUser?: IServerUser): void {
        this._userData = userData;
        playerData.instance.setAuthSession(userData.token, userData.userId);
        if (serverUser) {
            playerData.instance.applyServerUserAfterLogin(serverUser);
        }
        playerData.instance.setSetting('userData', userData);
        playerData.instance.phone = userData.phone;
        // 登录成功时只更新内存态，不立即调用 updateUserData；
        // 之后由 updatePlayerInfo 等真实数据变更触发上报。
        console.log('[LoginManager] 用户数据已保存:', userData.nickName);
    }

    /**
     * 从本地存储加载用户数据
     */
    private _loadUserDataFromStorage(): void {
        const savedData = playerData.instance.settings?.userData;
        if (savedData && savedData.token && savedData.userId) {
            this._userData = savedData;
            playerData.instance.setAuthSession(savedData.token, savedData.userId);
            console.log('[LoginManager] 从本地加载用户数据:', savedData.nickName);
        }
    }
}

// 导出单例
export const loginManager = LoginManager.instance;

// ==================== 使用说明 ====================
/**
 * 使用示例:
 * 
 * 1. 游戏启动时初始化（在 GameManager 或入口脚本中）:
 *    loginManager.init();
 * 
 * 2. 点击"开始游戏"按钮:
 *    if (!loginManager.isLoggedIn()) {
 *        // 显示微信登录按钮
 *        loginManager.fullLogin((success, error) => {
 *            if (success) {
 *                // 登录成功，进入游戏
 *                this.startGame();
 *            } else {
 *                // 登录失败，提示用户
 *                console.error('登录失败:', error);
 *            }
 *        });
 *    } else {
 *        // 已登录，直接进入游戏
 *        this.startGame();
 *    }
 * 
 * 3. 获取用户信息显示:
 *    const userInfo = loginManager.getUserInfo();
 *    this.labelNickName.string = userInfo?.nickName || '玩家';
 *    // 加载头像...
 * 
 * 4. 退出登录:
 *    loginManager.logout();
 */
