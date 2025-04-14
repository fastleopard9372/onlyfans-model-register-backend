// Generate code with format "XXX-000" where X is a random character and 0 is a random digit
const generateCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomChars = '';
    // Generate 3 random characters
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomChars += characters.charAt(randomIndex);
    }
    
    // Generate 3 random digits
    const randomDigits = Math.floor(100 + Math.random() * 900); // Ensures 3 digits (100-999)
    
    return `${randomChars}-${randomDigits}`;
};
  
module.exports = generateCode;