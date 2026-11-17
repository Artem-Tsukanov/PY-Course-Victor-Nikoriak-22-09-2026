"""Every function/class shown in frag_treegraph — checked with asserts."""
import heapq
from collections import deque


# ---- bst ----
class Node:
    def __init__(self, value):
        self.value = value
        self.left = self.right = None

def bst_insert(node, value):
    if node is None:
        return Node(value)
    if value < node.value:
        node.left = bst_insert(node.left, value)
    elif value > node.value:
        node.right = bst_insert(node.right, value)
    return node

def bst_search_count(node, target):
    steps = 0
    while node:
        steps += 1
        if node.value == target:
            return steps
        elif target < node.value:
            node = node.left
        else:
            node = node.right
    return steps


def height(n):
    return -1 if n is None else 1 + max(height(n.left), height(n.right))

root = None
for v in [50, 30, 70, 20, 40, 60, 80]:
    root = bst_insert(root, v)
assert bst_search_count(root, 60) == 3 and height(root) == 2
skew = None
for v in range(1, 8):
    skew = bst_insert(skew, v)
assert height(skew) == 6 and bst_search_count(skew, 7) == 7


# ---- traverse ----
def preorder(node, result):
    if node is not None:
        result.append(node.value)
        preorder(node.left, result)
        preorder(node.right, result)
    return result

def inorder(node, result):
    if node is not None:
        inorder(node.left, result)
        result.append(node.value)
        inorder(node.right, result)
    return result

def postorder(node, result):
    if node is not None:
        postorder(node.left, result)
        postorder(node.right, result)
        result.append(node.value)
    return result

def bfs_traversal(root):
    result = []
    queue = deque([root])
    while queue:
        node = queue.popleft()
        result.append(node.value)
        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)
    return result

t = None
for v in [50, 30, 70, 20, 40, 60, 80, 45, 65]:
    t = bst_insert(t, v)
assert preorder(t, []) == [50, 30, 20, 40, 45, 70, 60, 65, 80]
assert inorder(t, []) == sorted([50, 30, 70, 20, 40, 60, 80, 45, 65])
assert postorder(t, []) == [20, 45, 40, 30, 65, 60, 80, 70, 50]
assert bfs_traversal(t) == [50, 30, 70, 20, 40, 60, 80, 45, 65]


# ---- heap ----
class MinHeap:
    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)
        self._sift_up(len(self._items) - 1)

    def pop(self):
        top = self._items[0]
        last = self._items.pop()
        if self._items:
            self._items[0] = last
            self._sift_down(0)
        return top

    def _sift_up(self, i):
        while i > 0:
            parent = (i - 1) // 2
            if not self._items[i] < self._items[parent]:
                break
            self._items[i], self._items[parent] = self._items[parent], self._items[i]
            i = parent

    def _sift_down(self, i):
        n = len(self._items)
        while True:
            smallest = i
            for child in (2 * i + 1, 2 * i + 2):
                if child < n and self._items[child] < self._items[smallest]:
                    smallest = child
            if smallest == i:
                break
            self._items[i], self._items[smallest] = self._items[smallest], self._items[i]
            i = smallest

h = MinHeap()
for x in [30, 12, 45, 7, 20, 3, 18]:
    h.push(x)
assert h._items[0] == 3
assert [h.pop() for _ in range(7)] == [3, 7, 12, 18, 20, 30, 45]


# ---- trie ----
class _Node:
    def __init__(self):
        self.children = {}
        self.is_word = False

class Trie:
    def __init__(self):
        self._root = _Node()

    def add(self, word):
        node = self._root
        for letter in word:
            node = node.children.setdefault(letter, _Node())
        node.is_word = True

    def _find(self, prefix):
        node = self._root
        for letter in prefix:
            node = node.children.get(letter)
            if node is None:
                return None
        return node

    def starts_with(self, prefix):
        node = self._find(prefix)
        if node is None:
            return []
        words = []
        self._collect(node, prefix, words)
        return words

    def _collect(self, node, path, words):
        if node.is_word:
            words.append(path)
        for letter in sorted(node.children):
            self._collect(node.children[letter], path + letter, words)

tr = Trie()
for w in ["борщ", "бограч", "банош", "біляш", "вареники", "вертута"]:
    tr.add(w)
assert tr.starts_with("бо") == ["бограч", "борщ"]
assert tr.starts_with("б") == ["банош", "бограч", "борщ", "біляш"]   # 'і' after 'о' in Unicode
assert tr.starts_with("ве") == ["вертута"] and tr.starts_with("г") == []


# ---- dijkstra ----
def dijkstra(graph, start):
    dist = {node: float('inf') for node in graph}
    prev = {node: None for node in graph}
    dist[start] = 0
    heap = [(0, start)]
    visited = set()
    while heap:
        cost, node = heapq.heappop(heap)
        if node in visited:
            continue
        visited.add(node)
        for neighbor, weight in graph[node]:
            new_cost = cost + weight
            if new_cost < dist[neighbor]:
                dist[neighbor] = new_cost
                prev[neighbor] = node
                heapq.heappush(heap, (new_cost, neighbor))
    return dist, prev

def reconstruct_path(prev, target):
    path = []
    while target is not None:
        path.append(target)
        target = prev[target]
    return path[::-1]

EDGES = [("A", "B", 6), ("A", "E", 2), ("E", "B", 3), ("A", "D", 7), ("D", "F", 11),
         ("B", "C", 4), ("B", "F", 8), ("C", "F", 3), ("C", "G", 6), ("F", "G", 5)]
G = {k: [] for k in "ABCDEFG"}
for u, v, w in EDGES:
    G[u].append((v, w)); G[v].append((u, w))
d, p = dijkstra(G, "A")
assert d == {"A": 0, "B": 5, "C": 9, "D": 7, "E": 2, "F": 12, "G": 15}
assert reconstruct_path(p, "G") == ["A", "E", "B", "C", "G"]


# ---- bellman-ford ----
def bellman_ford(nodes, edges, start):
    dist = {node: float('inf') for node in nodes}
    dist[start] = 0
    for _ in range(len(nodes) - 1):
        changed = False
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                changed = True
        if not changed:
            break
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            raise ValueError("від'ємний цикл")
    return dist

BF = [("C", "D", 2), ("A", "C", 3), ("B", "A", -3), ("S", "A", 4), ("S", "B", 5), ("B", "D", 6)]
assert bellman_ford("SABCD", BF, "S") == {"S": 0, "A": 2, "B": 5, "C": 5, "D": 7}
try:
    bellman_ford("SABCD", BF + [("C", "B", -5)], "S")
    raise AssertionError("cycle not detected")
except ValueError:
    pass
print("check_treegraph: all asserts passed")
