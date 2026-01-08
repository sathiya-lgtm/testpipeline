// React
import React, { FC, useEffect } from 'react';

// Third party
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';

// Custom
import extractErrorMessage from '../../../utils/extractErrorMessage';

// Components
import ModalBase from '../../ModalBase';

// Api Calls
import getAbout from '../../../api_calls/getAbout';

// Icons
import InsitesIcon from '../../../images/icons/Insites_Logo_white_and_green.svg?react';

// Styles
import '../../../styles/components/Modals/About.scss';

interface IProps {
    handleClose: () => void;
}

const toastId: string = 'about-info-error';

const About: FC<IProps> = ({ handleClose }) => {
    const { data, isError, isLoading, error } = useQuery({
        queryKey: ['about-info'],
        queryFn: () => getAbout(),
        staleTime: 300000,
        cacheTime: 300000,
    });

    useEffect(() => {
        if (isError) {
            console.error(extractErrorMessage(error));

            toast.error(
                'There was an issue when retrieving version. Try again later.',
                { toastId }
            );
        }
    }, [isError]);

    return (
        <ModalBase
            title={<InsitesIcon className="insites-logo-about-modal" />}
            handleClose={handleClose}
        >
            <div className="about-modal">
                {data && (
                    <h4>
                        <span className="label">Insites Version:</span>{' '}
                        <span className="value">{data.version}</span>
                    </h4>
                )}

                <h4>
                    <span className="label">UI Version:</span>{' '}
                    <span className="value">2.5.0.12</span>
                </h4>

                {isLoading && (
                    <Skeleton
                        borderRadius={0}
                        baseColor="#ebebeb3b"
                        highlightColor="#f5f5f59b"
                    />
                )}
                {isError && (
                    <span className="error">Failed to retrieve version</span>
                )}
            </div>
        </ModalBase>
    );
};

export default About;
