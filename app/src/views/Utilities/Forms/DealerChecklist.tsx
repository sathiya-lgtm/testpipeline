import {
    Dispatch,
    FC,
    ReactElement,
    SetStateAction,
    useEffect,
    useState,
} from 'react';

// Third party
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';

// Custom
import getDealerChecklist from '../../../api_calls/getDealerChecklist';
import getManagedDealers from '../../../api_calls/getManagedDealers';

// Controller
import {
    timeOptions,
    timeOptionsWithEndOfDay,
} from '../../../components/Scheduling/ScheduleModal.controller';

// Components
import Input from '../../../components/Inputs/Input';
import Button from '../../../components/Button';
import ButtonGroup, {
    ButtonGroupAlignment,
} from '../../../components/ButtonGroup/ButtonGroup';
import EditDealerProfileModal from '../../../components/Modals/EditDealerProfileModal';
import DealerManagementTable from '../../../components/Tables/DealerManagementTable';
import DealerProfileTable from '../../../components/Tables/DealerProfileTable';
import LoadingModal from '../../../components/Modals/LoadingModal';

// Utils
import { convertPhoneNumberToFormattedVersion } from '../../../utils/convertPhoneNumberToFormattedVersion';

// Icons
import EvolonLogo from '../../../images/logo/evolon_professional_video_monitoring.png';

// Custom types
import { IUser } from '../../../types/interfaces';
import {
    IAPIDealerChecklist,
    IDealerList,
} from '../../../types/tng-api.interfaces';
import { AccountType } from '../../../types/enums';

// Styles
import '../../../styles/components/DealerChecklist.scss';

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    accountType: AccountType;
}

