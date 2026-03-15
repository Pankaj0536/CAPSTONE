# SSD vs HDD Disk Scheduling Performance Analyzer

## Project Purpose
This capstone project is a web-based performance analyzer designed to help Computer Engineering students understand different Disk Scheduling Algorithms and their impact on system performance. It simulates common algorithms (FCFS, SSTF, SCAN, C-SCAN) and visualizes their head movement and latency on traditional Hard Disk Drives (HDDs) versus Solid State Drives (SSDs).

## Algorithms Used
1. **FCFS (First Come First Serve)**: Processes requests in the exact order they arrive.
2. **SSTF (Shortest Seek Time First)**: Selects the pending request closest to the current head position to minimize head movement.
3. **SCAN (Elevator Algorithm)**: The disk arm moves from one end of the disk to the other, servicing requests along the way, then reverses direction.
4. **C-SCAN (Circular SCAN)**: Similar to SCAN, but upon reaching one end of the disk, it immediately returns to the beginning without servicing any requests on the return trip.

## Features
- Interactive Web Dashboard with modern, responsive Dark Mode styling.
- Configurable inputs for initial head position, disk size, and a custom request queue.
- Random workload generator for stress testing algorithm performance.
- Side-by-side performance comparisons (Avg Seek Time, Total Head Movement, HDD vs SSD Times).
- Advanced visualizations using Chart.js to map head movement step-by-step and contrast algorithm efficiencies.

## How to Run the Project

### Prerequisites
- Python 3.8+
- PIP

### Installation & Execution
1. Clone the repository and navigate to the project directory:
   ```bash
   cd disk-scheduling-analyzer
   ```

2. Install the necessary Python packages:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the Flask Server:
   ```bash
   python app.py
   ```

4. Open your web browser and navigate to:
   [http://localhost:5000](http://localhost:5000)
