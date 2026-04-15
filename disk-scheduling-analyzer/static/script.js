const SSD_ACCESS_TIME_PER_REQUEST = 5;
const SSD_BASE_TIME = 15;
let movementChart = null;
let comparisonChart = null;

function initMenu() {
    const menuWraps = document.querySelectorAll('.menu-wrap');

    if (!menuWraps.length) return;

    menuWraps.forEach(menuWrap => {
        const menuTrigger = menuWrap.querySelector('.menu-trigger, .user-menu-trigger');
        if (!menuTrigger) return;

        menuTrigger.addEventListener('click', event => {
            event.stopPropagation();
            // Close other open menus
            menuWraps.forEach(other => {
                if (other !== menuWrap) other.classList.remove('open');
            });
            menuWrap.classList.toggle('open');
        });

        menuWrap.addEventListener('click', event => {
            event.stopPropagation();
        });
    });

    document.addEventListener('click', () => {
        menuWraps.forEach(menuWrap => menuWrap.classList.remove('open'));
    });
}

function animateHddAccess() {
    const diskScene = document.getElementById('hdd-scene');
    const hddArm = document.getElementById('hdd-arm');
    const status = document.getElementById('hdd-status');
    const btn = document.getElementById('hdd-sim-btn');
    if (!diskScene || !hddArm || !btn) return;

    btn.disabled = true;
    status.innerHTML = "Moving arm... (Mechanical Delay)";
    status.style.color = "#ef4444";
    diskScene.classList.add('active');
    
    const randomAngle = Math.floor(Math.random() * 45) + 20;
    hddArm.style.transform = `translate(-10%, -50%) rotate(${randomAngle}deg)`;

    setTimeout(() => {
        diskScene.classList.remove('active');
        status.innerHTML = "Data Access Complete!";
        status.style.color = "#10b981";
        btn.disabled = false;
        
        setTimeout(() => {
            if (status.innerHTML === "Data Access Complete!") {
                status.innerHTML = "";
                hddArm.style.transform = `translate(-10%, -50%) rotate(25deg)`;
            }
        }, 1500);
    }, 1500);
}

function animateSsdAccess() {
    const blocks = Array.from(document.querySelectorAll('.ssd-grid .block'));
    const status = document.getElementById('ssd-status');
    const btn = document.getElementById('ssd-sim-btn');
    if (!blocks.length || !btn) return;

    btn.disabled = true;
    status.innerHTML = "Lighting up grids... ⚡";
    status.style.color = "#3b82f6";
    
    // Clear previous
    blocks.forEach(b => b.classList.remove('active', 'pulse'));
    
    // Light all blocks up sequentially one by one
    blocks.forEach((block, index) => {
        setTimeout(() => {
            block.classList.add('active', 'pulse');
        }, index * 40); 
    });

    const totalTime = blocks.length * 40 + 200;

    // Final access state
    setTimeout(() => {
        status.innerHTML = "Loaded All Memory Instantly! ⚡";
        status.style.color = "#10b981";
        
        setTimeout(() => {
            btn.disabled = false;
            setTimeout(() => {
                if (status.innerHTML.includes("Instantly")) {
                    status.innerHTML = "";
                }
                blocks.forEach(b => b.classList.remove('active', 'pulse'));
            }, 1800);
        }, 500);
    }, totalTime);
}

function setupDemoButtons() {
    const hddBtn = document.getElementById('hdd-sim-btn');
    const ssdBtn = document.getElementById('ssd-sim-btn');

    if (hddBtn) hddBtn.addEventListener('click', animateHddAccess);
    if (ssdBtn) ssdBtn.addEventListener('click', animateSsdAccess);
}

function generateSSDGrid() {
    const grid = document.querySelector('.ssd-grid');
    if (!grid || grid.children.length) return;

    for (let i = 0; i < 12; i += 1) {
        const block = document.createElement('div');
        block.className = 'block';
        grid.appendChild(block);
    }
}

function parseRequests(raw) {
    return raw
        .split(',')
        .map(item => Number(item.trim()))
        .filter(value => Number.isFinite(value) && value >= 0);
}

function computeSeekPath(initialHead, requestOrder) {
    let total = 0;
    let current = initialHead;
    const path = [initialHead];

    requestOrder.forEach(next => {
        total += Math.abs(next - current);
        path.push(next);
        current = next;
    });

    return { totalSeek: total, steps: path };
}

function runFCFS(initialHead, requests) {
    return computeSeekPath(initialHead, [...requests]);
}

function runSSTF(initialHead, requests) {
    const pending = [...requests];
    let current = initialHead;
    const order = [];

    while (pending.length > 0) {
        let bestIndex = 0;
        let bestDistance = Math.abs(pending[0] - current);

        for (let i = 1; i < pending.length; i += 1) {
            const distance = Math.abs(pending[i] - current);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestIndex = i;
            }
        }

        const next = pending.splice(bestIndex, 1)[0];
        order.push(next);
        current = next;
    }

    return computeSeekPath(initialHead, order);
}

