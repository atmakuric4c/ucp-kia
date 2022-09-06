import React from 'react';
import { authHeader, ucpEncrypt, ucpDecrypt } from '../../_helpers';
import config from 'config';
import Modal from "react-modal";

import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from 'react-accessible-accordion';

import 'react-accessible-accordion/dist/fancy-example.css';
import './../../css/faq.css';


Modal.setAppElement("#app");
class faqs extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cyberarkList: [],
      is_loading: false
    };
    this.filterData = this.filterData.bind(this);
  }

  filterData = (aEvent) => {
    let mainData = this.state.mainData,
      value = aEvent.target.value, faqs;

    if (value) {
      faqs = (mainData || []).filter(faq => {
        return faq.question.toLowerCase().includes(value.toLowerCase()) || faq.answer.toLowerCase().includes(value.toLowerCase())
      });
    }else{
    	faqs = JSON.parse(JSON.stringify(mainData));
    }

    this.setState({ faqs: faqs })//faqs.slice(0, 10)
  }

  componentDidMount() {
    const requestOptions = {
      method: 'GET',
      headers: { ...authHeader(), 'Content-Type': 'application/json' }
    }, self = this;

    fetch(`${config.apiUrl}/secureApi/getfaqs`, requestOptions).then(response => {
      response.text().then(text => {
        try {
          text = JSON.parse(ucpDecrypt(JSON.parse(text)));
        }
        catch (e) {
          text = { data: [] };
        }
        text = text.data;
        self.setState({ mainData: text, faqs: text }); //text.slice(0, 10)
      });
    });
  }

  render() {
    let { faqs = [] } = this.state;

    return <React.Fragment>
      <div className='faq d-flex justify-content-center flex-column align-items-center'>
        <h5 className="color sub-heading py-2">
          How can we help you?
        </h5>
        <input className='w-75 search-input mb-2' type="text" placeholder='Describe your issue' name="search" id="search" onChange={this.filterData} />
        <Accordion>

          {(faqs || []).map((faq, indx) => {
            return <AccordionItem key={"faq-" + indx}>
              <AccordionItemHeading>
                <AccordionItemButton>
                  {/* {indx + 1}.  */}{faq.question}
                </AccordionItemButton>
              </AccordionItemHeading>
              <AccordionItemPanel>
                <div>
                  <div dangerouslySetInnerHTML={{__html: faq.answer}} />
                </div>
              </AccordionItemPanel>
            </AccordionItem>
          })}
        </Accordion>
      </div>
    </React.Fragment>
  }
}

export { faqs as faqs };