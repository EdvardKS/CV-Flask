"""Projects: data lives in the CV JSON; we expose only what's needed."""
from apps.cv.services import load_cv_data


def list_projects():
    data = load_cv_data().get('translations', {}).get('projects', {})
    return data.get('entries', [])
