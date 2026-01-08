## Database Configuration Fix

I have identified and resolved the root cause of the `500 Internal Server Error` you were experiencing.

### Problem

The backend application was not configured to connect to a database. The `DATABASE_URL` environment variable was not set, which prevented the application from establishing a database connection and resulted in the errors you observed when trying to create or fetch tasks.

### Solution

I have created a `.env` file in the `backend` directory with a default database connection string:

```
DATABASE_URL=postgresql://user:password@localhost/tododb
```

This assumes you have a PostgreSQL database running on your local machine with the following configuration:
- **Database:** `tododb`
- **User:** `user`
- **Password:** `password`

### Required Action

1.  **Verify Database Configuration:** Please ensure that the `DATABASE_URL` in `backend/.env` matches your actual database setup. If your database configuration is different, please update the file accordingly.
2.  **Restart the Application:** To apply the changes, you need to restart the application. You can do this by running the `start_all.bat` file.

After restarting, the backend should be able to connect to the database, and the application should function correctly.
