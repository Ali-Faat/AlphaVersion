from flask import Flask, request, jsonify
import mysql.connector

app = Flask(__name__)

# Configurações de conexão com o banco de dados
def get_db_connection():
    connection = mysql.connector.connect(
        host='127.0.0.1',  # Seu host do MySQL
        user='Ali',       # Seu usuário MySQL
        password='@Alison2004',  # Sua senha do MySQL
        database='goalcast'   # Nome do banco de dados
    )
    return connection

# Endpoint para adicionar um novo jogador
@app.route('/add_jogador', methods=['POST'])
def add_jogador():
    try:
        # Pega os dados da requisição JSON
        data = request.json
        user = data.get('user')
        nascimento = data.get('nascimento')
        bio = data.get('bio')
        nCamiseta = data.get('nCamiseta')
        posicao = data.get('posicao')
        altura = data.get('altura')
        peso = data.get('peso')
        peDominante = data.get('peDominante')

        # Conecta ao banco de dados
        connection = get_db_connection()
        cursor = connection.cursor()

        # Cria a query de inserção
        insert_query = """
        INSERT INTO jogador (user, Nascimento, Bio, nCamiseta, posicao, altura, peso, peDominante)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (user, nascimento, bio, nCamiseta, posicao, altura, peso, peDominante))

        # Confirma a transação
        connection.commit()

        # Fecha a conexão
        cursor.close()
        connection.close()

        return jsonify({'message': 'Jogador adicionado com sucesso!'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
