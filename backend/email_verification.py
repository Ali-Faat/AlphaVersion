import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

def send_verification_email(email, verification_link, nome_completo):
    from_email = current_app.config['MAIL_USERNAME']
    password = current_app.config['MAIL_PASSWORD']
    mail_server = current_app.config['MAIL_SERVER']
    mail_port = current_app.config['MAIL_PORT']  # Usar porta adequada para seu servidor SMTP

    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = email
    msg['Subject'] = 'Confirmação de Cadastro - GoalCast'

    body = f"""
    Olá {nome_completo},

    Obrigado por se cadastrar no GoalCast!

    Por favor, clique no link abaixo para verificar seu e-mail:

    <a href="{verification_link}">Clique aqui para verificar seu e-mail</a>
    """

    msg.attach(MIMEText(body, 'html', 'utf-8'))

    try:
        # Conectar ao servidor SMTP
        with smtplib.SMTP(mail_server, mail_port) as server:
            # Tentar autenticar se o servidor suportar
            if mail_port == 587:  # Porta comum para STARTTLS
                server.starttls()
            server.login(from_email, password)  # Tentar autenticar
            server.sendmail(from_email, email, msg.as_string())
        print(f'E-mail de verificação enviado para {email}')
    except smtplib.SMTPAuthenticationError as auth_err:
        print(f'Erro de autenticação: {auth_err}')
    except Exception as e:
        print(f'Erro ao enviar e-mail: {e}')
