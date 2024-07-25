from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from database import get_db_connection
import mysql.connector
import json
import os
from flask_cors import CORS
import hashlib
import email_verification
import datetime
import secrets  # Para gerar tokens aleatórios
from flask_mail import Mail, Message

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
        cursor.close


#Rota para autenticar o login do usuário
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
        cursor.execute(
            'SELECT * FROM usuarios WHERE email = %s',
            (email,)
        )
        usuario = cursor.fetchone()

        if usuario and check_password_hash(usuario['senha'], senha, usuario['salt']):
            # Verificar se o e-mail está verificado
            if not usuario['verificado']:
                return jsonify({'error': 'Email não verificado. Por favor, verifique seu email antes de fazer login.'}), 401

            # Iniciar a sessão do usuário
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


# Nova rota para verificar a autorização do usuário
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
        # Obter os dados do formulário (sem usar FlaskForm)
        nome_completo = request.form.get('nome_completo')
        apelido = request.form.get('apelido')
        email = request.form.get('email')
        celular = request.form.get('celular')
        senha = request.form.get('senha')

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
        verification_token = secrets.token_urlsafe(32)

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
        cursor = mydb.cursor(dictionary=True)  # Retorna resultados como dicionários
        cursor.execute('SELECT id, nome, email FROM usuarios WHERE verification_token = %s', (token,))
        usuario = cursor.fetchone()

        if usuario:
            # Token válido, retorna os dados do usuário (sem a senha)
            return jsonify({'success': True, 'usuario': {
                'id': usuario['id'],
                'nome': usuario['nome'],
                'email': usuario['email']
            }}), 200
        else:
            return jsonify({'success': False, 'error': 'Token inválido ou expirado'}), 401  # Token inválido

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

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
            # Email e senha corretos, marcar o email como verificado
            cursor.execute('UPDATE usuarios SET verificado = True WHERE id = %s', (usuario['id'],))
            mydb.commit()
            return jsonify({'success': True, 'message': 'Email confirmado com sucesso!'}), 200
        else:
            return jsonify({'success': False, 'error': 'Token ou senha inválidos'}), 401

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()


@app.route('/api/partidas', methods=['POST'])
def criar_partida():
    try:
        data = request.get_json()
        nome = data.get('nome')
        quadra_id = data.get('quadra_id')
        dh_inicio = data.get('dh_inicio')
        dh_fim = data.get('dh_fim')
        numero_jogadores = data.get('numero_jogadores')
        valor = data.get('valor')
        status = data.get('status')
        # Outros campos conforme necessário (local, tipo de jogo, etc.)

        # Validação dos dados
        if not all([nome, quadra_id, dh_inicio, dh_fim, numero_jogadores, valor, status]):
            return jsonify({'success': False, 'error': 'Todos os campos são obrigatórios'}), 400

        # Verificar se a quadra existe
        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)
        cursor.execute('SELECT * FROM quadras WHERE id = %s', (quadra_id,))
        quadra = cursor.fetchone()
        if not quadra:
            return jsonify({'success': False, 'error': 'Quadra não encontrada'}), 404

        # Verificar se o horário está disponível (implemente a lógica aqui)

        # Converter datas para objetos datetime
        dh_inicio = datetime.datetime.fromisoformat(dh_inicio)
        dh_fim = datetime.datetime.fromisoformat(dh_fim)

        # Inserir partida no banco de dados
        cursor.execute(
            'INSERT INTO partidas (nome, quadra_id, dh_inicio, dh_fim, numero_jogadores, valor, status) VALUES (%s, %s, %s, %s, %s, %s, %s)',
            (nome, quadra_id, dh_inicio, dh_fim, numero_jogadores, valor, status)
        )
        mydb.commit()

        partida_id = cursor.lastrowid

        # Adicionar o organizador da partida à tabela de participantes (implemente a lógica aqui)

        return jsonify({'success': True, 'message': 'Partida criada com sucesso!', 'partida_id': partida_id}), 201

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()


