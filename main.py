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
SENDER_EMAIL = 'info@edvardks.com'
SMTP_SERVER = 'ssl0.ovh.net'
SMTP_PORT = 587
RECIPIENT_EMAIL = 'info@edvardks.com'

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
        msg['From'] = SENDER_EMAIL  # Use the SENDER_EMAIL as the sender
        msg['To'] = RECIPIENT_EMAIL
        msg['Subject'] = f"New contact from {name}"
        body = f"Name: {name}\nEmail: {email}\nMessage: {message}"
        msg.attach(MIMEText(body, 'plain'))
        if SMTP_USERNAME and SMTP_PASSWORD:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.sendmail(SENDER_EMAIL, RECIPIENT_EMAIL, msg.as_string())
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

@app.route('/login', methods=['GET'])
def login():
    return render_template('login.html')

####################################################################################################
####################################################################################################
####################################################################################################

@app.route('/sendnumbers', methods=['POST'])
def send_numbers():
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({'status': 'error', 'message': 'Email is required'}), 400

    listaNums = [random.randint(1, 99) for _ in range(3)]
    session['listaNums'] = listaNums
    selected_num = random.choice(listaNums)
    session['selected_num'] = selected_num
    send_email(email, selected_num)
    return jsonify({'status': 'success', 'numbers': listaNums})

####################################################################################################

def send_email(recipient_email, selected_num):
    # Correo al usuario con el número de verificación
    subject_user = "Tu Número de Verificación"
    body_user = f"Tu número de verificación es: {selected_num}"
    msg_user = MIMEMultipart()
    msg_user['From'] = SENDER_EMAIL
    msg_user['To'] = recipient_email
    msg_user['Subject'] = subject_user
    msg_user.attach(MIMEText(body_user, 'plain'))
    
    # Correo a ti para notificar acceso
    subject_self = "Nuevo Acceso a la Web"
    body_self = f"El usuario con el email {recipient_email} está accediendo a la web."
    msg_self = MIMEMultipart()
    msg_self['From'] = SENDER_EMAIL
    msg_self['To'] = RECIPIENT_EMAIL
    msg_self['Subject'] = subject_self
    msg_self.attach(MIMEText(body_self, 'plain'))
    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            # Enviar correo al usuario
            server.sendmail(SENDER_EMAIL, recipient_email, msg_user.as_string())
            # Enviar correo a ti mismo
            server.sendmail(SENDER_EMAIL, RECIPIENT_EMAIL, msg_self.as_string())
        print("Emails sent successfully")
    except Exception as e:
        print(f"Error: {e}")

####################################################################################################
####################################################################################################
####################################################################################################

@app.route('/verify', methods=['POST'])
def verify():
    data = request.json
    chosen_num = data.get('number')
    if 'selected_num' in session and chosen_num == session['selected_num']:
        session.pop('selected_num', None)
        session['logged_in'] = True
        return jsonify({'status': 'success'})
    return jsonify({'status': 'error', 'message': 'Verification failed'}), 401

####################################################################################################
####################################################################################################
####################################################################################################

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login'))

####################################################################################################
####################################################################################################
####################################################################################################

@app.route('/')
def index():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
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
    app.run(host='0.0.0.0', port=5000, debug=True)