from flask import Flask, jsonify, request
from database import get_db_connection
import json

app = Flask(__name__)

# Rota para listar as quadras
@app.route('/api/quadras', methods=['GET'])
def get_quadras():
    mydb = get_db_connection()
    cursor = mydb.cursor()

    try:
        cursor.execute('SELECT * FROM quadras')
        quadras = cursor.fetchall()

        quadras_json = []
        for quadra in quadras:
            # Tratar valores nulos para imagens e disponibilidade
            imagens_list = json.loads(quadra[4]) if quadra[4] else []
            disponibilidade_list = json.loads(quadra[7]) if quadra[7] else []

            quadras_json.append({
                'id': quadra[1],
                'nome': quadra[2],
                'endereco': quadra[3],
                'tipo': quadra[4],
                'imagens': imagens_list,
                'descricao': quadra[5],
                'preco_hora': quadra[6],
                'disponibilidade': disponibilidade_list,
                'avaliacao_media': quadra[8]
            })

        return jsonify(quadras_json)

    except mysql.connector.Error as err:
        return jsonify({'error': f'Erro ao buscar quadras: {err}'}), 500

    finally:
        cursor.close()
        mydb.close()

if __name__ == '__main__':
    app.run(debug=True)
