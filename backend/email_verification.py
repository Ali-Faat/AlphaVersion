import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

def send_verification_email(email, verification_link, nome_completo):
    from_email = os.getenv('EMAIL_USER')
    password = os.getenv('EMAIL_PASSWORD')

    if not from_email or not password:
        raise ValueError("Email credentials are not set in environment variables")

    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = email
    msg['Subject'] = 'Confirmação de Cadastro - GoalCast'

    body = f"""
    Olá {nome_completo},

    Obrigado por se cadastrar no GoalCast!

    Por favor, clique no link abaixo para verificar seu e-mail:

    {verification_link}

    Atenciosamente,
    Equipe GoalCast
    """

    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(from_email, password)
        text = msg.as_string()
        server.sendmail(from_email, email, text)
        server.quit()
        print(f'E-mail de verificação enviado para {email}')
    except Exception as e:
        import logging
        logging.error(f'Erro ao enviar e-mail: {e}')
