const nodemailer = require('nodemailer');

const isEmailConfigured = Boolean(process.env.EMAIL_USER) && Boolean(process.env.EMAIL_PASS);

const transporter = isEmailConfigured
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

async function sendEmail({ to, subject, text, html }) {
  if (!transporter || !to) {
    return false;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });

  return true;
}

module.exports = {
  isEmailConfigured,
  sendEmail,
};
