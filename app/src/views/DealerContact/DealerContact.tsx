import { FC } from 'react';
import { Link } from 'react-router-dom';

// Third party
import { PiHeadset } from 'react-icons/pi';

// Styles
import '../../styles/components/DealerContact/DealerContact.scss';

const DealerContact: FC = () => {
    return (
        <div className="dealer-contact">
            <div className="dealer-contact-header">
                <h3>Let's talk</h3>
                <p>
                    Need support or have a question about Evolon? We're here to
                    help.
                </p>
            </div>
            <div className="dealer-contact-body">
                <div className="dealer-contact-section">
                    <div className="support-icon-div">
                        <PiHeadset className="bisupport-icon" />
                    </div>
                    <h3>Evolon Technical Support</h3>
                    <p>Speak to a human today.</p>
                    <p>(469)-501-7500 | support@evolontech.com</p>
                    <p>8:00 AM to 5:00 PM Central</p>
                    <div className="submit-ticket">
                        <Link
                            to="https://evolontech.freshdesk.com/support/tickets/new"
                            target="_blank"
                            className="btn ticket-raise"
                        >
                            Submit a Ticket
                        </Link>
                    </div>
                </div>
                <div className="dealer-contact-section">
                    <div className="support-icon-div">
                        <PiHeadset className="bisupport-icon" />
                    </div>
                    <h3>Evolon Monitoring Operations Center</h3>
                    <h4>Video Operations Team</h4>
                    <p>(855) 770-3181</p>
                    <p>Hours: 24 x 7 </p>
                    <br />
                    <h4>Dealer Support </h4>
                    <p>(855) 756-5558</p>
                    <p>Monday - Friday: 8:30AM to 5:00PM Central </p>
                    <br />
                    <h4>Data Entry</h4>
                    <p>(866) 968-2909</p>
                    <p>Monday - Friday: 7:00AM to 7:00PM Central</p>
                    <p>Saturday: 8:00AM to 3:00PM Central</p>
                    <br />
                    <p>
                        Dealers may provide customers with the phone number for
                        the Video Operations Team ((855) 770-3181 or (800)
                        299-9900) to cancel an alarm or report a false alarm.
                    </p>
                    <p>
                        It is recommended to put these numbers in your phone as
                        contacts.
                    </p>
                    <p>
                        All other incoming calls (except emergency service
                        calls) will be directed to call the dealer office number
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DealerContact;
