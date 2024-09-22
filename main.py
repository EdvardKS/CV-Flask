from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_mail import Mail, Message
import json
import os
from dotenv import load_dotenv
import logging

# Configura logging
logging.basicConfig(level=logging.DEBUG)

load_dotenv()
app = Flask(__name__)

# Configurar clave secreta para la sesión
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'mysecret')

# Configurar Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.mail.ovh.ca'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_SSL'] = False  # Cambiado de TLS a SSL
app.config['MAIL_USE_TLS'] = True  # Desactivar TLS
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = 'info@edvardks.com'

mail = Mail(app)

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

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login'))

@app.route('/')
def index():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/get_cv_data')
def get_cv_data():
    with open('static/data/cv_data.json', 'r', encoding='utf-8') as file:
        cv_data = json.load(file)
    return jsonify(cv_data)

@app.route('/submit_contact', methods=['POST'])
def submit_contact():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        message = data.get('message')

        # Validación básica
        if not all([name, email, message]):
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400

        logging.info(f"Attempting to send email from {email}")

        msg = Message(
            subject=f"New contact from {name}",
            recipients=['edwar_@outlook.com'],
            body=f"Name: {name}\nEmail: {email}\nMessage: {message}"
        )

        mail.send(msg)
        logging.info("Email sent successfully")
        return jsonify({'status': 'success', 'message': 'Your message has been sent'}), 200

    except Exception as e:
        logging.error(f"Error in submit_contact: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/test_mail')
def test_mail():
    try:
        msg = Message("Test Email", recipients=["edwar_@outlook.com"])
        msg.body = "This is a test email."
        mail.send(msg)
        return "Test email sent successfully!"
    except Exception as e:
        logging.error(f"Error in test_mail: {str(e)}")
        return f"Error sending test email: {str(e)}"

if __name__ == '__main__':
    app.run(debug=True)