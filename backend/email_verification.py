# email_verification.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_verification_email(email, verification_link):
    from_email = 'seu_email@gmail.com'  # Substitua pelo seu email
    password = 'sua_senha'  # Substitua pela sua senha

    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = email
    msg['Subject'] = 'Confirmação de Cadastro - GoalCast'

    body = f"""
    Obrigado por se cadastrar no GoalCast!

    Por favor, clique no link abaixo para verificar seu e-mail:

    {verification_link}
    """

    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)  # Para Gmail
        server.starttls()
        server.login(from_email, password)
        text = msg.as_string()
        server.sendmail(from_email, email, text)
        server.quit()
        print(f'E-mail de verificação enviado para {email}')
    except Exception as e:
        print(f'Erro ao enviar e-mail: {e}')
