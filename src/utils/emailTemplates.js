const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Invitation email template
  const invitationEmail = ({ senderName, invitationUrl, expiresAt }) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Model Platform Invitation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4a6cf7;
            padding: 20px;
            text-align: center;
            color: white;
          }
          .content {
            padding: 20px;
            background-color: #f9f9f9;
          }
          .button {
            display: inline-block;
            background-color: #4a6cf7;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You've Been Invited!</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>${senderName} has invited you to join our exclusive Model Platform.</p>
            <p>To accept this invitation and register, please click the button below:</p>
            <p style="text-align: center;">
              <a href="${invitationUrl}" class="button">Accept Invitation</a>
            </p>
            <p>This invitation will expire on ${formatDate(expiresAt)}.</p>
            <p>If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL || 'support@example.com'}.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Model Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  
  // Admin invitation email template
  const adminInvitationEmail = ({ invitationUrl, expiresAt }) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Model Platform Invitation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4a6cf7;
            padding: 20px;
            text-align: center;
            color: white;
          }
          .content {
            padding: 20px;
            background-color: #f9f9f9;
          }
          .button {
            display: inline-block;
            background-color: #4a6cf7;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You've Been Invited!</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have been invited by an administrator to join our exclusive Model Platform.</p>
            <p>To accept this invitation and register, please click the button below:</p>
            <p style="text-align: center;">
              <a href="${invitationUrl}" class="button">Accept Invitation</a>
            </p>
            <p>This invitation will expire on ${formatDate(expiresAt)}.</p>
            <p>If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL || 'support@example.com'}.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Model Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  
  // Registration success email template
  const registrationSuccessEmail = ({ name }) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Model Platform</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4a6cf7;
            padding: 20px;
            text-align: center;
            color: white;
          }
          .content {
            padding: 20px;
            background-color: #f9f9f9;
          }
          .button {
            display: inline-block;
            background-color: #4a6cf7;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Model Platform!</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Thank you for registering with Model Platform! Your account has been successfully created.</p>
            <p>Here are the next steps to complete your profile:</p>
            <ol>
              <li>Upload a profile picture</li>
              <li>Upload a key picture for your content</li>
              <li>Complete your bio</li>
            </ol>
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/profile" class="button">Complete Your Profile</a>
            </p>
            <p>If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL || 'support@example.com'}.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Model Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  
  module.exports = {
    invitationEmail,
    adminInvitationEmail,
    registrationSuccessEmail
  };