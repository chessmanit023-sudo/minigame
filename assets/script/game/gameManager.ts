import { _decorator, Component, Node, Collider, Vec3, Color, resources, Prefab, RigidBody, instantiate, MeshRenderer, macro, Material, find, JsonAsset, BoxCollider, game, sys, utils, primitives, PhysicsSystem, Game, assetManager, view, ResolutionPolicy, tween, director } from 'cc';
import { clientEvent } from '../framework/clientEvent';
import { localConfig } from '../framework/localConfig';
import { playerData } from '../framework/playerData';
import { poolManager } from '../framework/poolManager';
import { resourceUtil } from '../framework/resourceUtil';
import { uiManager } from '../framework/uiManager';
import { gameUtils } from './utils/gameUtils';
import { gameConstants } from './utils/gameConstants';
import { fixSkinnedRoleMaterials } from './utils/roleMaterialUtil';
import { util } from '../framework/util';
import { Ai } from './role/ai';
import { AudioManager } from '../framework/audioManager';
import { i18nManager, LANGUAGE_NAMES } from '../framework/i18nManager';
import { loginManager } from '../framework/loginManager';
import { SkyBoxFollow } from './skyBoxFollow';
const { ccclass, property } = _decorator;

const BUILD_PREFAB_UUID_MAP: Record<string, string> = {
    Building_01: 'ecf1b1f6-2041-48ef-b3bf-37af5524277d',
    Building_02: '886533bd-336b-4187-8db1-27381298014e',
    Building_03: '884ea362-5269-47b4-b5a7-88f5f22ff983',
    Building_04: '059c012e-8036-4932-8ba2-38881b80aa21',
    Building_05: '86e6b8ea-0139-452b-92c5-69c4e884c388',
    Building_06: '1b1764b6-84fa-47c0-9f99-942ced2e1fad',
    Cinema_01: 'b5e68ecf-b36e-40e7-97c6-c9c5ea611d18',
    Factory_05: '19b5ab32-d4dd-483a-9656-c0d5a27942e8',
    FireStation_01: '1e652103-10d6-40e3-9d74-af2dadf66310',
    House_04: '36408959-e013-4848-8a8b-c7e382d4be71',
    LuPai_01: 'b59e695b-4cf0-4f32-95ae-e9fa774274a1',
    Mesh_Tree01: '363e2df0-9ae1-4500-9e81-282f9e617dce',
    Mesh_Tree02: '32d0f2c7-9888-4fb2-9df8-fc3c6e888890',
    Mesh_grass04: 'c8a1b1c4-28aa-46a7-9b6d-97bd782639a9',
    Mesh_grass05: '511935f3-bc84-4dff-8d0c-20a9a4f08709',
    PaiZi_01: '2eded2eb-5eaf-49d2-a074-a76c80fb0873',
    SmallHouse_10: 'ffdae34a-606f-436e-8eed-1dcc09f66401',
    SuburbHouse_04: '457e16fe-28b0-4b0c-8182-6eeb61ba6241',
    Yuanjing_07: '21e5e550-6d68-49c8-bc36-cb0a6e40719a',
    house_high_002: '86eeaa45-9bce-4edb-8a17-74d637d33a68',
    house_high_004: 'da7effa1-8040-472e-a5d9-0b6434114399',
    house_purpose_003: 'bf208e26-8f6e-4895-82a7-c1025a8ae6aa',
    house_small_1_010: '671af9ce-8688-4fd5-9e64-a7cb0189b450',
};

// 第二关宝石种类（每种出现 GEM_COUNT_PER_TYPE 次）
const GEM_MODEL_PATHS: string[] = [
    'prefab/model/TripoModels/1',
    'prefab/model/TripoModels/3',
    'prefab/model/TripoModels/6',
    'prefab/model/TripoModels/5',
    'prefab/model/TripoModels/4',
];


//注：————不写Player/Ai类型原因：网页浏览没问题，打包会认为roleBase、Player、GameManager 相互引用报错
@ccclass('GameManager')
export class GameManager extends Component {
    @property(Material)
    matNumList: Array<Material> = []; //数字的材质列表 0-9

    public static pfBrickList: Array<Prefab> = []; //砖块的列表
    public static scriptAiList: Array<any> = []; //ai脚本的存储列表
    public static scriptPlayer: any = null!; //主角脚本
    public static ndBrickFloor: Node = null!; //铺设在地面上的砖块的父节点
    public static canGetBrickList: any = {}; //场景内可以获取的砖块列表
    public static isGameStart: boolean = false;
    public static isWin: boolean = false;
    public static arriveRoadEndNum: number = 0; //到达结束地面人数
    public static ndRoadEnd: Node = null!; //终点地面节点
    public static ndEndReward: Node = null!; //终点地面节点 ————取当前倍数 Number(ndEndReward.children[0].name)
    public static ndRewardCircle: Node = null!; //结尾奖励阶段圆台父节点
    public static isLowPhone: boolean = null!; //是否为低端机
    public static aiSkinList: Array<number> = []; //当前ai可随机皮肤
    public static gemCollectedCount: number = 0; //当前收集的宝石数量
    public static gemTotalCount: number = 10; //当前关卡宝石总数
    public static gemList: Array<Node> = []; //宝石节点列表

    public ndMap: Node = null!; //地图父节点

    @property
    public useSceneStaticBuild: boolean = true; // 建筑是否固定使用场景内节点

    private _cbIdToWaitShowPanel: any = null!;
    private _ndEffectParent: Node = null!; //特效的父节点
    private _mapDataCount: number = 0; //所有待加载物件数量
    private _isLoadRoadNum: number = 0; //当前加载路面数量
    private _isLoadBrickNum: number = 0; //当前砖块数量
    private _isInitAiNum: boolean = false; //是否初始化ai数量
    public static currentLevel: number = 1; //当前关卡
    /** 地图加载完成后默认会弹主界面；从「下一关」进入时需保留游戏界面，由此处跳过一次 */
    public static skipMainPanelAfterMapLoad: boolean = false;

