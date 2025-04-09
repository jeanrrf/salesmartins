import os
import subprocess
import sys

def run_command(command):
    """Executa um comando e retorna o resultado"""
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        shell=True,
        universal_newlines=True
    )
    stdout, stderr = process.communicate()
    return stdout, stderr, process.returncode

def main():
    """Inicializa um novo repositório Git e prepara para push"""
    # Verificar se git já está inicializado
    _, _, rc = run_command("git rev-parse --is-inside-work-tree")
    
    if rc == 0:
        print("Repositório Git já está inicializado neste diretório.")
    else:
        print("Inicializando repositório Git...")
        stdout, stderr, rc = run_command("git init")
        if rc != 0:
            print(f"Erro ao inicializar Git: {stderr}")
            sys.exit(1)
        print(stdout)

    # Criar arquivo .gitignore se não existir
    if not os.path.exists('.gitignore'):
        print("Criando arquivo .gitignore...")
        with open('.gitignore', 'w') as f:
            f.write("""# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
*.egg-info/
.installed.cfg
*.egg

# Node
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log

# Ambiente
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Banco de dados
*.db
*.sqlite

# Outros
.DS_Store
.idea/
.vscode/
""")
        print(".gitignore criado com sucesso!")
    
    # Preparar primeiro commit se necessário
    stdout, _, _ = run_command("git status --porcelain")
    if stdout.strip():
        print("\nPara criar seu primeiro commit, execute:")
        print("git add .")
        print('git commit -m "Commit inicial"')

    print("\nPara adicionar um repositório remoto, execute:")
    print("git remote add origin <URL-DO-SEU-REPOSITORIO>")
    print("git push -u origin main")

if __name__ == "__main__":
    main()
