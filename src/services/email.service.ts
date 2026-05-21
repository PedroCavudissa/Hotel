import nodemailer from "nodemailer";

export class EmailService {
  private static apiUrl = process.env.API_URL || "http://localhost:3000";
  private static frontendUrl = process.env.FRONTEND_URL;

  private static transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  static async sendVerificationEmail(email: string, token: string) {
    const link = `${this.apiUrl}/auth/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: `"Hotel Booking" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Ativa a tua conta - Hotel Booking",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Obrigado por te registares!</h2>
          <p>Clica no botão abaixo para ativar a tua conta e poderes fazer login:</p>
          <a href="${link}" style="background: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0;">Ativar a minha conta</a>
        </div>
      `,
    });
  }

  static async sendResetPasswordEmail(email: string, token: string) {
    const link = this.frontendUrl
      ? `${this.frontendUrl}/reset-password?token=${token}`
      : `${this.apiUrl}/auth/reset-password/confirm?token=${token}`;

    await this.transporter.sendMail({
      from: `"Hotel Booking" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Recuperação de password - Hotel Booking",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Pedido de nova password</h2>
          <p>Clica no botão abaixo para redefinir a tua password:</p>
          <a href="${link}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0;">Definir nova password</a>
          <p style="color: #666; font-size: 12px;">Este link expira em 15 minutos.</p>
        </div>
      `,
    });
  }
}
