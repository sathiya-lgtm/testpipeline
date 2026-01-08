// Date-fns
import moment from 'moment-timezone';
import { format } from 'date-fns';

// Types
import { ISPAuditReportData } from '../types/tng-api.interfaces';

export const addSPAuditReportHeaders = (headers: string[]) => {
    return `${headers.join(',')}\n`;
};

export default (reportData: ISPAuditReportData, csvString: string) => {
    const { headers, defaults, rows } = reportData;

    let newCsvString = csvString;
    rows.forEach((row) => {
        headers.forEach((header, headerIndex) => {
            const separator = headerIndex === headers.length - 1 ? '\n' : ',';

            if (header === 'alarm_time') {
                return;
            }

            if (header === 'alarm_date') {
                let alarmDate = defaults[header];

                if (Object.prototype.hasOwnProperty.call(row, header)) {
                    alarmDate = row[header];
                }

                const utcDateString = `${alarmDate} ${row.alarm_time}`;
                const localDate = moment
                    .utc(utcDateString, 'YYYY-MM-DD HH:mm:ss')
                    .local();

                const alarm_date = format(localDate.toDate(), 'MM/dd/yyyy');
                const alarm_time = format(localDate.toDate(), 'HH:mm:ss');
                newCsvString += `${alarm_date}${separator}${alarm_time}${separator}`;
            } else if (Object.prototype.hasOwnProperty.call(row, header)) {
                newCsvString += `${row[header]}${separator}`;
            } else {
                newCsvString += `${defaults[header]}${separator}`;
            }
        });
    });

    return newCsvString;
};
