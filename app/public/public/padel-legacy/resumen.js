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
    const summaryMobileCards = document.getElementById('summary-mobile-cards');
    const playerSessionStore = window.padelPlayerSession || null;

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
    const kpiEfficiency = document.getElementById('kpi-efficiency');
    const kpiRatio = document.getElementById('kpi-ratio');
    const kpiRightBalance = document.getElementById('kpi-right-balance');
    const kpiLeftBalance = document.getElementById('kpi-left-balance');
    const kpiStability = document.getElementById('kpi-stability');
    const kpiStabilityLabel = document.getElementById('kpi-stability-label');
    const kpiHighCost = document.getElementById('kpi-high-cost');

    const strongPointsList = document.getElementById('strong-points-list');
    const weakPointsList = document.getElementById('weak-points-list');
    const improvementList = document.getElementById('improvement-list');
    const coachingList = document.getElementById('coaching-list');
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
        phaseCompare: {
            canvas: document.getElementById('phase-balance-chart'),
            wrap: document.getElementById('phase-chart-wrap'),
            empty: document.getElementById('phase-chart-empty'),
        },
        handCompare: {
            canvas: document.getElementById('hand-compare-chart'),
            wrap: document.getElementById('hand-chart-wrap'),
            empty: document.getElementById('hand-chart-empty'),
        },
        setTrend: {
            canvas: document.getElementById('set-trend-chart'),
            wrap: document.getElementById('set-trend-wrap'),
            empty: document.getElementById('set-trend-empty'),
        },
        impactBreakdown: {
            canvas: document.getElementById('impact-breakdown-chart'),
            wrap: document.getElementById('impact-chart-wrap'),
            empty: document.getElementById('impact-chart-empty'),
        },
        blockBalance: {
            canvas: document.getElementById('block-balance-chart'),
            wrap: document.getElementById('block-chart-wrap'),
            empty: document.getElementById('block-chart-empty'),
        },
        trainingPriority: {
            canvas: document.getElementById('training-priority-chart'),
            wrap: document.getElementById('priority-chart-wrap'),
            empty: document.getElementById('priority-chart-empty'),
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
        charts: Object.keys(chartRefs).reduce((accumulator, key) => ({ ...accumulator, [key]: null }), {}),
    };

    const chartPalette = {
        text: '#f5f7fb',
        muted: 'rgba(231, 236, 244, 0.78)',
        grid: 'rgba(255, 255, 255, 0.08)',
        gold: '#d8b36a',
        goldSoft: 'rgba(216, 179, 106, 0.28)',
        blue: '#7ba6f6',
        blueSoft: 'rgba(123, 166, 246, 0.28)',
        teal: '#74d59a',
        tealSoft: 'rgba(116, 213, 154, 0.28)',
        danger: '#ff9d91',
        dangerSoft: 'rgba(255, 157, 145, 0.3)',
        slate: '#c8d3e5',
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

    function labelForField(field) {
        return fieldLabels[field] || field.replaceAll('_', ' ');
    }

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

    function formatRatio(value) {
        const numeric = Number(value) || 0;
        return `${formatNumber(numeric, 2)}x`;
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
        clearRememberedPlayer();
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
        if (!chartRef) {
            return;
        }
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
            interaction: {
                mode: 'index',
                intersect: false,
            },
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

    function applyChartTooltips(payload) {
        const tooltips = payload.tooltips_graficas || {};
        document.querySelectorAll('[data-tooltip-key]').forEach((button) => {
            const key = button.getAttribute('data-tooltip-key');
            const tooltip = tooltips[key] || 'Sin explicación disponible para este gráfico.';
            button.dataset.tooltip = tooltip;
            button.setAttribute('aria-label', tooltip);
            button.title = tooltip;
        });
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
        const { kpis, score_jugador: scoreData, metricas_avanzadas: advanced } = payload;

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

        kpiEfficiency.textContent = `${formatNumber(advanced.eficiencia_global, 1)}%`;
        kpiRatio.textContent = formatRatio(advanced.ratio_aciertos_error);
        kpiRightBalance.textContent = formatBalance(advanced.balance_derecha);
        kpiLeftBalance.textContent = formatBalance(advanced.balance_reves);
        kpiStability.textContent = `${formatNumber(advanced.estabilidad_score, 1)}%`;
        kpiStabilityLabel.textContent = advanced.estabilidad_label || 'Sin datos';
        kpiHighCost.textContent = `${formatNumber(advanced.peso_errores_alto_coste, 1)}%`;
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
            title.textContent = itemData.label || itemData.titulo || 'Sin etiqueta';

            const badge = document.createElement('span');
            badge.className = 'insight-value';
            const badgeValue = itemData.valor ?? itemData.impacto ?? '';
            badge.textContent = typeof badgeValue === 'number'
                ? (Number.isInteger(badgeValue) ? `${badgeValue}` : formatNumber(badgeValue, 1))
                : (badgeValue || 'Info');

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

    function getTopRowFields(row, columns, limit) {
        return columns
            .map((field) => ({ field, value: Number(row[field]) || 0 }))
            .filter((item) => item.value > 0)
            .sort((left, right) => right.value - left.value)
            .slice(0, limit)
            .map((item) => ({
                label: labelForField(item.field),
                value: item.value,
            }));
    }

    function renderMobileCards(rows) {
        summaryMobileCards.innerHTML = '';

        if (!rows.length) {
            const emptyCard = document.createElement('article');
            emptyCard.className = 'summary-mobile-card';
            emptyCard.innerHTML = '<p class="muted-text mb-0">No hay sets para este filtro.</p>';
            summaryMobileCards.appendChild(emptyCard);
            return;
        }

        rows.forEach((row) => {
            const topErrors = getTopRowFields(row, ERROR_COLUMNS, 3);
            const topSuccesses = getTopRowFields(row, SUCCESS_COLUMNS, 3);

            const card = document.createElement('article');
            card.className = 'summary-mobile-card';

            const metaBadges = [
                `<span class="summary-mobile-badge">Partido ${row.ID_Partido}</span>`,
                `<span class="summary-mobile-badge">Set ${row.Numero_Set}</span>`,
                `<span class="summary-mobile-badge">Balance ${formatBalance(row.Balance_Set)}</span>`,
            ].join('');

            const errorChips = topErrors.length
                ? topErrors.map((item) => `<span class="summary-mobile-chip is-danger">${item.label} · ${item.value}</span>`).join('')
                : '<span class="summary-mobile-chip">Sin errores</span>';
            const successChips = topSuccesses.length
                ? topSuccesses.map((item) => `<span class="summary-mobile-chip is-success">${item.label} · ${item.value}</span>`).join('')
                : '<span class="summary-mobile-chip">Sin aciertos</span>';

            card.innerHTML = `
                <div class="summary-mobile-top">
                    <div>
                        <h4 class="summary-mobile-title mb-1">Set ${row.Numero_Set}</h4>
                        <div class="summary-mobile-badges">${metaBadges}</div>
                    </div>
                </div>
                <div class="summary-mobile-stats">
                    <div class="summary-mobile-stat">
                        <span class="meta-label">Errores</span>
                        <strong>${formatInteger(row.Total_ENF_Set)}</strong>
                    </div>
                    <div class="summary-mobile-stat">
                        <span class="meta-label">Aciertos</span>
                        <strong>${formatInteger(row.Total_Aciertos_Set)}</strong>
                    </div>
                    <div class="summary-mobile-stat">
                        <span class="meta-label">Balance</span>
                        <strong>${formatBalance(row.Balance_Set)}</strong>
                    </div>
                </div>
                <div class="summary-mobile-block">
                    <span class="kpi-label">Errores dominantes</span>
                    <div class="summary-mobile-chips">${errorChips}</div>
                </div>
                <div class="summary-mobile-block">
                    <span class="kpi-label">Aciertos dominantes</span>
                    <div class="summary-mobile-chips">${successChips}</div>
                </div>
            `;

            summaryMobileCards.appendChild(card);
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
                        angleLines: { color: chartPalette.grid },
                        grid: { color: chartPalette.grid },
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

    function renderGroupedBalanceChart(chartKey, items, labelKey, emptyMessage) {
        const chartRef = chartRefs[chartKey];
        const hasData = items.some((item) => Number(item.errores) > 0 || Number(item.aciertos) > 0 || Number(item.balance) !== 0);

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
                labels: items.map((item) => item[labelKey]),
                datasets: [
                    {
                        label: 'Aciertos',
                        data: items.map((item) => item.aciertos),
                        backgroundColor: chartPalette.tealSoft,
                        borderColor: chartPalette.teal,
                        borderWidth: 1,
                        borderRadius: 10,
                        borderSkipped: false,
                    },
                    {
                        label: 'Errores',
                        data: items.map((item) => item.errores),
                        backgroundColor: chartPalette.dangerSoft,
                        borderColor: chartPalette.danger,
                        borderWidth: 1,
                        borderRadius: 10,
                        borderSkipped: false,
                    },
                    {
                        label: 'Balance',
                        data: items.map((item) => item.balance),
                        backgroundColor: chartPalette.goldSoft,
                        borderColor: chartPalette.gold,
                        borderWidth: 1,
                        borderRadius: 10,
                        borderSkipped: false,
                    },
                ],
            },
            options: baseOptions,
        });
    }

    function renderSetTrendChart(payload) {
        const chartRef = chartRefs.setTrend;
        const items = payload.series_por_set || [];
        const hasData = items.length > 0;

        if (state.charts.setTrend) {
            state.charts.setTrend.destroy();
            state.charts.setTrend = null;
        }

        toggleChartState(chartRef, hasData, 'No hay suficientes sets para trazar la serie temporal.');
        if (!hasData) {
            return;
        }

        const baseOptions = createBaseChartOptions();
        state.charts.setTrend = new Chart(chartRef.canvas, {
            data: {
                labels: items.map((item) => item.clave),
                datasets: [
                    {
                        type: 'bar',
                        label: 'Aciertos',
                        data: items.map((item) => item.aciertos),
                        backgroundColor: chartPalette.tealSoft,
                        borderColor: chartPalette.teal,
                        borderWidth: 1,
                        borderRadius: 10,
                        borderSkipped: false,
                    },
                    {
                        type: 'bar',
                        label: 'Errores',
                        data: items.map((item) => item.errores),
                        backgroundColor: chartPalette.dangerSoft,
                        borderColor: chartPalette.danger,
                        borderWidth: 1,
                        borderRadius: 10,
                        borderSkipped: false,
                    },
                    {
                        type: 'line',
                        label: 'Balance',
                        data: items.map((item) => item.balance),
                        borderColor: chartPalette.gold,
                        backgroundColor: chartPalette.goldSoft,
                        tension: 0.28,
                        pointRadius: 3,
                        pointHoverRadius: 4,
                        yAxisID: 'y',
                    },
                ],
            },
            options: baseOptions,
        });
    }

    function renderImpactBreakdownChart(payload) {
        const chartRef = chartRefs.impactBreakdown;
        const items = (payload.metricas_avanzadas && payload.metricas_avanzadas.impacto_desglosado) || [];
        const hasData = items.some((item) => Number(item.puntos) > 0);

        if (state.charts.impactBreakdown) {
            state.charts.impactBreakdown.destroy();
            state.charts.impactBreakdown = null;
        }

        toggleChartState(chartRef, hasData, 'No hay suficiente impacto acumulado para este gráfico.');
        if (!hasData) {
            return;
        }

        const baseOptions = createBaseChartOptions();
        state.charts.impactBreakdown = new Chart(chartRef.canvas, {
            type: 'bar',
            data: {
                labels: items.map((item) => item.categoria),
                datasets: [{
                    label: 'Puntos ponderados',
                    data: items.map((item) => item.puntos),
                    backgroundColor: items.map((item) => (
                        item.tipo === 'acierto' ? chartPalette.goldSoft : chartPalette.dangerSoft
                    )),
                    borderColor: items.map((item) => (
                        item.tipo === 'acierto' ? chartPalette.gold : chartPalette.danger
                    )),
                    borderWidth: 1,
                    borderRadius: 10,
                    borderSkipped: false,
                }],
            },
            options: {
                ...baseOptions,
                indexAxis: 'y',
                plugins: {
                    ...baseOptions.plugins,
                    legend: { display: false },
                },
                scales: {
                    y: {
                        ticks: { color: chartPalette.muted },
                        grid: { display: false },
                        border: { display: false },
                    },
                    x: baseOptions.scales.y,
                },
            },
        });
    }

    function renderTrainingPriorityChart(payload) {
        const chartRef = chartRefs.trainingPriority;
        const items = payload.prioridades_entrenamiento || [];
        const hasData = items.length > 0;

        if (state.charts.trainingPriority) {
            state.charts.trainingPriority.destroy();
            state.charts.trainingPriority = null;
        }

        toggleChartState(chartRef, hasData, 'No hay errores suficientes para fijar prioridades de entrenamiento.');
        if (!hasData) {
            return;
        }

        const baseOptions = createBaseChartOptions();
        state.charts.trainingPriority = new Chart(chartRef.canvas, {
            type: 'bar',
            data: {
                labels: items.map((item) => item.titulo),
                datasets: [{
                    label: 'Impacto correctivo',
                    data: items.map((item) => item.impacto),
                    backgroundColor: ['rgba(255, 157, 145, 0.36)', 'rgba(216, 179, 106, 0.36)', 'rgba(123, 166, 246, 0.36)'],
                    borderColor: [chartPalette.danger, chartPalette.gold, chartPalette.blue],
                    borderWidth: 1,
                    borderRadius: 10,
                    borderSkipped: false,
                }],
            },
            options: {
                ...baseOptions,
                indexAxis: 'y',
                plugins: {
                    ...baseOptions.plugins,
                    legend: { display: false },
                },
                scales: {
                    y: {
                        ticks: { color: chartPalette.muted },
                        grid: { display: false },
                        border: { display: false },
                    },
                    x: baseOptions.scales.y,
                },
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
                        backgroundColor: chartPalette.tealSoft,
                        borderColor: chartPalette.teal,
                        borderWidth: 1,
                        borderRadius: 10,
                        borderSkipped: false,
                    },
                    {
                        type: 'bar',
                        label: 'Errores',
                        data: series.map((item) => item.total_errores),
                        backgroundColor: chartPalette.dangerSoft,
                        borderColor: chartPalette.danger,
                        borderWidth: 1,
                        borderRadius: 10,
                        borderSkipped: false,
                    },
                    {
                        type: 'line',
                        label: 'Balance',
                        data: series.map((item) => item.balance_neto),
                        borderColor: chartPalette.gold,
                        backgroundColor: chartPalette.goldSoft,
                        tension: 0.28,
                        pointRadius: 3,
                        pointHoverRadius: 4,
                    },
                ],
            },
            options: baseOptions,
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
        renderGroupedBalanceChart(
            'phaseCompare',
            payload.comparativa_fases || [],
            'fase',
            'No hay suficientes datos por fase en este filtro.'
        );
        renderGroupedBalanceChart(
            'handCompare',
            payload.comparativa_manos || [],
            'mano',
            'No hay suficientes datos para comparar manos.'
        );
        renderSetTrendChart(payload);
        renderImpactBreakdownChart(payload);
        renderGroupedBalanceChart(
            'blockBalance',
            payload.balance_por_bloque || [],
            'bloque',
            'No hay suficientes datos para comparar bloques.'
        );
        renderTrainingPriorityChart(payload);
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
        applyChartTooltips(payload);
        renderProfile(payload);
        renderKPIs(payload);
        renderCharts(payload);
        renderInsightList(
            strongPointsList,
            payload.insights.fortalezas_consolidadas || payload.insights.puntos_fuertes,
            'Todavía no hay suficientes acciones ganadoras para identificar fortalezas.'
        );
        renderInsightList(
            weakPointsList,
            payload.insights.vulnerabilidades_especificas || payload.insights.puntos_flojos,
            'No hay errores registrados en este filtro.'
        );
        renderInsightList(
            improvementList,
            payload.insights.prioridades_entrenamiento || payload.insights.areas_mejora,
            'Todavía no hay suficientes datos para definir mejoras prioritarias.'
        );
        renderInsightList(
            coachingList,
            payload.insights.coaching_notes || [],
            'Todavía no hay suficiente histórico para una lectura táctica estable.'
        );
        globalComment.textContent = payload.insights.comentario_global || '';
        globalComment.classList.toggle('hidden', !payload.insights.comentario_global);
        renderTable(payload.filas_filtradas);
        renderMobileCards(payload.filas_filtradas);
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
            rememberActivePlayer(result.data.jugador || jugador);
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

    if (playerSessionStore) {
        const storedPlayer = playerSessionStore.read();
        if (storedPlayer && storedPlayer.jugador) {
            summaryInput.value = storedPlayer.jugador;
            loadSummary(storedPlayer.jugador, 'all', 'all');
        }
    }
})();
