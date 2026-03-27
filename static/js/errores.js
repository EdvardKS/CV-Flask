(function () {
    const config = window.erroresConfig || {};
    const counterBlocks = config.counterBlocks || [];
    const errorLabels = config.errorLabels || {};
    const errorFields = counterBlocks.flatMap((block) => block.fields.map((field) => field.key));

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
    const currentTotalElement = document.getElementById('current-total');
    const savedSetsContainer = document.getElementById('saved-sets');
    const changeSetButton = document.getElementById('change-set-btn');
    const finalizeMatchButton = document.getElementById('finalize-match-btn');
    const startSessionButton = document.getElementById('start-session-btn');
    const changePlayerButton = document.getElementById('change-player-btn');

    const state = {
        jugador: '',
        archivo: '',
        idPartido: null,
        setActual: 1,
        counters: createEmptyCounters(),
        setsGuardados: [],
        isBusy: false,
    };

    function createEmptyCounters() {
        return errorFields.reduce((accumulator, field) => {
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

    function getCurrentTotal() {
        return errorFields.reduce((total, field) => total + state.counters[field], 0);
    }

    function buildSetPayloadFromCounters(setNumber, counters) {
        return errorFields.reduce((payload, field) => {
            payload[field] = counters[field];
            return payload;
        }, { Numero_Set: setNumber });
    }

    function hasActivity(setPayload) {
        return errorFields.some((field) => (setPayload[field] || 0) > 0);
    }

    function calculateSetTotal(setData) {
        return errorFields.reduce((total, field) => total + (setData[field] || 0), 0);
    }

    function showSessionView() {
        playerIntro.classList.add('hidden');
        sessionLayout.classList.remove('hidden');
    }

    function showIntroView() {
        playerIntro.classList.remove('hidden');
        sessionLayout.classList.add('hidden');
    }

    function renderCounters() {
        errorFields.forEach((field) => {
            const output = document.getElementById(`value-${field}`);
            if (output) {
                output.textContent = state.counters[field];
            }
        });

        currentSetElement.textContent = state.setActual;
        currentTotalElement.textContent = getCurrentTotal();
        matchIdElement.textContent = state.idPartido || '-';
    }

    function renderSavedSets() {
        savedSetsContainer.innerHTML = '';

        if (!state.setsGuardados.length) {
            const emptyCard = document.createElement('div');
            emptyCard.className = 'saved-set-item';

            const copy = document.createElement('p');
            copy.className = 'muted-text';
            copy.textContent = 'Todavía no hay sets guardados en esta sesión.';
            emptyCard.appendChild(copy);
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

            const total = document.createElement('span');
            total.className = 'saved-set-total';
            total.textContent = `Total ENF ${calculateSetTotal(setData)}`;

            top.appendChild(title);
            top.appendChild(total);

            const chips = document.createElement('div');
            chips.className = 'saved-metrics';

            errorFields
                .filter((field) => setData[field] > 0)
                .forEach((field) => {
                    const chip = document.createElement('span');
                    chip.className = 'saved-chip';
                    chip.textContent = `${errorLabels[field]}: ${setData[field]}`;
                    chips.appendChild(chip);
                });

            if (!chips.childNodes.length) {
                const chip = document.createElement('span');
                chip.className = 'saved-chip';
                chip.textContent = 'Sin errores registrados';
                chips.appendChild(chip);
            }

            item.appendChild(top);
            item.appendChild(chips);
            savedSetsContainer.appendChild(item);
        });
    }

    function renderSession() {
        playerHeading.textContent = state.jugador || 'Jugador';
        sessionSubtext.textContent = state.archivo
            ? `Archivo activo: ${state.archivo}. Los sets quedan en memoria hasta finalizar el partido.`
            : 'Sesión de scouting lista para capturar errores.';
        renderCounters();
        renderSavedSets();
    }

    function resetCurrentSet() {
        state.counters = createEmptyCounters();
        renderCounters();
    }

    function resetWholeSession(nextMatchId) {
        state.idPartido = nextMatchId;
        state.setActual = 1;
        state.setsGuardados = [];
        state.counters = createEmptyCounters();
        renderSession();
    }

    function resetToIntro() {
        state.jugador = '';
        state.archivo = '';
        state.idPartido = null;
        state.setActual = 1;
        state.counters = createEmptyCounters();
        state.setsGuardados = [];
        showIntroView();
        renderSession();
        setMessage(playerMessage, '', '');
        setMessage(sessionMessage, '', '');
        playerForm.reset();
        playerInput.focus();
    }

    function updateCounter(field, delta) {
        const nextValue = Math.max(0, (state.counters[field] || 0) + delta);
        state.counters[field] = nextValue;
        renderCounters();
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

    async function startSession(event) {
        event.preventDefault();
        if (state.isBusy) {
            return;
        }

        const jugador = playerInput.value.trim();
        if (!jugador) {
            setMessage(playerMessage, 'Introduce un nombre de jugador antes de iniciar.', 'error');
            return;
        }

        try {
            setBusy(true);
            setMessage(playerMessage, 'Preparando sesión y comprobando el histórico del jugador...', '');
            const data = await postJSON('/api/errores/iniciar', { jugador });

            state.jugador = data.jugador;
            state.archivo = data.archivo;
            resetWholeSession(data.id_partido);
            showSessionView();

            setMessage(playerMessage, '', '');
            setMessage(sessionMessage, `Sesión lista. ID Partido ${data.id_partido}.`, 'success');
        } catch (error) {
            setMessage(playerMessage, error.message, 'error');
        } finally {
            setBusy(false);
        }
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
        return true;
    }

    function handleChangeSet() {
        if (state.isBusy) {
            return;
        }

        const saved = saveCurrentSetInMemory();
        if (!saved) {
            setMessage(sessionMessage, 'No hay errores en el set actual para guardar.', 'error');
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

            resetWholeSession(data.siguiente_id_partido);
            setMessage(
                sessionMessage,
                `Partido guardado con ${data.filas_guardadas} set(s). El siguiente ID disponible es ${data.siguiente_id_partido}.`,
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
})();
