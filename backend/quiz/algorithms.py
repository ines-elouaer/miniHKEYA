# backend/algorithms.py

from collections import deque

def get_neighbors(pos, grid):
    rows, cols = len(grid), len(grid[0])
    (r, c) = pos
    directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]
    for dr, dc in directions:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0:
            yield (nr, nc)


def dfs(grid, start, goal):
    stack = [start]
    visited = []
    parent = {start: None}

    while stack:
        current = stack.pop()
        if current in visited:
            continue
        visited.append(current)

        if current == goal:
            break

        for nxt in get_neighbors(current, grid):
            if nxt not in parent:
                parent[nxt] = current
                stack.append(nxt)

    path = []
    if goal in parent:
        cur = goal
        while cur is not None:
            path.append(cur)
            cur = parent[cur]
        path.reverse()

    return visited, path


def bfs(grid, start, goal):
    from collections import deque
    queue = deque([start])
    visited = []
    parent = {start: None}

    while queue:
        current = queue.popleft()
        if current in visited:
            continue
        visited.append(current)

        if current == goal:
            break

        for nxt in get_neighbors(current, grid):
            if nxt not in parent:
                parent[nxt] = current
                queue.append(nxt)

    path = []
    if goal in parent:
        cur = goal
        while cur is not None:
            path.append(cur)
            cur = parent[cur]
        path.reverse()

    return visited, path