    onLoad() {
        // 跑酷界面使用固定宽度更适合全面屏，避免主界面按钮在窄屏设备上被左右裁切。
        view.setDesignResolutionSize(720, 1280, ResolutionPolicy.FIXED_WIDTH);

        playerData.instance.loadGlobalCache();
        if (!playerData.instance.userId) {
            playerData.instance.generateRandomAccount();
            console.log("###生成随机userId", playerData.instance.userId);
        }

        playerData.instance.loadFromCache();

        if (!playerData.instance.playerInfo || !playerData.instance.playerInfo.createDate) {
            playerData.instance.createPlayerInfo();
        }

        //初始化多语言系统（须在 playerInfo 就绪后）
        i18nManager.instance.init();

        // 音乐/音效开关来自 user_data 字段 musicOn / soundOn
        AudioManager.instance.init();

        //记录离线时间
        game.on(Game.EVENT_HIDE, () => {
            if (!playerData.instance.settings) {
                playerData.instance.settings = {}
            }

            playerData.instance.settings.hideTime = Date.now();
            playerData.instance.saveAll();
        })

        this.getAllHandBrickPre();

        clientEvent.on(gameConstants.CLIENTEVENT_LIST.RESTARTGAME, this._initGame, this);

        this.ndMap = this.node.getChildByName('map')!;
        this._ndEffectParent = find('effectManager')!;
        GameManager.ndRewardCircle = this.node.getChildByName('rewardCircle')!;
        GameManager.ndBrickFloor = this.node.getChildByName('brickFloor')!;

        const ndSkyBox = this.node.parent?.getChildByName('skyBox') ?? find('skyBox');
        if (ndSkyBox && !ndSkyBox.getComponent(SkyBoxFollow)) {
            ndSkyBox.addComponent(SkyBoxFollow);
        }

        this._hideScenePreviewPlayer();
    }

    /**
     * 加载所有砖块预制体
     */
    private getAllHandBrickPre() {
        this._isLoadBrickNum = 0;
        resourceUtil.loadModelRes('brick/brick0').then((prefab: any) => {
            GameManager.pfBrickList[0] = prefab;

            poolManager.instance.prePool(prefab, 40);

            this._isLoadBrickNum++;
            console.log(`[Load] 砖块加载完成: ${this._isLoadBrickNum}/${gameConstants.BRICKSKIN_COUNT}`);

            this.setAllRoleBrickId();
        }).catch((err: any) => {
            console.error('[Load] ❌ 砖块加载失败:', err);
            this._isLoadBrickNum = gameConstants.BRICKSKIN_COUNT; // 强制完成避免卡住
        });
    }

    /**
     * 设置所有人物的砖块id
     */
    private setAllRoleBrickId() {
        if (this._isLoadBrickNum === gameConstants.BRICKSKIN_COUNT && GameManager.scriptPlayer &&
            GameManager.scriptAiList.length === gameConstants.AI_NUM) {
            //目前只有一种砖块
            GameManager.scriptPlayer.brickId = 0;
            for (let i = 0; i < GameManager.scriptAiList.length; i++) {
                GameManager.scriptAiList[i].brickId = 0;
            }
        }
    }

    start() {
        // 进入游戏时输出当前语言
        console.log('[Game] ========== 进入游戏 ==========');
        console.log('[Game] 当前语言后缀:', i18nManager.instance.getCurrentLanguage());
        console.log('[Game] 当前语言代码:', i18nManager.instance.getCurrentLanguageCode());
        console.log('[Game] 当前语言名称:', LANGUAGE_NAMES[i18nManager.instance.getCurrentLanguage()]);
        console.log('[Game] =================================');

        // 初始化微信登录（静默检查本地登录状态）
        loginManager.init();

        //加载CSV相关配置
        localConfig.instance.loadConfig(() => {
            //初始化module.csv 中配置的砖块堆信息
            const moduleTable = localConfig.instance.getTable('module');
            for (let keyName in moduleTable) {
                const nowData = moduleTable[keyName];
                if (nowData.type === gameConstants.CSV_TYPE_BRICKLAYER) {
                    let splitList = nowData.brickLayerData.split('/');
                    for (let i = 0; i < splitList.length; i++) {
                        splitList[i] = Number(splitList[i]);
                    }
                    gameConstants.CSV_BRICK_LAYER_DATA.set(Number(keyName), splitList);
                }
            }

            this._initGame();
        })
    }

