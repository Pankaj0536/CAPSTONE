let lineChartInstance = null;
let barChartInstance = null;

// Playback state
let currentStep = 0;
let maxSteps = 0;
let playInterval = null;
let globalData = {};
let globalAlgos = [];

const chartColors = {
    'FCFS': '#3B82F6', 
    'SSTF': '#8B5CF6', 
    'SCAN': '#10B981', 
    'C-SCAN': '#F59E0B',
    'LOOK': '#EC4899',
    'C-LOOK': '#EF4444',
    'N-STEP SCAN': '#06B6D4',
    'F-SCAN': '#14B8A6'
};

// Global Chart settings
Chart.defaults.color = '#94A3B8';
Chart.defaults.font.family = 'Inter';

document.getElementById('inputForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const queue = document.getElementById('queue').value;
    const initial_head = document.getElementById('initialHead').value;
    const disk_size = document.getElementById('diskSize').value;
    
    // Get checked algorithms
    const algoCheckboxes = document.querySelectorAll('input[name="algo"]:checked');
    const algorithms = Array.from(algoCheckboxes).map(cb => cb.value);
    
    if (algorithms.length === 0) {
        alert("Please select at least one algorithm to run.");
        return;
    }
    
    // Animate button state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Simulating...';
    submitBtn.style.opacity = '0.7';

    try {
        const response = await fetch('/run_simulation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                queue,
                initial_head,
                disk_size,
                algorithms
            })
        });
        
        const data = await response.json();
        updateUI(data, Object.keys(data));
    } catch (error) {
        console.error("Error running simulation:", error);
        alert("An error occurred during simulation.");
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.style.opacity = '1';
    }
});

async function generateRequests(count) {
    const diskSize = document.getElementById('diskSize').value || 200;
    
    try {
        const response = await fetch('/generate_requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                count,
                disk_size: diskSize
            })
        });
        
        const data = await response.json();
        if (data.requests) {
            document.getElementById('queue').value = data.requests.join(', ');
            
            // Add a brief animation to the text area to show it was updated
            const ta = document.getElementById('queue');
            ta.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
            setTimeout(() => {
                ta.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
            }, 300);
        }
    } catch (error) {
        console.error("Error generating requests:", error);
    }
}

function updateUI(data, algorithms) {
    updateTable(data, algorithms);
    updateExecutionLog(data, algorithms);
    
    globalData = data;
    globalAlgos = algorithms;
    maxSteps = Math.max(...algorithms.map(algo => data[algo].execution_order.length));
    currentStep = maxSteps;
    
    renderLineChartStep();
    renderBarChart(data, algorithms);
    updatePlaybackControls();
}

function updateTable(data, algorithms) {
    const tbody = document.querySelector('#resultsTable tbody');
    tbody.innerHTML = '';
    
    algorithms.forEach(algo => {
        const result = data[algo];
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td><strong>${algo}</strong></td>
            <td>${result.total_head_movement}</td>
            <td>${result.average_seek_time.toFixed(2)} ms</td>
            <td>${result.hdd_time.toFixed(2)}</td>
            <td><span style="color: #10B981; font-weight: 600;">${result.ssd_time.toFixed(2)}</span></td>
        `;
        
        tbody.appendChild(tr);
    });
}

function updateExecutionLog(data, algorithms) {
    const logContainer = document.getElementById('executionLog');
    logContainer.innerHTML = '';
    
    algorithms.forEach(algo => {
        const order = data[algo].execution_order;
        const div = document.createElement('div');
        div.className = 'log-item';
        
        // Convert to arrow separated string
        // The first element is the initial head (actually the first request, we need to show transition from initial head)
        // Let's get initial head from input
        const initialHead = document.getElementById('initialHead').value;
        const fullSequence = [initialHead, ...order].join(' → ');
        
        div.innerHTML = `
            <h4>${algo} Order:</h4>
            <div class="log-sequence">${fullSequence}</div>
        `;
        
        logContainer.appendChild(div);
    });
}

function renderLineChartStep() {
    const ctx = document.getElementById('lineChart').getContext('2d');
    if (lineChartInstance) lineChartInstance.destroy();
    
    const initialHead = parseInt(document.getElementById('initialHead').value);
    const diskSize = parseInt(document.getElementById('diskSize').value);
    
    const datasets = globalAlgos.map(algo => {
        const fullOrder = [initialHead, ...globalData[algo].execution_order];
        const currentOrder = fullOrder.slice(0, currentStep + 1);
        
        return {
            label: algo,
            data: currentOrder.map((cyl, index) => ({ x: cyl, y: index })),
            borderColor: chartColors[algo] || '#ffffff',
            backgroundColor: chartColors[algo] || '#ffffff',
            borderWidth: 2,
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 6
        };
    });
    
    lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: { datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Track / Cylinder' },
                    min: 0,
                    max: diskSize - 1
                },
                y: {
                    title: { display: true, text: 'Request Sequence Step' },
                    reverse: true,
                    min: 0,
                    max: maxSteps,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: Track ${context.parsed.x}`;
                        }
                    }
                }
            }
        }
    });
}

