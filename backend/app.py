from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from database import get_db_connection
import mysql.connector
import json
import os
from flask_cors import CORS
import hashlib
import email_verification
import datetime
import secrets
from flask_mail import Mail, Message

# Carregar variáveis de ambiente
load_dotenv()

app = Flask(__name__, static_folder='../frontend', template_folder='../frontend/pages')
app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')
CORS(app)

# Função auxiliar para verificar hash de senha
def check_password_hash(stored_password, provided_password, salt):
    return stored_password == hashlib.sha256((provided_password + salt).encode()).hexdigest()

# Rota de cadastro
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

        email_verification.send_verification_email(email, verification_link, nome_completo)

        return jsonify({'success': True, 'message': 'Usuário cadastrado com sucesso! Verifique seu e-mail.'}), 201

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()

# Rota de verificação de e-mail
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
            # Renderiza a página de validação
            return render_template('validar/validar.html', apelido=usuario['apelido'], token=token)
        else:
            return jsonify({'success': False, 'error': 'Token inválido ou expirado'}), 400

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()

#Rota para confimar email
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

# Rota de login
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')

    if not email or not senha:
        return jsonify({'success': False, 'error': 'Credenciais inválidas'}), 401

    try:
        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)
        cursor.execute('SELECT * FROM usuarios WHERE email = %s', (email,))
        usuario = cursor.fetchone()

        if usuario and check_password_hash(usuario['senha'], senha, usuario['salt']):
            if not usuario['verificado']:
                return jsonify({'success': False, 'error': 'Email não verificado. Verifique seu email antes de fazer login.'}), 401

            session['usuario_id'] = usuario['id']
            session['tipo_usuario'] = usuario['tipo']
            return jsonify({'success': True, 'message': 'Login bem-sucedido'}), 200
        else:
            return jsonify({'success': False, 'error': 'Credenciais inválidas'}), 401

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro na autenticação: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()

# Rota para obter perfil do usuário
@app.route('/api/perfil', methods=['GET'])
def get_perfil():
    if 'usuario_id' not in session:
        return jsonify({'success': False, 'error': 'Usuário não autenticado'}), 401

    usuario_id = session['usuario_id']

    try:
        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)
        cursor.execute('SELECT nome, apelido, email, celular, tipo FROM usuarios WHERE id = %s', (usuario_id,))
        usuario = cursor.fetchone()

        if usuario:
            return jsonify({'success': True, 'perfil': usuario}), 200
        else:
            return jsonify({'success': False, 'error': 'Usuário não encontrado'}), 404

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()

# Rota para atualizar perfil do usuário
@app.route('/api/perfil', methods=['PUT'])
def atualizar_perfil():
    if 'usuario_id' not in session:
        return jsonify({'success': False, 'error': 'Usuário não autenticado'}), 401

    usuario_id = session['usuario_id']
    data = request.get_json()

    if not any(data.values()):
        return jsonify({'success': False, 'error': 'Pelo menos um campo deve ser fornecido para atualização'}), 400

    try:
        mydb = get_db_connection()
        cursor = mydb.cursor()
        update_fields = []
        update_values = []
        for campo, valor in data.items():
            if valor is not None:
                update_fields.append(f"{campo} = %s")
                update_values.append(valor)

        if update_fields:
            update_query = f"UPDATE usuarios SET {', '.join(update_fields)} WHERE id = %s"
            update_values.append(usuario_id)
            cursor.execute(update_query, update_values)
            mydb.commit()
            return jsonify({'success': True, 'message': 'Perfil atualizado com sucesso!'}), 200
        else:
            return jsonify({'success': False, 'error': 'Nenhum campo válido para atualização'}), 400

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()

# Rota para listar quadras
@app.route('/api/quadras', methods=['GET'])
def get_quadras():
    nome = request.args.get('nome', '')
    try:
        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)
        
        if nome:
            query = 'SELECT * FROM quadras WHERE nome LIKE %s'
            cursor.execute(query, (f'%{nome}%',))
        else:
            query = 'SELECT * FROM quadras'
            cursor.execute(query)

        quadras = cursor.fetchall()

        for quadra in quadras:
            quadra['imagens'] = json.loads(quadra['imagens']) if quadra['imagens'] else []
            quadra['disponibilidade'] = json.loads(quadra['disponibilidade']) if quadra['disponibilidade'] else []

        return jsonify(quadras)

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro ao buscar quadras: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()


# Rota para obter detalhes de uma quadra específica
@app.route('/api/quadras/<quadra_id>', methods=['GET'])
def get_quadra(quadra_id):
    try:
        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)
        cursor.execute('SELECT * FROM quadras WHERE id = %s', (quadra_id,))
        quadra = cursor.fetchone()

        if quadra:
            quadra['imagens'] = json.loads(quadra['imagens']) if quadra['imagens'] else []
            quadra['disponibilidade'] = json.loads(quadra['disponibilidade']) if quadra['disponibilidade'] else []
            return jsonify(quadra)
        else:
            return jsonify({'error': 'Quadra não encontrada'}), 404

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro ao buscar quadra: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()

# Nova rota para filtrar vídeos
@app.route('/api/videos', methods=['GET'])
def get_videos():
    quadra_id = request.args.get('quadra_id')
    data_inicio = request.args.get('data_inicio')
    hora_inicio = request.args.get('hora_inicio')

    query = """
        SELECT v.id, v.partida_id, v.quadra_id, v.url, v.tipo, v.data_criacao 
        FROM videos v
        JOIN partidas p ON v.partida_id = p.id 
        WHERE 1=1
    """
    params = []

    if quadra_id:
        query += " AND p.quadra_id = %s"
        params.append(quadra_id)
    if data_inicio:
        query += " AND DATE(v.data_criacao) = %s"
        params.append(data_inicio)
    if hora_inicio:
        query += " AND TIME(v.data_criacao) = %s"
        params.append(hora_inicio)

    try:
        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)
        cursor.execute(query, params)
        videos = cursor.fetchall()

        # Converter resultados para JSON
        for video in videos:
            video['data_criacao'] = video['data_criacao'].isoformat() if video['data_criacao'] else None

        return jsonify(videos)

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro ao buscar vídeos: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()

# Iniciar o servidor Flask
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
