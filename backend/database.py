import mysql.connector

def get_db_connection():
    try:
        mydb = mysql.connector.connect(
            host="localhost",
            port=5004,
            user="Ali",
            password="@Alison2004",
            database="goalcast"
        )
        return mydb
    except mysql.connector.Error as err:
        # Lida com o erro de conexão (registra o erro, retorna uma mensagem, etc.)
        raise err # Lança o erro para ser tratado na rota