function renderBarChart(data, algorithms) {
    const ctx = document.getElementById('barChart').getContext('2d');
    if (barChartInstance) barChartInstance.destroy();
    
    const headMovements = algorithms.map(algo => data[algo].total_head_movement);
    const bgColors = algorithms.map(algo => chartColors[algo] || '#ffffff');
    
    barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: algorithms,
            datasets: [{
                label: 'Total Head Movement',
                data: headMovements,
                backgroundColor: bgColors,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Head Movement (Tracks)' }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// ---- Playback Controls ----
function updatePlaybackControls() {
    document.getElementById('stepCounter').innerText = `Step: ${currentStep} / ${maxSteps}`;
    document.getElementById('prevStepBtn').disabled = currentStep === 0;
    document.getElementById('nextStepBtn').disabled = currentStep === maxSteps;
    document.getElementById('playAutoBtn').disabled = maxSteps === 0;
    
    if (currentStep === maxSteps && playInterval) {
        clearInterval(playInterval);
        playInterval = null;
        document.getElementById('playAutoBtn').innerText = '▶ Play';
    }
}

document.getElementById('prevStepBtn').addEventListener('click', () => {
    if (currentStep > 0) {
        currentStep--;
        renderLineChartStep();
        updatePlaybackControls();
    }
});

document.getElementById('nextStepBtn').addEventListener('click', () => {
    if (currentStep < maxSteps) {
        currentStep++;
        renderLineChartStep();
        updatePlaybackControls();
    }
});

document.getElementById('playAutoBtn').addEventListener('click', (e) => {
    const btn = e.target;
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
        btn.innerText = '▶ Play';
    } else {
        if (currentStep === maxSteps) currentStep = 0;
        btn.innerText = '⏸ Pause';
        playInterval = setInterval(() => {
            if (currentStep < maxSteps) {
                currentStep++;
                renderLineChartStep();
                updatePlaybackControls();
            }
        }, 800);
    }
});

// ---- Experiment Mode ----
async function runExperiment() {
    const btn = document.getElementById('expBtn');
    const originalText = btn.innerText;
    btn.innerText = 'Running Tests...';
    btn.disabled = true;

    try {
        const disk_size = document.getElementById('diskSize').value;
        const initial_head = document.getElementById('initialHead').value;
        
        const response = await fetch('/run_experiment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                counts: [10, 50, 100, 500],
                disk_size: disk_size,
                initial_head: initial_head
            })
        });
        
        const data = await response.json();
        
        const tbody = document.querySelector('#experimentTable tbody');
        tbody.innerHTML = '';
        
        [10, 50, 100, 500].forEach(count => {
            if(!data[count]) return;
            const res = data[count];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${count}</strong></td>
                <td>${res['FCFS'].average_seek_time.toFixed(2)} ms</td>
                <td>${res['SSTF'].average_seek_time.toFixed(2)} ms</td>
                <td>${res['SCAN'].average_seek_time.toFixed(2)} ms</td>
                <td>${res['C-SCAN'].average_seek_time.toFixed(2)} ms</td>
                <td>${res['LOOK'].average_seek_time.toFixed(2)} ms</td>
                <td>${res['C-LOOK'].average_seek_time.toFixed(2)} ms</td>
                <td>${res['N-STEP SCAN'].average_seek_time.toFixed(2)} ms</td>
                <td>${res['F-SCAN'].average_seek_time.toFixed(2)} ms</td>
            `;
            tbody.appendChild(tr);
        });
        
        document.getElementById('experimentCard').style.display = 'block';
        document.getElementById('experimentCard').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error("Experiment failed", error);
        alert("Experiment failed to run.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

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
}