function runSCAN(initialHead, requests) {
    const upRequests = requests.filter(value => value >= initialHead).sort((a, b) => a - b);
    const downRequests = requests.filter(value => value < initialHead).sort((a, b) => b - a);
    return computeSeekPath(initialHead, [...upRequests, ...downRequests]);
}

function renderAlgorithmCards(results) {
    const container = document.getElementById('algorithmCards');
    if (!container) return;

    container.innerHTML = '';

    const bestAlgorithm = ['FCFS', 'SSTF', 'SCAN'].reduce((best, algo) => {
        if (!best || results[algo].totalSeek < results[best].totalSeek) return algo;
        return best;
    }, 'FCFS');

    Object.keys(results).forEach(algo => {
        const result = results[algo];
        if (!result) return;

        const card = document.createElement('div');
        card.className = 'algo-card';
        if (algo === bestAlgorithm) card.classList.add('best');

        card.innerHTML = `
            <h4>${algo}</h4>
            <p>${algo === 'SSD' ? 'Constant storage access' : 'HDD seek path'}</p>
            <div><strong>HDD seek:</strong> ${result.totalSeek.toFixed(1)}</div>
            <div><strong>SSD time:</strong> ${result.ssdTime.toFixed(1)} ms</div>
            <div class="path-list">${result.steps.slice(0, 8).map(value => `<span class="path-pill">${value}</span>`).join('')}</div>
        `;

        container.appendChild(card);
    });
}

function renderComparisonTable(results) {
    const body = document.getElementById('comparisonTableBody');
    if (!body) return;

    body.innerHTML = ['FCFS', 'SSTF', 'SCAN'].map(algo => {
        const result = results[algo];
        if (!result) return '';
        return `
            <tr>
                <td>${algo}</td>
                <td>${result.totalSeek.toFixed(1)}</td>
                <td>${result.ssdTime.toFixed(1)} ms</td>
            </tr>`;
    }).join('');
}

function renderMovementChart(results) {
    const canvas = document.getElementById('movementChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (movementChart) movementChart.destroy();

    const algorithmKeys = ['FCFS', 'SSTF', 'SCAN'];
    const allValues = algorithmKeys.flatMap(algo => results[algo].steps);
    const minTrack = Math.max(0, Math.min(...allValues) - 12);
    const maxTrack = Math.max(...allValues) + 12;
    const stepCount = Math.max(...algorithmKeys.map(algo => results[algo].steps.length));

    movementChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: algorithmKeys.map((algo, idx) => ({
                label: algo,
                data: results[algo].steps.map((value, step) => ({ x: step, y: value })),
                borderColor: ['#22c55e', '#3b82f6', '#a855f7'][idx],
                backgroundColor: ['rgba(34, 197, 94, 0.18)', 'rgba(59, 130, 246, 0.18)', 'rgba(168, 85, 247, 0.18)'][idx],
                tension: 0.35,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: 'start',
                borderWidth: 3,
                spanGaps: true
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#475569', usePointStyle: true, boxWidth: 10 }
                },
                tooltip: {
                    callbacks: {
                        label: context => `${context.dataset.label}: Track ${context.parsed.y}`
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Step', color: '#64748b' },
                    min: 0,
                    max: Math.max(stepCount - 1, 4),
                    ticks: { color: '#64748b', stepSize: Math.max(1, Math.ceil(stepCount / 5)) },
                    grid: { color: 'rgba(71, 85, 105, 0.08)' }
                },
                y: {
                    min: minTrack,
                    max: maxTrack,
                    title: { display: true, text: 'Track position', color: '#64748b' },
                    ticks: { color: '#64748b', stepSize: Math.max(10, Math.ceil((maxTrack - minTrack) / 5)) },
                    grid: { color: 'rgba(71, 85, 105, 0.08)' }
                }
            },
            elements: {
                line: { borderJoinStyle: 'round', capBezierPoints: true },
                point: { hoverBorderWidth: 2 }
            }
        }
    });
}

function renderComparisonChart(results, ssdTime) {
    const canvas = document.getElementById('comparisonChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (comparisonChart) comparisonChart.destroy();

    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['FCFS', 'SSTF', 'SCAN', 'SSD'],
            datasets: [{
                label: 'HDD seek vs SSD access',
                data: ['FCFS', 'SSTF', 'SCAN'].map(algo => results[algo].totalSeek).concat(ssdTime),
                backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f97316'],
                borderRadius: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Effective Value', color: '#64748b' }, ticks: { color: '#64748b' } },
                x: { ticks: { color: '#64748b' } }
            }
        }
    });
}

