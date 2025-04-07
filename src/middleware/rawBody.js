// Raw body parser for Stripe webhooks
const rawBody = (req, res, next) => {
    let data = '';
    
    req.on('data', chunk => {
      data += chunk;
    });
    
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  };
  
export default rawBody;