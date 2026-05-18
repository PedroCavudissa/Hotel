import nodemailer from "nodemailer";

export class EmailService {
  private static transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 1. Enviar link para Ativação de Conta
  static async sendVerificationEmail(email: string, token: string) {
    const link = `http://localhost:3000/auth/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: `"Hotel Booking" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Ativa a tua Conta - Hotel Booking",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Obrigado por te registares!</h2>
          <p>Clica no botão abaixo para ativar a tua conta e poderes fazer o login:</p>
          <a href="${link}" style="background: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0;">Activar Minha Conta</a>
        </div>
      `,
    });
  }

  // 2. Enviar link para Alterar a Senha (Forgot Password)
 static async sendResetPasswordEmail(email: string, token: string) {

  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`; // frontend route

  await this.transporter.sendMail({
    from: `"Hotel Booking" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Recuperação de Password - Hotel Booking",
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Pedido de Nova Password</h2>
        <p>Clica no botão abaixo para redefinir a tua password:</p>

        <a href="${link}"
           style="background: #3b82f6; color: white; padding: 10px 20px;
                  text-decoration: none; border-radius: 5px;
                  display: inline-block; margin: 15px 0;">
          Definir Nova Password
        </a>

        <p style="color: #666; font-size: 12px;">
          Este link expira em 15 minutos.
        </p>
      </div>
    `,
  });
}
}