function runSimulation() {
    const requestInput = document.getElementById('requestInput');
    const headInput = document.getElementById('headInput');
    if (!requestInput || !headInput) return;

    const requests = parseRequests(requestInput.value);
    const initialHead = Number(headInput.value);

    if (!requests.length || !Number.isFinite(initialHead) || initialHead < 0) {
        alert('Please enter valid disk requests and initial head position.');
        return;
    }

    const fcfs = runFCFS(initialHead, requests);
    const sstf = runSSTF(initialHead, requests);
    const scan = runSCAN(initialHead, requests);
    const ssdTime = SSD_BASE_TIME + requests.length * SSD_ACCESS_TIME_PER_REQUEST;

    const results = {
        FCFS: { ...fcfs, ssdTime },
        SSTF: { ...sstf, ssdTime },
        SCAN: { ...scan, ssdTime },
        SSD: { totalSeek: 0, ssdTime, steps: [initialHead] }
    };

    const best = ['FCFS', 'SSTF', 'SCAN'].reduce((winner, algo) => results[algo].totalSeek < results[winner].totalSeek ? algo : winner, 'FCFS');
    const status = document.getElementById('resultStatus');
    const bestLabel = document.getElementById('bestAlgo');
    if (status) status.textContent = `Simulation complete. Best scheduler: ${best}.`;
    if (bestLabel) bestLabel.textContent = best;

    renderAlgorithmCards(results);
    renderComparisonTable(results);
    renderMovementChart(results);
    renderComparisonChart(results, ssdTime);
}

function resetSimulator() {
    const requestInput = document.getElementById('requestInput');
    const headInput = document.getElementById('headInput');
    const maxTrackInput = document.getElementById('maxTrackInput');
    const status = document.getElementById('resultStatus');
    const bestLabel = document.getElementById('bestAlgo');
    const comparisonBody = document.getElementById('comparisonTableBody');
    const cards = document.getElementById('algorithmCards');

    if (requestInput) requestInput.value = '10, 50, 90, 30, 70';
    if (headInput) headInput.value = '35';
    if (maxTrackInput) maxTrackInput.value = '199';
    if (status) status.textContent = 'Run simulation to review algorithm results.';
    if (bestLabel) bestLabel.textContent = 'N/A';
    if (comparisonBody) comparisonBody.innerHTML = '<tr><td colspan="3" style="color: var(--muted); text-align:center;">No simulation yet.</td></tr>';
    if (cards) cards.innerHTML = '<div class="algo-card">Run the simulation to populate algorithm cards.</div>';

    if (movementChart) {
        movementChart.destroy();
        movementChart = null;
    }
    if (comparisonChart) {
        comparisonChart.destroy();
        comparisonChart = null;
    }
}

function attachEvents() {
    initMenu();
    setupDemoButtons();
    generateSSDGrid();

    const runSimulatorBtn = document.getElementById('runSimulatorBtn');
    const resetSimulatorBtn = document.getElementById('resetSimulatorBtn');

    if (runSimulatorBtn) runSimulatorBtn.addEventListener('click', runSimulation);
    if (resetSimulatorBtn) resetSimulatorBtn.addEventListener('click', resetSimulator);
}

document.addEventListener('DOMContentLoaded', attachEvents);

// ---- Info Modal ----
const algoDescriptions = {
    'FCFS': 'First Come First Serve. Requests are serviced in the exact order they arrive. Simplest algorithm but can result in wild head swings.',
    'SSTF': 'Shortest Seek Time First. Always chooses the request closest to the current head position. Greatly reduces seek time but can cause starvation for requests far away.',
    'SCAN': 'Also known as the Elevator Algorithm. The head moves from one end of the disk to the other, servicing requests along the way, then reverses direction.',
    'C-SCAN': 'Circular SCAN. Like SCAN, but it only services requests in one direction. When it reaches the end, it quickly returns to the beginning without servicing requests along the return trip. Provides a more uniform wait time.',
    'LOOK': 'Similar to SCAN, but the head stops and reverses direction at the last request in the current direction, instead of going all the way to the edge of the disk.',
    'C-LOOK': 'Similar to C-SCAN, but the head jumps back to the earliest request instead of the physical edge of the disk.',
    'N-STEP SCAN': 'Segments the queue into subqueues of length N. The subqueues are processed one by one using SCAN. Prevents starvation caused by continuous arrivals near the head.',
    'F-SCAN': 'Uses two separate queues. All incoming requests go to one queue while the requests in the other queue are serviced using SCAN.'
};

function showInfo(algoName, event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('modalTitle').innerText = algoName;
    document.getElementById('modalDesc').innerText = algoDescriptions[algoName] || "No description available.";
    document.getElementById('infoModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('infoModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('infoModal');
    if (event.target === modal) {
        closeModal();
    }
};
