import smtplib
from flask import current_app

def send_verification_email(email, verification_link, nome_completo):
    from_email = current_app.config['MAIL_USERNAME']
    password = current_app.config['MAIL_PASSWORD']

    subject = 'Confirmação de Cadastro - GoalCast'
    body = f"""
    Olá {nome_completo}, 👋🏻

    Obrigado por se cadastrar no GoalCast!

    Por favor, clique no link abaixo para verificar seu e-mail:

    {verification_link}

    Att. Equipe GoalCast!
    """

    message = f"Subject: {subject}\n\n{body}"

    try:
        server = smtplib.SMTP(current_app.config['MAIL_SERVER'], current_app.config['MAIL_PORT'])
        server.starttls()
        server.login(from_email, password)
        server.sendmail(from_email, email, message)
        server.quit()
        print(f'E-mail de verificação enviado para {email}')
    except Exception as e:
        print(f'Erro ao enviar e-mail: {e}')
