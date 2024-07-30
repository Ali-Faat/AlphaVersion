import os
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from database import get_db_connection
import mysql.connector
import json
from flask_cors import CORS
import hashlib
import email_verification
import datetime
import secrets
from flask_mail import Mail, Message
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

app = Flask(__name__, template_folder='../frontend/pages')
app.secret_key = os.getenv('SECRET_KEY')

# Configuração do CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuração do e-mail
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT'))
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL') == 'True'

mail = Mail(app)

def check_password_hash(stored_password, provided_password, salt):
    return hashlib.sha256((provided_password + salt).encode()).hexdigest() == stored_password

def executar_consulta(query, params=None):
    mydb = get_db_connection()
    cursor = mydb.cursor()

    try:
        cursor.execute(query, params or ())
        resultados = cursor.fetchall()

        colunas = [col[0] for col in cursor.description]

        resultados_json = []
        for resultado in resultados:
            resultados_json.append(dict(zip(colunas, resultado)))

        return jsonify(resultados_json)

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro no banco de dados: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()

@app.route('/api/quadras', methods=['GET'])
def get_quadras():
    return executar_consulta('SELECT id_sequencial, id, nome, endereco, tipo, imagens, descricao, preco_hora, disponibilidade, avaliacao_media FROM quadras')

@app.route('/api/usuarios/<int:usuario_id>', methods=['GET'])
def get_usuario(usuario_id):
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        cursor.execute('SELECT * FROM usuarios WHERE id = %s', (usuario_id,))
        usuario = cursor.fetchone()

        if usuario is None:
            return jsonify({'error': 'Usuário não encontrado'}), 404

        del usuario['senha']

        return jsonify(usuario)

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro ao buscar usuário: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()

@app.route('/api/quadras/<quadra_id>', methods=['GET'])
def get_quadra(quadra_id):
    mydb = get_db_connection()
    cursor = mydb.cursor()

    try:
        cursor.execute('SELECT * FROM quadras WHERE id = %s', (quadra_id,))
        quadra = cursor.fetchone()

        if quadra is None:
            return jsonify({'error': 'Quadra não encontrada'}), 404

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

@app.route('/api/partidas/<quadra_id>', methods=['GET'])
def get_partidas_por_quadra(quadra_id):
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        cursor.execute('SELECT * FROM partidas WHERE quadra_id = %s', (quadra_id,))
        partidas = cursor.fetchall()

        partidas_json = []
        for partida in partidas:
            dh_inicio_str = partida['dh_inicio'].strftime('%Y-%m-%d') if partida['dh_inicio'] else None
            dh_fim_str = partida['dh_fim'].strftime('%Y-%m-%d %H:%M:%S') if partida['dh_fim'] else None

            partidas_json.append({
                'id': partida['id'],
                'dh_inicio': partida['dh_inicio'].isoformat() if partida['dh_inicio'] else None,
                'dh_fim': partida['dh_fim'].isoformat() if partida['dh_fim'] else None
            })

        return jsonify(partidas_json)

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro ao buscar partidas: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()

@app.route('/api/videos', methods=['GET'])
def get_videos():
    quadra_id = request.args.get('quadra_id')
    partida_id = request.args.get('partida_id')
    data_inicio = request.args.get('data_inicio')

    mydb = get_db_connection()
    cursor = mydb.cursor()

    try:
        if quadra_id and partida_id and data_inicio:
            query = '''
                SELECT v.*, (v.criador_id = %s) AS eh_criador 
                FROM videos v 
                JOIN partidas p ON v.partida_id = p.id 
                WHERE p.quadra_id = %s 
                AND p.id = %s 
                AND DATE(v.data_criacao) = %s
            '''
            params = (session.get('usuario_id'), quadra_id, partida_id, data_inicio)
        elif quadra_id:
            query = '''
                SELECT v.*, (v.criador_id = %s) AS eh_criador 
                FROM videos v
                JOIN partidas p ON v.partida_id = p.id 
                WHERE p.quadra_id = %s
            '''
            params = (session.get('usuario_id'), quadra_id)
        else:
            query = '''
                SELECT v.*, (v.criador_id = %s) AS eh_criador 
                FROM videos v
            '''
            params = (session.get('usuario_id'),)

        cursor.execute(query, params)
        videos = cursor.fetchall()

        videos_json = []
        for video in videos:
            data_criacao_str = video[5].strftime('%Y-%m-%d %H:%M:%S') if video[5] else None
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

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('password')

    if not email or not senha:
        return jsonify({'error': 'Credenciais inválidas'}), 401

    try:
        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)
        cursor.execute('SELECT * FROM usuarios WHERE email = %s', (email,))
        usuario = cursor.fetchone()

        if usuario and check_password_hash(usuario['senha'], senha, usuario['salt']):
            if not usuario['verificado']:
                return jsonify({'error': 'Email não verificado. Por favor, verifique seu email antes de fazer login.'}), 401

            session['usuario_id'] = usuario['id']
            session['tipo_usuario'] = usuario['tipo']

            return jsonify({'message': 'Login bem-sucedido'}), 200
        else:
            return jsonify({'error': 'Credenciais inválidas'}), 401

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro na autenticação: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()

