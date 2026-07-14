import { _decorator, Label, Sprite, SpriteFrame, resources, assetManager, ImageAsset, Texture2D, game, director, Component, Node, UITransform } from 'cc';
import { readClientPrefs, mergeWriteClientPrefs } from './clientPrefs';
import { playerData } from './playerData';
import { clientEvent } from './clientEvent';
import { resourceUtil } from './resourceUtil';

// 延迟加载 i18nText 避免模块循环依赖
let I18N_TEXT_CACHE: Record<string, any> | null = null;
let I18N_TEXT_LOAD_ATTEMPTED = false;

function getI18N_TEXT(): Record<string, any> {
    // 如果已经缓存且有内容，直接返回
    if (I18N_TEXT_CACHE !== null && Object.keys(I18N_TEXT_CACHE).length > 0) {
        return I18N_TEXT_CACHE;
    }

    // 避免重复尝试加载导致问题
    if (I18N_TEXT_LOAD_ATTEMPTED) {
        return I18N_TEXT_CACHE || {};
    }
    I18N_TEXT_LOAD_ATTEMPTED = true;

    try {
        // 使用动态 require 加载 i18nText 模块
        const i18nModule = require('../../resources/i18n/i18nText');
        if (i18nModule && i18nModule.I18N_TEXT) {
            I18N_TEXT_CACHE = i18nModule.I18N_TEXT;
        } else {
            I18N_TEXT_CACHE = {};
        }
    } catch (e) {
        // 加载失败，使用空对象
        I18N_TEXT_CACHE = {};
    }

    return I18N_TEXT_CACHE || {};
}

// 语言类型枚举
export enum LanguageType {
    CN = '_01',   // 简体中文
    TW = '_02',   // 繁体中文
    EN = '_03',   // 英文
}

// 语言显示名称
export const LANGUAGE_NAMES: Record<LanguageType, string> = {
    [LanguageType.CN]: '简体中文',
    [LanguageType.TW]: '繁體中文',
    [LanguageType.EN]: 'English',
};

const { ccclass } = _decorator;

// 语言代码映射（字符串值到枚举）
export const LANGUAGE_CODES: Record<string, LanguageType> = {
    '_01': LanguageType.CN,
    '_02': LanguageType.TW,
    '_03': LanguageType.EN,
    'cn': LanguageType.CN,
    'zh': LanguageType.CN,
    'zh-cn': LanguageType.CN,
    'tw': LanguageType.TW,
    'zh-tw': LanguageType.TW,
    'en': LanguageType.EN,
    'english': LanguageType.EN,
};

@ccclass('i18nManager')
export class i18nManager {
    private static _instance: i18nManager | null = null;
    private static _isPrototypeOverridden: boolean = false;
    private _currentLanguage: LanguageType = LanguageType.CN;
    private _isInited: boolean = false;
    private _isRefreshing: boolean = false;  // 标记是否正在刷新中
    private _labelOriginalStrings: Map<Label, string> = new Map();
    private _spriteOriginalFrames: Map<Sprite, string> = new Map();

    public static get instance(): i18nManager {
        if (!this._instance) {
            this._instance = new i18nManager();
        }
        return this._instance;
    }

    constructor() {
        // 延迟到 init() 中执行原型拦截，避免模块加载时的循环依赖问题
    }

    /**
     * 初始化多语言系统
     * 加载语言设置并应用
     */
    public init() {
        if (this._isInited) return;
        this._isInited = true;

        // 在这里执行原型拦截，确保引擎已完全初始化
        if (!i18nManager._isPrototypeOverridden) {
            i18nManager._isPrototypeOverridden = true;
            this._overrideLabelPrototype();
            this._overrideSpritePrototype();
            this._overrideNodeActivePrototype();
        }

        // 语言仅由本机 clientPrefs / settings 管理，不读取服务端 user_data
        const settings = playerData.instance.settings;
        const prefs = readClientPrefs();
        const savedLang =
            (typeof prefs.language === 'string' ? prefs.language : undefined) ??
            settings?.language;

        // 直接保存的是 LanguageType 值（'_01'/'_02'/'_03'）
        if (savedLang && Object.values(LanguageType).includes(savedLang as LanguageType)) {
            this._currentLanguage = savedLang as LanguageType;
        } else if (savedLang && LANGUAGE_CODES[savedLang]) {
            // 兼容旧数据：如果是语言代码，转换为 LanguageType
            this._currentLanguage = LANGUAGE_CODES[savedLang];
        } else {
        }

    }

