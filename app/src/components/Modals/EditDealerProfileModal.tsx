/* eslint-disable react/no-array-index-key */
// React
import {
    Dispatch,
    FC,
    FormEvent,
    Fragment,
    ReactElement,
    SetStateAction,
    useEffect,
    useState,
} from 'react';

// Third party
import { toast } from 'react-toastify';
import Select from 'react-select';
import { useMutation } from '@tanstack/react-query';

// Controller
import {
    isValidTimeBlock,
    timeOptions,
    timeOptionsWithEndOfDay,
    timeSelectCustomStyles,
} from '../Scheduling/ScheduleModal.controller';

// Components
import ModalBase from '../ModalBase';
import Input from '../Inputs/Input';
import Button from '../Button';
import LoadingModal from './LoadingModal';
import ButtonGroup, { ButtonGroupAlignment } from '../ButtonGroup/ButtonGroup';

// Api Calls
import updateDealerChecklist from '../../api_calls/updateDealerChecklist';

// Utils
import {
    convertPhoneNumberToFormattedVersion,
    handlePhoneNumberChange,
    handlePhoneNumberFocus,
    handlePhoneNumberBlur,
} from '../../utils/convertPhoneNumberToFormattedVersion';

// Icons
import DeleteIcon from '../../images/icons/EV_ENT_CircleX.7.6.22.svg?react';
import { FaCheck, FaChevronDown, FaChevronRight } from 'react-icons/fa';

// Custom types
import {
    IUser,
    SelectOption,
    ISubSectionBlock,
    IContactBlock,
    ILicenseBlock,
    ITimeBlock,
    IDealerChecklist,
    IReportSetup,
} from '../../types/interfaces';
import { IAPIDealerChecklist } from '../../types/tng-api.interfaces';
import { AccountType } from '../../types/enums';

// Styles
import '../../styles/components/DealerChecklist.scss';

type DealerChecklistErrors = {
    [K in keyof IAPIDealerChecklist]?: K extends
        | 'authorized_office_personnel'
        | 'technical_support_team'
        | 'report_recipient_emails'
        ? string[]
        : string;
};

const officeHoursOptions = [
    { label: 'Weekdays (M-F)', value: 'Weekdays (M-F)' },
    { label: 'Saturday', value: 'Saturday' },
    { label: 'Sunday', value: 'Sunday' },
];

interface IProps {
    activeUser: IUser;
    setActiveUser: Dispatch<SetStateAction<IUser | null>>;
    accountType: AccountType;
    handleClose: () => void;
    dealerChecklistFormData: IAPIDealerChecklist;
    dealerId: string;
    generatePDF: () => void;
}

