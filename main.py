from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_mail import Mail, Message
import json
import os
from dotenv import load_dotenv
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configura logging
logging.basicConfig(level=logging.DEBUG)

load_dotenv()
app = Flask(__name__)

# Configurar clave secreta para la sesión
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'mysecret')

#######################################################################
#######################################################################
#######################################################################
# Configurar el servidor de correo electrónico
SMTP_USERNAME = os.getenv('MAIL_USERNAME')  
SMTP_PASSWORD = os.getenv('MAIL_PASSWORD')  
SENDER_EMAIL = 'info@edvardks.com'
RECIPIENT_EMAIL = 'edwar_@outlook.com'
SMTP_SERVER = 'ssl0.ovh.net'
SMTP_PORT = 587

#######################################################################
#######################################################################
#######################################################################

@app.route('/submit_contact', methods=['POST'])
def submit_contact():
    try:
        data = request.json
        if not data:
            return jsonify({'status': 'error', 'message': 'Invalid JSON'}), 400
        name = data.get('name')
        email = data.get('email')
        message = data.get('message')
        # Validación básica
        if not all([name, email, message]):
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
        logging.info(f"Attempting to send email from {email}")
        # Crear el mensaje
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = RECIPIENT_EMAIL
        msg['Subject'] = f"New contact from {name}"
        body = f"Name: {name}\nEmail: {email}\nMessage: {message}"
        msg.attach(MIMEText(body, 'plain'))
        # Conectar y enviar el correo usando smtplib
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

#######################################################################
#######################################################################
#######################################################################

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        if request.form['password'] == os.getenv('ACCESS_PASSWORD'):
            session['logged_in'] = True
            return redirect(url_for('index'))
        else:
            error = 'Invalid password'
    return render_template('login.html', error=error)

#######################################################################
#######################################################################
#######################################################################

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login'))

#######################################################################
#######################################################################
#######################################################################

@app.route('/')
def index():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('index.html')

#######################################################################
#######################################################################
#######################################################################

@app.route('/get_cv_data')
def get_cv_data():
    with open('static/data/cv_data.json', 'r', encoding='utf-8') as file:
        cv_data = json.load(file)
    return jsonify(cv_data)


#######################################################################
#######################################################################
#######################################################################

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)