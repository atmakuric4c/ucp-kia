import React, {Component} from "react";

export default class PageLoader extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="text-center">
                {/* <i className="fas fa-circle-notch icon-page-loading"></i> */}
                {/* <i className="fas fa-spinner icon-page-loading "></i> */}
                <i className="fab fa-cloudscale icon-page-loading"></i>
            </div>
        );
    }
};