    /**
     * 初始化游戏
     */
    private _initGame() {
        GameManager.arriveRoadEndNum = 0;
        GameManager.isGameStart = false;
        GameManager.isWin = false;
        GameManager.canGetBrickList = {};
        GameManager.ndBrickFloor.destroyAllChildren();

        // 初始化宝石收集数据
        GameManager.gemCollectedCount = 0;
        GameManager.gemTotalCount = 0;
        GameManager.gemList = [];

        const playerSkinId = playerData.instance.playerInfo['roleSkinId'];
        GameManager.aiSkinList.length = 0;
        for (let j = 0; j < gameConstants.SKIN_ID_LIST.length; j++) {
            const checkSkin = gameConstants.SKIN_ID_LIST[j];
            if (playerSkinId === checkSkin) continue;
            GameManager.aiSkinList.push(checkSkin);
        }

        let level = Number(playerData.instance.playerInfo['level']) || 1;
        if (level < 1) {
            level = 1;
        } else if (level > gameConstants.MAX_LEVEL_NUM) {
            level = gameConstants.MAX_LEVEL_NUM;
        }
        GameManager.currentLevel = level; // 记录当前关卡
        this._loadMap(level);

        while (this._ndEffectParent.children.length > 0) {
            poolManager.instance.putNode(this._ndEffectParent.children[0]);
        }

        if (!GameManager.scriptPlayer) {
            const ndPlayer = new Node('player');
            ndPlayer.mobility = 2;
            ndPlayer.parent = this.node;

            GameManager.scriptPlayer = ndPlayer.addComponent('Player')!;
            GameManager.scriptPlayer.createPlayer();
        } else {
            GameManager.scriptPlayer.node.mobility = 2;
        }
        this._hideScenePreviewPlayer();
        GameManager.scriptPlayer.initPlayer();
        clientEvent.dispatchEvent(gameConstants.CLIENTEVENT_LIST.CHANGECAMERATYPE, gameConstants.CAMERA_TYPE_LIST.READY);

        if (!this._isInitAiNum && util.checkIsLowPhone()) {
            gameConstants.AI_NUM = 2;
            this._isInitAiNum = true;
        }

        const aiNum = gameConstants.AI_NUM;
        const aiWayPath = gameConstants.AIWAY_PATH_IN_RESOURCES + '/' + gameConstants.AIWAY_NAME + level;
        resourceUtil.loadRes(aiWayPath, JsonAsset, (err: any, data: any) => {
            if (err || !data?.json) {
                console.error('load aiWay error:', aiWayPath, err);
                return;
            }

            const playerBezierData = JSON.parse(JSON.stringify(data.json));
            for (const key in playerBezierData) {
                const nowData = playerBezierData[key];
                if (!nowData?.nextIdList || nowData.nextIdList.length <= 1) continue;
                nowData.nextIdList = [nowData.nextIdList[0]];
            }
            gameUtils.getBezierCalculateList(
                playerBezierData,
                0,
                gameUtils.getAiDataToBezierList(gameConstants.PLAYER_SPAWN_POS.clone()),
                (bezierList: any) => {
                    GameManager.scriptPlayer?.initTrackPath(bezierList);
                }
            );

            if (GameManager.scriptAiList.length === gameConstants.AI_NUM) {
                for (let i = 1; i < aiNum + 1; i++) {
                    this.loadAiBezier(
                        data.json,
                        gameConstants.AI_INIT_POS_LIST.get(i) || new Vec3(-100, 0, 0),
                        (bezierList: any) => {
                            GameManager.scriptAiList[i - 1].initAi(i, bezierList);
                        })

                    if (i === aiNum) {
                        this.setAllRoleBrickId();
                    }
                }
            } else {
                for (let i = 1; i < aiNum + 1; i++) {
                    this.loadAiBezier(
                        data.json,
                        gameConstants.AI_INIT_POS_LIST.get(i) || new Vec3(-100, 0, 0),
                        (bezierList: any) => {
                            const ndAi = new Node('ai' + i);
                            ndAi.parent = this.node;

                            //同player脚本不定义一样 会有脚本之间互相引用报错问题
                            const scriptsAi = ndAi.addComponent('Ai')! as Ai;
                            scriptsAi.createAi(i, bezierList);
                        })

                    if (i === aiNum) {
                        this.setAllRoleBrickId();
                    }
                }
            }
        })

    }

    /**
     * 加载ai贝塞尔数据
     * @param data 
     * @param aiInitPosData 
     * @param cb 
     */
    private loadAiBezier(data: any, aiInitPosData: Vec3, cb: any) {
        gameUtils.getBezierCalculateList(
            data,
            aiInitPosData.x,
            gameUtils.getAiDataToBezierList(aiInitPosData),
            cb
        )
    }

    /**
     * 加载当前关卡地图
     */
    private _loadMap(level: number) {
        const mapData = localConfig.instance.getTable('map' + level);

        this._clearDynamicMapChildren();

        this._isLoadRoadNum = 0;
        this._mapDataCount = 0;
        const level1BombItems: any[] = [];
        for (let i in mapData) {
            let itemData = mapData[i];
            const itemName = Number(itemData.name);
            if (itemName > gameConstants.CSV_MAP_ITEM_RANGE.BRICK_LAYER[0] &&
                itemName < gameConstants.CSV_MAP_ITEM_RANGE.BRICK_LAYER[1]) {
                resourceUtil.loadModelRes('brick/brickInRoad').then((prefab: any) => {
                    this._spawnBrickLayer(prefab as Prefab, itemName, {
                        position: gameUtils.setStringToVec3(itemData.position),
                        eulX: Number(itemData.eulX || 0),
                        eulY: Number(itemData.eulY || 0),
                        eulZ: Number(itemData.eulZ || 0),
                    });
                }).catch((err: any) => {
                    console.error('brickInRoad load failed:', itemName, err);
                });
            } else if (itemName > gameConstants.CSV_MAP_ITEM_RANGE.ROAD[0] &&
                itemName < gameConstants.CSV_MAP_ITEM_RANGE.ROAD[1]) {
                this._mapDataCount++;
                this._loadRoad(itemData);
            } else if (this._getBuildPrefabUuid(itemData)) {
                if (this.useSceneStaticBuild) {
                    continue;
                }
                this._mapDataCount++;
                this._loadBuild(itemData);
            } else if (itemName > gameConstants.CSV_MAP_ITEM_RANGE.BOMB[0] &&
                itemName < gameConstants.CSV_MAP_ITEM_RANGE.BOMB[1]) {
                this._mapDataCount++;
                if (level === 1) {
                    level1BombItems.push(itemData);
                }
                this._loadBomb(itemData);
            } else {
                console.error('error getPrePath:', itemName);
            }
        }

        if (level === 1 && level1BombItems.length > 0) {
            this._spawnLevel1BombRoadBricks(level1BombItems);
        }
    }

    /** 第一关：在每条有炸弹的路段跑道中心放置可拾取品牌积木 */
    private _spawnLevel1BombRoadBricks(bombItems: any[]) {
        resourceUtil.loadModelRes('brick/brickInRoad').then((prefab: any) => {
            const offsetZ = gameConstants.LEVEL1_BOMB_ROAD_BRICK_OFFSET_Z;
            const eul = new Vec3(0, 0, 0);
            for (let i = 0; i < bombItems.length; i++) {
                const bombPos = gameUtils.setStringToVec3(bombItems[i].position);
                // 跑道中心 x=0，沿直道方向 eulY=0，单块积木避免横向扩散出界
                const pos = new Vec3(0, bombPos.y, bombPos.z + offsetZ);
                this._loadBrick(prefab as Prefab, pos, eul);
            }
        }).catch((err: any) => {
            console.error('[Level1] bomb road brick load failed:', err);
        });
    }

