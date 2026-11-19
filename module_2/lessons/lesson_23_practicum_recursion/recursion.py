"""Рекурсивно знайти recurs.jpg в іншій гілці проєкту та показати його."""

from pathlib import Path
from PIL import Image


PROJECT_NAME = "PY-Course-Victor-Nikoriak-22-09-2026"
IMAGE_NAME = "recurs.jpg"


def find_file(folder: Path, filename: str, depth: int = 0) -> Path | None:
    """Знайти файл у папці та всіх її підпапках (рекурсивний обхід)."""
    indent = "    " * depth

    for item in sorted(folder.iterdir()):
        # Базовий випадок: потрібний файл знайдено.
        if item.is_file() and item.name == filename:
            return item

        # Рекурсивний випадок: заглиблюємося у підпапку.
        if item.is_dir():
            result = find_file(item, filename, depth + 1)
            if result is not None:
                return result

    return None


def get_project_root() -> Path:
    """Визначити корінь проєкту за розташуванням цього .py-файлу."""
    here = Path(__file__).resolve().parent
    for folder in (here, *here.parents):
        if folder.name == PROJECT_NAME:
            return folder
    raise FileNotFoundError(
        f"Помістіть recursion.py всередину папки {PROJECT_NAME}. "
        f"Зараз файл розміщено в: {here}"
    )


def main() -> None:
    project = get_project_root()

    image_path = find_file(project, IMAGE_NAME)
    if image_path is None:
        return

    with Image.open(image_path) as source:
        picture = source.copy()


    try:
        from IPython import get_ipython
        ipython = get_ipython()
    except ImportError:
        ipython = None

    if ipython is not None and getattr(ipython, "kernel", None) is not None:
        from IPython.display import display
        display(picture)
    else:
        picture.show()


if __name__ == "__main__":
    main()
