import nodemailer from "nodemailer";

export class EmailService {
  private static transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 1. Enviar link para Ativação de Conta (VERIFICAÇÃO DE EMAIL)
  static async sendVerificationEmail(email: string, token: string) {
    // CORRIGIDO: Usar FRONTEND_URL em vez de localhost:3000
    const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: `"PEDRO HOTEL" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Ative a sua Conta - PEDRO HOTEL",
      html: `
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FAF9F6; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <div style="background: #001E3D; padding: 30px 20px; text-align: center;">
            <h1 style="color: #D4AF37; margin: 0; font-size: 28px; letter-spacing: 2px;">PEDRO HOTEL</h1>
            <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Luxo & Conforto</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #001E3D; margin-top: 0;">Bem-vindo ao PEDRO HOTEL! 🏨</h2>
            <p style="color: #475569; line-height: 1.6;">Obrigado por se registar. Para ativar a sua conta e começar a fazer reservas, clique no botão abaixo:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" 
                 style="background: #D4AF37; color: #001E3D; padding: 12px 32px; 
                        text-decoration: none; border-radius: 8px; font-weight: bold;
                        display: inline-block; font-size: 16px;">
                Ativar Minha Conta →
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
            <p style="background: #f1f5f9; padding: 12px; border-radius: 8px; word-break: break-all; font-size: 12px; color: #3b82f6;">
              ${link}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
            
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              Este link expira em 24 horas.<br />
              Se não foi você que criou esta conta, ignore este email.
            </p>
          </div>
        </div>
      `,
    });
  }

  // 2. Enviar link para Recuperação de Senha (Forgot Password)
  static async sendResetPasswordEmail(email: string, token: string) {
    // Usando FRONTEND_URL para o link de reset
    const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: `"PEDRO HOTEL" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Recuperação de Password - PEDRO HOTEL",
      html: `
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FAF9F6; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <div style="background: #001E3D; padding: 30px 20px; text-align: center;">
            <h1 style="color: #D4AF37; margin: 0; font-size: 28px; letter-spacing: 2px;">PEDRO HOTEL</h1>
            <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Luxo & Conforto</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #001E3D; margin-top: 0;">Recuperação de Password 🔐</h2>
            <p style="color: #475569; line-height: 1.6;">Recebemos um pedido para redefinir a sua password. Clique no botão abaixo para criar uma nova senha:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" 
                 style="background: #D4AF37; color: #001E3D; padding: 12px 32px; 
                        text-decoration: none; border-radius: 8px; font-weight: bold;
                        display: inline-block; font-size: 16px;">
                Redefinir Password →
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
            <p style="background: #f1f5f9; padding: 12px; border-radius: 8px; word-break: break-all; font-size: 12px; color: #3b82f6;">
              ${link}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
            
            <p style="color: #ef4444; font-size: 12px; text-align: center;">
              ⚠️ Este link expira em 15 minutos por segurança.<br />
              Se não foi você que pediu a recuperação, ignore este email.
            </p>
          </div>
        </div>
      `,
    });
  }

  // 3. Enviar confirmação de reserva
  static async sendReservationConfirmation(email: string, reservation: any) {
    await this.transporter.sendMail({
      from: `"PEDRO HOTEL" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reserva Confirmada - PEDRO HOTEL",
      html: `
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FAF9F6; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <div style="background: #001E3D; padding: 30px 20px; text-align: center;">
            <h1 style="color: #D4AF37; margin: 0; font-size: 28px; letter-spacing: 2px;">PEDRO HOTEL</h1>
            <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Luxo & Conforto</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #001E3D; margin-top: 0;">Reserva Confirmada! ✅</h2>
            <p style="color: #475569; line-height: 1.6;">A sua reserva foi confirmada com sucesso. Seguem os detalhes:</p>
            
            <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Quarto:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${reservation.room?.number ?? reservation.roomNumber ?? "N/D"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Tipo:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${reservation.room?.type ?? reservation.roomType ?? "Standard"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Check-in:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${new Date(reservation.checkIn).toLocaleDateString("pt-AO")} às 14:00</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Check-out:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${new Date(reservation.checkOut).toLocaleDateString("pt-AO")} às 12:00</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Hóspedes:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${reservation.guests || 1} pessoa(s)</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Total:</td>
                  <td style="padding: 8px 0; color: #D4AF37; font-weight: bold; font-size: 18px;">
                    ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(reservation.totalPrice)}
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/minhas-reservas" 
                 style="background: #001E3D; color: white; padding: 12px 32px; 
                        text-decoration: none; border-radius: 8px; font-weight: bold;
                        display: inline-block; font-size: 16px;">
                Ver Minhas Reservas →
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
            
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              Em caso de dúvidas, contacte a nossa recepção 24h.<br />
              Obrigado por escolher o PEDRO HOTEL! 🏨
            </p>
          </div>
        </div>
      `,
    });
  }
}