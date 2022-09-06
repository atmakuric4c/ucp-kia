import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { Bar } from 'react-chartjs-2';

Modal.setAppElement("#app");
class BarChart extends React.Component {
    constructor(props) {
        super(props);
       
        let user = JSON.parse(localStorage.getItem("user"));
        
        this.state = {
            user:user.data,
            clientid: user.data.clientid,
            user_id: user.data.id,
            ticketDetail:[],
            modalIsOpen:false,
            data: this.props.chartData
        };
    }

    render() {
        return (
           
                <Bar
                    data = {this.state.data}

                    options = {{
                        legend: {
                            labels: {
                                fontColor: 'white',
                                fontSize: 14
                            },
                        },
                        scales: {
                            yAxes: [{
                                ticks: {
                                    fontColor: 'white',
                                    fontSize: 14,
                                    beginAtZero: true
                                },
                            }],
                          xAxes: [{
                                ticks: {
                                    fontColor: 'white',
                                    fontSize: 14,
                                    beginAtZero: true
                                },
                            }]
                        } 
                    }}
                />
        );
        }
    }

    function mapStateToProps(state) {
        const { billing } = state;
        return {
            billing:billing
        };
    }

    export default connect(mapStateToProps)(BarChart);
