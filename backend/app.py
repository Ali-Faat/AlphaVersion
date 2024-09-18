import os
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, abort, send_file, Response, stream_with_context, current_app
from database import get_db_connection
import mysql.connector
import json
from flask_cors import CORS
import hashlib
from email_verification import send_welcome_email
import datetime
import base64
import asyncio
from werkzeug.utils import secure_filename
import secrets
from flask_mail import Mail, Message
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash, check_password_hash


# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

app = Flask(__name__, template_folder='../frontend/pages')
app.secret_key = os.getenv('SECRET_KEY')

# Configuração do JWT
app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY')  # Usando a mesma chave secreta
jwt = JWTManager(app)

# Configuração do CORS para permitir múltiplas origens e suporte a credenciais
CORS(app, supports_credentials=True, resources={
    r"/api/*": {
        "origins": [
            "http://127.0.0.1:5500",
            "http://138.99.160.212:8000",
            "http://goalcast.com.br:8000",
            "https://127.0.0.1:5500",
            "https://138.99.160.212:8000",
            "https://goalcast.com.br:8000" 
        ]
    },
    r"/validar_email": {
        "origins": [
            "http://goalcast.com.br:8000",
            "https://goalcast.com.br:8000"
        ]
    },
    r"/confirmar_email": {
        "origins": [
            "http://goalcast.com.br:8000",
            "https://goalcast.com.br:8000"
        ]
    }
})


# Configuração do e-mail
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT'))
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL') == 'True'

# Configuração de upload de arquivos
app.config['UPLOAD_FOLDER'] = r'C:\GoalCast\AlphaVersion\backend\uploads\videos'
app.config['ALLOWED_EXTENSIONS'] = {'mp4', 'avi', 'mov', 'mkv'}


mail = Mail(app)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def generate_salt():
    return base64.b64encode(os.urandom(16)).decode('utf-8')

def generate_password_hash(password, salt):
    salt_bytes = base64.b64decode(salt.encode('utf-8'))
    password_salt_combined = password.encode('utf-8') + salt_bytes
    return hashlib.sha256(password_salt_combined).hexdigest()

def check_password_hash(stored_password, provided_password, salt):
    return hashlib.sha256((provided_password + salt).encode()).hexdigest() == stored_password

def executar_consulta(query, params=None):
    mydb = get_db_connection()
    cursor = mydb.cursor()

    try:
        cursor.execute(query, params or ())
        resultados = cursor.fetchall()
        colunas = [col[0] for col in cursor.description]
        resultados_json = [dict(zip(colunas, resultado)) for resultado in resultados]
        return jsonify(resultados_json)
    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro no banco de dados: {err}'}), 500
    finally:
        cursor.close()
        mydb.close()

async def processar_video(video, usuario_id):
    video_id, video_path, data_criacao, criador_id, eh_criador = video

    # Verificar se o arquivo de vídeo existe
    if not os.path.exists(video_path):
        print(f"Arquivo não encontrado: {video_path}")
        return None

    print(f"Lendo arquivo de vídeo: {video_path}")
    # Ler e codificar o vídeo em formato blob
    with open(video_path, 'rb') as file:
        video_blob = base64.b64encode(file.read()).decode('utf-8')

    video_data = {
        'data_criacao': data_criacao.strftime('%Y-%m-%d %H:%M:%S'),
        'eh_criador': bool(eh_criador),
        'video_blob': video_blob  # Blob codificado em base64
    }

    return video_data

async def stream_videos(videos, usuario_id):
    for video in videos:
        video_data = await processar_video(video, usuario_id)
        if video_data:
            yield f"{json.dumps(video_data)}\n"


def send_email(subject, recipient, body_text, body_html=None, sender=None):
    """
    Envia um e-mail com o assunto e corpo fornecidos.

    :param subject: Assunto do e-mail
    :param recipient: Endereço de e-mail do destinatário
    :param body_text: Corpo do e-mail em texto simples
    :param body_html: Corpo do e-mail em HTML (opcional)
    :param sender: Endereço de e-mail do remetente (opcional)
    """
    sender = sender or current_app.config.get('MAIL_DEFAULT_SENDER', 'default@example.com')
    msg = Message(subject, recipients=[recipient], sender=sender)
    msg.body = body_text
    if body_html:
        msg.html = body_html

    try:
        mail.send(msg)
        return True
    except Exception as e:
        current_app.logger.error(f'Erro ao enviar e-mail: {e}')
        return False


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


