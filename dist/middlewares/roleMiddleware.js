export function roleMiddleware(roles) {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Não autenticado" });
        }
        if (!roles.includes(user.role)) {
            return res.status(403).json({ message: "Não tens permissão para realizar esta ação" });
        }
        next();
    };
}
