// App logic for both the visualization and scheduling pages.
const SSD_CONSTANT_TIME = 18;
let performanceChart = null;

function ready(fn) {
    if (document.readyState !== 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

function animateHddAccess() {
    const status = document.getElementById('demo-status');
    const diskScene = document.querySelector('.disk-scene');

    if (!diskScene || !status) return;

    status.textContent = 'HDD access in progress... movement and rotation are delaying the response.';
    diskScene.classList.add('active');

    setTimeout(() => {
        diskScene.classList.remove('active');
        status.textContent = 'Mechanical delay complete — HDD took longer due to seek and rotation.';
    }, 1400);
}

function animateSsdAccess() {
    const status = document.getElementById('demo-status');
    const blocks = Array.from(document.querySelectorAll('.ssd-grid .block'));
    if (!blocks.length || !status) return;

    status.textContent = 'SSD access is instant — flash memory reads without moving parts.';
    blocks.forEach((block, index) => {
        setTimeout(() => {
            block.classList.add('active');
            setTimeout(() => block.classList.remove('active'), 300);
        }, index * 120);
    });
}

function setupPerformanceDemo() {
    const hddBtn = document.getElementById('hdd-access-btn');
    const ssdBtn = document.getElementById('ssd-access-btn');

    if (hddBtn) hddBtn.addEventListener('click', animateHddAccess);
    if (ssdBtn) ssdBtn.addEventListener('click', animateSsdAccess);
}

function parseRequests(value) {
    return value
        .split(',')
        .map(item => Number(item.trim()))
        .filter(Number.isFinite)
        .filter(item => item >= 0);
}

function calculateSeekPath(start, requests) {
    let total = 0;
    let current = start;
    const order = [];

    requests.forEach(track => {
        total += Math.abs(track - current);
        order.push(track);
        current = track;
    });

    return { order, total, path: [start, ...order] };
}

function calculateSstf(start, requests) {
    const pending = [...requests];
    let current = start;
    const order = [];
    let total = 0;

    while (pending.length) {
        let nearestIndex = 0;
        let nearestDistance = Math.abs(pending[0] - current);

        for (let i = 1; i < pending.length; i += 1) {
            const distance = Math.abs(pending[i] - current);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = i;
            }
        }

        const nextTrack = pending.splice(nearestIndex, 1)[0];
        total += Math.abs(nextTrack - current);
        order.push(nextTrack);
        current = nextTrack;
    }

    return { order, total, path: [start, ...order] };
}

function calculateScan(start, requests) {
    const higher = requests.filter(track => track >= start).sort((a, b) => a - b);
    const lower = requests.filter(track => track < start).sort((a, b) => b - a);
    const pathOrder = [...higher, ...lower];
    let total = 0;
    let current = start;

    pathOrder.forEach(track => {
        total += Math.abs(track - current);
        current = track;
    });

    return { order: pathOrder, total, path: [start, ...pathOrder] };
}

function formatPath(order) {
    return order.map(value => `<span class="path-pill">${value}</span>`).join('');
}

function updateAlgorithmCards(results) {
    const fcfsPath = document.getElementById('fcfs-path');
    const sstfPath = document.getElementById('sstf-path');
    const scanPath = document.getElementById('scan-path');
    const fcfsSeek = document.getElementById('fcfs-seek');
    const sstfSeek = document.getElementById('sstf-seek');
    const scanSeek = document.getElementById('scan-seek');

    if (fcfsPath) fcfsPath.innerHTML = formatPath(results.FCFS.order);
    if (fcfsSeek) fcfsSeek.textContent = `${results.FCFS.total} units`;
    if (sstfPath) sstfPath.innerHTML = formatPath(results.SSTF.order);
    if (sstfSeek) sstfSeek.textContent = `${results.SSTF.total} units`;
    if (scanPath) scanPath.innerHTML = formatPath(results.SCAN.order);
    if (scanSeek) scanSeek.textContent = `${results.SCAN.total} units`;
}

function buildComparisonTable(results) {
    const tableBody = document.getElementById('results-table');
    if (!tableBody) return;

    const bestHdd = ['FCFS', 'SSTF', 'SCAN'].reduce((winner, key) => {
        return results[key].total < results[winner].total ? key : winner;
    }, 'FCFS');

    const rows = ['FCFS', 'SSTF', 'SCAN'].map(key => {
        const isBest = key === bestHdd;
        return `
            <tr class="${isBest ? 'best-row' : ''}">
                <td>${key}</td>
                <td>${results[key].total} units</td>
                <td>${SSD_CONSTANT_TIME} ms</td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows;
}

function plotPerformanceChart(results) {
    const canvas = document.getElementById('performance-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = ['FCFS', 'SSTF', 'SCAN', 'SSD'];
    const values = [results.FCFS.total, results.SSTF.total, results.SCAN.total, SSD_CONSTANT_TIME];

    if (performanceChart) {
        performanceChart.data.labels = labels;
        performanceChart.data.datasets[0].data = values;
        performanceChart.update();
        return;
    }

    performanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Access time comparison',
                data: values,
                backgroundColor: ['#dbeafe', '#93c5fd', '#60a5fa', '#1d4ed8'],
                borderColor: ['#93c5fd', '#60a5fa', '#2563eb', '#1e40af'],
                borderWidth: 1,
                borderRadius: 22,
                barThickness: 40,
                hoverBackgroundColor: ['#bfdbfe', '#82cfff', '#3b82f6', '#2563eb']
            }]
        },
        options: {
            animation: { duration: 900 },
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f8fafc',
                    bodyColor: '#e2e8f0',
                    borderColor: 'rgba(59, 130, 246, 0.24)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    ticks: { color: '#1e3a8a' },
                    grid: { color: 'rgba(59, 130, 246, 0.12)' }
                },
                y: {
                    ticks: { color: '#1e3a8a' },
                    grid: { color: 'rgba(59, 130, 246, 0.08)' },
                    beginAtZero: true
                }
            }
        }
    });
}

function renderSchedulingResults() {
    const requestInput = document.getElementById('request-input');
    const headInput = document.getElementById('head-input');
    if (!requestInput || !headInput) return;

    const requests = parseRequests(requestInput.value);
    const start = Number(headInput.value);

    if (!requests.length || !Number.isFinite(start)) {
        alert('Enter at least one valid request and a valid head position.');
        return;
    }

    const results = {
        FCFS: calculateSeekPath(start, requests),
        SSTF: calculateSstf(start, requests),
        SCAN: calculateScan(start, requests)
    };

    updateAlgorithmCards(results);
    buildComparisonTable(results);
    plotPerformanceChart(results);
}

function initSchedulingPage() {
    const runBtn = document.getElementById('run-simulation');
    if (!runBtn) return;
    runBtn.addEventListener('click', renderSchedulingResults);
    renderSchedulingResults();
}

ready(() => {
    setupPerformanceDemo();
    initSchedulingPage();
});
