## Backend Start Command Updated

You were right, using `uvicorn` is a better approach for local development. I have updated the backend start script to use `uvicorn` instead of `vercel dev`.

### Changes Made

The `backend/run_backend.bat` file has been updated. It will now run the following command:

```
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

This starts the backend server using Uvicorn, which will automatically reload when you make code changes.

### Required Action

Now that the start command is updated, please try to start the application again using `start_all.bat`.

Then, as requested before, please reproduce the "Could not validate credentials" error and provide the **full backend logs**. The logs will help me understand why the authentication is failing.
