/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import React, { Dispatch, SetStateAction, FC } from 'react';

// React-Router-Dom
import { Link } from 'react-router-dom';

// Third party
import { SingleValue, MultiValue } from 'react-select';

// Components
import Select from '../../../Inputs/Select';

// Types
import { SelectOption } from '../../../../types/interfaces';
import { AccountType } from '../../../../types/enums';

interface IStepOneProps {
    accountType: AccountType;
    serviceProviderOptions: SelectOption[];
    selectedServiceProvider: SingleValue<SelectOption> | null;
    setSelectedServiceProvider: Dispatch<
        SetStateAction<SingleValue<SelectOption> | null>
    >;
    defaultServiceProvider: SelectOption | null;
    customerOptions: SelectOption[];
    selectedCustomer: SingleValue<SelectOption> | null;
    handleCustomerSelect: (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ) => Promise<void>;
    defaultCustomer: SelectOption | null;
    siteOptions: SelectOption[];
    selectedSite: SingleValue<SelectOption> | null;
    handleSiteSelect: (
        selectOption: MultiValue<SelectOption> | SingleValue<SelectOption>
    ) => void;
}

const StepOne: FC<IStepOneProps> = ({
    accountType,
    serviceProviderOptions,
    selectedServiceProvider,
    setSelectedServiceProvider,
    defaultServiceProvider,
    customerOptions,
    selectedCustomer,
    handleCustomerSelect,
    defaultCustomer,
    siteOptions,
    selectedSite,
    handleSiteSelect,
}) => {
    return (
        <div>
            <p>
                Select a customer and NVR site to create the alerts for. These
                alerts will be applied to all the cameras found on that site. If
                you can&apos;t find the site, create one{' '}
                <Link to="/utilities?menu=create-site" className="nav-link">
                    here.
                </Link>
            </p>
            {accountType === AccountType.Evolon && (
                <div className="select-container field">
                    <label htmlFor="service-providers">
                        <span>Service Provider</span>
                        <span className="asterisk">*</span>
                    </label>
                    <Select
                        id="service-providers"
                        value={selectedServiceProvider}
                        onChange={(option) => {
                            setSelectedServiceProvider(
                                option as SingleValue<SelectOption>
                            );
                        }}
                        options={serviceProviderOptions}
                        isClearable={false}
                        disabled={defaultServiceProvider !== null}
                        required
                    />
                </div>
            )}

            {accountType !== AccountType.Customer && (
                <div className="select-container field">
                    <label htmlFor="customers">
                        <span>Customer</span>
                        <span className="asterisk">*</span>
                    </label>
                    <Select
                        id="customers"
                        value={selectedCustomer}
                        onChange={handleCustomerSelect}
                        placeholder="None"
                        options={customerOptions}
                        isClearable={defaultCustomer === null}
                        disabled={defaultCustomer !== null}
                        noOptionsMessage="A Service Provider with registered Customers must be selected first."
                        required
                    />
                </div>
            )}

            <div className="select-container field">
                <label htmlFor="customers">
                    <span>NVR Sites</span>
                    <span className="asterisk">*</span>
                </label>
                <Select
                    id="site-select"
                    value={selectedSite}
                    onChange={handleSiteSelect}
                    options={siteOptions}
                    required
                />
            </div>
        </div>
    );
};

export default StepOne;
