const emailService = require('../services/emailService');

const sendTestEmail = async (req, res, next) => {
  try {
    await emailService.sendTestEmail("fastleopard9372@gmail.com", 'Test Email', 'This is a test email');
    return res.status(200).json({success: true, message: 'Test email sent successfully'});
  } catch (error) {
    next(error);
  }
}

module.exports = {  
  sendTestEmail
}