    /** 按 module 配置在指定位置生成品牌积木堆（可拾取） */
    private _spawnBrickLayer(
        prefab: Prefab,
        layerId: number,
        itemData: { position: Vec3; eulX: number; eulY: number; eulZ: number },
    ) {
        const brickLayerData = gameConstants.CSV_BRICK_LAYER_DATA.get(layerId) as Array<number>;
        if (!brickLayerData) {
            console.error('error brickLayer:', layerId);
            return;
        }

        const nowEul = new Vec3(itemData.eulX, itemData.eulY, itemData.eulZ);
        const nowPos = itemData.position.clone();
        let nowMul = 0;
        let eulRad = nowEul.y * macro.RAD;
        const addX1 = gameUtils.getDirectionOfDistanceX(gameConstants.BRICK_LAYER_ONCE_Z, eulRad);
        const addZ1 = gameUtils.getDirectionOfDistanceZ(gameConstants.BRICK_LAYER_ONCE_Z, eulRad);
        eulRad = (180 + nowEul.y) * macro.RAD;
        const addX2 = gameUtils.getDirectionOfDistanceX(gameConstants.BRICK_LAYER_ONCE_Z, eulRad);
        const addZ2 = gameUtils.getDirectionOfDistanceZ(gameConstants.BRICK_LAYER_ONCE_Z, eulRad);

        for (let j = 0; j < brickLayerData.length; j++) {
            nowMul = 0;
            const nowCount = brickLayerData[j];
            let brickCount = 0;
            const nowY = j * gameConstants.BRICK_LAYER_ONCE_Y;
            if (nowCount % 2 === 0) {
                nowMul = 0.5;
            } else {
                this._loadBrick(prefab, nowPos.clone().add3f(0, nowY, 0), nowEul);
                brickCount++;
                nowMul = 1;
            }
            while (brickCount < nowCount) {
                this._loadBrick(prefab, nowPos.clone().add3f(addX1 * nowMul, nowY, addZ1 * nowMul), nowEul);
                this._loadBrick(prefab, nowPos.clone().add3f(addX2 * nowMul, nowY, addZ2 * nowMul), nowEul);
                nowMul += 1;
                brickCount += 2;
            }
        }
    }

    private _clearDynamicMapChildren() {
        const staticBuildRoot = this.ndMap.getChildByName('staticBuild');
        for (let i = this.ndMap.children.length - 1; i >= 0; i--) {
            const child = this.ndMap.children[i];
            if (child === staticBuildRoot) continue;
            poolManager.instance.putNode(child);
        }
    }

    private _loadBuild(itemData: any) {
        const prefabUuid = this._getBuildPrefabUuid(itemData);
        if (!prefabUuid) {
            console.error('error build prefab uuid:', itemData.name);
            this._isLoadRoadNum++; // 计数器递增
            this._checkLoadFinish();
            return;
        }

        assetManager.loadAny(prefabUuid, (err: any, prefab: Prefab) => {
            this._isLoadRoadNum++;
            if (err || !prefab) {
                console.error('build load failed', itemData.name, err);
                this._checkLoadFinish();
                return;
            }

            const ndItem = instantiate(prefab) as Node;
            ndItem.parent = this.ndMap;
            ndItem.name = itemData.name;
            ndItem.position = gameUtils.setStringToVec3(itemData.position);
            ndItem.scale = gameUtils.setStringToVec3(itemData.scale);
            const eulX = Number(itemData.eulX || 0);
            const eulY = Number(itemData.eulY || 0);
            const eulZ = Number(itemData.eulZ || 0);
            ndItem.eulerAngles = new Vec3(eulX, eulY, eulZ);
            console.log(`Load build ${itemData.name}: rotation=(${eulX},${eulY},${eulZ})`);
            this._checkLoadFinish();
        });
    }

    private _getBuildPrefabUuid(itemData: any) {
        const prefabUuid = itemData?.prefabUuid;
        if (prefabUuid) {
            return prefabUuid;
        }

        const itemName = itemData?.name;
        if (!itemName) return '';
        if (BUILD_PREFAB_UUID_MAP[itemName]) {
            return BUILD_PREFAB_UUID_MAP[itemName];
        }

        return '';
    }

    /**
     * 加载炸弹（使用 resources 下预制体，避免旧版 FBX 子资源 UUID 在预览服 404）
     */
    private _loadBomb(itemData: any) {
        resourceUtil.loadModelRes('boom/bomb').then((prefab) => {
            const p = prefab as Prefab;
            this._isLoadRoadNum++;

            const ndBomb = instantiate(p) as Node;
            ndBomb.parent = this.ndMap;
            ndBomb.name = gameConstants.CSV_MAP_ITEM_NAME.BOMB;
            ndBomb.position = gameUtils.setStringToVec3(itemData.position);
            ndBomb.scale = new Vec3(0.3, 0.3, 0.3);
            const bombEulY = Number(itemData.eulY || 0);
            ndBomb.eulerAngles = new Vec3(0, bombEulY, 0);
            console.log(`Load bomb: rotationY=${bombEulY}`);

            const rb = ndBomb.addComponent(RigidBody);
            rb.type = RigidBody.Type.STATIC;
            rb.setGroup(gameConstants.COLLIDER_GROUP_LIST.FLOOR);
            const collider = ndBomb.addComponent(BoxCollider);
            collider.size = new Vec3(0.5, 0.5, 0.5);
            collider.center = new Vec3(0, 0.25, 0);
            collider.isTrigger = false;
            collider.setGroup(gameConstants.COLLIDER_GROUP_LIST.FLOOR);
            collider.setMask(gameUtils.getAiAndPlayerGroup());

            this._checkLoadFinish();
        }).catch((err: any) => {
            this._isLoadRoadNum++;
            console.error('bomb prefab load failed:', err);
            this._checkLoadFinish();
        });
    }

