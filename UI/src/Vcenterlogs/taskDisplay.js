import React from "react";
import { Link } from "react-router-dom";
let tasksdata = [];
export default class TaskDisplay extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    tasksdata = this.props.tasksdata;
    return (
      <div key="task_props">
        <h4>TASKS </h4>
        <table className="table">
          <thead>
            <tr>
              <th>Taskid</th>
              <th>Name</th>
              <th>User Name</th>
              <th>Complete State</th>
              <th>start time</th>
              <th>Complete Time</th>
              <th>End Time</th>
            </tr>
          </thead>
          <tbody>
            {tasksdata.map(task => {
              return (
                <tr key={task.TASK_ID}>
                  <td> {task.TASK_ID}</td>
                  <td> {task.NAME}</td>
                  <td> {task.USERNAME}</td>
                  <td>{task.COMPLETE_STATE}</td>
                  <td>{task.START_TIME}</td>
                  <td>{task.COMPLETE_TIME}</td>
                  <td>{task.USERNAME}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}
