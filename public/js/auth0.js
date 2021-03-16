// Created by @Amit Parekh

// The Auth0 client, initialized in configureClient()

let auth0 = null;

/**
 * Retrieves the auth configuration from the server
 */
const fetchAuthConfig = () => fetch("/auth_config.json");


/**
 * Initializes the Auth0 client
 */
const configureClient = async () => {
	
  //showDebugMessage('Now in configureClient');

  const response = await fetchAuthConfig();
  const config = await response.json();


  try {
 	 auth0 = await createAuth0Client({
	    domain: config.domain,
	    client_id: config.clientId,
	    // audience value added for API call
	    audience: config.audience	
	  });


  } catch (e) {
    // Something has gone wrong when the SDK has attempted to create an
    // Auth0 client and have it set up the correct authentication status for
    // the user. In this bad state, there's not much we can do but force a
    // log out on the user so that they can log in again.

    showDebugMessage('Caught Error:' + e);
  }


};



/**
 * Starts the authentication flow
 */
const login = async (targetUrl) => {

  try {
    console.log("Logging in", targetUrl);

    const options = {
      redirect_uri: window.location.origin
    };

    if (targetUrl) {
      options.appState = { targetUrl };
    }

    await auth0.loginWithRedirect(options);

  } catch (err) {
    console.log("Log in failed", err);
  }
};

/**
 * Executes the logout flow
 */
const logout = () => {

  try {
    console.log("Logging out");
    auth0.logout({
      returnTo: window.location.origin
    });
  } catch (err) {
    console.log("Log out failed", err);
  }
};




/**
 * Checks to see if the user is authenticated. If so, `fn` is executed. Otherwise, the user
 * is prompted to log in
 * @param {*} fn The function to execute if the user is logged in
 */
const requireAuth = async (fn, targetUrl) => {
  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    return fn();
  }

  return login(targetUrl);
};



// Will run when page finishes loading
window.onload = async () => {


	// AMIT - Make sure the page is re-loading afresh so the time-stamp helps in doing that.
	document.getElementById("h2-title").innerHTML = "Current Date is: " + new Date();

  await configureClient();


	// AMIT - Had to COMMENT OUT this to make the flow work

  // If unable to parse the history hash, default to the root URL
  //if (!showContentFromUrl(window.location.pathname)) {
  //  showContentFromUrl("/");
  //  window.history.replaceState({ url: "/" }, {}, "/");
  //}

	//showDebugMessage("Now in onLoad - 3");

  const bodyElement = document.getElementsByTagName("body")[0];

  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    console.log("> User is authenticated");

  	//showDebugMessage("User is authenticated");

    window.history.replaceState({}, document.title, window.location.pathname);

    updateUI();
    
    return;

  } else {
	  //showDebugMessage("User is NOT authenticated");
    console.log("> User is NOT authenticated");
  }

  const query = window.location.search;
  const shouldParseResult = query.includes("code=") && query.includes("state=");

  if (shouldParseResult) {
    console.log("> Parsing redirect");
    try {
      const result = await auth0.handleRedirectCallback();

      if (result.appState && result.appState.targetUrl) {
        showContentFromUrl(result.appState.targetUrl);
      }

      console.log("Logged in!");
    } catch (err) {
      console.log("Error parsing redirect:", err);
    }

    window.history.replaceState({}, document.title, "/");
  }

  updateUI();

	// To check if the onload is called and page loading is over.
	//showDebugMessage('Page Load Finished!' );

};


debugMsg = "";

/**
 * Shows some of the Log Messages in the HTML page itself
 */
const showDebugMessage = async (newMessage) => {
  debugMsg = debugMsg + '<br>' + newMessage;
  document.getElementById("h3-message").innerHTML = debugMsg;
};

