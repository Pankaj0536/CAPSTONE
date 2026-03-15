from algorithms import fcfs, sstf, scan, c_scan, look, c_look, n_step_scan, f_scan

queue = [98, 183, 37, 122, 14, 124, 65, 67]
initial_head = 53
disk_size = 200

algos = [fcfs, sstf, scan, c_scan, look, c_look, n_step_scan, f_scan]
names = ["FCFS", "SSTF", "SCAN", "C-SCAN", "LOOK", "C-LOOK", "N-STEP SCAN", "F-SCAN"]

print("--- Algorithm Test Results ---")
for name, func in zip(names, algos):
    try:
        if name == "N-STEP SCAN":
            res = func(queue, initial_head, disk_size, n=10)
        else:
            res = func(queue, initial_head, disk_size)
        print(f"{name}: Head Movement: {res['total_head_movement']} | Order Length: {len(res['execution_order'])} | Output: {res['execution_order']}")
    except Exception as e:
        print(f"{name} FAILED: {str(e)}")
        
print("\nTests completed successfully.")
