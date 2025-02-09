const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendConfirmationEmail = async (email, verificationCode) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Aber - Email Verification',
      text: `Hi there,

Thank you for joining Aber! 🎉

Your verification code is: ${verificationCode}`,
    };
    await transporter.sendMail(mailOptions);
    console.log('📧 Confirmation email sent successfully');
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    throw error;
  }
};

module.exports = { sendConfirmationEmail };