@app.route('/api/verificar_autorizacao', methods=['POST'])
def verificar_autorizacao():
    try:
        data = request.get_json()
        usuario_id = data.get('usuario_id')
        senha = data.get('senha')

        if not usuario_id or not senha:
            return jsonify({'success': False, 'error': 'ID do usuário e senha são obrigatórios'}), 400

        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)
        cursor.execute('SELECT * FROM usuarios WHERE id = %s', (usuario_id,))
        usuario = cursor.fetchone()

        if usuario and check_password_hash(usuario['senha'], senha, usuario['salt']):
            return jsonify({'success': True, 'autorizado': True}), 200
        else:
            return jsonify({'success': True, 'autorizado': False}), 200

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()

@app.route('/api/cadastro', methods=['POST'])
def cadastro():
    try:
        data = request.get_json()
        nome_completo = data.get('nome_completo')
        apelido = data.get('apelido')
        email = data.get('email')
        celular = data.get('celular')
        senha = data.get('senha')

        if not all([nome_completo, apelido, email, celular, senha]):
            return jsonify({'success': False, 'error': 'Todos os campos são obrigatórios'}), 400

        mydb = get_db_connection()
        cursor = mydb.cursor()
        cursor.execute('SELECT * FROM usuarios WHERE email = %s', (email,))
        existing_user = cursor.fetchone()
        if existing_user:
            return jsonify({'success': False, 'error': 'Email já cadastrado'}), 400

        salt = secrets.token_hex(16)
        senha_hash = hashlib.sha256((senha + salt).encode()).hexdigest()
        verification_token = secrets.token_urlsafe(32)

        cursor.execute(
            'INSERT INTO usuarios (nome, apelido, email, celular, senha, salt, verificado, verification_token) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)',
            (nome_completo, apelido, email, celular, senha_hash, salt, False, verification_token)
        )
        mydb.commit()

        base_url = os.getenv('BASE_URL')
        verification_link = f'{base_url}/validar_email?token={verification_token}'
        email_verification.send_verification_email(email, verification_link)

        return jsonify({'success': True, 'message': 'Usuário cadastrado com sucesso! Verifique seu e-mail.'}), 201

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()

@app.route('/validar_email', methods=['GET'])
def validar_email():
    token = request.args.get('token')

    if not token:
        return jsonify({'success': False, 'error': 'Token não fornecido'}), 400

    try:
        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)
        cursor.execute('SELECT id, apelido FROM usuarios WHERE verification_token = %s', (token,))
        usuario = cursor.fetchone()

        if usuario:
            return render_template('validar/validar.html', apelido=usuario['apelido'], token=token)
        else:
            return jsonify({'success': False, 'error': 'Token inválido ou expirado'}), 400

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()

@app.route('/confirmar_email', methods=['POST'])
def confirmar_email():
    data = request.get_json()
    token = data.get('token')
    senha = data.get('senha')

    if not token or not senha:
        return jsonify({'success': False, 'error': 'Token ou senha não fornecidos'}), 400

    try:
        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)
        cursor.execute('SELECT * FROM usuarios WHERE verification_token = %s', (token,))
        usuario = cursor.fetchone()

        if usuario and check_password_hash(usuario['senha'], senha, usuario['salt']):
            cursor.execute('UPDATE usuarios SET verificado = TRUE WHERE id = %s', (usuario['id'],))
            mydb.commit()
            return jsonify({'success': True, 'message': 'Email confirmado com sucesso!'}), 200
        else:
            return jsonify({'success': False, 'error': 'Token ou senha inválidos'}), 401

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
