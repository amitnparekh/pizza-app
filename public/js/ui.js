// Created by @Amit Parekh
// URL mapping, from hash to a function that responds to that URL action

const router = {
  "/": () => showContent("content-home"),
  "/profile": () =>
    requireAuth(() => showContent("content-profile"), "/profile"),
  "/login": () => login()
};

//Declare helper functions

/**
 * Iterates over the elements matching 'selector' and passes them
 * to 'fn'
 * @param {*} selector The CSS selector to find
 * @param {*} fn The function to execute for every element
 */
const eachElement = (selector, fn) => {
  for (let e of document.querySelectorAll(selector)) {
    fn(e);
  }
};

/**
 * Tries to display a content panel that is referenced
 * by the specified route URL. These are matched using the
 * router, defined above.
 * @param {*} url The route URL
 */
const showContentFromUrl = (url) => {
  if (router[url]) {
    router[url]();
    return true;
  }

  return false;
};

/**
 * Returns true if `element` is a hyperlink that can be considered a link to another SPA route
 * @param {*} element The element to check
 */
const isRouteLink = (element) =>
  element.tagName === "A" && element.classList.contains("route-link");

/**
 * Displays a content panel specified by the given element id.
 * All the panels that participate in this flow should have the 'page' class applied,
 * so that it can be correctly hidden before the requested content is shown.
 * @param {*} id The id of the content to show
 */
const showContent = (id) => {
  eachElement(".page", (p) => p.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
};


// NEW
const updateUI = async () => {

  const isAuthenticated = await auth0.isAuthenticated();

  document.getElementById("btn-logout").disabled = !isAuthenticated;
  document.getElementById("btn-login").disabled = isAuthenticated;

  // API related - enable the button to call the API
  document.getElementById("btn-call-api").disabled = !isAuthenticated;

  // NEW - add logic to show/hide gated content after authentication
  if (isAuthenticated) {

    // Check the current claims of the ID token
    const claims = await auth0.getIdTokenClaims();
    console.log('Claims: ' + JSON.stringify(claims));

    // If the user has ordered a pizza previously, then those details will be in the profile metadata.
    // Get those details and add to the ID token.

    const user = await auth0.getUser();
    const token = await auth0.getTokenSilently();

    document.getElementById("ipt-access-token").innerHTML = token;

    document.getElementById("ipt-user-profile").textContent = JSON.stringify( user );

    document.getElementById("gated-content").classList.remove("hidden");

    const isUserEmailVerified = user.email_verified;

    console.log("User email is verified : " + isUserEmailVerified);

    if(isUserEmailVerified) {

      // Check if order was placed in previous call or this is the order submit call

      if(orderConfMessage != null && orderConfMessage.length > 0 && orderConfMessage != "undefined") {
        console.log("orderConfMessage = "+orderConfMessage);
        document.getElementById("pizza-order-msg").innerHTML = "<p><b>"+orderConfMessage+"</b><br><p>You can place another order if you want to!</p></p>";
      } else {
        document.getElementById("pizza-order-msg").innerHTML = "<p>Please place your order.</p>";
      }

      document.getElementById("pizza-order-form").classList.remove("hidden");

    } else {
      document.getElementById("pizza-order-msg").innerHTML = "<p>Please verify your email before placing an order.<br>Check your inbox for an email verification link.</p>";
    }

    document.getElementById("pizza-order-msg").classList.remove("hidden");

    var claimsString = JSON.stringify(claims);
    
    // Display the ID/JWT token if it contains the user_metadata with a previous pizza order.
    if(claimsString.includes("pizza_order")) {
      document.getElementById("gated-content-1").classList.remove("hidden");
      document.getElementById("ipt-user-metadata").textContent = claimsString;
    }

    
    if (user != null) {
      //Set the profile's sub attribute in the userId field. This is required on Server Side.
      document.getElementById("userId").value = user.sub;
    }

  } else {
    document.getElementById("gated-content").classList.add("hidden");
    document.getElementById("gated-content-1").classList.add("hidden");
    document.getElementById("pizza-order-form").classList.add("hidden");

    document.getElementById("pizza-order-msg").innerHTML = "<p>Please Login/Sign-up first to place your order.</p>";
    document.getElementById("pizza-order-msg").classList.remove("hidden");
  }


};

window.onpopstate = (e) => {
  if (e.state && e.state.url && router[e.state.url]) {
    showContentFromUrl(e.state.url);
  }
};
