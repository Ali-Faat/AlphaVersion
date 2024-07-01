from flask import Flask, jsonify, request
from database import get_db_connection
import mysql.connector
import json
from flask_cors import CORS
import hashlib

app = Flask(__name__)
CORS(app)

# Rota para listar as quadras
@app.route('/api/quadras', methods=['GET'])
def get_quadras():
    mydb = get_db_connection()
    cursor = mydb.cursor()

    try:
        cursor.execute('SELECT id_sequencial, id, nome, endereco, tipo, imagens, descricao, preco_hora, disponibilidade, avaliacao_media FROM quadras')
        quadras = cursor.fetchall()

        quadras_json = []
        for quadra in quadras:
            quadras_json.append({
                'id': quadra[1],  # Usando o id formatado
                'nome': quadra[2],
                'endereco': quadra[3],
                'tipo': quadra[4],
                'imagens': json.loads(quadra[5]) if quadra[5] else [],
                'descricao': quadra[6],
                'preco_hora': quadra[7],
                'disponibilidade': json.loads(quadra[8]) if quadra[8] else [],
                'avaliacao_media': quadra[9]
            })

        return jsonify(quadras_json)

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro ao buscar quadras: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()

# Rota para listar os vídeos de uma quadra específica
@app.route('/api/videos', methods=['GET'])
def get_videos():
    quadra_id = request.args.get('quadra_id')

    mydb = get_db_connection()
    cursor = mydb.cursor()

    try:
        if quadra_id:
            cursor.execute('SELECT * FROM videos WHERE quadra_id = %s', (quadra_id,))
        else:
            cursor.execute('SELECT * FROM videos')

        videos = cursor.fetchall()

        # Converter para formato JSON
        videos_json = []
        for video in videos:
            data_criacao_str = video[4].strftime('%Y-%m-%d %H:%M:%S') if video[4] is not None else None
            videos_json.append({
                'id': video[0],
                'partida_id': video[1],
                'id_quadra': video[2],
                'url': video[3],
                'tipo': video[4],
                'data_criacao': data_criacao_str
            })

        return jsonify(videos_json)

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro ao buscar vídeos: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()

# Rota para obter os detalhes de uma quadra específica
@app.route('/api/quadras/<quadra_id>', methods=['GET'])
def get_quadra(quadra_id):
    mydb = get_db_connection()
    cursor = mydb.cursor()

    try:
        cursor.execute('SELECT id_sequencial, id, nome, endereco, tipo, imagens, descricao, preco_hora, disponibilidade, avaliacao_media FROM quadras WHERE id = %s', (quadra_id,))
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

        return jsonify(quadra_json)

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro ao buscar quadra: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data['email']
    senha = data['password']

    # Imprimir valores para depuração
    print(f'Email recebido: {email}')
    print(f'Senha recebida: {senha}')

    # Criptografar a senha
    senha_hash = hashlib.sha256(senha.encode()).hexdigest()

    mydb = get_db_connection()
    cursor = mydb.cursor()

    try:
        cursor.execute('SELECT * FROM usuarios WHERE email = %s AND senha = %s', (email, senha_hash))
        usuario = cursor.fetchone()

        # Imprimir resultado da consulta para depuração
        print(f'Resultado da consulta: {usuario}')

        if usuario is None:
            return jsonify({'error': 'Credenciais inválidas'}), 401

        return jsonify({
            'id': usuario[0],
            'nome': usuario[1],
            # ... outros dados do usuário
        })

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro na autenticação: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()


if __name__ == '__main__':
    app.run(debug=True)
