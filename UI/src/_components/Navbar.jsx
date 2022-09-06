import React from "react";
import { Link } from "react-router-dom";
import { userActions } from "../_actions";

let text = localStorage.getItem("user") || "",
  user = text ? decryptResponse(text) : {};

export const Navbar = () => {
  if (user && user.token) {
    return text ? (
      <div>
        <nav id="sidebar">
          <div className="sidebar-header">
            <img src="./src/css/cloud4c_logo.png" style={{ width: "150px" }} />
          </div>

          <ul className="list-unstyled components">
            <p>Customer Portal</p>
            <li className="active">
              <a href="/">Home</a>
            </li>
            <li>
              <a
                href="#IPAMview"
                data-toggle="collapse"
                aria-expanded="false"
                className="dropdown-toggle"
              >
                <i className="fa fa-list" /> IPAM
              </a>
              <ul className="collapse list-unstyled" id="IPAMview">
                <li>
                  <a href="/#/ipam">Public IPAM</a>
                </li>
                <li>
                  <a href="/#/privateipam">Private IPAM</a>
                </li>
              </ul>
            </li>
            <li>
              <a href="/#/vcentermgmt">
                <i className="fa fa-location-arrow" />
                VCenter Mgmt
              </a>
            </li>
            <li>
              <a href="/#/datastore">
                <i className="fa fa-hdd" />
                Datastores
              </a>
            </li>
            <li>
              <a href="/#/esximgmt">
                <i className="fa fa-dot-circle" /> Esxi Host Details
              </a>
            </li>
            <li>
              <a href="/#/users">
                <i className="fa fa-users" /> User Mgmt
              </a>
            </li>
            <li>
              <a href="/#/profiles">
                <i className="fa fa-user-cog" /> Profile Mgmt
              </a>
            </li>
            <li>
              <a href="/#/ostemplates">
                <i className="fa fa-inbox" />
                OS Templates
              </a>
            </li>
            <li>
              <a href="/#/networkmgmt">
                <i className="fa fa-sitemap" /> Network Mgmt
              </a>
            </li>
            <li>
              <a href="/#/vmlist">
                <i className="fa fa-cloud" /> Manage VM's
              </a>
            </li>
              <li>
              <a href="/#/support">
                <i className="fa fa-help" /> Support
              </a>
            </li>
            <li>
              <a href="/#/vcenterlogs">
                <i className="fa fa-history" />
                Vcenter logs
              </a>
            </li>
            <li>
              <a
                href="#monitoring"
                data-toggle="collapse"
                aria-expanded="false"
                className="dropdown-toggle"
              >
                <i className="fa fa-square" /> Monitoring
              </a>
              <ul className="collapse list-unstyled" id="monitoring">
                <li>
                  <a href="/#/monitoringdashboard">Monitoring Dashboard</a>
                </li>
                <li>
                  <a href="/#/monitoringmetrics">Monitoring Key Metrics</a>
                </li>
                <li>
                  <a href="/#/monitoringalerts">Monitoring Alerts</a>
                </li>
              </ul>
            </li>
            <li>
              <a
                href="#settings"
                data-toggle="collapse"
                aria-expanded="false"
                className="dropdown-toggle"
              >
                <i className="fa fa-cog" /> Settings
              </a>
              <ul className="collapse list-unstyled" id="settings">
                <li>
                  <a href="/#/emailsettings">Email Settings</a>
                </li>
              </ul>
            </li>

            <li>
              <a onClick={() => userActions.logout()}>
                <i className="fa fa-power-off" />
                Logout
              </a>
            </li>
          </ul>
        </nav>
      </div>
    ) : (
      ""
    );
  } else {
    return <div />;
  }
};
