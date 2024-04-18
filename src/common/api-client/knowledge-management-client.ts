
export class KnowledgeManagementClient {

  // Returns a URL from the API that allows one file upload to S3 with that exact filename
  async getUploadURL(fileName: string, fileType : string): Promise<string> {    
    if (!fileType) {
      alert('Must have valid file type!');
      return;
    }

    // TODO: switch to API Gateway, add JWT
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

  // Returns a list of documents in the S3 bucket (hard-coded on the backend)
  async getDocuments(continuationToken?: string, pageIndex?: number) {

    // TODO: switch to API Gateway
    const response = await fetch('https://slyk7uahobntca2ysqvhgumsi40zmwsn.lambda-url.us-east-1.on.aws/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        continuationToken: continuationToken,
        pageIndex: pageIndex,
      }),
    });

    const result = await response.json();
    return result;
  }

  // Deletes a given file on the S3 bucket (hardcoded on the backend!)
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

  // Runs a sync job on Kendra (hardcoded datasource as well as index on the backend)
  async syncKendra() : Promise<string> {
    const response = await fetch("https://f8t413zb4d.execute-api.us-east-1.amazonaws.com/sync-kendra")
    return await response.json()
  }

  // Checks if Kendra is currently syncing (used to disable the sync button)
  async kendraIsSyncing() : Promise<string> {
    const response = await fetch("https://f8t413zb4d.execute-api.us-east-1.amazonaws.com/still-syncing")
    return await response.json()
  }
}
