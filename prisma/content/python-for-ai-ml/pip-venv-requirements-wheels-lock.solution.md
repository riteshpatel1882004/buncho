- **Virtual environment:** an isolated Python environment with its own packages.
- **pip:** the Python package installer.
- **`requirements.txt`:** a list of dependencies (optionally pinned versions).
- **Wheel (`.whl`):** a built, ready-to-install distribution (faster than building from source).
- **Lock file:** records the **exact resolved versions** (including transitive dependencies) for reproducible installs (`poetry.lock`, `uv.lock`, `pip-compile` output).

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip freeze > requirements.lock.txt
```
