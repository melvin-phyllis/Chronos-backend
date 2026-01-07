
const logout = (req, res) => {

    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
    })

    return res.json({ message: "Déconnexion réussie", success: true })

}

export default logout
