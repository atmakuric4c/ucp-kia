import React, {Component} from "react";

class AutoSessionOut extends Component {
    constructor(props) {
        super(props);
        
        this.events = [
            "load",
            "mousemove",
            "mousedown",
            "click",
            "scroll",
            "keypress"
        ];
        
        this.createSession = this.createSession.bind(this);
        this.callSessionExpire = this.callSessionExpire.bind(this);
            
        for (var i in this.events) {
            window.addEventListener(this.events[i], this.createSession);
        }
        
        this.createSession();

        setInterval(() => 
        this.callSessionExpire() , 
        1000);
    }
    
    clearTimeout() {
        if (this.logoutTimeout) clearTimeout(this.logoutTimeout);
    }

    callSessionExpire(){
        let lastSessionTime = new Date(localStorage.getItem("lastSessionTime"));

        let defaultMins = parseInt((this.props.timeOut ? this.props.timeOut : 5));

        lastSessionTime.setMinutes(lastSessionTime.getMinutes() + defaultMins);

        let currentTime = new Date();

        if(currentTime > lastSessionTime){
            this.props.sessionOutEvent.fnSessionLogout();
        }
    }

    createSession() {
        var dt = new Date();
        localStorage.setItem("lastSessionTime", dt);
    }
    
    render (){
        return(
            <React.Fragment>
            </React.Fragment>
        )
    }
};

export default AutoSessionOut;