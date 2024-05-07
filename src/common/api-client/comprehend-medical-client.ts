export class ComprehendMedicalClient {
  async redactText(userInput: string) {
    try {
      console.log("inside the comprehend medical client")
      const response = await fetch('https://e19sa7nke1.execute-api.us-east-1.amazonaws.com/default/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "content": userInput,
        })
      });
      console.log(response);
      return (await response.json()).redacted_text;
    }
    catch (err) {
      console.log(err);
      return userInput;
    }
  }

}