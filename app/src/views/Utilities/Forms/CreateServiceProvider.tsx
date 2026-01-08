/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import React, {
    ReactElement,
    FC,
    useState,
    useCallback,
    Dispatch,
    SetStateAction,
    useEffect,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

// Custom
import handleHttpRequestError from '../../../utils/handleHttpRequestError';
import { validateServiceProviderSubmission } from '../Utilities.controller';
import extractErrorMessage from '../../../utils/extractErrorMessage';
import createServiceProvider from '../../../api_calls/createServiceProvider';

// Components
import Input from '../../../components/Inputs/Input';
import Button from '../../../components/Button';

// Custom types
import { IUser } from '../../../types/interfaces';
import { AccountTypeModifier } from '../../../types/enums';
import ButtonGroup, { ButtonGroupAlignment } from '../../../components/ButtonGroup/ButtonGroup';

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
}

/**
 * Form for creating Service Providers.
 * @returns {ReactElement}
 */
const CreateServiceProvider: FC<IProps> = ({
    activeUser,
    setActiveUser,
}: IProps): ReactElement => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [name, setName] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleClear = useCallback(() => {
        setName('');
    }, []);

    const onSuccess = useCallback((): void => {
        handleClear();

        // Resets cache for Service Providers query.
        queryClient.invalidateQueries({
            queryKey: ['service-providers'],
        });

        toast.success(`Service Provider: ${name}, successfully added.`);
    }, [name]);

    const mutation = useMutation({
        mutationFn: createServiceProvider,
        onError: (err: any) =>
            handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess,
    });

    const onSubmit = (e: any) => {
        e.preventDefault();

        try {
            validateServiceProviderSubmission(name);
        } catch (error) {
            setErrorMessage(extractErrorMessage(error));

            // Exit prematurely if error.
            return;
        }

        mutation.mutate({
            user: activeUser,
            createServiceProviderData: {
                name,
                form: 'Create-Service-Provider-Account',
            },
        });
    };

    useEffect(() => {
        // Reset error message whenever user updates form.
        setErrorMessage(null);
    }, [name]);

    return (
        <motion.form
            id="CreateServiceProvider"
            key="CreateServiceProvider"
            autoComplete="off"
            onSubmit={onSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            <h3 id="title">
                <span>Create Service Provider</span>
            </h3>
            {errorMessage && <p className="error">{errorMessage}</p>}
            <Input
                id="service-provider-name"
                name="service-provider-name"
                label="Service Provider Name"
                className="input field"
                autoComplete="off"
                type="text"
                value={name}
                onChange={setName}
                required
            />
            <ButtonGroup alignment={ButtonGroupAlignment.bottomright}>
                <Button
                    id="clear"
                    className="btn danger"
                    label="Clear"
                    onClick={() => handleClear()}
                />
                <Button
                    id="create"
                    className="btn primary"
                    label="Save"
                    type="submit"
                    disabled={activeUser?.modifier?.includes(
                        AccountTypeModifier.ReadOnly
                    )}
                />
            </ButtonGroup>
        </motion.form>
    );
};

export default CreateServiceProvider;
