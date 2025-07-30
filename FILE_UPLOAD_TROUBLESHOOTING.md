# File Upload Troubleshooting Guide

## Current Issue

**Error**: `POST /api/homework/upload 500 (Internal Server Error)`
**Backend Error**: `POST /homework/upload-rag HTTP/1.1" 500 Internal Server Error`

## Root Cause Analysis

The issue appears to be in the file processing pipeline, specifically when trying to upload a PDF file (`diff eq.pdf`). The error occurs in the backend during the RAG engine processing.

## Enhanced Debugging

I've added comprehensive logging to help identify the exact failure point:

### 1. Frontend Logging (Upload API)
- File details (name, size, type)
- Content length after reading
- Backend URL being used
- Detailed error responses

### 2. Backend Logging (Upload Endpoint)
- Request details (user, file, folder)
- File content length
- RAG engine call results
- Detailed error tracebacks

### 3. RAG Engine Logging
- Step-by-step processing progress
- File type detection
- Content extraction details
- PDF processing specifics
- Pinecone operations

## Testing Steps

### Step 1: Test with Enhanced Logging
1. Try uploading the same PDF file again
2. Check the browser console for detailed frontend logs
3. Check the backend logs for detailed error information

### Step 2: Test Different File Types
Try uploading different file types to isolate the issue:
- Text file (.txt)
- Word document (.docx)
- Different PDF file
- Image file (.png, .jpg)

### Step 3: Test Backend Directly
Test the backend upload endpoint directly:

```bash
# Create a test file
echo "This is a test file content" > test.txt

# Test the upload endpoint
curl -X POST http://localhost:8000/homework/upload-rag \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.txt",
    "content": "This is a test file content",
    "user_id": "test_user_123",
    "folder_id": null
  }'
```

## Common Issues and Solutions

### 1. PDF Processing Issues
**Symptoms**: Error during PDF content extraction
**Possible Causes**:
- Missing PyPDF2 dependency
- Corrupted PDF file
- PDF with password protection
- PDF with non-standard encoding

**Solutions**:
- Check if PyPDF2 is installed: `pip install PyPDF2`
- Try with a different PDF file
- Check if the PDF is password protected
- Verify the PDF is not corrupted

### 2. Pinecone Connection Issues
**Symptoms**: Error during Pinecone operations
**Possible Causes**:
- Missing Pinecone API key
- Invalid Pinecone environment
- Network connectivity issues
- Rate limiting

**Solutions**:
- Verify `PINECONE_API_KEY` is set
- Check `PINECONE_ENVIRONMENT` is correct
- Test Pinecone connectivity
- Check for rate limiting

### 3. OpenAI API Issues
**Symptoms**: Error during embedding generation
**Possible Causes**:
- Missing OpenAI API key
- Invalid API key
- Rate limiting
- Network issues

**Solutions**:
- Verify `OPENAI_API_KEY` is set
- Check API key validity
- Monitor OpenAI usage/limits
- Test API connectivity

### 4. File Content Issues
**Symptoms**: "No content extracted from file" error
**Possible Causes**:
- Empty file
- Unsupported file format
- Encoding issues
- File corruption

**Solutions**:
- Check file is not empty
- Verify file format is supported
- Try with a different file
- Check file encoding

## Environment Variables Checklist

Ensure these are set in your backend environment:

```env
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_pinecone_index_name
PINECONE_ENVIRONMENT=your_pinecone_environment
```

## Debugging Commands

### Check Backend Health
```bash
curl http://localhost:8000/health
```

### Test File Upload Directly
```bash
curl -X POST http://localhost:8000/homework/upload-rag \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.txt",
    "content": "Test content",
    "user_id": "test_user",
    "folder_id": null
  }'
```

### Check Dependencies
```bash
pip list | grep -E "(PyPDF2|openai|pinecone|python-docx|Pillow|pytesseract)"
```

## Expected Log Output

With the enhanced logging, you should see output like this:

```
[Upload API] Processing upload for user user_30OZbzFZNjd4DFTRFYa3JePmmqQ
[Upload API] File details: name=diff eq.pdf, size=123456, type=application/pdf
[Backend] Processing upload request for user: user_30OZbzFZNjd4DFTRFYa3JePmmqQ, file: diff eq.pdf
[RAG Engine] Initializing for file processing...
[RAG Engine] Detected file type: pdf
[RAG Engine] Processing PDF file: /tmp/temp_file.txt
[RAG Engine] PDF has 5 pages
[RAG Engine] Page 1: 1234 characters
...
```

## Next Steps

1. **Immediate**: Try uploading the file again with enhanced logging
2. **Short-term**: Check backend logs for specific error messages
3. **Long-term**: Implement better error handling and user feedback

## Monitoring

After implementing the fixes, monitor:
1. **Upload Success Rate**: Track successful vs failed uploads
2. **Error Patterns**: Identify common failure points
3. **Performance**: Monitor upload processing times
4. **User Feedback**: Check for user-reported issues

## Files Modified for Enhanced Debugging

1. `app/api/homework/upload/route.ts` - Added detailed frontend logging
2. `backend/backend_server.py` - Enhanced backend upload logging
3. `backend/rag_engine.py` - Added step-by-step RAG engine logging
4. `FILE_UPLOAD_TROUBLESHOOTING.md` - Created this guide 