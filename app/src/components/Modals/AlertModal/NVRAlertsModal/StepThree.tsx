// React
import React, { ChangeEvent, RefObject, FC } from 'react';

interface IStepThreeProps {
    handleUploadFileBtn: () => void;
    hiddenFileInput: RefObject<HTMLInputElement>;
    handleFileInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
    uploadedFile: File | null;
}

const StepThree: FC<IStepThreeProps> = ({
    handleUploadFileBtn,
    hiddenFileInput,
    handleFileInputChange,
    uploadedFile,
}) => {
    return (
        <div>
            <p>
                Fill out the blank columns on the CSV you downloaded on the
                previous page. Once complete, upload that file below and click
                &quot;Create Alerts.&quot;
            </p>
            <div>
                <div className="selectFileBtn">
                    <button
                        type="button"
                        className="btn neutral"
                        onClick={handleUploadFileBtn}
                        style={{ marginBottom: 15 }}
                    >
                        Choose File
                    </button>

                    <input
                        id="axisKeyFileInput"
                        type="file"
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        ref={hiddenFileInput}
                        onChange={handleFileInputChange}
                        style={{ display: 'none' }}
                        required
                    />
                    {uploadedFile && (
                        <div>Selected File: {uploadedFile.name} </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StepThree;
