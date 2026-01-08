@echo off
echo "Starting backend server with Uvicorn..."
set PYTHONPATH=.
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000