import React from 'react';
import { Route, Redirect } from 'react-router-dom';

let user = (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : "");
export const PrivateRoute = ({ component: Component, ...rest }) => (
    
    <Route {...rest} render={props => (
        user
            ? (
                (user.data.is_password_expired == 0 || props.location.pathname.indexOf("resetpassword") != -1)?
                
                (
                    (user.data.is_password_expired == 0 && props.location.pathname.indexOf("resetpassword") != -1)?
                    <Redirect to={{ pathname: '/', state: { from: props.location } }} />
                    :
                    <Component {...props} />
                    
                )
                :<Component {...props} />
                //false && <Redirect to={{ pathname: '/resetpassword', state: { from: props.location } }} />
            )  
            : <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
    )} />
)