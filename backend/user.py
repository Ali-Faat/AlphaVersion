import mysql.connector
import secrets
import hashlib

# Função para calcular o hash da senha
def hash_senha(senha, salt):
    return hashlib.sha256((senha + salt).encode()).hexdigest()

# Configurações do banco de dados
db_config = {
    'host': 'localhost',
    'user': 'seu_usuario',
    'password': 'sua_senha',
    'database': 'seu_banco_de_dados'
}

# Dados do usuário a ser inserido
nome_completo = "Nome do Usuário"
apelido = "apelido_do_usuario"
email = "email@exemplo.com"
celular = "1234567890"
senha = "senha_secreta"

# Gera um salt e o hash da senha
salt = secrets.token_hex(16)
senha_hash = hash_senha(senha, salt)

# Gera um token de verificação
verification_token = secrets.token_urlsafe(32)

# Conecta ao banco de dados e insere o usuário
try:
    mydb = mysql.connector.connect(**db_config)
    cursor = mydb.cursor()
    
    sql_insert = '''
    INSERT INTO usuarios (nome, apelido, email, celular, senha, salt, verificado, verification_token) 
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    '''
    
    cursor.execute(sql_insert, (nome_completo, apelido, email, celular, senha_hash, salt, True, verification_token))
    mydb.commit()
    print("Usuário inserido com sucesso!")
    
except mysql.connector.Error as err:
    print(f"Erro ao inserir usuário: {err}")
finally:
    cursor.close()
    mydb.close()
