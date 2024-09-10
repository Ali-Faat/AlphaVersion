from http.server import SimpleHTTPRequestHandler, HTTPServer
import ssl

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

"""# Adicione suporte a SSL
httpd.socket = ssl.wrap_socket(httpd.socket,
                               keyfile='../backend/ssl/private.key',
                               certfile='../backend/ssl/certificate.crt',
                               server_side=True)"""

# Imprima a mensagem de inicialização do servidor
print(f'Servidor rodando na porta {PORT} com SSL')

# Inicie o servidor
httpd.serve_forever()
