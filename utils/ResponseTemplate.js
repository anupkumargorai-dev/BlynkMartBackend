class ResponseTemplate {
  
  
    success(message, data = {}) {
      this.status = 'success';
      this.message = message;
      this.data = data;
      this.error = null;
      return this;
    }
  
    error(message, code = 'GENERAL_ERROR', details = '') {
      this.status = 'error';
      this.message = message;
      this.error = {
        code,
        details,
      };
      this.data = null;
      return this;
    }
  
    getResponse() {
      const response = {
        status: this.status,
        message: this.message,
      };
  
      if (this.data) {
        response.data = this.data;
      }
  
      if (this.error) {
        response.error = this.error;
      }
  
      return response;
    }
  }
  
  export default ResponseTemplate;
  