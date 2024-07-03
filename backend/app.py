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
    mydb = get_db_connection()
    cursor = mydb.cursor()

    try:
        cursor.execute('SELECT * FROM quadras WHERE id = %s', (quadra_id,))
        quadra = cursor.fetchone()

        if quadra is None:
            return jsonify({'error': 'Quadra não encontrada'}), 404

        # Converter para formato JSON
        quadra_json = {
            'id': quadra[1],
            'nome': quadra[2],
            'endereco': quadra[3],
            'tipo': quadra[4],
            'imagens': json.loads(quadra[5]) if quadra[5] else [],
            'descricao': quadra[6],
            'preco_hora': quadra[7],
            'disponibilidade': json.loads(quadra[8]) if quadra[8] else [],
            'avaliacao_media': quadra[9]
        }

        return jsonify(quadra_json)  # Retornar os dados em formato JSON

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro ao buscar vídeos: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()

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
            # Tratamento para dh_inicio e dh_fim nulos
            dh_inicio_str = partida[3].strftime('%Y-%m-%d %H:%M:%S') if partida[3] else None
            dh_fim_str = partida[4].strftime('%Y-%m-%d %H:%M:%S') if partida[4] else None

            partidas_json.append({
                'id': partida[0],
                'dh_inicio': dh_inicio_str,
                'dh_fim': dh_fim_str
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
        if quadra_id and partida_id:
            # Obter as datas de início e fim da partida selecionada
            cursor.execute('SELECT dh_inicio, dh_fim FROM partidas WHERE id = %s', (partida_id,))
            partida = cursor.fetchone()

            if partida is None:
                return jsonify({'error': 'Partida não encontrada'}), 404

            dh_inicio, dh_fim = partida

            # Buscar os vídeos da partida selecionada, filtrando por data e hora
            cursor.execute('SELECT v.*, (v.criador_id = %s) AS eh_criador FROM videos v WHERE v.partida_id = %s AND v.data_criacao BETWEEN %s AND %s',
                           (session.get('usuario_id'), partida_id, dh_inicio, dh_fim))
        elif quadra_id:
            # Se não houver partida_id, retorna todos os vídeos da quadra
            cursor.execute('SELECT v.*, (v.criador_id = %s) AS eh_criador FROM videos v JOIN partidas p ON v.partida_id = p.id WHERE p.quadra_id = %s',
                           (session.get('usuario_id'), quadra_id))
        else:
            cursor.execute('SELECT v.*, (v.criador_id = %s) AS eh_criador FROM videos v', (session.get('usuario_id'),))

        videos = cursor.fetchall()

        # Converter para formato JSON
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
                'eh_criador': bool(video[6])
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
