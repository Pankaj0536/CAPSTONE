from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from algorithms import fcfs, sstf, scan, c_scan, look, c_look, n_step_scan, f_scan
import random

app = Flask(__name__)
app.secret_key = 'sdasda_dasfsa_secret_key'


# ================= AUTH =================

@app.route('/login')
def login():
    session['logged_in'] = True
    return redirect(request.referrer or url_for('index'))


@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(request.referrer or url_for('index'))


# ================= PAGES =================

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/learning')
def learning():
    return render_template('learning.html')


@app.route('/options')
def options():
    return render_template('index.html')


@app.route('/ssd-vs-hdd')
def ssd_vs_hdd():
    return render_template('ssd_vs_hdd.html')


# ================= SIMULATION =================

@app.route('/run_simulation', methods=['POST'])
def run_simulation():
    data = request.json

    # ✅ Safe parsing
    queue = [
        int(x.strip())
        for x in data.get('queue', '').split(',')
        if x.strip().isdigit()
    ]

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

    if "LOOK" in algorithms:
        results["LOOK"] = look(queue, initial_head, disk_size)

    if "C-LOOK" in algorithms:
        results["C-LOOK"] = c_look(queue, initial_head, disk_size)

    if "N-STEP SCAN" in algorithms:
        results["N-STEP SCAN"] = n_step_scan(queue, initial_head, disk_size)

    if "F-SCAN" in algorithms:
        results["F-SCAN"] = f_scan(queue, initial_head, disk_size)

    # ✅ Add global info (helps UI clarity)
    return jsonify({
        "unit": "ms",   # 🔥 IMPORTANT
        "results": results
    })


# ================= RANDOM REQUEST GENERATOR =================

@app.route('/generate_requests', methods=['POST'])
def generate_requests():
    data = request.json

    n = int(data.get('count', 10))
    disk_size = int(data.get('disk_size', 200))

    n = min(n, disk_size)

    requests = random.sample(range(0, disk_size), n)

    return jsonify({
        "requests": requests
    })


# ================= EXPERIMENT MODE =================

@app.route('/run_experiment', methods=['POST'])
def run_experiment():
    data = request.json

    counts = data.get('counts', [10, 50, 100, 500])
    disk_size = int(data.get('disk_size', 200))
    initial_head = int(data.get('initial_head', 53))

    algos = ["FCFS", "SSTF", "SCAN", "C-SCAN", "LOOK", "C-LOOK", "N-STEP SCAN", "F-SCAN"]

    results = {}

    for count in counts:

        if count <= disk_size:
            queue = random.sample(range(0, disk_size), count)
        else:
            queue = [random.randint(0, disk_size - 1) for _ in range(count)]

        counts_res = {}

        for algo in algos:

            if algo == "FCFS":
                counts_res[algo] = fcfs(queue, initial_head, disk_size)

            elif algo == "SSTF":
                counts_res[algo] = sstf(queue, initial_head, disk_size)

            elif algo == "SCAN":
                counts_res[algo] = scan(queue, initial_head, disk_size)

            elif algo == "C-SCAN":
                counts_res[algo] = c_scan(queue, initial_head, disk_size)

            elif algo == "LOOK":
                counts_res[algo] = look(queue, initial_head, disk_size)

            elif algo == "C-LOOK":
                counts_res[algo] = c_look(queue, initial_head, disk_size)

            elif algo == "N-STEP SCAN":
                counts_res[algo] = n_step_scan(queue, initial_head, disk_size)

            elif algo == "F-SCAN":
                counts_res[algo] = f_scan(queue, initial_head, disk_size)

        results[str(count)] = counts_res

    return jsonify({
        "unit": "ms",   # 🔥 consistent unit
        "results": results
    })


# ================= RUN =================

if __name__ == '__main__':
    app.run(debug=True, port=5000)