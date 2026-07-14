"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAfterBuild = exports.throwError = void 0;
const mfs_1 = require("./mfs");
const constant_1 = require("./constant");
exports.throwError = true;
const ModeType = {
    EXACT_FIT: 0,
    FIXED_WIDTH: 1,
    FIXED_HEIGHT: 2,
    NO_BORDER: 3,
    SHOW_ALL: 4,
    NONE: 5
};
const onAfterBuild = async function (options, result) {
    const { platform, packages } = options;
    const { dest } = result;
    if ('web-mobile' !== platform) {
        return;
    }
    dealHtml(platform, dest, packages['web-adapter']);
};
exports.onAfterBuild = onAfterBuild;
const dealHtml = async function (platform, dest, params) {
    if (!params.open) {
        return;
    }
    console.info(constant_1.PACKAGE_NAME, '网页适配开始');
    (0, mfs_1.copySync)((0, mfs_1.join)(__dirname, '..', 'static', 'web', 'splash2.png'), (0, mfs_1.join)(dest, 'splash2.png'));
    let pcSideImageFile = '';
    const pcSideImagePath = params.pcSideImage && String(params.pcSideImage).trim();
    if (pcSideImagePath && (0, mfs_1.existsSync)(pcSideImagePath)) {
        const ext = (0, mfs_1.extname)(pcSideImagePath) || '.png';
        pcSideImageFile = `pc-side-image${ext}`;
        (0, mfs_1.copySync)(pcSideImagePath, (0, mfs_1.join)(dest, pcSideImageFile));
    }
    else if (pcSideImagePath) {
        console.warn(constant_1.PACKAGE_NAME, 'PC侧边图片不存在:', pcSideImagePath);
    }
    const showPcSideImage = params.pcSideImageShow !== false;
    let pcSideImagePercent = Number(params.pcSideImagePercent);
    if (isNaN(pcSideImagePercent) || pcSideImagePercent <= 0) {
        pcSideImagePercent = 100;
    }
    else if (pcSideImagePercent > 200) {
        pcSideImagePercent = 200;
    }
    const hasPcSideImage = !!pcSideImageFile && showPcSideImage;
    let needAdapter = ModeType.EXACT_FIT != params.mode && (!params.pcIgnore || !params.mobileIgnore);
    if (needAdapter) {
        if (params.pcIgnore) {
            needAdapter = '!isPC';
        }
        else if (params.mobileIgnore) {
            needAdapter = 'isPC';
        }
    }
    let ignoreState = params.mode == ModeType.EXACT_FIT || (params.pcIgnore && params.mobileIgnore);
    if (!ignoreState) {
        if (params.mobileIgnore || params.pcIgnore) {
            ignoreState = false;
        }
        else if (params.pcIgnore) {
            ignoreState = 'isPC';
        }
        else {
            ignoreState = '!isPC';
        }
    }
    let needFull = params.pcFull && params.mobileFull;
    if (!needFull) {
        if (params.pcFull) {
            needFull = 'isPC';
        }
        else if (params.mobileFull) {
            needFull = '!isPC';
        }
        else {
            needFull = false;
        }
    }
    let widthState;
    let heightState;
    if (ModeType.NONE == params.mode) {
        widthState = `${params.width}px`;
        heightState = `${params.height}px`;
    }
    else {
        let fitWidth = false;
        if (ModeType.FIXED_HEIGHT == params.mode) {
            fitWidth = false;
        }
        else if (ModeType.FIXED_WIDTH == params.mode) {
            fitWidth = true;
        }
        else if (ModeType.NO_BORDER == params.mode) {
            fitWidth = `(widthRatio > heightRatio)`;
        }
        else if (ModeType.SHOW_ALL == params.mode) {
            fitWidth = `(widthRatio < heightRatio)`;
        }
        widthState = `${fitWidth} ? '100%' : ${params.width} * heightRatio`;
        heightState = `${fitWidth} ? ${params.height} * widthRatio : '100%'`;
    }
    let jsCode = `<script type="text/javascript">
    (function () {

        var userAgent = navigator.userAgent;
        var isIPad = false;
        var isPC = true;
        if(userAgent.indexOf('Macintosh') >= 0) {
            if (window.screen.height > window.screen.width) {
                isIPad = true;
            }
        } else {
            var agents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
            for (var v = 0; v < agents.length; v++) {
                if (userAgent.indexOf(agents[v]) > 0) {
                    isPC = false;
                    break;
                }
            }
        }

        var fullClick = !${needFull} || isIPad;
        var fullClickCallback = null;
        window.onFullClickCallback = function(callback){
            if(fullClick) {
                callback && callback();
            } else {
                fullClickCallback = callback;
            }
        }

        if(isIPad) {
            return;
        }

        var curWidth = 0;
        var curHeight = 0;

        function isFullScreen() {
            return !!(
                document.fullscreen ||
                document.mozFullScreen ||
                document.webkitIsFullScreen ||
                document.webkitFullScreen ||
                document.msFullScreen
            );
        }

        function requestFullScreen() {
            var element = document.documentElement;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullScreen) {
                element.webkitRequestFullScreen();
            }
        }

        function exitFullscreen() {
            var element = document.documentElement;
            if (element.exitFullscreen) {
                element.exitFullscreen();
            } else if (element.mozCancelFullScreen) {
                element.mozCancelFullScreen();
            } else if (de.webkitCancelFullScreen) {
                element.webkitCancelFullScreen();
            }
        }

        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        document.documentElement.style.width = '100%';
        document.documentElement.style.height = '100%';
        document.body.style.margin = "0";
        document.body.style.padding = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = isPC ? 'auto' : 'hidden';
        var gameDiv = document.getElementById('GameDiv');
        gameDiv.style.margin = '0 auto';
        gameDiv.style.position = 'relative';

        var gameCanvas = document.getElementById('GameCanvas');

        function getViewportSize() {
            if (window.visualViewport) {
                return {
                    width: window.visualViewport.width,
                    height: window.visualViewport.height
                };
            }
            return {
                width: document.documentElement.clientWidth,
                height: document.documentElement.clientHeight
            };
        }

        var hasPcSideImage = ${hasPcSideImage};
        var pcSideImagePercent = ${pcSideImagePercent};
        var pcSideLeftPanel = null;
        var pcSideRightPanel = null;
        var pcSideLeftImg = null;
        var pcSideRightImg = null;
        if (isPC && hasPcSideImage) {
            pcSideLeftPanel = document.createElement('div');
            pcSideLeftPanel.id = 'pcSideLeftPanel';
            pcSideLeftPanel.style.position = 'fixed';
            pcSideLeftPanel.style.top = '0';
            pcSideLeftPanel.style.left = '0';
            pcSideLeftPanel.style.height = '100%';
            pcSideLeftPanel.style.display = 'flex';
            pcSideLeftPanel.style.alignItems = 'center';
            pcSideLeftPanel.style.justifyContent = 'center';
            pcSideLeftPanel.style.overflow = 'hidden';
            pcSideLeftPanel.style.zIndex = '0';
            pcSideLeftPanel.style.pointerEvents = 'none';

            pcSideLeftImg = document.createElement('img');
            pcSideLeftImg.id = 'pcSideLeftImg';
            pcSideLeftImg.src = './${pcSideImageFile}';
            pcSideLeftImg.style.maxWidth = '100%';
            pcSideLeftImg.style.maxHeight = '100%';
            pcSideLeftImg.style.width = 'auto';
            pcSideLeftImg.style.height = 'auto';
            pcSideLeftImg.style.objectFit = 'contain';
            pcSideLeftImg.style.display = 'block';
            pcSideLeftPanel.appendChild(pcSideLeftImg);
            document.body.appendChild(pcSideLeftPanel);

            pcSideRightPanel = document.createElement('div');
            pcSideRightPanel.id = 'pcSideRightPanel';
            pcSideRightPanel.style.position = 'fixed';
            pcSideRightPanel.style.top = '0';
            pcSideRightPanel.style.right = '0';
            pcSideRightPanel.style.height = '100%';
            pcSideRightPanel.style.display = 'flex';
            pcSideRightPanel.style.alignItems = 'center';
            pcSideRightPanel.style.justifyContent = 'center';
            pcSideRightPanel.style.overflow = 'hidden';
            pcSideRightPanel.style.zIndex = '0';
            pcSideRightPanel.style.pointerEvents = 'none';

            pcSideRightImg = document.createElement('img');
            pcSideRightImg.id = 'pcSideRightImg';
            pcSideRightImg.src = './${pcSideImageFile}';
            pcSideRightImg.style.maxWidth = '100%';
            pcSideRightImg.style.maxHeight = '100%';
            pcSideRightImg.style.width = 'auto';
            pcSideRightImg.style.height = 'auto';
            pcSideRightImg.style.objectFit = 'contain';
            pcSideRightImg.style.display = 'block';
            pcSideRightPanel.appendChild(pcSideRightImg);
            document.body.appendChild(pcSideRightPanel);

            pcSideLeftImg.onload = updatePcSideImages;
            gameDiv.style.zIndex = '1';
        }

        function updatePcSideImages() {
            if (!pcSideLeftPanel || !pcSideRightPanel) {
                return;
            }
            var rect = gameDiv.getBoundingClientRect();
            var leftWidth = rect.left;
            var rightWidth = window.innerWidth - rect.right;
            var sideHeight = window.innerHeight;
            var naturalWidth = pcSideLeftImg && pcSideLeftImg.naturalWidth;
            var naturalHeight = pcSideLeftImg && pcSideLeftImg.naturalHeight;
            if (leftWidth > 0) {
                pcSideLeftPanel.style.display = 'flex';
                pcSideLeftPanel.style.width = leftWidth + 'px';
                pcSideLeftPanel.style.height = sideHeight + 'px';
                if (naturalWidth > 0 && naturalHeight > 0) {
                    var scale = Math.min(leftWidth / naturalWidth, sideHeight / naturalHeight) * (pcSideImagePercent / 100);
                    var displayWidth = naturalWidth * scale;
                    var displayHeight = naturalHeight * scale;
                    pcSideLeftImg.style.width = displayWidth + 'px';
                    pcSideLeftImg.style.height = displayHeight + 'px';
                }
            } else {
                pcSideLeftPanel.style.display = 'none';
            }
            if (rightWidth > 0) {
                pcSideRightPanel.style.display = 'flex';
                pcSideRightPanel.style.width = rightWidth + 'px';
                pcSideRightPanel.style.height = sideHeight + 'px';
                if (naturalWidth > 0 && naturalHeight > 0) {
                    var rightScale = Math.min(rightWidth / naturalWidth, sideHeight / naturalHeight) * (pcSideImagePercent / 100);
                    var rightDisplayWidth = naturalWidth * rightScale;
                    var rightDisplayHeight = naturalHeight * rightScale;
                    pcSideRightImg.style.width = rightDisplayWidth + 'px';
                    pcSideRightImg.style.height = rightDisplayHeight + 'px';
                }
            } else {
                pcSideRightPanel.style.display = 'none';
            }
        }

        if(${needFull}){
            var img = document.createElement('img');
            img.id = 'splashTipImg'
            img.style.position = 'relative';
            img.style.verticalAlign = "middle";
            img.src = "./splash2.png";
            img.style.textAlign = "center";
            document.body.appendChild(img);
        }

        function setGameDiv() {
            var position = 'absolute';
            var viewport = getViewportSize();
            var clientWidth = viewport.width;
            var clientHeight = viewport.height;
            var gameWidth;
            var gameHeight;
            if (${needAdapter}) {
                if (curWidth == clientWidth && curHeight == clientHeight) {
                    return;
                }
                var widthRatio = clientWidth / ${params.width};
                var heightRatio = clientHeight / ${params.height};
                gameWidth = ${widthState};
                gameHeight = ${heightState};
                if(gameWidth != '100%') {
                    if(gameWidth > clientWidth) {
                        position = 'relative';
                    }
                    gameWidth += 'px';
                } else {
                    gameWidth = clientWidth + 'px';
                }
                if(gameHeight != '100%') {
                    if(gameHeight > clientHeight) {
                        position = 'relative';
                    }
                    gameHeight += 'px';
                } else {
                    gameHeight = clientHeight + 'px';
                }
            } else {
                gameWidth = clientWidth + 'px';
                gameHeight = clientHeight + 'px';
            }
            curWidth = clientWidth;
            curHeight = clientHeight;
            document.documentElement.style.height = clientHeight + 'px';
            document.body.style.height = clientHeight + 'px';
            document.body.style.minHeight = clientHeight + 'px';
            document.body.style.position = position;
            gameDiv.style.width = gameWidth;
            gameDiv.style.height = gameHeight;
            updatePcSideImages();
        }

        setGameDiv();

        // if(${needFull}){ 
        //      document.body.style.position = 'relative';
        // }

        function clickScreen() {
            if (${needFull} && !isFullScreen()) {
                requestFullScreen();
            }
            if (fullClick) {
                return;
            }
            fullClick = true;
            if (fullClickCallback) { 
                fullClickCallback();                    
                fullClickCallback = null;
            }
            var splashTipImg = document.getElementById('splashTipImg');
            if (splashTipImg) {
                document.body.removeChild(splashTipImg);
            } 
        }

        document.body.addEventListener('click', function () {
            clickScreen();
        }, false);

        gameCanvas.addEventListener('touchend', function () {
            clickScreen();
        }, false);

        window.onresize = function () {
            setGameDiv();
        }
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', setGameDiv);
            window.visualViewport.addEventListener('scroll', setGameDiv);
        }
    })();
</script>`;
    const htmlPath = (0, mfs_1.join)(dest, 'index.html');
    let newStr = (0, mfs_1.readFileSync)(htmlPath, "utf8");
    if (null != params.title && '' != params.title) {
        newStr = newStr.replace(/<title>[\S|\s]*<\/title>/g, `<title>${params.title}</title>`);
    }
    const idx = newStr.indexOf('<script');
    newStr = newStr.slice(0, idx) + '\n' + jsCode + '\n' + newStr.slice(idx - 1);
    const startIdx = newStr.indexOf('System.import(');
    const endIdx = newStr.indexOf('<\/script>', startIdx);
    newStr = newStr.slice(0, startIdx) + '\window.onFullClickCallback(function () {\n' + newStr.slice(startIdx, endIdx) + '\n});\n' + newStr.slice(endIdx);
    (0, mfs_1.writeFileSync)(htmlPath, newStr);
    // 获取settings脚本
    const srcFiles = (0, mfs_1.readdirSync)((0, mfs_1.join)(dest, 'src'));
    for (let i = srcFiles.length - 1; i >= 0; i--) {
        if (srcFiles[i].startsWith('settings') && (0, mfs_1.extname)(srcFiles[i]) === '.json') {
            const settingPath = (0, mfs_1.join)(dest, 'src', srcFiles[i]);
            const settingData = JSON.parse((0, mfs_1.readFileSync)(settingPath, 'utf-8'));
            settingData.screen.exactFitScreen = false;
            (0, mfs_1.writeFileSync)(settingPath, JSON.stringify(settingData));
            break;
        }
    }
    console.info(constant_1.PACKAGE_NAME, '网页适配结束');
};
