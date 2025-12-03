// Test if nodemailer is available
try {
  const nodemailer = require('nodemailer');
  console.log('✅ Nodemailer is available!');
  console.log('Version:', nodemailer.version || 'Unknown');
  
  // Test creating a transporter
  const transporter = nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: "selva.propulsion@gmail.com",
      pass: "yixcjwlyxapvwoav"
    }
  });
  
  console.log('✅ SMTP transporter created successfully!');
  
} catch (error) {
  console.log('❌ Nodemailer not available:', error.message);
}
