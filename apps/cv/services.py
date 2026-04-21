"""CV data loading service. Caches the JSON in memory."""
import json
from functools import lru_cache
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent / 'data' / 'cv_data.json'


@lru_cache(maxsize=1)
def load_cv_data():
    with DATA_PATH.open('r', encoding='utf-8') as fh:
        return json.load(fh)


def reload_cv_data():
    load_cv_data.cache_clear()
    return load_cv_data()
