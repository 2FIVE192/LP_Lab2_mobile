import http.server
import socketserver
import webbrowser
import os

PORT = 8000

# Кастомный обработчик с CORS заголовками
class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Добавляем заголовки CORS для PWA
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

# Получаем текущую директорию
web_dir = os.path.join(os.path.dirname(__file__))
os.chdir(web_dir)

# Запускаем сервер с нашим обработчиком
with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
    print(f"PWA сервер запущен на http://localhost:{PORT}")
    print(f"Директория: {web_dir}")
    print("Открываю браузер...")
    print("=" * 50)
    
    # Автоматическое открытие браузера по умолчанию
    webbrowser.open(f'http://localhost:{PORT}')
    
    print("Приложение готово!")
    print("PWA можно установить через:")
    print("   • Chrome: значок установки в адресной строке")
    print("   • Edge: меню '...' → 'Приложения' → 'Установить'")
    print("\nДля остановки: Ctrl+C\n")
    print("=" * 50)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nСервер остановлен")