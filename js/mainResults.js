// LOCA-bench leaderboard rendering

let leaderboardData = null;
let accuracyChart = null;

const sortState = { field: '256000', direction: 'desc' };
const cmSortState = { field: 'accuracy', direction: 'desc' };

// Color palette for chart lines
const MODEL_COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#e11d48'
];

function loadLeaderboardData() {
    if (!leaderboardData) {
        const dataScript = document.getElementById('leaderboard-data');
        if (dataScript) {
            leaderboardData = JSON.parse(dataScript.textContent);
        }
    }
    return leaderboardData;
}

// Format env length for display: "8000" -> "8K"
function formatEnvLength(val) {
    const num = parseInt(val);
    if (num >= 1000) return (num / 1000) + 'K';
    return val;
}

// Get heat-map CSS class based on accuracy value
function getScoreClass(value) {
    if (value === null || value === undefined || value === '') return '';
    const v = parseFloat(value);
    if (v >= 0.6) return 'score-high';
    if (v >= 0.3) return 'score-medium';
    return 'score-low';
}

// Format accuracy for display
function formatScore(value) {
    if (value === null || value === undefined || value === '') return '-';
    return (parseFloat(value) * 100).toFixed(1) + '%';
}

// ============ ACCURACY TABLE ============

function renderAccuracyTable(leaderboard) {
    const container = document.getElementById('leaderboard-container');
    const envLengths = leaderboard.env_lengths;

    const results = leaderboard.results.slice().sort((a, b) => {
        return sortAccuracy(a, b, sortState.field, sortState.direction, envLengths);
    });

    const tableHtml = `
        <div class="tabcontent active" id="leaderboard-accuracy">
            <div class="table-responsive">
                <table class="table scrollable data-table loca-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th class="sortable ${sortState.field === 'name' ? 'sort-active' : 'sort-inactive'}" data-sort="name">Model</th>
                            ${envLengths.map(el => `
                                <th class="sortable score-header ${sortState.field === el ? 'sort-active' : 'sort-inactive'}" data-sort="${el}">${formatEnvLength(el)}</th>
                            `).join('')}
                            <th class="sortable ${sortState.field === 'avg' ? 'sort-active' : 'sort-inactive'}" data-sort="avg">Avg</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map((item, idx) => `
                            <tr>
                                <td class="rank-cell">${getRankBadge(idx)}</td>
                                <td class="model-name-cell"><span class="font-mono fw-medium">${item.name}</span></td>
                                ${envLengths.map(el => {
                                    const score = item.scores[el];
                                    return `<td class="score-cell ${getScoreClass(score)}">${formatScore(score)}</td>`;
                                }).join('')}
                                <td class="score-cell avg-cell"><span class="fw-medium">${formatScore(item.avg)}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = tableHtml;

    // Attach sort handlers
    container.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.getAttribute('data-sort');
            if (sortState.field === field) {
                sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortState.field = field;
                sortState.direction = field === 'name' ? 'asc' : 'desc';
            }
            renderAccuracyTable(leaderboard);
        });
    });

    // Render chart
    renderAccuracyChart(leaderboard);
}

function sortAccuracy(a, b, field, direction, envLengths) {
    let av, bv;
    if (field === 'name') {
        av = (a.name || '').toLowerCase();
        bv = (b.name || '').toLowerCase();
        const result = av.localeCompare(bv);
        return direction === 'asc' ? result : -result;
    } else if (field === 'avg') {
        av = a.avg || 0;
        bv = b.avg || 0;
    } else {
        av = a.scores[field] || 0;
        bv = b.scores[field] || 0;
    }
    const result = av - bv;
    return direction === 'asc' ? result : -result;
}

function getRankBadge(idx) {
    if (idx === 0) return '<span class="rank-medal">&#129351;</span>';
    if (idx === 1) return '<span class="rank-medal">&#129352;</span>';
    if (idx === 2) return '<span class="rank-medal">&#129353;</span>';
    return `<span class="rank-number">${idx + 1}</span>`;
}

// ============ ACCURACY CHART ============

function renderAccuracyChart(leaderboard) {
    const chartContainer = document.getElementById('accuracy-chart-container');
    const canvas = document.getElementById('accuracy-chart');
    if (!canvas || !chartContainer) return;

    chartContainer.style.display = 'block';

    if (accuracyChart) {
        accuracyChart.destroy();
    }

    const envLengths = leaderboard.env_lengths;
    const labels = envLengths.map(formatEnvLength);

    const datasets = leaderboard.results.map((item, idx) => ({
        label: item.name,
        data: envLengths.map(el => {
            const v = item.scores[el];
            return v !== null && v !== undefined ? parseFloat(v) : null;
        }),
        borderColor: MODEL_COLORS[idx % MODEL_COLORS.length],
        backgroundColor: MODEL_COLORS[idx % MODEL_COLORS.length] + '20',
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 8,
        borderWidth: 2.5,
    }));

    const isDark = document.body.classList.contains('dark-mode');
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const textColor = isDark ? '#e5e7eb' : '#374151';

    accuracyChart = new Chart(canvas, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Accuracy vs Environment Description Length',
                    color: textColor,
                    font: { size: 18, weight: 'bold' }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        padding: 18,
                        font: { size: 14 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ctx.dataset.label + ': ' + (ctx.parsed.y * 100).toFixed(1) + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Environment Description Length (tokens)',
                        color: textColor,
                        font: { size: 14 }
                    },
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { size: 13 } }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Accuracy',
                        color: textColor,
                        font: { size: 14 }
                    },
                    min: 0,
                    max: 1,
                    grid: { color: gridColor },
                    ticks: {
                        color: textColor,
                        font: { size: 13 },
                        callback: function(value) {
                            return (value * 100) + '%';
                        }
                    }
                }
            }
        }
    });
}

