import json
import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request

from padel_scout import padel_scout_bp

####################################################################################################

logging.basicConfig(level=logging.DEBUG)

load_dotenv()
app = Flask(__name__)

####################################################################################################

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CV_DATA_PATH = os.path.join(BASE_DIR, 'static', 'data', 'cv_data.json')

####################################################################################################

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'mysecret')

####################################################################################################

SMTP_USERNAME = os.getenv('MAIL_USERNAME')
SMTP_PASSWORD = os.getenv('MAIL_PASSWORD')
SMTP_SERVER = os.getenv('SMTP_SERVER')
SMTP_PORT = os.getenv('SMTP_PORT')

print("\n", SMTP_USERNAME, SMTP_SERVER, SMTP_PORT, "\n")

####################################################################################################

app.register_blueprint(padel_scout_bp)

####################################################################################################
####################################################################################################
####################################################################################################


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

        logging.info(f"Attempting to send email from {email}")
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
            logging.info("Email sent successfully")
            return jsonify({'status': 'success', 'message': 'Your message has been sent successfully'}), 200

        logging.error("SMTP credentials not set")
        return jsonify({'status': 'error', 'message': 'SMTP credentials not set'}), 500
    except Exception as exc:
        logging.error(f"Error in submit_contact: {str(exc)}")
        return jsonify({'status': 'error', 'message': str(exc)}), 500


####################################################################################################
####################################################################################################
####################################################################################################


@app.route('/')
def index():
    return render_template('index.html')


####################################################################################################
####################################################################################################
####################################################################################################


@app.route('/ECSO')
def ecso():
    return render_template('ECSO.html')


####################################################################################################
####################################################################################################
####################################################################################################


@app.route('/AdministracionSSOO')
def administracion_ssoo():
    return render_template('AdministracionSSOO.html')


####################################################################################################
####################################################################################################
####################################################################################################


@app.route('/SSOOAvanzados')
def ssoo_avanzados():
    return render_template('SSOOAvanzados.html')


####################################################################################################
####################################################################################################
####################################################################################################


@app.route('/get_cv_data')
def get_cv_data():
    with open(CV_DATA_PATH, 'r', encoding='utf-8') as file:
        cv_data = json.load(file)
    return jsonify(cv_data)


####################################################################################################
####################################################################################################
####################################################################################################


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
