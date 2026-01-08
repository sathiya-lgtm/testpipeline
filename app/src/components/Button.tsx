/* eslint-disable react/button-has-type */
// React
import React, { ReactElement, FC, CSSProperties } from 'react';

// Styles
import '../styles/components/Buttons.scss';

interface IProps {
    label: string;
    className: string;
    data?: any;
    onClick?: (data: any) => void;
    id?: string;
    type?: 'button' | 'submit' | 'reset';
    width?: string;
    height?: string;
    visible?: boolean;
    disabled?: boolean;
}

/**
 * Button component of type="button" with onClick event handler.
 * @param {IProps} props - Object with key/values for children component(s) and onClick event handler.
 * @returns {ReactElement} A button element.
 */

const Button: FC<IProps> = ({
    label,
    className,
    data,
    onClick,
    id,
    type,
    width,
    height,
    visible,
    disabled,
}: IProps): ReactElement => {
    const styles: CSSProperties = {};
    if (width) {
        styles.width = width;
    }
    if (height) {
        styles.height = height;
    }
    if (visible === false) {
        styles.display = 'none';
    }
    const handleClick = () => {
        if (onClick) {
            onClick(data);
        }
    };
    return (
        // eslint-disable-next-line react/button-has-type
        <button
            id={id}
            data-testid={id}
            type={type}
            className={className}
            onClick={handleClick}
            disabled={disabled}
            style={styles}
        >
            {label}
        </button>
    );
};

interface ISaveProps {
    data?: any;
    onClick?: (data: any) => void;
    id?: string;
    type?: 'button' | 'submit' | 'reset';
    width?: string;
    height?: string;
    visible?: boolean;
    disabled?: boolean;
}

export const SaveButton: FC<ISaveProps> = ({
    data,
    onClick,
    id,
    type,
    width,
    height,
    visible,
    disabled,
}: ISaveProps): ReactElement => {
    return (
        <Button
            id={id}
            data-testid={id}
            data={data}
            visible={visible}
            label="Save"
            type={type ?? 'button'}
            width={width}
            height={height}
            className="btn primary"
            onClick={onClick}
            disabled={disabled}
        />
    );
};

interface ICancelProps {
    data?: any;
    onClick?: (data: any) => void;
    id?: string;
    type?: 'button' | 'submit' | 'reset';
    width?: string;
    height?: string;
    visible?: boolean;
    disabled?: boolean;
}

export const CancelButton: FC<ICancelProps> = ({
    data,
    onClick,
    id,
    type,
    width,
    height,
    visible,
    disabled,
}: ICancelProps): ReactElement => {
    return (
        <Button
            id={id}
            data-testid={id}
            data={data}
            visible={visible}
            label="Cancel"
            type={type ?? 'button'}
            width={width}
            height={height}
            className="btn neutral"
            onClick={onClick}
            disabled={disabled}
        />
    );
};

interface IDeleteProps {
    data?: any;
    onClick?: (data: any) => void;
    id?: string;
    type?: 'button' | 'submit' | 'reset';
    width?: string;
    height?: string;
    visible?: boolean;
    disabled?: boolean;
}

export const DeleteButton: FC<IDeleteProps> = ({
    data,
    onClick,
    id,
    type,
    width,
    height,
    visible,
    disabled,
}: IDeleteProps): ReactElement => {
    return (
        <Button
            id={id}
            data-testid={id}
            data={data}
            visible={visible}
            label="Delete"
            type={type ?? 'button'}
            width={width}
            height={height}
            className="btn danger"
            onClick={onClick}
            disabled={disabled}
        />
    );
};

export default Button;
