// Date-fns
import moment from 'moment-timezone';
import { format } from 'date-fns';

// Types
import { IAIClassificationErrorReportData } from '../types/tng-api.interfaces';

export const addAIClassificationErrorReportHeaders = (headers: string[]) => {
    let newHeaders = ``;
    headers.forEach((header) => {
        newHeaders += `${header.slice(4).toLowerCase()},`; // converts from ex OUT_CAMERA_NAME to camera_name
    });
    newHeaders = `${newHeaders.slice(0, newHeaders.length - 1)}\n`;
    return newHeaders;
};

export default (
    reportData: IAIClassificationErrorReportData,
    csvString: string
) => {
    const { rows, headers } = reportData;

    let newCsvString = csvString;
    rows.forEach((row) => {
        const rowArray = row.split(',');
        headers.forEach((header, headerIndex) => {
            const separator = headerIndex === headers.length - 1 ? '' : ',';

            if (header === 'OUT_ALARM_TIME' || header === 'OUT_REPORT_TIME') {
                return;
            }

            if (header === 'OUT_ALARM_DATE' || header === 'OUT_REPORT_DATE') {
                const alarmDate = rowArray[headerIndex];

                if (alarmDate === ``) {
                    newCsvString += `,,`; // no date so leave empty
                    return;
                }

                const utcDateString = `${alarmDate}`;
                const localDate = moment
                    .utc(utcDateString, 'YYYY-MM-DD HH:mm:ss')
                    .local();

                const alarm_date = format(localDate.toDate(), 'MM/dd/yyyy');
                const alarm_time = format(localDate.toDate(), 'HH:mm:ss');
                newCsvString += `${alarm_date}${separator}${alarm_time}${separator}`;
            } else {
                newCsvString += `${rowArray[headerIndex]}${separator}`;
            }
        });
    });

    return newCsvString;
};
