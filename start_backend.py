import subprocess
import time
import sys
import os

os.chdir(r"c:\Users\Noman Traders\Desktop\Todo web full Stack\backend")

print("Starting backend server...")
proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "src.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

print(f"Process PID: {proc.pid}")

# Let it start
time.sleep(5)

# Check if it's still running
poll = proc.poll()
if poll is None:
    print("✓ Backend server is running")
else:
    print(f"✗ Backend process exited with code {poll}")
    stdout, stderr = proc.communicate()
    print("STDOUT:", stdout)
    print("STDERR:", stderr)
