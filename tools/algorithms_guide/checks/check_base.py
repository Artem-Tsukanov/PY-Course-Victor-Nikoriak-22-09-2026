def has_duplicates_v1(data):
    for i in range(len(data)):
        for j in range(i + 1, len(data)):
            if data[i] == data[j]:
                return True
    return False
def has_duplicates_v2(data):
    seen = set()
    for value in data:
        if value in seen:
            return True
        seen.add(value)
    return False
def heap_sort(arr):
    n = len(arr)
    for i in range(n // 2 - 1, -1, -1):  # max-купа
        heapify(arr, n, i)
    for end in range(n - 1, 0, -1):
        arr[0], arr[end] = arr[end], arr[0]  # максимум у кінець
        heapify(arr, end, 0)
def heapify(arr, n, i):
    largest = i
    left, right = 2 * i + 1, 2 * i + 2
    if left < n and arr[left] > arr[largest]:
        largest = left
    if right < n and arr[right] > arr[largest]:
        largest = right
    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        heapify(arr, n, largest)
import random
for _ in range(300):
    d=[random.randint(0,50) for _ in range(random.randint(0,30))]
    assert has_duplicates_v1(d)==has_duplicates_v2(d)==(len(set(d))<len(d))
    x=d[:]; heap_sort(x); assert x==sorted(d)
calls=0
def fib(n, memo):
    global calls; calls+=1
    if n in memo: return memo[n]
    if n<=2: return 1
    memo[n]=fib(n-1,memo)+fib(n-2,memo); return memo[n]
fib(30,{}); assert calls==57, calls
print("check_base ok")
