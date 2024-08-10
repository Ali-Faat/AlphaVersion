import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configurações de e-mail
MAIL_SERVER = 'smtp.gmail.com'  # Substitua pelo servidor SMTP
MAIL_PORT = 587  # Porta SMTP, 587 para TLS
MAIL_USERNAME = 'verificadorgoalcast@gmail.com'  # Substitua pelo seu e-mail
MAIL_PASSWORD = 'ltqc smbv jnqk bvfe'  # Substitua pela sua senha de e-mail

def send_welcome_email(email_destinatario, nome_completo):
    from_email = MAIL_USERNAME
    
    subject = 'Bem-vindo ao GoalCast'
    body = f"""
    Olá {nome_completo}, 👋🏻

    Obrigado por se cadastrar no GoalCast!

    Para concluir seu cadastro, por favor, acesse o link abaixo para verificar seu e-mail:

    Link para verificação: http://138.99.160.212/pages/validar/validar.html

    Atenciosamente,
    Equipe GoalCast!
    """

    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = email_destinatario
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain', 'utf-8'))  # Garantir que o corpo está codificado em UTF-8

    try:
        server = smtplib.SMTP(MAIL_SERVER, MAIL_PORT)
        server.starttls()
        server.login(from_email, MAIL_PASSWORD)
        server.sendmail(from_email, email_destinatario, msg.as_string())
        server.quit()
        print(f'E-mail de boas-vindas enviado para {email_destinatario}')
    except Exception as e:
        print(f'Erro ao enviar e-mail: {e}')

# Seção para teste do código
if __name__ == '__main__':
    # Testar envio de e-mail com um destinatário e nome específico
    send_welcome_email('emaildestinatario@exemplo.com', 'Nome Completo')
