import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

def send_verification_email(email, verification_link, nome_completo):
    from_email = current_app.config['MAIL_USERNAME']
    password = current_app.config['MAIL_PASSWORD']

    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = email
    msg['Subject'] = 'Confirmação de Cadastro - GoalCast'

    # Certificar que o corpo do e-mail está codificado em UTF-8
    body = f"""
    Olá {nome_completo},

    Obrigado por se cadastrar no GoalCast!

    Por favor, clique no link abaixo para verificar seu e-mail:

    {verification_link}

    Att. Com 🩷
    Equipe GoalCast!
    """

    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    try:
        server = smtplib.SMTP(current_app.config['MAIL_SERVER'], current_app.config['MAIL_PORT'])
        server.starttls()
        server.login(from_email, password)
        text = msg.as_string()
        server.sendmail(from_email, email, text)
        server.quit()
        print(f'E-mail de verificação enviado para {email}')
    except Exception as e:
        print(f'Erro ao enviar e-mail: {e}')
