"""Every Python function shown in frag_recdp sections, with asserts against the course results."""
from functools import cmp_to_key
from itertools import combinations
from typing import NamedTuple
import random

MENU = {
    "Кухня": {
        "Перші страви": {"Борщ": 95, "Юшка": 85},
        "Основні": {"Вареники": 80, "Деруни": 75},
    },
    "Напої": {
        "Гарячі": {"Чай": 30, "Кава": {"Еспресо": 40, "Лате": 55}},
        "Холодні": {"Узвар": 35},
    },
    "Хліб": 10,
}


# ---- callstack
def count_dishes(node):
    if not isinstance(node, dict):
        return 1                        # страва — базовий випадок
    total = 0
    for child in node.values():
        total += count_dishes(child)    # спуск у підменю
    return total


def total_price(node):
    if not isinstance(node, dict):
        return node                     # страва — базовий випадок
    total = 0
    for child in node.values():
        total += total_price(child)     # спуск у підменю
    return total


def count_dishes_iterative(menu):
    stack = [menu]
    count = 0
    while stack:
        node = stack.pop()              # з вершини стека
        if isinstance(node, dict):
            stack.extend(node.values()) # підпункти — на стек
        else:
            count += 1
    return count


def total_price_iterative(menu):
    stack = [menu]
    total = 0
    while stack:
        node = stack.pop()              # з вершини стека
        if isinstance(node, dict):
            stack.extend(node.values()) # підпункти — на стек
        else:
            total += node
    return total


assert count_dishes(MENU) == 9 and count_dishes(MENU["Напої"]) == 4 and count_dishes(95) == 1
assert total_price(MENU) == 505
assert count_dishes_iterative(MENU) == 9 and total_price_iterative(MENU) == 505


# ---- backtrack
def voucher_sets(fares, target):
    found = []

    def explore(start, chosen, total):
        if total == target:
            found.append(list(chosen))   # знайшли набір
            return
        for i in range(start, len(fares)):
            chosen.append(fares[i])         # спробувати
            explore(i + 1, chosen, total + fares[i])
            chosen.pop()                    # повернутися назад

    explore(0, [], 0)
    return found


def voucher_sets_pruned(fares, target):
    fares = sorted(fares)
    found = []

    def explore(start, chosen, total):
        if total == target:
            found.append(list(chosen))   # знайшли набір
            return
        for i in range(start, len(fares)):
            if total + fares[i] > target:   # далі лише дорожчі
                break                       # відсікаємо гілку
            chosen.append(fares[i])         # спробувати
            explore(i + 1, chosen, total + fares[i])
            chosen.pop()                    # повернутися назад

    explore(0, [], 0)
    return found


trip_fares = [230, 150, 270, 180, 120, 410]
a = voucher_sets(trip_fares, 500)
b = voucher_sets_pruned(trip_fares, 500)
assert sorted(map(sorted, a)) == sorted(map(sorted, b))
print("voucher 500:", a, b)


def count_calls(fares, target, pruned):
    fares = sorted(fares) if pruned else fares
    calls = 0

    def explore(start, total):
        nonlocal calls
        calls += 1
        if total == target:
            return
        for i in range(start, len(fares)):
            if pruned and total + fares[i] > target:
                break
            explore(i + 1, total + fares[i])

    explore(0, 0)
    return calls


for t in (400, 500, 600):
    print("calls", t, count_calls(trip_fares, t, False), count_calls(trip_fares, t, True))


# ---- sortrace
comparisons = 0


def compare(a, b):
    global comparisons
    comparisons += 1
    return (a > b) - (a < b)


data = [5, 2, 9, 1, 7]
assert sorted(data, key=cmp_to_key(compare)) == [1, 2, 5, 7, 9] and comparisons > 0


def heapify(arr, size, root):
    largest = root
    left, right = 2 * root + 1, 2 * root + 2
    if left < size and arr[left] > arr[largest]:
        largest = left
    if right < size and arr[right] > arr[largest]:
        largest = right
    if largest != root:
        arr[root], arr[largest] = arr[largest], arr[root]
        heapify(arr, size, largest)


