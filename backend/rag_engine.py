import os
import hashlib
import json
import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import asyncio
from dataclasses import dataclass
import re

import openai
from pinecone import Pinecone
from dotenv import load_dotenv
import tiktoken
from PyPDF2 import PdfReader
import docx
from PIL import Image
import pytesseract

load_dotenv()

@dataclass
class Chunk:
    id: str
    content: str
    metadata: Dict[str, Any]
    embedding: Optional[List[float]] = None

@dataclass
class SearchResult:
    chunk_id: str
    content: str
    metadata: Dict[str, Any]
    score: float
    source_file: str

class RAGEngine:
    def __init__(self):
        # Initialize OpenAI client
        self.openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Initialize Pinecone
        self.pinecone = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
        self.index_name = os.getenv('PINECONE_INDEX_NAME', 'clara-ai-embeddings')
        
        # Initialize tokenizer for chunking
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        
        # Don't ensure index during sync init - will be done async
        self._initialized = False
    
    async def initialize(self):
        """Async initialization to prevent blocking"""
        if not self._initialized:
            try:
                # Add timeout to prevent hanging
                await asyncio.wait_for(self._ensure_pinecone_index_async(), timeout=10.0)
                self._initialized = True
            except asyncio.TimeoutError:
                print("Warning: RAG engine initialization timed out, continuing without Pinecone index verification")
                self._initialized = True
            except Exception as e:
                print(f"Error during RAG engine initialization: {e}")
                # Continue anyway to prevent blocking the voice agent
                self._initialized = True
    
    async def _ensure_pinecone_index_async(self):
        """Ensure the Pinecone index exists with proper configuration - async version"""
        try:
            # Check if index exists
            existing_indexes = [index.name for index in self.pinecone.list_indexes()]
            
            if self.index_name not in existing_indexes:
                # Create new index
                self.pinecone.create_index(
                    name=self.index_name,
                    dimension=1536,  # OpenAI text-embedding-3-small dimension
                    metric='cosine'
                )
                print(f"Created Pinecone index: {self.index_name}")
            else:
                print(f"Using existing Pinecone index: {self.index_name}")
                
        except Exception as e:
            print(f"Error ensuring Pinecone index: {e}")
    
    def _ensure_pinecone_index(self):
        """Synchronous version for backward compatibility"""
        try:
            # Check if index exists
            existing_indexes = [index.name for index in self.pinecone.list_indexes()]
            
            if self.index_name not in existing_indexes:
                # Create new index
                self.pinecone.create_index(
                    name=self.index_name,
                    dimension=1536,  # OpenAI text-embedding-3-small dimension
                    metric='cosine'
                )
                print(f"Created Pinecone index: {self.index_name}")
            else:
                print(f"Using existing Pinecone index: {self.index_name}")
                
        except Exception as e:
            print(f"Error ensuring Pinecone index: {e}")
    
    def _get_file_type_from_filename(self, filename: str) -> str:
        """Determine file type from filename extension"""
        filename_lower = filename.lower()
        if filename_lower.endswith('.pdf'):
            return 'pdf'
        elif filename_lower.endswith('.docx'):
            return 'docx'
        elif filename_lower.endswith('.doc'):
            return 'doc'
        elif filename_lower.endswith('.txt'):
            return 'txt'
        elif filename_lower.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
            return 'image'
        else:
            return 'txt'  # Default to text for unknown types

    def _get_file_content(self, file_path: str, file_type: str) -> str:
        """Extract text content from various file types"""
        try:
            print(f"[RAG Engine] Extracting content from {file_path} (type: {file_type})")
            
            if file_type == 'txt' or file_path.endswith('.txt'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    print(f"[RAG Engine] Extracted {len(content)} characters from text file")
                    return content
            
            elif file_type == 'pdf' or file_path.endswith('.pdf'):
                print(f"[RAG Engine] Processing PDF file: {file_path}")
                try:
                    reader = PdfReader(file_path)
                    print(f"[RAG Engine] PDF has {len(reader.pages)} pages")
                    text = ""
                    for i, page in enumerate(reader.pages):
                        page_text = page.extract_text()
                        text += page_text + "\n"
                        print(f"[RAG Engine] Page {i+1}: {len(page_text)} characters")
                    print(f"[RAG Engine] Extracted {len(text)} total characters from PDF file")
                    return text
                except Exception as pdf_error:
                    print(f"[RAG Engine] PDF processing error: {pdf_error}")
                    import traceback
                    print(f"[RAG Engine] PDF error traceback: {traceback.format_exc()}")
                    return f"Error reading PDF: {str(pdf_error)}"
            
            elif file_type in ['docx', 'doc'] or file_path.endswith(('.docx', '.doc')):
                print(f"[RAG Engine] Processing Word document: {file_path}")
                try:
                    doc = docx.Document(file_path)
                    text = ""
                    for paragraph in doc.paragraphs:
                        text += paragraph.text + "\n"
                    print(f"[RAG Engine] Extracted {len(text)} characters from Word document")
                    return text
                except Exception as doc_error:
                    print(f"[RAG Engine] Word document processing error: {doc_error}")
                    return f"Error reading Word document: {str(doc_error)}"
            
            elif file_type == 'image' or file_path.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                print(f"[RAG Engine] Processing image file: {file_path}")
                # OCR for images
                try:
                    image = Image.open(file_path)
                    text = pytesseract.image_to_string(image)
                    print(f"[RAG Engine] Extracted {len(text)} characters from image using OCR")
                    return text
                except Exception as ocr_error:
                    print(f"[RAG Engine] OCR failed for image {file_path}: {ocr_error}")
                    return f"Image file: {file_path} (OCR processing failed)"
            
            else:
                # Fallback to plain text
                print(f"[RAG Engine] Using fallback text extraction for {file_type}")
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        print(f"[RAG Engine] Extracted {len(content)} characters using fallback method")
                        return content
                except UnicodeDecodeError:
                    # Try with different encoding
                    print(f"[RAG Engine] UTF-8 failed, trying latin-1 encoding")
                    with open(file_path, 'r', encoding='latin-1') as f:
                        content = f.read()
                        print(f"[RAG Engine] Extracted {len(content)} characters using latin-1 encoding")
                        return content
                    
        except Exception as e:
            print(f"[RAG Engine] Error extracting content from {file_path}: {e}")
            print(f"[RAG Engine] Error type: {type(e).__name__}")
            import traceback
            print(f"[RAG Engine] Content extraction traceback: {traceback.format_exc()}")
            return f"Error reading file: {str(e)}"
    
    def _chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks"""
        tokens = self.tokenizer.encode(text)
        chunks = []
        
        for i in range(0, len(tokens), chunk_size - overlap):
            chunk_tokens = tokens[i:i + chunk_size]
            chunk_text = self.tokenizer.decode(chunk_tokens)
            if chunk_text.strip():
                chunks.append(chunk_text.strip())
        
        return chunks
    
    def _generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts"""
        try:
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=texts
            )
            return [embedding.embedding for embedding in response.data]
        except Exception as e:
            print(f"Error generating embeddings: {e}")
            return []
    
    def _create_namespace(self, user_id: str) -> str:
        """Create a unique namespace for a user's embeddings"""
        return f"user_{user_id}"
    
    async def process_file(self, file_path: str, filename: str, user_id: str, folder_id: Optional[str], 
                          storage_path: str = None) -> Dict[str, Any]:
        """Process a file and store its chunks with embeddings in Pinecone"""
        try:
            # Initialize the RAG engine first
            print(f"[RAG Engine] Initializing for file processing...")
            await self.initialize()
            print(f"[RAG Engine] Initialization complete")
            
            print(f"[RAG Engine] Starting file processing: {filename}")
            
            # Determine file type from filename
            file_type = self._get_file_type_from_filename(filename)
            print(f"[RAG Engine] Detected file type: {file_type}")
            
            # Extract content from file
            print(f"[RAG Engine] Extracting content from file...")
            content = self._get_file_content(file_path, file_type)
            if not content.strip():
                print(f"[RAG Engine] No content extracted from file: {filename}")
                return {"success": False, "error": "No content extracted from file"}
            
            print(f"[RAG Engine] Extracted {len(content)} characters from file")
            
            # Generate content hash
            content_hash = hashlib.sha256(content.encode()).hexdigest()
            print(f"[RAG Engine] Generated content hash: {content_hash[:8]}...")
            
            # Check if file already exists by searching for content hash in Pinecone
            namespace = self._create_namespace(user_id)
            print(f"[RAG Engine] Using namespace: {namespace}")
            
            index = self.pinecone.Index(self.index_name)
            print(f"[RAG Engine] Got Pinecone index: {self.index_name}")
            
            # Search for existing file with same content hash
            print(f"[RAG Engine] Checking for existing file...")
            existing_files = index.query(
                vector=[0] * 1536,  # Dummy vector for metadata-only search
                top_k=1,
                namespace=namespace,
                filter={"content_hash": content_hash},
                include_metadata=True
            )
            
            if existing_files.matches:
                print(f"[RAG Engine] File already exists: {filename}")
                return {"success": False, "error": "File already exists"}
            
            # Chunk the content
            print(f"[RAG Engine] Chunking content...")
            chunks = self._chunk_text(content)
            print(f"[RAG Engine] Created {len(chunks)} chunks")
            
            # Generate embeddings
            print(f"[RAG Engine] Generating embeddings...")
            embeddings = self._generate_embeddings(chunks)
            
            if not embeddings:
                print(f"[RAG Engine] Failed to generate embeddings")
                return {"success": False, "error": "Failed to generate embeddings"}
            
            print(f"[RAG Engine] Generated {len(embeddings)} embeddings")
            
            # Generate file ID
            file_id = str(uuid.uuid4())
            print(f"[RAG Engine] Generated file ID: {file_id}")
            
            # Store chunks and embeddings in Pinecone with file metadata
            print(f"[RAG Engine] Preparing vectors for Pinecone...")
            vectors = []
            
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                chunk_id = str(uuid.uuid4())
                
                # Store comprehensive metadata in Pinecone
                metadata = {
                    "user_id": user_id,
                    "file_id": file_id,
                    "chunk_index": i,
                    "original_filename": filename,
                    "file_type": file_type,
                    "file_size": len(content),
                    "content_hash": content_hash,
                    "chunk_content": chunk,  # Store actual chunk content
                    "uploaded_at": datetime.now().isoformat(),
                    "total_chunks": len(chunks)
                }
                
                # Only add folder_id to metadata if it's not None
                if folder_id:
                    metadata["folder_id"] = folder_id
                
                vectors.append({
                    "id": chunk_id,
                    "values": embedding,
                    "metadata": metadata
                })
            
            print(f"[RAG Engine] Prepared {len(vectors)} vectors for Pinecone")
            
            # Batch upsert to Pinecone
            print(f"[RAG Engine] Upserting to Pinecone...")
            index.upsert(vectors=vectors, namespace=namespace)
            
            print(f"[RAG Engine] Successfully uploaded file: {filename}")
            
            return {
                "success": True,
                "file_id": file_id,
                "chunks_processed": len(chunks),
                "filename": filename
            }
            
        except Exception as e:
            print(f"[RAG Engine] Error processing file: {e}")
            print(f"[RAG Engine] Error type: {type(e).__name__}")
            import traceback
            print(f"[RAG Engine] Traceback: {traceback.format_exc()}")
            return {"success": False, "error": str(e)}
    
    async def search_relevant_chunks(self, query: str, user_id: str, 
                                   folder_id: Optional[str] = None, 
                                   top_k: int = 5) -> List[SearchResult]:
        """Search for relevant chunks based on query"""
        try:
            # Generate query embedding
            query_embedding = self._generate_embeddings([query])[0]
            
            # Search in Pinecone
            namespace = self._create_namespace(user_id)
            index = self.pinecone.Index(self.index_name)
            
            # Build filter for folder if specified
            filter_dict = {"user_id": user_id}
            if folder_id:
                filter_dict["folder_id"] = folder_id
            
            search_response = index.query(
                vector=query_embedding,
                top_k=top_k,
                namespace=namespace,
                filter=filter_dict,
                include_metadata=True
            )
            
            results = []
            for match in search_response.matches:
                results.append(SearchResult(
                    chunk_id=match.id,
                    content=match.metadata.get('chunk_content', ''),
                    metadata=match.metadata,
                    score=match.score,
                    source_file=match.metadata.get('original_filename', 'Unknown')
                ))
            
            return results
            
        except Exception as e:
            print(f"Error searching chunks: {e}")
            return []

    async def get_context_for_query(self, query: str, user_id: str, 
                                   folder_id: Optional[str] = None,
                                   max_tokens: int = 2000) -> str:
        """Get relevant context for a query"""
        try:
            # Search for relevant chunks
            search_results = await self.search_relevant_chunks(query, user_id, folder_id)
            
            if not search_results:
                return ""
            
            # Combine relevant chunks
            context_parts = []
            current_tokens = 0
            
            for result in search_results:
                # Estimate tokens (rough approximation)
                estimated_tokens = len(result.content.split()) * 1.3
                
                if current_tokens + estimated_tokens > max_tokens:
                    break
                
                context_parts.append(f"From {result.source_file}:\n{result.content}")
                current_tokens += estimated_tokens
            
            return "\n\n".join(context_parts)
            
        except Exception as e:
            print(f"Error getting context: {e}")
            return ""
    
    async def delete_file(self, file_id: str, user_id: str) -> Dict[str, Any]:
        """Delete a file and its associated chunks and embeddings"""
        try:
            # Get all chunks for this file from Pinecone
            namespace = self._create_namespace(user_id)
            index = self.pinecone.Index(self.index_name)
            
            # Search for all chunks belonging to this file
            chunks = index.query(
                vector=[0] * 1536,  # Dummy vector for metadata-only search
                top_k=1000,  # Large number to get all chunks
                namespace=namespace,
                filter={"file_id": file_id},
                include_metadata=True
            )
            
            if not chunks.matches:
                return {"success": False, "error": "File not found"}
            
            # Delete all chunks for this file
            chunk_ids = [match.id for match in chunks.matches]
            if chunk_ids:
                index.delete(ids=chunk_ids, namespace=namespace)
            
            return {"success": True, "file_id": file_id, "chunks_deleted": len(chunk_ids)}
            
        except Exception as e:
            print(f"Error deleting file: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_user_files(self, user_id: str, folder_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all files for a user from Pinecone"""
        try:
            await self.initialize()
            
            namespace = self._create_namespace(user_id)
            index = self.pinecone.Index(self.index_name)
            
            # Search for files with metadata
            query_filter = {"user_id": user_id}
            if folder_id:
                query_filter["folder_id"] = folder_id
            
            # Search for any chunks that have file metadata
            # Use a non-zero vector for the query (Pinecone doesn't allow all zeros)
            query_vector = [1.0] + [0.001] * 1535
            chunks = index.query(
                vector=query_vector,
                top_k=1000,
                namespace=namespace,
                filter=query_filter,
                include_metadata=True
            )
            
            # Extract unique files from chunk metadata
            files = {}
            for match in chunks.matches:
                metadata = match.metadata
                file_id = metadata.get('file_id')
                if file_id and file_id not in files:
                    files[file_id] = {
                        'id': file_id,
                        'name': metadata.get('original_filename', 'Unknown'),
                        'type': metadata.get('file_type', 'unknown'),
                        'size': metadata.get('file_size', 0),
                        'uploaded_at': metadata.get('uploaded_at', ''),
                        'chunks_count': metadata.get('total_chunks', 0),
                        'folder_id': metadata.get('folder_id'),
                        'user_id': user_id
                    }
            
            return list(files.values())
            
        except Exception as e:
            print(f"Error getting user files: {e}")
            return []

    async def create_folder(self, user_id: str, name: str, description: str = "") -> Dict[str, Any]:
        """Create a new folder for a user"""
        try:
            print(f"[RAG Engine] Initializing for folder creation")
            await self.initialize()
            print(f"[RAG Engine] Initialization complete")
            
            # Generate folder ID
            folder_id = f"folder_{uuid.uuid4()}"
            print(f"[RAG Engine] Generated folder ID: {folder_id}")
            
            # Create namespace for user
            namespace = self._create_namespace(user_id)
            print(f"[RAG Engine] Using namespace: {namespace}")
            
            # Get Pinecone index
            print(f"[RAG Engine] Getting Pinecone index: {self.index_name}")
            index = self.pinecone.Index(self.index_name)
            print(f"[RAG Engine] Successfully got Pinecone index")
            
            # Create a non-zero embedding for folder metadata (Pinecone doesn't allow all zeros)
            # Use a simple pattern: first element is 1, rest are small random values
            import random
            folder_embedding = [1.0] + [random.uniform(0.001, 0.01) for _ in range(1535)]
            print(f"[RAG Engine] Generated folder embedding")
            
            # Store folder metadata in Pinecone
            folder_metadata = {
                'user_id': user_id,
                'folder_id': folder_id,
                'folder_name': name,
                'folder_description': description,
                'folder_created_at': datetime.now().isoformat(),
                'type': 'folder'
            }
            print(f"[RAG Engine] Prepared folder metadata: {folder_metadata}")
            
            print(f"[RAG Engine] Upserting to Pinecone...")
            index.upsert(
                vectors=[{
                    'id': f"folder_{folder_id}",
                    'values': folder_embedding,
                    'metadata': folder_metadata
                }],
                namespace=namespace
            )
            print(f"[RAG Engine] Successfully upserted to Pinecone")
            
            result = {
                'id': folder_id,
                'name': name,
                'description': description,
                'created_at': datetime.now().isoformat(),
                'user_id': user_id
            }
            print(f"[RAG Engine] Returning folder result: {result}")
            return result
            
        except Exception as e:
            print(f"[RAG Engine] Error creating folder: {e}")
            print(f"[RAG Engine] Error type: {type(e).__name__}")
            import traceback
            print(f"[RAG Engine] Traceback: {traceback.format_exc()}")
            raise e

    async def get_user_folders(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all folders for a user from Pinecone"""
        try:
            await self.initialize()
            
            namespace = self._create_namespace(user_id)
            index = self.pinecone.Index(self.index_name)
            
            # Search for any chunks that have folder metadata
            # Use a non-zero vector for the query (Pinecone doesn't allow all zeros)
            query_vector = [1.0] + [0.001] * 1535
            chunks = index.query(
                vector=query_vector,
                top_k=1000,
                namespace=namespace,
                filter={"user_id": user_id, "type": "folder"},
                include_metadata=True
            )
            
            # Extract unique folders from chunk metadata
            folders = {}
            for match in chunks.matches:
                metadata = match.metadata
                folder_id = metadata.get('folder_id')
                if folder_id and folder_id not in folders:
                    folders[folder_id] = {
                        'id': folder_id,
                        'name': metadata.get('folder_name', 'Unknown'),
                        'description': metadata.get('folder_description', ''),
                        'created_at': metadata.get('folder_created_at', ''),
                        'user_id': user_id
                    }
            
            return list(folders.values())
            
        except Exception as e:
            print(f"Error getting user folders: {e}")
            return []

    async def delete_folder(self, folder_id: str, user_id: str) -> Dict[str, Any]:
        """Delete a folder and all its files"""
        try:
            await self.initialize()
            
            namespace = self._create_namespace(user_id)
            index = self.pinecone.Index(self.index_name)
            
            # First, get all files in this folder
            files = await self.get_user_files(user_id, folder_id)
            
            # Delete all files in the folder
            for file in files:
                await self.delete_file(file['id'], user_id)
            
            # Delete the folder metadata
            index.delete(
                ids=[f"folder_{folder_id}"],
                namespace=namespace
            )
            
            return {
                'success': True,
                'message': f'Folder {folder_id} deleted successfully',
                'files_deleted': len(files)
            }
            
        except Exception as e:
            print(f"Error deleting folder: {e}")
            return {
                'success': False,
                'error': str(e)
            }

# Global RAG engine instance
rag_engine = RAGEngine() 