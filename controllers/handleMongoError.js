const handleMongoError = (error) => {
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];

        const messages = {
            email: "Cet email est déjà utilisé",
            "phone.phoneNumber": "Ce numéro de téléphone est déjà utilisé"
        };

        return {
            status: 400,
            message: messages[field] || "Donnée déjà existante"
        };
    }

    return {
        status: 500,
        message: "Erreur interne du serveur"
    };
}

export default handleMongoError

