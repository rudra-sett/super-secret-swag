const mimeTypes = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.tar': 'application/x-tar'
};

export class KnowledgeManagementClient {

  async getUploadURL(fileName: string): Promise<string> {
    // const fileName = document.getElementById('fileNameInput').value;
    const fileExtension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    const fileType = mimeTypes[fileExtension];

    if (!fileType) {
      alert('Unsupported file type');
      return;
    }

    const lambdaUrl = 'https://rwhdthjaixihb3kmxcnpojeuli0giqhi.lambda-url.us-east-1.on.aws/';
    try {
      const response = await fetch(lambdaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName, fileType })
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const data = await response.json();
      return data.signedUrl;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  async getDocuments(continuationToken?: string, pageIndex?: number) {
    const response = await fetch('https://slyk7uahobntca2ysqvhgumsi40zmwsn.lambda-url.us-east-1.on.aws/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // s3Bucket: props.s3Bucket,
        // s3Prefix: props.s3Prefix,
        continuationToken: continuationToken,
        pageIndex: pageIndex,
      }),
    });

    const result = await response.json();
    return result;
  }

  async deleteFile(key : string) {
    
    await fetch("https://09do2xc5pe.execute-api.us-east-1.amazonaws.com/delete", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        KEY : key
      }),
    });
  }
}
