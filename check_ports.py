import socket

def check_port(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

print("Checking ports on 127.0.0.1:")
for p in [3306, 3307, 33060, 33061]:
    if check_port(p):
        print(f"Port {p} is OPEN")
    else:
        print(f"Port {p} is CLOSED")
