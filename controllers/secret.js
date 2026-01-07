import dotenv from 'dotenv';
dotenv.config()


const secret = new TextEncoder().encode(`${process.env.JWT_SECRET}`);

console.log(secret,"sss")
export default secret