# Rota para adicionar clube
@app.route('/api/clubes', methods=['POST'])
def add_clube():
    data = request.get_json()

    # Validação dos dados recebidos
    if not data or not 'idusuariocriador' in data or not 'nome' in data or not 'senha' in data:
        return jsonify({'message': 'Dados incompletos'}), 400

    idusuariocriador = data['idusuariocriador']
    nome = data['nome']
    icon = data.get('icon', None)  # Campo opcional
    idarenasede = data.get('idarenasede', None)  # Campo opcional
    senha = data['senha']

    try:
        # Conexão ao banco de dados
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Monta a query SQL
            sql = """
                INSERT INTO clubes (idusuariocriador, nome, icon, idarenasede, senha)
                VALUES (%s, %s, %s, %s, %s)
            """
            # Executa a query
            cursor.execute(sql, (idusuariocriador, nome, icon, idarenasede, senha))
            connection.commit()

            # Obtém o ID do clube recém-criado
            id_clube = cursor.lastrowid

        # Fecha a conexão
        connection.close()

        # Retorna uma resposta de sucesso com o ID do novo clube
        return jsonify({'idclubes': id_clube, 'message': 'Clube criado com sucesso!'}), 201

    except Exception as e:
        # Em caso de erro, retorna a mensagem de erro
        return jsonify({'message': str(e)}), 500


@app.route('/api/quadras', methods=['GET'])
def get_quadras():
    return executar_consulta('SELECT id_sequencial, id, nome, endereco, tipo, imagens, descricao, preco_hora, disponibilidade, avaliacao_media FROM quadras')

