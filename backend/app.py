from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from database import get_db_connection
from dotenv import load_dotenv
import mysql.connector
import json
import os
from flask_cors import CORS
import hashlib
import email_verification
import secrets  # Para gerar tokens aleatórios
from flask_mail import Mail, Message

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Gera uma chave secreta aleatória
CORS(app)

# Configurações de email (substitua pelos seus dados)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'  # ou o servidor do seu provedor
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
mail = Mail(app)


# Função para obter a conexão com o banco de dados
def get_db_connection():
    mydb = mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME')
    )
    return mydb


def check_password_hash(stored_password, provided_password, salt):
    """Verifica se a senha fornecida corresponde à senha armazenada (com hash e salt)."""
    return stored_password == hashlib.sha256((provided_password + salt).encode()).hexdigest()


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

@app.route('/api/usuarios/<int:usuario_id>', methods=['GET'])
def get_usuario(usuario_id):
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)  # Retorna resultados como dicionários

    try:
        cursor.execute('SELECT * FROM usuarios WHERE id = %s', (usuario_id,))
        usuario = cursor.fetchone()

        if usuario is None:
            return jsonify({'error': 'Usuário não encontrado'}), 404

        # Remover a senha do dicionário antes de retornar
        del usuario['senha']

        return jsonify(usuario)

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro ao buscar usuário: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()


# Rota para cadastrar o usuário e gerar token de verificação por e-mail
@app.route('/api/cadastro', methods=['POST'])
def cadastro():
    try:
        data = request.get_json()
        nome_completo = data['nome_completo']
        apelido = data['apelido']
        email = data['email']
        celular = data['celular']
        senha = data['senha']

        # Validação dos dados (implemente a lógica de validação aqui)
        if not all([nome_completo, apelido, email, celular, senha]):
            return jsonify({'success': False, 'error': 'Todos os campos são obrigatórios'}), 400

        # Verificar se o email já está cadastrado
        mydb = get_db_connection()
        cursor = mydb.cursor()
        cursor.execute('SELECT * FROM usuarios WHERE email = %s', (email,))
        existing_user = cursor.fetchone()
        if existing_user:
            return jsonify({'success': False, 'error': 'Email já cadastrado'}), 400

        # Criptografar a senha com salt
        salt = secrets.token_hex(16)
        senha_hash = hashlib.sha256((senha + salt).encode()).hexdigest()

        # Gerar token de verificação
        verification_token = secrets.token_urlsafe(32)  # Token mais seguro para URLs

        # Inserir usuário no banco de dados
        cursor.execute(
            'INSERT INTO usuarios (nome, apelido, email, celular, senha, salt, verificado, verification_token) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)',
            (nome_completo, apelido, email, celular, senha_hash, salt, False, verification_token)
        )
        mydb.commit()

        # Criar link de verificação
        base_url = os.getenv('BASE_URL')
        verification_link = f'{base_url}/validar_email?token={verification_token}'

        # Enviar e-mail de verificação
        email_verification.send_verification_email(mail, email, verification_link, nome_completo)

        return jsonify({'success': True, 'message': 'Usuário cadastrado com sucesso! Verifique seu e-mail.'}), 201

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('password')

    if not email or not senha:
        return jsonify({'success': False, 'error': 'Email e senha são obrigatórios'}), 400

    try:
        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)
        cursor.execute('SELECT * FROM usuarios WHERE email = %s', (email,))
        usuario = cursor.fetchone()

        if usuario and check_password_hash(usuario['senha'], senha, usuario['salt']):
            # Verificar se o email está verificado
            if not usuario['verificado']:
                return jsonify({'success': False, 'error': 'Email não verificado. Por favor, verifique seu email antes de fazer login.'}), 401

            # Iniciar a sessão do usuário
            session['usuario_id'] = usuario['id']
            session['tipo_usuario'] = usuario['tipo']  # Supondo que você tenha um campo 'tipo' na tabela de usuários

            return jsonify({'success': True, 'message': 'Login bem-sucedido'}), 200
        else:
            return jsonify({'success': False, 'error': 'Credenciais inválidas'}), 401

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro na autenticação: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()



@app.route('/confirmar_email', methods=['POST'])
def confirmar_email():
    try:
        data = request.get_json()
        token = data.get('token')
        senha = data.get('senha')

        if not token or not senha:
            return jsonify({'success': False, 'error': 'Token ou senha não fornecidos'}), 400

        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)
        cursor.execute('SELECT * FROM usuarios WHERE verification_token = %s', (token,))
        usuario = cursor.fetchone()

        if usuario and check_password_hash(usuario['senha'], senha, usuario['salt']):
            cursor.execute('UPDATE usuarios SET verificado = True WHERE id = %s', (usuario['id'],))
            mydb.commit()
            return jsonify({'success': True, 'message': 'Email confirmado com sucesso!'}), 200
        else:
            return jsonify({'success': False, 'error': 'Token ou senha inválidos'}), 401

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()


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
                'id': partida['id'],  # Corrigido para usar o nome da coluna
                'dh_inicio': partida['dh_inicio'].isoformat() if partida['dh_inicio'] else None,
                'dh_fim': partida['dh_fim'].isoformat() if partida['dh_fim'] else None
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
    data_inicio = request.args.get('data_inicio')

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
            query = '''
                SELECT v.*, (v.criador_id = %s) AS eh_criador 
                FROM videos v
                JOIN partidas p ON v.partida_id = p.id 
                WHERE p.quadra_id = %s
            '''
            params = (session.get('usuario_id'), quadra_id)
        else:
            # Se não houver quadra_id, retorna todos os vídeos
            query = '''
                SELECT v.*, (v.criador_id = %s) AS eh_criador 
                FROM videos v
            '''
            params = (session.get('usuario_id'),)

        cursor.execute(query, params)
        videos = cursor.fetchall()

        # Converter para formato JSON
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
        mydb.close()



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
