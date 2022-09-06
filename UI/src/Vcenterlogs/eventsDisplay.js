import React from "react";
import { Link } from "react-router-dom";
let tasksdata = [];
export default class EventDisplay extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    tasksdata = this.props.tasksdata;
    return (
      <div key="event_props">
        <h4>Events</h4>
        <table className="table">
          <thead>
            <tr>
              <th>EVENT_ID</th>
              <th>Name</th>
              <th>User Name</th>
              <th>CREATE_TIME</th>
              <th>HOST_NAME</th>
              <th>DATASTORE_NAME </th>
              <th>NETWORK_NAME</th>
            </tr>
          </thead>
          <tbody>
            {tasksdata.map(task => {
              return (
                <tr key={task.EVENT_ID}>
                  <td> {task.EVENT_ID}</td>
                  <td> {task.EVENT_TYPE}</td>
                  <td> {task.USERNAME}</td>
                  <td>{task.CREATE_TIME}</td>
                  <td>{task.HOST_NAME}</td>
                  <td>{task.DATASTORE_NAME}</td>
                  <td>{task.NETWORK_NAME}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}