    /**
     * 加载路面上的砖块
     * @param brickPre 
     * @param pos 
     * @param eul 
     */
    private _loadBrick(brickPre: Prefab, pos: Vec3, eul: Vec3) {
        const ndNowBrick = poolManager.instance.getNode(brickPre, this.ndMap) as Node;
        ndNowBrick.setPosition(pos);
        ndNowBrick.setRotationFromEuler(eul);
        const brickSize = gameConstants.BRICK_ONCE_SIZE_DOWN_INIT;
        ndNowBrick.setScale(new Vec3(brickSize, brickSize, brickSize));

        let nowRow = gameUtils.checkNowBrickIndex(pos.z);
        if (!GameManager.canGetBrickList[nowRow]) {
            GameManager.canGetBrickList[nowRow] = [];
        }
        GameManager.canGetBrickList[nowRow].push(ndNowBrick);
    }

    /**
     * 加载路面
     * @param itemData 
     */
    private _loadRoad(itemData: any) {
        resourceUtil.loadModelRes('road/' + itemData.name).then((prefab: any) => {
            this._isLoadRoadNum++;
            const ndItem = poolManager.instance.getNode(prefab, this.ndMap) as Node;
            ndItem.position = gameUtils.setStringToVec3(itemData.position);
            ndItem.scale = gameUtils.setStringToVec3(itemData.scale);
            const eulX = Number(itemData.eulX || 0);
            const eulY = Number(itemData.eulY || 0);
            const eulZ = Number(itemData.eulZ || 0);
            ndItem.eulerAngles = new Vec3(eulX, eulY, eulZ);
            console.log(`Load road ${itemData.name}: rotation=(${eulX},${eulY},${eulZ})`);

            if (ndItem.name === gameConstants.CSV_MAP_ITEM_NAME.ROAD_END) {
                //结尾地面需要镜头等特殊处理，因此记录该节点
                GameManager.ndRoadEnd = ndItem;
                GameManager.ndEndReward = ndItem;

                //终点线的碰撞体
                const colliderFinishLine = ndItem.getChildByName(gameConstants.CSV_MAP_ITEM_NAME.FINISH_LINE)!.getComponent(Collider)!;
                colliderFinishLine.setGroup(gameConstants.COLLIDER_GROUP_LIST.FLOOR);
                colliderFinishLine.setMask(gameUtils.getAiAndPlayerGroup());
            }

            //设置地板的 分组，掩码
            let colliderList = ndItem.getComponents(Collider)!;
            for (let j = 0; j < colliderList.length; j++) {
                colliderList[j].setGroup(gameConstants.COLLIDER_GROUP_LIST.FLOOR);
                colliderList[j].setMask(gameUtils.getAiAndPlayerGroup());
            }

            this._checkLoadFinish();
        }).catch((err: any) => {
            console.error('road load failed:', itemData.name, err);
            this._isLoadRoadNum++; // 失败也要递增计数器
            this._checkLoadFinish();
        });
    }

    /**
     * 地图块是否可作为宝石随机落点（含第二关大量使用的 2001–2003 路面预制编号）
     */
    private _isGemSpawnMapName(itemName: number): boolean {
        const r = gameConstants.CSV_MAP_ITEM_RANGE.ROAD;
        if (itemName > r[0] && itemName < r[1]) {
            return true;
        }
        // map2.csv 等：主跑道行走面多在 BRICK_LAYER 区间内的 2001/2002/2003，旧逻辑仅扫 1xxx 会漏掉整段路导致宝石落在少数支路块上
        return itemName >= 2001 && itemName <= 2003;
    }

    /** 终点地面、奖励地面不参与随机点（终点宝石单独放置） */
    private _excludeFromGemRandomPool(nameStr: string): boolean {
        const n = gameConstants.CSV_MAP_ITEM_NAME;
        return nameStr === n.ROAD_END || nameStr === n.ROAD_END_REWARD;
    }

    /**
     * 在起始直道各路面点连成的折线上按 t∈[0,1] 插值，Z 随前进方向连续变化（不是单格固定 Z）
     */
    private _interpolateStraightRoad(
        straightRoad: Array<{ x: number; y: number; z: number }>,
        t: number
    ): { x: number; y: number; z: number } {
        const len = straightRoad.length;
        if (len === 0) {
            return { x: 0, y: 0, z: 0 };
        }
        if (len === 1) {
            const p = straightRoad[0];
            return { x: p.x, y: p.y, z: p.z };
        }
        const tClamped = Math.max(0, Math.min(1, t));
        const idxFloat = tClamped * (len - 1);
        const i0 = Math.floor(idxFloat);
        const i1 = Math.min(len - 1, i0 + 1);
        const lr = idxFloat - i0;
        const p0 = straightRoad[i0];
        const p1 = straightRoad[i1];
        return {
            x: p0.x + (p1.x - p0.x) * lr,
            y: p0.y + (p1.y - p0.y) * lr,
            z: p0.z + (p1.z - p0.z) * lr,
        };
    }

    /**
     * 构建宝石模型队列：每种模型各出现 GEM_COUNT_PER_TYPE 次，并打乱顺序
     */
    private _buildGemModelPathQueue(): string[] {
        const perType = gameConstants.GEM_COUNT_PER_TYPE;
        const queue: string[] = [];
        for (let i = 0; i < GEM_MODEL_PATHS.length; i++) {
            for (let j = 0; j < perType; j++) {
                queue.push(GEM_MODEL_PATHS[i]);
            }
        }
        for (let i = queue.length - 1; i > 0; i--) {
            const r = Math.floor(Math.random() * (i + 1));
            const tmp = queue[i];
            queue[i] = queue[r];
            queue[r] = tmp;
        }
        return queue;
    }

