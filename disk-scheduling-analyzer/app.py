from flask import Flask, render_template, request, jsonify
from algorithms import fcfs, sstf, scan, c_scan
import random

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run_simulation', methods=['POST'])
def run_simulation():
    data = request.json
    queue = [int(x.strip()) for x in data.get('queue', '').split(',') if x.strip().isdigit()]
    initial_head = int(data.get('initial_head', 0))
    disk_size = int(data.get('disk_size', 200))
    algorithms = data.get('algorithms', [])
    
    results = {}
    
    if "FCFS" in algorithms:
        results["FCFS"] = fcfs(queue, initial_head, disk_size)
    if "SSTF" in algorithms:
        results["SSTF"] = sstf(queue, initial_head, disk_size)
    if "SCAN" in algorithms:
        results["SCAN"] = scan(queue, initial_head, disk_size)
    if "C-SCAN" in algorithms:
        results["C-SCAN"] = c_scan(queue, initial_head, disk_size)
        
    return jsonify(results)

@app.route('/generate_requests', methods=['POST'])
def generate_requests():
    data = request.json
    n = int(data.get('count', 10))
    disk_size = int(data.get('disk_size', 200))
    
    # Ensure n is not larger than disk_size for random.sample to work without replacement
    n = min(n, disk_size)
    
    requests = random.sample(range(0, disk_size), n)
    return jsonify({"requests": requests})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
