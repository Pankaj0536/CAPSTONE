let lineChartInstance = null;
let barChartInstance = null;

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
    renderLineChart(data, algorithms);
    renderBarChart(data, algorithms);
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

const chartColors = {
    'FCFS': '#3B82F6', // Blue
    'SSTF': '#8B5CF6', // Purple
    'SCAN': '#10B981', // Green
    'C-SCAN': '#F59E0B' // Yellow
};

function renderLineChart(data, algorithms) {
    const ctx = document.getElementById('lineChart').getContext('2d');
    
    if (lineChartInstance) {
        lineChartInstance.destroy();
    }
    
    const initialHead = parseInt(document.getElementById('initialHead').value);
    const datasets = algorithms.map(algo => {
        const order = [initialHead, ...data[algo].execution_order];
        
        return {
            label: algo,
            data: order.map((y, index) => ({ x: index, y: y })),
            borderColor: chartColors[algo] || '#ffffff',
            backgroundColor: chartColors[algo] || '#ffffff',
            borderWidth: 2,
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 6
        };
    });
    
    // Find absolute max length to set X axis scale
    const maxLength = Math.max(...algorithms.map(algo => data[algo].execution_order.length)) + 1;
    
    lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Request Sequence Step'
                    },
                    ticks: {
                        stepSize: 1
                    },
                    min: 0,
                    max: maxLength - 1
                },
                y: {
                    title: {
                        display: true,
                        text: 'Track / Cylinder'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: Track ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

function renderBarChart(data, algorithms) {
    const ctx = document.getElementById('barChart').getContext('2d');
    
    if (barChartInstance) {
        barChartInstance.destroy();
    }
    
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
                    title: {
                        display: true,
                        text: 'Head Movement (Tracks)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}