    /**
     * 生成宝石（第二关专用）
     * 全部 GEM_COUNT_LEVEL2 颗均落在开局一段「起始直道」上：位置在路面折线上插值，Z/X 均有轻微随机，避免叠在同一格看起来像少一颗
     */
    private _generateGems() {
        console.log('[Gem] ========== 开始生成第二关宝石 ==========');
        
        const gemCount = GEM_MODEL_PATHS.length * gameConstants.GEM_COUNT_PER_TYPE;
        GameManager.gemTotalCount = gemCount;
        GameManager.gemCollectedCount = 0;
        GameManager.gemList = [];

        console.log(`[Gem] 目标生成数量: ${gemCount}`);

        // 获取地图数据中的路面位置
        let currentLevel = playerData.instance.playerInfo['level'] || 1;
        console.log(`[Gem] 当前关卡: ${currentLevel}`);

        if(currentLevel>gameConstants.GEM_REWARD_LEVEL){
            currentLevel = Number(gameConstants.GEM_REWARD_LEVEL);
        }
        
        const mapData = localConfig.instance.getTable('map' + currentLevel);
        console.log(`[Gem] 地图数据: map${currentLevel}, 数据条数: ${Object.keys(mapData).length}`);
        
        const roadPositions: Array<{x: number, y: number, z: number}> = [];

        for (let key in mapData) {
            const itemData = mapData[key];
            const nameStr = String(itemData.name);

            const itemName = Number(itemData.name);
            if (!this._isGemSpawnMapName(itemName)) {
                continue;
            }
            if (this._excludeFromGemRandomPool(nameStr)) {
                continue;
            }

            const pos = gameUtils.setStringToVec3(itemData.position);
            roadPositions.push({ x: pos.x, y: pos.y, z: pos.z });
        }

        // 沿跑道前进方向排序（本关沿 Z 负向推进：起点 Z 较大 → 终点 Z 较小）
        roadPositions.sort((a, b) => b.z - a.z);

        console.log(`[Gem] 候选路面位置 ${roadPositions.length} 个（含 2001–2003 路段）`);

        /** 跳过出发线身后前几块路面 */
        const SKIP_FIRST_ROADS = 2;
        /** 仅在此数量的靠前路面内排布宝石（起始直道） */
        const GEM_START_STRAIGHT_MAX_TILES = 22;
        /** X 轴轻微随机 */
        const GEM_X_JITTER = 0.55;
        /** Z 轴轻微随机（与插值后的基准 Z 叠加，不是整条路同一个固定 Z） */
        const GEM_Z_JITTER = 0.22;
        /** 仅一块路面时沿前进方向（Z 递减）人工拉开间距 */
        const GEM_SINGLE_TILE_Z_STEP = 1.1;
        /** 整体向起始点（Z 较大侧）靠拢：插值参数 t 乘该系数，越小越靠近出生线 */
        const GEM_CLUSTER_TOWARD_START = 0.62;

        const usableAfterSkip = roadPositions.length > SKIP_FIRST_ROADS
            ? roadPositions.slice(SKIP_FIRST_ROADS)
            : roadPositions.slice();

        let straightRoad = usableAfterSkip.slice(0, Math.min(GEM_START_STRAIGHT_MAX_TILES, usableAfterSkip.length));
        if (straightRoad.length === 0 && roadPositions.length > 0) {
            straightRoad = roadPositions.slice(0, Math.min(GEM_START_STRAIGHT_MAX_TILES, roadPositions.length));
            console.log('[Gem] 路面较少，直道采样包含出发线附近路面');
        }

        console.log(
            `[Gem] 起始直道采样: 最多${GEM_START_STRAIGHT_MAX_TILES}块、实际${straightRoad.length}块，` +
                `X±${(GEM_X_JITTER / 2).toFixed(2)} Z±${(GEM_Z_JITTER / 2).toFixed(2)}（在折线插值基准上叠加）`
        );

        const gemPositions: { x: number; y: number; z: number }[] = [];

        if (gemCount === 1 && straightRoad.length > 0) {
            const p =
                straightRoad.length === 1
                    ? straightRoad[0]
                    : this._interpolateStraightRoad(straightRoad, 0.5 * GEM_CLUSTER_TOWARD_START);
            gemPositions.push({
                x: p.x + (Math.random() - 0.5) * GEM_X_JITTER,
                y: p.y + 0.15,
                z: p.z + (Math.random() - 0.5) * GEM_Z_JITTER,
            });
        } else if (straightRoad.length === 0) {
            console.warn('[Gem] ⚠️ 没有路面数据，无法生成宝石');
            GameManager.gemTotalCount = 0;
        } else if (straightRoad.length === 1) {
            const p = straightRoad[0];
            const step = GEM_SINGLE_TILE_Z_STEP * GEM_CLUSTER_TOWARD_START;
            for (let i = 0; i < gemCount; i++) {
                gemPositions.push({
                    x: p.x + (Math.random() - 0.5) * GEM_X_JITTER,
                    y: p.y + 0.15,
                    z: p.z - i * step + (Math.random() - 0.5) * GEM_Z_JITTER,
                });
            }
        } else {
            // (i+0.5)/gemCount 再乘 GEM_CLUSTER_TOWARD_START：整体靠近起始点（t→0 为跑道起点侧）
            for (let i = 0; i < gemCount; i++) {
                const t = ((i + 0.5) / gemCount) * GEM_CLUSTER_TOWARD_START;
                const p = this._interpolateStraightRoad(straightRoad, t);
                gemPositions.push({
                    x: p.x + (Math.random() - 0.5) * GEM_X_JITTER,
                    y: p.y + 0.15,
                    z: p.z + (Math.random() - 0.5) * GEM_Z_JITTER,
                });
            }
        }

        const maxGems = gemPositions.length;
        if (maxGems !== gemCount && maxGems > 0) {
            console.warn(`[Gem] ⚠️ 位置数 ${maxGems} 与目标 ${gemCount} 不一致，已按实际生成`);
            GameManager.gemTotalCount = maxGems;
        }

        if (maxGems === 0) {
            console.error('[Gem] ❌ 未生成任何宝石');
            return;
        }

        console.log(`[Gem] 最终 ${gemPositions.length} 个坐标（均在起始直道），开始生成宝石`);

        const gemModelQueue = this._buildGemModelPathQueue();

        for (let i = 0; i < maxGems; i++) {
            const pos = gemPositions[i];

            const gemPath = gemModelQueue[i] ?? GEM_MODEL_PATHS[i % GEM_MODEL_PATHS.length];
            console.log(`[Gem] 加载宝石模型 ${i + 1}, 路径: ${gemPath}`);

            // 使用 resources.loadDir 加载文件夹中的 Prefab
            resources.loadDir(gemPath, Prefab, (err, prefabs) => {
                if (err || !prefabs || prefabs.length === 0) {
                    console.error(`[Gem] 宝石模型 ${i} 加载失败:`, err);
                    return;
                }

                // 使用第一个加载的 Prefab
                const prefab = prefabs[0];
                console.log(`[Gem] 从 ${gemPath} 加载到 ${prefabs.length} 个 prefab，使用: ${prefab.name}`);

                // 创建宝石节点
                const gem = instantiate(prefab) as Node;
                gem.name = `${gameConstants.CSV_MAP_ITEM_NAME.GEM}_${i}`;
                gem.parent = this.ndMap;

                // 设置位置（贴近地面）
                gem.position = new Vec3(pos.x, pos.y + 0.05, pos.z);

                // 设置缩放
                gem.scale = new Vec3(0.15, 0.15, 0.15);

                // 添加碰撞器
                let collider = gem.getComponent(BoxCollider);
                if (!collider) {
                    collider = gem.addComponent(BoxCollider);
                    collider.size = new Vec3(0.3, 0.3, 0.3);
                    collider.center = new Vec3(0, 0.15, 0);
                }
                collider.isTrigger = true;
                collider.setGroup(gameConstants.COLLIDER_GROUP_LIST.FLOOR);
                collider.setMask(gameConstants.COLLIDER_GROUP_LIST.PLAYER);

                // 添加刚体
                let rb = gem.getComponent(RigidBody);
                if (!rb) {
                    rb = gem.addComponent(RigidBody);
                }
                rb.type = RigidBody.Type.STATIC;
                rb.setGroup(gameConstants.COLLIDER_GROUP_LIST.FLOOR);
                rb.setMask(gameConstants.COLLIDER_GROUP_LIST.PLAYER);

                // 添加旋转动画
                this._addSimpleGemAnimation(gem, i);

                GameManager.gemList.push(gem);
                console.log(`[Gem] 生成宝石 ${i + 1}/${maxGems} 成功`);
            });
        }
        
        console.log(`[Gem] ✅ 第二关宝石生成完成，共 ${GameManager.gemList.length} 个`);
        console.log('[Gem] ========== 宝石生成结束 ==========');
    }

