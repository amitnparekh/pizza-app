const https = require('https');
const http = require('http');
const fs = require('fs');

const { join } = require("path");
// Added for API related sample
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const authConfig = require("./auth_config.json");

var bodyParser = require('body-parser');

var auth0 = require('auth0');
var ManagementClient = auth0.ManagementClient;

const express = require('express');

module.exports = function (n) { return n * 111 };

const app = express();


// your express configuration here
// Serve static assets from the /public folder
app.use(express.static(join(__dirname, "public")));

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

// The cert and keys for the HTTPS Server
const privateKey  = fs.readFileSync('key.pem', 'utf8');
const certificate = fs.readFileSync('cert.pem', 'utf8');

const credentials = {key: privateKey, cert: certificate};

const options = {
  key: fs.readFileSync('key.pem', 'utf8'),
  cert: fs.readFileSync('cert.pem', 'utf8')
};

// create the JWT middleware
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ["RS256"]
});


// function added for modifying user app metadata. To be exposed as an API to call from app.js from the browser client
const updatePizzaOrder = async (pizzaType, pizzaQty, userId) => {

  console.log('updatePizzaOrder function called.');
  
  // Using the access token, create a new auth0.Management instance by passing it the account's Auth0 domain, and the Access Token.
  try {

    /**
     * Pizza 42 App:
     * Client Id - 8OOy9Pn9kwESEARFpMDWketLEAy6nOze
     * Client Secret - 3CJ2TiixBk86MKEr1xuqcNuK_YibIxqLG1yLh2gWD9_WIMKF7_AzHR25J1ga3svZ
     */

    /**
     * Pizza Ordering API (Test Application):
     * Client Id - QYiJUpHc5Qb8aHvorihtp6aUomJ32JTn
     * Client Secret - MDjL5hX2nJTehUZh0axHsLrJEAfMmopO-54X4x0dSL5fEBZ9Sl_eqC6baG4bFmCG
     */

    /**
     * The Pizza Ordering API has been given permissions by Amit on the Auth0 Management API for
     * read:users and update:users
     * Auth0 Dashboard URL - https://manage.auth0.com/dashboard/au/parekh/apis/6036e5d48b702c003dcad2b1/authorized-clients
     * After giving these permissions and the scops, error is not coming.
     */

    var auth0Manage = new ManagementClient({
      domain: 'parekh.au.auth0.com',
      clientId: 'QYiJUpHc5Qb8aHvorihtp6aUomJ32JTn',
      clientSecret: 'MDjL5hX2nJTehUZh0axHsLrJEAfMmopO-54X4x0dSL5fEBZ9Sl_eqC6baG4bFmCG',
      scope: 'read:users update:users read:client_grants',
      audience: 'https://parekh.au.auth0.com/api/v2/'
    });

    if(auth0Manage != null) {
      // The Management Client is a valid object and be used for User Management.
      console.log("auth0Manage = " + auth0Manage);
      
      /**   {
       *    "sub":"google-oauth2|116435906027154071356"
       *    }
       *  
       * In the Auth0 User Management dashboard the 'user_id' is as    "google-oauth2|116435906027154071356"
       * In the Auth0 User Management dashboard the raw JSON has the 'user_id' as    "116435906027154071356"
       */

      const userProfile = auth0Manage.getUser( userId );

      if(userProfile != null) {
        console.log("Got data for user " + userId);
        // Modify the User's meta data.

        var params = { id: userId };

        orderDetails = { pizza_type: pizzaType, pizza_qty: pizzaQty };

        var metadata = {
          pizza_order: orderDetails
        };

        auth0Manage.updateUserMetadata(params, metadata, function (err, user) {
          if (err) {
            // Handle error.
            console.log(err);
          } else {
            // Updated user.
            console.log("User Metadata successfully updated for User: "+userId);
          }       

        });

      } else {
        console.log("Could not get the userProfile for User: "+ userId);
      }

    }

  } catch (error) {
    console.log(error);
  }

};


app.post("/api/takePizzaOrder", (req, res) => {

  console.log("this is takePizzaOrder method");

  // Extract the Order detials and User ID (sub attribute) from the request.
  var pizzaType = req.body.pizzaType;
  var pizzaQty = req.body.pizzaQty;
  var userId = req.body.userId;   // This is actually the 'sub' attribute as there is no 'user_id' attribute anymore.
  var accessToken = req.body.accessToken;

  console.log('pizzaType   ='+pizzaType);
  console.log('pizzaQty    ='+pizzaQty);
  console.log('userId      ='+userId);

  // Modify the User Profile's metadata with Order Details.
  updatePizzaOrder(pizzaType, pizzaQty, userId);

  const orderConfirmationMessage = "Your pizza order was received successfully! Pizza Type: " + pizzaType + ", Quantity: " + pizzaQty;

  res.redirect("/?orderConfirmation="+orderConfirmationMessage)

});

// API endpoint that requires an access token to be provided for the call to succeed.
app.get("/api/external", checkJwt, (req, res) => {
  res.send({
    msg: "Your access token was successfully validated!"
  });
});


// Endpoint to serve the configuration file
app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});


// Serve the index page for all other requests
app.get("/*", (_, res) => {
  res.sendFile(join(__dirname, "index.html"));
});


// Error handler so that a JSON response is returned from your API in the event of a missing or invalid token.
app.use(function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token" });
  }

  next(err, req, res);
});

module.exports = app;

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(8000);
console.log("Pizza Application running on HTTP port 8000");

httpsServer.listen(8443);
console.log("Pizza Application running on HTTPS port 8443");