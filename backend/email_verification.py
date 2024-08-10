import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

def send_welcome_email(email, nome_completo):
    from_email = current_app.config['MAIL_USERNAME']
    password = current_app.config['MAIL_PASSWORD']
    
    subject = 'Bem-vindo ao GoalCast'
    body = f"""
    Olá {nome_completo}, 👋🏻

    Obrigado por se cadastrar no GoalCast!

    Para concluir seu cadastro, por favor, acesse a página de verificação e insira seu e-mail e senha.

    Link para verificação: http://138.99.160.212/pages/validar/validar.html

    Atenciosamente,
    Equipe GoalCast!
    """

    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain', 'utf-8'))  # Garantir que o corpo está codificado em UTF-8

    try:
        server = smtplib.SMTP(current_app.config['MAIL_SERVER'], current_app.config['MAIL_PORT'])
        server.starttls()
        server.login(from_email, password)
        server.sendmail(from_email, email, msg.as_string())
        server.quit()
        print(f'E-mail de boas-vindas enviado para {email}')
    except Exception as e:
        print(f'Erro ao enviar e-mail: {e}')