@app.route('/api/partidas/<int:partida_id>', methods=['PUT'])
def atualizar_partida(partida_id):
    try:
        data = request.get_json()
        nome = data.get('nome')
        quadra_id = data.get('quadra_id')
        dh_inicio = data.get('dh_inicio')
        dh_fim = data.get('dh_fim')
        numero_jogadores = data.get('numero_jogadores')
        valor = data.get('valor')
        status = data.get('status')
        # Outros campos conforme necessário (local, tipo de jogo, etc.)

        # Validação dos dados (implemente a lógica de validação aqui)
        if not any([nome, quadra_id, dh_inicio, dh_fim, numero_jogadores, valor, status]):
            return jsonify({'success': False, 'error': 'Pelo menos um campo deve ser fornecido para atualização'}), 400

        # Verificar se a partida existe
        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)
        cursor.execute('SELECT * FROM partidas WHERE id = %s', (partida_id,))
        partida = cursor.fetchone()
        if not partida:
            return jsonify({'success': False, 'error': 'Partida não encontrada'}), 404

        # Verificar se o horário está disponível (implemente a lógica aqui)

        # Construir a query de atualização dinamicamente
        update_fields = []
        update_values = []
        for campo, valor in data.items():
            if valor is not None:
                if campo in ['dh_inicio', 'dh_fim']:
                    valor = datetime.datetime.fromisoformat(valor)  # Converter datas para datetime
                update_fields.append(f"{campo} = %s")
                update_values.append(valor)

        if update_fields:
            update_query = f"UPDATE partidas SET {', '.join(update_fields)} WHERE id = %s"
            update_values.append(partida_id)
            cursor.execute(update_query, update_values)
            mydb.commit()

            return jsonify({'success': True, 'message': 'Partida atualizada com sucesso!'}), 200
        else:
            return jsonify({'success': False, 'error': 'Nenhum campo válido para atualização'}), 400

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()


@app.route('/api/partidas/<int:partida_id>', methods=['DELETE'])
def excluir_partida(partida_id):
    try:
        mydb = get_db_connection()
        cursor = mydb.cursor()

        # Verificar se a partida existe
        cursor.execute('SELECT * FROM partidas WHERE id = %s', (partida_id,))
        partida = cursor.fetchone()
        if not partida:
            return jsonify({'success': False, 'error': 'Partida não encontrada'}), 404

        # Verificar se o usuário tem permissão para excluir a partida (implemente a lógica aqui)
        # ...

        # Excluir a partida
        cursor.execute('DELETE FROM partidas WHERE id = %s', (partida_id,))
        mydb.commit()

        return jsonify({'success': True, 'message': 'Partida excluída com sucesso!'}), 200

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()


@app.route('/api/partidas/<int:partida_id>/jogadores', methods=['GET'])
def get_jogadores_da_partida(partida_id):
    try:
        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)

        # Verificar se a partida existe
        cursor.execute('SELECT * FROM partidas WHERE id = %s', (partida_id,))
        partida = cursor.fetchone()
        if not partida:
            return jsonify({'success': False, 'error': 'Partida não encontrada'}), 404

        # Obter os jogadores da partida
        cursor.execute(
            '''
            SELECT u.id, u.nome, u.apelido 
            FROM usuarios u
            JOIN participantes p ON u.id = p.jogador_id
            WHERE p.partida_id = %s
            ''',
            (partida_id,)
        )
        jogadores = cursor.fetchall()

        return jsonify({'success': True, 'jogadores': jogadores}), 200

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()


