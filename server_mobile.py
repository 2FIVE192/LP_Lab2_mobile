import http.server
import socketserver
import socket
import ssl
import os
import sys

PORT = 8000

def get_local_ip():
    """Получаем локальный IP адрес"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

class PWAHandler(http.server.SimpleHTTPRequestHandler):
    """Специальный обработчик для PWA"""
    
    def guess_type(self, path):
        """Определяем MIME-типы для PWA файлов"""
        if path.endswith('.js'):
            return 'application/javascript'
        elif path.endswith('.css'):
            return 'text/css'
        elif path.endswith('.json'):
            return 'application/json'
        elif path.endswith('.png'):
            return 'image/png'
        elif path.endswith('.ico'):
            return 'image/x-icon'
        elif path.endswith('.webmanifest'):
            return 'application/manifest+json'
        return super().guess_type(path)
    
    def end_headers(self):
        """Добавляем заголовки для PWA"""
        self.send_header('Service-Worker-Allowed', '/')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Проверка существования обязательных файлов
    required_files = ['index.html', 'manifest.json', 'app.js', 'styles.css']
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        print(f" Отсутствуют файлы: {missing_files}")
        return
    
    local_ip = get_local_ip()
    
    print("=" * 70)
    print("PWA МЕНЕДЖЕР ПАРОЛЕЙ - МОБИЛЬНЫЙ ТЕСТ")
    print("=" * 70)
    print(f"Папка: {os.getcwd()}")
    print(f"Локальный: http://localhost:{PORT}")
    print(f"Для телефона: http://{local_ip}:{PORT}")
    print("=" * 70)
    print("ИНСТРУКЦИЯ ДЛЯ РАЗНЫХ БРАУЗЕРОВ:")
    print("")
    print("📱 CHROME (Android):")
    print("1. Откройте адрес выше на телефоне")
    print("2. В меню (⋮) выберите 'Установить приложение'")
    print("")
    print("SAFARI (iOS):")
    print("1. Откройте сайт")
    print("2. Нажмите 'Поделиться' (квадрат со стрелкой)")
    print("3. Прокрутите вниз, выберите 'На экран «Домой»'")
    print("")
    print("FIREFOX (Android):")
    print("1. Откройте сайт")
    print("2. В меню выберите 'Установить'")
    print("=" * 70)
    print("🔧 ДИАГНОСТИКА:")
    print("- Проверьте, что телефон в той же Wi-Fi сети")
    print("- Отключите firewall или разрешите порт 8000")
    print("- Перезагрузите телефон")
    print("=" * 70)
    
    try:
        # Запуск сервера
        with socketserver.TCPServer(("0.0.0.0", PORT), PWAHandler) as httpd:
            print(f"Сервер запущен на порту {PORT}")
            print(" Ctrl+C для остановки")
            print("=" * 70)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nСервер остановлен")
    except Exception as e:
        print(f"\nОшибка: {e}")
        print("Попробуйте изменить порт (например, на 8080)")

if __name__ == "__main__":
    main()