(function () {
    const summaryIntro = document.getElementById('summary-intro');
    const summaryForm = document.getElementById('summary-form');
    const summaryInput = document.getElementById('summary-jugador-input');
    const summaryMessage = document.getElementById('summary-message');
    const dashboardLayout = document.getElementById('dashboard-layout');
    const dashboardBody = document.getElementById('dashboard-body');
    const dashboardEmpty = document.getElementById('dashboard-empty');
    const dashboardEmptyCopy = document.getElementById('dashboard-empty-copy');
    const summaryPlayerHeading = document.getElementById('summary-player-heading');
    const summaryContext = document.getElementById('summary-context');
    const matchFilter = document.getElementById('match-filter');
    const setFilter = document.getElementById('set-filter');
    const loadSummaryButton = document.getElementById('load-summary-btn');
    const changeSummaryPlayerButton = document.getElementById('change-summary-player-btn');
    const rowsBody = document.getElementById('summary-rows');
    const weakPointsList = document.getElementById('weak-points-list');
    const improvementList = document.getElementById('improvement-list');
    const blockComment = document.getElementById('block-comment');

    const kpiPartidos = document.getElementById('kpi-partidos');
    const kpiSets = document.getElementById('kpi-sets');
    const kpiTotal = document.getElementById('kpi-total');
    const kpiMedia = document.getElementById('kpi-media');
    const kpiError = document.getElementById('kpi-error');
    const kpiBloque = document.getElementById('kpi-bloque');

    const chartCanvas = {
        errorType: document.getElementById('error-type-chart'),
        block: document.getElementById('block-chart'),
        match: document.getElementById('match-chart'),
    };

    const state = {
        jugador: '',
        isBusy: false,
        charts: {
            errorType: null,
            block: null,
            match: null,
        },
    };

    function setMessage(message, type) {
        summaryMessage.textContent = message || '';
        summaryMessage.className = 'status-message';
        if (type) {
            summaryMessage.classList.add(`is-${type}`);
        }
    }

    function setBusy(isBusy) {
        state.isBusy = isBusy;
        loadSummaryButton.disabled = isBusy;
        matchFilter.disabled = isBusy || matchFilter.options.length <= 1;
        setFilter.disabled = isBusy || setFilter.options.length <= 1;
        changeSummaryPlayerButton.disabled = isBusy;
    }

    function destroyCharts() {
        Object.keys(state.charts).forEach((key) => {
            if (state.charts[key]) {
                state.charts[key].destroy();
                state.charts[key] = null;
            }
        });
    }

    function showDashboardShell() {
        summaryIntro.classList.add('hidden');
        dashboardLayout.classList.remove('hidden');
    }

    function showIntroView() {
        summaryIntro.classList.remove('hidden');
        dashboardLayout.classList.add('hidden');
        dashboardEmpty.classList.add('hidden');
        dashboardBody.classList.remove('hidden');
        summaryForm.reset();
        setMessage('', '');
        destroyCharts();
        matchFilter.innerHTML = '<option value="all">Todos</option>';
        setFilter.innerHTML = '<option value="all">Todos</option>';
        matchFilter.disabled = true;
        setFilter.disabled = true;
        state.jugador = '';
        summaryInput.focus();
    }

    function showEmpty(message) {
        dashboardLayout.classList.remove('hidden');
        dashboardEmpty.classList.remove('hidden');
        dashboardBody.classList.add('hidden');
        dashboardEmptyCopy.textContent = message;
        destroyCharts();
    }

    function showDashboardBody() {
        dashboardLayout.classList.remove('hidden');
        dashboardEmpty.classList.add('hidden');
        dashboardBody.classList.remove('hidden');
    }

    function populateSelect(select, values, selectedValue, formatter) {
        select.innerHTML = '';

        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'Todos';
        select.appendChild(allOption);

        values.forEach((value) => {
            const option = document.createElement('option');
            option.value = String(value);
            option.textContent = formatter(value);
            select.appendChild(option);
        });

        select.value = values.map(String).includes(String(selectedValue)) || selectedValue === 'all'
            ? String(selectedValue)
            : 'all';

        select.disabled = state.isBusy || select.options.length <= 1;
    }

    function buildContextText(filters) {
        if (filters.id_partido === 'all' && filters.numero_set === 'all') {
            return 'Resumen global de todo el histórico del jugador.';
        }
        if (filters.id_partido !== 'all' && filters.numero_set === 'all') {
            return `Análisis del Partido ${filters.id_partido} con todos sus sets.`;
        }
        if (filters.id_partido === 'all' && filters.numero_set !== 'all') {
            return `Análisis transversal del Set ${filters.numero_set} a través de todos los partidos.`;
        }
        return `Análisis del Partido ${filters.id_partido} · Set ${filters.numero_set}.`;
    }

    function renderKPIs(payload) {
        const { kpis } = payload;
        kpiPartidos.textContent = kpis.partidos_analizados;
        kpiSets.textContent = kpis.sets_analizados;
        kpiTotal.textContent = kpis.total_errores_no_forzados;
        kpiMedia.textContent = kpis.media_por_set;
        kpiError.textContent = kpis.error_mas_repetido.valor
            ? `${kpis.error_mas_repetido.label} · ${kpis.error_mas_repetido.valor}`
            : 'Sin datos';
        kpiBloque.textContent = kpis.bloque_mas_debil.valor
            ? `${kpis.bloque_mas_debil.label} · ${kpis.bloque_mas_debil.valor}`
            : kpis.bloque_mas_debil.label;
    }

    function renderInsightList(container, items, isImprovementList) {
        container.innerHTML = '';

        if (!items.length) {
            const item = document.createElement('div');
            item.className = 'insight-item';
            item.innerHTML = '<p class="muted-text">No hay suficientes datos para generar recomendaciones.</p>';
            container.appendChild(item);
            return;
        }

        items.forEach((itemData) => {
            const item = document.createElement('article');
            item.className = 'insight-item';

            const top = document.createElement('div');
            top.className = 'saved-set-top';

            const title = document.createElement('h4');
            title.className = 'insight-title';
            title.textContent = itemData.label;

            top.appendChild(title);

            if (!isImprovementList && typeof itemData.valor === 'number') {
                const value = document.createElement('span');
                value.className = 'insight-value';
                value.textContent = `${itemData.valor} errores`;
                top.appendChild(value);
            }

            const copy = document.createElement('p');
            copy.className = 'insight-copy';
            copy.textContent = itemData.detalle;

            item.appendChild(top);
            item.appendChild(copy);
            container.appendChild(item);
        });
    }

    function renderTable(rows) {
        rowsBody.innerHTML = '';

        rows.forEach((row) => {
            const tr = document.createElement('tr');
            [
                row.ID_Partido,
                row.Numero_Set,
                row.Doble_Falta,
                row.Resto_Derecha_Fallado,
                row.Resto_Reves_Fallado,
                row.Globo_Malo,
                row.Error_Fondo_Derecha,
                row.Error_Fondo_Reves,
                row.Error_Volea_Derecha,
                row.Error_Volea_Reves,
                row.Bandeja_Error,
                row.Smash_Error,
                row.Total_ENF_Set,
            ].forEach((value) => {
                const td = document.createElement('td');
                td.textContent = value;
                tr.appendChild(td);
            });
            rowsBody.appendChild(tr);
        });
    }

    function renderCharts(payload) {
        destroyCharts();

        state.charts.errorType = new Chart(chartCanvas.errorType, {
            type: 'bar',
            data: {
                labels: payload.errores_por_tipo.map((item) => item.label),
                datasets: [{
                    label: 'Errores',
                    data: payload.errores_por_tipo.map((item) => item.total),
                    backgroundColor: [
                        '#215732',
                        '#2f7143',
                        '#3e8b55',
                        '#59a169',
                        '#c95d29',
                        '#d86f39',
                        '#e6864f',
                        '#f1a55c',
                        '#8b3d20',
                        '#5f2a14',
                    ],
                    borderRadius: 10,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 },
                    },
                },
                plugins: {
                    legend: { display: false },
                },
            },
        });

        state.charts.block = new Chart(chartCanvas.block, {
            type: 'doughnut',
            data: {
                labels: payload.errores_por_bloque.map((item) => item.bloque),
                datasets: [{
                    data: payload.errores_por_bloque.map((item) => item.total),
                    backgroundColor: ['#215732', '#c95d29'],
                    borderWidth: 0,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                },
            },
        });

        state.charts.match = new Chart(chartCanvas.match, {
            type: 'line',
            data: {
                labels: payload.series_por_partido.map((item) => `Partido ${item.id_partido}`),
                datasets: [{
                    label: 'Total ENF',
                    data: payload.series_por_partido.map((item) => item.total_errores),
                    borderColor: '#215732',
                    backgroundColor: 'rgba(33, 87, 50, 0.16)',
                    fill: true,
                    tension: 0.32,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 },
                    },
                },
            },
        });
    }

    function renderDashboard(payload) {
        summaryPlayerHeading.textContent = payload.jugador;
        summaryContext.textContent = buildContextText(payload.filtros_aplicados);

        populateSelect(
            matchFilter,
            payload.filtros_disponibles.partidos,
            payload.filtros_aplicados.id_partido,
            (value) => `Partido ${value}`
        );
        populateSelect(
            setFilter,
            payload.filtros_disponibles.sets,
            payload.filtros_aplicados.numero_set,
            (value) => `Set ${value}`
        );

        if (!payload.filas_filtradas.length) {
            showEmpty('El jugador existe, pero el filtro actual no devuelve sets. Ajusta Partido o Set para recuperar datos.');
            return;
        }

        showDashboardBody();
        renderKPIs(payload);
        renderCharts(payload);
        renderInsightList(weakPointsList, payload.insights.puntos_flojos, false);
        renderInsightList(improvementList, payload.insights.areas_mejora, true);
        blockComment.textContent = payload.insights.comentario_bloque;
        renderTable(payload.filas_filtradas);
    }

    async function fetchSummary(jugador, idPartido, numeroSet) {
        const params = new URLSearchParams({
            jugador,
            id_partido: idPartido,
            numero_set: numeroSet,
        });

        const response = await fetch(`/api/resumen?${params.toString()}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
                data,
            };
        }

        return {
            ok: true,
            status: response.status,
            data,
        };
    }

    async function loadSummary(jugador, idPartido, numeroSet) {
        if (state.isBusy) {
            return;
        }

        try {
            setBusy(true);
            state.jugador = jugador;
            showDashboardShell();
            summaryPlayerHeading.textContent = jugador;
            summaryContext.textContent = 'Consultando histórico del jugador...';
            setMessage('Cargando resumen del jugador...', '');

            const result = await fetchSummary(jugador, idPartido, numeroSet);

            if (!result.ok) {
                const message = result.data.message || 'No se pudo cargar el resumen del jugador.';
                summaryContext.textContent = message;
                showEmpty(message);
                setMessage(message, 'error');
                return;
            }

            renderDashboard(result.data);
            setMessage('Resumen cargado correctamente.', 'success');
        } catch (error) {
            const message = error.message || 'No se pudo cargar el resumen del jugador.';
            summaryContext.textContent = message;
            showEmpty(message);
            setMessage(message, 'error');
        } finally {
            setBusy(false);
        }
    }

    summaryForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const jugador = summaryInput.value.trim();
        if (!jugador) {
            setMessage('Introduce un nombre de jugador para cargar el resumen.', 'error');
            return;
        }

        loadSummary(jugador, 'all', 'all');
    });

    matchFilter.addEventListener('change', () => {
        if (!state.jugador) {
            return;
        }
        loadSummary(state.jugador, matchFilter.value, 'all');
    });

    setFilter.addEventListener('change', () => {
        if (!state.jugador) {
            return;
        }
        loadSummary(state.jugador, matchFilter.value, setFilter.value);
    });

    changeSummaryPlayerButton.addEventListener('click', showIntroView);
})();
