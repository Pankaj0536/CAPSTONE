def calculate_metrics(execution_order, initial_head):
    head_movement = 0
    current_head = initial_head
    for req in execution_order:
        head_movement += abs(current_head - req)
        current_head = req
    
    num_requests = len(execution_order)
    average_seek_time = (head_movement * 0.1) / num_requests if num_requests > 0 else 0
    
    # HDD Time: head_movement * 0.1 + (rotational_latency + transfer_time) * num_requests
    # Let's assume average rotational latency = 4.16 ms (7200 RPM), transfer time = 0.1 ms
    rotational_latency = 4.16
    transfer_time = 0.1
    hdd_time = (head_movement * 0.1) + ((rotational_latency + transfer_time) * num_requests)
    
    # SSD Time: 0.1 ms per request
    ssd_time = 0.1 * num_requests
    
    return {
        "execution_order": execution_order,
        "total_head_movement": head_movement,
        "average_seek_time": float(f"{average_seek_time:.2f}"),
        "hdd_time": float(f"{hdd_time:.2f}"),
        "ssd_time": float(f"{ssd_time:.2f}")
    }

def fcfs(queue, initial_head, disk_size: int):
    execution_order = queue.copy()
    return calculate_metrics(execution_order, initial_head)

def sstf(queue, initial_head, disk_size: int):
    unvisited = queue.copy()
    execution_order = []
    current_head = initial_head
    
    while unvisited:
        closest = min(unvisited, key=lambda x: abs(current_head - x))
        execution_order.append(closest)
        unvisited.remove(closest)
        current_head = closest
        
    return calculate_metrics(execution_order, initial_head)

def scan(queue, initial_head, disk_size: int):
    # Standard SCAN: go towards higher cylinder (up), then down.
    execution_order = []
    left = [x for x in queue if x < initial_head]
    right = [x for x in queue if x >= initial_head]
    
    left.sort(reverse=True)
    right.sort()
    
    # Go right first
    for req in right:
        execution_order.append(req)
        
    # Go to end if there are left requests, or just if we do full SCAN
    if left:
        # Move to end of disk
        if not execution_order or execution_order[-1] != disk_size - 1:
            # We don't necessarily add the endpoint to the execution order as a user request,
            # but we need to track head movement to the end.
            # To show it in execution order is common for SCAN visualization.
            execution_order.append(disk_size - 1)
            
        for req in left:
            execution_order.append(req)
            
    return calculate_metrics(execution_order, initial_head)

def c_scan(queue, initial_head, disk_size: int):
    # C-SCAN: go towards higher cylinder, jump to 0, then go up again.
    execution_order = []
    left = [x for x in queue if x < initial_head]
    right = [x for x in queue if x >= initial_head]
    
    left.sort()
    right.sort()
    
    for req in right:
        execution_order.append(req)
        
    if left:
        if not execution_order or execution_order[-1] != disk_size - 1:
            execution_order.append(disk_size - 1)
        # Jump to 0
        execution_order.append(0)
        
        for req in left:
            execution_order.append(req)
            
    return calculate_metrics(execution_order, initial_head)

def look(queue, initial_head, disk_size: int):
    execution_order = []
    left = [x for x in queue if x < initial_head]
    right = [x for x in queue if x >= initial_head]
    
    left.sort(reverse=True)
    right.sort()
    
    # Go right first
    for req in right:
        execution_order.append(req)
        
    # Then go left (no jumping to end of disk)
    for req in left:
        execution_order.append(req)
            
    return calculate_metrics(execution_order, initial_head)

def c_look(queue, initial_head, disk_size: int):
    execution_order = []
    left = [x for x in queue if x < initial_head]
    right = [x for x in queue if x >= initial_head]
    
    left.sort()
    right.sort()
    
    # Go right first
    for req in right:
        execution_order.append(req)
        
    # Jump to lowest request and go right again
    for req in left:
        execution_order.append(req)
            
    return calculate_metrics(execution_order, initial_head)

def n_step_scan(queue, initial_head: int, disk_size: int, n: int = 10):
    execution_order = []
    current_head = initial_head
    
    # Split queue into chunks of size N
    for i in range(0, len(queue), n):
        chunk = queue[i:i+n]
        left = [x for x in chunk if x < current_head]
        right = [x for x in chunk if x >= current_head]
        
        left.sort(reverse=True)
        right.sort()
        
        # SCAN logic for this chunk
        for req in right:
            execution_order.append(req)
            current_head = req
            
        if left:
            if not execution_order or execution_order[-1] != int(disk_size) - 1:
                execution_order.append(int(disk_size) - 1)
                current_head = int(disk_size) - 1
                
            for req in left:
                execution_order.append(req)
                current_head = req

    return calculate_metrics(execution_order, initial_head)

def f_scan(queue, initial_head, disk_size: int):
    # F-SCAN splits requests into two queues. 
    # For a static initial queue, it acts like a single N-Step SCAN 
    # where N is the total number of initial requests.
    return scan(queue, initial_head, disk_size)