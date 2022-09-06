import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";

import { store } from "./_helpers";
import { App } from "./App";
import env from "./../env";

//import rootReducer from "./rootReducer";

// setup fake backend
//import { configureFakeBackend } from './_helpers';
//configureFakeBackend();
if (env.env === 'dhlonprem') {
  console.log = () => {}
  console.error = () => {}
  console.debug = () => {}
}
render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("app")
);
