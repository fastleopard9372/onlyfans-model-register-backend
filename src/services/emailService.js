const nodemailer = require('nodemailer');
const emailTemplates = require('../utils/emailTemplates');

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    type: 'login'
  }
});

// Send invitation email
const sendInvitationEmail = async (invitation, sender) => {
  const invitationUrl = `${process.env.FRONTEND_URL}/register?token=${invitation.token}&email=${invitation.email}`;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: invitation.email,
    subject: `${sender.name} has invited you to join Model Platform`,
    html: emailTemplates.invitationEmail({
      senderName: sender.name,
      invitationUrl,
      expiresAt: invitation.expiresAt
    })
  };
  
  return transporter.sendMail(mailOptions);
};

// Send admin invitation email
const sendAdminInvitationEmail = async (invitation) => {
  const invitationUrl = `${process.env.FRONTEND_URL}/register?token=${invitation.token}&email=${invitation.email}`;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: invitation.email,
    subject: 'You are invited to join Model Platform',
    html: emailTemplates.adminInvitationEmail({
      invitationUrl,
      expiresAt: invitation.expiresAt
    })
  };
  
  return transporter.sendMail(mailOptions);
};

// Send registration success email
const sendRegistrationSuccessEmail = async (user) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: user.email,
    subject: 'Welcome to Book Babes',
    html: emailTemplates.registrationSuccessEmail({
      name: user.name
    })
  };
  
  return transporter.sendMail(mailOptions);
};

const sendVisitorRegistrationSuccessEmail = async (user) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: user.email,
    subject: 'Welcome to Book Babes',
    html: emailTemplates.visitorRegistrationSuccessEmail({
      name: user.name,
      password: user.password
      })
  };

  return transporter.sendMail(mailOptions);
};


const sendMessageEmail = async (message) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: message.sender.email,
    subject: 'You have received a message',
    html: emailTemplates.messageSentEmail({
      name: message.recipient.name,
      content: message.content
    })
  };

  return transporter.sendMail(mailOptions);
};

const sendVisitorPasscodeEmail = async (passcode) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: passcode.recipient.email,
    subject: 'You have received a passcode',  
    html: emailTemplates.visitorPasscodeEmail({
      name: passcode.sender.name,
      passcode: passcode.passcode
    })
  };

  return transporter.sendMail(mailOptions);
};  

const sendTestEmail = async (email, subject, text) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: email,
    subject,  
    text
  };

  return transporter.sendMail(mailOptions);
};
      

module.exports = {
  sendInvitationEmail,
  sendAdminInvitationEmail,
  sendRegistrationSuccessEmail,
  sendVisitorRegistrationSuccessEmail,
  sendMessageEmail,
  sendVisitorPasscodeEmail,
  sendTestEmail
};