    /**
     * 简单的宝石旋转动画 - 使用rotateBy避免每帧回调
     */
    private _addSimpleGemAnimation(gem: Node, index: number) {
        tween(gem)
            .by(3, { eulerAngles: new Vec3(0, 360, 0) })
            .repeatForever()
            .start();
    }

    /**
     * 隐藏场景内仅用于编辑器预览的 player/girl0 节点（与运行时动态创建的 player 无关）
     */
    private _hideScenePreviewPlayer() {
        const scene = director.getScene();
        if (!scene) {
            return;
        }
        const runtimePlayer = GameManager.scriptPlayer?.node;
        const previewPlayer = scene.getChildByName('player');
        if (previewPlayer && previewPlayer !== runtimePlayer) {
            previewPlayer.active = false;
            previewPlayer.children.forEach((child) => {
                child.active = false;
            });
        }
    }

    /**
     * 为场景中所有蒙皮网格创建独立材质实例，避免 USE_INSTANCING 共享材质导致渲染异常
     */
    private _ensureSkinnedMaterialInstances(root: Node) {
        fixSkinnedRoleMaterials(root);
    }

    /**
     * 判断是否加载地图完毕
     */
    private _checkLoadFinish() {
        console.log(`[Load] 检查加载完成: ${this._isLoadRoadNum}/${this._mapDataCount}`);
        if (this._isLoadRoadNum === this._mapDataCount) {
            console.log('[Load] ✅ 地图加载完成');
            this._ensureSkinnedMaterialInstances(this.node);
            this.initEndRewardCircle();

            // 大于等于第二关，生成宝石
            if (GameManager.currentLevel >= gameConstants.GEM_REWARD_LEVEL) {
                this._generateGems();
            }

            this._cbIdToWaitShowPanel = setInterval(() => {
                if (this._isLoadBrickNum !== gameConstants.BRICKSKIN_COUNT) return;

                //低端机判断
                if (GameManager.isLowPhone === null && util.checkIsLowPhone()) {
                    GameManager.isLowPhone = true;
                    game.setFrameRate(40);
                }

                if (this._cbIdToWaitShowPanel) {
                    clearInterval(this._cbIdToWaitShowPanel);
                    this._cbIdToWaitShowPanel = null!;
                }
                if (GameManager.skipMainPanelAfterMapLoad) {
                    GameManager.skipMainPanelAfterMapLoad = false;
                } else {
                    uiManager.instance.showDialog(gameConstants.PANEL_PATH.MAIN_PANEL);
                }
            }, 50);
        }
    }

