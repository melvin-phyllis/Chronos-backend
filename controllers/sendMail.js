
import nodemailer from "nodemailer";

const sendMail = (
    from,
    to,
    subject,
    text, // Plain-text version of the message
    html
) => {

    // Create a transporter using Ethereal test credentials.
    // For production, replace with your actual SMTP server details.
    const transporter = nodemailer.createTransport({
        host: process?.env.SMTP_HOST,
        port: process?.env.SMTP_PORT,
        secure: process?.env.SMTP_SECURE, // Use true for port 465, false for port 587
        auth: {
            user: process?.env.SMTP_USER,
            pass: process?.env.SMTP_PASS,
        },
    });

    // Send an email using async/await
    (async () => {
        const info = await transporter.sendMail({
            from,
            to,
            subject,
            text, // Plain-text version of the message
            html, // HTML version of the message
        });

        console.log("Message sent:", info.messageId);
    })();
}

export default sendMail
