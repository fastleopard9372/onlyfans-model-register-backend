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
// Visitor registration success email template
const visitorRegistrationSuccessEmail = ({ name, password }) => {
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
          <h1>Welcome to Book Babes!</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Thank you for registering with Book Babes! Your account has been successfully created.</p>
          <p>You can now start browsing the platform and discover your favorite models.</p>
          <p>Your password is:</p>
          <div style="background-color: #f9f9f9; padding: 10px; border-radius: 5px; font-weight: bold; font-size: 16px;">${password}</div>
          <p>If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL || 'support@example.com'}.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Book Babes. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const visitorPasscodeEmail = ({ name, passcode }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Model Platform Message</title>
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
          <h1>You've unlocked a photo</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You have unlocked a photo from ${name}.</p>
          <p>You can login with the following passcode:</p>
          <div style="background-color: #f9f9f9; padding: 10px; border-radius: 5px; font-weight: bold; font-size: 16px;">${passcode}</div>
          <p>If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL || 'support@example.com'}.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Model Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const messageSentEmail = ({ name, content }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Book Babes Message</title>
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
          <h1>You've received a message</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You have received a message from ${name}.</p>
          <p>The message is:</p>
          <div style="background-color: #f9f9f9; padding: 10px; border-radius: 5px; font-weight: bold; font-size: 16px;">${content}</div>
          <p>If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL || 'support@example.com'}.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Model Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  messageSentEmail,
  invitationEmail,
  adminInvitationEmail,
  registrationSuccessEmail,
  visitorRegistrationSuccessEmail,
  visitorPasscodeEmail
};