@app.route('/api/upload_video', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        print("Nenhum arquivo de vídeo foi enviado.")  # Log de depuração
        return jsonify({'error': 'Nenhum arquivo de vídeo foi enviado.'}), 400
    
    video = request.files['video']
    
    if video.filename == '':
        print("Nenhum arquivo foi selecionado.")  # Log de depuração
        return jsonify({'error': 'Nenhum arquivo foi selecionado.'}), 400
    
    if video and allowed_file(video.filename):
        try:
            filename = secure_filename(video.filename)

            # Obter os dados adicionais da requisição
            quadra_id = request.form.get('quadra_id')
            dh_inicio = request.form.get('dh_inicio')
            dh_fim = request.form.get('dh_fim')
            tipo = request.form.get('tipo', 'partida')  # Tipo do vídeo, por exemplo: 'partida', 'lance'
            criador_id = session.get('usuario_id')

            # Criar o caminho dinâmico baseado no quadra_id
            directory = os.path.join(app.config['UPLOAD_FOLDER'], f'quadra_{quadra_id}')
            if not os.path.exists(directory):
                os.makedirs(directory)
                print(f"Diretório criado: {directory}")  # Log de depuração

            # Definir o caminho final do arquivo
            filepath = os.path.join(directory, filename)

            # Salvar o vídeo no diretório de uploads
            video.save(filepath)
            print(f"Arquivo salvo em: {filepath}")  # Log de depuração
            
            # Verificar se há uma partida registrada para a quadra no horário fornecido
            mydb = get_db_connection()
            cursor = mydb.cursor(dictionary=True)
            
            cursor.execute('SELECT * FROM partidas WHERE quadra_id = %s AND dh_inicio = %s', (quadra_id, dh_inicio))
            partida = cursor.fetchone()

            # Se não houver partida, criar uma nova
            if not partida:
                cursor.execute(
                    'INSERT INTO partidas (quadra_id, dh_inicio, dh_fim) VALUES (%s, %s, %s)',
                    (quadra_id, dh_inicio, dh_fim)
                )
                mydb.commit()
                partida_id = cursor.lastrowid
                print(f"Nova partida criada com ID: {partida_id}")  # Log de depuração
            else:
                partida_id = partida['id']
                print(f"Partida existente encontrada com ID: {partida_id}")  # Log de depuração
            
            # Caminho relativo para salvar no banco de dados
            video_url = os.path.relpath(filepath, start=os.path.dirname(__file__))  # Gera o caminho relativo ao diretório do app
            
            # Salvar a URL do vídeo no banco de dados
            cursor.execute(
                'INSERT INTO videos (partida_id, quadra_id, url, tipo, criador_id, data_criacao) VALUES (%s, %s, %s, %s, %s, %s)',
                (partida_id, quadra_id, video_url, tipo, criador_id, datetime.datetime.now())
            )
            mydb.commit()
            print(f"Vídeo registrado no banco de dados com URL: {video_url}")  # Log de depuração
            
            cursor.close()
            mydb.close()
            
            return jsonify({'success': True, 'message': 'Vídeo enviado com sucesso!', 'video_url': video_url}), 201
        except Exception as e:
            print(f"Erro ao processar o upload do vídeo: {str(e)}")  # Log de depuração
            return jsonify({'error': f'Erro ao processar o upload do vídeo: {str(e)}'}), 500
    else:
        print("Formato de arquivo não permitido.")  # Log de depuração
        return jsonify({'error': 'Formato de arquivo não permitido.'}), 400


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
        partidas_json = [
            {
                'id': partida['id'],
                'quadra_id': partida['quadra_id'],
                'dh_inicio': partida['dh_inicio'].isoformat() if partida['dh_inicio'] else None,
                'dh_fim': partida['dh_fim'].isoformat() if partida['dh_fim'] else None
            } for partida in partidas
        ]
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

    mydb = get_db_connection()
    cursor = mydb.cursor()

    try:
        if quadra_id and partida_id:
            query = '''
                SELECT id, data_criacao, criador_id, (criador_id = %s) AS eh_criador
                FROM videos
                WHERE quadra_id = %s AND partida_id = %s
            '''
            params = (session.get('usuario_id'), quadra_id, partida_id)
            cursor.execute(query, params)
            videos = cursor.fetchall()

            if not videos:
                return jsonify([])

            response_data = []
            for video in videos:
                video_id, data_criacao, criador_id, eh_criador = video

                video_data = {
                    'video_id': video_id,  # Enviar o ID do vídeo para o frontend
                    'data_criacao': data_criacao.strftime('%Y-%m-%d %H:%M:%S'),
                    'eh_criador': bool(eh_criador)
                }
                response_data.append(video_data)

            return jsonify(response_data)

        else:
            return jsonify({'error': 'Parametros quadra_id e partida_id são necessários'}), 400

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro ao buscar vídeos: {err}'}), 500
    finally:
        cursor.close()
        mydb.close()


@app.route('/api/video_stream/<int:video_id>', methods=['GET'])
def stream_video(video_id):
    # Conectar ao banco de dados e buscar o vídeo pelo ID
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)
    try:
        cursor.execute('SELECT url, criador_id FROM videos WHERE id = %s', (video_id,))
        video = cursor.fetchone()

        if not video:
            print("Vídeo não encontrado.")
            abort(404)

        video_path = video['url']

        if not os.path.exists(video_path):
            print(f"Arquivo de vídeo não encontrado: {video_path}")
            abort(404)

        return send_file(video_path, mimetype='video/mp4', as_attachment=False)

    except mysql.connector.Error as err:
        print(f"Erro ao buscar vídeo: {err}")
        abort(500)
    finally:
        cursor.close()
        mydb.close()


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

            return jsonify({'message': 'Login bem-sucedido'}), 200
        else:
            return jsonify({'error': 'Credenciais inválidas'}), 401

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro na autenticação: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()


@app.route('/api/check_auth', methods=['GET'])
def check_auth():
    if 'usuario_id' in session:
        return jsonify({'autenticado': True})
    else:
        return jsonify({'autenticado': False}), 401


