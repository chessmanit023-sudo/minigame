import { Color, Material, Node, SkinnedMeshRenderer } from 'cc';

const SPECULAR_OFF = new Color(0, 0, 0, 0);
/** builtin-toon 主渲染 pass（无描边时 index 为 1） */
const TOON_PASS = 1;

/**
 * 修正角色蒙皮材质在 H5 / WebGL1 上的白点闪烁：
 * - 关闭高光（FBX 内嵌材质 specular.a 默认为 76）
 * - 禁用误用的法线贴图宏
 * - 略微加宽卡通色阶过渡，减轻色带锯齿
 */
export function fixSkinnedRoleMaterials(root: Node) {
    const renderers = root.getComponentsInChildren(SkinnedMeshRenderer);
    for (let i = 0; i < renderers.length; i++) {
        const renderer = renderers[i];
        for (let j = 0; j < renderer.materials.length; j++) {
            const mat = renderer.getMaterialInstance(j);
            if (!mat) {
                continue;
            }
            applyRoleMaterialFix(mat);
        }
    }
}

function applyRoleMaterialFix(mat: Material) {
    mat.recompileShaders({ USE_NORMAL_MAP: false });
    mat.setProperty('specular', SPECULAR_OFF, TOON_PASS);
    const feather = mat.getProperty('baseFeather', TOON_PASS);
    if (typeof feather === 'number' && feather < 0.05) {
        mat.setProperty('baseFeather', 0.05, TOON_PASS);
    }
}
