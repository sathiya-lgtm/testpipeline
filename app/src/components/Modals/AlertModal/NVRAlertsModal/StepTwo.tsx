// React
import React, { Dispatch, SetStateAction, FC } from 'react';

// Third party
import { SingleValue } from 'react-select';

// Components
import Input from '../../../Inputs/Input';

// Types
import { SelectOption } from '../../../../types/interfaces';

interface IStepTwoProps {
    selectedCustomer: SingleValue<SelectOption> | null;
    selectedSite: SingleValue<SelectOption> | null;
    immixHost: string;
    setImmixHost: Dispatch<SetStateAction<string>>;
    immixSMTPPort: string;
    setImmixSMTPPort: Dispatch<SetStateAction<string>>;
    immixSiteNumber: string;
    setImmixSiteNumber: Dispatch<SetStateAction<string>>;
    immixSMTPDomain: string;
    setImmixSMTPDomain: Dispatch<SetStateAction<string>>;
}

const StepTwo: FC<IStepTwoProps> = ({
    selectedCustomer,
    selectedSite,
    immixHost,
    setImmixHost,
    immixSMTPPort,
    setImmixSMTPPort,
    immixSiteNumber,
    setImmixSiteNumber,
    immixSMTPDomain,
    setImmixSMTPDomain,
}) => {
    return (
        <div>
            <p>
                Fill out the following info then click &quot;Download Alert
                Template&quot; to go to the next step.
            </p>
            {selectedCustomer && selectedSite && (
                <div className="nvr-site-info">
                    <p>
                        <span className="text-secondary">
                            Selected Customer:{' '}
                        </span>
                        {selectedCustomer.label}
                    </p>
                    <p>
                        <span className="text-secondary">Selected Site: </span>{' '}
                        {selectedSite.label}
                    </p>
                </div>
            )}

            <div className="field">
                <Input
                    name="alertNameInput"
                    className="input"
                    label="Immix Host"
                    type="text"
                    value={immixHost}
                    onChange={setImmixHost}
                    required
                />
            </div>
            <div className="field">
                <Input
                    name="alertNameInput"
                    className="input"
                    label="Immix SMTP Port"
                    type="text"
                    value={immixSMTPPort}
                    onChange={setImmixSMTPPort}
                    required
                />
            </div>
            <div className="field">
                <Input
                    name="alertNameInput"
                    className="input"
                    label="Immix Site Number (number only)"
                    type="number"
                    value={immixSiteNumber}
                    onChange={setImmixSiteNumber}
                    required
                />
            </div>
            <div className="field">
                <Input
                    name="alertNameInput"
                    className="input"
                    label="Immix SMTP Domain"
                    type="text"
                    value={immixSMTPDomain}
                    onChange={setImmixSMTPDomain}
                    required
                />
            </div>
        </div>
    );
};

export default StepTwo;
