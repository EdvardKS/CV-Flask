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


def build_cv_context():
    data = load_cv_data()
    translations = data.get('translations', {})
    experience = translations.get('workExperience', {}).get('entries', [])
    education = translations.get('education', {}).get('entries', [])
    projects = translations.get('projects', {}).get('entries', [])
    skills_raw = translations.get('skills', {}).get('list', {})
    skills = [item.strip() for item in skills_raw.get('en', '').split(',') if item.strip()]

    current_role = experience[0] if experience else {}
    ai_role = next(
        (
            entry for entry in experience
            if entry.get('position', {}).get('en') == 'Artificial Intelligence Engineer'
        ),
        current_role,
    )

    return {
        'cv_data': data,
        'cv_name': translations.get('name', {}).get('en', 'Edvard Khachatryan Sahakyan'),
        'cv_title': translations.get('title', {}).get('en', 'Artificial Intelligence Engineer and Data Scientist'),
        'cv_summary': translations.get('summary', {}).get('en', ''),
        'cv_experience_entries': experience,
        'cv_education_entries': education,
        'cv_project_entries': projects,
        'cv_skills_items': skills,
        'cv_experience_count': len(experience),
        'cv_education_count': len(education),
        'cv_project_count': len(projects),
        'cv_skill_count': len(skills),
        'cv_current_position': current_role.get('position', {}).get('en', ''),
        'cv_current_company': current_role.get('company', ''),
        'cv_current_location': current_role.get('location', {}).get('en', ''),
        'cv_ai_position': ai_role.get('position', {}).get('en', ''),
        'cv_ai_company': ai_role.get('company', ''),
        'cv_ai_location': ai_role.get('location', {}).get('en', ''),
    }
