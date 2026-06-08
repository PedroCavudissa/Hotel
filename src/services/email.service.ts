import nodemailer from "nodemailer";

export class EmailService {
  private static transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
// src/controllers/authController.ts (continuação)

static async verifyEmail(req: Request, res: Response) {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Erro - PEDRO HOTEL</title>
            <style>
              body {
                font-family: 'Georgia', serif;
                background: linear-gradient(135deg, #001E3D 0%, #002D5A 100%);
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              .container {
                max-width: 500px;
                margin: 20px;
                background: white;
                border-radius: 20px;
                overflow: hidden;
                text-align: center;
              }
              .header {
                background: #001E3D;
                padding: 30px;
              }
              .header h1 {
                color: #D4AF37;
                margin: 0;
              }
              .content {
                padding: 40px 30px;
              }
              .error-icon {
                width: 80px;
                height: 80px;
                background: #ef4444;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
              }
              h2 {
                color: #dc2626;
                margin-bottom: 15px;
              }
              p {
                color: #475569;
                line-height: 1.6;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>PEDRO HOTEL</h1>
              </div>
              <div class="content">
                <div class="error-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="50" height="50" color="white">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2>⚠️ Token não fornecido</h2>
                <p>Link de verificação inválido.</p>
              </div>
            </div>
          </body>
        </html>
      `);
    }

    // Decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      email: string;
      role: string;
      tokenVersion: number;
    };

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Erro - PEDRO HOTEL</title>
            <style>
              body {
                font-family: 'Georgia', serif;
                background: linear-gradient(135deg, #001E3D 0%, #002D5A 100%);
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              .container {
                max-width: 500px;
                margin: 20px;
                background: white;
                border-radius: 20px;
                overflow: hidden;
                text-align: center;
              }
              .header {
                background: #001E3D;
                padding: 30px;
              }
              .header h1 {
                color: #D4AF37;
                margin: 0;
              }
              .content {
                padding: 40px 30px;
              }
              h2 {
                color: #dc2626;
                margin-bottom: 15px;
              }
              p {
                color: #475569;
                line-height: 1.6;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>PEDRO HOTEL</h1>
              </div>
              <div class="content">
                <h2>❌ Usuário não encontrado</h2>
                <p>Não foi possível encontrar sua conta.</p>
              </div>
            </div>
          </body>
        </html>
      `);
    }

    // Verificar se token já foi usado
    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Link Expirado - PEDRO HOTEL</title>
            <style>
              body {
                font-family: 'Georgia', serif;
                background: linear-gradient(135deg, #001E3D 0%, #002D5A 100%);
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              .container {
                max-width: 500px;
                margin: 20px;
                background: white;
                border-radius: 20px;
                overflow: hidden;
                text-align: center;
              }
              .header {
                background: #001E3D;
                padding: 30px;
              }
              .header h1 {
                color: #D4AF37;
                margin: 0;
              }
              .content {
                padding: 40px 30px;
              }
              .warning-icon {
                width: 80px;
                height: 80px;
                background: #f59e0b;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
              }
              h2 {
                color: #d97706;
                margin-bottom: 15px;
              }
              p {
                color: #475569;
                line-height: 1.6;
                margin-bottom: 30px;
              }
              .button {
                background: #D4AF37;
                color: #001E3D;
                padding: 12px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                display: inline-block;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>PEDRO HOTEL</h1>
              </div>
              <div class="content">
                <div class="warning-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="50" height="50" color="white">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2>⚠️ Link já utilizado ou expirado</h2>
                <p>Este link de verificação já foi usado ou expirou.</p>
                <a href="${process.env.FRONTEND_URL}/resend-verification" class="button">
                  Solicitar novo link →
                </a>
              </div>
            </div>
          </body>
        </html>
      `);
    }

    // Atualizar usuário
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        tokenVersion: user.tokenVersion + 1,
        updatedAt: new Date()
      }
    });

    // Retornar página de sucesso
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verificado - PEDRO HOTEL</title>
          <style>
            body {
              font-family: 'Georgia', serif;
              background: linear-gradient(135deg, #001E3D 0%, #002D5A 100%);
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .container {
              max-width: 500px;
              margin: 20px;
              background: white;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              text-align: center;
            }
            .header {
              background: #001E3D;
              padding: 30px;
            }
            .header h1 {
              color: #D4AF37;
              margin: 0;
              font-size: 28px;
              letter-spacing: 2px;
            }
            .content {
              padding: 40px 30px;
            }
            .success-icon {
              width: 80px;
              height: 80px;
              background: #10b981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              animation: scale 0.5s ease-in-out;
            }
            @keyframes scale {
              0% { transform: scale(0); }
              100% { transform: scale(1); }
            }
            h2 {
              color: #001E3D;
              margin-bottom: 15px;
              font-size: 24px;
            }
            p {
              color: #475569;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .button {
              background: #D4AF37;
              color: #001E3D;
              padding: 12px 32px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              display: inline-block;
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .footer {
              background: #f8fafc;
              padding: 20px;
              font-size: 12px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>PEDRO HOTEL</h1>
            </div>
            <div class="content">
              <div class="success-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="50" height="50" color="white">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2>✅ Email Verificado!</h2>
              <p>
                <strong>Verificação realizada com sucesso!</strong><br />
                Sua conta está agora ativa e você já pode fazer reservas no PEDRO HOTEL.
              </p>
              <a href="${process.env.FRONTEND_URL}/login" class="button">
                Ir para o Login →
              </a>
            </div>
            <div class="footer">
              <p>PEDRO HOTEL - Luxo & Conforto</p>
              <p>Você será redirecionado em 5 segundos...</p>
            </div>
          </div>
          <script>
            // Redirecionar para o frontend após 5 segundos
            setTimeout(() => {
              window.location.href = '${process.env.FRONTEND_URL}/login';
            }, 5000);
          </script>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Erro na verificação de email:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Token Inválido - PEDRO HOTEL</title>
            <style>
              body {
                font-family: 'Georgia', serif;
                background: linear-gradient(135deg, #001E3D 0%, #002D5A 100%);
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              .container {
                max-width: 500px;
                margin: 20px;
                background: white;
                border-radius: 20px;
                overflow: hidden;
                text-align: center;
              }
              .header {
                background: #001E3D;
                padding: 30px;
              }
              .header h1 {
                color: #D4AF37;
                margin: 0;
              }
              .content {
                padding: 40px 30px;
              }
              .error-icon {
                width: 80px;
                height: 80px;
                background: #ef4444;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
              }
              h2 {
                color: #dc2626;
                margin-bottom: 15px;
              }
              p {
                color: #475569;
                line-height: 1.6;
                margin-bottom: 30px;
              }
              .button {
                background: #D4AF37;
                color: #001E3D;
                padding: 12px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                display: inline-block;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>PEDRO HOTEL</h1>
              </div>
              <div class="content">
                <div class="error-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="50" height="50" color="white">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2>❌ Token Inválido</h2>
                <p>O link de verificação é inválido ou está corrompido.</p>
                <a href="${process.env.FRONTEND_URL}/resend-verification" class="button">
                  Solicitar novo link →
                </a>
              </div>
            </div>
          </body>
        </html>
      `);
    }
    
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Erro - PEDRO HOTEL</title>
          <style>
            body {
              font-family: 'Georgia', serif;
              background: linear-gradient(135deg, #001E3D 0%, #002D5A 100%);
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .container {
              max-width: 500px;
              margin: 20px;
              background: white;
              border-radius: 20px;
              overflow: hidden;
              text-align: center;
            }
            .header {
              background: #001E3D;
              padding: 30px;
            }
            .header h1 {
              color: #D4AF37;
              margin: 0;
            }
            .content {
              padding: 40px 30px;
            }
            h2 {
              color: #001E3D;
              margin-bottom: 15px;
            }
            p {
              color: #475569;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>PEDRO HOTEL</h1>
            </div>
            <div class="content">
              <h2>❌ Erro no Servidor</h2>
              <p>Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.</p>
            </div>
          </div>
        </body>
      </html>
    `);
  }
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
            <h2 style="color: #001E3D; margin-top: 0;">Recuperação de Password </h2>
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
               Este link expira em 15 minutos por segurança.<br />
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
                  <td style="padding: 8px 0; color: #1e293b;">${new Date(reservation.checkIn).toLocaleDateString("pt-AO")}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Check-out:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${new Date(reservation.checkOut).toLocaleDateString("pt-AO")}</td>
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

static async reservationFinished(email: string, reservation: any) {
  await this.transporter.sendMail({
    from: `"PEDRO HOTEL" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Obrigado pela sua estadia - PEDRO HOTEL",
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FAF9F6; border-radius: 16px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background: #001E3D; padding: 30px 20px; text-align: center;">
          <h1 style="color: #D4AF37; margin: 0; font-size: 28px; letter-spacing: 2px;">
            PEDRO HOTEL
          </h1>
          <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">
            Luxo & Conforto
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #001E3D; margin-top: 0;">
            Obrigado pela sua estadia! 🌟
          </h2>

          <p style="color: #475569; line-height: 1.6;">
            Esperamos que tenha tido uma experiência maravilhosa no PEDRO HOTEL.
            A sua reserva foi finalizada com sucesso. Seguem os detalhes da sua estadia:
          </p>

          <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">
                  Quarto:
                </td>
                <td style="padding: 8px 0; color: #1e293b;">
                  ${reservation.room?.number ?? reservation.roomNumber ?? "N/D"}
                </td>
              </tr>

              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">
                  Tipo:
                </td>
                <td style="padding: 8px 0; color: #1e293b;">
                  ${reservation.room?.type ?? reservation.roomType ?? "Standard"}
                </td>
              </tr>

              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">
                  Check-in:
                </td>
                <td style="padding: 8px 0; color: #1e293b;">
                  ${new Date(reservation.checkIn).toLocaleDateString("pt-AO")}
                </td>
              </tr>

              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">
                  Check-out:
                </td>
                <td style="padding: 8px 0; color: #1e293b;">
                  ${new Date(reservation.checkOut).toLocaleDateString("pt-AO")}
                </td>
              </tr>

              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">
                  Hóspedes:
                </td>
                <td style="padding: 8px 0; color: #1e293b;">
                  ${reservation.guests || 1} pessoa(s)
                </td>
              </tr>

              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: bold;">
                  Valor Pago:
                </td>
                <td style="padding: 8px 0; color: #D4AF37; font-weight: bold; font-size: 18px;">
                  ${new Intl.NumberFormat("pt-AO", {
                    style: "currency",
                    currency: "AOA",
                  }).format(
                    reservation.amountPaid ?? reservation.totalPrice ?? 0
                  )}
                </td>
              </tr>
            </table>
          </div>

          <div
            style="
              background: #ecfdf5;
              border: 1px solid #10b981;
              border-radius: 12px;
              padding: 16px;
              margin: 25px 0;
            "
          >
            <p
              style="
                margin: 0;
                color: #065f46;
                text-align: center;
                font-weight: bold;
              "
            >
              Esperamos recebê-lo novamente em breve! 💚
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a
              href="${process.env.FRONTEND_URL}"
              style="
                background: #001E3D;
                color: white;
                padding: 12px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                display: inline-block;
                font-size: 16px;
              "
            >
              Visitar o Nosso Site →
            </a>
          </div>

          <hr
            style="
              border: none;
              border-top: 1px solid #e2e8f0;
              margin: 25px 0;
            "
          />

          <p
            style="
              color: #94a3b8;
              font-size: 12px;
              text-align: center;
            "
          >
            Obrigado por escolher o PEDRO HOTEL.<br />
            Foi um prazer recebê-lo! 🏨
          </p>
        </div>
      </div>
    `,
  });
}
static async sendReservationCancellation(email: string, reservation: any) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(val);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Cancelamento de Reserva Confirmado - Quarto #${reservation.room?.number}`,
    html: `
      <div style="font-family: sans-serif; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #001E3D; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Reserva Cancelada</h1>
        </div>
        <div style="padding: 24px; line-height: 1.6;">
          <p>Olá, <strong>${reservation.guest?.name || 'Hóspede'}</strong>,</p>
          <p>Confirmamos que a tua reserva para o quarto <strong>#${reservation.room?.number}</strong> foi cancelada com sucesso.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #001E3D; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Resumo Financeiro do Cancelamento</h3>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Valor Total Pago:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600;">${formatCurrency(reservation.amountPaid || 0)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Taxa de Cancelamento Aplicada:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #dc2626;">- ${formatCurrency(reservation.cancellationFee || 0)}</td>
              </tr>
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 12px 0 0 0; font-weight: bold; color: #001E3D;">Valor a Reembolsar:</td>
                <td style="padding: 12px 0 0 0; text-align: right; font-weight: bold; color: #16a34a; font-size: 16px;">${formatCurrency(reservation.refundAmount || 0)}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #64748b;"><strong>Motivo do cancelamento:</strong> ${reservation.cancellationReason}</p>
          
          <p style="margin-bottom: 0;">Se tiveres alguma dúvida sobre o método de processamento do teu reembolso, entra em contacto com a nossa receção.</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          © 2026 Hotel Management System. Todos os direitos reservados.
        </div>
      </div>
    `
  };

  // Aqui iria o teu transportador do nodemailer: await transporter.sendMail(mailOptions);
  console.log(`E-mail de cancelamento enviado para ${email}`);
}
}