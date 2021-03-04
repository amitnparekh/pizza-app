// Created by @Amit Parekh

// This file has the application implementation

let pizzaType  = "";
let pizzaQty   = "";
let orderDetails = "";


function GetURLParameter(sParam) {

  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split("&");

  for (var i = 0; i < sURLVariables.length; i++) {
    var sParameterName = sURLVariables[i].split("=");
    if(sParameterName[0] == sParam) {
      return sParameterName[1];
    }
  }
}


// function added for API authorization testing when used from the browser.
// However, right now it is NOT used at all.
const callApi = async () => {


  // Get the pizza order details from the form.
  pizzaType = document.getElementById("pizzaType").value;
  pizzaQty = document.getElementById("pizzQty").value;

  // This has to be added to the Profile's user metadata or app metadata
  orderDetails = { type: pizzaType, qty: pizzaQty };

  alert("Order Details: " + JSON.stringify(orderDetails));

  try {

    // Get the access token from the Auth0 client
    const token = await auth0.getTokenSilently();

    console.log("Token:" + token);

    const user = await auth0.getUser();

    if (user != null) {

      console.log("User Profile attribute 'sub' is: " + user.sub);

      //const requestURL = "/api/takePizzaOrder?userId=" + user.sub + "&accessToken="+token;
      try {

        //document.getElementById("order-form").submit();
        console.log("Called the takePizzaOrder API on Server.js successfully");

      } catch (error) {
        console.log(error);
      }

    }

    const response = await fetch("/api/external", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Fetch the JSON result
    const responseData = await response.json();

    // Display the result in the output element
    const responseElement = document.getElementById("api-call-result");

    responseElement.innerText = JSON.stringify(responseData, {}, 2);

  } catch (e) {
    // Display errors in the console
    console.error(e);
    //showDebugMessage('Caught Error in function callAPI:' + e);
  }
}
