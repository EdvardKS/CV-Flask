from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import json
import os
from dotenv import load_dotenv
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart 
import random

####################################################################################################

# Configura logging
logging.basicConfig(level=logging.DEBUG)

load_dotenv()
app = Flask(__name__)

####################################################################################################

# Configurar clave secreta para la sesión
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'mysecret')

####################################################################################################

# Configurar el servidor de correo electrónico
SMTP_USERNAME = os.getenv('MAIL_USERNAME')  
SMTP_PASSWORD = os.getenv('MAIL_PASSWORD')  
SMTP_SERVER = os.getenv('SMTP_SERVER')  
SMTP_PORT = os.getenv('SMTP_PORT')  

print("\n",SMTP_USERNAME, SMTP_SERVER, SMTP_PORT, "\n")
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
        else:
            logging.error("SMTP credentials not set")
            return jsonify({'status': 'error', 'message': 'SMTP credentials not set'}), 500
    except Exception as e:
        logging.error(f"Error in submit_contact: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

####################################################################################################
####################################################################################################
####################################################################################################

@app.route('/')
def index():
    return render_template('index.html')

####################################################################################################
####################################################################################################
####################################################################################################

@app.route('/get_cv_data')
def get_cv_data():
    with open('static/data/cv_data.json', 'r', encoding='utf-8') as file:
        cv_data = json.load(file)
    return jsonify(cv_data)

####################################################################################################
####################################################################################################
####################################################################################################

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)