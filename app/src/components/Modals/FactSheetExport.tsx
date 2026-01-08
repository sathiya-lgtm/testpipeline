import { useState } from 'react';

// Third party
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Api Calls
import { getSchedules, getSiteStatus } from '../../api_calls/Schedules';
import { getScheduleExceptions } from '../../api_calls/ScheduleExceptions';
import getSubscriberFactSheet from '../../api_calls/getSubscriberFactSheet';

// Custom types
import { IUser } from '../../types/interfaces';

// Controller
import {
    generateMonitroingBlocks,
    buildMonitoringBlockDisplayData,
} from '../Scheduling/WeeklySchedule.controller';

// Icons
import EvolonLogo from '../../images/logo/evolon_professional_video_monitoring.png';

// Utils
import { convertPhoneNumberToFormattedVersion } from '../../utils/convertPhoneNumberToFormattedVersion';

type AnyObj = { [k: string]: any };

const FactSheetExport = () => {
    const [isExporting, setIsExporting] = useState(false);

    // Utility getter
    const get = (obj: AnyObj, keys: string[] | string) => {
        if (!obj) return undefined;
        const ks = Array.isArray(keys) ? keys : [keys];
        for (const k of ks) {
            if (k in obj && obj[k] !== undefined) return obj[k];
        }
        return undefined;
    };

    // Extract phone numbers (string or object { phone })
    const extractPhone = (value: any): string => {
        if (!value) return '';
        if (typeof value === 'string')
            return convertPhoneNumberToFormattedVersion(value);
        if (typeof value === 'object')
            return convertPhoneNumberToFormattedVersion(value.phone ?? '');
        return '';
    };

    const extractName = (value: any): string => {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'object') return value.name ?? '';
        return '';
    };

    const updateYFromLastTable = (doc: jsPDF, currentY: number) => {
        try {
            const last = (doc as any).lastAutoTable;
            if (last && typeof last.finalY === 'number')
                return last.finalY + 18;
        } catch (e) {
            // ignore
        }
        return currentY + 18;
    };

    const addSectionHeader = (
        doc: jsPDF,
        title: string,
        yRef: { y: number },
        pageWidth: number
    ) => {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 40, yRef.y);
        yRef.y += 12;
    };

    // Table With Required field
    const addTableWithRequired = (
        doc: jsPDF,
        yStart: number,
        headers: string[],
        rows: { name: string; value: any; required?: boolean }[],
        isSubscriberInfo: boolean = false
    ): number => {
        const tableBody = rows.map((f) => [f.name, f.value ?? '']);

        let fieldWidth = 200;
        if (isSubscriberInfo) fieldWidth = 150;

        autoTable(doc, {
            startY: yStart,
            head: [headers],
            body: tableBody,
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 6,
                overflow: 'linebreak', // enable wrapping
            },

            columnStyles: {
                0: { cellWidth: fieldWidth }, //Field column
                1: { cellWidth: 'auto' },
            },

            headStyles: {
                fillColor: [52, 152, 219],
                textColor: 255,
            },

            didDrawCell: (dataCell) => {
                if (
                    dataCell.section === 'body' &&
                    dataCell.column.index === 0
                ) {
                    const rowIndex = dataCell.row.index;
                    const field = rows[rowIndex];

                    if (field.required) {
                        const cell = dataCell.cell;

                        // Measure text width
                        const textWidth = doc.getTextWidth(field.name);

                        const textX = cell.x + textWidth + 10;

                        const textY = cell.y + cell.height / 2 + 3;

                        doc.setTextColor(255, 0, 0);
                        doc.text('*', textX, textY);
                        doc.setTextColor(0);
                    }
                }
            },
        });

        return (doc as any).lastAutoTable.finalY + 20;
    };

    // PDF generator
    const generateFactSheetPDF = async (
        subscriberFactSheetData: any,
        activeUser: IUser,
        accountId: string | number,
        siteId: string | number,
        serviceProviderName: string,
        customerName: string,
        siteName: string
    ) => {
        if (!activeUser || !accountId || !siteId) {
            toast.error('Missing user or site information');
            return;
        }

        setIsExporting(true);

        try {
            const accountIdNum: number = Number(accountId);
            const siteIdNum: number = Number(siteId);

            // Fetch schedules & status
            const schedules = await getSchedules({
                user: activeUser,
                params: { account_id: accountIdNum, site_id: siteIdNum },
            });

            const siteStatus = await getSiteStatus({
                user: activeUser,
                params: { account_id: accountIdNum, site_id: siteIdNum },
            });

            const scheduleId: number = Number(
                schedules?.data?.[0]?.schedule_site_id ?? 0
            );
            const scheduleData = schedules?.data?.[0] ?? {};

            const scheduleExceptions =
                scheduleId > 0
                    ? await getScheduleExceptions({
                          user: activeUser,
                          params: {
                              schedule_site_id: scheduleId,
                              account_id: accountIdNum,
                              site_id: siteIdNum,
                          },
                      })
                    : { data: [] };

            const data = subscriberFactSheetData ?? {};
            const siteNameForFile = String(siteName)
                .trim()
                .replace(/\s+/g, '_')
                .replace(/[^a-zA-Z0-9_-]/g, '');

            const doc = new jsPDF('p', 'pt', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let y = 40;

            // Add Section Title helper (local to generator)
            const sectionHeader = (title: string) => {
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text(title, 40, y);
                y += 10;
            };

            // Draw Table helper (local to generator)
            const addTable = (
                headers: string[],
                rows: any[][],
                setFixedWidth: boolean = false
            ) => {
                autoTable(doc, {
                    startY: y,
                    head: [headers],
                    body: rows,
                    theme: 'grid',
                    styles: {
                        fontSize: 10,
                    },
                    columnStyles: {
                        ...(setFixedWidth && {
                            0: { cellWidth: 30 },
                            2: { cellWidth: 100 },
                            3: { cellWidth: 100 },
                            4: { cellWidth: 100 },
                        }),
                    },
                    headStyles: { fillColor: [52, 152, 219] },
                });
                y = (doc as any).lastAutoTable.finalY + 20;
            };

            // -----------------------
            // Logo + Title
            // -----------------------
            await new Promise<void>((resolve) => {
                const img = new Image();
                img.src = EvolonLogo;
                img.onload = () => {
                    const imgWidth = 150;
                    const imgHeight = (img.height * imgWidth) / img.width;
                    doc.addImage(
                        img,
                        'PNG',
                        (pageWidth - imgWidth) / 2,
                        20,
                        imgWidth,
                        imgHeight
                    );
                    doc.setFontSize(20);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Subscriber Fact Sheet', pageWidth / 2, 100, {
                        align: 'center',
                    });
                    y = 130;
                    resolve();
                };
                img.onerror = () => resolve();
            });

            doc.setFontSize(12);

            let subscriberTextWidth = 0;
            const maxWidth = pageWidth / 2;
            const rightContentValue = maxWidth + 20;
            const defaultVerticalSpace = 26;
            let verticalSpace = defaultVerticalSpace;

            doc.setFont('helvetica', 'bold');
            doc.text('Service Provider Name : ', 40, y);
            subscriberTextWidth = doc.getTextWidth('Service Provider Name : ');
            doc.setFont('helvetica', 'normal');
            let wrappedText = doc.splitTextToSize(
                serviceProviderName || '-',
                maxWidth - subscriberTextWidth - 30
            );
            doc.text(wrappedText, 40 + subscriberTextWidth, y);

            if (wrappedText.length > 1)
                verticalSpace =
                    (defaultVerticalSpace / 2) * (wrappedText.length + 1);

            doc.setFont('helvetica', 'bold');
            doc.text('Customer Name : ', rightContentValue, y);
            subscriberTextWidth = doc.getTextWidth('Customer Name : ');
            doc.setFont('helvetica', 'normal');
            wrappedText = doc.splitTextToSize(
                customerName || '-',
                maxWidth - subscriberTextWidth - 30
            );
            doc.text(wrappedText, rightContentValue + subscriberTextWidth, y);

            if (wrappedText.length > 1)
                verticalSpace =
                    (defaultVerticalSpace / 2) * (wrappedText.length + 1);

            y += verticalSpace;

            doc.setFont('helvetica', 'bold');
            doc.text('Site Name : ', 40, y);
            subscriberTextWidth = doc.getTextWidth('Site Name : ');
            doc.setFont('helvetica', 'normal');
            wrappedText = doc.splitTextToSize(
                siteName || '-',
                maxWidth - subscriberTextWidth - 30
            );
            doc.text(wrappedText, 40 + subscriberTextWidth, y);

            if (wrappedText.length > 1)
                verticalSpace =
                    (defaultVerticalSpace / 2) * (wrappedText.length + 1);

            doc.setFont('helvetica', 'bold');
            doc.text('Dealer Name : ', rightContentValue, y);
            subscriberTextWidth = doc.getTextWidth('Dealer Name : ');
            doc.setFont('helvetica', 'normal');
            wrappedText = doc.splitTextToSize(
                data.dealer_name || '-',
                maxWidth - subscriberTextWidth - 30
            );
            doc.text(wrappedText, rightContentValue + subscriberTextWidth, y);

            if (wrappedText.length > 1)
                verticalSpace =
                    (defaultVerticalSpace / 2) * (wrappedText.length + 1);

            y += verticalSpace;

            doc.setFont('helvetica', 'bold');
            doc.text('Dealer Number : ', 40, y);
            subscriberTextWidth = doc.getTextWidth('Dealer Number : ');
            doc.setFont('helvetica', 'normal');
            wrappedText = doc.splitTextToSize(
                data.dealer_number || '-',
                maxWidth - subscriberTextWidth - 30
            );
            doc.text(wrappedText, 40 + subscriberTextWidth, y);

            let isWrapped = false;
            if (wrappedText.length > 1) isWrapped = true;

            doc.setFont('helvetica', 'bold');
            doc.text('Subscriber Account Number : ', rightContentValue, y);
            subscriberTextWidth = doc.getTextWidth(
                'Subscriber Account Number : '
            );
            doc.setFont('helvetica', 'normal');
            wrappedText = doc.splitTextToSize(
                data.subscriber_account_number || '-',
                maxWidth - subscriberTextWidth - 30
            );
            doc.text(wrappedText, rightContentValue + subscriberTextWidth, y);

            if (wrappedText.length > 1) isWrapped = true;

            if (isWrapped)
                verticalSpace =
                    (defaultVerticalSpace / 2) * (wrappedText.length + 1);
            else verticalSpace = (defaultVerticalSpace / 2) * 3;

            y += verticalSpace;

            // Subscriber Information
            sectionHeader('Subscriber Information');

            const subscriberFields = [
                {
                    name: 'Account Type',
                    value: data.subscriber_account_type ?? '',
                    required: true,
                },
                {
                    name: 'Video System Types',
                    value: (data.video_system_types || []).join(', '),
                    required: true,
                },
                {
                    name: 'Business Name',
                    value: data.business_name ?? '',
                    required: true,
                },
                { name: 'Address', value: data.address ?? '', required: true },
                {
                    name: 'Suite Number',
                    value: data.suite_number ?? '',
                    required: true,
                },
                { name: 'City', value: data.city ?? '', required: true },
                { name: 'State', value: data.state ?? '', required: true },
                { name: 'Zip', value: data.zip ?? '', required: true },
                {
                    name: 'Customer Name',
                    value: data.customer_name ?? '',
                    required: true,
                },
                {
                    name: 'Customer Email',
                    value: data.customer_email ?? '',
                    required: true,
                },
                {
                    name: 'Customer Cell',
                    value: extractPhone(data.customer_cell),
                    required: true,
                },
                {
                    name: 'Location Phone',
                    value: extractPhone(data.location_phone_primary),
                    required: true,
                },
                {
                    name: 'Location Alt Phone',
                    value: extractPhone(data.location_phone_secondary),
                    required: false,
                },
                {
                    name: 'Subdivision',
                    value: data.subdivision ?? '',
                    required: true,
                },
                {
                    name: 'Cross Street',
                    value: data.cross_street ?? '',
                    required: true,
                },
                {
                    name: 'Permit # / Information',
                    value: data.alarm_permit_number ?? '',
                    required: true,
                },
                {
                    name: 'Police Department',
                    value: extractName(data.police_department),
                    required: true,
                },
                {
                    name: 'Police Dept Phone',
                    value: extractPhone(data.police_department),
                    required: true,
                },
                {
                    name: 'Fire Department',
                    value: extractName(data.fire_department),
                    required: true,
                },
                {
                    name: 'Fire Dept Phone',
                    value: extractPhone(data.fire_department),
                    required: true,
                },
                {
                    name: 'EMS Service',
                    value: extractName(data.ems_service),
                    required: true,
                },
                {
                    name: 'EMS Phone',
                    value: extractPhone(data.ems_service),
                    required: true,
                },
                {
                    name: 'Guard Service',
                    value: extractName(data.guard_service),
                    required: true,
                },
                {
                    name: 'Guard Phone',
                    value: extractPhone(data.guard_service),
                    required: true,
                },
            ];

            y = addTableWithRequired(
                doc,
                y,
                ['Field', 'Value'],
                subscriberFields,
                true
            );

            // Post-Dispatch Parties
            doc.addPage();
            y = 40;

            // Section header
            sectionHeader('Post-Dispatch Parties');
            y += 10;

            // Description
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(
                'After the responding Agency has been notified, the subscriber requests that one of the following parties be notified (up to 8 contacts).',
                40,
                y,
                { maxWidth: pageWidth - 80 }
            );
            y += 24;

            // Prepare contacts
            const contacts = Array.isArray(
                data.post_dispatch_contacts ?? data.postDispatchContacts
            )
                ? data.post_dispatch_contacts ?? data.postDispatchContacts
                : [];

            const maxContacts = 8;
            const contactRows: string[][] = [];

            for (let i = 0; i < maxContacts; i++) {
                const p = contacts[i] ?? {};
                contactRows.push([
                    p.name ?? '',
                    p.passcode ?? '',
                    p.primary_phone?.phone
                        ? convertPhoneNumberToFormattedVersion(
                              p.primary_phone.phone
                          )
                        : '',
                    p.primary_phone?.text ? 'X' : '',
                    p.primary_phone?.call ? 'X' : '',
                    p.secondary_phone?.phone
                        ? convertPhoneNumberToFormattedVersion(
                              p.secondary_phone.phone
                          )
                        : '',
                    p.secondary_phone?.text ? 'X' : '',
                    p.secondary_phone?.call ? 'X' : '',
                ]);
            }

            const headerRow = [
                'Name',
                'Passcode',
                'Primary Phone',
                'TXT',
                'Call',
                'Secondary Phone',
                'TXT',
                'Call',
            ];

            autoTable(doc, {
                startY: y,
                head: [headerRow],
                body: contactRows,
                theme: 'grid',
                styles: {
                    fontSize: 10,
                    cellPadding: 6,
                },
                headStyles: { fillColor: [52, 152, 219], textColor: 255 },
                columnStyles: {
                    0: { cellWidth: 150 },
                    1: { cellWidth: 75 },
                    2: { cellWidth: 85 },
                    5: { cellWidth: 85 },
                },
                didDrawCell: (dataCell) => {
                    // Draw red * only in header
                    if (dataCell.section === 'head') {
                        const headerText = dataCell.cell.text.join(' ');
                        const col = dataCell.column.index;
                        const cellX = dataCell.cell.x;
                        const cellY = dataCell.cell.y;

                        doc.setFontSize(12);
                        doc.setTextColor(255, 0, 0); // RED

                        if (col === 0 || col === 1) {
                            const textWidth = doc.getTextWidth(headerText);

                            const textX = cellX + textWidth + 3;

                            const textY = cellY + dataCell.cell.height / 2 - 3;

                            doc.text('*', textX, textY); // Name * and Passcode *
                        } else if (col === 2) {
                            doc.text('*', cellX + 80, cellY + 15); // Primary Phone *
                        } else if (col === 5) {
                            doc.text('*', cellX + 40, cellY + 27); // Secondary Phone *
                        }

                        doc.setTextColor(0, 0, 0); // reset black
                    }
                },
            });

            y = (doc as any).lastAutoTable.finalY + 20;
            y += 20;

            // Event Clip Emails
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(
                'When a First Responder is dispatched, the event clip that triggered dispatch can be emailed.',
                40,
                y,
                { maxWidth: pageWidth - 80 }
            );
            y += 30;
            doc.text(
                'Parties authorized to receive the MP4 video clip',
                40,
                y,
                {
                    maxWidth: pageWidth - 80,
                }
            );
            y += 15;
            const clipEmails =
                data.event_notification_emails ?? data.eventClipEmails ?? [];
            autoTable(doc, {
                startY: y,
                head: [['Email Address to receive event clips']],
                body: clipEmails.length
                    ? clipEmails.map((e: string) => [e])
                    : [['No Email found']],
                theme: 'grid',
                styles: {
                    fontSize: 10,
                    cellPadding: 6,
                },
                headStyles: {
                    fillColor: [52, 152, 219],
                    textColor: 255,
                    fontStyle: 'bold',
                },
            });
            y = (doc as any).lastAutoTable.finalY + 20;

            // Subscribers Authorized Delegates
            doc.addPage();
            y = 40;
            sectionHeader('Subscribers Authorized Delegates');
            y += 10;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(
                'If applicable, the subscriber can have an authorized delegate to contact the monitoring operations center to arm or disarm the video monitoring. These individuals can also be the primary point of contact when the subscriber provides notice to the monitoring operations center. Example would be the subscriber will be out of country or unavailable should operations need to contact a primary point of contact other than the dealer.(Up to 4 delegates)',
                40,
                y,
                { maxWidth: pageWidth - 80 }
            );
            y += 80;

            const delegates =
                data.subscriber_authorized_delegates ??
                data.subscriberAuthorizedDelegates ??
                [];
            const maxDelegateRows = 4;
            const delegateRows: any[][] = [];
            for (let i = 0; i < maxDelegateRows; i++) {
                const d = delegates[i] ?? {};
                delegateRows.push([
                    i + 1,
                    d.name ?? '',
                    d.passcode ?? '',
                    d.primary_phone
                        ? convertPhoneNumberToFormattedVersion(d.primary_phone)
                        : '',
                    d.secondary_phone
                        ? convertPhoneNumberToFormattedVersion(
                              d.secondary_phone
                          )
                        : '',
                ]);
            }
            addTable(
                ['#', 'Name', 'Passcode', 'Primary Phone', 'Secondary Phone'],
                delegateRows,
                true
            );

            // Video Camera Details
            doc.addPage();
            y = 40;
            sectionHeader('Video Camera Details');
            y += 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(
                'Video Camera Details (Zone # will be added after cameras are enrolled into Evolon Insites)',
                40,
                y
            );
            y += 15;
            doc.text('Dealer and Subscriber, please add model sections', 40, y);
            y += 15;

            const cameras =
                data.video_camera_list ?? data.videoCameraList ?? [];

            const cameraBody =
                cameras.length > 0
                    ? cameras.map((c: any, i: number) => [
                          i + 1,
                          c.camera_id ?? '',
                          c.camera_name ?? '',
                          c.camera_model ?? '',
                      ])
                    : [
                          [
                              {
                                  content: 'No Video Camera Details Available',
                                  colSpan: 4,
                                  styles: { halign: 'center' },
                              },
                          ],
                      ];
            autoTable(doc, {
                startY: y,
                head: [['#', 'Camera ID', 'Description', 'Model']],
                body: cameraBody,
                theme: 'grid',
                styles: { fontSize: 10 },
                headStyles: { fillColor: [52, 152, 219] },
                columnStyles: {
                    1: { cellWidth: 60 },
                    3: { cellWidth: 200 },
                },
            });
            y = (doc as any).lastAutoTable.finalY + 20;

            // Audio Horn Details
            doc.addPage();
            y = 40;
            sectionHeader('Audio Horn Details');
            y += 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(
                'Audio Horn Details (document: type / name / message that will be announced)',
                40,
                y
            );
            y += 15;
            doc.text(
                'Currently Horn support is limited to Axis Communications Horns/Strobes',
                40,
                y
            );
            y += 15;

            const horns = data.audio_horn_list ?? data.audioHornList ?? [];
            const hornBody =
                horns.length > 0
                    ? horns.map((h: any) => [
                          h.network_device_type_name ?? '',
                          h.network_device_name ?? '',
                          h.announcement ?? '',
                      ])
                    : [
                          [
                              {
                                  content: 'No Audio / Horn Details Available',
                                  colSpan: 3,
                                  styles: { halign: 'center' },
                              },
                          ],
                      ];
            autoTable(doc, {
                startY: y,
                head: [
                    ['Model', 'Name / Description', 'Announcement / Message'],
                ],
                body: hornBody,
                theme: 'grid',
                styles: { fontSize: 10 },
                headStyles: { fillColor: [52, 152, 219] },
                columnStyles: {
                    0: { cellWidth: 150 },
                    1: { cellWidth: 150 },
                },
            });
            y = (doc as any).lastAutoTable.finalY + 20;

            // SOS Action Plan
            doc.addPage();
            y = 40;
            const yRef = { y };

            addSectionHeader(doc, 'SOS Action Plan', yRef, pageWidth);
            yRef.y += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(
                'For Professional Monitoring and SOS plans, please provide the Action Plan for the Professional Monitoring Center to follow.',
                40,
                yRef.y,
                { maxWidth: pageWidth - 80 }
            );
            yRef.y += 16;

            // SOS Action Plan data
            const sos = get(data, ['sos_action_plan']) ?? {};

            const drawSmallCheckbox = (
                x: number,
                y: number,
                checked: boolean
            ) => {
                const size = 9;
                doc.rect(x, y, size, size);
                if (checked) doc.text('X', x + 1.5, y + size - 1);
            };

            // Dispatch Immediately Box
            const boxTopY = yRef.y;
            const boxHeight = 40;

            doc.rect(40, boxTopY, pageWidth - 80, boxHeight);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('1. Dispatch Immediately', 48, boxTopY + 18);

            // REQUIRED *
            doc.setTextColor(255, 0, 0);
            doc.text('*', 185, boxTopY + 18);
            doc.setTextColor(0);

            const policeChecked =
                sos.dispatch_immediately === 'Police' || sos.police === true;
            drawSmallCheckbox(228, boxTopY + 10, policeChecked);
            doc.text('Police', 243, boxTopY + 18);

            const guardChecked =
                sos.dispatch_immediately === 'Guard Services' ||
                sos.guard_service === true;
            drawSmallCheckbox(318, boxTopY + 10, guardChecked);
            doc.text('Guard Service', 333, boxTopY + 18);

            yRef.y = boxTopY + boxHeight + 12;

            // After dispatch text
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text(
                'After Primary Dispatch has occurred, the following action should be taken',
                40,
                yRef.y
            );
            yRef.y += 14;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(
                'Example: Sound Horn and Siren - Strobe: Announcement: Trespassing , trigger siren and strobe profile #2.',
                40,
                yRef.y,
                { maxWidth: pageWidth - 80 }
            );
            yRef.y += 16;

            // instruction box
            const bigBoxHeight = 100;
            doc.setDrawColor(180, 200, 230);
            doc.setFillColor(235, 243, 255);
            doc.rect(40, yRef.y, pageWidth - 80, bigBoxHeight, 'FD');

            doc.setFont('helvetica', 'normal');
            doc.text(
                String(
                    sos.post_dispatch_action ??
                        sos.additional_action ??
                        sos.instructions ??
                        ''
                ),
                48,
                yRef.y + 16,
                {
                    maxWidth: pageWidth - 96,
                }
            );

            yRef.y += bigBoxHeight + 18;

            // SOS Notification list
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text(
                'Notification to the following parties that a SOS dispatch has occurred.',
                40,
                yRef.y
            );
            yRef.y += 12;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(
                'Note: If party details are deleted, the contact details will also be removed from the SOS Action Plan',
                40,
                yRef.y
            );
            yRef.y += 12;

            // Prepare rows
            const sosRecipients =
                sos.sos_notification_recipients ??
                sos.sosNotificationRecipients ??
                [];

            const notifyContactRows: string[][] = [];

            for (let i = 0; i < sosRecipients.length; i++) {
                const p = sosRecipients[i] ?? {};
                notifyContactRows.push([
                    (i + 1).toString(),
                    p.name ?? '',
                    p.phone
                        ? convertPhoneNumberToFormattedVersion(p.phone)
                        : '',
                    p.text ? 'X' : '',
                    p.call ? 'X' : '',
                ]);
            }

            autoTable(doc, {
                startY: yRef.y,
                head: [['#', 'Name', 'Mobile Number', 'TXT', 'Call']],
                body: notifyContactRows,
                theme: 'grid',
                styles: {
                    fontSize: 10,
                    cellPadding: 4,
                },
                headStyles: {
                    fillColor: [52, 152, 219],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                },
                columnStyles: {
                    0: { cellWidth: 20 },
                    2: { cellWidth: 100 },
                    3: { cellWidth: 40 },
                    4: { cellWidth: 40 },
                },
                didDrawCell: (dataCell: any) => {
                    // DRAW RED ASTERISKS IN HEADER AFTER TABLE RENDER
                    if (dataCell.section === 'head') {
                        const headerText = dataCell.cell.text.join(' ');
                        const col = dataCell.column.index;
                        const x = dataCell.cell.x;
                        const yCell = dataCell.cell.y;

                        doc.setTextColor(255, 0, 0); // RED color

                        if (col === 1 || col === 2) {
                            const textWidth = doc.getTextWidth(headerText);

                            const textX = x + textWidth + 7;

                            const textY = yCell + dataCell.cell.height / 2 + 3;

                            doc.text('*', textX, textY); // Name * and Mobile Number *
                        }

                        doc.setTextColor(0); // reset back to black
                    }
                },
            });

            yRef.y = updateYFromLastTable(doc, yRef.y);
            yRef.y += 12;

            // Runaway Alarms
            doc.addPage();
            y = 40;
            sectionHeader('Runaway Alarms');
            y += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(
                'Runaway alarms from cameras can be caused by a number of issues; a malfunctioning camera, weather, insects around the lens, debris/flapping tarps, etc. When events like this occur, the Monitoring Center Operators can be overwhelmed with alarms. When this occurs, the Operators will need to follow the following procedure.',
                40,
                y,
                { maxWidth: pageWidth - 80 }
            );
            y += 40;

            const runawayAlarmsObject = get(data, ['runaway_alarm']) ?? {};
            const putOnTestTimeNormalized = String(
                runawayAlarmsObject.test_duration ?? ''
            ).trim();

            autoTable(doc, {
                startY: y,
                head: [],
                body: [
                    [
                        '1) Notify Dealer',
                        'Notify the Dealer of the runaway zone/camera and site. The Monitor Center Operator will communicate to the Dealer the condition that is causing the runaway alarm.',
                    ],
                    [
                        '2) Put specific zone/camera/site on test for\nthe following times',
                        '',
                    ],
                ],
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 8, minCellHeight: 25 },
                columnStyles: {
                    0: { cellWidth: 250 },
                    1: { minCellHeight: 80 },
                },
                didDrawCell: (dataCell: any) => {
                    if (
                        dataCell.section === 'body' &&
                        dataCell.row.index === 1
                    ) {
                        const col = dataCell.column.index;

                        if (col === 0) {
                            const x = dataCell.cell.x;
                            const yCell = dataCell.cell.y;

                            doc.setTextColor(255, 0, 0); // RED color

                            doc.text('*', x + 95, yCell + 30);

                            doc.setTextColor(0); // reset back to black
                        } else if (col === 1) {
                            const cx = dataCell.cell.x;
                            const cy = dataCell.cell.y;
                            const yOffset = 10;
                            const lineHeight = 16;
                            const boxSize = 8;

                            ['15', '30', '60'].forEach((time, i) => {
                                doc.rect(
                                    cx + 8,
                                    cy + yOffset + i * lineHeight,
                                    boxSize,
                                    boxSize
                                );
                                if (putOnTestTimeNormalized === time)
                                    doc.text(
                                        'x',
                                        cx + 9,
                                        cy +
                                            yOffset +
                                            i * lineHeight +
                                            boxSize -
                                            1.5
                                    );
                                doc.text(
                                    `${time} Minutes`,
                                    cx + 22,
                                    cy + yOffset + i * lineHeight + 7.5
                                );
                            });
                        }
                    }
                },
            });
            y = (doc as any).lastAutoTable.finalY + 20;

            // Pro Monitoring Schedule

            doc.addPage();
            y = 40;

            const yRefProSchedule = { y };
            addSectionHeader(
                doc,
                'Pro Monitoring Schedule',
                yRefProSchedule,
                pageWidth
            );
            yRefProSchedule.y += 12;

            // schedule blocks into a single array for monitoring logic

            const flattenedSchedule: any[] = [];

            (schedules?.data ?? []).forEach((item: any) => {
                (item.schedule ?? []).forEach((s: any) => {
                    flattenedSchedule.push(s);
                });
            });

            //Timezone + Status
            const timezone =
                scheduleData.schedule_time_zone_description ?? 'N/A';
            const status = siteStatus?.is_armed ? 'Armed' : 'Disarmed';

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text('Timezone: ', 40, yRefProSchedule.y);
            doc.setFont('helvetica', 'bold');
            doc.text(
                timezone,
                40 + doc.getTextDimensions('Timezone: ').w,
                yRefProSchedule.y
            );

            const statusLabelWidth = doc.getTextDimensions(
                `Status: ${status}`
            ).w;
            doc.setFont('helvetica', 'normal');
            doc.text(
                'Status: ',
                pageWidth - 40 - statusLabelWidth,
                yRefProSchedule.y
            );
            doc.setFont('helvetica', 'bold');
            doc.text(status, pageWidth - 40, yRefProSchedule.y, {
                align: 'right',
            });

            yRefProSchedule.y += 30;

            const monitoringBlocksList =
                generateMonitroingBlocks(flattenedSchedule);

            const DAYS = [
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
            ];

            const dayToBlocks: Record<number, Set<string>> = {
                0: new Set(),
                1: new Set(),
                2: new Set(),
                3: new Set(),
                4: new Set(),
                5: new Set(),
                6: new Set(),
            };

            monitoringBlocksList.forEach((block) => {
                const display = buildMonitoringBlockDisplayData(
                    block,
                    monitoringBlocksList
                );

                const dayIndex = block.start_day;
                if (dayIndex < 0 || dayIndex > 6) return;

                dayToBlocks[dayIndex].add(display.tooltipInfo);
            });

            // Build weekly row
            const weeklyRow = DAYS.map((_, idx) => {
                const blocks = Array.from(dayToBlocks[idx]);
                return blocks.length ? blocks.join(', ') : '';
            });

            // weekly schedule table

            autoTable(doc, {
                startY: yRefProSchedule.y,
                head: [DAYS],
                body: [weeklyRow],
                theme: 'grid',
                styles: {
                    fontSize: 10,
                    cellPadding: 6,
                },
                headStyles: {
                    fillColor: [52, 152, 219],
                    textColor: 255,
                },
            });

            // Schedule Exceptions

            yRefProSchedule.y = (doc as any).lastAutoTable.finalY + 30;

            addSectionHeader(
                doc,
                'Schedule Exceptions',
                yRefProSchedule,
                pageWidth
            );
            yRefProSchedule.y += 12;

            // Utility to format date strings
            const formatScheduleDate = (dt: string | undefined): string => {
                if (!dt) return '';
                try {
                    const date = new Date(dt.replace(' ', 'T'));
                    if (isNaN(date.getTime())) return dt;

                    const yyyy = date.getFullYear();
                    const mm = String(date.getMonth() + 1).padStart(2, '0');
                    const dd = String(date.getDate()).padStart(2, '0');

                    let h = date.getHours();
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    h = h % 12;
                    h = h ? h : 12;
                    const min = String(date.getMinutes()).padStart(2, '0');

                    return `${mm}/${dd}/${yyyy} ${h}:${min} ${ampm}`;
                } catch (e) {
                    return dt;
                }
            };

            const exceptionFullHeaders = [
                [
                    'Exception Name',
                    'Status',
                    'Start Date/Time',
                    'End Date/Time',
                ],
            ];

            // Real data Api response
            const exceptions =
                (Array.isArray(scheduleExceptions)
                    ? scheduleExceptions
                    : (scheduleExceptions as any)?.data) ?? [];

            let exceptionRows;

            if (exceptions.length === 0) {
                exceptionRows = [
                    [
                        {
                            content: 'No Schedule Exceptions Available',
                            colSpan: 4,
                            styles: { halign: 'center' },
                        },
                    ],
                ];
            } else {
                //  Map data to only the 4 required columns.
                exceptionRows = exceptions.map((e: any) => [
                    e.description ?? '',
                    e.is_armed === true ? 'Armed' : 'Disarmed',
                    formatScheduleDate(e.start_dt),
                    formatScheduleDate(e.end_dt),
                ]);
            }

            autoTable(doc, {
                startY: yRefProSchedule.y,
                head: exceptionFullHeaders,
                body: exceptionRows,
                theme: 'grid',
                styles: {
                    fontSize: 10,
                    cellPadding: 6,
                },
                headStyles: { fillColor: [52, 152, 219], textColor: 255 },
            });

            yRefProSchedule.y = (doc as any).lastAutoTable.finalY;
            console.log('Exceptions Data for PDF:', exceptions);

            // Report Setup
            doc.addPage();
            y = 40;
            sectionHeader('Report Setup');
            const report = data.report_setup ?? data.reportSetup ?? {};
            addTable(
                ['Report Type', 'Enabled'],
                [
                    [
                        'Daily report of all signals processed by operators (alarms, troubles, out of schedule open/closes)',
                        report.operator_signals ? 'Yes' : 'No',
                    ],
                    [
                        'Daily report of late to test and runaway signal events',
                        report.test_signals ? 'Yes' : 'No',
                    ],
                    [
                        'Daily report of changes made to your accounts (Optional)',
                        report.account_changes ? 'Yes' : 'No',
                    ],
                ]
                // true
            );

            const reportEmails =
                data.report_recipient_emails ??
                data.reportRecipientEmails ??
                [];
            autoTable(doc, {
                startY: y,
                head: [['Email Address to send reports to']],
                body: reportEmails.length
                    ? reportEmails.map((e: string) => [e])
                    : [['']],
                theme: 'grid',
                styles: {
                    fontSize: 10,
                    cellPadding: 6,
                },
                headStyles: {
                    fillColor: [52, 152, 219],
                    textColor: 255,
                    fontStyle: 'bold',
                },
                didDrawCell: (dataCell) => {
                    // Draw mandatory star in HEADER
                    if (dataCell.section === 'head') {
                        const cell = dataCell.cell;

                        doc.setTextColor(255, 0, 0); // red
                        doc.setFontSize(12);

                        // position star after header text
                        doc.text('*', cell.x + 165, cell.y + 14);

                        doc.setTextColor(0); // reset
                    }
                },
            });

            y = (doc as any).lastAutoTable.finalY + 20;

            // Dealer Tech Support
            doc.addPage();
            y = 40;

            sectionHeader('Dealer Tech Support Information');

            const dealerTechFields = [
                {
                    name: 'Dealer Tech Support Phone',
                    value: data.dealer_tech_support_phone
                        ? convertPhoneNumberToFormattedVersion(
                              data.dealer_tech_support_phone
                          )
                        : '',
                    required: true,
                },
                {
                    name: 'Dealer Tech Support Email Address',
                    value: data.dealer_tech_support_email ?? '',
                    required: true,
                },
            ];

            // Use addTableWithRequired to handle red * automatically
            y = addTableWithRequired(
                doc,
                y,
                ['Field', 'Value'],
                dealerTechFields
            );

            // Footer (page/date)
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.text(
                    `Generated: ${new Date().toLocaleString()}`,
                    pageWidth - 250,
                    pageHeight - 20
                );
                doc.text(`Page ${i} of ${pageCount}`, 40, pageHeight - 20);
            }

            // Save PDF
            // console.log('PDF SITE NAME >>>', siteName);
            // console.log(
            //     'PDF FILE NAME >>>',
            //     `FactSheet_${siteNameForFile}.pdf`
            // );

            doc.save(`Fact_Sheet_${siteNameForFile}.pdf`);

            setIsExporting(false);
        } catch (err) {
            console.error(err);
            toast.error('Failed to export Subscriber Fact Sheet PDF');
            setIsExporting(false);
        }
    };
       const exportFactSheetPDF = async (
        activeUser: IUser,
        accountId: string | number,
        siteId: string | number,
        siteName: string,
        customerName: string
    ) => {
        if (!activeUser || !accountId || !siteId) {
            toast.error('Missing required data for export');
            return;
        }
        
        setIsExporting(true);
        try {
            const sheetData = await getSubscriberFactSheet({
                user: activeUser,
                siteId: String(siteId),
            });
            // sheetData already has the fields; no .data
            if (!sheetData || Object.keys(sheetData).length === 0) {
                toast.error('No Fact Sheet data available');
                return;
            }
            await generateFactSheetPDF(sheetData, activeUser, accountId, siteId, '-', customerName, siteName);
        } catch (error) {
            console.error('Fact Sheet export failed', error);
            toast.error('Failed to export Fact Sheet');
        } finally {
            setIsExporting(false);
        }
    };
    return { isExporting, exportFactSheetPDF };
};
export default FactSheetExport;
