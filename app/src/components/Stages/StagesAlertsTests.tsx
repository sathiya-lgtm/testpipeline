// React
import { FC, useContext, useState, useMemo } from 'react';

// Third Party
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { isAxiosError } from 'axios';

// Api Calls
import sosAlertTest from '../../api_calls/sosAlertTest';
import sosCancelTest from '../../api_calls/sosCancelTest';
import sendStagesPersonEventTest from '../../api_calls/sendStagesPersonEventTest';
import sendStagesVehicleEventTest from '../../api_calls/sendStagesVehicleEventTest';
import sendStagesPersonAndVehicleEventTest from '../../api_calls/sendStagesPersonAndVehicleEventTest';
import sendStagesLoiteringEventTest from '../../api_calls/sendStagesLoiteringEventTest';

// Components
import LoadingModal from '../Modals/LoadingModal';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Types
import { AlertTestResult } from '../../views/Utilities/Forms/DispatchServiceConfiguration';

// Styles
import '../../styles/components/Stages/StagesAlertsTests.scss';

const handleAxiosError = (err: any) => {
    if (isAxiosError(err)) {
        const errorMessage = err.response?.data.details.description;

        if (errorMessage) {
            toast.error(errorMessage);
        }

        toast.error('Error with no description occurred');
    } else {
        toast.error('An Unknown error occurred.');
    }
};

interface IProps {
    customerAccountId: number;
    siteId: number;
}

