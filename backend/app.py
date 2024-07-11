from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from database import get_db_connection
import mysql.connector
import json
import os
from flask_cors import CORS
import hashlib

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Gera uma chave secreta aleatória
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

# Rota para obter os detalhes de uma quadra específica
@app.route('/api/partidas/<quadra_id>', methods=['GET'])
def get_partidas_por_quadra(quadra_id):
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)  # Retorna resultados como dicionários

    try:
        cursor.execute('SELECT * FROM partidas WHERE quadra_id = %s', (quadra_id,))
        partidas = cursor.fetchall()

        partidas_json = []
        for partida in partidas:
            # Formatar data para yyyy-MM-dd (somente a data)
            dh_inicio_str = partida['dh_inicio'].strftime('%Y-%m-%d') if partida['dh_inicio'] else None
            dh_fim_str = partida['dh_fim'].strftime('%Y-%m-%d %H:%M:%S') if partida['dh_fim'] else None

            partidas_json.append({
                'id': partida[0],
                'dh_inicio': partida[3].isoformat() if partida[3] else None,  # Formatar para ISO 8601
                'dh_fim': partida[4].isoformat() if partida[4] else None 
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
    data_inicio = request.args.get('data_inicio')  # Novo parâmetro para data

    mydb = get_db_connection()
    cursor = mydb.cursor()

    try:
        if quadra_id and partida_id and data_inicio:
            # Filtrar vídeos pela data exata
            query = '''
                SELECT v.*, (v.criador_id = %s) AS eh_criador 
                FROM videos v 
                JOIN partidas p ON v.partida_id = p.id 
                WHERE p.quadra_id = %s 
                AND p.id = %s 
                AND DATE(v.data_criacao) = %s  -- Filtra por data exata
            '''
            params = (session.get('usuario_id'), quadra_id, partida_id, data_inicio)
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

#Rota para autenticação do usuário
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data['email']
    senha = data['password']

    # Criptografar a senha
    senha_hash = hashlib.sha256(senha.encode()).hexdigest()

    mydb = get_db_connection()
    cursor = mydb.cursor()

    try:
        cursor.execute('SELECT * FROM usuarios WHERE email = %s AND senha = %s', (email, senha_hash))
        usuario = cursor.fetchone()

        if usuario is None:
            return jsonify({'error': 'Credenciais inválidas'}), 401

        # Iniciar a sessão do usuário
        session['usuario_id'] = usuario[0]
        session['tipo_usuario'] = usuario[4]  # Supondo que o tipo de usuário esteja na coluna 4

        return jsonify({'message': 'Login bem-sucedido'}), 200

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro na autenticação: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()

# Rota para verificar se o usuário está logado (opcional)
@app.route('/api/is_authenticated', methods=['GET'])
def is_authenticated():
    if 'usuario_id' in session:
        return jsonify({'authenticated': True}), 200
    else:
        return jsonify({'authenticated': False}), 200


# Rota da API para cadastro
@app.route('/api/cadastro', methods=['POST'])
def cadastro():
    try:
        data = request.get_json()
        nome_completo = data['nome_completo']
        apelido = data['apelido']
        email = data['email']
        celular = data['celular']
        senha = data['senha']
        confirma_senha = data['confirma_senha']


        # Criptografar a senha
        senha_hash = hashlib.sha256(senha.encode()).hexdigest()

        mydb = get_db_connection()
        cursor = mydb.cursor()
       
        cursor.execute('INSERT INTO usuarios (nome, apelido, email, celular, senha, tipo_usuario) VALUES (%s, %s, %s, %s, %s, %s, %s)',
                       (nome_completo, apelido, email, celular, senha_hash, 'jogador'))
        mydb.commit()

        return jsonify({'success': True, 'message': 'Usuário cadastrado com sucesso!'}), 201

    except ValueError as ve:
        return jsonify({'success': False, 'error': str(ve)}), 400

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()



if __name__ == '__main__':
    app.run(debug=True, ssl_context='adhoc')
    app.run(host='0.0.0.0', port=5000)
