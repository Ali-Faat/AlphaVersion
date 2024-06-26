import mysql.connector

def get_db_connection():
    # Substitua pelos seus dados de conexão
    mydb = mysql.connector.connect(
        host="localhost",
        user="Ali",
        password="@Alison2004",
        database="goalcast"  # Nome do seu banco de dados
    )

    return mydb
