# Importe o módulo HTTP do Python
from http.server import SimpleHTTPRequestHandler, HTTPServer

# Defina a porta que o servidor irá usar
PORT = 8000

# Crie uma classe que estende SimpleHTTPRequestHandler
class CustomHandler(SimpleHTTPRequestHandler):
    # Sobrescreva o método para permitir o acesso de qualquer origem
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)

# Crie um servidor HTTP na porta especificada, usando a classe customizada
httpd = HTTPServer(('0.0.0.0', PORT), CustomHandler)

# Imprima a mensagem de inicialização do servidor
print(f'Servidor rodando na porta {PORT}')

# Inicie o servidor
httpd.serve_forever()
