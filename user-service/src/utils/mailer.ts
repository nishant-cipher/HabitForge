import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // STARTTLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const FROM = process.env.SMTP_FROM || `HabitForge <${process.env.SMTP_USER}>`;

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    await transporter.sendMail({
        from: FROM,
        to,
        subject: '🔑 Reset your HabitForge password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0d1a12; color: #e0e8e4; border-radius: 12px; padding: 32px; border: 1px solid #1e3828;">
                <h1 style="font-size: 20px; font-weight: 800; color: #13ec6a; margin-bottom: 8px;">HabitForge</h1>
                <h2 style="font-size: 18px; color: #e0e8e4; margin-bottom: 16px;">Reset your password</h2>
                <p style="color: #7a9e8e; margin-bottom: 24px;">We received a request to reset your password. Click the button below — this link expires in <strong style="color:#e0e8e4">1 hour</strong>.</p>
                <a href="${resetLink}"
                   style="display: inline-block; padding: 12px 28px; background: #13ec6a; color: #0a150d; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 15px;">
                    Reset Password
                </a>
                <p style="margin-top: 24px; font-size: 12px; color: #4a6a5a;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
                <p style="margin-top: 8px; font-size: 12px; color: #4a6a5a;">Or copy this link: <a href="${resetLink}" style="color: #13ec6a;">${resetLink}</a></p>
            </div>
        `,
        text: `Reset your HabitForge password\n\nClick this link to reset your password (expires in 1 hour):\n${resetLink}\n\nIf you didn't request this, you can safely ignore this email.`,
    });
}