def heap_sort(arr):
    n = len(arr)
    for i in range(n // 2 - 1, -1, -1):     # 1. будуємо max-купу
        heapify(arr, n, i)
    for end in range(n - 1, 0, -1):         # 2. максимум — у кінець
        arr[0], arr[end] = arr[end], arr[0]
        heapify(arr, end, 0)
    return arr


for _ in range(200):
    d = [random.randint(0, 50) for _ in range(random.randint(0, 30))]
    assert heap_sort(d[:]) == sorted(d)


# ---- intervals / wis
class Order(NamedTuple):
    name: str
    start: int
    end: int
    reward: int


def max_orders(orders):
    chosen = []
    last_end = None
    for order in sorted(orders, key=lambda o: o.end):
        if last_end is None or order.start >= last_end:
            chosen.append(order)
            last_end = order.end
    return chosen


def greedy_by(orders, key):
    chosen = []
    for order in sorted(orders, key=key):
        if all(order.start >= c.end or order.end <= c.start for c in chosen):
            chosen.append(order)
    return chosen


orders = [Order("А", 9, 10, 200), Order("Б", 10, 11, 200), Order("В", 9, 11, 550), Order("Г", 11, 12, 200)]
shift = [
    Order("А", 9, 10, 200), Order("Б", 10, 11, 200), Order("В", 9, 11, 550),
    Order("Г", 11, 12, 200), Order("Ґ", 12, 14, 380), Order("Д", 11, 13, 300),
    Order("Е", 13, 15, 250), Order("Є", 14, 16, 420), Order("Ж", 15, 17, 260),
    Order("З", 16, 18, 330),
]
early = [Order("Л", 8, 12, 0), Order("М", 9, 10, 0), Order("Н", 10, 11, 0)]
short_trap = [Order("П", 9, 12, 0), Order("Р", 11, 13, 0), Order("С", 12, 15, 0)]
assert [o.name for o in max_orders(orders)] == ["А", "Б", "Г"]
assert [o.name for o in max_orders(early)] == ["М", "Н"]
assert len(greedy_by(early, lambda o: o.start)) == 1
assert len(greedy_by(short_trap, lambda o: o.end - o.start)) == 1 and len(max_orders(short_trap)) == 2
print("shift greedy:", [o.name for o in max_orders(shift)])


def prev_compatible(orders):
    p = [0] * (len(orders) + 1)
    for i in range(1, len(orders) + 1):
        start = orders[i - 1].start
        for j in range(i - 1, 0, -1):
            if orders[j - 1].end <= start:
                p[i] = j
                break
    return p


def best_schedule(orders):
    orders = sorted(orders, key=lambda o: o.end)
    p = prev_compatible(orders)        # p[i]: останнє сумісне перед i
    dp = [0] * (len(orders) + 1)
    for i in range(1, len(orders) + 1):
        skip = dp[i - 1]
        take = orders[i - 1].reward + dp[p[i]]
        dp[i] = max(skip, take)
    chosen, i = [], len(orders)
    while i > 0:
        if orders[i - 1].reward + dp[p[i]] > dp[i - 1]:
            chosen.append(orders[i - 1])
            i = p[i]
        else:
            i -= 1
    return list(reversed(chosen))


def total(s):
    return sum(o.reward for o in s)


assert [o.name for o in best_schedule(orders)] == ["В", "Г"] and total(best_schedule(orders)) == 750
assert total(best_schedule(shift)) == 1880
print("shift best:", [o.name for o in best_schedule(shift)], total(best_schedule(shift)))


def brute(orders):
    best = 0
    for k in range(len(orders) + 1):
        for c in combinations(orders, k):
            if all(a.end <= b.start or b.end <= a.start for a, b in combinations(c, 2)):
                best = max(best, total(c))
    return best


assert total(best_schedule(shift)) == brute(shift)


# ---- coindp
def min_coins(amount, coins):
    dp = [0] + [float("inf")] * amount   # dp[s]: найменше монет для суми s
    choice = [None] * (amount + 1)
    for s in range(1, amount + 1):
        for coin in coins:
            if coin <= s and dp[s - coin] + 1 < dp[s]:
                dp[s] = dp[s - coin] + 1
                choice[s] = coin
    if dp[amount] == float("inf"):
        return None
    result = []
    while amount > 0:
        result.append(choice[amount])
        amount -= choice[amount]
    return result


assert sorted(min_coins(6, [1, 3, 4])) == [3, 3]
assert len(min_coins(63, [25, 10, 5, 1])) == 6
assert min_coins(7, [2, 4]) is None
print("all ok")