    /**
     * 重写 Label 原型，拦截 string 设置
     */
    private _overrideLabelPrototype() {
        const originalDescriptor = Object.getOwnPropertyDescriptor(Label.prototype, 'string');
        if (!originalDescriptor) {
            console.warn('[i18n] 无法获取 Label.string 属性描述符');
            return;
        }

        const originalSetter = originalDescriptor.set;
        const originalGetter = originalDescriptor.get;
        const self = this;

        Object.defineProperty(Label.prototype, 'string', {
            get: function () {
                return originalGetter?.call(this);
            },
            set: function (value: string) {
                // 保存原始字符串（用于后续语言切换）
                if (value && typeof value === 'string') {
                    // 只保存不包含语言后缀的原始键
                    if (!self._hasLanguageSuffix(value)) {
                        self._labelOriginalStrings.set(this, value);
                    }
                }

                // 获取当前语言的翻译
                const translated = self._getTranslatedString(value);
                originalSetter?.call(this, translated);
            },
            enumerable: true,
            configurable: true,
        });
    }

    /**
     * 重写 Sprite 原型，拦截 spriteFrame 设置
     */
    private _overrideSpritePrototype() {
        const originalDescriptor = Object.getOwnPropertyDescriptor(Sprite.prototype, 'spriteFrame');
        if (!originalDescriptor) {
            console.warn('[i18n] 无法获取 Sprite.spriteFrame 属性描述符');
            return;
        }

        const originalSetter = originalDescriptor.set;
        const originalGetter = originalDescriptor.get;
        const self = this;

        Object.defineProperty(Sprite.prototype, 'spriteFrame', {
            get: function () {
                return originalGetter?.call(this);
            },
            set: function (value: SpriteFrame | null) {
                // 如果正在刷新中，直接设置值，不做拦截处理
                if (self._isRefreshing) {
                    originalSetter?.call(this, value);
                    return;
                }


                if (!value) {
                    originalSetter?.call(this, value);
                    return;
                }

                // 保存原始资源名（移除语言后缀）
                const originalName = value.name;
                if (originalName) {
                    // 只保存带语言后缀资源的基础名，用于从 moreLanguage 路径加载
                    if (self._hasLanguageSuffix(originalName)) {
                        const baseName = self._removeLanguageSuffix(originalName);
                        self._spriteOriginalFrames.set(this, baseName);
                    }
                }

                // 尝试加载当前语言的纹理
                self._loadLocalizedSpriteFrame(value, (localizedFrame) => {
                    originalSetter?.call(this, localizedFrame || value);
                });
            },
            enumerable: true,
            configurable: true,
        });
    }

    /**
     * 重写 Node active 原型，拦截节点显示/隐藏
     * 节点显示时自动刷新多语言文本和 Sprite
     */
    private _overrideNodeActivePrototype() {
        const originalDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'active');
        if (!originalDescriptor) {
            console.warn('[i18n] 无法获取 Node.active 属性描述符');
            return;
        }

        const originalSetter = originalDescriptor.set;
        const originalGetter = originalDescriptor.get;
        const self = this;