const StagesAlertsTests: FC<IProps> = ({ customerAccountId, siteId }) => {
    const { activeUser } = useContext(AuthContext);

    const [alertTestResults, setAlertTestResults] = useState<{
        sos: AlertTestResult;
        sosCancel: AlertTestResult;
        personEvent: AlertTestResult;
        vehicleEvent: AlertTestResult;
        personVehicleEvent: AlertTestResult;
        loiteringEvent: AlertTestResult;
    }>({
        sos: 'not tested',
        sosCancel: 'not tested',
        personEvent: 'not tested',
        vehicleEvent: 'not tested',
        personVehicleEvent: 'not tested',
        loiteringEvent: 'not tested',
    });

    const sosAlertTestMutation = useMutation({
        mutationFn: sosAlertTest,
    });

    const sosCancelTestMutation = useMutation({
        mutationFn: sosCancelTest,
    });

    const personEventTestMutation = useMutation({
        mutationFn: sendStagesPersonEventTest,
    });

    const vehicleEventTestMutation = useMutation({
        mutationFn: sendStagesVehicleEventTest,
    });

    const personVehicleEventTestMutation = useMutation({
        mutationFn: sendStagesPersonAndVehicleEventTest,
    });

    const loiteringEventTestMutation = useMutation({
        mutationFn: sendStagesLoiteringEventTest,
    });
    const testSOSAlert = async () => {
        if (!activeUser) {
            return;
        }

        let testStatus: AlertTestResult = 'failed';

        try {
            const result = await sosAlertTestMutation.mutateAsync({
                user: activeUser,
                account_id: customerAccountId,
                site_id: siteId,
            });

            if (result.response.success) {
                testStatus = 'passed';
                toast.success('SOS Test Sent');
            }
        } catch (err) {
            handleAxiosError(err);
        }

        setAlertTestResults((previousState) => {
            return { ...previousState, sos: testStatus };
        });
    };

    const testCancelSOSAlert = async () => {
        if (!activeUser) {
            return;
        }

        let testStatus: AlertTestResult = 'failed';

        try {
            const result = await sosCancelTestMutation.mutateAsync({
                user: activeUser,
                account_id: customerAccountId,
                site_id: siteId,
            });

            if (result.response.success) {
                testStatus = 'passed';
                toast.success('Cancel SOS Test Sent');
            }
        } catch (err) {
            handleAxiosError(err);
        }

        setAlertTestResults((previousState) => {
            return { ...previousState, sosCancel: testStatus };
        });
    };

    const sendVehicleEventTest = async () => {
        if (!activeUser) {
            return;
        }

        let testStatus: AlertTestResult = 'failed';

        try {
            const result = await vehicleEventTestMutation.mutateAsync({
                user: activeUser,
                account_id: customerAccountId,
                site_id: siteId,
            });

            if (result.response.success) {
                testStatus = 'passed';
                toast.success('Vehicle Event Test Sent');
            }
        } catch (err) {
            handleAxiosError(err);
        }

        setAlertTestResults((previousState) => {
            return { ...previousState, vehicleEvent: testStatus };
        });
    };

    const sendPersonEventTest = async () => {
        if (!activeUser) {
            return;
        }

        let testStatus: AlertTestResult = 'failed';

        try {
            const result = await personEventTestMutation.mutateAsync({
                user: activeUser,
                account_id: customerAccountId,
                site_id: siteId,
            });

            if (result.response.success) {
                testStatus = 'passed';
                toast.success('Person Event Test Sent');
            }
        } catch (err) {
            handleAxiosError(err);
        }

        setAlertTestResults((previousState) => {
            return { ...previousState, personEvent: testStatus };
        });
    };

    const sendPersonVehicleEventTest = async () => {
        if (!activeUser) {
            return;
        }

        let testStatus: AlertTestResult = 'failed';

        try {
            const result = await personVehicleEventTestMutation.mutateAsync({
                user: activeUser,
                account_id: customerAccountId,
                site_id: siteId,
            });

            if (result.response.success) {
                testStatus = 'passed';
                toast.success('Person And Vehicle Event Test Sent');
            }
        } catch (err) {
            handleAxiosError(err);
        }

        setAlertTestResults((previousState) => {
            return { ...previousState, personVehicleEvent: testStatus };
        });
    };

    const sendLoiteringEventTest = async () => {
        if (!activeUser) {
            return;
        }

        let testStatus: AlertTestResult = 'failed';

        try {
            const result = await loiteringEventTestMutation.mutateAsync({
                user: activeUser,
                account_id: customerAccountId,
                site_id: siteId,
            });

            if (result.response.success) {
                testStatus = 'passed';
                toast.success('Loitering Event Test Sent');
            }
        } catch (err) {
            handleAxiosError(err);
        }

        setAlertTestResults((previousState) => {
            return { ...previousState, loiteringEvent: testStatus };
        });
    };

    const sendAllTestAlerts = async () => {
        try {
            await Promise.all([
                testSOSAlert(),
                testCancelSOSAlert(),
                sendPersonEventTest(),
                sendVehicleEventTest(),
                sendPersonVehicleEventTest(),
                sendLoiteringEventTest(),
            ]);
        } catch (error) {
            console.log(error);
            toast.error('Unable to send test alerts');
        }
    };

    const loadingText = useMemo(() => {
        if (sosAlertTestMutation.isLoading) {
            return 'Sending sos test...';
        }

        if (sosCancelTestMutation.isLoading) {
            return 'Sending cancel sos test...';
        }

        if (personEventTestMutation.isLoading) {
            return 'Sending person event test...';
        }

        if (vehicleEventTestMutation.isLoading) {
            return 'Sending vehicle event test...';
        }

        if (personVehicleEventTestMutation.isLoading) {
            return 'Sending person and vehicle event test...';
        }

        if (loiteringEventTestMutation.isLoading) {
            return 'Sending person event test...';
        }

        return '';
    }, [
        sosAlertTestMutation,
        sosCancelTestMutation,
        personEventTestMutation,
        vehicleEventTestMutation,
        loiteringEventTestMutation,
    ]);
    return (
        <>
            <div className="stagesAlertsTestsContainer">
                <div>
                    <h3>Alert Tests</h3>
                    <div className="alertResultRow">
                        <p>
                            <span className="label">SOS:</span>{' '}
                            {alertTestResults.sos}
                        </p>
                        <button
                            type="button"
                            className="btn sm primary outline rounded"
                            onClick={testSOSAlert}
                        >
                            Test SOS
                        </button>
                    </div>
                    <div className="alertResultRow">
                        <p>
                            <span className="label">SOS Cancel:</span>{' '}
                            {alertTestResults.sosCancel}
                        </p>
                        <button
                            type="button"
                            className="btn sm primary outline rounded"
                            onClick={testCancelSOSAlert}
                        >
                            Test Cancel SOS
                        </button>
                    </div>

                    <div className="alertResultRow">
                        <p>
                            <span className="label">Person Event:</span>{' '}
                            {alertTestResults.personEvent}
                        </p>
                        <button
                            type="button"
                            className="btn sm primary outline rounded"
                            onClick={sendPersonEventTest}
                        >
                            Test Person Event
                        </button>
                    </div>

                    <div className="alertResultRow">
                        <p>
                            <span className="label">Vehicle Event:</span>{' '}
                            {alertTestResults.vehicleEvent}
                        </p>
                        <button
                            type="button"
                            className="btn sm primary outline rounded"
                            onClick={sendVehicleEventTest}
                        >
                            Test Vehicle Event
                        </button>
                    </div>

                    <div className="alertResultRow">
                        <p>
                            <span className="label">
                                Test Person-Vehicle Event:
                            </span>{' '}
                            {alertTestResults.personVehicleEvent}
                        </p>
                        <button
                            type="button"
                            className="btn sm primary outline rounded"
                            onClick={sendPersonVehicleEventTest}
                        >
                            Test Person-Vehicle Event
                        </button>
                    </div>

                    <div className="alertResultRow">
                        <p>
                            <span className="label">Loitering Event:</span>{' '}
                            {alertTestResults.loiteringEvent}
                        </p>
                        <button
                            type="button"
                            className="btn sm primary outline rounded"
                            onClick={sendLoiteringEventTest}
                        >
                            Test Loitering Event
                        </button>
                    </div>
                </div>

                <button
                    className="btn primary"
                    type="button"
                    onClick={sendAllTestAlerts}
                >
                    Test All Alerts
                </button>
            </div>
            {loadingText && <LoadingModal modalText={loadingText} />}
        </>
    );
};

export default StagesAlertsTests;
