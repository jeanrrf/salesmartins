#!/usr/bin/env python
"""
Watch and Commit - Monitor de alterações para commits automáticos

Este script monitora alterações nos arquivos do projeto e executa
automaticamente o script auto_commit.py quando detecta mudanças.

Uso:
    python watch_and_commit.py [--interval=300] [--push]

Opções:
    --interval=N    Intervalo em segundos entre verificações (padrão: 300 segundos)
    --push          Ativa o envio automático para o repositório remoto após commit
"""

import os
import sys
import time
import argparse
import subprocess
import datetime
from typing import Set

def parse_args():
    """Analisa os argumentos da linha de comando."""
    parser = argparse.ArgumentParser(
        description="Monitora alterações e faz commits automaticamente"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=300,
        help="Intervalo de verificação em segundos (padrão: 300)"
    )
    parser.add_argument(
        "--push",
        action="store_true",
        help="Enviar alterações para o repositório remoto após commit"
    )
    return parser.parse_args()

def get_file_signatures() -> dict:
    """Obtém assinaturas de todos os arquivos no projeto."""
    signatures = {}
    root_dir = os.path.dirname(os.path.abspath(__file__))
    
    for root, dirs, files in os.walk(root_dir):
        # Ignorar diretórios específicos
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__' and d != '.git']
        
        for file in files:
            if file.endswith(('.py', '.js', '.html', '.css', '.md', '.json')):
                file_path = os.path.join(root, file)
                try:
                    mtime = os.path.getmtime(file_path)
                    signatures[file_path] = mtime
                except OSError:
                    pass
                    
    return signatures

def run_auto_commit(push: bool = False):
    """Executa o script de auto_commit."""
    auto_commit_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "auto_commit.py")
    
    if not os.path.exists(auto_commit_path):
        print(f"Erro: Script auto_commit.py não encontrado em {auto_commit_path}")
        return False
    
    cmd = [sys.executable, auto_commit_path]
    if push:
        cmd.append("--push")
    
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        stdout, stderr = process.communicate()
        
        print(stdout)
        if stderr:
            print(f"Erros: {stderr}", file=sys.stderr)
            
        return process.returncode == 0
    except Exception as e:
        print(f"Erro ao executar auto_commit.py: {e}")
        return False

def main():
    """Função principal que monitora alterações e executa commits."""
    args = parse_args()
    interval = args.interval
    push = args.push
    
    print(f"Iniciando monitoramento de alterações (intervalo: {interval}s)")
    print("Pressione Ctrl+C para interromper")
    
    if push:
        print("Modo push ativado: alterações serão enviadas ao repositório remoto")
    
    try:
        last_signatures = get_file_signatures()
        last_commit_time = time.time()
        
        while True:
            time.sleep(interval)
            current_time = time.time()
            current_signatures = get_file_signatures()
            
            # Verifica se houve alterações
            changed_files = []
            for file_path, signature in current_signatures.items():
                if file_path not in last_signatures:
                    changed_files.append(("Adicionado", file_path))
                elif last_signatures[file_path] != signature:
                    changed_files.append(("Modificado", file_path))
            
            for file_path in last_signatures:
                if file_path not in current_signatures:
                    changed_files.append(("Removido", file_path))
            
            if changed_files:
                print(f"\n[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Detectadas alterações:")
                for change_type, file_path in changed_files[:5]:
                    rel_path = os.path.relpath(file_path, os.path.dirname(os.path.abspath(__file__)))
                    print(f"  {change_type}: {rel_path}")
                
                if len(changed_files) > 5:
                    print(f"  ... e mais {len(changed_files) - 5} arquivos alterados")
                
                # Verifica se passou tempo suficiente desde o último commit
                time_since_last_commit = current_time - last_commit_time
                if time_since_last_commit >= interval:
                    print("\nExecutando auto commit...")
                    success = run_auto_commit(push=push)
                    if success:
                        print("Commit automático realizado com sucesso")
                        last_commit_time = current_time
                    else:
                        print("Falha ao realizar commit automático")
                else:
                    print(f"\nAguardando intervalo mínimo para próximo commit... ({int(interval - time_since_last_commit)}s restantes)")
            
            # Atualiza assinaturas para próxima verificação
            last_signatures = current_signatures
            
    except KeyboardInterrupt:
        print("\nMonitoramento interrompido pelo usuário")
        sys.exit(0)
    except Exception as e:
        print(f"\nErro inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()