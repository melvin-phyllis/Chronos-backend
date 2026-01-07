
const genpassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;


}

export default genpassword


// Exemple d'utilisation
console.log(genpassword());       // Ex: "fG4@k8!zQ2#r"
console.log(genpassword(16));     // mot de passe plus long