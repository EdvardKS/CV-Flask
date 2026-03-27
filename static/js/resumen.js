(function () {
    const config = window.resumenConfig || {};
    const fieldLabels = config.fieldLabels || {};

    const ERROR_COLUMNS = [
        'Doble_Falta',
        'Resto_Derecha_Fallado',
        'Resto_Reves_Fallado',
        'Globo_Malo',
        'Error_Fondo_Derecha',
        'Error_Fondo_Reves',
        'Bajada_Derecha_Error',
        'Bajada_Reves_Error',
        'Posicionamiento_Fondo_Error',
        'Error_Volea_Derecha',
        'Error_Volea_Reves',
        'Posicionamiento_Volea_Error',
        'Tirar_Ficha_Error',
        'Bandeja_Error',
        'Smash_Error',
    ];

    const SUCCESS_COLUMNS = [
        'Winner_Derecha',
        'Winner_Reves',
        'Resto_Ganador_Derecha',
        'Resto_Ganador_Reves',
        'Globo_De_Oro',
        'Chiquita_Ganadora',
        'Bajada_De_Pared',
        'Remate_Finalizador',
        'Volea_Derecha_Ganadora',
        'Volea_Reves_Ganadora',
        'Bandeja_Vibora_Definitiva',
        'Volea_Bloqueo_Contraataque',
        'Dormilona',
    ];

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

    const playerScoreValue = document.getElementById('player-score-value');
    const playerScoreLevel = document.getElementById('player-score-level');
    const playerNetImpact = document.getElementById('player-net-impact');
    const playerArchetype = document.getElementById('player-archetype');
    const playerProfileDescription = document.getElementById('player-profile-description');
    const playerDominantArea = document.getElementById('player-dominant-area');
    const playerVolume = document.getElementById('player-volume');
    const playerTopSuccess = document.getElementById('player-top-success');
    const playerTopError = document.getElementById('player-top-error');

    const kpiTotalSuccesses = document.getElementById('kpi-total-successes');
    const kpiTotalErrors = document.getElementById('kpi-total-errors');
    const kpiBalance = document.getElementById('kpi-balance');
    const kpiScore = document.getElementById('kpi-score');
    const kpiScoreLevel = document.getElementById('kpi-score-level');
    const kpiSuccessRate = document.getElementById('kpi-success-rate');
    const kpiErrorRate = document.getElementById('kpi-error-rate');
    const kpiTopSuccess = document.getElementById('kpi-top-success');
    const kpiTopError = document.getElementById('kpi-top-error');

    const strongPointsList = document.getElementById('strong-points-list');
    const weakPointsList = document.getElementById('weak-points-list');
    const improvementList = document.getElementById('improvement-list');
    const globalComment = document.getElementById('global-comment');
    const rowsBody = document.getElementById('summary-rows');

    const chartRefs = {
        profileRadar: {
            canvas: document.getElementById('profile-radar-chart'),
            wrap: document.getElementById('profile-radar-wrap'),
            empty: document.getElementById('profile-radar-empty'),
        },
        errorType: {
            canvas: document.getElementById('error-type-chart'),
            wrap: document.getElementById('error-chart-wrap'),
            empty: document.getElementById('error-chart-empty'),
        },
        successType: {
            canvas: document.getElementById('success-type-chart'),
            wrap: document.getElementById('success-chart-wrap'),
            empty: document.getElementById('success-chart-empty'),
        },
        blockBalance: {
            canvas: document.getElementById('block-balance-chart'),
            wrap: document.getElementById('block-chart-wrap'),
            empty: document.getElementById('block-chart-empty'),
        },
        matchCompare: {
            canvas: document.getElementById('match-chart'),
            wrap: document.getElementById('match-chart-wrap'),
            empty: document.getElementById('match-chart-empty'),
        },
    };

    const state = {
        jugador: '',
        isBusy: false,
        charts: {
            profileRadar: null,
            errorType: null,
            successType: null,
            blockBalance: null,
            matchCompare: null,
        },
    };

    const chartPalette = {
        text: '#f5f7fb',
        muted: 'rgba(231, 236, 244, 0.78)',
        grid: 'rgba(255, 255, 255, 0.08)',
        gold: '#d8b36a',
        goldSoft: 'rgba(216, 179, 106, 0.3)',
        blue: '#7ba6f6',
        blueSoft: 'rgba(123, 166, 246, 0.24)',
        slate: '#c8d3e5',
        danger: '#ff8f8f',
        success: '#74d59a',
        errorBars: [
            '#ff9a76',
            '#ffb088',
            '#ffc39a',
            '#f0ae67',
            '#cf8b4a',
            '#c47738',
            '#e2a861',
            '#b96d43',
            '#b08968',
            '#c57f73',
            '#f6b89a',
            '#dc9868',
            '#c96f5f',
            '#da8d50',
            '#b85545',
        ],
        successBars: [
            '#d8b36a',
            '#e4c686',
            '#f0d9a2',
            '#8bb6ff',
            '#6d9ef2',
            '#5c8be1',
            '#87db9f',
            '#74d59a',
            '#5fc487',
            '#d9bf73',
            '#b6d594',
            '#87c8e1',
            '#f1e0bc',
        ],
    };

    function formatNumber(value, digits = 1) {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: Number.isInteger(value) ? 0 : Math.min(1, digits),
            maximumFractionDigits: digits,
        }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
    }

    function formatInteger(value) {
        return new Intl.NumberFormat('es-ES', {
            maximumFractionDigits: 0,
        }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
    }

    function formatBalance(value) {
        const numeric = Number(value) || 0;
        if (numeric > 0) {
            return `+${formatNumber(numeric, 1)}`;
        }
        return formatNumber(numeric, 1);
    }

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
        changeSummaryPlayerButton.disabled = isBusy;
        matchFilter.disabled = isBusy || matchFilter.options.length <= 1;
        setFilter.disabled = isBusy || setFilter.options.length <= 1;
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

        const nextValue = values.map(String).includes(String(selectedValue)) || selectedValue === 'all'
            ? String(selectedValue)
            : 'all';

        select.value = nextValue;
        select.disabled = state.isBusy || select.options.length <= 1;
    }

    function buildContextText(filters) {
        if (filters.id_partido === 'all' && filters.numero_set === 'all') {
            return 'Perfil global de todo el histórico del jugador.';
        }
        if (filters.id_partido !== 'all' && filters.numero_set === 'all') {
            return `Análisis del Partido ${filters.id_partido} con todos sus sets.`;
        }
        if (filters.id_partido === 'all' && filters.numero_set !== 'all') {
            return `Lectura transversal del Set ${filters.numero_set} en todos los partidos del jugador.`;
        }
        return `Análisis del Partido ${filters.id_partido} · Set ${filters.numero_set}.`;
    }

    function toggleChartState(chartRef, hasData, emptyMessage) {
        chartRef.wrap.classList.toggle('hidden', !hasData);
        chartRef.empty.classList.toggle('hidden', hasData);
        if (!hasData && emptyMessage) {
            chartRef.empty.textContent = emptyMessage;
        }
    }

    function createBaseChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: chartPalette.text,
                        boxWidth: 12,
                        boxHeight: 12,
                    },
                },
                tooltip: {
                    backgroundColor: 'rgba(6, 16, 30, 0.96)',
                    titleColor: chartPalette.text,
                    bodyColor: chartPalette.text,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    borderWidth: 1,
                },
            },
            scales: {
                y: {
                    ticks: {
                        color: chartPalette.muted,
                        precision: 0,
                    },
                    grid: {
                        color: chartPalette.grid,
                    },
                    border: {
                        display: false,
                    },
                },
                x: {
                    ticks: {
                        color: chartPalette.muted,
                    },
                    grid: {
                        display: false,
                    },
                    border: {
                        display: false,
                    },
                },
            },
        };
    }

    function renderProfile(payload) {
        const { perfil_jugador: profile, score_jugador: scoreData, kpis } = payload;
        const topSuccess = kpis.acierto_mas_repetido;
        const topError = kpis.error_mas_repetido;

        playerScoreValue.textContent = formatNumber(scoreData.score, 1);
        playerScoreLevel.textContent = scoreData.nivel || 'Sin datos';
        playerNetImpact.textContent = `Impacto neto ${formatBalance(scoreData.impacto_neto)}`;
        playerArchetype.textContent = profile.arquetipo || 'Sin datos';
        playerProfileDescription.textContent = profile.descripcion || 'Sin datos suficientes para definir el perfil.';
        playerDominantArea.textContent = profile.area_dominante || 'Sin datos';
        playerVolume.textContent = `${kpis.partidos_analizados} / ${kpis.sets_analizados}`;
        playerTopSuccess.textContent = topSuccess.valor ? `${topSuccess.label} · ${topSuccess.valor}` : 'Sin datos';
        playerTopError.textContent = topError.valor ? `${topError.label} · ${topError.valor}` : 'Sin datos';
    }

    function renderKPIs(payload) {
        const { kpis, score_jugador: scoreData } = payload;

        kpiTotalSuccesses.textContent = formatInteger(kpis.total_aciertos);
        kpiTotalErrors.textContent = formatInteger(kpis.total_errores_no_forzados);
        kpiBalance.textContent = formatBalance(kpis.balance_neto);
        kpiScore.textContent = formatNumber(scoreData.score, 1);
        kpiScoreLevel.textContent = scoreData.nivel || 'Sin datos';
        kpiSuccessRate.textContent = formatNumber(kpis.media_aciertos_por_set, 2);
        kpiErrorRate.textContent = formatNumber(kpis.media_errores_por_set, 2);
        kpiTopSuccess.textContent = kpis.acierto_mas_repetido.valor
            ? `Acierto top: ${kpis.acierto_mas_repetido.label} · ${kpis.acierto_mas_repetido.valor}`
            : 'Acierto top: sin datos';
        kpiTopError.textContent = kpis.error_mas_repetido.valor
            ? `Error crítico: ${kpis.error_mas_repetido.label} · ${kpis.error_mas_repetido.valor}`
            : 'Error crítico: sin datos';
    }

    function renderInsightList(container, items, emptyMessage) {
        container.innerHTML = '';

        if (!items || !items.length) {
            const item = document.createElement('article');
            item.className = 'insight-item';
            item.innerHTML = `<p class="muted-text mb-0">${emptyMessage}</p>`;
            container.appendChild(item);
            return;
        }

        items.forEach((itemData) => {
            const item = document.createElement('article');
            item.className = 'insight-item';

            const top = document.createElement('div');
            top.className = 'insight-item-top';

            const title = document.createElement('h4');
            title.className = 'insight-title';
            title.textContent = itemData.label || 'Sin etiqueta';

            const badge = document.createElement('span');
            badge.className = 'insight-value';
            badge.textContent = typeof itemData.valor === 'number'
                ? `${itemData.valor}`
                : 'Clave';

            const copy = document.createElement('p');
            copy.className = 'insight-copy';
            copy.textContent = itemData.detalle || 'Sin detalle disponible.';

            top.appendChild(title);
            top.appendChild(badge);
            item.appendChild(top);
            item.appendChild(copy);
            container.appendChild(item);
        });
    }

    function renderTable(rows) {
        rowsBody.innerHTML = '';

        rows.forEach((row) => {
            const tr = document.createElement('tr');
            const values = [
                row.ID_Partido,
                row.Numero_Set,
                ...ERROR_COLUMNS.map((field) => row[field]),
                ...SUCCESS_COLUMNS.map((field) => row[field]),
                row.Total_ENF_Set,
                row.Total_Aciertos_Set,
                row.Balance_Set,
            ];

            values.forEach((value, index) => {
                const td = document.createElement('td');
                td.textContent = index === values.length - 1 ? formatBalance(value) : value;
                tr.appendChild(td);
            });

            rowsBody.appendChild(tr);
        });
    }

    function renderProfileRadar(payload) {
        const chartRef = chartRefs.profileRadar;
        const areas = (payload.perfil_jugador && payload.perfil_jugador.areas) || [];
        const hasData = areas.some((item) => Number(item.aciertos) > 0 || Number(item.errores) > 0);

        if (state.charts.profileRadar) {
            state.charts.profileRadar.destroy();
            state.charts.profileRadar = null;
        }

        toggleChartState(chartRef, hasData, 'No hay suficientes datos para trazar el perfil del jugador.');
        if (!hasData) {
            return;
        }

        state.charts.profileRadar = new Chart(chartRef.canvas, {
            type: 'radar',
            data: {
                labels: areas.map((item) => item.area),
                datasets: [{
                    label: 'Score por área',
                    data: areas.map((item) => item.score),
                    backgroundColor: chartPalette.goldSoft,
                    borderColor: chartPalette.gold,
                    pointBackgroundColor: chartPalette.gold,
                    pointBorderColor: chartPalette.text,
                    pointRadius: 3,
                    borderWidth: 2,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(6, 16, 30, 0.96)',
                        titleColor: chartPalette.text,
                        bodyColor: chartPalette.text,
                    },
                },
                scales: {
                    r: {
                        angleLines: {
                            color: chartPalette.grid,
                        },
                        grid: {
                            color: chartPalette.grid,
                        },
                        pointLabels: {
                            color: chartPalette.text,
                            font: { size: 12, weight: '700' },
                        },
                        suggestedMin: 0,
                        suggestedMax: 100,
                        ticks: {
                            display: false,
                            stepSize: 20,
                        },
                    },
                },
            },
        });
    }

    function renderCategoryChart(chartKey, items, datasetLabel, colors, emptyMessage) {
        const chartRef = chartRefs[chartKey];
        const hasData = items.some((item) => Number(item.total) > 0);

        if (state.charts[chartKey]) {
            state.charts[chartKey].destroy();
            state.charts[chartKey] = null;
        }

        toggleChartState(chartRef, hasData, emptyMessage);
        if (!hasData) {
            return;
        }

        const baseOptions = createBaseChartOptions();
        state.charts[chartKey] = new Chart(chartRef.canvas, {
            type: 'bar',
            data: {
                labels: items.map((item) => item.label),
                datasets: [{
                    label: datasetLabel,
                    data: items.map((item) => item.total),
                    backgroundColor: items.map((_, index) => colors[index % colors.length]),
                    borderRadius: 10,
                    borderSkipped: false,
                    maxBarThickness: 28,
                }],
            },
            options: {
                ...baseOptions,
                plugins: {
                    ...baseOptions.plugins,
                    legend: { display: false },
                },
                scales: {
                    ...baseOptions.scales,
                    x: {
                        ...baseOptions.scales.x,
                        ticks: {
                            ...baseOptions.scales.x.ticks,
                            maxRotation: 40,
                            minRotation: 40,
                        },
                    },
                },
            },
        });
    }

    function renderBlockBalanceChart(payload) {
        const chartRef = chartRefs.blockBalance;
        const items = payload.balance_por_bloque || [];
        const hasData = items.some((item) => item.errores > 0 || item.aciertos > 0);

        if (state.charts.blockBalance) {
            state.charts.blockBalance.destroy();
            state.charts.blockBalance = null;
        }

        toggleChartState(chartRef, hasData, 'No hay suficientes datos para comparar bloques.');
        if (!hasData) {
            return;
        }

        const baseOptions = createBaseChartOptions();
        state.charts.blockBalance = new Chart(chartRef.canvas, {
            type: 'bar',
            data: {
                labels: items.map((item) => item.bloque),
                datasets: [
                    {
                        label: 'Aciertos',
                        data: items.map((item) => item.aciertos),
                        backgroundColor: 'rgba(116, 213, 154, 0.72)',
                        borderRadius: 10,
                        borderSkipped: false,
                    },
                    {
                        label: 'Errores',
                        data: items.map((item) => item.errores),
                        backgroundColor: 'rgba(255, 143, 143, 0.72)',
                        borderRadius: 10,
                        borderSkipped: false,
                    },
                    {
                        label: 'Balance',
                        data: items.map((item) => item.balance),
                        backgroundColor: 'rgba(216, 179, 106, 0.72)',
                        borderRadius: 10,
                        borderSkipped: false,
                    },
                ],
            },
            options: {
                ...baseOptions,
            },
        });
    }

    function renderMatchChart(payload) {
        const chartRef = chartRefs.matchCompare;
        const series = payload.series_por_partido || [];
        const hasData = series.length > 1;

        if (state.charts.matchCompare) {
            state.charts.matchCompare.destroy();
            state.charts.matchCompare = null;
        }

        toggleChartState(chartRef, hasData, 'No hay suficientes datos para comparar');
        if (!hasData) {
            return;
        }

        const baseOptions = createBaseChartOptions();
        state.charts.matchCompare = new Chart(chartRef.canvas, {
            data: {
                labels: series.map((item) => `Partido ${item.id_partido}`),
                datasets: [
                    {
                        type: 'bar',
                        label: 'Aciertos',
                        data: series.map((item) => item.total_aciertos),
                        backgroundColor: 'rgba(116, 213, 154, 0.68)',
                        borderRadius: 10,
                        borderSkipped: false,
                    },
                    {
                        type: 'bar',
                        label: 'Errores',
                        data: series.map((item) => item.total_errores),
                        backgroundColor: 'rgba(255, 143, 143, 0.68)',
                        borderRadius: 10,
                        borderSkipped: false,
                    },
                    {
                        type: 'line',
                        label: 'Balance',
                        data: series.map((item) => item.balance_neto),
                        borderColor: chartPalette.gold,
                        backgroundColor: chartPalette.goldSoft,
                        fill: false,
                        tension: 0.28,
                        pointRadius: 3,
                        pointHoverRadius: 4,
                    },
                ],
            },
            options: {
                ...baseOptions,
            },
        });
    }

    function renderCharts(payload) {
        renderProfileRadar(payload);
        renderCategoryChart(
            'errorType',
            payload.errores_por_tipo || [],
            'Errores',
            chartPalette.errorBars,
            'No hay errores registrados en este filtro.'
        );
        renderCategoryChart(
            'successType',
            payload.aciertos_por_tipo || [],
            'Aciertos',
            chartPalette.successBars,
            'No hay aciertos registrados en este filtro.'
        );
        renderBlockBalanceChart(payload);
        renderMatchChart(payload);
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
        destroyCharts();
        renderProfile(payload);
        renderKPIs(payload);
        renderCharts(payload);
        renderInsightList(strongPointsList, payload.insights.puntos_fuertes, 'Todavía no hay suficientes acciones ganadoras para identificar fortalezas.');
        renderInsightList(weakPointsList, payload.insights.puntos_flojos, 'No hay errores registrados en este filtro.');
        renderInsightList(improvementList, payload.insights.areas_mejora, 'Todavía no hay suficientes datos para definir mejoras prioritarias.');
        globalComment.textContent = payload.insights.comentario_global || '';
        globalComment.classList.toggle('hidden', !payload.insights.comentario_global);
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
            return { ok: false, status: response.status, data };
        }

        return { ok: true, status: response.status, data };
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
