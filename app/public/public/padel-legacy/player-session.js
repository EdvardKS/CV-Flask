(function () {
    const STORAGE_KEY = 'padelScout.activePlayer.v1';
    const TTL_MS = 2 * 60 * 60 * 1000;

    function normalizePlayerName(playerName) {
        return String(playerName || '')
            .trim()
            .replace(/\s+/g, ' ');
    }

    function clear() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.warn('No se pudo limpiar la sesión global del jugador.', error);
        }
    }

    function read() {
        let raw = null;

        try {
            raw = localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            console.warn('No se pudo leer la sesión global del jugador.', error);
            return null;
        }

        if (!raw) {
            return null;
        }

        let parsed = null;
        try {
            parsed = JSON.parse(raw);
        } catch (error) {
            clear();
            return null;
        }

        const jugador = normalizePlayerName(parsed && parsed.jugador);
        const expiresAt = Number(parsed && parsed.expiresAt);

        if (!jugador || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
            clear();
            return null;
        }

        return {
            jugador,
            createdAt: Number(parsed.createdAt) > 0 ? Number(parsed.createdAt) : Date.now(),
            lastUsedAt: Number(parsed.lastUsedAt) > 0 ? Number(parsed.lastUsedAt) : Date.now(),
            expiresAt,
        };
    }

    function touch(playerName) {
        const normalizedName = normalizePlayerName(playerName);
        if (!normalizedName) {
            clear();
            return null;
        }

        const current = read();
        const now = Date.now();
        const payload = {
            version: 1,
            jugador: normalizedName,
            createdAt: current && current.jugador === normalizedName ? current.createdAt : now,
            lastUsedAt: now,
            expiresAt: now + TTL_MS,
        };

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch (error) {
            console.warn('No se pudo guardar la sesión global del jugador.', error);
        }

        return payload;
    }

    window.padelPlayerSession = {
        key: STORAGE_KEY,
        ttlMs: TTL_MS,
        read,
        touch,
        clear,
        normalizePlayerName,
    };
})();
