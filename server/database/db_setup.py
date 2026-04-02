import os
import sys
from pathlib import Path
from dotenv import load_dotenv


def _prefer_project_venv_site_packages() -> None:
	"""Prioritize local venv packages when script is run outside that venv.

	This prevents using an outdated global Prisma client package, which can
	cause schema mismatch errors during commands like `python3 seed_db.py`.
	"""
	if os.environ.get('VIRTUAL_ENV'):
		return

	server_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
	pyver = f"python{sys.version_info.major}.{sys.version_info.minor}"
	candidates = [
		os.path.join(server_root, 'venv', 'lib', pyver, 'site-packages'),
		os.path.join(server_root, 'venv', 'lib64', pyver, 'site-packages'),
	]

	for path in candidates:
		if os.path.isdir(path) and path not in sys.path:
			sys.path.insert(0, path)


_prefer_project_venv_site_packages()

from prisma import Prisma, register

# 1. Load the environment variables, preferring a repo-level `.env.local`
# (used for local development). Fall back to `server/.env` when not present.
# This must happen before Prisma() is instantiated.
repo_root = Path(__file__).parent.parent.parent
local_env = repo_root / ".env.local"
server_env = Path(__file__).parent.parent / ".env"
if local_env.exists():
    load_dotenv(dotenv_path=local_env)
else:
    load_dotenv(dotenv_path=server_env)

# 2. Create the single global database instance
db = Prisma()

# 3. Register the instance
# This allows you to use Prisma's static methods and internal helpers
register(db)
