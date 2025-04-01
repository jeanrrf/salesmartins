#!/usr/bin/env python
"""
Auto Commit Helper - Ferramenta para automatizar commits de alterações no projeto

Este script verifica automaticamente por alterações no projeto e realiza commits
com mensagens descritivas baseadas nas mudanças detectadas.

Uso:
    python auto_commit.py [--check] [--commit] [--push]

Opções:
    --check      Apenas verifica alterações sem realizar commits
    --commit     Verifica e comita automaticamente alterações (padrão)
    --push       Verifica, comita e envia alterações para o repositório remoto
"""

import os
import sys
import subprocess
import datetime
import json
import re
from typing import List, Dict, Tuple, Optional

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(ROOT_DIR, "auto_commit_config.json")

# Configuração padrão
DEFAULT_CONFIG = {
    "project_name": "Shopee Analytics",
    "commit_prefix": "[AutoCommit] ",
    "skip_files": [
        "__pycache__",
        "*.pyc",
        ".git",
        "*.log",
        "*.db",
        ".DS_Store"
    ],
    "commit_threshold": 3,  # Número mínimo de alterações para agrupar em um commit
    "patterns": {
        "feature": r"(feat|feature|add|implement|new):",
        "fix": r"(fix|bug|issue|error|resolve):",
        "docs": r"(doc|documentation|comment):",
        "refactor": r"(refactor|refact|improve|clean):",
        "style": r"(style|format|indent):",
        "test": r"(test|spec|check):",
        "chore": r"(chore|build|ci|tool):"
    }
}

def load_config() -> Dict:
    """Carrega ou cria a configuração do auto commit."""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                config = json.load(f)
                return {**DEFAULT_CONFIG, **config}
        except Exception as e:
            print(f"Erro ao carregar configuração: {e}")
    
    # Se o arquivo não existe, cria com config padrão
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(DEFAULT_CONFIG, f, indent=4)
    
    return DEFAULT_CONFIG

def run_command(command: List[str]) -> Tuple[str, str, int]:
    """Executa um comando e retorna stdout, stderr e código de saída."""
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True
    )
    stdout, stderr = process.communicate()
    return stdout.strip(), stderr.strip(), process.returncode

def git_status() -> List[Dict]:
    """Obtém o status atual do git."""
    stdout, stderr, rc = run_command(["git", "status", "--porcelain"])
    
    if rc != 0:
        print(f"Erro ao verificar status do git: {stderr}")
        return []
    
    changes = []
    for line in stdout.splitlines():
        if not line.strip():
            continue
            
        status = line[:2].strip()
        file_path = line[3:].strip()
        
        # Ignora arquivos baseados na configuração
        skip = False
        for pattern in load_config()["skip_files"]:
            if pattern.startswith("*"):
                if file_path.endswith(pattern[1:]):
                    skip = True
                    break
            elif pattern in file_path:
                skip = True
                break
                
        if not skip:
            changes.append({
                "status": status,
                "path": file_path
            })
    
    return changes

def analyze_changes(changes: List[Dict]) -> Dict:
    """Analisa as alterações para criar mensagem de commit."""
    analysis = {
        "added_files": [],
        "modified_files": [],
        "deleted_files": [],
        "categories": {
            "feature": [],
            "fix": [],
            "docs": [],
            "refactor": [],
            "style": [],
            "test": [],
            "chore": []
        },
        "file_types": {}
    }
    
    for change in changes:
        path = change["path"]
        status = change["status"]
        
        # Tipo de arquivo
        file_ext = os.path.splitext(path)[1]
        if file_ext:
            if file_ext not in analysis["file_types"]:
                analysis["file_types"][file_ext] = 0
            analysis["file_types"][file_ext] += 1
        
        # Status do arquivo
        if status == "A":
            analysis["added_files"].append(path)
        elif status == "M" or status == "AM":
            analysis["modified_files"].append(path)
        elif status == "D":
            analysis["deleted_files"].append(path)
        elif status in ["R", "C"]:
            # Renamed or copied
            analysis["modified_files"].append(path)
        
        # Tenta determinar a categoria com base no caminho
        for category, pattern in load_config()["patterns"].items():
            if re.search(pattern, path, re.IGNORECASE):
                analysis["categories"][category].append(path)
                break
    
    return analysis

