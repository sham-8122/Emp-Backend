const nodemailer = require('nodemailer');

// Configure the email transporter using your .env variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a pay slip email to an employee.
 * @param {object} employee - The employee object (must have name and email).
 * @param {string} htmlBody - The HTML content of the email.
 */
const sendPaySlipEmail = async (employee, htmlBody) => {
  const mailOptions = {
    from: `"EmployeeHub Admin" <${process.env.EMAIL_USER}>`,
    to: employee.email,
    subject: `Your Salary Slip for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
    html: htmlBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Pay slip email sent to ${employee.email}`);
    return { success: true };
  } catch (error) {
    console.error(`Error sending email: ${error}`);
    return { success: false, error };
  }
};

module.exports = { sendPaySlipEmail };