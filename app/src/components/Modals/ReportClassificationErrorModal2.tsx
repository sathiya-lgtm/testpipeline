/* eslint-disable jsx-a11y/label-has-associated-control */
// React
import {
    FC,
    FormEvent,
    useCallback,
    useEffect,
    useState,
    useContext,
    Dispatch,
    SetStateAction,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Third party
import { toast } from 'react-toastify';
import { SingleValue } from 'react-select';
import { useMutation } from '@tanstack/react-query';

// Custom
import extractErrorMessage from '../../utils/extractErrorMessage';
import handleHttpRequestError from '../../utils/handleHttpRequestError';
import reportClassificationErrorNew from '../../api_calls/reportClassificationErrorNew';

// Context
import { AuthContext } from '../../contexts/AuthProvider';

// Components
import ModalBase from '../ModalBase';
import Button from '../Button';
import Select from '../Inputs/Select';

// Types
import { IUser, SelectOption } from '../../types/interfaces';
import { INewForensicClip } from '../../types/tng-api.interfaces';

// Styles
import '../../styles/components/Modals/ReportClassificationErrorModal.scss';

interface IProps {
    handleClose: () => void;
    /** Should be filtered based on Audit Mode. */
    forensicSearchData: INewForensicClip[];
    setForensicSearchData: Dispatch<SetStateAction<INewForensicClip[]>>;
    accountName: string;
    siteName: string;
    cameraName: string;
    ai_error_comment: string | null;
    ai_error_event: string | null;
    file_id: number;
}

enum ClassificationError {
    MissedVehicle = 'Missed vehicle',
    MissedPerson = 'Missed person',
    NotAVehicle = 'Not a vehicle',
    NotAPerson = 'Not a person',
    StationaryVehicle = 'Stationary vehicle',
}

const classificationErrorOptions: SelectOption[] = [
    {
        label: 'Missed Vehicle',
        value: ClassificationError.MissedVehicle as string,
    },
    {
        label: 'Missed Person',
        value: ClassificationError.MissedPerson as string,
    },
    {
        label: 'Not a Vehicle',
        value: ClassificationError.NotAVehicle as string,
    },
    {
        label: 'Not a Person',
        value: ClassificationError.NotAPerson as string,
    },
    {
        label: 'Stationary Vehicle',
        value: ClassificationError.StationaryVehicle as string,
    },
];

/** Returns classificationErrorOption that corresponds with argument's value property.
 * Returns null if not found.
 */
const findClassificationErrorOption = (
    aClassificationError: string | null
): SelectOption | null =>
    classificationErrorOptions.find((e) => e.value === aClassificationError) ||
    null;

const ReportClassificationErrorModal2: FC<IProps> = ({
    handleClose,
    forensicSearchData,
    setForensicSearchData,
    accountName,
    siteName,
    cameraName,
    ai_error_comment,
    ai_error_event,
    file_id,
}) => {
    const navigate = useNavigate();
    const { activeUser, setActiveUser } = useContext(AuthContext);

    const [classificationError, setClassificationError] =
        useState<SingleValue<SelectOption> | null>(
            findClassificationErrorOption(ai_error_event || null)
        );
    const [comment, setComment] = useState<string>(ai_error_comment || '');
    const [commentError, setCommentError] = useState<string | null>(null);

    const classificationMutation = useMutation({
        mutationFn: reportClassificationErrorNew,
        onError: (err) => handleHttpRequestError(err, setActiveUser, navigate),
        onSuccess: ({
            ai_classification_error_comment,
            ai_classification_error_event,
            ai_classification_error_id,
        }) => {
            const targetIndex = forensicSearchData.findIndex(
                (item) => item.file_id === file_id
            );

            if (targetIndex >= 0) {
                setForensicSearchData((previousData) => {
                    const newData = [...previousData];

                    newData[targetIndex].ai_classification_error_comment =
                        ai_classification_error_comment;
                    newData[targetIndex].ai_classification_error_event =
                        ai_classification_error_event;
                    newData[targetIndex].ai_classification_error_id =
                        ai_classification_error_id;

                    return newData;
                });
            }

            toast.success('Successfully submitted classification error.');
        },
    });

    const validateReport = useCallback(
        (aComment: string, aClassificationError: string | undefined): void => {
            const errorMessage = [];

            if (!aClassificationError) {
                errorMessage.push('Must select a classification error.');
            }

            if (aComment.length > 500) {
                errorMessage.push('Comment cannot exceed 500 characters.');
            }

            if (errorMessage.length > 0) {
                throw new Error(errorMessage.join(' '));
            }
        },
        []
    );

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            validateReport(comment, classificationError?.value);

            classificationMutation.mutate({
                user: activeUser as IUser,
                classificationError: {
                    ai_classification_comment: comment,
                    ai_classification_event:
                        classificationError?.value as string,
                    file_id,
                },
            });

            handleClose();
        } catch (error) {
            setCommentError(extractErrorMessage(error));
        }
    };

    useEffect(() => {
        if (commentError) {
            setCommentError(null);
        }
    }, [comment]);

    return (
        <ModalBase
            title="Wrong Classification"
            handleClose={handleClose}
            zIndex={99}
        >
            <form
                className="ReportClassificationErrorModal"
                onSubmit={(e) => handleSubmit(e)}
            >
                <p>Was there a classification error?</p>
                <hr />
                <div className="select-container field">
                    <label htmlFor="correct-object-classification">
                        <span>Correct Object Classification</span>
                    </label>
                    <Select
                        id="correct-object-classification"
                        value={classificationError}
                        onChange={(option) => {
                            setClassificationError(
                                option as SingleValue<SelectOption>
                            );
                        }}
                        options={classificationErrorOptions}
                        placeholder="Select classification error..."
                        isClearable={false}
                        isSearchable={false}
                        required
                    />
                </div>
                <h3 className="camera-name">
                    {accountName} / {siteName} / {cameraName}
                </h3>
                <div className="info-container">
                    <p>
                        We will use this information to improve the accuracy of
                        our AI. Please provide any additional notes on the
                        event. Thank you!
                    </p>

                    {commentError && <p className="error">{commentError}</p>}
                </div>

                <textarea
                    id="comment-area"
                    name="comment-area"
                    data-testid="comment-area"
                    value={comment}
                    onChange={(e) => {
                        if (e.target.value.length > 500) {
                            return;
                        }

                        setComment(e.target.value);
                    }}
                />
                <p className="char-counter">{comment.length} / 500 </p>
                <div className="button-container">
                    <Button
                        id="create"
                        className="btn primary"
                        label="Confirm"
                        type="submit"
                        onClick={() => {}}
                    />
                    <Button
                        id="clear"
                        className="btn danger"
                        label="Cancel"
                        onClick={() => handleClose()}
                    />
                </div>
            </form>
        </ModalBase>
    );
};

export default ReportClassificationErrorModal2;
