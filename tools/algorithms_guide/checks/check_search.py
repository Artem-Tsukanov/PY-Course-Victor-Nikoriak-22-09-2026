"""Every Python function shown in frag_search.html, with checks. Run: python3 check_search.py"""
from bisect import bisect_left
import random


# ---- bisect -------------------------------------------------------------
def first_at_or_after(times, target):
    low, high = 0, len(times)
    while low < high:
        mid = (low + high) // 2
        if times[mid] < target:
            low = mid + 1
        else:
            high = mid
    return low            # те саме, що bisect_left(times, target)


def suggest(streets, prefix):
    start = bisect_left(streets, prefix)
    end = bisect_left(streets, prefix + "￿")
    return streets[start:end]


starts = [425, 510, 612, 700, 845, 930, 1035, 1120, 1210, 1290, 1375]
assert first_at_or_after(starts, 1120) == 7
assert first_at_or_after(starts, 1100) == 7
assert first_at_or_after(starts, 1400) == 11
assert first_at_or_after(starts, 0) == 0
assert first_at_or_after([], 5) == 0
for t in range(300, 1500):
    assert first_at_or_after(starts, t) == bisect_left(starts, t)

STREETS = sorted(["Богдана Хмельницького", "Велика Васильківська", "Верхній Вал",
                  "Володимирська", "Хрещатик", "Хорива", "Шота Руставелі",
                  "Антоновича", "Саксаганського", "Січових Стрільців", "Ярославів Вал",
                  "Межигірська", "Мечникова"])
assert suggest(STREETS, "В") == ["Велика Васильківська", "Верхній Вал", "Володимирська"]
assert suggest(STREETS, "Ве") == ["Велика Васильківська", "Верхній Вал"]
assert suggest(STREETS, "Ме") == ["Межигірська", "Мечникова"]
assert suggest(STREETS, "Я") == ["Ярославів Вал"]
assert suggest(STREETS, "Ю") == []
assert suggest(STREETS, "") == STREETS
print("JS order check:", STREETS)


# ---- two pointers -------------------------------------------------------
def pair_with_sum(prices, target):
    left, right = 0, len(prices) - 1
    while left < right:
        total = prices[left] + prices[right]
        if total == target:
            return prices[left], prices[right]
        if total < target:
            left += 1        # потрібна більша сума
        else:
            right -= 1       # потрібна менша сума
    return None


fares = [120, 150, 180, 230, 270, 320, 410]
assert pair_with_sum(fares, 500) == (180, 320)
assert pair_with_sum(fares, 10_000) is None
assert pair_with_sum([], 500) is None
for _ in range(2000):
    xs = sorted(random.sample(range(10, 600, 10), 9))
    t = random.choice(range(100, 1100, 10))
    brute = {(a, b) for i, a in enumerate(xs) for b in xs[i + 1:] if a + b == t}
    got = pair_with_sum(xs, t)
    assert (got is None) == (not brute) and (got is None or got in brute)


# ---- sliding window -----------------------------------------------------
def busiest_window(counts, k):
    window_sum = sum(counts[0:k])
    best_start, best_sum = 0, window_sum
    for end in range(k, len(counts)):
        window_sum += counts[end] - counts[end - k]
        if window_sum > best_sum:
            best_start, best_sum = end - k + 1, window_sum
    return best_start, best_sum


per_hour = [3, 1, 0, 0, 1, 4, 12, 30, 41, 25, 18, 20,
            22, 19, 17, 21, 33, 45, 52, 38, 24, 15, 9, 6]
assert busiest_window(per_hour, 3) == (17, 135)
for k in range(1, 25):
    naive = max(((sum(per_hour[s:s + k]), -s) for s in range(25 - k)))
    assert busiest_window(per_hour, k) == (-naive[1], naive[0]), k


# ---- hash table ---------------------------------------------------------
DUMMY = object()          # «надгробок» на місці видаленого ключа


