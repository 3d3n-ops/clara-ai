#!/bin/bash

# Wait for any required services (like database)
echo "Starting Clara Homework Server..."

# Set default environment variables if not set
export PYTHONPATH="${PYTHONPATH}:${PWD}"
export LOG_LEVEL="${LOG_LEVEL:-info}"
export MAX_FILE_SIZE="${MAX_FILE_SIZE:-10485760}"
export MAX_UPLOAD_FILES="${MAX_UPLOAD_FILES:-10}"
export RATE_LIMIT_MAX_REQUESTS="${RATE_LIMIT_MAX_REQUESTS:-100}"
export RATE_LIMIT_WINDOW_SECONDS="${RATE_LIMIT_WINDOW_SECONDS:-60}"

# Check if required environment variables are set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "Warning: OPENAI_API_KEY is not set"
fi

if [ -z "$PINECONE_API_KEY" ]; then
    echo "Warning: PINECONE_API_KEY is not set"
fi

if [ -z "$CLERK_SECRET_KEY" ]; then
    echo "Warning: CLERK_SECRET_KEY is not set"
fi

# Start the application
exec uvicorn homework_server_rag:app --host 0.0.0.0 --port $PORT --log-level $LOG_LEVEL