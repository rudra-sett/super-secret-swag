export class UserFeedbackClient {
  async sendUserFeedback(feedbackData: string) {
    const response = await fetch('https://4eyjyb4lqouzyvvvs5fh6zwwse0spnhw.lambda-url.us-east-1.on.aws/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feedbackData })
    });
  }
}
