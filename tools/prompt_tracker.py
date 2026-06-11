#!/usr/bin/env python3
"""
Prompt History Tracker
Manages snapshots of code files before and after prompts
"""

import json
import os
from datetime import datetime
from pathlib import Path

# Repository root (parent of tools/)
REPO_ROOT = Path(__file__).resolve().parent.parent
HISTORY_FILE = REPO_ROOT / "data" / "prompt_history.json"
TRACKED_FILES = [
    "web/app.js",
    "web/index.html",
    "server.py",
    "web/styles.css",
    "web/storage.js",
    "web/task-manager.js",
    "web/task-manager.html",
    "web/task-manager.css",
    "tools/josm-helper.py",
]

# Old layout (flat repo root) -> current paths, for reverting legacy snapshots
LEGACY_TRACKED_PATHS = {
    "app.js": "web/app.js",
    "index.html": "web/index.html",
    "styles.css": "web/styles.css",
    "storage.js": "web/storage.js",
    "task-manager.js": "web/task-manager.js",
    "task-manager.html": "web/task-manager.html",
    "task-manager.css": "web/task-manager.css",
    "josm-helper.py": "tools/josm-helper.py",
    "prompt_tracker.py": "tools/prompt_tracker.py",
}

def read_file_content(rel_path):
    """Read file content relative to repo root; return None if missing."""
    filepath = REPO_ROOT / rel_path
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return None
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None

def get_all_file_snapshots():
    """Get current state of all tracked files"""
    snapshots = {}
    for rel_path in TRACKED_FILES:
        content = read_file_content(rel_path)
        if content is not None:
            snapshots[rel_path] = content
    return snapshots

def load_history():
    """Load prompt history from JSON file"""
    if HISTORY_FILE.exists():
        try:
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading history: {e}")
            return {"version": "1.0", "maxHistory": 10, "history": [], "currentPromptNumber": 0}
    return {"version": "1.0", "maxHistory": 10, "history": [], "currentPromptNumber": 0}

def save_history(history_data):
    """Save prompt history to JSON file"""
    try:
        HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history_data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving history: {e}")
        return False

def save_snapshot_before_prompt(prompt_text):
    """Save current state of files before a prompt"""
    history = load_history()
    
    # Get current file snapshots
    snapshots = get_all_file_snapshots()
    
    # Create new history entry
    history["currentPromptNumber"] += 1
    prompt_number = history["currentPromptNumber"]
    
    entry = {
        "promptNumber": prompt_number,
        "promptText": prompt_text,
        "timestamp": datetime.now().isoformat(),
        "filesBefore": snapshots,
        "filesAfter": None  # Will be filled after changes
    }
    
    # Add to history (keep only last maxHistory entries)
    history["history"].append(entry)
    if len(history["history"]) > history["maxHistory"]:
        history["history"] = history["history"][-history["maxHistory"]:]
    
    save_history(history)
    return prompt_number

def save_snapshot_after_prompt(prompt_number):
    """Save current state of files after a prompt"""
    history = load_history()
    
    # Find the entry
    entry = None
    for e in history["history"]:
        if e["promptNumber"] == prompt_number:
            entry = e
            break
    
    if not entry:
        print(f"Prompt #{prompt_number} not found in history")
        return False
    
    # Get current file snapshots
    snapshots = get_all_file_snapshots()
    entry["filesAfter"] = snapshots
    
    save_history(history)
    return True

def get_history_list():
    """Get list of all prompts in history"""
    history = load_history()
    return [
        {
            "number": e["promptNumber"],
            "text": e["promptText"],
            "timestamp": e["timestamp"]
        }
        for e in history["history"]
    ]

def revert_to_before_prompt(prompt_number):
    """Revert all files to state before a specific prompt"""
    history = load_history()
    
    # Find the entry
    entry = None
    for e in history["history"]:
        if e["promptNumber"] == prompt_number:
            entry = e
            break
    
    if not entry:
        print(f"Prompt #{prompt_number} not found in history")
        return False
    
    if not entry["filesBefore"]:
        print(f"No 'before' snapshot found for prompt #{prompt_number}")
        return False
    
    # Restore files
    restored_count = 0
    for rel_path, content in entry["filesBefore"].items():
        rel_path = LEGACY_TRACKED_PATHS.get(rel_path, rel_path)
        try:
            out = REPO_ROOT / rel_path
            out.parent.mkdir(parents=True, exist_ok=True)
            with open(out, 'w', encoding='utf-8') as f:
                f.write(content)
            restored_count += 1
            print(f"Restored: {rel_path}")
        except Exception as e:
            print(f"Error restoring {rel_path}: {e}")
    
    print(f"\nRestored {restored_count} files to state before prompt #{prompt_number}")
    return True

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python tools/prompt_tracker.py list                    - Show prompt history")
        print("  python tools/prompt_tracker.py revert <prompt_number>  - Revert to before prompt")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "list":
        history_list = get_history_list()
        if not history_list:
            print("No prompt history found.")
        else:
            print("\nPrompt History (most recent first):")
            print("=" * 60)
            for item in reversed(history_list):
                print(f"\nPrompt #{item['number']}")
                print(f"  Time: {item['timestamp']}")
                print(f"  Text: {item['text'][:100]}..." if len(item['text']) > 100 else f"  Text: {item['text']}")
            print("=" * 60)
    
    elif command == "revert":
        if len(sys.argv) < 3:
            print("Error: Please specify prompt number")
            print("Usage: python tools/prompt_tracker.py revert <prompt_number>")
            sys.exit(1)
        
        try:
            prompt_number = int(sys.argv[2])
            if revert_to_before_prompt(prompt_number):
                print("\n✅ Revert successful!")
            else:
                print("\n❌ Revert failed!")
        except ValueError:
            print("Error: Prompt number must be an integer")
            sys.exit(1)
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