const EditDealerProfileModal: FC<IProps> = ({
    activeUser,
    setActiveUser,
    accountType,
    handleClose,
    dealerChecklistFormData,
    dealerId,
    generatePDF,
}: IProps): ReactElement => {
    type SubSectionKey = keyof ISubSectionBlock;

    const requiredFields: (keyof typeof dealerChecklistData)[] = [
        'company_name',
        'president',
        'company_contact_person',
        'address',
        'city',
        'county',
        'state',
        'zip',
        'office_hours',
        'office_phone_number',
        'tech_support_phone_number',
        'tech_support_email_address',
        'billing_contact_person',
        'billing_contact_phone_number',
        'billing_contact_email_address',
        'company_passcode',
        'authorized_office_personnel',
        'technical_support_team',
    ];

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<DealerChecklistErrors>({});
    const [activeSection, setActiveSection] = useState<number | null>(null);

    const [isCompanyInfoVerified, setIsCompanyInfoVerified] =
        useState<boolean>(false);
    const [isBillingLicenseVerified, setIsBillingLicenseVerified] =
        useState<boolean>(false);
    const [isOfficePersonnelVerified, setIsOfficePersonnelVerified] =
        useState<boolean>(false);
    const [isTechnicalSupportTeamVerified, setIsTechnicalSupportTeamVerified] =
        useState<boolean>(false);
    const [isReportSetupVerified, setIsReportSetupVerified] =
        useState<boolean>(false);

    // Progress state
    const [progressStatus, setProgressStatus] = useState(0);

    const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

    const [dealerChecklistData, setDealerChecklistData] =
        useState<IAPIDealerChecklist>(deepClone(dealerChecklistFormData));

    const [savedDealerChecklistData, setSavedDealerChecklistData] =
        useState<IAPIDealerChecklist>(deepClone(dealerChecklistFormData));

    const [activeSubSection, setActiveSubSection] = useState<ISubSectionBlock>({
        office_personnel: null,
        technical_support: null,
    });

    const defaultReportSetup = {
        account_changes: false,
        operator_signals: true,
        test_signals: true,
    };

    const convertToFullTimeValue = (time: string): string | null => {
        if (!time) return null;

        const match = timeOptionsWithEndOfDay.find((opt) =>
            opt.value.startsWith(time)
        );
        return match ? match.value : null;
    };

    const mapRawOfficeHoursToTimeBlocks = (raw: any[]): ITimeBlock[] => {
        return raw.map((block) => ({
            days: block.days || [],

            startTime: convertToFullTimeValue(block.startTime),
            endTime: convertToFullTimeValue(block.endTime),
        }));
    };

    const [officePhoneNumber, setOfficePhoneNumber] = useState<string>(
        dealerChecklistData.office_phone_number
            ? convertPhoneNumberToFormattedVersion(
                  dealerChecklistData.office_phone_number
              )
            : ''
    );

    const [techSupportPhoneNumber, setTechSupportPhoneNumber] =
        useState<string>(
            dealerChecklistData.tech_support_phone_number
                ? convertPhoneNumberToFormattedVersion(
                      dealerChecklistData.tech_support_phone_number
                  )
                : ''
        );
    const [billingContactPhoneNumber, setBillingContactPhoneNumber] =
        useState<string>(
            dealerChecklistData.billing_contact_phone_number
                ? convertPhoneNumberToFormattedVersion(
                      dealerChecklistData.billing_contact_phone_number
                  )
                : ''
        );

    const [timeBlocks, setTimeBlocks] = useState<ITimeBlock[]>(
        dealerChecklistData.office_hours.length != 0
            ? mapRawOfficeHoursToTimeBlocks(dealerChecklistData.office_hours)
            : [
                  {
                      days: [],
                      startTime: null,
                      endTime: null,
                  },
              ]
    );
    const [burglarLicenseBlocks, setBurglarLicenseBlocks] = useState<
        ILicenseBlock[]
    >(
        dealerChecklistData.state_burglar_license.length != 0
            ? dealerChecklistData.state_burglar_license
            : [
                  {
                      state: '',
                      license_number: '',
                  },
              ]
    );
    const [securityLicenseBlocks, setSecurityLicenseBlocks] = useState<
        ILicenseBlock[]
    >(
        dealerChecklistData.private_security_license.length != 0
            ? dealerChecklistData.private_security_license
            : [
                  {
                      state: '',
                      license_number: '',
                  },
              ]
    );

    const [officePersonnelBlocks, setOfficePersonnelBlocks] = useState<
        IContactBlock[]
    >(
        dealerChecklistData.authorized_office_personnel.length != 0
            ? dealerChecklistData.authorized_office_personnel.map(
                  (contact) => ({
                      ...contact,
                      phone: contact.phone
                          ? convertPhoneNumberToFormattedVersion(contact.phone)
                          : '',
                  })
              )
            : [
                  {
                      name: '',
                      phone: '',
                      email: '',
                      passcode: '',
                  },
              ]
    );
    const [technicalSupportBlocks, setTechnicalSupportBlocks] = useState<
        IContactBlock[]
    >(
        dealerChecklistData.technical_support_team.length != 0
            ? dealerChecklistData.technical_support_team.map((contact) => ({
                  ...contact,
                  phone: contact.phone
                      ? convertPhoneNumberToFormattedVersion(contact.phone)
                      : '',
              }))
            : [
                  {
                      name: '',
                      phone: '',
                      email: '',
                      passcode: '',
                  },
              ]
    );

    const [dailyReport, setDailyReport] = useState<IReportSetup>(
        Object.keys(dealerChecklistData.report_setup).length !== 0
            ? dealerChecklistData.report_setup
            : defaultReportSetup
    );

    const [reportEmailBlocks, setReportEmailBlocks] = useState<string[]>(
        dealerChecklistData.report_recipient_emails.length != 0
            ? dealerChecklistData.report_recipient_emails
            : []
    );

    const toggleSection = (id: number) => {
        setActiveSection((prev) => (prev === id ? null : id));
    };

    const toggleSubSection = (key: SubSectionKey, id: number) => {
        setActiveSubSection((prev) => ({
            ...prev,
            [key]: prev[key] === id ? null : id,
        }));
    };

    const onInputTextChange = (
        key: keyof IDealerChecklist,
        value: string,
        type: string
    ) => {
        if (type == 'number') {
            // Allow digits only
            let formattedZip = value.replace(/\D/g, '');

            if (formattedZip.length > 5) {
                formattedZip = `${formattedZip.slice(
                    0,
                    5
                )}-${formattedZip.slice(5)}`;
            }

            setDealerChecklistData({
                ...dealerChecklistData,
                [key]: formattedZip,
            });
        } else if (type == 'phonenumber') {
            // Allow digits and hyphen(-)
            if (/^\d*$/.test(value)) {
                setDealerChecklistData({
                    ...dealerChecklistData,
                    [key]: value,
                });
            }
        } else {
            if (key === 'company_passcode') {
                // Allow only Alpha-numeric (letters and numbers) characters
                if (/^[a-zA-Z0-9]*$/.test(value)) {
                    setDealerChecklistData({
                        ...dealerChecklistData,
                        [key]: value,
                    });
                }
            } else if (key === 'dealer_account_number') {
                // Allow only Alpha-numeric (letters and numbers) characters
                if (/^[a-zA-Z0-9]*$/.test(value)) {
                    setDealerChecklistData({
                        ...dealerChecklistData,
                        [key]: value.toUpperCase(),
                    });
                }
            } else {
                setDealerChecklistData({
                    ...dealerChecklistData,
                    [key]: value,
                });
            }
        }
    };

    const handleBlur = (key: keyof IDealerChecklist, value: string) => {
        const trimmedValue = value.replace(/\s+/g, ' ').trim();

        if (value !== trimmedValue) {
            setDealerChecklistData({
                ...dealerChecklistData,
                [key]: trimmedValue,
            });
        }
    };

    const handleBlockValueChange = <T extends ILicenseBlock | IContactBlock>(
        index: number,
        newValue: any,
        key: keyof T,
        setDataBlocks: React.Dispatch<React.SetStateAction<T[]>>,
        dataBlocks: T[]
    ): void => {
        if (key === 'phone' && !/^\d*$/.test(newValue)) {
            return;
        }

        if (key === 'passcode' && !/^[a-zA-Z0-9]*$/.test(newValue)) {
            return;
        }

        const updatedBlocks = dataBlocks.map((block, i) =>
            i === index
                ? {
                      ...block,
                      [key]: newValue,
                  }
                : { ...block }
        );

        setDataBlocks(updatedBlocks);
    };

    const handleBlockFieldBlur = <T extends ILicenseBlock | IContactBlock>(
        index: number,
        newValue: any,
        key: keyof T,
        setDataBlocks: React.Dispatch<React.SetStateAction<T[]>>,
        dataBlocks: T[]
    ): void => {
        const updatedBlocks = dataBlocks.map((block, i) =>
            i === index
                ? {
                      ...block,
                      [key]:
                          key === 'phone'
                              ? convertPhoneNumberToFormattedVersion(newValue)
                              : newValue.replace(/\s+/g, ' ').trim(),
                  }
                : { ...block }
        );

        setDataBlocks(updatedBlocks);
    };

    const handleBlockFieldFocus = <T extends IContactBlock>(
        index: number,
        newValue: any,
        key: keyof T,
        setDataBlocks: React.Dispatch<React.SetStateAction<T[]>>,
        dataBlocks: T[]
    ): void => {
        const updatedBlocks = dataBlocks.map((block, i) =>
            i === index
                ? {
                      ...block,
                      [key]: newValue.replace(/\D/g, ''),
                  }
                : { ...block }
        );

        setDataBlocks(updatedBlocks);
    };

    const isValidEmail = (email: string): boolean => {
        return /^[a-zA-Z0-9.\-+_]{2,}@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(
            email
        );
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;

        setDailyReport((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };

    const getAvailableDayOptions = (currentIndex: number): SelectOption[] => {
        const selectedDays = timeBlocks
            .filter((_, i) => i !== currentIndex)
            .flatMap((block) => block.days);

        return officeHoursOptions.filter(
            (opt) => !selectedDays.includes(opt.label)
        );
    };

    const removeObjectsWithAllEmptyValues = <T extends Record<string, any>>(
        array: T[]
    ): T[] => {
        return array
            .map((obj) => {
                const newObj = { ...obj } as T & { phone?: string };

                // Remove all values except digits
                if (newObj.phone) {
                    newObj.phone = newObj.phone.replace(/\D/g, '');
                }

                return newObj;
            })
            .filter((obj) =>
                Object.values(obj).some((val) => {
                    if (typeof val === 'string') return val.trim() !== '';
                    if (Array.isArray(val)) return val.length > 0;
                    return val !== null && val !== undefined;
                })
            );
    };

    const deepEqual = (a: any, b: any): boolean => {
        if (a === b) return true;

        if (typeof a !== typeof b) return false;

        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            return a.every((item, index) => deepEqual(item, b[index]));
        }

        if (typeof a === 'object' && typeof b === 'object' && a && b) {
            const aKeys = Object.keys(a);
            const bKeys = Object.keys(b);
            if (aKeys.length !== bKeys.length) return false;
            return aKeys.every((key) => deepEqual(a[key], b[key]));
        }

        return false;
    };

    const getObjectDifferences = (
        obj1: IAPIDealerChecklist,
        obj2: IAPIDealerChecklist,
        excludeKeys: string[] = []
    ): Partial<IAPIDealerChecklist> => {
        const result: Partial<IAPIDealerChecklist> = {};

        for (const key of Object.keys(obj2) as (keyof IAPIDealerChecklist)[]) {
            if (excludeKeys.includes(key)) continue;

            const val1 = obj1[key];
            const val2 = obj2[key];

            if (!deepEqual(val1, val2)) {
                result[key] = val2 as any;
            }
        }

        return result;
    };

    const resetErrorMessages = () => {
        setErrorMessage({
            ...errorMessage,
            company_name: '',
            president: '',
            company_contact_person: '',
            address: '',
            city: '',
            county: '',
            state: '',
            zip: '',
            office_hours: '',
            office_phone_number: '',
            back_line_number: '',
            state_burglar_license: '',
            private_security_license: '',
            tech_support_phone_number: '',
            tech_support_email_address: '',
            billing_contact_person: '',
            billing_contact_phone_number: '',
            billing_contact_email_address: '',
            company_passcode: '',
            authorized_office_personnel: [],
            technical_support_team: [],
            // report_setup: IReportSetup;
            report_recipient_emails: [],
        });
    };

    const resetChangesInDealerChecklistData = <
        IAPIDealerChecklist extends Record<string, any>
    >(
        diffKeys: Partial<IAPIDealerChecklist>,
        savedDealerChecklistData: IAPIDealerChecklist
    ) => {
        for (const key of Object.keys(diffKeys) as Array<
            keyof IAPIDealerChecklist
        >) {
            setDealerChecklistData((prev) => {
                return {
                    ...prev,
                    [key]: savedDealerChecklistData[key],
                };
            });

            if (key === 'office_hours') {
                setTimeBlocks(
                    savedDealerChecklistData.office_hours.length !== 0
                        ? mapRawOfficeHoursToTimeBlocks(
                              savedDealerChecklistData.office_hours
                          )
                        : [
                              {
                                  days: [],
                                  startTime: null,
                                  endTime: null,
                              },
                          ]
                );
            } else if (key === 'office_phone_number') {
                setOfficePhoneNumber(
                    savedDealerChecklistData.office_phone_number
                        ? convertPhoneNumberToFormattedVersion(
                              savedDealerChecklistData.office_phone_number
                          )
                        : ''
                );
            } else if (key === 'tech_support_phone_number') {
                setTechSupportPhoneNumber(
                    savedDealerChecklistData.tech_support_phone_number
                        ? convertPhoneNumberToFormattedVersion(
                              savedDealerChecklistData.tech_support_phone_number
                          )
                        : ''
                );
            } else if (key === 'billing_contact_phone_number') {
                setBillingContactPhoneNumber(
                    savedDealerChecklistData.billing_contact_phone_number
                        ? convertPhoneNumberToFormattedVersion(
                              savedDealerChecklistData.billing_contact_phone_number
                          )
                        : ''
                );
            } else if (key === 'state_burglar_license') {
                setBurglarLicenseBlocks(
                    savedDealerChecklistData.state_burglar_license.length != 0
                        ? savedDealerChecklistData.state_burglar_license
                        : [
                              {
                                  state: '',
                                  license_number: '',
                              },
                          ]
                );
            } else if (key === 'private_security_license') {
                setSecurityLicenseBlocks(
                    savedDealerChecklistData.private_security_license.length !=
                        0
                        ? savedDealerChecklistData.private_security_license
                        : [
                              {
                                  state: '',
                                  license_number: '',
                              },
                          ]
                );
            } else if (key === 'authorized_office_personnel') {
                setOfficePersonnelBlocks(
                    savedDealerChecklistData.authorized_office_personnel
                        .length != 0
                        ? savedDealerChecklistData.authorized_office_personnel.map(
                              (contact: IContactBlock) => ({
                                  ...contact,
                                  phone: contact.phone
                                      ? convertPhoneNumberToFormattedVersion(
                                            contact.phone
                                        )
                                      : '',
                              })
                          )
                        : [
                              {
                                  name: '',
                                  phone: '',
                                  email: '',
                                  passcode: '',
                              },
                          ]
                );
            } else if (key === 'technical_support_team') {
                setTechnicalSupportBlocks(
                    savedDealerChecklistData.technical_support_team.length != 0
                        ? savedDealerChecklistData.technical_support_team.map(
                              (contact: IContactBlock) => ({
                                  ...contact,
                                  phone: contact.phone
                                      ? convertPhoneNumberToFormattedVersion(
                                            contact.phone
                                        )
                                      : '',
                              })
                          )
                        : [
                              {
                                  name: '',
                                  phone: '',
                                  email: '',
                                  passcode: '',
                              },
                          ]
                );
            } else if (key === 'report_setup') {
                setDailyReport(
                    Object.keys(savedDealerChecklistData.report_setup)
                        .length !== 0
                        ? savedDealerChecklistData.report_setup
                        : defaultReportSetup
                );
            } else if (key === 'report_recipient_emails') {
                setReportEmailBlocks(
                    savedDealerChecklistData.report_recipient_emails.length != 0
                        ? savedDealerChecklistData.report_recipient_emails
                        : ['']
                );
            }

            resetErrorMessages();
        }
    };

    const validateAndRemoveEmptyObjects = (): IAPIDealerChecklist => {
        const officeHoursEmptyDataRemoved =
            removeObjectsWithAllEmptyValues(timeBlocks);

        const officePhoneNumberRawDigits = officePhoneNumber?.replace(
            /\D/g,
            ''
        );

        const techSupportPhoneNumberRawDigits = techSupportPhoneNumber?.replace(
            /\D/g,
            ''
        );

        const billingContactPhoneNumberRawDigits =
            billingContactPhoneNumber?.replace(/\D/g, '');

        const burglarLicenseEmptyDataRemoved =
            removeObjectsWithAllEmptyValues(burglarLicenseBlocks);

        const securityLicenseEmptyDataRemoved = removeObjectsWithAllEmptyValues(
            securityLicenseBlocks
        );

        const authorizedPersonnelEmptyDataRemoved =
            removeObjectsWithAllEmptyValues(officePersonnelBlocks);

        const technicalSupportEmptyDataRemoved =
            removeObjectsWithAllEmptyValues(technicalSupportBlocks);

        const reportEmailEmptyDataRamoved = reportEmailBlocks.filter(
            (val) => val.trim() !== ''
        );

        const updatedDealerChecklistData = {
            ...dealerChecklistData,
            office_hours: officeHoursEmptyDataRemoved,
            office_phone_number: officePhoneNumberRawDigits,
            tech_support_phone_number: techSupportPhoneNumberRawDigits,
            billing_contact_phone_number: billingContactPhoneNumberRawDigits,
            state_burglar_license: burglarLicenseEmptyDataRemoved,
            private_security_license: securityLicenseEmptyDataRemoved,
            authorized_office_personnel: authorizedPersonnelEmptyDataRemoved,
            technical_support_team: technicalSupportEmptyDataRemoved,
            report_setup: dailyReport,
            report_recipient_emails: reportEmailEmptyDataRamoved,
        };

        return updatedDealerChecklistData;
    };

    const deepCopyOfficeHoursData = (timeBlocks: ITimeBlock[]) => {
        return timeBlocks.map((block) => ({
            days: block.days,
            startTime: block.startTime,
            endTime: block.endTime,
        }));
    };

    const deepCopyLicenseData = (licenseBlocks: ILicenseBlock[]) => {
        return licenseBlocks.map((block) => ({
            state: block.state,
            license_number: block.license_number,
        }));
    };

    const deepCopyContactData = (contactBlocks: IContactBlock[]) => {
        return contactBlocks.map((block) => ({
            name: block.name,
            phone: block.phone,
            email: block.email,
            passcode: block.passcode,
        }));
    };

    const isValidObjects = (arr: Record<string, any>[]): boolean => {
        // Must contain at least one object
        if (arr.length === 0) return false;

        return arr.every((obj) => {
            const values = Object.values(obj);

            const filledCount = values.filter((val) => {
                if (Array.isArray(val)) {
                    return val.length > 0;
                }

                return val !== null && val !== '';
            }).length;

            // Valid only if all fields are filled
            return filledCount === values.length;
        });
    };

    const updateProgress = () => {
        let filledFields = 0;
        // Validate required fields
        for (const key of requiredFields) {
            const value = dealerChecklistData[key];
            if (key === 'office_hours') {
                const officeHoursEmptyDataRemoved =
                    removeObjectsWithAllEmptyValues(timeBlocks);
                if (isValidObjects(officeHoursEmptyDataRemoved)) {
                    let isValidOfficeHours = true;

                    for (
                        let i = 0;
                        i < officeHoursEmptyDataRemoved.length;
                        i += 1
                    ) {
                        if (
                            officeHoursEmptyDataRemoved[i].startTime !== null &&
                            officeHoursEmptyDataRemoved[i].endTime !== null &&
                            !isValidTimeBlock(
                                officeHoursEmptyDataRemoved[i].startTime!,
                                officeHoursEmptyDataRemoved[i].endTime!
                            )
                        ) {
                            isValidOfficeHours = false;
                        }
                    }

                    if (isValidOfficeHours) {
                        filledFields += 1;
                    }
                }
            } else if (key === 'authorized_office_personnel') {
                const authorizedPersonnelEmptyDataRemoved =
                    removeObjectsWithAllEmptyValues(officePersonnelBlocks);

                if (isValidObjects(authorizedPersonnelEmptyDataRemoved)) {
                    let isValidOfficePersonnel = true;

                    for (
                        let i = 0;
                        i < authorizedPersonnelEmptyDataRemoved.length;
                        i++
                    ) {
                        const block = authorizedPersonnelEmptyDataRemoved[i];
                        const phone = block.phone?.trim();

                        if (phone && phone.length < 10) {
                            isValidOfficePersonnel = false;
                            break;
                        }

                        const email = block.email?.trim();

                        if (email && !isValidEmail(email)) {
                            isValidOfficePersonnel = false;
                            break;
                        }

                        const passcode = block.passcode?.trim();

                        if (passcode && passcode.length < 8) {
                            isValidOfficePersonnel = false;
                            break;
                        }
                    }

                    if (isValidOfficePersonnel) {
                        filledFields += 1;
                    }
                }
            } else if (key === 'technical_support_team') {
                const technicalSupportEmptyDataRemoved =
                    removeObjectsWithAllEmptyValues(technicalSupportBlocks);

                if (isValidObjects(technicalSupportEmptyDataRemoved)) {
                    let isValidTechnicalSupportTeam = true;

                    for (
                        let i = 0;
                        i < technicalSupportEmptyDataRemoved.length;
                        i++
                    ) {
                        const block = technicalSupportEmptyDataRemoved[i];
                        const phone = block.phone?.trim();

                        if (phone && phone.length < 10) {
                            isValidTechnicalSupportTeam = false;
                            break;
                        }

                        const email = block.email?.trim();

                        if (email && !isValidEmail(email)) {
                            isValidTechnicalSupportTeam = false;
                            break;
                        }

                        const passcode = block.passcode?.trim();

                        if (passcode && passcode.length < 8) {
                            isValidTechnicalSupportTeam = false;
                            break;
                        }
                    }

                    if (isValidTechnicalSupportTeam) {
                        filledFields += 1;
                    }
                }
            } else if (key === 'zip') {
                if (
                    typeof value === 'string' &&
                    value.trim() &&
                    value.trim().length >= 5
                ) {
                    filledFields += 1;
                }
            } else if (
                key === 'office_phone_number' ||
                key === 'tech_support_phone_number' ||
                key === 'billing_contact_phone_number'
            ) {
                if (
                    typeof value === 'string' &&
                    value.trim() &&
                    value.replace(/\D/g, '').trim().length >= 10
                ) {
                    filledFields += 1;
                }
            } else if (
                key === 'tech_support_email_address' ||
                key === 'billing_contact_email_address'
            ) {
                if (
                    typeof value === 'string' &&
                    value.trim() &&
                    isValidEmail(value.trim())
                ) {
                    filledFields += 1;
                }
            } else if (key === 'company_passcode') {
                if (
                    typeof value === 'string' &&
                    value.trim() &&
                    value.trim().length >= 8
                ) {
                    filledFields += 1;
                }
            } else if (typeof value === 'string' && value.trim()) {
                filledFields += 1;
            }
        }

        const progressPercentage = Math.round(
            (filledFields / requiredFields.length) * 100
        );

        setProgressStatus(progressPercentage);
    };

    const validateCompanyInfo = () => {
        let isRequiredFieldFilled = true;

        // List of required fields
        const requiredFieldsForSection: (keyof typeof dealerChecklistData)[] = [
            'company_name',
            'president',
            'company_contact_person',
            'address',
            'city',
            'county',
            'state',
            'zip',
            'office_phone_number',
        ];

        // Validate required fields
        for (const key of requiredFieldsForSection) {
            const value = dealerChecklistData[key];
            if (typeof value === 'string' && !value.trim()) {
                isRequiredFieldFilled = false;
            }
        }

        const officeHoursEmptyDataRemoved =
            removeObjectsWithAllEmptyValues(timeBlocks);
        if (!isValidObjects(officeHoursEmptyDataRemoved)) {
            isRequiredFieldFilled = false;
        }

        const zip = dealerChecklistData.zip?.trim();
        if (zip && zip.length < 5) {
            isRequiredFieldFilled = false;
        }

        for (let i = 0; i < officeHoursEmptyDataRemoved.length; i += 1) {
            if (
                officeHoursEmptyDataRemoved[i].startTime !== null &&
                officeHoursEmptyDataRemoved[i].endTime !== null &&
                !isValidTimeBlock(
                    officeHoursEmptyDataRemoved[i].startTime!,
                    officeHoursEmptyDataRemoved[i].endTime!
                )
            ) {
                isRequiredFieldFilled = false;
            }
        }

        if (
            officePhoneNumber?.trim() &&
            officePhoneNumber?.replace(/\D/g, '').trim().length < 10
        ) {
            isRequiredFieldFilled = false;
        }

        if (
            dealerChecklistData.back_line_number?.trim() &&
            dealerChecklistData.back_line_number?.trim().length < 10
        ) {
            isRequiredFieldFilled = false;
        }

        setIsCompanyInfoVerified(isRequiredFieldFilled);
    };

    const validateCompanyInformation = (requestFrom: string): boolean => {
        const errors: DealerChecklistErrors = {};

        const officeHoursEmptyDataRemoved =
            removeObjectsWithAllEmptyValues(timeBlocks);

        if (requestFrom === 'Submit') {
            if (!dealerChecklistData.company_name?.trim()) {
                errors.company_name = 'Please fill the Company Name!';
            }

            if (!dealerChecklistData.president?.trim()) {
                errors.president = 'Please fill the Company Owner/President!';
            }

            if (!dealerChecklistData.company_contact_person?.trim()) {
                errors.company_contact_person =
                    'Please fill the Primary Contact Person!';
            }

            if (!dealerChecklistData.address?.trim()) {
                errors.address = 'Please fill the Address!';
            }

            if (!dealerChecklistData.city?.trim()) {
                errors.city = 'Please fill the City!';
            }

            if (!dealerChecklistData.county?.trim()) {
                errors.county = 'Please fill the County!';
            }

            if (!dealerChecklistData.state?.trim()) {
                errors.state = 'Please fill the State!';
            }

            if (!dealerChecklistData.zip?.trim()) {
                errors.zip = 'Please fill the Zip!';
            }

            if (!isValidObjects(officeHoursEmptyDataRemoved)) {
                errors.office_hours = 'Please fill the Office Hours!';
            }

            if (!officePhoneNumber?.replace(/\D/g, '').trim()) {
                errors.office_phone_number = 'Please fill the Office Phone!';
            }
        }

        if (
            dealerChecklistData.zip?.trim() &&
            dealerChecklistData.zip?.trim().length < 5
        ) {
            errors.zip = 'Invalid Zip (must contain 5 numbers)!';
        }

        for (let i = 0; i < officeHoursEmptyDataRemoved.length; i += 1) {
            if (
                officeHoursEmptyDataRemoved[i].startTime !== null &&
                officeHoursEmptyDataRemoved[i].endTime !== null &&
                !isValidTimeBlock(
                    officeHoursEmptyDataRemoved[i].startTime!,
                    officeHoursEmptyDataRemoved[i].endTime!
                )
            ) {
                errors.office_hours =
                    'End times must be after start times on Office Hours.';
            }
        }

        if (
            officePhoneNumber?.trim() &&
            officePhoneNumber?.replace(/\D/g, '').trim().length < 10
        ) {
            errors.office_phone_number =
                'Invalid Office Phone (must contain 10 numbers)!';
        }

        if (
            dealerChecklistData.back_line_number?.trim() &&
            dealerChecklistData.back_line_number?.trim().length < 10
        ) {
            errors.back_line_number =
                'Invalid Back Line Number (must contain 10 numbers)!';
        }

        setErrorMessage(errors);

        if (Object.keys(errors).length !== 0) {
            if (activeSection !== 1) toggleSection(1);
            return false;
        }
        return true;
    };

    const validateBillingLicenseInfo = () => {
        let isRequiredFieldFilled = true;

        // List of required fields
        const requiredFieldsForSection: (keyof typeof dealerChecklistData)[] = [
            'tech_support_phone_number',
            'tech_support_email_address',
            'billing_contact_person',
            'billing_contact_phone_number',
            'billing_contact_email_address',
            'company_passcode',
        ];

        // Validate required fields
        for (const key of requiredFieldsForSection) {
            const value = dealerChecklistData[key];
            if (typeof value === 'string' && !value.trim()) {
                isRequiredFieldFilled = false;
            }
        }

        if (
            techSupportPhoneNumber?.trim() &&
            techSupportPhoneNumber?.replace(/\D/g, '').trim().length < 10
        ) {
            isRequiredFieldFilled = false;
        }

        if (
            dealerChecklistData.tech_support_email_address?.trim() &&
            !isValidEmail(
                dealerChecklistData.tech_support_email_address?.trim()
            )
        ) {
            isRequiredFieldFilled = false;
        }

        if (
            billingContactPhoneNumber?.trim() &&
            billingContactPhoneNumber?.replace(/\D/g, '').trim().length < 10
        ) {
            isRequiredFieldFilled = false;
        }

        if (
            dealerChecklistData.billing_contact_email_address?.trim() &&
            !isValidEmail(
                dealerChecklistData.billing_contact_email_address?.trim()
            )
        ) {
            isRequiredFieldFilled = false;
        }

        if (
            dealerChecklistData.company_passcode?.trim() &&
            dealerChecklistData.company_passcode?.trim().length < 8
        ) {
            isRequiredFieldFilled = false;
        }

        setIsBillingLicenseVerified(isRequiredFieldFilled);
    };

    const validateBillingLicenseDetails = (requestFrom: string): boolean => {
        const errors: DealerChecklistErrors = {};

        if (requestFrom === 'Submit') {
            if (!techSupportPhoneNumber?.replace(/\D/g, '').trim()) {
                errors.tech_support_phone_number =
                    'Please fill the Dealer Tech Support Phone Number!';
            }

            if (!dealerChecklistData.tech_support_email_address.trim()) {
                errors.tech_support_email_address =
                    'Please fill the Dealer Tech Support Email address!';
            }

            if (!dealerChecklistData.billing_contact_person?.trim()) {
                errors.billing_contact_person =
                    'Please fill the Primary Billing Contact Person!';
            }

            if (!billingContactPhoneNumber?.replace(/\D/g, '').trim()) {
                errors.billing_contact_phone_number =
                    'Please fill the Billing Contact Phone number!';
            }

            if (!dealerChecklistData.billing_contact_email_address.trim()) {
                errors.billing_contact_email_address =
                    'Please fill the Billing Contact Email address!';
            }

            if (!dealerChecklistData.company_passcode?.trim()) {
                errors.company_passcode = 'Please fill the Company Passcode!';
            }
        }

        if (
            techSupportPhoneNumber?.trim() &&
            techSupportPhoneNumber?.replace(/\D/g, '').trim().length < 10
        ) {
            errors.tech_support_phone_number =
                'Invalid Dealer Tech Support Phone Number (must contain 10 numbers)!';
        }

        if (
            dealerChecklistData.tech_support_email_address?.trim() &&
            !isValidEmail(
                dealerChecklistData.tech_support_email_address?.trim()
            )
        ) {
            errors.tech_support_email_address =
                'Invalid Dealer Tech Support Email address!';
        }

        if (
            billingContactPhoneNumber?.trim() &&
            billingContactPhoneNumber?.replace(/\D/g, '').trim().length < 10
        ) {
            errors.billing_contact_phone_number =
                'Invalid Billing Contact Phone Number (must contain 10 numbers)!';
        }

        if (
            dealerChecklistData.billing_contact_email_address?.trim() &&
            !isValidEmail(
                dealerChecklistData.billing_contact_email_address?.trim()
            )
        ) {
            errors.billing_contact_email_address =
                'Invalid Billing Contact Email address!';
        }

        if (dealerChecklistData.company_passcode?.trim()) {
            if (dealerChecklistData.company_passcode?.trim().length < 8) {
                errors.company_passcode =
                    'Invalid Company Passcode (must contain 8 characters)!';
            }
        }

        setErrorMessage(errors);

        if (Object.keys(errors).length !== 0) {
            if (activeSection !== 2) toggleSection(2);
            return false;
        }
        return true;
    };

    const validateAuthorizedOfficePersonnelInfo = () => {
        let isRequiredFieldFilled = true;

        const authorizedPersonnelEmptyDataRemoved =
            removeObjectsWithAllEmptyValues(officePersonnelBlocks);

        if (!isValidObjects(authorizedPersonnelEmptyDataRemoved)) {
            isRequiredFieldFilled = false;
        }

        for (let i = 0; i < authorizedPersonnelEmptyDataRemoved.length; i++) {
            const block = authorizedPersonnelEmptyDataRemoved[i];
            const phone = block.phone?.trim();

            if (phone && phone.length < 10) {
                isRequiredFieldFilled = false;
                break;
            }

            const email = block.email?.trim();

            if (email && !isValidEmail(email)) {
                isRequiredFieldFilled = false;
                break;
            }

            const passcode = block.passcode?.trim();

            if (passcode && passcode.length < 8) {
                isRequiredFieldFilled = false;
                break;
            }
        }

        setIsOfficePersonnelVerified(isRequiredFieldFilled);
    };

    const validateAuthorizedOfficePersonnel = (
        requestFrom: string
    ): boolean => {
        const errors: DealerChecklistErrors = {};
        if (!errors.authorized_office_personnel)
            errors.authorized_office_personnel = [];

        // const authorizedPersonnelEmptyDataRemoved =
        //     removeObjectsWithAllEmptyValues(officePersonnelBlocks);

        if (requestFrom === 'Submit') {
            // if (!isValidObjects(authorizedPersonnelEmptyDataRemoved)) {
            //     errors.authorized_office_personnel[
            //         authorizedPersonnelEmptyDataRemoved.length - 1
            //     ] = 'Please fill the Authorized Office Personnel details!';
            // }

            if (officePersonnelBlocks.length !== 0) {
                for (let i = 0; i < officePersonnelBlocks.length; i++) {
                    const block = officePersonnelBlocks[i];

                    if (
                        block.name?.trim() === '' ||
                        block.phone?.trim() === '' ||
                        block.email?.trim() === '' ||
                        block.passcode?.trim() === ''
                    ) {
                        errors.authorized_office_personnel[i] =
                            'Please fill the Authorized Office Personnel details!';
                    }
                }
            } else {
                errors.authorized_office_personnel[0] =
                    'Please fill the Authorized Office Personnel details!';
            }
        }

        for (let i = 0; i < officePersonnelBlocks.length; i++) {
            const block = officePersonnelBlocks[i];
            const phone = block.phone?.trim();

            if (phone && phone.length < 10) {
                errors.authorized_office_personnel[i] =
                    'Invalid Phone number (must contain 10 characters)!';
            }

            const email = block.email?.trim();

            if (email && !isValidEmail(email)) {
                errors.authorized_office_personnel[i] =
                    'Invalid Email address!';
            }

            const passcode = block.passcode?.trim();

            if (passcode && passcode.length < 8) {
                errors.authorized_office_personnel[i] =
                    'Invalid Personal Passcode (must contain 8 characters)!';
            }
        }

        setErrorMessage(errors);

        if (
            Object.keys(errors).length !== 0 &&
            errors.authorized_office_personnel.length !== 0
        ) {
            if (activeSection !== 3) toggleSection(3);
            return false;
        }
        return true;
    };

    const validateTechnicalSupportTeamInfo = () => {
        let isRequiredFieldFilled = true;

        const technicalSupportEmptyDataRemoved =
            removeObjectsWithAllEmptyValues(technicalSupportBlocks);

        if (!isValidObjects(technicalSupportEmptyDataRemoved)) {
            isRequiredFieldFilled = false;
        }

        for (let i = 0; i < technicalSupportEmptyDataRemoved.length; i++) {
            const block = technicalSupportEmptyDataRemoved[i];
            const phone = block.phone?.trim();

            if (phone && phone.length < 10) {
                isRequiredFieldFilled = false;
                break;
            }

            const email = block.email?.trim();

            if (email && !isValidEmail(email)) {
                isRequiredFieldFilled = false;
                break;
            }

            const passcode = block.passcode?.trim();

            if (passcode && passcode.length < 8) {
                isRequiredFieldFilled = false;
                break;
            }
        }

        setIsTechnicalSupportTeamVerified(isRequiredFieldFilled);
    };

    const validateTechnicalSupportTeam = (requestFrom: string): boolean => {
        const errors: DealerChecklistErrors = {};
        if (!errors.technical_support_team) errors.technical_support_team = [];

        // const technicalSupportEmptyDataRemoved =
        //     removeObjectsWithAllEmptyValues(technicalSupportBlocks);

        if (requestFrom === 'Submit') {
            // if (!isValidObjects(technicalSupportEmptyDataRemoved)) {
            //     errors.technical_support_team[
            //         technicalSupportEmptyDataRemoved.length - 1
            //     ] = 'Please fill the Technical Support Team details!';
            // }

            if (technicalSupportBlocks.length !== 0) {
                for (let i = 0; i < technicalSupportBlocks.length; i++) {
                    const block = technicalSupportBlocks[i];

                    if (
                        block.name?.trim() === '' ||
                        block.phone?.trim() === '' ||
                        block.email?.trim() === '' ||
                        block.passcode?.trim() === ''
                    ) {
                        errors.technical_support_team[i] =
                            'Please fill the Technical Support Team details!';
                    }
                }
            } else {
                errors.technical_support_team[0] =
                    'Please fill the Technical Support Team details!';
            }
        }

        for (let i = 0; i < technicalSupportBlocks.length; i++) {
            const block = technicalSupportBlocks[i];
            const phone = block.phone?.trim();

            if (phone && phone.length < 10) {
                errors.technical_support_team[i] =
                    'Invalid Phone number (must contain 10 characters)!';
            }

            const email = block.email?.trim();

            if (email && !isValidEmail(email)) {
                errors.technical_support_team[i] = 'Invalid Email address!';
            }

            const passcode = block.passcode?.trim();

            if (passcode && passcode.length < 8) {
                errors.technical_support_team[i] =
                    'Invalid Personal Passcode (must contain 8 characters)!';
            }
        }

        setErrorMessage(errors);

        if (
            Object.keys(errors).length !== 0 &&
            errors.technical_support_team.length !== 0
        ) {
            if (activeSection !== 4) toggleSection(4);
            return false;
        }
        return true;
    };

    const validateReportSetupInfo = () => {
        let isRequiredFieldFilled = true;

        const reportEmailEmptyDataRamoved = reportEmailBlocks.filter(
            (val) => val.trim() !== ''
        );

        for (let i = 0; i < reportEmailEmptyDataRamoved.length; i++) {
            const block = reportEmailEmptyDataRamoved[i];
            const email = block.trim();

            if (block.trim() && !isValidEmail(email)) {
                isRequiredFieldFilled = false;
                break;
            }
        }

        setIsReportSetupVerified(isRequiredFieldFilled);
    };

    const validateReportSetup = (requestFrom: string): boolean => {
        const errors: DealerChecklistErrors = {};
        if (!errors.report_recipient_emails)
            errors.report_recipient_emails = [];

        // const reportEmailEmptyDataRamoved = reportEmailBlocks.filter(
        //     (val) => val.trim() !== ''
        // );

        for (let i = 0; i < reportEmailBlocks.length; i++) {
            const block = reportEmailBlocks[i];
            const email = block.trim();

            if (block.trim() && !isValidEmail(email)) {
                errors.report_recipient_emails[i] = 'Invalid Email address!';
            }
        }

        setErrorMessage(errors);

        if (
            Object.keys(errors).length !== 0 &&
            errors.report_recipient_emails.length !== 0
        ) {
            if (activeSection !== 5) toggleSection(5);
            return false;
        }
        return true;
    };

    const updateDealerChecklistMutation = useMutation({
        mutationFn: updateDealerChecklist,
    });

    const handleSaveData = async (action: string, nextSectionId?: number) => {
        if (
            !activeUser ||
            (action !== 'Submit' &&
                (activeSection === null || activeSection === undefined)) ||
            !savedDealerChecklistData
        ) {
            return;
        }

        setIsLoading(true);

        let validateData = true;

        if (action !== 'Submit') {
            if (activeSection === 1)
                validateData = validateCompanyInformation(action);
            else if (activeSection === 2)
                validateData = validateBillingLicenseDetails(action);
            else if (activeSection === 3)
                validateData = validateAuthorizedOfficePersonnel(action);
            else if (activeSection === 4)
                validateData = validateTechnicalSupportTeam(action);
            else if (activeSection === 5)
                validateData = validateReportSetup(action);
        } else {
            validateData = validateCompanyInformation(action);

            if (validateData)
                validateData = validateBillingLicenseDetails(action);

            if (validateData)
                validateData = validateAuthorizedOfficePersonnel(action);

            if (validateData)
                validateData = validateTechnicalSupportTeam(action);

            if (validateData) validateData = validateReportSetup(action);
        }

        if (!validateData) {
            setIsLoading(false);
            return;
        }

        const updatedDealerChecklistData = validateAndRemoveEmptyObjects();

        let excludeKeys = ['status'];
        if (accountType !== AccountType.Evolon) {
            excludeKeys.push('dealer_account_number');
        }

        let inputDifference = getObjectDifferences(
            savedDealerChecklistData,
            updatedDealerChecklistData,
            excludeKeys
        );
        console.log('JSON Diff:', inputDifference);

        if (
            Object.keys(savedDealerChecklistData.report_setup).length === 0 &&
            Object.keys(inputDifference).every(
                (key) => key === 'report_setup'
            ) &&
            defaultReportSetup.account_changes === dailyReport.account_changes
        ) {
            const { report_setup, ...modifiedInput } = inputDifference;
            inputDifference = modifiedInput;
        }

        try {
            if (
                Object.keys(inputDifference).length !== 0 ||
                (savedDealerChecklistData.status !== 'Completed' &&
                    action === 'Submit')
            ) {
                await updateDealerChecklistMutation.mutateAsync({
                    user: activeUser,
                    dealerId: dealerId,
                    dealerChecklistData: {
                        ...inputDifference,
                        ...(!(
                            Object.keys(inputDifference).length === 1 &&
                            Object.keys(inputDifference)[0] ===
                                'dealer_account_number'
                        ) && {
                            status:
                                action === 'Submit' ? 'Completed' : 'Pending',
                        }),
                    },
                });

                setSavedDealerChecklistData({
                    ...updatedDealerChecklistData,
                    office_hours: deepCopyOfficeHoursData(
                        removeObjectsWithAllEmptyValues(timeBlocks)
                    ),
                    office_phone_number: officePhoneNumber?.replace(/\D/g, ''),
                    tech_support_phone_number: techSupportPhoneNumber?.replace(
                        /\D/g,
                        ''
                    ),
                    billing_contact_phone_number:
                        billingContactPhoneNumber?.replace(/\D/g, ''),
                    state_burglar_license: deepCopyLicenseData(
                        removeObjectsWithAllEmptyValues(burglarLicenseBlocks)
                    ),
                    private_security_license: deepCopyLicenseData(
                        removeObjectsWithAllEmptyValues(securityLicenseBlocks)
                    ),
                    authorized_office_personnel: deepCopyContactData(
                        removeObjectsWithAllEmptyValues(officePersonnelBlocks)
                    ),
                    technical_support_team: deepCopyContactData(
                        removeObjectsWithAllEmptyValues(technicalSupportBlocks)
                    ),
                    report_setup: dailyReport,
                    report_recipient_emails: reportEmailBlocks.filter(
                        (val) => val.trim() !== ''
                    ),
                    status: `${action === 'Submit' ? 'Completed' : 'Pending'}`,
                });

                if (action !== 'Close' && action !== 'Submit') {
                    validateCompanyInfo();
                    validateBillingLicenseInfo();
                    validateAuthorizedOfficePersonnelInfo();
                    validateTechnicalSupportTeamInfo();
                    validateReportSetupInfo();
                    updateProgress();
                }

                if (action === 'Submit') {
                    toast.success('Dealer profile submitted successfully.');
                } else {
                    toast.success(`Dealer Profile updated.`);
                }

                if (action === 'Next') {
                    if (activeSection !== null && activeSection < 5) {
                        toggleSection(activeSection + 1);
                    }
                } else if (action === 'Back' && activeSection !== null) {
                    toggleSection(activeSection - 1);
                } else if (action === 'Toggle' && nextSectionId !== undefined) {
                    toggleSection(nextSectionId);
                } else if (action === 'Close' || action === 'Submit') {
                    handleClose();
                }
            } else {
                if (action === 'Next') {
                    toast.info('No changes found!');

                    if (activeSection !== null && activeSection < 5) {
                        toggleSection(activeSection + 1);
                    }
                } else if (action === 'Back' && activeSection !== null) {
                    toggleSection(activeSection - 1);
                } else if (action === 'Toggle' && nextSectionId !== undefined) {
                    toggleSection(nextSectionId);
                } else if (action === 'Close') {
                    handleClose();
                } else if (action === 'Submit') {
                    handleClose();
                }
            }
        } catch (err) {
            console.error(err);
            toast.error('Error, unable to update Dealer Profile!');
        }

        setIsLoading(false);
    };

    const handleNavigation = (action: string, nextSectionId?: number) => {
        if (
            action !== 'Toggle' &&
            action !== 'Close' &&
            (activeSection === null || activeSection === undefined)
        ) {
            return;
        }

        if (!savedDealerChecklistData) return;

        if (action === 'Back' || action === 'Toggle' || action === 'Close') {
            const updatedDealerChecklistData = validateAndRemoveEmptyObjects();

            let excludeKeys = ['status'];
            if (accountType !== AccountType.Evolon) {
                excludeKeys.push('dealer_account_number');
            }
            // if (
            //     defaultReportSetup.account_changes ===
            //         dailyReport.account_changes &&
            //     Object.keys(savedDealerChecklistData.report_setup).length === 0
            // ) {
            //     excludeKeys.push('report_setup');
            // }

            let diff = getObjectDifferences(
                savedDealerChecklistData,
                updatedDealerChecklistData,
                excludeKeys
            );

            console.log(diff);

            if (
                Object.keys(savedDealerChecklistData.report_setup).length ===
                    0 &&
                Object.keys(diff).every((key) => key === 'report_setup') &&
                defaultReportSetup.account_changes ===
                    dailyReport.account_changes
            ) {
                const { report_setup, ...modifiedInput } = diff;
                diff = modifiedInput;
            }

            if (Object.keys(diff).length === 0) {
                if (action === 'Back' && activeSection != null) {
                    toggleSection(activeSection - 1);
                } else if (action === 'Toggle' && nextSectionId !== undefined) {
                    toggleSection(nextSectionId);
                } else if (action === 'Close') {
                    handleClose();
                }
            } else {
                const confirmSwitch = confirm(
                    'You have unsaved changes. Save them now. If you cancel, all unsaved changes will be discarded.'
                );
                if (confirmSwitch) {
                    if (action === 'Back' || action === 'Close') {
                        handleSaveData(action);
                    } else if (
                        action === 'Toggle' &&
                        nextSectionId !== undefined
                    ) {
                        handleSaveData(action, nextSectionId);
                    }
                } else {
                    resetChangesInDealerChecklistData(
                        diff,
                        savedDealerChecklistData
                    );

                    if (action === 'Back' && activeSection != null) {
                        toggleSection(activeSection - 1);
                    } else if (
                        action === 'Toggle' &&
                        nextSectionId !== undefined
                    ) {
                        toggleSection(nextSectionId);
                    } else if (action === 'Close') {
                        handleClose();
                    }
                }
            }
        }
    };

    const removeTimeBlock = (targetIndex: number) => {
        if (timeBlocks.length <= 1) {
            toast.error('Must have at least one time block.');
            return;
        }

        const timeBlockCopy = [...timeBlocks];
        timeBlockCopy.splice(targetIndex, 1);
        setTimeBlocks(timeBlockCopy);
    };

    const removeBurlarLicenseBlock = (targetIndex: number) => {
        if (burglarLicenseBlocks.length <= 1) {
            toast.error('Must have at least one Burglar License block.');
            return;
        }

        const burglarLicenseBlockCopy = [...burglarLicenseBlocks];
        burglarLicenseBlockCopy.splice(targetIndex, 1);
        setBurglarLicenseBlocks(burglarLicenseBlockCopy);
    };

    const removeSecurityLicenseBlock = (targetIndex: number) => {
        if (securityLicenseBlocks.length <= 1) {
            toast.error(
                'Must have at least one Private Security License block.'
            );
            return;
        }

        const securityLicenseBlockCopy = [...securityLicenseBlocks];
        securityLicenseBlockCopy.splice(targetIndex, 1);
        setSecurityLicenseBlocks(securityLicenseBlockCopy);
    };

    const removeOfficePersonnelBlock = (targetIndex: number) => {
        if (officePersonnelBlocks.length <= 1) {
            toast.error(
                'Must have at least one Authorized Office Personnel block.'
            );
            return;
        }

        const officePersonnelBlockCopy = [...officePersonnelBlocks];
        officePersonnelBlockCopy.splice(targetIndex, 1);
        setOfficePersonnelBlocks(officePersonnelBlockCopy);

        if (activeSubSection.office_personnel === targetIndex) {
            setActiveSubSection((prev) => ({
                ...prev,
                ['office_personnel']: targetIndex,
            }));
        }
    };

    const removeTechnicalSupportBlock = (targetIndex: number) => {
        if (technicalSupportBlocks.length <= 1) {
            toast.error('Must have at least one Technical Support Team block.');
            return;
        }

        const technicalSupportBlockCopy = [...technicalSupportBlocks];
        technicalSupportBlockCopy.splice(targetIndex, 1);
        setTechnicalSupportBlocks(technicalSupportBlockCopy);

        if (activeSubSection.technical_support === targetIndex) {
            setActiveSubSection((prev) => ({
                ...prev,
                ['technical_support']: targetIndex,
            }));
        }
    };

    const removeReportEmailBlock = (targetIndex: number) => {
        const reportEmailBlocksCopy = [...reportEmailBlocks];
        reportEmailBlocksCopy.splice(targetIndex, 1);
        setReportEmailBlocks(reportEmailBlocksCopy);
    };

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleSaveData('Submit');
    };

    useEffect(() => {
        validateCompanyInfo();
        validateBillingLicenseInfo();
        validateAuthorizedOfficePersonnelInfo();
        validateTechnicalSupportTeamInfo();
        validateReportSetupInfo();
        updateProgress();
    }, []);

    return (
        <ModalBase
            title="Dealer Profile"
            handleClose={() => handleNavigation('Close')}
            className="DealerChecklistModal"
            closeOnBackdropClick={false}
        >
            <>
                {isLoading && (
                    <LoadingModal
                        modalText="Updating Dealer Profile data..."
                        zIndex={96}
                    />
                )}
                {/*  Progress bar */}
                <div
                    style={{
                        width: '80%',
                        margin: '10px auto',
                        border: '1px solid #ccc',
                        borderRadius: '10px',
                    }}
                >
                    <div
                        style={{
                            width: `${progressStatus}%`,
                            height: '20px',
                            background:
                                progressStatus === 100 ? 'green' : 'blue',
                            borderRadius: '10px',
                            transition: '0.3s',
                        }}
                    ></div>
                </div>

                <p style={{ textAlign: 'center' }}>
                    {progressStatus}% completed
                </p>
                <form
                    id="dealer-checklist-form"
                    key="dealer-checklist-form"
                    onSubmit={onSubmit}
                >
                    {/* Section - Company Information */}
                    <div className="section-container">
                        <div
                            className={`section-container-header ${
                                activeSection === 1 ? 'active-header' : ''
                            }`}
                            onClick={() => handleNavigation('Toggle', 1)}
                        >
                            <div className="section-container-header-caption">
                                Company Information
                            </div>
                            <div className="section-container-header-toggle">
                                {isCompanyInfoVerified && (
                                    <FaCheck color="green" size={30} />
                                )}
                                {(activeSection === 1 && <FaChevronDown />) || (
                                    <FaChevronRight />
                                )}
                            </div>
                        </div>
                        {activeSection === 1 && (
                            <div className="section-container-body">
                                <div className="section-node">
                                    <div>
                                        {accountType === AccountType.Evolon ||
                                        dealerChecklistData.dealer_account_number ? (
                                            <div>
                                                <Input
                                                    id="dealer_account_number"
                                                    name="dealer_account_number"
                                                    label="Dealer Account Number"
                                                    tooltip={
                                                        accountType ===
                                                        AccountType.Evolon
                                                            ? 'Letters and numbers only; no symbols or spaces.'
                                                            : ''
                                                    }
                                                    className="input field"
                                                    type="text"
                                                    value={
                                                        dealerChecklistData.dealer_account_number
                                                            ? dealerChecklistData.dealer_account_number
                                                            : ''
                                                    }
                                                    onChange={(value) =>
                                                        onInputTextChange(
                                                            'dealer_account_number',
                                                            value,
                                                            'string'
                                                        )
                                                    }
                                                    onBlur={(value) =>
                                                        handleBlur(
                                                            'dealer_account_number',
                                                            value
                                                        )
                                                    }
                                                    autoComplete="false"
                                                    disabled={
                                                        accountType ===
                                                        AccountType.Evolon
                                                            ? false
                                                            : true
                                                    }
                                                    maxLength={255}
                                                />
                                            </div>
                                        ) : null}
                                        <div>
                                            <Input
                                                id="company_name"
                                                name="company_name"
                                                label="Company Name"
                                                className="input field"
                                                type="text"
                                                value={
                                                    dealerChecklistData.company_name
                                                        ? dealerChecklistData.company_name
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'company_name',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'company_name',
                                                        value
                                                    )
                                                }
                                                autoComplete="false"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.company_name && (
                                                <p
                                                    id="company-name-error"
                                                    className="error"
                                                    data-testid="company-name-error"
                                                >
                                                    {errorMessage.company_name}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="president_name"
                                                name="president_name"
                                                label="Company Owner/President"
                                                className="input field"
                                                type="text"
                                                value={
                                                    dealerChecklistData.president
                                                        ? dealerChecklistData.president
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'president',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'president',
                                                        value
                                                    )
                                                }
                                                autoComplete="false"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.president && (
                                                <p
                                                    id="company-president-error"
                                                    className="error"
                                                    data-testid="company-president-error"
                                                >
                                                    {errorMessage.president}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="contact_person"
                                                name="contact_person"
                                                label="Primary Contact Person"
                                                className="input field"
                                                type="text"
                                                value={
                                                    dealerChecklistData.company_contact_person
                                                        ? dealerChecklistData.company_contact_person
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'company_contact_person',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'company_contact_person',
                                                        value
                                                    )
                                                }
                                                autoComplete="false"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.company_contact_person && (
                                                <p
                                                    id="company-contact-person-error"
                                                    className="error"
                                                    data-testid="company-contact-person-error"
                                                >
                                                    {
                                                        errorMessage.company_contact_person
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="address"
                                                name="address"
                                                label="Address"
                                                className="input field"
                                                type="text"
                                                value={
                                                    dealerChecklistData.address
                                                        ? dealerChecklistData.address
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'address',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur('address', value)
                                                }
                                                autoComplete="false"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.address && (
                                                <p
                                                    id="company-address-error"
                                                    className="error"
                                                    data-testid="company-address-error"
                                                >
                                                    {errorMessage.address}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="city"
                                                name="city"
                                                label="City"
                                                className="input field"
                                                type="text"
                                                value={
                                                    dealerChecklistData.city
                                                        ? dealerChecklistData.city
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'city',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur('city', value)
                                                }
                                                autoComplete="false"
                                                required
                                                maxLength={100}
                                            />
                                            {errorMessage.city && (
                                                <p
                                                    id="company-city-error"
                                                    className="error"
                                                    data-testid="company-city-error"
                                                >
                                                    {errorMessage.city}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="county"
                                                name="county"
                                                label="County"
                                                className="input field"
                                                type="text"
                                                value={
                                                    dealerChecklistData.county
                                                        ? dealerChecklistData.county
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'county',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur('county', value)
                                                }
                                                autoComplete="false"
                                                required
                                                maxLength={100}
                                            />
                                            {errorMessage.county && (
                                                <p
                                                    id="company-county-error"
                                                    className="error"
                                                    data-testid="company-county-error"
                                                >
                                                    {errorMessage.county}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="state"
                                                name="state"
                                                label="State"
                                                className="input field"
                                                type="text"
                                                value={
                                                    dealerChecklistData.state
                                                        ? dealerChecklistData.state
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'state',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur('state', value)
                                                }
                                                autoComplete="false"
                                                required
                                                maxLength={100}
                                            />
                                            {errorMessage.state && (
                                                <p
                                                    id="company-state-error"
                                                    className="error"
                                                    data-testid="company-state-error"
                                                >
                                                    {errorMessage.state}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="zipcode"
                                                name="zipcode"
                                                label="Zip"
                                                className="input field"
                                                type="text"
                                                value={
                                                    dealerChecklistData.zip
                                                        ? dealerChecklistData.zip
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'zip',
                                                        value,
                                                        'number'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur('zip', value)
                                                }
                                                autoComplete="false"
                                                required
                                                minLength={5}
                                                maxLength={32}
                                            />
                                            {errorMessage.zip && (
                                                <p
                                                    id="company-zip-error"
                                                    className="error"
                                                    data-testid="company-zip-error"
                                                >
                                                    {errorMessage.zip}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <span>Office Hours</span>
                                            <span className="asterisk">*</span>
                                            <div className="schedule-hours-template">
                                                {timeBlocks.map(
                                                    (timeBlock, index) => {
                                                        return (
                                                            <Fragment
                                                                key={`timeblock-${index}`}
                                                            >
                                                                <div>
                                                                    <span>
                                                                        Day(s)
                                                                    </span>
                                                                    <span className="asterisk">
                                                                        *
                                                                    </span>
                                                                    <Select
                                                                        id={`day-select-${index}`}
                                                                        isMulti
                                                                        className="select"
                                                                        value={officeHoursOptions.filter(
                                                                            (
                                                                                opt
                                                                            ) =>
                                                                                timeBlock.days.includes(
                                                                                    opt.label
                                                                                )
                                                                        )}
                                                                        styles={
                                                                            timeSelectCustomStyles
                                                                        }
                                                                        options={getAvailableDayOptions(
                                                                            index
                                                                        )}
                                                                        onChange={(
                                                                            newValue
                                                                        ) => {
                                                                            const timeBlocksCopy =
                                                                                [
                                                                                    ...timeBlocks,
                                                                                ];

                                                                            if (
                                                                                Array.isArray(
                                                                                    newValue
                                                                                )
                                                                            ) {
                                                                                newValue.sort(
                                                                                    (
                                                                                        a: SelectOption,
                                                                                        b: SelectOption
                                                                                    ) =>
                                                                                        parseInt(
                                                                                            a.value,
                                                                                            10
                                                                                        ) -
                                                                                        parseInt(
                                                                                            b.value,
                                                                                            10
                                                                                        )
                                                                                );
                                                                            }

                                                                            timeBlocksCopy[
                                                                                index
                                                                            ].days =
                                                                                newValue
                                                                                    ? newValue.map(
                                                                                          (
                                                                                              opt
                                                                                          ) =>
                                                                                              opt.label
                                                                                      )
                                                                                    : [];

                                                                            setTimeBlocks(
                                                                                timeBlocksCopy
                                                                            );
                                                                        }}
                                                                        required
                                                                    />
                                                                </div>
                                                                <div className="timeSelectsContainer">
                                                                    <div>
                                                                        <span>
                                                                            Start
                                                                            Time
                                                                        </span>
                                                                        <span className="asterisk">
                                                                            *
                                                                        </span>
                                                                        <Select
                                                                            id={`start-time-select-${index}`}
                                                                            isMulti={
                                                                                false
                                                                            }
                                                                            className="select"
                                                                            isClearable={
                                                                                false
                                                                            }
                                                                            styles={
                                                                                timeSelectCustomStyles
                                                                            }
                                                                            value={timeOptions.find(
                                                                                (
                                                                                    opt
                                                                                ) =>
                                                                                    opt.value ===
                                                                                    timeBlock.startTime
                                                                            )}
                                                                            options={
                                                                                timeOptions
                                                                            }
                                                                            onChange={(
                                                                                newValue
                                                                            ) => {
                                                                                const timeBlocksCopy =
                                                                                    [
                                                                                        ...timeBlocks,
                                                                                    ];

                                                                                timeBlocksCopy[
                                                                                    index
                                                                                ].startTime =
                                                                                    newValue?.value ??
                                                                                    null;

                                                                                setTimeBlocks(
                                                                                    timeBlocksCopy
                                                                                );
                                                                            }}
                                                                            required
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <span>
                                                                            End
                                                                            Time
                                                                        </span>
                                                                        <span className="asterisk">
                                                                            *
                                                                        </span>
                                                                        <Select
                                                                            id={`end-time-select-${index}`}
                                                                            isMulti={
                                                                                false
                                                                            }
                                                                            className="select"
                                                                            isClearable={
                                                                                false
                                                                            }
                                                                            styles={
                                                                                timeSelectCustomStyles
                                                                            }
                                                                            value={timeOptionsWithEndOfDay.find(
                                                                                (
                                                                                    opt
                                                                                ) =>
                                                                                    opt.value ===
                                                                                    timeBlock.endTime
                                                                            )}
                                                                            options={
                                                                                timeOptionsWithEndOfDay
                                                                            }
                                                                            onChange={(
                                                                                newValue
                                                                            ) => {
                                                                                const timeBlocksCopy =
                                                                                    [
                                                                                        ...timeBlocks,
                                                                                    ];

                                                                                timeBlocksCopy[
                                                                                    index
                                                                                ].endTime =
                                                                                    newValue?.value ??
                                                                                    null;

                                                                                setTimeBlocks(
                                                                                    timeBlocksCopy
                                                                                );
                                                                            }}
                                                                            required
                                                                        />
                                                                    </div>
                                                                    {index !==
                                                                        0 && (
                                                                        <div className="deleteMonitorBlockContainer">
                                                                            <DeleteIcon
                                                                                className="deleteIcon"
                                                                                onClick={() =>
                                                                                    removeTimeBlock(
                                                                                        index
                                                                                    )
                                                                                }
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </Fragment>
                                                        );
                                                    }
                                                )}

                                                <div className="timeBlocksButtonContainer">
                                                    <button
                                                        type="button"
                                                        className={`btn outline ${
                                                            timeBlocks.length >=
                                                            3
                                                                ? ''
                                                                : 'primary'
                                                        }`}
                                                        onClick={() => {
                                                            if (
                                                                timeBlocks.length <
                                                                3
                                                            ) {
                                                                setTimeBlocks([
                                                                    ...timeBlocks,
                                                                    {
                                                                        days: [],
                                                                        startTime:
                                                                            null,
                                                                        endTime:
                                                                            null,
                                                                    },
                                                                ]);
                                                            }
                                                        }}
                                                        disabled={
                                                            timeBlocks.length >=
                                                            3
                                                        }
                                                    >
                                                        Add Time Block +
                                                    </button>
                                                </div>
                                            </div>
                                            {errorMessage.office_hours && (
                                                <p
                                                    id="company-office-hours-error"
                                                    className="error"
                                                    data-testid="company-office-hours-error"
                                                >
                                                    {errorMessage.office_hours}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="office_phone"
                                                name="office_phone"
                                                label="Office Phone"
                                                className="input field"
                                                type="text"
                                                value={officePhoneNumber}
                                                onChange={(value) =>
                                                    handlePhoneNumberChange(
                                                        value,
                                                        setOfficePhoneNumber
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handlePhoneNumberBlur(
                                                        value,
                                                        setOfficePhoneNumber
                                                    )
                                                }
                                                onFocus={(value) =>
                                                    handlePhoneNumberFocus(
                                                        value,
                                                        setOfficePhoneNumber
                                                    )
                                                }
                                                autoComplete="false"
                                                required
                                                minLength={10}
                                                maxLength={20}
                                            />
                                            {errorMessage.office_phone_number && (
                                                <p
                                                    id="company-office-phone-error"
                                                    className="error"
                                                    data-testid="company-office-phone-error"
                                                >
                                                    {
                                                        errorMessage.office_phone_number
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="back_line_number"
                                                name="back_line_number"
                                                label="Back Line Number"
                                                className="input field"
                                                type="text"
                                                value={
                                                    dealerChecklistData.back_line_number
                                                        ? dealerChecklistData.back_line_number
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'back_line_number',
                                                        value,
                                                        'phonenumber'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'back_line_number',
                                                        value
                                                    )
                                                }
                                                autoComplete="false"
                                                minLength={10}
                                                maxLength={20}
                                            />
                                            {errorMessage.back_line_number && (
                                                <p
                                                    id="company-backline-number-error"
                                                    className="error"
                                                    data-testid="company-backline-number-error"
                                                >
                                                    {
                                                        errorMessage.back_line_number
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <ButtonGroup
                                        alignment={
                                            ButtonGroupAlignment.bottomright
                                        }
                                    >
                                        <Button
                                            id="create"
                                            className="btn primary"
                                            label="Save & Next"
                                            type="button"
                                            onClick={() =>
                                                handleSaveData('Next')
                                            }
                                        />
                                    </ButtonGroup>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section - License & Billing Details */}
                    <div className="section-container">
                        <div
                            className={`section-container-header ${
                                activeSection === 2 ? 'active-header' : ''
                            }`}
                            onClick={() => handleNavigation('Toggle', 2)}
                        >
                            <div className="section-container-header-caption">
                                License & Billing Details
                            </div>
                            <div className="section-container-header-toggle">
                                {isBillingLicenseVerified && (
                                    <FaCheck color="green" size={30} />
                                )}
                                {(activeSection === 2 && <FaChevronDown />) || (
                                    <FaChevronRight />
                                )}
                            </div>
                        </div>
                        {activeSection === 2 && (
                            <div className="section-container-body">
                                <div className="section-node">
                                    <div>
                                        <div>
                                            <span>
                                                State Burglar Alarm License
                                            </span>
                                            <div className="schedule-hours-template">
                                                {burglarLicenseBlocks.map(
                                                    (licenseBlock, index) => {
                                                        return (
                                                            <Fragment
                                                                key={`licenseblock-${index}`}
                                                            >
                                                                <div>
                                                                    <Input
                                                                        id={`burglar-license-state-${index}`}
                                                                        name={`burglar-license-state-${index}`}
                                                                        label="State"
                                                                        className="input field license-input"
                                                                        type="text"
                                                                        value={
                                                                            licenseBlock.state
                                                                                ? licenseBlock.state
                                                                                : ''
                                                                        }
                                                                        onChange={(
                                                                            newValue
                                                                        ) =>
                                                                            handleBlockValueChange(
                                                                                index,
                                                                                newValue,
                                                                                'state',
                                                                                setBurglarLicenseBlocks,
                                                                                burglarLicenseBlocks
                                                                            )
                                                                        }
                                                                        onBlur={(
                                                                            newValue
                                                                        ) =>
                                                                            handleBlockFieldBlur(
                                                                                index,
                                                                                newValue,
                                                                                'state',
                                                                                setBurglarLicenseBlocks,
                                                                                burglarLicenseBlocks
                                                                            )
                                                                        }
                                                                        autoComplete="false"
                                                                        maxLength={
                                                                            255
                                                                        }
                                                                    />
                                                                </div>
                                                                <div className="timeSelectsContainer licenseDetailsContainer">
                                                                    <div>
                                                                        <Input
                                                                            id={`burglar-license-number-${index}`}
                                                                            name={`burglar-license-number-${index}`}
                                                                            label="Number"
                                                                            className="input field license-input"
                                                                            type="text"
                                                                            value={
                                                                                licenseBlock.license_number
                                                                                    ? licenseBlock.license_number
                                                                                    : ''
                                                                            }
                                                                            onChange={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockValueChange(
                                                                                    index,
                                                                                    newValue,
                                                                                    'license_number',
                                                                                    setBurglarLicenseBlocks,
                                                                                    burglarLicenseBlocks
                                                                                )
                                                                            }
                                                                            onBlur={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockFieldBlur(
                                                                                    index,
                                                                                    newValue,
                                                                                    'license_number',
                                                                                    setBurglarLicenseBlocks,
                                                                                    burglarLicenseBlocks
                                                                                )
                                                                            }
                                                                            autoComplete="false"
                                                                            maxLength={
                                                                                255
                                                                            }
                                                                        />
                                                                    </div>
                                                                    {index !==
                                                                        0 && (
                                                                        <div className="deleteMonitorBlockContainer">
                                                                            <DeleteIcon
                                                                                className="deleteIcon"
                                                                                onClick={() =>
                                                                                    removeBurlarLicenseBlock(
                                                                                        index
                                                                                    )
                                                                                }
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </Fragment>
                                                        );
                                                    }
                                                )}

                                                <div className="timeBlocksButtonContainer">
                                                    <button
                                                        type="button"
                                                        className="btn outline primary"
                                                        onClick={() => {
                                                            setBurglarLicenseBlocks(
                                                                [
                                                                    ...burglarLicenseBlocks,
                                                                    {
                                                                        state: '',
                                                                        license_number:
                                                                            '',
                                                                    },
                                                                ]
                                                            );
                                                        }}
                                                    >
                                                        Add Burglar License
                                                        Block +
                                                    </button>
                                                </div>
                                            </div>
                                            {errorMessage.state_burglar_license && (
                                                <p
                                                    id="burglar-license-error"
                                                    className="error"
                                                    data-testid="burglar-license-error"
                                                >
                                                    {
                                                        errorMessage.state_burglar_license
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <span>
                                                Private Security License
                                            </span>
                                            <div className="schedule-hours-template">
                                                {securityLicenseBlocks.map(
                                                    (licenseBlock, index) => {
                                                        return (
                                                            <Fragment
                                                                key={`security-licenseblock-${index}`}
                                                            >
                                                                <div>
                                                                    <Input
                                                                        id={`security-license-state-${index}`}
                                                                        name={`security-license-state-${index}`}
                                                                        label="State"
                                                                        className="input field license-input"
                                                                        type="text"
                                                                        value={
                                                                            licenseBlock.state
                                                                                ? licenseBlock.state
                                                                                : ''
                                                                        }
                                                                        onChange={(
                                                                            newValue
                                                                        ) =>
                                                                            handleBlockValueChange(
                                                                                index,
                                                                                newValue,
                                                                                'state',
                                                                                setSecurityLicenseBlocks,
                                                                                securityLicenseBlocks
                                                                            )
                                                                        }
                                                                        onBlur={(
                                                                            newValue
                                                                        ) =>
                                                                            handleBlockFieldBlur(
                                                                                index,
                                                                                newValue,
                                                                                'state',
                                                                                setSecurityLicenseBlocks,
                                                                                securityLicenseBlocks
                                                                            )
                                                                        }
                                                                        autoComplete="false"
                                                                        maxLength={
                                                                            255
                                                                        }
                                                                    />
                                                                </div>
                                                                <div className="timeSelectsContainer licenseDetailsContainer">
                                                                    <div>
                                                                        <Input
                                                                            id={`security-license-number-${index}`}
                                                                            name={`security-license-number-${index}`}
                                                                            label="Number"
                                                                            className="input field license-input"
                                                                            type="text"
                                                                            value={
                                                                                licenseBlock.license_number
                                                                                    ? licenseBlock.license_number
                                                                                    : ''
                                                                            }
                                                                            onChange={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockValueChange(
                                                                                    index,
                                                                                    newValue,
                                                                                    'license_number',
                                                                                    setSecurityLicenseBlocks,
                                                                                    securityLicenseBlocks
                                                                                )
                                                                            }
                                                                            onBlur={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockFieldBlur(
                                                                                    index,
                                                                                    newValue,
                                                                                    'license_number',
                                                                                    setSecurityLicenseBlocks,
                                                                                    securityLicenseBlocks
                                                                                )
                                                                            }
                                                                            autoComplete="false"
                                                                            maxLength={
                                                                                255
                                                                            }
                                                                        />
                                                                    </div>
                                                                    {index !==
                                                                        0 && (
                                                                        <div className="deleteMonitorBlockContainer">
                                                                            <DeleteIcon
                                                                                className="deleteIcon"
                                                                                onClick={() =>
                                                                                    removeSecurityLicenseBlock(
                                                                                        index
                                                                                    )
                                                                                }
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </Fragment>
                                                        );
                                                    }
                                                )}

                                                <div className="timeBlocksButtonContainer">
                                                    <button
                                                        type="button"
                                                        className="btn outline primary"
                                                        onClick={() => {
                                                            setSecurityLicenseBlocks(
                                                                [
                                                                    ...securityLicenseBlocks,
                                                                    {
                                                                        state: '',
                                                                        license_number:
                                                                            '',
                                                                    },
                                                                ]
                                                            );
                                                        }}
                                                    >
                                                        Add Security License
                                                        Block +
                                                    </button>
                                                </div>
                                            </div>
                                            {errorMessage.private_security_license && (
                                                <p
                                                    id="private-security-license-error"
                                                    className="error"
                                                    data-testid="private-security-license-error"
                                                >
                                                    {
                                                        errorMessage.private_security_license
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="dealer_tech_support_number"
                                                name="dealer_tech_support_number"
                                                label="Dealer Tech Support Number"
                                                className="input field"
                                                type="text"
                                                value={techSupportPhoneNumber}
                                                onChange={(value) => {
                                                    handlePhoneNumberChange(
                                                        value,
                                                        setTechSupportPhoneNumber
                                                    );
                                                }}
                                                onBlur={(value) =>
                                                    handlePhoneNumberBlur(
                                                        value,
                                                        setTechSupportPhoneNumber
                                                    )
                                                }
                                                onFocus={(value) =>
                                                    handlePhoneNumberFocus(
                                                        value,
                                                        setTechSupportPhoneNumber
                                                    )
                                                }
                                                autoComplete="false"
                                                required
                                                minLength={10}
                                                maxLength={20}
                                            />
                                            {errorMessage.tech_support_phone_number && (
                                                <p
                                                    id="tech-support-phone-error"
                                                    className="error"
                                                    data-testid="tech-support-phone-error"
                                                >
                                                    {
                                                        errorMessage.tech_support_phone_number
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="dealer_tech_support_email"
                                                name="dealer_tech_support_email"
                                                label="Dealer Tech Support Email Address"
                                                className="input field"
                                                type="email"
                                                value={
                                                    dealerChecklistData.tech_support_email_address
                                                        ? dealerChecklistData.tech_support_email_address
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'tech_support_email_address',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'tech_support_email_address',
                                                        value
                                                    )
                                                }
                                                autoComplete="false"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.tech_support_email_address && (
                                                <p
                                                    id="tech-support-email-error"
                                                    className="error"
                                                    data-testid="tech-support-email-error"
                                                >
                                                    {
                                                        errorMessage.tech_support_email_address
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="billing_contact"
                                                name="billing_contact"
                                                label="Primary Billing Contact Person"
                                                className="input field"
                                                type="text"
                                                value={
                                                    dealerChecklistData.billing_contact_person
                                                        ? dealerChecklistData.billing_contact_person
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'billing_contact_person',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'billing_contact_person',
                                                        value
                                                    )
                                                }
                                                autoComplete="false"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.billing_contact_person && (
                                                <p
                                                    id="billing-contact-person-error"
                                                    className="error"
                                                    data-testid="billing-contact-person-error"
                                                >
                                                    {
                                                        errorMessage.billing_contact_person
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="billing_contact_phone"
                                                name="billing_contact_phone"
                                                label="Billing Contact Phone Number"
                                                className="input field"
                                                type="text"
                                                value={
                                                    billingContactPhoneNumber
                                                }
                                                onChange={(value) => {
                                                    handlePhoneNumberChange(
                                                        value,
                                                        setBillingContactPhoneNumber
                                                    );
                                                }}
                                                onBlur={(value) =>
                                                    handlePhoneNumberBlur(
                                                        value,
                                                        setBillingContactPhoneNumber
                                                    )
                                                }
                                                onFocus={(value) =>
                                                    handlePhoneNumberFocus(
                                                        value,
                                                        setBillingContactPhoneNumber
                                                    )
                                                }
                                                autoComplete="false"
                                                required
                                                minLength={10}
                                                maxLength={20}
                                            />
                                            {errorMessage.billing_contact_phone_number && (
                                                <p
                                                    id="billing-contact-phone-error"
                                                    className="error"
                                                    data-testid="billing-contact-phone-error"
                                                >
                                                    {
                                                        errorMessage.billing_contact_phone_number
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="billing_contact_email"
                                                name="billing_contact_email"
                                                label="Billing Contact Email"
                                                className="input field"
                                                type="email"
                                                value={
                                                    dealerChecklistData.billing_contact_email_address
                                                        ? dealerChecklistData.billing_contact_email_address
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'billing_contact_email_address',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'billing_contact_email_address',
                                                        value
                                                    )
                                                }
                                                autoComplete="false"
                                                required
                                                maxLength={255}
                                            />
                                            {errorMessage.billing_contact_email_address && (
                                                <p
                                                    id="billing-contact-email-error"
                                                    className="error"
                                                    data-testid="billing-contact-email-error"
                                                >
                                                    {
                                                        errorMessage.billing_contact_email_address
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Input
                                                id="company_passcode"
                                                name="company_passcode"
                                                label="Company Passcode"
                                                tooltip="In the event company personnel cannot access the APP or Website, a company passcode/password is for ALL personnel to use when calling into the monitoring center. If a company passcode is not listed, each employee must have their own individual passcode. UCC personnel will not disclose confidential information unless provided with a company or individual passcode. (at least 8 alpha-numeric characters)"
                                                pattern="^[a-zA-Z0-9]{8,}$"
                                                title="Company Passcode must include a minimum of 8 alphanumeric characters."
                                                className="input field"
                                                type="text"
                                                value={
                                                    dealerChecklistData.company_passcode
                                                        ? dealerChecklistData.company_passcode
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    onInputTextChange(
                                                        'company_passcode',
                                                        value,
                                                        'string'
                                                    )
                                                }
                                                onBlur={(value) =>
                                                    handleBlur(
                                                        'company_passcode',
                                                        value
                                                    )
                                                }
                                                autoComplete="false"
                                                required
                                                minLength={8}
                                                maxLength={100}
                                            />
                                            {errorMessage.company_passcode && (
                                                <p
                                                    id="company-passcode-error"
                                                    className="error"
                                                    data-testid="company-passcode-error"
                                                >
                                                    {
                                                        errorMessage.company_passcode
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <ButtonGroup
                                        alignment={
                                            ButtonGroupAlignment.bottomright
                                        }
                                    >
                                        <Button
                                            id="clear"
                                            className="btn danger"
                                            label="Back"
                                            type="button"
                                            onClick={() =>
                                                handleNavigation('Back')
                                            }
                                        />
                                        <Button
                                            id="create"
                                            className="btn primary"
                                            label="Save & Next"
                                            type="button"
                                            onClick={() =>
                                                handleSaveData('Next')
                                            }
                                        />
                                    </ButtonGroup>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section - Authorized Office Personnel */}
                    <div className="section-container">
                        <div
                            className={`section-container-header ${
                                activeSection === 3 ? 'active-header' : ''
                            }`}
                            onClick={() => handleNavigation('Toggle', 3)}
                        >
                            <div className="section-container-header-caption">
                                Authorized Office Personnel
                            </div>
                            <div className="section-container-header-toggle">
                                {isOfficePersonnelVerified && (
                                    <FaCheck color="green" size={30} />
                                )}
                                {(activeSection === 3 && <FaChevronDown />) || (
                                    <FaChevronRight />
                                )}
                            </div>
                        </div>
                        {activeSection === 3 && (
                            <div className="section-container-body">
                                <div className="section-node">
                                    <div>
                                        {/* Section - Authorized Office Personnel Subsections */}
                                        {officePersonnelBlocks.map(
                                            (personnelBlock, index) => {
                                                return (
                                                    <Fragment
                                                        key={`office-personnelblock-${index}`}
                                                    >
                                                        <div className="section-container">
                                                            <div
                                                                className={`section-container-header ${
                                                                    activeSubSection.office_personnel ===
                                                                    index
                                                                        ? 'active-header'
                                                                        : ''
                                                                }`}
                                                                onClick={() =>
                                                                    toggleSubSection(
                                                                        'office_personnel',
                                                                        index
                                                                    )
                                                                }
                                                            >
                                                                <div className="section-container-header-caption">
                                                                    Contacts
                                                                </div>
                                                                {index !==
                                                                    0 && (
                                                                    <div className="section-container-header-toolbar">
                                                                        <div className="section-node-toolbar-button">
                                                                            <DeleteIcon
                                                                                className="deleteIcon"
                                                                                onClick={(
                                                                                    event
                                                                                ) => {
                                                                                    event.stopPropagation();
                                                                                    removeOfficePersonnelBlock(
                                                                                        index
                                                                                    );
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="section-container-header-toggle">
                                                                    {(activeSubSection.office_personnel ===
                                                                        index && (
                                                                        <FaChevronDown />
                                                                    )) || (
                                                                        <FaChevronRight />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {activeSubSection.office_personnel ===
                                                                index && (
                                                                <div className="section-container-body">
                                                                    <div className="section-node">
                                                                        <Input
                                                                            id={`office-personnel-name-${index}`}
                                                                            name={`office-personnel-name-${index}`}
                                                                            label="Name"
                                                                            className="input field"
                                                                            type="text"
                                                                            value={
                                                                                personnelBlock.name
                                                                                    ? personnelBlock.name
                                                                                    : ''
                                                                            }
                                                                            onChange={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockValueChange(
                                                                                    index,
                                                                                    newValue,
                                                                                    'name',
                                                                                    setOfficePersonnelBlocks,
                                                                                    officePersonnelBlocks
                                                                                )
                                                                            }
                                                                            onBlur={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockFieldBlur(
                                                                                    index,
                                                                                    newValue,
                                                                                    'name',
                                                                                    setOfficePersonnelBlocks,
                                                                                    officePersonnelBlocks
                                                                                )
                                                                            }
                                                                            autoComplete="false"
                                                                            required
                                                                            maxLength={
                                                                                255
                                                                            }
                                                                        />
                                                                        <Input
                                                                            id={`office-personnel-cell-${index}`}
                                                                            name={`office-personnel-cell-${index}`}
                                                                            label="Cell Phone"
                                                                            className="input field"
                                                                            type="text"
                                                                            value={
                                                                                personnelBlock.phone
                                                                                    ? personnelBlock.phone
                                                                                    : ''
                                                                            }
                                                                            onChange={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockValueChange(
                                                                                    index,
                                                                                    newValue,
                                                                                    'phone',
                                                                                    setOfficePersonnelBlocks,
                                                                                    officePersonnelBlocks
                                                                                )
                                                                            }
                                                                            onBlur={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockFieldBlur(
                                                                                    index,
                                                                                    newValue,
                                                                                    'phone',
                                                                                    setOfficePersonnelBlocks,
                                                                                    officePersonnelBlocks
                                                                                )
                                                                            }
                                                                            onFocus={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockFieldFocus(
                                                                                    index,
                                                                                    newValue,
                                                                                    'phone',
                                                                                    setOfficePersonnelBlocks,
                                                                                    officePersonnelBlocks
                                                                                )
                                                                            }
                                                                            autoComplete="false"
                                                                            required
                                                                            minLength={
                                                                                10
                                                                            }
                                                                            maxLength={
                                                                                20
                                                                            }
                                                                        />
                                                                        <Input
                                                                            id={`office-personnel-email-${index}`}
                                                                            name={`office-personnel-email-${index}`}
                                                                            label="Email Address"
                                                                            className="input field"
                                                                            type="email"
                                                                            value={
                                                                                personnelBlock.email
                                                                                    ? personnelBlock.email
                                                                                    : ''
                                                                            }
                                                                            onChange={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockValueChange(
                                                                                    index,
                                                                                    newValue,
                                                                                    'email',
                                                                                    setOfficePersonnelBlocks,
                                                                                    officePersonnelBlocks
                                                                                )
                                                                            }
                                                                            onBlur={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockFieldBlur(
                                                                                    index,
                                                                                    newValue,
                                                                                    'email',
                                                                                    setOfficePersonnelBlocks,
                                                                                    officePersonnelBlocks
                                                                                )
                                                                            }
                                                                            autoComplete="false"
                                                                            required
                                                                            maxLength={
                                                                                255
                                                                            }
                                                                        />
                                                                        <Input
                                                                            id={`office-personnel-passcode-${index}`}
                                                                            name={`office-personnel-passcode-${index}`}
                                                                            label="Personal Passcode"
                                                                            tooltip="In the event company personnel cannot access the APP or Website, a company passcode/password is for ALL personnel to use when calling into the monitoring center. If a company passcode is not listed, each employee must have their own individual passcode. UCC personnel will not disclose confidential information unless provided with a company or individual passcode. (at least 8 alpha-numeric characters)"
                                                                            pattern="^[a-zA-Z0-9]{8,}$"
                                                                            title="Personal Passcode must include a minimum of 8 alphanumeric characters."
                                                                            className="input field"
                                                                            type="text"
                                                                            value={
                                                                                personnelBlock.passcode
                                                                                    ? personnelBlock.passcode
                                                                                    : ''
                                                                            }
                                                                            onChange={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockValueChange(
                                                                                    index,
                                                                                    newValue,
                                                                                    'passcode',
                                                                                    setOfficePersonnelBlocks,
                                                                                    officePersonnelBlocks
                                                                                )
                                                                            }
                                                                            onBlur={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockFieldBlur(
                                                                                    index,
                                                                                    newValue,
                                                                                    'passcode',
                                                                                    setOfficePersonnelBlocks,
                                                                                    officePersonnelBlocks
                                                                                )
                                                                            }
                                                                            autoComplete="false"
                                                                            required
                                                                            minLength={
                                                                                8
                                                                            }
                                                                            maxLength={
                                                                                100
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {errorMessage
                                                            .authorized_office_personnel?.[
                                                            index
                                                        ] && (
                                                            <p
                                                                id={`authorized-office-personnel-error-${index}`}
                                                                className="error"
                                                                data-testid={`authorized-office-personnel-error-${index}`}
                                                            >
                                                                {
                                                                    errorMessage
                                                                        .authorized_office_personnel[
                                                                        index
                                                                    ]
                                                                }
                                                            </p>
                                                        )}
                                                    </Fragment>
                                                );
                                            }
                                        )}

                                        <div>
                                            <Button
                                                id="add"
                                                className="btn outline primary"
                                                label="Add Contacts +"
                                                type="button"
                                                onClick={() => {
                                                    setOfficePersonnelBlocks([
                                                        ...officePersonnelBlocks,
                                                        {
                                                            name: '',
                                                            phone: '',
                                                            email: '',
                                                            passcode: '',
                                                        },
                                                    ]);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <ButtonGroup
                                        alignment={
                                            ButtonGroupAlignment.bottomright
                                        }
                                    >
                                        <Button
                                            id="clear"
                                            className="btn danger"
                                            label="Back"
                                            type="button"
                                            onClick={() =>
                                                handleNavigation('Back')
                                            }
                                        />
                                        <Button
                                            id="create"
                                            className="btn primary"
                                            label="Save & Next"
                                            type="button"
                                            onClick={() =>
                                                handleSaveData('Next')
                                            }
                                        />
                                    </ButtonGroup>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section - Technical Support Team */}
                    <div className="section-container">
                        <div
                            className={`section-container-header ${
                                activeSection === 4 ? 'active-header' : ''
                            }`}
                            onClick={() => handleNavigation('Toggle', 4)}
                        >
                            <div className="section-container-header-caption">
                                Technical Support Team
                            </div>
                            <div className="section-container-header-toggle">
                                {isTechnicalSupportTeamVerified && (
                                    <FaCheck color="green" size={30} />
                                )}
                                {(activeSection === 4 && <FaChevronDown />) || (
                                    <FaChevronRight />
                                )}
                            </div>
                        </div>
                        {activeSection === 4 && (
                            <div className="section-container-body">
                                <div className="section-node">
                                    <div>
                                        {/* Section - Technical Support Team Subsections */}
                                        {technicalSupportBlocks.map(
                                            (technicalsupportBlock, index) => {
                                                return (
                                                    <Fragment
                                                        key={`technical-supportblock-${index}`}
                                                    >
                                                        <div className="section-container">
                                                            <div
                                                                className={`section-container-header ${
                                                                    activeSubSection.technical_support ===
                                                                    index
                                                                        ? 'active-header'
                                                                        : ''
                                                                }`}
                                                                onClick={() =>
                                                                    toggleSubSection(
                                                                        'technical_support',
                                                                        index
                                                                    )
                                                                }
                                                            >
                                                                <div className="section-container-header-caption">
                                                                    Contacts
                                                                </div>
                                                                {index !==
                                                                    0 && (
                                                                    <div className="section-container-header-toolbar">
                                                                        <div className="section-node-toolbar-button">
                                                                            <DeleteIcon
                                                                                className="deleteIcon"
                                                                                onClick={(
                                                                                    event
                                                                                ) => {
                                                                                    event.stopPropagation();
                                                                                    removeTechnicalSupportBlock(
                                                                                        index
                                                                                    );
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="section-container-header-toggle">
                                                                    {(activeSubSection.technical_support ===
                                                                        index && (
                                                                        <FaChevronDown />
                                                                    )) || (
                                                                        <FaChevronRight />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {activeSubSection.technical_support ===
                                                                index && (
                                                                <div className="section-container-body">
                                                                    <div className="section-node">
                                                                        <Input
                                                                            id={`technical-support-name-${index}`}
                                                                            name={`technical-support-name-${index}`}
                                                                            label="Name"
                                                                            className="input field"
                                                                            type="text"
                                                                            value={
                                                                                technicalsupportBlock.name
                                                                                    ? technicalsupportBlock.name
                                                                                    : ''
                                                                            }
                                                                            onChange={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockValueChange(
                                                                                    index,
                                                                                    newValue,
                                                                                    'name',
                                                                                    setTechnicalSupportBlocks,
                                                                                    technicalSupportBlocks
                                                                                )
                                                                            }
                                                                            onBlur={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockFieldBlur(
                                                                                    index,
                                                                                    newValue,
                                                                                    'name',
                                                                                    setTechnicalSupportBlocks,
                                                                                    technicalSupportBlocks
                                                                                )
                                                                            }
                                                                            autoComplete="false"
                                                                            required
                                                                            maxLength={
                                                                                255
                                                                            }
                                                                        />
                                                                        <Input
                                                                            id={`technical-support-cell-${index}`}
                                                                            name={`technical-support-cell-${index}`}
                                                                            label="Cell Phone"
                                                                            className="input field"
                                                                            type="text"
                                                                            value={
                                                                                technicalsupportBlock.phone
                                                                                    ? technicalsupportBlock.phone
                                                                                    : ''
                                                                            }
                                                                            onChange={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockValueChange(
                                                                                    index,
                                                                                    newValue,
                                                                                    'phone',
                                                                                    setTechnicalSupportBlocks,
                                                                                    technicalSupportBlocks
                                                                                )
                                                                            }
                                                                            onBlur={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockFieldBlur(
                                                                                    index,
                                                                                    newValue,
                                                                                    'phone',
                                                                                    setTechnicalSupportBlocks,
                                                                                    technicalSupportBlocks
                                                                                )
                                                                            }
                                                                            onFocus={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockFieldFocus(
                                                                                    index,
                                                                                    newValue,
                                                                                    'phone',
                                                                                    setTechnicalSupportBlocks,
                                                                                    technicalSupportBlocks
                                                                                )
                                                                            }
                                                                            autoComplete="false"
                                                                            required
                                                                            minLength={
                                                                                10
                                                                            }
                                                                            maxLength={
                                                                                20
                                                                            }
                                                                        />
                                                                        <Input
                                                                            id={`technical-support-email-${index}`}
                                                                            name={`technical-support-email-${index}`}
                                                                            label="Email Address"
                                                                            className="input field"
                                                                            type="email"
                                                                            value={
                                                                                technicalsupportBlock.email
                                                                                    ? technicalsupportBlock.email
                                                                                    : ''
                                                                            }
                                                                            onChange={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockValueChange(
                                                                                    index,
                                                                                    newValue,
                                                                                    'email',
                                                                                    setTechnicalSupportBlocks,
                                                                                    technicalSupportBlocks
                                                                                )
                                                                            }
                                                                            onBlur={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockFieldBlur(
                                                                                    index,
                                                                                    newValue,
                                                                                    'email',
                                                                                    setTechnicalSupportBlocks,
                                                                                    technicalSupportBlocks
                                                                                )
                                                                            }
                                                                            autoComplete="false"
                                                                            required
                                                                            maxLength={
                                                                                255
                                                                            }
                                                                        />
                                                                        <Input
                                                                            id={`technical-support-passcode-${index}`}
                                                                            name={`technical-support-passcode-${index}`}
                                                                            label="Personal Passcode"
                                                                            tooltip="In the event company personnel cannot access the APP or Website, a company passcode/password is for ALL personnel to use when calling into the monitoring center. If a company passcode is not listed, each employee must have their own individual passcode. UCC personnel will not disclose confidential information unless provided with a company or individual passcode. (at least 8 alpha-numeric characters)"
                                                                            pattern="^[a-zA-Z0-9]{8,}$"
                                                                            title="Personal Passcode must include a minimum of 8 alphanumeric characters."
                                                                            className="input field"
                                                                            type="text"
                                                                            value={
                                                                                technicalsupportBlock.passcode
                                                                                    ? technicalsupportBlock.passcode
                                                                                    : ''
                                                                            }
                                                                            onChange={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockValueChange(
                                                                                    index,
                                                                                    newValue,
                                                                                    'passcode',
                                                                                    setTechnicalSupportBlocks,
                                                                                    technicalSupportBlocks
                                                                                )
                                                                            }
                                                                            onBlur={(
                                                                                newValue
                                                                            ) =>
                                                                                handleBlockFieldBlur(
                                                                                    index,
                                                                                    newValue,
                                                                                    'passcode',
                                                                                    setTechnicalSupportBlocks,
                                                                                    technicalSupportBlocks
                                                                                )
                                                                            }
                                                                            autoComplete="false"
                                                                            required
                                                                            minLength={
                                                                                8
                                                                            }
                                                                            maxLength={
                                                                                100
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {errorMessage
                                                            .technical_support_team?.[
                                                            index
                                                        ] && (
                                                            <p
                                                                id={`technical-support-team-error-${index}`}
                                                                className="error"
                                                                data-testid={`technical-support-team-error-${index}`}
                                                            >
                                                                {
                                                                    errorMessage
                                                                        .technical_support_team[
                                                                        index
                                                                    ]
                                                                }
                                                            </p>
                                                        )}
                                                    </Fragment>
                                                );
                                            }
                                        )}

                                        <div>
                                            <Button
                                                id="add"
                                                className="btn outline primary"
                                                label="Add Contacts +"
                                                type="button"
                                                onClick={() => {
                                                    setTechnicalSupportBlocks([
                                                        ...technicalSupportBlocks,
                                                        {
                                                            name: '',
                                                            phone: '',
                                                            email: '',
                                                            passcode: '',
                                                        },
                                                    ]);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <ButtonGroup
                                        alignment={
                                            ButtonGroupAlignment.bottomright
                                        }
                                    >
                                        <Button
                                            id="clear"
                                            className="btn danger"
                                            label="Back"
                                            type="button"
                                            onClick={() =>
                                                handleNavigation('Back')
                                            }
                                        />
                                        <Button
                                            id="create"
                                            className="btn primary"
                                            label="Save & Next"
                                            type="button"
                                            onClick={() =>
                                                handleSaveData('Next')
                                            }
                                        />
                                    </ButtonGroup>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section - Report Setup */}
                    <div className="section-container">
                        <div
                            className={`section-container-header ${
                                activeSection === 5 ? 'active-header' : ''
                            }`}
                            onClick={() => handleNavigation('Toggle', 5)}
                        >
                            <div className="section-container-header-caption">
                                Report Setup
                            </div>
                            <div className="section-container-header-toggle">
                                {isReportSetupVerified && (
                                    <FaCheck color="green" size={30} />
                                )}
                                {(activeSection === 5 && <FaChevronDown />) || (
                                    <FaChevronRight />
                                )}
                            </div>
                        </div>
                        {activeSection === 5 && (
                            <div className="section-container-body">
                                <div className="section-node">
                                    <div>
                                        <div>
                                            <p>
                                                Please check the daily reports
                                                you would like to receive via
                                                email.
                                            </p>
                                        </div>
                                        <div className="report-options">
                                            <div className="checkbox-spacing">
                                                <label htmlFor="all_signals">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            dailyReport.operator_signals
                                                        }
                                                        id="all_signals"
                                                        name="operator_signals"
                                                        disabled={true}
                                                        className="checkbox-input"
                                                        onChange={
                                                            handleCheckboxChange
                                                        }
                                                    />
                                                    <span className="checkbox-label">
                                                        Daily report of all
                                                        signals processed by
                                                        operators (alarms,
                                                        troubles, out of
                                                        schedule open/closes)
                                                    </span>
                                                </label>
                                            </div>
                                            <div className="checkbox-spacing">
                                                <label htmlFor="test_signal_event">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            dailyReport.test_signals
                                                        }
                                                        id="test_signal_event"
                                                        name="test_signals"
                                                        disabled={true}
                                                        className="checkbox-input"
                                                        onChange={
                                                            handleCheckboxChange
                                                        }
                                                    />
                                                    <span className="checkbox-label">
                                                        Daily report of late to
                                                        test and runaway signal
                                                        events
                                                    </span>
                                                </label>
                                            </div>
                                            <div className="checkbox-spacing">
                                                <label htmlFor="account_changes">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            dailyReport.account_changes
                                                        }
                                                        id="account_changes"
                                                        name="account_changes"
                                                        disabled={false}
                                                        onChange={
                                                            handleCheckboxChange
                                                        }
                                                    />
                                                    <span className="checkbox-label">
                                                        Daily report of changes
                                                        made to your accounts
                                                        (Optional)
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <span>
                                                Email Address to send reports to
                                            </span>
                                            <div className="report-email-template">
                                                {reportEmailBlocks.map(
                                                    (emailId, index) => {
                                                        return (
                                                            <Fragment
                                                                key={`emailid-${index}`}
                                                            >
                                                                <div className="report-email-row">
                                                                    <div>
                                                                        <Input
                                                                            id={`report-email-${index}`}
                                                                            name={`report-email-${index}`}
                                                                            label={`Email ${
                                                                                index +
                                                                                1
                                                                            }`}
                                                                            className="input field"
                                                                            type="email"
                                                                            value={
                                                                                emailId
                                                                            }
                                                                            onChange={(
                                                                                newEmail
                                                                            ) => {
                                                                                const reportEmailBlocksCopy =
                                                                                    [
                                                                                        ...reportEmailBlocks,
                                                                                    ];

                                                                                reportEmailBlocksCopy[
                                                                                    index
                                                                                ] =
                                                                                    newEmail;
                                                                                setReportEmailBlocks(
                                                                                    reportEmailBlocksCopy
                                                                                );
                                                                            }}
                                                                            onBlur={(
                                                                                newEmail
                                                                            ) => {
                                                                                const reportEmailBlocksCopy =
                                                                                    [
                                                                                        ...reportEmailBlocks,
                                                                                    ];

                                                                                reportEmailBlocksCopy[
                                                                                    index
                                                                                ] =
                                                                                    newEmail
                                                                                        .replace(
                                                                                            /\s+/g,
                                                                                            ' '
                                                                                        )
                                                                                        .trim();
                                                                                setReportEmailBlocks(
                                                                                    reportEmailBlocksCopy
                                                                                );
                                                                            }}
                                                                            autoComplete="false"
                                                                            maxLength={
                                                                                255
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="deleteMonitorBlockContainer reportEmail">
                                                                        <DeleteIcon
                                                                            className="deleteIcon"
                                                                            onClick={() =>
                                                                                removeReportEmailBlock(
                                                                                    index
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {errorMessage
                                                                    .report_recipient_emails?.[
                                                                    index
                                                                ] && (
                                                                    <p
                                                                        id={`report-email-error-${index}`}
                                                                        className="error"
                                                                        data-testid={`report-email-error-${index}`}
                                                                    >
                                                                        {
                                                                            errorMessage
                                                                                .report_recipient_emails?.[
                                                                                index
                                                                            ]
                                                                        }
                                                                    </p>
                                                                )}
                                                            </Fragment>
                                                        );
                                                    }
                                                )}

                                                <div className="timeBlocksButtonContainer">
                                                    <button
                                                        type="button"
                                                        className="btn outline primary"
                                                        onClick={() => {
                                                            setReportEmailBlocks(
                                                                [
                                                                    ...reportEmailBlocks,
                                                                    '',
                                                                ]
                                                            );
                                                        }}
                                                    >
                                                        Add More Email +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <ButtonGroup
                                        alignment={
                                            ButtonGroupAlignment.bottomright
                                        }
                                    >
                                        <Button
                                            id="clear"
                                            className="btn danger"
                                            label="Back"
                                            type="button"
                                            onClick={() =>
                                                handleNavigation('Back')
                                            }
                                        />
                                        <Button
                                            id="create"
                                            className="btn primary"
                                            label="Save"
                                            type="button"
                                            onClick={() =>
                                                handleSaveData('Next')
                                            }
                                        />
                                    </ButtonGroup>
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="dealerNote">
                        * Once all required fields have been filled out, please
                        click Submit to proceed.
                    </p>

                    <ButtonGroup alignment={ButtonGroupAlignment.bottomright}>
                        <Button
                            id="cancel"
                            className="btn danger"
                            label="Close"
                            type="button"
                            onClick={() => handleNavigation('Close')}
                        />
                        <Button
                            id="submit-btn"
                            className={`btn ${
                                savedDealerChecklistData.status === 'Completed'
                                    ? ''
                                    : 'primary'
                            }`}
                            label="Submit"
                            type="submit"
                            disabled={
                                savedDealerChecklistData.status === 'Completed'
                                    ? true
                                    : false
                            }
                        />
                        {savedDealerChecklistData &&
                        savedDealerChecklistData.status === 'Completed' ? (
                            <Button
                                id="export-btn"
                                className="btn primary"
                                label="Export as PDF"
                                type="button"
                                onClick={generatePDF}
                            />
                        ) : (
                            <></>
                        )}
                    </ButtonGroup>
                </form>
            </>
        </ModalBase>
    );
};

export default EditDealerProfileModal;