        Object.defineProperty(Node.prototype, 'active', {
            get: function () {
                return originalGetter?.call(this);
            },
            set: function (value: boolean) {
                const oldValue = originalGetter?.call(this);
                originalSetter?.call(this, value);

                // 节点从隐藏变为显示时，刷新该节点的多语言
                if (value && !oldValue && this.isValid) {
                    // 使用 setTimeout 延迟执行，确保节点完全激活
                    setTimeout(() => {
                        if (this.isValid) {
                            self.refreshNode(this);
                        }
                    }, 0);
                }
            },
            enumerable: true,
            configurable: true,
        });
    }

    /**
     * 移除字符串中的语言后缀，返回基础名
     */
    private _removeLanguageSuffix(str: string): string {
        if (!str) return str;
        for (const suffix of Object.values(LanguageType)) {
            if (str.endsWith(suffix)) {
                return str.slice(0, -suffix.length);
            }
        }
        return str;
    }

    /**
     * 获取 SpriteFrame 的完整资源路径
     */
    private _getSpriteFramePath(spriteFrame: SpriteFrame): string {
        const uuid = (spriteFrame as any)._uuid || (spriteFrame as any).uuid;

        if (!uuid) {
            return spriteFrame.name || '';
        }

        // 方法1: 尝试从所有 bundle 中获取资源路径
        const bundles = assetManager.bundles;
        if (bundles) {
            bundles.forEach((bundle: any, bundleName: string) => {
                if (bundle.getAssetInfo) {
                    const assetInfo = bundle.getAssetInfo(uuid);
                    if (assetInfo && assetInfo.path) {
                        return assetInfo.path;
                    }
                }
            });
        }

        // 方法2: 获取主 bundle (resources)
        const resourcesBundle = assetManager.getBundle('resources');
        if (resourcesBundle && resourcesBundle.getAssetInfo) {
            const assetInfo = resourcesBundle.getAssetInfo(uuid);
            if (assetInfo && assetInfo.path) {
                return assetInfo.path;
            }
        }

        // 方法3: 从 nativeUrl 解析
        const nativeUrl = (spriteFrame as any).nativeUrl;
        if (nativeUrl) {
            const match = nativeUrl.match(/db:\/\/assets\/(.*?)(?:\.[^.]+)?$/);
            if (match) {
                return match[1];
            }
        }

        // 回退：使用 name
        return spriteFrame.name || '';
    }

    /**
     * 检查字符串是否包含语言后缀
     */
    private _hasLanguageSuffix(str: string): boolean {
        if (!str) return false;
        return Object.values(LanguageType).some(suffix => str.endsWith(suffix));
    }

    /**
     * 获取翻译后的字符串（严格比对）
     * 优先通过值反向查找 key，再从 I18N_TEXT 获取当前语言的翻译
     */
    private _getTranslatedString(value: string): string {
        if (!value || typeof value !== 'string') return value;

        // 安全保护：如果 I18N_TEXT 未加载或为空对象，返回原值
        const i18nText = getI18N_TEXT();
        if (!i18nText || Object.keys(i18nText).length === 0) {
            return value;
        }

        // 去除首尾空格进行严格比对
        const trimmedValue = value.trim();
        if (!trimmedValue) return value;

        // 如果已经是当前语言后缀，直接返回
        if (trimmedValue.endsWith(this._currentLanguage)) {
            return value;
        }

        // 移除其他语言后缀，获取基础 key
        let baseKey = trimmedValue;
        Object.values(LanguageType).forEach(suffix => {
            if (trimmedValue.endsWith(suffix)) {
                baseKey = trimmedValue.slice(0, -suffix.length);
            }
        });

        // 首先尝试直接通过 key 查找
        let i18nItem = i18nText[baseKey];
        if (i18nItem) {
            switch (this._currentLanguage) {
                case LanguageType.CN: return i18nItem.cn;
                case LanguageType.TW: return i18nItem.tw;
                case LanguageType.EN: return i18nItem.en;
                default: return i18nItem.cn;
            }
        }

        // 如果 key 没找到，通过值反向查找 key（严格比对）
        const foundKey = this._findKeyByValue(baseKey);
        if (foundKey) {
            i18nItem = i18nText[foundKey];
            if (i18nItem) {
                switch (this._currentLanguage) {
                    case LanguageType.CN: return i18nItem.cn;
                    case LanguageType.TW: return i18nItem.tw;
                    case LanguageType.EN: return i18nItem.en;
                    default: return i18nItem.cn;
                }
            }
        }

        // 未找到翻译，返回原始值
        return value;
    }

    /**
     * 通过值反向查找 key（严格比对）
     * 遍历 I18N_TEXT 中所有语言的值，严格匹配则返回 key
     * 比对前会去除首尾空格，确保精确匹配
     */
    private _findKeyByValue(value: string): string | null {
        // 安全保护：如果 I18N_TEXT 未加载或为空对象
        const i18nText = getI18N_TEXT();
        if (!i18nText || Object.keys(i18nText).length === 0) {
            return null;
        }

        // 去除首尾空格，处理空字符串
        const trimmedValue = value?.trim();
        if (!trimmedValue) return null;

        for (const [key, item] of Object.entries(i18nText)) {
            // 严格比对：去除空格后完全相等
            if (item.cn?.trim() === trimmedValue ||
                item.tw?.trim() === trimmedValue ||
                item.en?.trim() === trimmedValue) {
                return key;
            }
        }
        return null;
    }

    /**
     * 加载本地化的 SpriteFrame
     * 逻辑：只处理带语言后缀的资源，不带后缀的保持原样
     */
    private _loadLocalizedSpriteFrame(originalFrame: SpriteFrame, callback: (frame: SpriteFrame | null) => void) {
        const originalName = originalFrame.name;

        if (!originalName) {
            callback(null);
            return;
        }

        // 检查资源名是否包含语言后缀
        const hasLanguageSuffix = this._hasLanguageSuffix(originalName);

        // 不带语言后缀的资源，直接跳出逻辑，不做多语言处理
        if (!hasLanguageSuffix) {
            callback(originalFrame);
            return;
        }

        // 带语言后缀的资源：检查是否与当前语言匹配
        if (originalName.endsWith(this._currentLanguage)) {
            callback(originalFrame);
            return;
        }

        // 与其他语言匹配：需要替换成当前语言的资源
        const baseName = this._removeLanguageSuffix(originalName);

        // 先尝试加载目标语言的资源
        this._tryLoadLocalizedSprite(baseName, this._currentLanguage, (frame) => {
            if (frame) {
                callback(frame);
                return;
            }

            // 目标语言失败，尝试加载默认语言 _01
            this._tryLoadLocalizedSprite(baseName, LanguageType.CN, (defaultFrame) => {
                if (defaultFrame) {
                    callback(defaultFrame);
                    return;
                }

                // 都失败了，回退到原始资源
                callback(originalFrame);
            });
        });
    }

    /**
     * 尝试加载指定语言的 SpriteFrame
     */
    private _tryLoadLocalizedSprite(baseName: string, language: LanguageType, callback: (frame: SpriteFrame | null) => void) {
        const localizedPath = 'moreLanguage/' + baseName + language + '/spriteFrame';

        resourceUtil.loadSpriteFrameRes(localizedPath).then((frame) => {
            callback(frame as SpriteFrame);
        }).catch((err) => {
            callback(null);
        });
    }

    /**
     * 切换语言
     */
    public setLanguage(lang: LanguageType | string) {
        let newLang: LanguageType;

        if (typeof lang === 'string') {
            newLang = LANGUAGE_CODES[lang.toLowerCase()] || LanguageType.CN;
        } else {
            newLang = lang;
        }

        if (this._currentLanguage === newLang) return;

        this._currentLanguage = newLang;

        mergeWriteClientPrefs({ language: newLang });

        // 语言仅存本机，不同步到服务端 user_data
        playerData.instance.setSetting('language', newLang);

        // 派发语言切换事件
        clientEvent.dispatchEvent('languageChanged', newLang);


        // 刷新整个场景
        this.refreshAllNodes();
    }

    /**
     * 获取当前语言
     */
    public getCurrentLanguage(): LanguageType {
        return this._currentLanguage;
    }

    /**
     * 获取当前语言代码
     */
    public getCurrentLanguageCode(): string {
        const code = Object.keys(LANGUAGE_CODES).find(
            key => LANGUAGE_CODES[key] === this._currentLanguage
        );
        return code || 'cn';
    }

    /**
     * 刷新整个场景下所有节点的显示
     */
    public refreshAllNodes() {

        // 递归刷新场景中的所有节点（包含所有 Label 和 Sprite）
        this._refreshSceneNodes();

    }

    /**
     * 递归刷新场景中的所有节点
     */
    private _refreshSceneNodes() {
        const scene = director.getScene();
        if (!scene) return;

        this._isRefreshing = true;

        // 收集所有组件 - 递归遍历所有子节点
        const allLabels: Label[] = [];
        const allSprites: Sprite[] = [];

        const collectComponents = (node: Node) => {
            if (!node || !node.isValid) return;
            
            const label = node.getComponent(Label);
            if (label) allLabels.push(label);
            
            const sprite = node.getComponent(Sprite);
            if (sprite) allSprites.push(sprite);
            
            // 递归遍历子节点
            node.children.forEach(child => collectComponents(child));
        };

        // 从场景的根节点开始
        scene.children.forEach(root => collectComponents(root));


        // 刷新 Label
        allLabels.forEach(label => {
            if (label.isValid && label.string) {
                const originalStr = this._labelOriginalStrings.get(label) || label.string;
                const newStr = this._getTranslatedString(originalStr);
                if (label.string !== newStr) {
                    label.string = newStr;
                }
            }
        });

        // 刷新 Sprite
        let pendingLoads = 0;
        allSprites.forEach(sprite => {
            if (sprite.isValid && sprite.spriteFrame) {
                const originalName = sprite.spriteFrame.name;
                if (originalName && this._hasLanguageSuffix(originalName)) {
                    const baseName = this._removeLanguageSuffix(originalName);
                    this._spriteOriginalFrames.set(sprite, baseName);
                    pendingLoads++;

                    // 保存当前节点尺寸
                    const originalSize = sprite.node.getComponent(UITransform)?.contentSize;
                    const originalSizeMode = sprite.sizeMode;

                    // 尝试加载目标语言，失败则回退到默认语言
                    this._tryLoadLocalizedSprite(baseName, this._currentLanguage, (frame) => {
                        if (frame && sprite.isValid) {
                            // 目标语言加载成功
                            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
                            const descriptor = Object.getOwnPropertyDescriptor(Sprite.prototype, 'spriteFrame');
                            descriptor?.set?.call(sprite, frame);
                            if (originalSize && sprite.node.getComponent(UITransform)) {
                                sprite.node.getComponent(UITransform)!.setContentSize(originalSize);
                            }
                            pendingLoads--;
                            if (pendingLoads === 0) {
                                this._isRefreshing = false;
                            }
                        } else {
                            // 目标语言失败，尝试默认语言
                            this._tryLoadLocalizedSprite(baseName, LanguageType.CN, (defaultFrame) => {
                                if (defaultFrame && sprite.isValid) {
                                    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
                                    const descriptor = Object.getOwnPropertyDescriptor(Sprite.prototype, 'spriteFrame');
                                    descriptor?.set?.call(sprite, defaultFrame);
                                    if (originalSize && sprite.node.getComponent(UITransform)) {
                                        sprite.node.getComponent(UITransform)!.setContentSize(originalSize);
                                    }
                                }
                                pendingLoads--;
                                if (pendingLoads === 0) {
                                    this._isRefreshing = false;
                                }
                            });
                        }
                    });
                }
            }
        });

        if (pendingLoads === 0) {
            this._isRefreshing = false;
        }
    }

    /**
     * 获取所有根节点
     */
    private _getAllRootNodes(): Node[] {
        const nodes: Node[] = [];
        // 通过场景找到所有根节点 (Cocos 3.x 使用 director.getScene())
        const scene = director.getScene();
        if (scene) {
            scene.children.forEach(child => {
                nodes.push(child);
            });
        }
        return nodes;
    }



    /**
     * 刷新指定节点及其子节点的多语言
     * 用于动态加载的预制体（如通过 uiManager.showDialog 打开的面板）
     * @param node 需要刷新的根节点
     */
    public refreshNode(node: Node) {
        if (!node || !node.isValid) return;

        this._isRefreshing = true;

        // 收集该节点下的所有 Label 和 Sprite - 递归遍历所有子节点
        const allLabels: Label[] = [];
        const allSprites: Sprite[] = [];

        const collectComponents = (n: Node) => {
            if (!n || !n.isValid) return;
            
            const label = n.getComponent(Label);
            if (label) allLabels.push(label);
            
            const sprite = n.getComponent(Sprite);
            if (sprite) allSprites.push(sprite);
            
            // 递归遍历子节点
            n.children.forEach(child => collectComponents(child));
        };

        // 从传入节点开始递归
        collectComponents(node);


        // 刷新 Label
        allLabels.forEach(label => {
            if (label.isValid && label.string) {
                const originalStr = this._labelOriginalStrings.get(label) || label.string;
                const newStr = this._getTranslatedString(originalStr);
                if (label.string !== newStr) {
                    label.string = newStr;
                }
            }
        });

        // 刷新 Sprite
        let pendingLoads = 0;
        allSprites.forEach(sprite => {
            if (sprite.isValid && sprite.spriteFrame) {
                const originalName = sprite.spriteFrame.name;
                if (originalName && this._hasLanguageSuffix(originalName)) {
                    const baseName = this._removeLanguageSuffix(originalName);
                    this._spriteOriginalFrames.set(sprite, baseName);
                    pendingLoads++;

                    // 保存当前节点尺寸
                    const originalSize = sprite.node.getComponent(UITransform)?.contentSize;
                    const originalSizeMode = sprite.sizeMode;

                    // 尝试加载目标语言，失败则回退到默认语言
                    this._tryLoadLocalizedSprite(baseName, this._currentLanguage, (frame) => {
                        if (frame && sprite.isValid) {
                            // 目标语言加载成功
                            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
                            const descriptor = Object.getOwnPropertyDescriptor(Sprite.prototype, 'spriteFrame');
                            descriptor?.set?.call(sprite, frame);
                            if (originalSize && sprite.node.getComponent(UITransform)) {
                                sprite.node.getComponent(UITransform)!.setContentSize(originalSize);
                            }
                            pendingLoads--;
                            if (pendingLoads === 0) {
                                this._isRefreshing = false;
                            }
                        } else {
                            // 目标语言失败，尝试默认语言
                            this._tryLoadLocalizedSprite(baseName, LanguageType.CN, (defaultFrame) => {
                                if (defaultFrame && sprite.isValid) {
                                    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
                                    const descriptor = Object.getOwnPropertyDescriptor(Sprite.prototype, 'spriteFrame');
                                    descriptor?.set?.call(sprite, defaultFrame);
                                    if (originalSize && sprite.node.getComponent(UITransform)) {
                                        sprite.node.getComponent(UITransform)!.setContentSize(originalSize);
                                    }
                                }
                                pendingLoads--;
                                if (pendingLoads === 0) {
                                    this._isRefreshing = false;
                                }
                            });
                        }
                    });
                }
            }
        });

        if (pendingLoads === 0) {
            this._isRefreshing = false;
        }
    }

    /**
     * 获取带语言后缀的资源名
     */
    public getLocalizedResourceName(baseName: string): string {
        // 移除已有的语言后缀
        let cleanName = baseName;
        Object.values(LanguageType).forEach(suffix => {
            if (cleanName.endsWith(suffix)) {
                cleanName = cleanName.slice(0, -suffix.length);
            }
        });
        return cleanName + this._currentLanguage;
    }
}
