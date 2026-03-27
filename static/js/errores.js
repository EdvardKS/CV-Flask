(function () {
    const config = window.erroresConfig || {};
    const counterBlocks = config.counterBlocks || [];
    const fieldLabels = config.errorLabels || {};
    const errorFields = config.errorFields || [];
    const successFields = config.successFields || [];
    const metricFields = counterBlocks.flatMap((block) => block.fields.map((field) => field.key));

    const playerIntro = document.getElementById('player-intro');
    const playerForm = document.getElementById('player-form');
    const playerInput = document.getElementById('jugador-input');
    const playerMessage = document.getElementById('player-message');
    const sessionMessage = document.getElementById('session-message');
    const sessionLayout = document.getElementById('session-layout');
    const playerHeading = document.getElementById('player-heading');
    const sessionSubtext = document.getElementById('session-subtext');
    const matchIdElement = document.getElementById('match-id');
    const currentSetElement = document.getElementById('current-set');
    const currentErrorsElement = document.getElementById('current-errors');
    const currentSuccessesElement = document.getElementById('current-successes');
    const currentBalanceElement = document.getElementById('current-balance');
    const savedSetsContainer = document.getElementById('saved-sets');
    const priorityStrip = document.querySelector('.priority-strip');
    const priorityLabel = document.getElementById('priority-label');
    const priorityValue = document.getElementById('priority-value');
    const liveErrorChartCanvas = document.getElementById('live-error-chart');
    const changeSetButton = document.getElementById('change-set-btn');
    const finalizeMatchButton = document.getElementById('finalize-match-btn');
    const startSessionButton = document.getElementById('start-session-btn');
    const changePlayerButton = document.getElementById('change-player-btn');
    const playerSessionStore = window.padelPlayerSession || null;
    const STORAGE_PREFIX = 'padelScout.activeMatch.v3';
    const STORAGE_TTL_MS = 2 * 60 * 60 * 1000;

    const state = {
        jugador: '',
        archivo: '',
        idPartido: null,
        setActual: 1,
        counters: createEmptyCounters(),
        setsGuardados: [],
        isBusy: false,
        liveChart: null,
        storageKey: '',
        storageCreatedAt: null,
    };

    function createEmptyCounters() {
        return metricFields.reduce((accumulator, field) => {
            accumulator[field] = 0;
            return accumulator;
        }, {});
    }

    function setMessage(element, message, type) {
        element.textContent = message || '';
        element.className = 'status-message';
        if (type) {
            element.classList.add(`is-${type}`);
        }
    }

    function setBusy(isBusy) {
        state.isBusy = isBusy;
        startSessionButton.disabled = isBusy;
        changeSetButton.disabled = isBusy;
        finalizeMatchButton.disabled = isBusy;
        changePlayerButton.disabled = isBusy;
    }

    function rememberActivePlayer(playerName) {
        if (!playerSessionStore || !playerName) {
            return;
        }
        playerSessionStore.touch(playerName);
    }

    function clearRememberedPlayer() {
        if (!playerSessionStore) {
            return;
        }
        playerSessionStore.clear();
    }

    function normalizePlayerStorageKey(playerName) {
        return String(playerName || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '') || 'jugador';
    }

    function getStorageKey(playerName) {
        return `${STORAGE_PREFIX}.${normalizePlayerStorageKey(playerName)}`;
    }

    function toPositiveInt(value, fallback) {
        const parsed = Number.parseInt(value, 10);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
    }

    function normalizeCounterValue(value) {
        const parsed = Number.parseInt(value, 10);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
    }

    function cloneCounters(source) {
        return metricFields.reduce((accumulator, field) => {
            accumulator[field] = normalizeCounterValue(source && source[field]);
            return accumulator;
        }, {});
    }

    function cloneSetPayload(setData, index) {
        const payload = { Numero_Set: index + 1 };
        metricFields.forEach((field) => {
            payload[field] = normalizeCounterValue(setData && setData[field]);
        });
        return payload;
    }

    function persistSessionSnapshot(options = {}) {
        if (!state.jugador || !state.idPartido) {
            return;
        }

        const storageKey = state.storageKey || getStorageKey(state.jugador);
        const now = Date.now();
        const createdAt = options.resetClock || !state.storageCreatedAt ? now : state.storageCreatedAt;

        state.storageKey = storageKey;
        state.storageCreatedAt = createdAt;

        const snapshot = {
            version: 3,
            jugador: state.jugador,
            archivo: state.archivo,
            idPartido: state.idPartido,
            setActual: state.setActual,
            counters: cloneCounters(state.counters),
            setsGuardados: state.setsGuardados.map((setData, index) => cloneSetPayload(setData, index)),
            createdAt,
            lastUsedAt: now,
            expiresAt: now + STORAGE_TTL_MS,
            savedAt: now,
        };

        try {
            localStorage.setItem(storageKey, JSON.stringify(snapshot));
        } catch (error) {
            console.warn('No se pudo persistir la sesión local de scouting.', error);
        }

        rememberActivePlayer(state.jugador);
    }

    function removeStoredSession(storageKey) {
        if (!storageKey) {
            return;
        }
        try {
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.warn('No se pudo limpiar la sesión local de scouting.', error);
        }
    }

    function readStoredSession(playerName) {
        const storageKey = getStorageKey(playerName);
        let rawSnapshot = null;

        try {
            rawSnapshot = localStorage.getItem(storageKey);
        } catch (error) {
            console.warn('No se pudo leer la sesión local de scouting.', error);
            return null;
        }

        if (!rawSnapshot) {
            return null;
        }

        let parsedSnapshot = null;
        try {
            parsedSnapshot = JSON.parse(rawSnapshot);
        } catch (error) {
            removeStoredSession(storageKey);
            return null;
        }

        const expiresAt = Number(parsedSnapshot && parsedSnapshot.expiresAt);
        if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
            removeStoredSession(storageKey);
            return null;
        }

        const idPartido = toPositiveInt(parsedSnapshot.idPartido, null);
        if (!idPartido) {
            removeStoredSession(storageKey);
            return null;
        }

        const setsGuardados = Array.isArray(parsedSnapshot.setsGuardados)
            ? parsedSnapshot.setsGuardados.map((setData, index) => cloneSetPayload(setData, index))
            : [];

        return {
            storageKey,
            jugador: String(parsedSnapshot.jugador || playerName || '').trim(),
            archivo: String(parsedSnapshot.archivo || ''),
            idPartido,
            setActual: Math.max(toPositiveInt(parsedSnapshot.setActual, 1), setsGuardados.length + 1),
            counters: cloneCounters(parsedSnapshot.counters),
            setsGuardados,
            createdAt: Number(parsedSnapshot.createdAt) > 0 ? Number(parsedSnapshot.createdAt) : Date.now(),
        };
    }

    function formatBalance(value) {
        if (value > 0) {
            return `+${value}`;
        }
        return String(value);
    }

    function getCurrentErrorTotal() {
        return errorFields.reduce((total, field) => total + normalizeCounterValue(state.counters[field]), 0);
    }

    function getCurrentSuccessTotal() {
        return successFields.reduce((total, field) => total + normalizeCounterValue(state.counters[field]), 0);
    }

    function getCurrentBalance() {
        return getCurrentSuccessTotal() - getCurrentErrorTotal();
    }

    function buildSetPayloadFromCounters(setNumber, counters) {
        return metricFields.reduce((payload, field) => {
            payload[field] = counters[field];
            return payload;
        }, { Numero_Set: setNumber });
    }

    function hasActivity(setPayload) {
        return metricFields.some((field) => (setPayload[field] || 0) > 0);
    }

    function calculateErrorTotal(setData) {
        return errorFields.reduce((total, field) => total + normalizeCounterValue(setData[field]), 0);
    }

    function calculateSuccessTotal(setData) {
        return successFields.reduce((total, field) => total + normalizeCounterValue(setData[field]), 0);
    }

    function calculateBalanceTotal(setData) {
        return calculateSuccessTotal(setData) - calculateErrorTotal(setData);
    }

    function showSessionView() {
        playerIntro.classList.add('hidden');
        sessionLayout.classList.remove('hidden');
    }

    function showIntroView() {
        playerIntro.classList.remove('hidden');
        sessionLayout.classList.add('hidden');
    }

    function destroyLiveChart() {
        if (state.liveChart) {
            state.liveChart.destroy();
            state.liveChart = null;
        }
    }

    function getAggregatedTotals(fields) {
        const totals = fields.reduce((accumulator, field) => {
            accumulator[field] = 0;
            return accumulator;
        }, {});

        state.setsGuardados.forEach((setData) => {
            fields.forEach((field) => {
                totals[field] += normalizeCounterValue(setData[field]);
            });
        });

        fields.forEach((field) => {
            totals[field] += normalizeCounterValue(state.counters[field]);
        });

        return totals;
    }

    function getRankedErrors() {
        const totals = getAggregatedTotals(errorFields);
        return errorFields
            .map((field) => ({
                field,
                label: fieldLabels[field] || field,
                total: totals[field] || 0,
            }))
            .filter((item) => item.total > 0)
            .sort((left, right) => right.total - left.total || left.label.localeCompare(right.label, 'es'));
    }

    function renderPriorityChart() {
        const rankedErrors = getRankedErrors();

        if (!rankedErrors.length) {
            priorityStrip.classList.add('hidden');
            destroyLiveChart();
            return;
        }

        priorityStrip.classList.remove('hidden');

        const topError = rankedErrors[0];
        priorityLabel.textContent = topError.label;
        priorityValue.textContent = `${topError.total} error(es) acumulados. Es el principal foco de corrección ahora mismo.`;

        const chartData = rankedErrors.slice(0, 4).reverse();
        const labels = chartData.map((item) => item.label);
        const values = chartData.map((item) => item.total);
        const colors = chartData.map((item) => (
            item.field === topError.field ? '#d8b36a' : 'rgba(120, 162, 226, 0.55)'
        ));

        if (state.liveChart) {
            state.liveChart.data.labels = labels;
            state.liveChart.data.datasets[0].data = values;
            state.liveChart.data.datasets[0].backgroundColor = colors;
            state.liveChart.update();
            return;
        }

        state.liveChart = new Chart(liveErrorChartCanvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 8,
                    borderSkipped: false,
                    barThickness: 14,
                }],
            },
            options: {
                animation: false,
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label(context) {
                                return `${context.raw} error(es)`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            color: 'rgba(235, 241, 250, 0.82)',
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.08)',
                        },
                        border: {
                            display: false,
                        },
                    },
                    y: {
                        ticks: {
                            color: 'rgba(244, 247, 252, 0.9)',
                            font: { size: 11, weight: '700' },
                        },
                        grid: { display: false },
                        border: { display: false },
                    },
                },
            },
        });
    }

    function renderCounters() {
        metricFields.forEach((field) => {
            const output = document.getElementById(`value-${field}`);
            if (output) {
                output.textContent = state.counters[field];
            }
        });

        currentSetElement.textContent = state.setActual;
        currentErrorsElement.textContent = getCurrentErrorTotal();
        currentSuccessesElement.textContent = getCurrentSuccessTotal();
        currentBalanceElement.textContent = formatBalance(getCurrentBalance());
        matchIdElement.textContent = state.idPartido || '-';
    }

    function renderSavedSets() {
        savedSetsContainer.innerHTML = '';

        if (!state.setsGuardados.length) {
            const emptyCard = document.createElement('div');
            emptyCard.className = 'saved-set-item';
            emptyCard.innerHTML = '<p class="muted-text mb-0">Todavía no hay sets guardados en esta sesión.</p>';
            savedSetsContainer.appendChild(emptyCard);
            return;
        }

        state.setsGuardados.forEach((setData) => {
            const item = document.createElement('article');
            item.className = 'saved-set-item';

            const top = document.createElement('div');
            top.className = 'saved-set-top';

            const title = document.createElement('h4');
            title.className = 'saved-set-title';
            title.textContent = `Set ${setData.Numero_Set}`;

            const totals = document.createElement('span');
            totals.className = 'saved-set-total';
            totals.textContent = `E ${calculateErrorTotal(setData)} · A ${calculateSuccessTotal(setData)} · B ${formatBalance(calculateBalanceTotal(setData))}`;

            top.appendChild(title);
            top.appendChild(totals);

            const chips = document.createElement('div');
            chips.className = 'saved-metrics';

            metricFields
                .filter((field) => normalizeCounterValue(setData[field]) > 0)
                .forEach((field) => {
                    const chip = document.createElement('span');
                    chip.className = 'saved-chip';
                    chip.textContent = `${fieldLabels[field]}: ${setData[field]}`;
                    chips.appendChild(chip);
                });

            item.appendChild(top);
            item.appendChild(chips);
            savedSetsContainer.appendChild(item);
        });
    }

    function renderSession() {
        playerHeading.textContent = state.jugador || 'Jugador';
        sessionSubtext.textContent = state.archivo
            ? `Archivo activo: ${state.archivo}. Cada set guarda errores, aciertos y balance del partido.`
            : 'Sesión de scouting lista para capturar errores y aciertos.';
        renderCounters();
        renderSavedSets();
        renderPriorityChart();
    }

    function resetCurrentSet() {
        state.counters = createEmptyCounters();
        renderCounters();
        renderPriorityChart();
    }

    function resetWholeSession(nextMatchId, options = {}) {
        state.idPartido = nextMatchId;
        state.setActual = 1;
        state.setsGuardados = [];
        state.counters = createEmptyCounters();
        if (options.resetClock) {
            state.storageCreatedAt = Date.now();
        }
        renderSession();
        persistSessionSnapshot({ resetClock: Boolean(options.resetClock) });
    }

    function resetToIntro() {
        removeStoredSession(state.storageKey);
        clearRememberedPlayer();
        state.jugador = '';
        state.archivo = '';
        state.idPartido = null;
        state.setActual = 1;
        state.counters = createEmptyCounters();
        state.setsGuardados = [];
        state.storageKey = '';
        state.storageCreatedAt = null;
        showIntroView();
        renderSession();
        setMessage(playerMessage, '', '');
        setMessage(sessionMessage, '', '');
        playerForm.reset();
        playerInput.focus();
    }

    function updateCounter(field, delta) {
        const nextValue = Math.max(0, normalizeCounterValue(state.counters[field]) + delta);
        state.counters[field] = nextValue;
        renderCounters();
        renderPriorityChart();
        persistSessionSnapshot();
    }

    async function postJSON(url, payload) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || 'No se pudo completar la operación.');
        }
        return data;
    }

    function applyFreshSession(sessionData) {
        state.storageKey = getStorageKey(sessionData.jugador);
        state.storageCreatedAt = Date.now();
        state.jugador = sessionData.jugador;
        state.archivo = sessionData.archivo;
        state.idPartido = sessionData.id_partido;
        state.setActual = 1;
        state.counters = createEmptyCounters();
        state.setsGuardados = [];
        renderSession();
        rememberActivePlayer(state.jugador);
        persistSessionSnapshot({ resetClock: true });
    }

    function applyStoredSession(snapshot, fallbackSessionData) {
        state.storageKey = snapshot.storageKey;
        state.storageCreatedAt = snapshot.createdAt;
        state.jugador = fallbackSessionData.jugador;
        state.archivo = fallbackSessionData.archivo;
        state.idPartido = snapshot.idPartido;
        state.setActual = snapshot.setActual;
        state.counters = cloneCounters(snapshot.counters);
        state.setsGuardados = snapshot.setsGuardados.map((setData, index) => cloneSetPayload(setData, index));
        renderSession();
        rememberActivePlayer(state.jugador);
        persistSessionSnapshot();
    }

    async function openSessionForPlayer(jugador, options = {}) {
        if (state.isBusy) {
            return;
        }

        if (!jugador) {
            if (!options.silent) {
                setMessage(playerMessage, 'Introduce un nombre de jugador antes de iniciar.', 'error');
            }
            return;
        }

        try {
            setBusy(true);
            if (!options.silent) {
                setMessage(playerMessage, 'Preparando sesión y comprobando el histórico del jugador...', '');
            }
            const data = await postJSON('/api/errores/iniciar', { jugador });
            const storedSession = readStoredSession(data.jugador);

            if (storedSession && storedSession.idPartido === data.id_partido) {
                applyStoredSession(storedSession, data);
                showSessionView();
                if (!options.silent) {
                    setMessage(playerMessage, '', '');
                }
                setMessage(
                    sessionMessage,
                    options.auto
                        ? `Sesión recuperada automáticamente para ${storedSession.jugador}. Partido ${storedSession.idPartido}.`
                        : `Se ha recuperado el Partido ${storedSession.idPartido} guardado en este navegador.`,
                    'success'
                );
                return;
            }

            if (storedSession) {
                removeStoredSession(storedSession.storageKey);
            }

            applyFreshSession(data);
            showSessionView();

            if (!options.silent) {
                setMessage(playerMessage, '', '');
            }
            setMessage(
                sessionMessage,
                options.auto
                    ? `Sesión abierta automáticamente para ${data.jugador}. ID Partido ${data.id_partido}.`
                    : `Sesión lista. ID Partido ${data.id_partido}.`,
                'success'
            );
        } catch (error) {
            if (options.auto) {
                clearRememberedPlayer();
            }
            setMessage(playerMessage, error.message, 'error');
        } finally {
            setBusy(false);
        }
    }

    async function startSession(event) {
        event.preventDefault();
        await openSessionForPlayer(playerInput.value.trim());
    }

    function maybeResumeLastPlayer() {
        if (!playerSessionStore) {
            return;
        }

        const storedPlayer = playerSessionStore.read();
        if (!storedPlayer || !storedPlayer.jugador) {
            return;
        }

        playerInput.value = storedPlayer.jugador;
        openSessionForPlayer(storedPlayer.jugador, { auto: true, silent: true });
    }

    function saveCurrentSetInMemory() {
        const currentSet = buildSetPayloadFromCounters(state.setActual, state.counters);
        if (!hasActivity(currentSet)) {
            return false;
        }

        state.setsGuardados.push(currentSet);
        state.setActual += 1;
        resetCurrentSet();
        renderSavedSets();
        renderPriorityChart();
        persistSessionSnapshot();
        return true;
    }

    function handleChangeSet() {
        if (state.isBusy) {
            return;
        }

        const saved = saveCurrentSetInMemory();
        if (!saved) {
            setMessage(sessionMessage, 'No hay actividad en el set actual para guardar.', 'error');
            return;
        }

        setMessage(sessionMessage, `Set ${state.setActual - 1} guardado. Continúa con el siguiente set.`, 'success');
    }

    async function handleFinalizeMatch() {
        if (state.isBusy || !state.jugador || !state.idPartido) {
            return;
        }

        const setsPayload = state.setsGuardados.map((setData) => ({ ...setData }));
        const currentSet = buildSetPayloadFromCounters(state.setActual, state.counters);

        if (hasActivity(currentSet)) {
            setsPayload.push(currentSet);
        }

        if (!setsPayload.length) {
            setMessage(sessionMessage, 'No hay actividad registrada para finalizar este partido.', 'error');
            return;
        }

        try {
            setBusy(true);
            setMessage(sessionMessage, 'Guardando sets en el CSV del jugador...', '');

            const data = await postJSON('/api/errores/finalizar', {
                jugador: state.jugador,
                id_partido: state.idPartido,
                sets: setsPayload,
            });

            resetWholeSession(data.siguiente_id_partido, { resetClock: true });
            setMessage(
                sessionMessage,
                `Partido guardado con ${data.filas_guardadas} set(s). Siguiente ID disponible: ${data.siguiente_id_partido}.`,
                'success'
            );
        } catch (error) {
            setMessage(sessionMessage, error.message, 'error');
        } finally {
            setBusy(false);
        }
    }

    playerForm.addEventListener('submit', startSession);

    sessionLayout.addEventListener('click', (event) => {
        const button = event.target.closest('.count-btn');
        if (!button || state.isBusy) {
            return;
        }

        const card = button.closest('.counter-card');
        if (!card) {
            return;
        }

        const field = card.dataset.field;
        const delta = button.dataset.action === 'increase' ? 1 : -1;
        updateCounter(field, delta);
    });

    changeSetButton.addEventListener('click', handleChangeSet);
    finalizeMatchButton.addEventListener('click', handleFinalizeMatch);
    changePlayerButton.addEventListener('click', resetToIntro);

    renderSession();
    maybeResumeLastPlayer();
})();