    /**
     * 初始化结束的奖励倍数
     */
    public initEndRewardCircle() {
        if (GameManager.ndRewardCircle.children.length === gameConstants.REWARD_CIRCLR_COUNT - 1) {
            this.reSetEndRewardCircle();
        } else {
            //x2开始 结尾地板算x1
            resourceUtil.loadModelRes('road/' + gameConstants.CSV_MAP_ITEM_NAME.ROAD_END_REWARD).then((prefab: any) => {
                for (let i = 1; i < gameConstants.REWARD_CIRCLR_COUNT; i++) {
                    const ndEndCircle = poolManager.instance.getNode(prefab, GameManager.ndRewardCircle) as Node;

                    //同样设置分组
                    let colliderList = ndEndCircle.getComponents(Collider)!;
                    for (let j = 0; j < colliderList.length; j++) {
                        colliderList[j].setGroup(gameConstants.COLLIDER_GROUP_LIST.FLOOR);
                        colliderList[j].setMask(gameConstants.COLLIDER_GROUP_LIST.PLAYER);
                    }

                    if (i + 1 > 9) {
                        let nowPos = new Vec3();
                        nowPos.set(-0.37, 0.01, 0);
                        ndEndCircle.children[1].setPosition(nowPos); //第一个子节点为乘号

                        const ndNum = ndEndCircle.children[2]; //第二个子节点为数字 10以上的十位数位数
                        // x10 及以上时，十位固定为 1（与 mapLoader 生成逻辑保持一致）
                        ndNum?.getComponent(MeshRenderer)?.setMaterial(this.matNumList[1], 0);
                        nowPos.set(0.01, 0.01, 0);
                        ndNum?.setPosition(nowPos);

                        const ndNewNum = instantiate(ndNum); //10以上的个位数
                        ndNewNum.parent = ndEndCircle;
                        nowPos.set(0.4, 0.01, 0);
                        ndNewNum.setPosition(nowPos);
                        ndNewNum.getComponent(MeshRenderer)!.setMaterial(this.matNumList[i - 10 + 1], 0);
                    } else {
                        const ndNum = ndEndCircle.children[2]; //第二个子节点为数字 10以上的十位数位数
                        ndNum.getComponent(MeshRenderer)!.setMaterial(this.matNumList[i + 1], 0);
                    }

                    //将第一个节点的名字改为当前倍数编号 取倍数编号直接取当前节点名称
                    ndEndCircle.children[0].name = (i + 1).toString(); //通过读取这个节点->name 确定当前所在倍数地面的倍数

                    if (i === gameConstants.REWARD_CIRCLR_COUNT - 1) {
                        //最后一个特殊处理 大小
                        const endScaleNum = gameConstants.REWARD_LAST_SCALE_NUM;
                        const nowScale = ndEndCircle.getScale();
                        nowScale.x = endScaleNum;
                        nowScale.z = endScaleNum;
                        ndEndCircle.setScale(nowScale);

                        //在设置完所有节点的分组之前隐藏，则会报错
                        //并且初始化所有的坐标
                        this.reSetEndRewardCircle();
                    }
                }
            })
        }
    }

    /**
     * 重制奖励倍数圆台的坐标
     */
    private reSetEndRewardCircle() {
        GameManager.ndRewardCircle.active = false;

        const addEulRad = GameManager.ndRoadEnd.eulerAngles.y * macro.RAD; //当前角度朝向
        let startPos = GameManager.ndRoadEnd.getPosition(); //记录上一个节点的位置（总是在终点的正前方的节点，方便计算下一个节点的随机值）
        startPos.subtract3f( //由于终点的锚点存在偏差 因此先计算出终点的具体坐标
            gameUtils.getDirectionOfDistanceX(gameConstants.REWARD_START_TRANSVERSE, addEulRad),
            0,
            gameUtils.getDirectionOfDistanceZ(gameConstants.REWARD_START_TRANSVERSE, addEulRad)
        )

        let interval = gameConstants.REWARD_SIZE + 0;
        let pos = new Vec3();
        let eul = GameManager.ndRoadEnd.eulerAngles.clone();
        const getRandomLongitudinal = () => { //纵向随机值——仅允许终点往后 因此随机值只存在正数
            return interval + gameUtils.getRandomRange(gameConstants.REWARD_LONGITUDINAL_RANGE_HALF);
        }
        const getRandomTransverse = () => {//横向随机值——存在左右区间的可能性 所以 随机值允许正负类型数值
            return gameUtils.getRandomRange(gameConstants.REWARD_TRANSVERSE_RANGE_HALF, true);
        }
        for (let i = 1; i < gameConstants.REWARD_CIRCLR_COUNT; i++) {
            let ndItem = GameManager.ndRewardCircle.children[i - 1];

            if (i === gameConstants.REWARD_CIRCLR_COUNT - 1) { //最后一个地面大小不一样 因此间隔不一样
                interval += gameConstants.REWARD_LAST_SCALE_NUM / 2;
            }

            //往终点的正前朝向 计算出当前相对于终点往后的每个倍数台的纵向坐标
            let randomX = gameUtils.getDirectionOfDistanceX(getRandomLongitudinal(), addEulRad);
            let randomZ = gameUtils.getDirectionOfDistanceZ(getRandomLongitudinal(), addEulRad);

            startPos.x -= randomX;
            startPos.z -= randomZ;

            pos.set(startPos);

            if (i === gameConstants.REWARD_CIRCLR_COUNT - 1) {
                //最后一个特殊处理
                ndItem.setPosition(pos);
                ndItem.setRotationFromEuler(eul);
            } else {
                //往终点的正前的垂直角度（+-90度都可）   计算出当前相对于终点往后的每个倍数台的横向坐标
                const nextEulRad = (GameManager.ndRoadEnd.eulerAngles.y + 90) * macro.RAD
                let offsetTransverseX = gameUtils.getDirectionOfDistanceX(getRandomTransverse(), nextEulRad)
                let offsetTransverseZ = gameUtils.getDirectionOfDistanceZ(getRandomTransverse(), nextEulRad)

                pos.add3f(offsetTransverseX, 0, offsetTransverseZ);
                ndItem.setPosition(pos);
                ndItem.setRotationFromEuler(eul);
            }
        }
    }
}