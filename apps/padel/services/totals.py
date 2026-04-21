"""Per-set totals."""
from ..constants import ERROR_FIELDS, SUCCESS_FIELDS


def calculate_error_total(row_data):
    return sum(row_data[field] for field in ERROR_FIELDS)


def calculate_success_total(row_data):
    return sum(row_data[field] for field in SUCCESS_FIELDS)


def calculate_balance_total(total_errors, total_successes):
    return total_successes - total_errors
