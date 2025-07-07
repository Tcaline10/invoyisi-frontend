import axios from 'axios';

// API base URL - use environment variable for backend URL or fallback to proxy
const BACKEND_URL = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = BACKEND_URL ? `${BACKEND_URL}/api/gemini` : '/api/gemini';

/**
 * Service for interacting with the Google Gemini API
 */
class GeminiService {
  /**
   * Upload a file to the Gemini API
   * @param {File} file - The file to upload
   * @returns {Promise<Object>} - The uploaded file information
   */
  async uploadFile(file) {
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);

      // Upload the file to our backend endpoint which will handle the Gemini API call
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading file to Gemini API:', error);
      throw error;
    }
  }

  /**
   * Extract data from an invoice or receipt
   * @param {string} fileUri - The URI of the uploaded file
   * @param {string} mimeType - The MIME type of the file
   * @returns {Promise<Object>} - The extracted data
   */
  async extractDocumentData(fileUri, mimeType) {
    try {
      const response = await axios.post(`${API_BASE_URL}/extract`, {
        fileUri,
        mimeType,
      });

      return response.data;
    } catch (error) {
      console.error('Error extracting data from document:', error);
      throw error;
    }
  }

  /**
   * Classify a document type (invoice, receipt, contract, etc.)
   * @param {string} fileUri - The URI of the uploaded file
   * @param {string} mimeType - The MIME type of the file
   * @returns {Promise<Object>} - The document classification
   */
  async classifyDocument(fileUri, mimeType) {
    try {
      const response = await axios.post(`${API_BASE_URL}/classify`, {
        fileUri,
        mimeType,
      });

      return response.data;
    } catch (error) {
      console.error('Error classifying document:', error);
      throw error;
    }
  }

  /**
   * Generate a summary of an invoice or client history
   * @param {string} fileUri - The URI of the uploaded file or null if summarizing client history
   * @param {string} mimeType - The MIME type of the file or null if summarizing client history
   * @param {string} clientId - The client ID if summarizing client history, null otherwise
   * @returns {Promise<Object>} - The generated summary
   */
  async generateSummary(fileUri, mimeType, clientId = null) {
    try {
      const response = await axios.post(`${API_BASE_URL}/summarize`, {
        fileUri,
        mimeType,
        clientId,
      });

      return response.data;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  /**
   * Delete a file from the Gemini API
   * @param {string} fileName - The name of the file to delete
   * @returns {Promise<Object>} - The response from the API
   */
  async deleteFile(fileName) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/files/${fileName}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting file from Gemini API:', error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
