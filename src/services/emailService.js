const nodemailer = require('nodemailer');
const emailTemplates = require('../utils/emailTemplates');

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
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
    subject: 'Welcome to Model Platform',
    html: emailTemplates.registrationSuccessEmail({
      name: user.name
    })
  };
  
  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendInvitationEmail,
  sendAdminInvitationEmail,
  sendRegistrationSuccessEmail
};