from flask import Flask, render_template, request, jsonify
from flask_mail import Mail, Message
import json

app = Flask(__name__)

# Configure Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.example.com'  # Replace with your SMTP server
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'your_username'  # Replace with your email username
app.config['MAIL_PASSWORD'] = 'your_password'  # Replace with your email password
app.config['MAIL_DEFAULT_SENDER'] = 'info@edvardks.com'

mail = Mail(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_cv_data')
def get_cv_data():
    with open('static/data/cv_data.json', 'r', encoding='utf-8') as file:
        cv_data = json.load(file)
    return jsonify(cv_data)

@app.route('/submit_contact', methods=['POST'])
def submit_contact():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    message = data.get('message')

    msg = Message(
        subject=f"New contact from {name}",
        recipients=['info@edvardks.com'],
        body=f"Name: {name}\nEmail: {email}\nMessage: {message}"
    )

    try:
        mail.send(msg)
        return jsonify({'status': 'success', 'message': 'Your message has been sent successfully!'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': 'An error occurred while sending your message.'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
