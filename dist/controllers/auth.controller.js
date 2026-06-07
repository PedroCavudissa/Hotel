import { AuthService } from "../services/auth.service.js";
export class AuthController {
    static async register(req, res) {
        try {
            const { name, email, password } = req.body;
            const user = await AuthService.register(name, email, password);
            return res.status(201).json(user);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);
            return res.json(result);
        }
        catch (error) {
            return res.status(401).json({ error: error.message });
        }
    }
    static async logout(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Não autenticado" });
            }
            const result = await AuthService.logout(userId);
            return res.json(result);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async createStaff(req, res) {
        try {
            const { name, email, password, role } = req.body;
            const user = await AuthService.createStaff(name, email, password, role);
            return res.status(201).json(user);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async verifyEmail(req, res) {
        try {
            const { token } = req.query;
            if (!token)
                return res.status(400).send("Token em falta");
            await AuthService.verifyEmail(token);
            return res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #22c55e;">E-mail verificado com sucesso! ✅</h2>
          <p>A tua conta encontra-se ativa.</p>
          <a href="http://localhost:3000/auth/login" style="padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Ir para o Login</a>
        </div>
      `);
        }
        catch (error) {
            return res.status(400).send(`<h2 style="color: #ef4444; font-family: sans-serif; text-align: center; padding: 50px;">Erro: ${error.message} ❌</h2>`);
        }
    }
    // NOVA PÁGINA VISUAL: Abre o formulário ao clicar no e-mail de Reset de Senha
    static async renderResetPage(req, res) {
        const { token } = req.query;
        if (!token)
            return res.status(400).send("Token inválido ou em falta.");
        // Retorna uma página simples para digitar a nova senha via navegador
        return res.send(`
      <div style="font-family: sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2>Alterar Password</h2>
        <p style="font-size: 14px; color: #555;">Insere a tua nova senha abaixo:</p>
        <form action="/auth/reset-password/confirm" method="POST">
          <input type="hidden" name="token" value="${token}" />
          <input type="password" name="password" placeholder="Nova Password" required style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px;" />
          <button type="submit" style="width: 100%; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Submeter Nova Password</button>
        </form>
      </div>
    `);
    }
    static async resend(req, res) {
        try {
            const { email } = req.body;
            const result = await AuthService.forgotPassword(email);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async forgot(req, res) {
        try {
            const { email } = req.body;
            const result = await AuthService.forgotPassword(email);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async reset(req, res) {
        try {
            // Aceita tanto via formulário URL encoded quanto via JSON do Swagger/Postman
            const token = req.body.token || req.query.token;
            const password = req.body.password;
            await AuthService.resetPassword(token, password);
            return res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #22c55e;">Password alterada com sucesso! 🎉</h2>
          <p>Já podes fechar esta aba e efetuar o login com a tua nova credencial.</p>
        </div>
      `);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    // Reenviar verificação de e-mail (Conta)
    static async resendVerification(req, res) {
        try {
            const { email } = req.body;
            const result = await AuthService.resendVerificationEmail(email);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    // Reenviar reset de senha
    static async resendReset(req, res) {
        try {
            const { email } = req.body;
            const result = await AuthService.resendResetPassword(email);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: "Campos obrigatórios em falta" });
            }
            const result = await AuthService.changePassword(userId, currentPassword, newPassword);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async disable(req, res) {
        try {
            const id = req.params.id;
            const result = await AuthService.setUserStatus(id, false);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async activate(req, res) {
        try {
            const id = req.params.id;
            const result = await AuthService.setUserStatus(id, true);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}