const DealerChecklist: FC<IProps> = ({
    activeUser,
    setActiveUser,
    accountType,
}: IProps): ReactElement => {
    const [dealerSearch, setDealerSearch] = useState<string>('');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [isDealerChecklistModalOpen, setIsDealerChecklistModalOpen] =
        useState<boolean>(false);

    const [dealerListData, setDealerListData] = useState<IDealerList[]>([]);
    const [filteredDealerListData, setFilteredDealerListData] = useState<
        IDealerList[]
    >([]);
    const [showDealerTable, setShowDealerTable] = useState<boolean>(false);
    const [showDealerProfile, setShowDealerProfile] = useState<boolean>(false);
    const [showDealerProfileInfo, setShowDealerProfileInfo] =
        useState<boolean>(false);

    const [dealerChecklistFormData, setDealerChecklistFormData] =
        useState<IAPIDealerChecklist>();
    const [dealerChecklistId, setDealerChecklistId] = useState<string>('me');
    const [dealerProfileData, setDealerProfileData] = useState<
        IAPIDealerChecklist[]
    >([]);

    const getDealerProfileMutation = useMutation({
        mutationFn: getDealerChecklist,
    });

    const getDealerProfileAPICall = async (
        requestFor: string,
        dealerId?: string
    ): Promise<IAPIDealerChecklist> => {
        const dealerProfileDetails = await getDealerProfileMutation.mutateAsync(
            {
                user: activeUser,
                dealerId: dealerId,
            }
        );

        if (requestFor === 'View') {
            if (dealerProfileDetails.isDealerProfileAvailable) {
                setDealerProfileData([dealerProfileDetails]);
                setShowDealerProfileInfo(false);
                setShowDealerProfile(true);
            } else {
                setDealerProfileData([]);
                setShowDealerProfile(false);
                setShowDealerProfileInfo(true);
            }
        } else if (requestFor === 'Edit') {
            setDealerChecklistFormData(dealerProfileDetails);
        }

        return dealerProfileDetails;
    };

    const handleProceedClick = async (dealerId?: string): Promise<void> => {
        setIsLoading(true);

        await getDealerProfileAPICall('Edit', dealerId);

        if (dealerId) setDealerChecklistId(dealerId);
        setIsDealerChecklistModalOpen(true);
        setIsLoading(false);
    };

    const getAllDealersMutation = useMutation({
        mutationFn: getManagedDealers,
    });

    const getAllDealers = async (): Promise<void> => {
        setIsLoading(true);

        const dealerLists = await getAllDealersMutation.mutateAsync({
            user: activeUser,
        });

        setDealerListData(dealerLists);
        setShowDealerTable(true);
        setIsLoading(false);
    };

    const generatePDF = async () => {
        setIsExporting(true);
        const dealerProfileExportData = await getDealerProfileAPICall('Export');

        if (dealerProfileExportData) {
            const doc = new jsPDF();
            const pageHeight = doc.internal.pageSize.getHeight(); // ~297 for A4
            const topMargin = 20;
            const bottomMargin = 15;
            const usablePageHeight = pageHeight - bottomMargin;

            const maxWidth = 180;
            const lineHeight = 10; // mm

            const centerText = (doc: jsPDF, text: string, y: number) => {
                doc.setFontSize(20);
                doc.setFont('helvetica', 'bold');
                const pageWidth = doc.internal.pageSize.getWidth();
                const textWidth = doc.getTextWidth(text);
                const x = (pageWidth - textWidth) / 2;
                doc.text(text, x, y);
            };

            // let y = 30;
            let y = topMargin + 15;

            const sectionHeader = (label: string, height: number = 10) => {
                if (y + height > usablePageHeight) {
                    doc.addPage();
                    y = topMargin;
                }

                doc.setFontSize(18);
                doc.setFont('helvetica', 'bold');
                doc.text(label, 10, y);

                y += height;
            };

            const subSectionHeader = (
                label: string,
                height: number = 10,
                requiredHeight: number = 10,
                isRequired: boolean = false
            ) => {
                if (y + requiredHeight > usablePageHeight) {
                    doc.addPage();
                    y = topMargin;
                }

                doc.setFontSize(14);
                doc.setFont('helvetica', 'normal');
                doc.text(label, 10, y);

                if (isRequired) {
                    const labelWidth = doc.getTextWidth(label);
                    doc.setTextColor(255, 0, 0); // Red
                    doc.text('*', 10 + labelWidth + 1, y); // Position star right after label
                    doc.setTextColor(0, 0, 0); // Reset back to black
                }

                y += height;
            };

            const labelAndTextbox = (
                label: string,
                value: string | undefined,
                isRequired: boolean = false,
                isTextbox: boolean = true,
                requiredHeight: number = 10
            ) => {
                if (y + requiredHeight > usablePageHeight) {
                    doc.addPage();
                    y = topMargin;
                }

                doc.setFontSize(14);
                doc.setFont('helvetica', 'normal');

                doc.text(label, 10, y, {
                    maxWidth: maxWidth,
                });

                if (isRequired) {
                    const labelWidth = doc.getTextWidth(label);
                    doc.setTextColor(255, 0, 0); // Red
                    doc.text('*', 10 + labelWidth + 1, y); // Position star right after label
                    doc.setTextColor(0, 0, 0); // Reset back to black
                }

                if (isTextbox) {
                    y += 2;

                    // Split text into lines based on max width
                    const lines = doc.splitTextToSize(
                        value ? value : '',
                        maxWidth
                    );

                    // Calculate required rectangle height
                    const textHeight = lines.length * lineHeight;
                    const rectHeight = textHeight;

                    // Draw textbox (rectangle)
                    doc.rect(10, y, maxWidth, rectHeight); // x, y, width, height

                    let currentY = y + 7;
                    lines.forEach((line: string) => {
                        doc.text(line, 12, currentY);
                        currentY += lineHeight;
                    });

                    y += rectHeight + 10; // space after each field
                } else {
                    y += lineHeight;
                }
            };

            const labelAndCheckbox = (
                label: string,
                isChecked: boolean = true,
                requiredHeight: number = 10
            ) => {
                if (y + requiredHeight > usablePageHeight) {
                    doc.addPage();
                    y = topMargin;
                }

                doc.rect(10, y, 5, 5);

                if (isChecked) {
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text('X', 11, y + 4);
                }

                doc.setFontSize(14);
                doc.setFont('helvetica', 'normal');

                // Split text into lines based on max width
                const lines = doc.splitTextToSize(label, maxWidth);
                const textHeight = lines.length * lineHeight;
                const rectHeight = textHeight;

                let currentY = y + 4;
                lines.forEach((line: string) => {
                    doc.text(line, 20, currentY);
                    currentY += lineHeight;
                });

                y += rectHeight + 5;
            };

            // Convert imported image to base64
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = EvolonLogo;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const dataUrl = canvas.toDataURL('image/png');
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const x = (pageWidth - 75) / 2;
                    doc.addImage(dataUrl, 'PNG', x, topMargin, 75, 25); // adjust size

                    centerText(doc, 'Dealer Profile', topMargin + 40);

                    y += 40;

                    sectionHeader('Company Information');

                    if (dealerProfileExportData.dealer_account_number) {
                        labelAndTextbox(
                            'Dealer Account Number',
                            dealerProfileExportData.dealer_account_number
                        );
                    }

                    labelAndTextbox(
                        'Company Name',
                        dealerProfileExportData.company_name,
                        true
                    );
                    labelAndTextbox(
                        'Company Owner / President',
                        dealerProfileExportData.president,
                        true
                    );
                    labelAndTextbox(
                        'Primary Contact Person',
                        dealerProfileExportData.company_contact_person,
                        true
                    );
                    labelAndTextbox(
                        'Address',
                        dealerProfileExportData.address,
                        true
                    );
                    labelAndTextbox('City', dealerProfileExportData.city, true);
                    labelAndTextbox(
                        'County',
                        dealerProfileExportData.county,
                        true
                    );
                    labelAndTextbox(
                        'State',
                        dealerProfileExportData.state,
                        true
                    );
                    labelAndTextbox('Zip', dealerProfileExportData.zip, true);

                    subSectionHeader('Office Hours', 10, 65, true);

                    dealerProfileExportData.office_hours.map(
                        (office_hour, index) => {
                            const groupStartY = y - 5;

                            labelAndTextbox(
                                'Day(s)',
                                office_hour.days.join(','),
                                true,
                                true,
                                65
                            );

                            const startTimeValue = timeOptions.find(
                                (option) =>
                                    option.value === office_hour.startTime
                            );
                            const startTimeLabel = startTimeValue?.label;
                            labelAndTextbox('Start Time', startTimeLabel, true);

                            const endTimeValue = timeOptionsWithEndOfDay.find(
                                (option) => option.value === office_hour.endTime
                            );
                            const endTimeLabel = endTimeValue?.label;
                            labelAndTextbox('End Time', endTimeLabel, true);

                            const groupEndY = y - 7;

                            // Define X and width of outer box
                            const groupX = 8;
                            const groupWidth = maxWidth + 4; // to match inner padding
                            const groupHeight = groupEndY - groupStartY;

                            doc.rect(
                                groupX,
                                groupStartY - 2,
                                groupWidth,
                                groupHeight + 2
                            );
                            y += 5;
                        }
                    );

                    labelAndTextbox(
                        'Office Phone',
                        convertPhoneNumberToFormattedVersion(
                            dealerProfileExportData.office_phone_number
                                ? dealerProfileExportData.office_phone_number
                                : ''
                        ),
                        true
                    );
                    labelAndTextbox(
                        'Back Line Number',
                        convertPhoneNumberToFormattedVersion(
                            dealerProfileExportData.back_line_number
                                ? dealerProfileExportData.back_line_number
                                : ''
                        )
                    );

                    doc.addPage();
                    y = topMargin;
                    sectionHeader('License & Billing Details');

                    subSectionHeader('State Burglar Alarm License', 10, 42);
                    if (
                        dealerProfileExportData.state_burglar_license.length !=
                        0
                    ) {
                        dealerProfileExportData.state_burglar_license.map(
                            (burglar_license, index) => {
                                const groupStartY = y - 5;

                                labelAndTextbox(
                                    'State',
                                    burglar_license.state
                                        ? burglar_license.state
                                        : '',
                                    false,
                                    true,
                                    42
                                );
                                labelAndTextbox(
                                    'Number',
                                    burglar_license.license_number
                                        ? burglar_license.license_number
                                        : ''
                                );

                                const groupEndY = y - 7;

                                // Define X and width of outer box
                                const groupX = 8;
                                const groupWidth = maxWidth + 4; // to match inner padding
                                const groupHeight = groupEndY - groupStartY;

                                doc.rect(
                                    groupX,
                                    groupStartY - 2,
                                    groupWidth,
                                    groupHeight + 2
                                );
                                y += 5;
                            }
                        );
                    } else {
                        const groupStartY = y - 5;

                        labelAndTextbox('State', '', false, true, 42);
                        labelAndTextbox('Number', '');

                        const groupEndY = y - 7;

                        // Define X and width of outer box
                        const groupX = 8;
                        const groupWidth = maxWidth + 4; // to match inner padding
                        const groupHeight = groupEndY - groupStartY;

                        doc.rect(
                            groupX,
                            groupStartY - 2,
                            groupWidth,
                            groupHeight + 2
                        );
                        y += 5;
                    }

                    subSectionHeader('Private Security License', 10, 42);
                    if (
                        dealerProfileExportData.private_security_license
                            .length != 0
                    ) {
                        dealerProfileExportData.private_security_license.map(
                            (security_license, index) => {
                                const groupStartY = y - 5;

                                labelAndTextbox(
                                    'State',
                                    security_license.state
                                        ? security_license.state
                                        : '',
                                    false,
                                    true,
                                    42
                                );
                                labelAndTextbox(
                                    'Number',
                                    security_license.license_number
                                        ? security_license.license_number
                                        : ''
                                );

                                const groupEndY = y - 7;

                                // Define X and width of outer box
                                const groupX = 8;
                                const groupWidth = maxWidth + 4; // to match inner padding
                                const groupHeight = groupEndY - groupStartY;

                                doc.rect(
                                    groupX,
                                    groupStartY - 2,
                                    groupWidth,
                                    groupHeight + 2
                                );

                                y += 5;
                            }
                        );
                    } else {
                        const groupStartY = y - 5;

                        labelAndTextbox('State', '', false, true, 42);
                        labelAndTextbox('Number', '');

                        const groupEndY = y - 7;

                        // Define X and width of outer box
                        const groupX = 8;
                        const groupWidth = maxWidth + 4; // to match inner padding
                        const groupHeight = groupEndY - groupStartY;

                        doc.rect(
                            groupX,
                            groupStartY - 2,
                            groupWidth,
                            groupHeight + 2
                        );
                        y += 5;
                    }

                    labelAndTextbox(
                        'Dealer Tech Support Number',
                        convertPhoneNumberToFormattedVersion(
                            dealerProfileExportData.tech_support_phone_number
                                ? dealerProfileExportData.tech_support_phone_number
                                : ''
                        ),
                        true
                    );
                    labelAndTextbox(
                        'Dealer Tech Support Email Address',
                        dealerProfileExportData.tech_support_email_address,
                        true
                    );
                    labelAndTextbox(
                        'Primary Billing Contact Person',
                        dealerProfileExportData.billing_contact_person,
                        true
                    );
                    labelAndTextbox(
                        'Billing Contact Phone Number',
                        convertPhoneNumberToFormattedVersion(
                            dealerProfileExportData.billing_contact_phone_number
                                ? dealerProfileExportData.billing_contact_phone_number
                                : ''
                        ),
                        true
                    );
                    labelAndTextbox(
                        'Billing Contact Email',
                        dealerProfileExportData.billing_contact_email_address,
                        true
                    );
                    labelAndTextbox(
                        'Company Passcode',
                        dealerProfileExportData.company_passcode,
                        true
                    );

                    doc.addPage();
                    y = topMargin;
                    sectionHeader('Authorized Office Personnel');

                    if (
                        dealerProfileExportData.authorized_office_personnel
                            .length != 0
                    ) {
                        dealerProfileExportData.authorized_office_personnel.map(
                            (office_personnel, index) => {
                                const groupStartY =
                                    usablePageHeight > y + 100
                                        ? y - 5
                                        : topMargin - 5;

                                // subSectionHeader(`Contact ${index + 1}`);
                                labelAndTextbox(
                                    'Name',
                                    office_personnel.name,
                                    true,
                                    true,
                                    96
                                );
                                labelAndTextbox(
                                    'Cell Phone',
                                    convertPhoneNumberToFormattedVersion(
                                        office_personnel.phone
                                            ? office_personnel.phone
                                            : ''
                                    ),
                                    true
                                );
                                labelAndTextbox(
                                    'Email Address',
                                    office_personnel.email,
                                    true
                                );
                                labelAndTextbox(
                                    'Personal Passcode',
                                    office_personnel.passcode,
                                    true
                                );

                                const groupEndY = y - 7;

                                // Define X and width of outer box
                                const groupX = 8;
                                const groupWidth = maxWidth + 4; // to match inner padding
                                const groupHeight = groupEndY - groupStartY;

                                doc.rect(
                                    groupX,
                                    groupStartY - 2,
                                    groupWidth,
                                    groupHeight + 2
                                );
                                y += 5;
                            }
                        );
                    } else {
                        const groupStartY = y - 5;

                        // subSectionHeader(`Contact 1`);
                        labelAndTextbox('Name', '', true, true, 96);
                        labelAndTextbox('Cell Phone', '', true);
                        labelAndTextbox('Email Address', '', true);
                        labelAndTextbox('Personal Passcode', '', true);

                        const groupEndY = y - 7;

                        // Define X and width of outer box
                        const groupX = 8;
                        const groupWidth = maxWidth + 4; // to match inner padding
                        const groupHeight = groupEndY - groupStartY;

                        doc.rect(
                            groupX,
                            groupStartY - 2,
                            groupWidth,
                            groupHeight + 2
                        );
                        y += 5;
                    }

                    doc.addPage();
                    y = topMargin;
                    sectionHeader('Technical Support Team');

                    if (
                        dealerProfileExportData.technical_support_team.length !=
                        0
                    ) {
                        dealerProfileExportData.technical_support_team.map(
                            (tech_support_team, index) => {
                                const groupStartY =
                                    usablePageHeight > y + 100
                                        ? y - 5
                                        : topMargin - 5;

                                // subSectionHeader(`Contact ${index + 1}`);
                                labelAndTextbox(
                                    'Name',
                                    tech_support_team.name,
                                    true,
                                    true,
                                    96
                                );
                                labelAndTextbox(
                                    'Cell Phone',
                                    convertPhoneNumberToFormattedVersion(
                                        tech_support_team.phone
                                            ? tech_support_team.phone
                                            : ''
                                    ),
                                    true
                                );
                                labelAndTextbox(
                                    'Email Address',
                                    tech_support_team.email,
                                    true
                                );
                                labelAndTextbox(
                                    'Personal Passcode',
                                    tech_support_team.passcode,
                                    true
                                );

                                const groupEndY = y - 7;

                                // Define X and width of outer box
                                const groupX = 8;
                                const groupWidth = maxWidth + 4; // to match inner padding
                                const groupHeight = groupEndY - groupStartY;

                                doc.rect(
                                    groupX,
                                    groupStartY - 2,
                                    groupWidth,
                                    groupHeight + 2
                                );
                                y += 5;
                            }
                        );
                    } else {
                        // subSectionHeader(`Contact 1`);
                        labelAndTextbox('Name', '', true, true, 96);
                        labelAndTextbox('Cell Phone', '', true);
                        labelAndTextbox('Email Address', '', true);
                        labelAndTextbox('Personal Passcode', '', true);
                    }

                    doc.addPage();
                    y = topMargin;
                    sectionHeader('Report Setup');

                    labelAndTextbox(
                        'Please check the daily reports you would like to receive via email.',
                        '',
                        false,
                        false
                    );

                    labelAndCheckbox(
                        'Daily report of all signals processed by operators (alarms, troubles, out of schedule open/closes)',
                        dealerProfileExportData.report_setup.operator_signals
                    );

                    labelAndCheckbox(
                        'Daily report of late to test and runaway signal events',
                        dealerProfileExportData.report_setup.test_signals
                    );

                    labelAndCheckbox(
                        'Daily report of changes made to your accounts (Optional)',
                        dealerProfileExportData.report_setup.account_changes
                    );

                    labelAndTextbox(
                        'Email Address to send reports to',
                        '',
                        false,
                        false
                    );

                    if (
                        dealerProfileExportData.report_recipient_emails
                            .length != 0
                    ) {
                        dealerProfileExportData.report_recipient_emails.map(
                            (report_email, index) => {
                                labelAndTextbox(
                                    `Email ${index + 1}`,
                                    report_email
                                );
                            }
                        );
                    } else {
                        labelAndTextbox('Email 1', '');
                    }

                    doc.save('Dealer Profile.pdf');
                }
            };
        }

        setIsExporting(false);
    };

    const handleClose = () => {
        setIsDealerChecklistModalOpen(false);
        if (accountType === AccountType.Evolon) {
            getAllDealers();
        } else {
            getDealerProfileData();
        }
    };

    const getDealerProfileData = async () => {
        setIsLoading(true);

        await getDealerProfileAPICall('View');

        setIsLoading(false);
    };

    useEffect(() => {
        if (accountType === AccountType.Evolon) {
            getAllDealers();
        } else {
            getDealerProfileData();
        }
    }, []);

    useEffect(() => {
        if (dealerListData) {
            let newManagedDealers: IDealerList[] = [];

            newManagedDealers = dealerListData.filter((managedDealer) => {
                const service_provider_name =
                    managedDealer.service_provider_name?.toLowerCase();
                const dealer_account_number =
                    managedDealer.dealer_account_number?.toLowerCase();
                const company_name = managedDealer.company_name?.toLowerCase();
                const status = managedDealer.status.toLowerCase();
                const search = dealerSearch.toLowerCase();

                return (
                    service_provider_name?.includes(search) ||
                    dealer_account_number?.includes(search) ||
                    company_name?.includes(search) ||
                    status.includes(search)
                );
            });

            setFilteredDealerListData(newManagedDealers);
        }
    }, [dealerSearch, dealerListData]);

    return (
        <motion.div
            id="DealerChecklist"
            key="DealerChecklist"
            className="DealerChecklist"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.3 }}
        >
            {isLoading && (
                <LoadingModal
                    modalText="Loading Dealer Profile data..."
                    zIndex={96}
                />
            )}
            {isExporting && (
                <LoadingModal
                    modalText="Dealer Profile data exporting..."
                    zIndex={96}
                />
            )}
            {isDealerChecklistModalOpen && dealerChecklistFormData && (
                <EditDealerProfileModal
                    activeUser={activeUser}
                    setActiveUser={setActiveUser}
                    accountType={accountType}
                    handleClose={handleClose}
                    dealerChecklistFormData={dealerChecklistFormData}
                    dealerId={dealerChecklistId}
                    generatePDF={generatePDF}
                ></EditDealerProfileModal>
            )}
            {showDealerTable && (
                <div>
                    <h3 id="title">
                        <span>Dealer Management</span>
                    </h3>
                    <div className="container">
                        <Input
                            className="input"
                            label="Search"
                            name="dealer-search"
                            data-testid="dealer-search"
                            id="dealer-search"
                            value={dealerSearch}
                            onChange={setDealerSearch}
                            type="text"
                        />
                    </div>
                    <div className="table-container">
                        <DealerManagementTable
                            data={filteredDealerListData}
                            onEditClick={handleProceedClick}
                        />
                    </div>
                </div>
            )}
            {(showDealerProfile || showDealerProfileInfo) && (
                <div>
                    <h3 id="title">
                        <span>Dealer Profile</span>
                    </h3>
                    {showDealerProfile && dealerProfileData.length !== 0 && (
                        <div className="table-container">
                            <DealerProfileTable
                                data={dealerProfileData}
                                onEditClick={handleProceedClick}
                                generatePDF={generatePDF}
                            />
                        </div>
                    )}
                    {showDealerProfileInfo && (
                        <div>
                            <div>
                                <p>
                                    As a Service Provider, you need to fill the
                                    following details.
                                </p>
                            </div>
                            <ButtonGroup
                                alignment={ButtonGroupAlignment.bottomright}
                            >
                                <Button
                                    id="edit"
                                    className="btn primary"
                                    label="Proceed"
                                    type="button"
                                    onClick={handleProceedClick}
                                />
                            </ButtonGroup>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default DealerChecklist;