@app.route('/api/partidas/<int:partida_id>/jogadores', methods=['POST'])
def adicionar_jogador_a_partida(partida_id):
    try:
        data = request.get_json()
        jogador_id = data.get('jogador_id')
        status_participante = data.get('status_participante', 'pendente')  # Padrão 'pendente' se não for fornecido

        if not jogador_id:
            return jsonify({'success': False, 'error': 'ID do jogador é obrigatório'}), 400

        mydb = get_db_connection()
        cursor = mydb.cursor()

        # Verificar se a partida existe
        cursor.execute('SELECT * FROM partidas WHERE id = %s', (partida_id,))
        partida = cursor.fetchone()
        if not partida:
            return jsonify({'success': False, 'error': 'Partida não encontrada'}), 404

        # Verificar se o jogador já está na partida
        cursor.execute('SELECT * FROM participantes WHERE partida_id = %s AND jogador_id = %s', (partida_id, jogador_id))
        participante_existente = cursor.fetchone()
        if participante_existente:
            return jsonify({'success': False, 'error': 'Jogador já está na partida'}), 400

        # Verificar se a partida está cheia (implemente a lógica aqui)
        # ...

        # Inserir o jogador na partida
        cursor.execute(
            'INSERT INTO participantes (partida_id, jogador_id, status_participante) VALUES (%s, %s, %s)',
            (partida_id, jogador_id, status_participante)
        )
        mydb.commit()

        return jsonify({'success': True, 'message': 'Jogador adicionado à partida com sucesso!'}), 201

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()


@app.route('/api/partidas/<int:partida_id>/jogadores/<int:jogador_id>', methods=['DELETE'])
def remover_jogador_da_partida(partida_id, jogador_id):
    try:
        mydb = get_db_connection()
        cursor = mydb.cursor()

        # Verificar se a partida existe
        cursor.execute('SELECT * FROM partidas WHERE id = %s', (partida_id,))
        partida = cursor.fetchone()
        if not partida:
            return jsonify({'success': False, 'error': 'Partida não encontrada'}), 404

        # Verificar se o jogador está na partida
        cursor.execute('SELECT * FROM participantes WHERE partida_id = %s AND jogador_id = %s', (partida_id, jogador_id))
        participante = cursor.fetchone()
        if not participante:
            return jsonify({'success': False, 'error': 'Jogador não encontrado na partida'}), 404

        # Verificar se o usuário tem permissão para remover o jogador (implemente a lógica aqui)
        # ... (por exemplo, verificar se o usuário é o organizador da partida)

        # Remover o jogador da partida
        cursor.execute('DELETE FROM participantes WHERE partida_id = %s AND jogador_id = %s', (partida_id, jogador_id))
        mydb.commit()

        return jsonify({'success': True, 'message': 'Jogador removido da partida com sucesso!'}), 200

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()


@app.route('/api/perfil', methods=['GET'])
def get_perfil():
    try:
        # Verificar se o usuário está logado
        if 'usuario_id' not in session:
            return jsonify({'success': False, 'error': 'Usuário não autenticado'}), 401

        usuario_id = session['usuario_id']

        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)
        cursor.execute('SELECT nome, apelido, email, celular, tipo FROM usuarios WHERE id = %s', (usuario_id,))
        usuario = cursor.fetchone()

        if usuario:
            # Retornar os dados do perfil do usuário (sem a senha)
            return jsonify({'success': True, 'perfil': usuario}), 200
        else:
            return jsonify({'success': False, 'error': 'Usuário não encontrado'}), 404

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()


@app.route('/api/perfil', methods=['PUT'])
def atualizar_perfil():
    try:
        # Verificar se o usuário está logado
        if 'usuario_id' not in session:
            return jsonify({'success': False, 'error': 'Usuário não autenticado'}), 401

        usuario_id = session['usuario_id']
        data = request.get_json()

        # Validação dos dados (implemente a lógica de validação aqui)
        if not any(data.values()):
            return jsonify({'success': False, 'error': 'Pelo menos um campo deve ser fornecido para atualização'}), 400

        # Construir a query de atualização dinamicamente
        update_fields = []
        update_values = []
        for campo, valor in data.items():
            if valor is not None:  # Ignora campos vazios
                update_fields.append(f"{campo} = %s")
                update_values.append(valor)

        if update_fields:
            update_query = f"UPDATE usuarios SET {', '.join(update_fields)} WHERE id = %s"
            update_values.append(usuario_id)

            mydb = get_db_connection()
            cursor = mydb.cursor()
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
    

