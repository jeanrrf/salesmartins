import os
import subprocess
import sys
import json
import webbrowser
from datetime import datetime

def run_command(command):
    """Executa um comando e retorna o resultado"""
    print(f"Executando: {command}")
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        shell=True,
        universal_newlines=True
    )
    stdout, stderr = process.communicate()
    return stdout, stderr, process.returncode

def check_vercel_cli():
    """Verifica se o CLI do Vercel está instalado"""
    stdout, stderr, rc = run_command("vercel --version")
    if rc != 0:
        print("Vercel CLI não encontrado. Instalando...")
        run_command("npm install -g vercel")
        stdout, stderr, rc = run_command("vercel --version")
        if rc != 0:
            print("Falha ao instalar Vercel CLI. Por favor, instale manualmente:")
            print("npm install -g vercel")
            sys.exit(1)
    print(f"Vercel CLI: {stdout.strip()}")

def login_to_vercel():
    """Faz login no Vercel se necessário"""
    stdout, stderr, rc = run_command("vercel whoami")
    if rc != 0:
        print("Não logado no Vercel. Iniciando processo de login...")
        stdout, stderr, rc = run_command("vercel login")
        if rc != 0:
            print(f"Erro ao fazer login: {stderr}")
            sys.exit(1)
        print("Login realizado com sucesso!")
    else:
        print(f"Logado como: {stdout.strip()}")

def prepare_env_for_vercel():
    """Prepara as variáveis de ambiente para o Vercel"""
    env_path = ".env"
    if os.path.exists(env_path):
        print("Encontrado arquivo .env. Preparando para o Vercel...")
        with open(env_path, "r") as f:
            env_content = f.readlines()
        
        # Criar um arquivo .env.vercel para uso com o comando vercel env
        with open(".env.vercel", "w") as f:
            for line in env_content:
                line = line.strip()
                if line and not line.startswith("#"):
                    key_value = line.split("=", 1)
                    if len(key_value) == 2:
                        key = key_value[0].strip()
                        value = key_value[1].strip().strip('"').strip("'")
                        f.write(f"{key}={value}\n")
        
        print("Arquivo .env.vercel criado para importação.")
    else:
        print("Arquivo .env não encontrado. As variáveis de ambiente precisarão ser configuradas manualmente.")

def deploy_to_vercel():
    """Implanta o projeto no Vercel"""
    # Preparar variáveis de ambiente
    prepare_env_for_vercel()
    
    # Verificar se já existe um projeto vinculado
    stdout, stderr, rc = run_command("vercel inspect")
    is_new_project = rc != 0
    
    if is_new_project:
        print("Criando novo projeto Vercel...")
        deploy_cmd = "vercel --confirm"
    else:
        print("Atualizando projeto existente...")
        deploy_cmd = "vercel --prod"
    
    # Executar o deploy
    stdout, stderr, rc = run_command(deploy_cmd)
    
    if rc != 0:
        print(f"Erro durante o deploy: {stderr}")
        sys.exit(1)
    
    # Tentar extrair a URL do projeto
    deployment_url = None
    for line in stdout.split('\n'):
        if "https://" in line:
            deployment_url = line.strip()
            break
    
    if deployment_url:
        print(f"\nSeu projeto foi publicado em: {deployment_url}")
        print("Abrindo no navegador...")
        webbrowser.open(deployment_url)
    else:
        print("\nDeploy concluído, mas não foi possível extrair a URL.")
        print("Verifique seu dashboard no Vercel para acessar o projeto.")

def main():
    """Função principal para publicar no Vercel"""
    print("=== Publicação para Vercel ===")
    print(f"Data e hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("Diretório atual:", os.getcwd())
    
    # Verificar requisitos
    check_vercel_cli()
    login_to_vercel()
    
    # Deploy
    print("\nPronto para iniciar o deploy!")
    user_confirm = input("Continuar com o deploy? (y/n): ").lower().strip()
    if user_confirm == 'y':
        deploy_to_vercel()
    else:
        print("Deploy cancelado pelo usuário.")

if __name__ == "__main__":
    main()
