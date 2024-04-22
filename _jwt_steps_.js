/**
 * install jsonwebtoken
 * jwt.sign (paylod, secret, {expiredIn})
 * token client
 */

/**
 * how to store token in the client side
 *
 * 1. memory ---> ok type,
 * 2, local storage --> ok type(xss)
 * cookies: http only
 */

/**
 * 1.set http only 
 * for development secure :  false,
 * 
 * 2.cors
 * app.use(cors({
  origin: ['http://localhost:5173'],
  credentials : true
}));
 * 
 * 3. client side axios setting
 * in axios set withcredentital: true;
 */
