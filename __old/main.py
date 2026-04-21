import json
import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv
from flask import Flask, Response, jsonify, render_template, request, url_for

from padel_scout import padel_scout_bp

logging.basicConfig(level=logging.DEBUG)

load_dotenv()
app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CV_DATA_PATH = os.path.join(BASE_DIR, 'static', 'data', 'cv_data.json')

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'mysecret')

SMTP_USERNAME = os.getenv('MAIL_USERNAME')
SMTP_PASSWORD = os.getenv('MAIL_PASSWORD')
SMTP_SERVER = os.getenv('SMTP_SERVER')
SMTP_PORT = os.getenv('SMTP_PORT')

app.register_blueprint(padel_scout_bp)


# --------------------------------------------------------------------------- #
# Contact form
# --------------------------------------------------------------------------- #

@app.route('/submit_contact', methods=['POST'])
def submit_contact():
    try:
        data = request.json
        if not data:
            return jsonify({'status': 'error', 'message': 'Invalid JSON'}), 400

        name = data.get('name')
        email = data.get('email')
        message = data.get('message')
        if not all([name, email, message]):
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400

        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = SMTP_USERNAME
        msg['Subject'] = f"New contact from {name}"
        body = f"Name: {name}\nEmail: {email}\nMessage: {message}"
        msg.attach(MIMEText(body, 'plain'))

        if SMTP_USERNAME and SMTP_PASSWORD:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.sendmail(SMTP_USERNAME, SMTP_USERNAME, msg.as_string())
            return jsonify({'status': 'success', 'message': 'Your message has been sent successfully'}), 200

        logging.error("SMTP credentials not set")
        return jsonify({'status': 'error', 'message': 'SMTP credentials not set'}), 500
    except Exception as exc:
        logging.error(f"Error in submit_contact: {str(exc)}")
        return jsonify({'status': 'error', 'message': str(exc)}), 500


# --------------------------------------------------------------------------- #
# CV (indexable) and section pages (noindex)
# --------------------------------------------------------------------------- #

@app.route('/')
def index():
    return render_template('cv.html', indexable=True, page='cv')


@app.route('/summary')
def summary():
    return render_template('summary.html', indexable=False, page='summary')


@app.route('/experience')
def experience():
    return render_template('experience.html', indexable=False, page='experience')


@app.route('/education')
def education():
    return render_template('education.html', indexable=False, page='education')


@app.route('/skills')
def skills():
    return render_template('skills.html', indexable=False, page='skills')


@app.route('/projects')
def projects():
    return render_template('projects.html', indexable=False, page='projects')


@app.route('/contact')
def contact():
    return render_template('contact.html', indexable=False, page='contact')


# --------------------------------------------------------------------------- #
# Existing course pages (kept for backwards compatibility, noindex)
# --------------------------------------------------------------------------- #

@app.route('/ECSO')
def ecso():
    return render_template('ECSO.html')


@app.route('/AdministracionSSOO')
def administracion_ssoo():
    return render_template('AdministracionSSOO.html')


@app.route('/SSOOAvanzados')
def ssoo_avanzados():
    return render_template('SSOOAvanzados.html')


# --------------------------------------------------------------------------- #
# Data + SEO
# --------------------------------------------------------------------------- #

@app.route('/get_cv_data')
def get_cv_data():
    with open(CV_DATA_PATH, 'r', encoding='utf-8') as file:
        cv_data = json.load(file)
    return jsonify(cv_data)


@app.route('/robots.txt')
def robots_txt():
    lines = [
        "User-agent: *",
        "Allow: /$",
        "Disallow: /summary",
        "Disallow: /experience",
        "Disallow: /education",
        "Disallow: /skills",
        "Disallow: /projects",
        "Disallow: /contact",
        "Disallow: /ECSO",
        "Disallow: /AdministracionSSOO",
        "Disallow: /SSOOAvanzados",
        "Disallow: /padel",
        "Disallow: /get_cv_data",
        "",
        f"Sitemap: {request.url_root.rstrip('/')}/sitemap.xml",
    ]
    return Response("\n".join(lines), mimetype='text/plain')


@app.route('/sitemap.xml')
def sitemap_xml():
    root = request.url_root.rstrip('/')
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f'  <url><loc>{root}/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>\n'
        '</urlset>\n'
    )
    return Response(body, mimetype='application/xml')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