@app.route('/api/perfil/partidas', methods=['GET'])
def get_partidas_do_usuario():
    try:
        # Verificar se o usuário está logado
        if 'usuario_id' not in session:
            return jsonify({'success': False, 'error': 'Usuário não autenticado'}), 401

        usuario_id = session['usuario_id']

        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)

        # Obter as partidas que o usuário está participando
        cursor.execute(
            '''
            SELECT p.* 
            FROM partidas p
            JOIN participantes pa ON p.id = pa.partida_id
            WHERE pa.jogador_id = %s
            ''',
            (usuario_id,)
        )
        partidas_participando = cursor.fetchall()

        # Obter as partidas que o usuário está organizando
        cursor.execute('SELECT * FROM partidas WHERE organizador_id = %s', (usuario_id,))
        partidas_organizando = cursor.fetchall()

        # Combinar as duas listas de partidas
        todas_as_partidas = partidas_participando + partidas_organizando

        # Formatar as datas (se necessário)
        for partida in todas_as_partidas:
            if partida['dh_inicio']:
                partida['dh_inicio'] = partida['dh_inicio'].isoformat()
            if partida['dh_fim']:
                partida['dh_fim'] = partida['dh_fim'].isoformat()

        return jsonify({'success': True, 'partidas': todas_as_partidas}), 200

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()


@app.route('/api/perfil/historico', methods=['GET'])
def get_historico_partidas():
    try:
        # Verificar se o usuário está logado
        if 'usuario_id' not in session:
            return jsonify({'success': False, 'error': 'Usuário não autenticado'}), 401

        usuario_id = session['usuario_id']

        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)

        # Obter as partidas que o usuário participou e que já foram finalizadas
        cursor.execute(
            '''
            SELECT p.* 
            FROM partidas p
            JOIN participantes pa ON p.id = pa.partida_id
            WHERE pa.jogador_id = %s
            AND p.dh_fim < NOW()  -- Filtrar por partidas finalizadas
            ''',
            (usuario_id,)
        )
        partidas = cursor.fetchall()

        # Formatar as datas (se necessário)
        for partida in partidas:
            if partida['dh_inicio']:
                partida['dh_inicio'] = partida['dh_inicio'].isoformat()
            if partida['dh_fim']:
                partida['dh_fim'] = partida['dh_fim'].isoformat()

        return jsonify({'success': True, 'historico': partidas}), 200

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()


@app.route('/api/perfil/estatisticas', methods=['GET'])
def get_estatisticas_usuario():
    try:
        # Verificar se o usuário está logado
        if 'usuario_id' not in session:
            return jsonify({'success': False, 'error': 'Usuário não autenticado'}), 401

        usuario_id = session['usuario_id']

        mydb = get_db_connection()
        cursor = mydb.cursor(dictionary=True)

        # Obter as estatísticas do usuário (exemplo)
        cursor.execute(
            '''
            SELECT 
                SUM(CASE WHEN resultado = 'vitoria' THEN 1 ELSE 0 END) AS vitorias,
                SUM(CASE WHEN resultado = 'derrota' THEN 1 ELSE 0 END) AS derrotas,
                SUM(gols) AS gols,
                SUM(assistencias) AS assistencias
            FROM participantes
            WHERE jogador_id = %s
            ''',
            (usuario_id,)
        )
        estatisticas = cursor.fetchone()

        return jsonify({'success': True, 'estatisticas': estatisticas}), 200

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': f'Erro no banco de dados: {err.msg}'}), 500

    finally:
        cursor.close()
        mydb.close()



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
