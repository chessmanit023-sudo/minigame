"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renameSync = exports.existsSync = exports.parse = exports.relative = exports.basename = exports.extname = exports.join = exports.exists = exports.readFileSync = exports.writeFileSync = exports.size = exports.isDirectory = exports.isFile = exports.readdirSync = exports.readdirAllSync = exports.copySync = exports.rmSync = exports.mkdirSync = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * 递归创建文件
 * @param {*} dirName
 * @param {*} mode
 */
function mkdirSync(dirName, mode) {
    if (fs_1.default.existsSync(dirName)) {
        return true;
    }
    if (mkdirSync(path_1.default.dirname(dirName), mode)) {
        fs_1.default.mkdirSync(dirName, mode);
        return true;
    }
}
exports.mkdirSync = mkdirSync;
/**
 * 递归删除
 * @param {*} src
 */
function rmSync(src) {
    if (fs_1.default.existsSync(src)) {
        if (isFile(src)) {
            fs_1.default.unlinkSync(src);
            return;
        }
        const files = fs_1.default.readdirSync(src);
        files.forEach((file) => {
            const curPath = path_1.default.join(src, file);
            if (isDirectory(curPath)) {
                rmSync(curPath);
            }
            else if (isFile(curPath)) {
                fs_1.default.unlinkSync(curPath);
            }
        });
        fs_1.default.rmdirSync(src);
    }
    else {
        console.error("删除文件失败，给定的路径不存在，请给出正确的路径", src);
    }
}
exports.rmSync = rmSync;
/**
 * 递归复制文件
 * @param {*} src
 * @param {*} dst
 */
function copySync(src, dst) {
    if (!fs_1.default.existsSync(src)) {
        console.error('原路径不存在', src);
        return;
    }
    if (isFile(src)) {
        let dstDir = path_1.default.parse(dst).dir;
        if (!fs_1.default.existsSync(dstDir)) {
            mkdirSync(dstDir);
        }
        fs_1.default.copyFileSync(src, dst);
    }
    else if (isDirectory(src)) {
        const files = fs_1.default.readdirSync(src);
        files.forEach((file) => {
            const srcPath = path_1.default.join(src, file);
            const dstPath = path_1.default.join(dst, file);
            copySync(srcPath, dstPath);
        });
    }
}
exports.copySync = copySync;
/**
 * 获取文件夹下所有文件路径
 * @param {*} src
 */
function readdirAllSync(src) {
    return _readdirSync(src, []);
}
exports.readdirAllSync = readdirAllSync;
exports.readdirSync = fs_1.default.readdirSync;
function _readdirSync(src, paths) {
    paths = paths || [];
    const files = fs_1.default.readdirSync(src);
    files.forEach((file) => {
        const filePath = path_1.default.join(src, file);
        if (isFile(filePath)) {
            paths.push(filePath);
        }
        else if (isDirectory(filePath)) {
            _readdirSync(filePath, paths);
        }
    });
    return paths;
}
/**
 * 是否是文件
 * @param {*} path
 */
function isFile(path) {
    const stat = fs_1.default.statSync(path);
    return stat.isFile();
}
exports.isFile = isFile;
/**
 * 是否是文件夹
 * @param {*} path
 */
function isDirectory(path) {
    const stat = fs_1.default.statSync(path);
    return stat.isDirectory();
}
exports.isDirectory = isDirectory;
function size(path) {
    const stat = fs_1.default.statSync(path);
    return stat.size;
}
exports.size = size;
function writeFileSync(p, data, option) {
    const dirName = path_1.default.parse(p).dir;
    if (!fs_1.default.existsSync(p)) {
        mkdirSync(dirName);
    }
    fs_1.default.writeFileSync(p, data, option);
}
exports.writeFileSync = writeFileSync;
exports.readFileSync = fs_1.default.readFileSync;
/**
 * 文件或文件夹是否存在
 * @param {*} dirName
 */
exports.exists = fs_1.default.existsSync;
/**
 * 拼接路径
 */
exports.join = path_1.default.join;
/**
 * 读取后缀
 */
exports.extname = path_1.default.extname;
exports.basename = path_1.default.basename;
exports.relative = path_1.default.relative;
exports.parse = path_1.default.parse;
exports.existsSync = fs_1.default.existsSync;
exports.renameSync = fs_1.default.renameSync;
