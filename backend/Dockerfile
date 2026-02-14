FROM python:3.11-slim
WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependency files
COPY requirements.txt ./

# Install dependencies
RUN uv pip install -r requirements.txt --system

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]