// ============ CONTEXT MANAGEMENT TABLE ============

function renderContextManagementTable(leaderboard) {
    const container = document.getElementById('leaderboard-container');

    // Hide chart for this tab
    const chartContainer = document.getElementById('accuracy-chart-container');
    if (chartContainer) chartContainer.style.display = 'none';

    // Group results by model
    const groups = {};
    leaderboard.results.forEach(item => {
        if (!groups[item.model]) groups[item.model] = [];
        groups[item.model].push(item);
    });

    // Sort within each group
    const sortField = cmSortState.field;
    const sortDir = cmSortState.direction;
    Object.keys(groups).forEach(model => {
        groups[model].sort((a, b) => {
            let av, bv;
            if (sortField === 'strategy') {
                av = (a.strategy || '').toLowerCase();
                bv = (b.strategy || '').toLowerCase();
                const result = av.localeCompare(bv);
                return sortDir === 'asc' ? result : -result;
            }
            av = parseFloat(a[sortField]) || 0;
            bv = parseFloat(b[sortField]) || 0;
            const result = av - bv;
            return sortDir === 'asc' ? result : -result;
        });
    });

    const modelNames = Object.keys(groups);

    const tableHtml = `
        <div class="tabcontent active" id="leaderboard-context-management">
            <div class="table-responsive">
                <table class="table scrollable data-table loca-table cm-table">
                    <thead>
                        <tr>
                            <th class="sortable ${cmSortState.field === 'strategy' ? 'sort-active' : 'sort-inactive'}" data-sort="strategy">Model + Strategy</th>
                            <th class="sortable ${cmSortState.field === 'accuracy' ? 'sort-active' : 'sort-inactive'}" data-sort="accuracy">Accuracy</th>
                            <th class="sortable ${cmSortState.field === 'trajectory_length' ? 'sort-active' : 'sort-inactive'}" data-sort="trajectory_length">Trajectory Length</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${modelNames.map(model => `
                            <tr class="model-group-header">
                                <td colspan="3" class="fw-medium">${model}</td>
                            </tr>
                            ${groups[model].map(item => `
                                <tr>
                                    <td class="strategy-cell">
                                        <span class="strategy-indent"></span>
                                        <span class="strategy-badge ${item.strategy === 'Baseline' ? 'baseline' : ''}">${item.strategy}</span>
                                    </td>
                                    <td class="score-cell ${getScoreClass(item.accuracy)}">
                                        ${item.accuracy !== null ? formatScore(item.accuracy) : '-'}
                                    </td>
                                    <td class="number-cell">
                                        ${item.trajectory_length !== null ? Math.round(item.trajectory_length).toLocaleString() : '-'}
                                    </td>
                                </tr>
                            `).join('')}
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = tableHtml;

    // Attach sort handlers
    container.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.getAttribute('data-sort');
            if (cmSortState.field === field) {
                cmSortState.direction = cmSortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                cmSortState.field = field;
                cmSortState.direction = field === 'strategy' ? 'asc' : 'desc';
            }
            renderContextManagementTable(leaderboard);
        });
    });
}

// ============ TAB SWITCHING ============

function openLeaderboard(leaderboardId) {
    const data = loadLeaderboardData();
    if (!data) return;

    const leaderboard = data.find(lb => lb.id === leaderboardId);
    if (!leaderboard) return;

    if (leaderboardId === 'accuracy') {
        renderAccuracyTable(leaderboard);
    } else if (leaderboardId === 'context-management') {
        renderContextManagementTable(leaderboard);
    }

    // Update tab states
    document.querySelectorAll('.tablinks').forEach(link => link.classList.remove('active'));
    const activeBtn = document.querySelector(`.tablinks[data-leaderboard="${leaderboardId}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

// ============ INIT ============

document.addEventListener('DOMContentLoaded', function() {
    // Wire tab click handlers
    document.querySelectorAll('.tablinks').forEach(tab => {
        tab.addEventListener('click', function() {
            const id = this.getAttribute('data-leaderboard');
            openLeaderboard(id);
            history.replaceState(null, '', '#' + id);
        });
    });

    // Load initial tab from hash or default
    const hash = window.location.hash.slice(1);
    const validTabs = ['accuracy', 'context-management'];
    if (hash && validTabs.includes(hash)) {
        openLeaderboard(hash);
    } else {
        openLeaderboard('accuracy');
    }
});