def generate_commit_message(analysis: Dict) -> str:
    """Gera uma mensagem de commit com base na análise de mudanças."""
    config = load_config()
    prefix = config["commit_prefix"]
    
    # Determine main category
    main_category = "chore"
    max_count = 0
    for category, files in analysis["categories"].items():
        if len(files) > max_count:
            max_count = len(files)
            main_category = category
    
    # Cria a mensagem principal
    if analysis["added_files"] and not analysis["modified_files"] and not analysis["deleted_files"]:
        msg = f"{prefix}Adicionar {len(analysis['added_files'])} arquivos"
    elif analysis["modified_files"] and not analysis["added_files"] and not analysis["deleted_files"]:
        msg = f"{prefix}Atualizar {len(analysis['modified_files'])} arquivos"
    elif analysis["deleted_files"] and not analysis["added_files"] and not analysis["modified_files"]:
        msg = f"{prefix}Remover {len(analysis['deleted_files'])} arquivos"
    else:
        total = len(analysis["added_files"]) + len(analysis["modified_files"]) + len(analysis["deleted_files"])
        msg = f"{prefix}{main_category.capitalize()}: Alterar {total} arquivos"
    
    # Adicionar detalhes
    details = []
    if analysis["added_files"]:
        file_str = ", ".join(analysis["added_files"][:3])
        if len(analysis["added_files"]) > 3:
            file_str += f" e mais {len(analysis['added_files']) - 3} arquivos"
        details.append(f"Adicionar {file_str}")
    
    if analysis["modified_files"]:
        file_str = ", ".join(analysis["modified_files"][:3])
        if len(analysis["modified_files"]) > 3:
            file_str += f" e mais {len(analysis['modified_files']) - 3} arquivos"
        details.append(f"Modificar {file_str}")
    
    if analysis["deleted_files"]:
        file_str = ", ".join(analysis["deleted_files"][:3])
        if len(analysis["deleted_files"]) > 3:
            file_str += f" e mais {len(analysis['deleted_files']) - 3} arquivos"
        details.append(f"Remover {file_str}")
    
    if details:
        msg += "\n\n" + "\n".join(details)
    
    msg += f"\n\nGerado por Auto Commit em {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    
    return msg

def stage_all_changes() -> bool:
    """Adiciona todas as mudanças para commit."""
    stdout, stderr, rc = run_command(["git", "add", "."])
    
    if rc != 0:
        print(f"Erro ao adicionar alterações: {stderr}")
        return False
        
    return True

def create_commit(message: str) -> bool:
    """Cria um commit com a mensagem especificada."""
    stdout, stderr, rc = run_command(["git", "commit", "-m", message])
    
    if rc != 0:
        print(f"Erro ao criar commit: {stderr}")
        return False
        
    print(f"Commit criado com sucesso: {stdout}")
    return True

def push_changes() -> bool:
    """Envia alterações para o repositório remoto."""
    branch_stdout, branch_stderr, branch_rc = run_command(["git", "branch", "--show-current"])
    
    if branch_rc != 0:
        print(f"Erro ao obter branch atual: {branch_stderr}")
        return False
        
    current_branch = branch_stdout.strip()
    stdout, stderr, rc = run_command(["git", "push", "origin", current_branch])
    
    if rc != 0:
        print(f"Erro ao enviar alterações: {stderr}")
        return False
        
    print(f"Alterações enviadas com sucesso para {current_branch}")
    return True

def main() -> None:
    """Função principal."""
    if len(sys.argv) > 1 and "--help" in sys.argv:
        print(__doc__)
        sys.exit(0)
    
    # Verifica se estamos em um repositório git
    stdout, stderr, rc = run_command(["git", "rev-parse", "--is-inside-work-tree"])
    
    if rc != 0:
        print("Error: Este diretório não é um repositório git válido.")
        sys.exit(1)
    
    # Verifica alterações
    changes = git_status()
    
    if not changes:
        print("Não há alterações para comitar.")
        sys.exit(0)
    
    print(f"Detectadas {len(changes)} alterações.")
    
    # Apenas verifica?
    if len(sys.argv) > 1 and "--check" in sys.argv:
        for change in changes:
            print(f"{change['status']} {change['path']}")
        sys.exit(0)
    
    # Analisa as alterações
    analysis = analyze_changes(changes)
    
    # Gera mensagem de commit
    commit_message = generate_commit_message(analysis)
    print("\nMensagem de commit gerada:")
    print("-" * 40)
    print(commit_message)
    print("-" * 40)
    
    # Comita alterações?
    if len(sys.argv) <= 1 or "--commit" in sys.argv or "--push" in sys.argv:
        print("\nAdicionando alterações...")
        if not stage_all_changes():
            sys.exit(1)
            
        print("\nCriando commit...")
        if not create_commit(commit_message):
            sys.exit(1)
    
    # Envia alterações?
    if len(sys.argv) > 1 and "--push" in sys.argv:
        print("\nEnviando alterações...")
        if not push_changes():
            sys.exit(1)
    
    print("\nConcluído com sucesso!")

if __name__ == "__main__":
    main()