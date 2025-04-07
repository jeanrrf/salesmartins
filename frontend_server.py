
import os
import sys
import http.server
import socketserver

# Import the custom handler from the main script
sys.path.insert(0, 'd:\\Users\\rosso\\SENTINNELL_GERADOR')
from run import CustomHTTPHandler

# Set the directory to serve files from
os.chdir('D:\\Users\\rosso\\SENTINNELL_GERADOR\\frontend')

# Create the server
handler = CustomHTTPHandler
handler.directory = 'D:\\Users\\rosso\\SENTINNELL_GERADOR\\frontend'
server = socketserver.TCPServer(("127.0.0.1", 8000), handler)

print(f"Serving at http://127.0.0.1:8000")
server.serve_forever()
