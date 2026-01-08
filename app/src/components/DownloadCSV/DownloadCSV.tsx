import { FC } from 'react';
import '../../styles/components/DownloadCSV/DownloadCSV.scss';
import { FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';

export type Column = {
    key: string;
    header?: string | null;
};

export type Row = { [key: string]: any };

export interface IDownloadCSVProps {
    data: any;
    object_name?: string | null;
    headers: Column[] | null;
    filename: string;
    filter?: string;
}

const DownloadCSV: FC<IDownloadCSVProps> = ({
    data,
    object_name,
    headers,
    filename,
    filter,
}: IDownloadCSVProps) => {
    const getHeader = (fields: string[]): string => {
        if (!fields) return '';
        const parsedFields: string[] = [];
        fields.forEach((field) => {
            const aggField = field.split('.');
            if (!aggField) parsedFields.push('ERROR');
            if (aggField.length === 1) parsedFields.push(field.toUpperCase());
            if (aggField.length === 2)
                parsedFields.push(aggField[1].toUpperCase());
        });
        return parsedFields.join(',');
    };

    const getRowValue = (row: Row, field: string): string => {
        if (!row || !field) return '';
        const aggField = field.toString().split('.');
        if (aggField) {
            if (aggField.length === 1) {
                const rowValue = row[field].toString();
                if (rowValue) {
                    return rowValue.toString();
                }
            } else if (aggField.length === 2) {
                const key1: string = aggField[0];
                const key2: string = aggField[1];
                const rowValue = row[key1][key2].toString();
                if (rowValue) return rowValue;
            }
        }
        return '';
    };

    const handleClick = () => {
        if (!data) {
            toast.error('There is no data to download');
            return;
        }
        if (data.length > 0) {
            const dataFields: string[] = [];
            headers?.forEach((header) => {
                return dataFields.push(header.key);
            });
            const dataHeaders: string[] = [];
            headers?.forEach((column) => {
                return dataHeaders.push(column.header ?? '');
            });
            const csvRows = [];
            const header = getHeader(dataHeaders);
            csvRows.push(header);
            data.forEach((row: Row) => {
                const csvRow: string[] = [];
                dataFields.forEach((field) => {
                    csvRow.push(getRowValue(row, field));
                });
                if (filter) {
                    const checkRow = JSON.stringify(csvRow);
                    if (checkRow.indexOf(filter) >= 0) {
                        csvRows.push(csvRow.join(','));
                    }
                } else {
                    csvRows.push(csvRow.join(','));
                }
            });
            const csv = csvRows.join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename ?? 'grid.csv'}`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 2500);
        }
    };
    if (data) {
        if (data.length > 0) {
            return (
                <span
                    className="label tooltip left"
                    data-tooltip={
                        object_name !== undefined
                            ? `Download ${object_name}`
                            : 'Download CSV'
                    }
                >
                    <div className="download-csv">
                        <div className="download-button" onClick={handleClick}>
                            <FaDownload />
                        </div>
                    </div>
                </span>
            );
        }
    }
    return null;
};

export default DownloadCSV;
