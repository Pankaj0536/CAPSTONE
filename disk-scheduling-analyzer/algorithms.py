def calculate_metrics(execution_order, initial_head):
    head_movement = 0
    current_head = initial_head

    for req in execution_order:
        head_movement += abs(current_head - req)
        current_head = req

    num_requests = len(execution_order)

    average_seek_time = (head_movement * 0.1) / num_requests if num_requests > 0 else 0

    # HDD Time calculation
    rotational_latency = 4.16   # ms
    transfer_time = 0.1         # ms

    hdd_time = (head_movement * 0.1) + ((rotational_latency + transfer_time) * num_requests)

    # SSD Time calculation
    ssd_time = 0.1 * num_requests

    return {
        "execution_order": execution_order,

        # ✅ Optional improvement (clear unit)
        "total_head_movement": f"{head_movement} tracks",

        # ✅ Values with units (for UI display)
        "average_seek_time": f"{average_seek_time:.2f} ms",
        "hdd_time": f"{hdd_time:.2f} ms",
        "ssd_time": f"{ssd_time:.2f} ms",

        # 🔥 Keep numeric values (useful if needed later)
        "average_seek_time_value": average_seek_time,
        "hdd_time_value": hdd_time,
        "ssd_time_value": ssd_time
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
    execution_order = []

    left = [x for x in queue if x < initial_head]
    right = [x for x in queue if x >= initial_head]

    left.sort(reverse=True)
    right.sort()

    # Move right
    for req in right:
        execution_order.append(req)

    if left:
        if not execution_order or execution_order[-1] != disk_size - 1:
            execution_order.append(disk_size - 1)

        for req in left:
            execution_order.append(req)

    return calculate_metrics(execution_order, initial_head)


def c_scan(queue, initial_head, disk_size: int):
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

    for req in right:
        execution_order.append(req)

    for req in left:
        execution_order.append(req)

    return calculate_metrics(execution_order, initial_head)


def c_look(queue, initial_head, disk_size: int):
    execution_order = []

    left = [x for x in queue if x < initial_head]
    right = [x for x in queue if x >= initial_head]

    left.sort()
    right.sort()

    for req in right:
        execution_order.append(req)

    for req in left:
        execution_order.append(req)

    return calculate_metrics(execution_order, initial_head)


def n_step_scan(queue, initial_head: int, disk_size: int, n: int = 10):
    execution_order = []
    current_head = initial_head

    for i in range(0, len(queue), n):
        chunk = queue[i:i+n]

        left = [x for x in chunk if x < current_head]
        right = [x for x in chunk if x >= current_head]

        left.sort(reverse=True)
        right.sort()

        for req in right:
            execution_order.append(req)
            current_head = req

        if left:
            if not execution_order or execution_order[-1] != disk_size - 1:
                execution_order.append(disk_size - 1)
                current_head = disk_size - 1

            for req in left:
                execution_order.append(req)
                current_head = req

    return calculate_metrics(execution_order, initial_head)


def f_scan(queue, initial_head, disk_size: int):
    return scan(queue, initial_head, disk_size)