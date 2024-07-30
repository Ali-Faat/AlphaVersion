import mysql.connector
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

def get_db_connection():
    try:
        # Recuperar informações de conexão do banco de dados do arquivo .env
        db_config = {
            'host': os.getenv('DB_HOST'),
            'port': int(os.getenv('DB_PORT')),
            'user': os.getenv('DB_USER'),
            'password': os.getenv('DB_PASSWORD'),
            'database': os.getenv('DB_NAME')
        }
        
        # Estabelecer a conexão com o banco de dados
        mydb = mysql.connector.connect(**db_config)
        return mydb
    except mysql.connector.Error as err:
        # Lidar com o erro de conexão
        print(f"Erro ao conectar ao banco de dados: {err}")
        raise  # Lançar o erro para ser tratado na rota ou em outro lugar

