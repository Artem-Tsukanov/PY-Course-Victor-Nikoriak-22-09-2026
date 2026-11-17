"""Функції, які запускаємо в процесах: мають бути у файлі, щоб процеси могли їх імпортувати."""
import os
import time

orders = []


def count_primes(limit):
    """Кількість простих чисел, менших за limit. Навмисно повільно: перебір дільників."""
    count = 0
    for n in range(2, limit):
        for d in range(2, int(n ** 0.5) + 1):
            if n % d == 0:
                break
        else:
            count += 1
    return count


def add_order(name):
    orders.append(name)      # додає у СВОЮ копію списку
    return len(orders)


def worker_pid(task):
    """Повертає номер процесу, який виконав задачу."""
    time.sleep(0.05)         # трохи роботи, щоб задачі розійшлися між працівниками
    return os.getpid()
