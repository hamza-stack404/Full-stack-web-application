---
id: 015
title: Fixing Backend Errors and Restarting Server
stage: general
date_iso: 2026-01-05
surface: agent
model: gemini-1.5-pro
feature: none
branch: main
user: 
command: 
labels: ["backend", "error_fix", "restart"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files_yaml:
  - backend/requirements.txt
  - backend/src/schemas.py
tests_yaml:
  - 
prompt_text: |
  thhere is error coming in the backend 
  config keys have changed in V2:
  * 'orm_mode' has been renamed to 'from_attributes'
    warnings.warn(message, UserWarning)
  Process SpawnProcess-1:
  Traceback (most recent call last):
    File "C:\Users\Noman Traders\AppData\Local\Programs\Python\Python314\Lib\multiprocessing\process.py", line 320, in _bootstrap
      self.run()
      ~~~~~~~~^^
    File "C:\Users\Noman Traders\AppData\Local\Programs\Python\Python314\Lib\multiprocessing\process.py", line 108, in run
      self._target(*self._args, **self._kwargs)
      ~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    File "C:\Users\Noman Traders\AppData\Local\Programs\Python\Python314\Lib\site-packages\uvicorn\_subprocess.py", line 80, in subprocess_started
      target(sockets=sockets)
      ~~~~~~^^^^^^^^^^^^^^^^^
    File "C:\Users\Noman Traders\AppData\Local\Programs\Python\Python314\Lib\site-packages\uvicorn\server.py", line 67, in run
      return asyncio_run(self.serve(sockets=sockets), loop_factory=self.config.get_loop_factory())
    File "C:\Users\Noman Traders\AppData\Local\Programs\Python\Python314\Lib\asyncio\runners.py", line 204, in run
      return runner.run(main)
             ~~~~~~~~~^^^^^^^
    File "C:\Users\Noman Traders\AppData\Local\Programs\Python\Python314\Lib\asyncio\runners.py", line 127, in run
      return self._loop.run_until_complete(task)
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^
    File "C:\Users\Noman Traders\AppData\Local\Programs\Python\Python314\Lib\asyncio\base_events.py", line 719, in run_until_complete
      return future.result()
             ~~~~~~~~~~~~~^^^^
    File "C:\Users\Noman Traders\AppData\Local\Programs\Python\Python314\Lib\site-packages\uvicorn\server.py", line 71, in serve
      await self._serve(sockets)
    File "C:\Users\Noman Traders\AppData\Local\Programs\Python\Python314\Lib\site-packages\uvicorn\server.py", line 78, in _serve
      config.load()
      ~~~~~~~~~~~^^
    File "C:\Users\Noman Traders\AppData\Local\Programs\Python\Python314\Lib\site-packages\uvicorn\config.py", line 439, in load
      self.loaded_app = import_from_string(self.app)
                        ~~~~~~~~~~~~~~~~~~^^^^^^^^^^
    File "C:\Users\Noman Traders\AppData\Local\Programs\Python\Python314\Lib\site-packages\uvicorn\importer.py", line 22, in import_from_string
      raise exc from None
    File "C:\Users\Noman Traders\AppData\Local\Programs\Python\Python314\Lib\site-packages\uvicorn\importer.py", line 19, in import_from_string
      module = importlib.import_module(module_str)
    File "C:\Users\Noman Traders\AppData\Local\Programs\Python\Python314\Lib\importlib\__init__.py", line 88, in import_module
      return _bootstrap._gcd_import(name[level:], package, level)
             ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    File "<frozen importlib._bootstrap>", line 1398, in _gcd_import
    File "<frozen importlib._bootstrap>", line 1371, in _find_and_load
    File "<frozen importlib._bootstrap>", line 1342, in _find_and_load_unlocked
    File "<frozen importlib._bootstrap>", line 938, in _load_unlocked
    File "<frozen importlib._bootstrap_external>", line 759, in exec_module
    File "<frozen importlib._bootstrap>", line 491, in _call_with_frames_removed
    File "C:\Users\Noman Traders\Desktop\Todo web full Stack\backend\src\main.py", line 4, in <module>
      from .api import auth, tasks
    File "C:\Users\Noman Traders\Desktop\Todo web full Stack\backend\src\api\auth.py", line 5, in <module>
      from ..database import engine
    File "C:\Users\Noman Traders\Desktop\Todo web full Stack\backend\src\database.py", line 3, in <module>
      from dotenv import load_dotenv
  ModuleNotFoundError: No module named 'dotenv'
