// React
import { useState, useEffect, useContext, useRef } from 'react';

// React Router
import { useLocation, useNavigate } from 'react-router-dom';

// Icons
import { BiSolidMessageError } from 'react-icons/bi';
import { FaUserCog } from 'react-icons/fa';

// Components
import Button from '../../components/Button';
import LoadingModal from '../../components/Modals/LoadingModal';
import EULAViewer from '../../components/EULAViewer/EULAViewer';

// Sass Styles
import '../../styles/components/EULAViewer/EULAViewer.scss';

// API Calls
import updateEULA, { IUpdateEULARequest } from '../../api_calls/updateEULA';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

interface TraditionalEULABadRequestProps {
    title: string | undefined;
    message: string | undefined;
}

const TraditionalEULABadRequest = ({
    title,
    message,
}: TraditionalEULABadRequestProps) => {
    if (title === undefined) {
        title = 'Bad Request';
    }

    if (message === undefined) {
        message =
            "We're sorry an unhandled error happened, please tray again at later time.";
    }

    return (
        <div className="traditional-eula">
            <div className="alarm-vision-logo">
                <FaUserCog />
            </div>
            <div className="alarm-vision-dialog">
                <div className="alarm-vision-dialog-title">
                    Evolon EULA - {title}
                </div>
                <div className="alarm-vision-dialog-content">
                    <div className="alarm-vision-dialog-content-message">
                        <span className="alarm-vision-dialog-content-icon">
                            <BiSolidMessageError />
                        </span>
                        <span className="alarm-vision-dialog-content-message">
                            {message}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TraditionalEULA = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const scrollRef = useRef<HTMLDivElement | null>(null);

    const userInfo = location.state?.user;
    const [isValidUser, setValidUser] = useState<boolean | undefined | null>(
        null
    );

    const [error, setError] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showEULA, setShowEULA] = useState<boolean>(true);
    const [showIAgreeBtn, setShowIAgreeBtn] = useState<boolean>(false);

    const { activeUser, setActiveUser, userLoggedIn, setUserLoggedIn } =
        useContext(AuthContext);

    useEffect(() => {
        setIsLoading(true);

        // Validate the user in query is valid
        if (userInfo !== undefined && userInfo !== null) {
            setValidUser(true);
            setIsLoading(false);
        } else {
            setValidUser(false);
            setIsLoading(false);
            return;
        }
    }, [userInfo]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const el = scrollRef.current;
            if (!el) return;

            const handleScroll = () => {
                const { scrollTop, scrollHeight, clientHeight } = el;

                // If scrolled to the bottom (with 5px buffer)
                if (scrollTop + clientHeight >= scrollHeight - 5) {
                    setShowIAgreeBtn(true);
                } else {
                    setShowIAgreeBtn(false);
                }
            };

            el.addEventListener('scroll', handleScroll);

            return () => {
                el.removeEventListener('scroll', handleScroll);
            };
        }, 3); // Delay to allow ref to be assigned

        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return <LoadingModal modalText="Please Wait while authorizing" />;
    }

    if (!isValidUser) {
        return (
            <TraditionalEULABadRequest
                title="Bad Parameter"
                message="The query parameter 'user' supplied was invalid."
            />
        );
    }

    if (error) {
        return (
            <div className="traditional-eula slide-down">
                <div
                    id="alarm-vision-dealer-subscribe"
                    className="alarm-vision-dialog"
                >
                    <div className="alarm-vision-dialog-title">Evolon EULA</div>
                    <div className="alarm-vision-dialog-content">
                        <div className="alarm-vision-dialog-content-form">
                            <span className="section-error">
                                Failed to subscribe : {error}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const onAcceptEULA = async () => {
        try {
            setIsLoading(true);

            const request: IUpdateEULARequest = {
                accepted_eula: true,
            };

            const updateEULAResponse = await updateEULA({
                user: userInfo,
                acceptedEULARequest: request,
            });

            if (updateEULAResponse) {
                sessionStorage.setItem('user', JSON.stringify(userInfo));
                setActiveUser(userInfo);
                setUserLoggedIn(true);
                // setShowEULA(false);

                setIsLoading(false);
                // Replaces current history entry with /home to prevent them from going back to /traditionaleula via back button
                navigate('/home', { replace: true });
            } else {
                setError(updateEULAResponse);
            }
        } catch (error: any) {
            if (error.description) {
                setError(error.description);
            } else if (error.code === 401) {
                setError(error.error);
                navigate('/', { replace: true });
            }
            setIsLoading(false);
        }
    };

    const onCancelEULA = () => {
        setShowEULA(false);
        setIsLoading(false);
        navigate('/', { replace: true });
    };

    if (showEULA) {
        return (
            <div
                id="evolon-insites-eula"
                className="traditional-eula slide-down"
            >
                <div
                    id="alarm-vision-dealer-eula"
                    className="alarm-vision-dialog"
                >
                    <div className="alarm-vision-dialog-title">Evolon EULA</div>
                    <div
                        className="alarm-vision-dialog-content"
                        ref={scrollRef}
                    >
                        <EULAViewer />
                    </div>
                    <div className="alarm-vision-dialog-footer">
                        <div className="alarm-vision-dialog-footer-top">
                            &nbsp;
                        </div>
                        <div className="alarm-vision-dialog-footer-left-bottom">
                            <Button
                                id="cancel"
                                className="btn danger"
                                onClick={onCancelEULA}
                                label="I DO NOT AGREE"
                            />
                        </div>
                        <div className="alarm-vision-dialog-footer-center-bottom">
                            &nbsp;
                        </div>

                        {showIAgreeBtn && (
                            <div className="alarm-vision-dialog-footer-right-bottom">
                                <Button
                                    id="accept-eula"
                                    className="btn primary"
                                    onClick={onAcceptEULA}
                                    label={'I AGREE'}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
};

export default TraditionalEULA;
