import { sys } from 'cc';

const KEY = 'bpb_client_prefs_v1';

/** 与本机相关的偏好（不受服务端 user_data 字段齐全与否影响） */
export interface ClientPrefs {
    language?: string;
    musicOn?: boolean;
    soundOn?: boolean;
    vibrationOn?: boolean;
}

export function readClientPrefs(): ClientPrefs {
    try {
        const raw = sys.localStorage.getItem(KEY);
        if (!raw) {
            return {};
        }
        return JSON.parse(raw) as ClientPrefs;
    } catch {
        return {};
    }
}

export function mergeWriteClientPrefs(patch: Partial<ClientPrefs>): void {
    const cur = readClientPrefs();
    const next = { ...cur, ...patch };
    try {
        sys.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
        /* ignore quota */
    }
}

/** 启动创建默认 playerInfo 时写入磁盘上的选择 */
export function applyClientPrefsToPlayerInfo(playerInfo: Record<string, unknown>): void {
    const p = readClientPrefs();
    if (typeof p.language === 'string' && p.language.length > 0) {
        playerInfo.language = p.language;
    }
    if (typeof p.musicOn === 'boolean') {
        playerInfo.musicOn = p.musicOn;
    }
    if (typeof p.soundOn === 'boolean') {
        playerInfo.soundOn = p.soundOn;
    }
    if (typeof p.vibrationOn === 'boolean') {
        playerInfo.vibrationOn = p.vibrationOn;
    }
}
