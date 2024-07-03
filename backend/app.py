from flask import Flask, jsonify, request, session
from database import get_db_connection
import mysql.connector
import json
from flask_cors import CORS
import hashlib

app = Flask(__name__)
CORS(app)

def executar_consulta(query, params=None):
    mydb = get_db_connection()
    cursor = mydb.cursor()

    try:
        cursor.execute(query, params or ())
        resultados = cursor.fetchall()

        # Obter os nomes das colunas
        colunas = [col[0] for col in cursor.description]

        # Converter para formato JSON
        resultados_json = []
        for resultado in resultados:
            resultados_json.append(dict(zip(colunas, resultado)))  # Converter para dicionário

        return jsonify(resultados_json)

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro no banco de dados: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()

# Rota para listar as quadras
@app.route('/api/quadras', methods=['GET'])
def get_quadras():
    return executar_consulta('SELECT id_sequencial, id, nome, endereco, tipo, imagens, descricao, preco_hora, disponibilidade, avaliacao_media FROM quadras')

# Rota para obter os detalhes de uma quadra específica
@app.route('/api/quadras/<quadra_id>', methods=['GET'])
def get_quadra(quadra_id):
    return executar_consulta(
        'SELECT id_sequencial, id, nome, endereco, tipo, imagens, descricao, preco_hora, disponibilidade, avaliacao_media FROM quadras WHERE id = %s',
        (quadra_id,)
    )

# Rota para listar as partidas de uma quadra específica
@app.route('/api/partidas/<quadra_id>', methods=['GET'])
def get_partidas_por_quadra(quadra_id):
    mydb = get_db_connection()
    cursor = mydb.cursor()

    try:
        cursor.execute('SELECT * FROM partidas WHERE quadra_id = %s', (quadra_id,))
        partidas = cursor.fetchall()

        partidas_json = []
        for partida in partidas:
            partidas_json.append({
                'id': partida[0],
                'dh_inicio': partida[3].strftime('%Y-%m-%d %H:%M:%S'),
                'dh_fim': partida[10].strftime('%Y-%m-%d %H:%M:%S') if partida[10] else None 
            })

        return jsonify(partidas_json)

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro ao buscar partidas: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()

# Rota para listar os vídeos de uma quadra, filtrados por partida
@app.route('/api/videos', methods=['GET'])
def get_videos():
    quadra_id = request.args.get('quadra_id')
    partida_id = request.args.get('partida_id')

    mydb = get_db_connection()
    cursor = mydb.cursor()

    try:
        query = 'SELECT v.*, (v.criador_id = %s) AS eh_criador FROM videos v JOIN partidas p ON v.partida_id = p.id WHERE '
        params = []

        # Verificar se o usuário está logado
        if 'usuario_id' in session:
            params.append(session['usuario_id'])
        else:
            params.append(None)  # Valor padrão para eh_criador quando não logado

        if quadra_id:
            query += 'p.quadra_id = %s '
            params.append(quadra_id)

        if partida_id:
            query += 'AND v.data_criacao BETWEEN p.dh_inicio AND p.dh_fim '

        cursor.execute(query, params)
        videos = cursor.fetchall()

        videos_json = []
        for video in videos:
            data_criacao_str = video[4].strftime('%Y-%m-%d %H:%M:%S') if video[4] else None
            videos_json.append({
                'id': video[0],
                'partida_id': video[1],
                'quadra_id': video[2],
                'url': video[3],
                'tipo': video[4],
                'data_criacao': data_criacao_str,
                'eh_criador': bool(video[6])  # Converter para booleano
            })

        return jsonify(videos_json)

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro ao buscar vídeos: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()

# Rota para autenticar usuário
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data['email']
    senha = data['password']
    senha_hash = hashlib.sha256(senha.encode()).hexdigest()

    return executar_consulta(
        'SELECT * FROM usuarios WHERE email = %s AND senha = %s',
        (email, senha_hash)
    )


if __name__ == '__main__':
    app.run(debug=True)