class HashTable:
    def __init__(self, size=8):
        self.slots = [None] * size        # None | (key, value) | DUMMY
        self.used = 0                     # ключі + надгробки

    def _index(self, key):                # навчальний хеш: сума кодів літер
        return sum(ord(c) for c in key) % len(self.slots)

    def set(self, key, value):
        if (self.used + 1) / len(self.slots) > 2 / 3:
            self._resize(2 * len(self.slots))
        i, free = self._index(key), None
        while self.slots[i] is not None:
            if self.slots[i] is DUMMY:
                if free is None:
                    free = i              # запам'ятати перший надгробок
            elif self.slots[i][0] == key:
                self.slots[i] = (key, value)   # оновити значення
                return
            i = (i + 1) % len(self.slots)      # лінійне зондування
        if free is None:
            free = i
            self.used += 1
        self.slots[free] = (key, value)

    def get(self, key):
        i = self._index(key)
        while self.slots[i] is not None:       # DUMMY не зупиняє пошук
            if self.slots[i] is not DUMMY and self.slots[i][0] == key:
                return self.slots[i][1]
            i = (i + 1) % len(self.slots)
        raise KeyError(key)

    def delete(self, key):
        i = self._index(key)
        while self.slots[i] is not None:
            if self.slots[i] is not DUMMY and self.slots[i][0] == key:
                self.slots[i] = DUMMY          # не None, інакше пошук обірветься
                return
            i = (i + 1) % len(self.slots)
        raise KeyError(key)

    def _resize(self, size):
        old = [s for s in self.slots if s is not None and s is not DUMMY]
        self.slots, self.used = [None] * size, 0
        for key, value in old:
            self.set(key, value)


def keys_at(t):
    return {i: (s if s is DUMMY else s[0]) for i, s in enumerate(t.slots) if s is not None}


# preset 1: collisions + wrap-around
t = HashTable()
for k, v in [("Поділ", 12), ("Троєщина", 7), ("Оболонь", 9), ("Печерськ", 15)]:
    t.set(k, v)
assert keys_at(t) == {2: "Поділ", 3: "Троєщина", 7: "Оболонь", 0: "Печерськ"}
assert t.get("Печерськ") == 15
try:
    t.get("Позняки"); raise AssertionError
except KeyError:
    pass
# preset 2: tombstone
t = HashTable()
for k, v in [("Поділ", 12), ("Троєщина", 7), ("Теремки", 4)]:
    t.set(k, v)
t.delete("Троєщина")
assert t.slots[3] is DUMMY and t.get("Теремки") == 4
t.set("Позняки", 6)
assert keys_at(t)[3] == "Позняки" and t.used == 3
# preset 3: resize
t = HashTable()
for k, v in [("Поділ", 12), ("Оболонь", 9), ("Виноградар", 5), ("Дарниця", 8), ("Борщагівка", 3)]:
    t.set(k, v)
assert len(t.slots) == 8
t.set("Нивки", 2)
assert len(t.slots) == 16
assert keys_at(t) == {2: "Поділ", 15: "Оболонь", 12: "Виноградар", 14: "Дарниця", 13: "Борщагівка", 9: "Нивки"}
# random vs dict
for _ in range(300):
    t, d = HashTable(), {}
    for _ in range(60):
        k = random.choice(["a", "b", "c", "d", "e", "f", "g", "h", "ab", "ba", "zz"])
        op = random.random()
        if op < .6:
            t.set(k, op); d[k] = op
        elif k in d:
            t.delete(k); del d[k]
        for kk in d:
            assert t.get(kk) == d[kk]


# ---- two sum ------------------------------------------------------------
def pair_with_sum_hash(prices, target):
    seen = {}                          # ціна → індекс
    for i, price in enumerate(prices):
        need = target - price
        if need in seen:               # O(1) у середньому
            return seen[need], i
        seen[price] = i
    return None


prices = [230, 410, 120, 270, 150, 320, 180]
assert pair_with_sum_hash(prices, 500) == (0, 3)
assert pair_with_sum_hash(prices, 10_000) is None
assert pair_with_sum_hash([250, 250], 500) == (0, 1)


# ---- anagrams -----------------------------------------------------------
def group_anagrams(words):
    groups = {}
    for word in words:
        key = "".join(sorted(word.lower()))    # канонічний ключ
        groups.setdefault(key, []).append(word)
    return list(groups.values())


words = ["літо", "клоун", "тіло", "таксі", "уклон", "кіт", "тік", "кит"]
assert group_anagrams(words) == [["літо", "тіло"], ["клоун", "уклон"], ["таксі"], ["кіт", "тік"], ["кит"]]
assert group_anagrams([]) == []
print("all checks OK")
