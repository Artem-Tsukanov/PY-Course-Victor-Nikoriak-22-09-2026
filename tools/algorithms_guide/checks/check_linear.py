"""Every Python snippet shown in frag_linear, with asserts. Run: python3 check_linear.py"""
from collections import OrderedDict, deque


# ---------- arrlist ----------
def array_insert(arr, index, value):
    arr.append(None)  # +1 місце в кінці
    for i in range(len(arr) - 1, index, -1):
        arr[i] = arr[i - 1]  # зсув праворуч
    arr[index] = value


class Node:
    def __init__(self, data, next_node=None):
        self.data = data
        self.next = next_node


def linked_insert(head, index, value):
    if index == 0:
        return Node(value, head)  # новий стає головою
    prev = head
    for _ in range(index - 1):  # дійти до попередника
        prev = prev.next
    prev.next = Node(value, prev.next)  # 2 посилання — і все
    return head


def build(values):
    head = None
    for v in reversed(values):
        head = Node(v, head)
    return head


def to_list(head):
    out = []
    while head:
        out.append(head.data)
        head = head.next
    return out


for k in (0, 3, 6):
    a = [101, 102, 103, 104, 105, 106]
    expected = a[:k] + [100] + a[k:]
    array_insert(a, k, 100)
    assert a == expected
    assert to_list(linked_insert(build([101, 102, 103, 104, 105, 106]), k, 100)) == expected


# ---------- revlist ----------
def reverse_linked_list(head):
    prev = None
    cur = head
    while cur:
        nxt = cur.next  # запам'ятати наступний
        cur.next = prev  # розвернути стрілку
        prev = cur  # prev — крок вперед
        cur = nxt  # cur — крок вперед
    return prev  # нова голова


assert to_list(reverse_linked_list(build([1, 2, 3, 4, 5]))) == [5, 4, 3, 2, 1]
assert reverse_linked_list(None) is None


# ---------- brackets ----------
PAIRS = {")": "(", "]": "[", "}": "{"}


def is_balanced(text):
    opened = []  # стек
    for char in text:
        if char in "([{":
            opened.append(char)  # push
        elif char in PAIRS:
            if not opened or opened.pop() != PAIRS[char]:
                return False
    return not opened


assert is_balanced("Замовлення {id} (кур'єр: {name}) [до {time}]")
assert not is_balanced("({)}")
assert not is_balanced("((")
assert not is_balanced("())")
assert is_balanced("без дужок")


# ---------- queue ----------
dispatched = []


def dispatch(order):
    dispatched.append(order)


orders = [101, 102, 103, 104, 105, 106, 107, 108]
while orders:
    order = orders.pop(0)  # зсуває всіх, хто лишився
    dispatch(order)

orders = deque([101, 102, 103, 104, 105, 106, 107, 108])
while orders:
    order = orders.popleft()  # O(1): лише зсув «голови»
    dispatch(order)
assert dispatched == [101, 102, 103, 104, 105, 106, 107, 108] * 2
n = 8
assert sum(range(n)) == n * (n - 1) // 2 == 28  # зсувів у list-версії


# ---------- windowmax ----------
def sliding_window_max(nums, k):
    window = deque()  # індекси; значення спадають
    result = []
    for i, x in enumerate(nums):
        if window and window[0] <= i - k:
            window.popleft()  # вийшов з вікна
        while window and nums[window[-1]] <= x:
            window.pop()  # менші вже не знадобляться
        window.append(i)
        if i >= k - 1:
            result.append(nums[window[0]])
    return result


assert sliding_window_max([1, 3, -1, -3, 5, 3, 6, 7], 3) == [3, 3, 5, 5, 6, 7]
data = [4, 2, 12, 3, 8, 6, 7, 5, 9, 1]
for k in range(1, 6):
    assert sliding_window_max(data, k) == [max(data[i:i + k]) for i in range(len(data) - k + 1)]


# ---------- lru ----------
class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self._data = OrderedDict()  # зліва — найдавніший
        self.hits = 0
        self.misses = 0

    def get(self, key, default=None):
        if key not in self._data:
            self.misses += 1
            return default  # промах
        self.hits += 1
        self._data.move_to_end(key)  # щойно використали
        return self._data[key]

    def put(self, key, value):
        if key in self._data:
            self._data.move_to_end(key)
        self._data[key] = value
        if len(self._data) > self.capacity:
            self._data.popitem(last=False)  # викинути найдавніший


cache = LRUCache(3)
cache.put("Поділ→Оболонь", 180)
cache.put("Центр→Поділ", 120)
cache.put("Оболонь→Центр", 150)
assert cache.get("Поділ→Оболонь") == 180
cache.put("Лівобережна→Центр", 210)
assert list(cache._data) == ["Оболонь→Центр", "Поділ→Оболонь", "Лівобережна→Центр"]
assert cache.get("Центр→Поділ") is None
cache.put("Центр→Поділ", 125)
assert list(cache._data) == ["Поділ→Оболонь", "Лівобережна→Центр", "Центр→Поділ"]
assert cache.get("Оболонь→Центр") is None
assert cache.get("Лівобережна→Центр") == 210
assert list(cache._data) == ["Поділ→Оболонь", "Центр→Поділ", "Лівобережна→Центр"]
assert (cache.hits, cache.misses) == (2, 2)
print("check_linear: all asserts passed")