@app.route('/api/reset-password', methods=['POST'])
def handle_reset_password():
    print("Recebendo solicitação para redefinição de senha")

    data = request.get_json()
    email = data.get('email')
    nova_senha = data.get('password')

    if not email or not nova_senha:
        print("Dados insuficientes fornecidos")
        return jsonify({'error': 'Dados insuficientes para redefinição de senha'}), 400

    try:
        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)
        print(f"Conectado ao banco de dados, procurando usuário com email: {email}")

        # Verifica se o usuário existe no banco de dados
        cursor.execute('SELECT * FROM usuarios WHERE email = %s', (email,))
        usuario = cursor.fetchone()

        if not usuario:
            print(f"Usuário não encontrado para o email: {email}")
            return jsonify({'error': 'Usuário não encontrado'}), 404

        # Gera um novo hash e salt para a nova senha
        salt = generate_salt()
        senha_hashed = generate_password_hash(nova_senha, salt)
        print(f"Senha e salt gerados para o usuário: {email}")

        # Atualiza a senha no banco de dados
        cursor.execute('UPDATE usuarios SET senha = %s, salt = %s WHERE email = %s', (senha_hashed, salt, email))
        mydb.commit()
        print(f"Senha atualizada com sucesso para o usuário: {email}")

        return jsonify({'message': 'Senha redefinida com sucesso'}), 200

    except mysql.connector.Error as err:
        print(f"Erro ao redefinir a senha: {err}")
        return jsonify({'error': f'Erro ao redefinir a senha: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()
        print("Conexão com o banco de dados encerrada")


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

        # Gera um token de verificação
        verification_token = secrets.token_urlsafe(32)

        # Insere o usuário no banco de dados, com o campo verificado como False
        cursor.execute(
            'INSERT INTO usuarios (nome, apelido, email, celular, senha, salt, verificado, verification_token) '
            'VALUES (%s, %s, %s, %s, %s, %s, %s, %s)',
            (nome_completo, apelido, email, celular, senha_hash, salt, True, verification_token)
        )
        mydb.commit()

        # Link de verificação
        verification_link = f"http://goalcast.com.br:5000/validar_email?token={verification_token}&apelido={apelido}"

        # Envia o e-mail de verificação
        subject = "Verifique seu e-mail"
        body_text = f"Olá {nome_completo},\n\nPor favor, verifique seu e-mail clicando no link a seguir: {verification_link}"
        body_html = f"<p>Olá {nome_completo},</p><p>Por favor, verifique seu e-mail clicando no link a seguir:</p><p><a href='{verification_link}'>Verificar E-mail</a></p>"

        send_email(subject, email, body_text, body_html)

        return jsonify({'success': True, 'message': 'Usuário cadastrado com sucesso! Verifique seu e-mail para ativar sua conta.'}), 201

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

        # Validação do token no banco de dados
        cursor.execute('SELECT apelido FROM usuarios WHERE verification_token = %s', (token,))
        usuario = cursor.fetchone()

        if usuario:
            # Se o token for válido, redirecione para o frontend com o apelido
            apelido = usuario['apelido']
            return redirect(f'http://goalcast.com.br:8000/pages/validar/validar.html?apelido={apelido}')
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
    email = data.get('email')
    senha = data.get('senha')

    if not email or not senha:
        return jsonify({'success': False, 'error': 'E-mail ou senha não fornecidos'}), 400

    try:
        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)
        cursor.execute('SELECT * FROM usuarios WHERE email = %s', (email,))
        usuario = cursor.fetchone()

        if usuario and check_password_hash(usuario['senha'], senha, usuario['salt']):
            cursor.execute('UPDATE usuarios SET verificado = TRUE WHERE id = %s', (usuario['id'],))
            mydb.commit()
            return jsonify({'success': True, 'message': 'E-mail verificado com sucesso!'}), 200
        else:
            return jsonify({'success': False, 'error': 'E-mail ou senha inválidos.'}), 401

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()


if __name__ == '__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])

    ssl_context = ('./ssl/certificate.crt', './ssl/private.key')
    app.run(host='0.0.0.0', port=5000)
