// React
import {
    ReactElement,
    FC,
    MouseEvent,
    ChangeEvent,
    KeyboardEvent,
    CSSProperties,
    useRef,
    useState,
} from 'react';

// Components
import { IconType } from 'react-icons';
import { MdCheckBoxOutlineBlank } from 'react-icons/md';
import {
    FaTrash,
    FaCog,
    FaRegPlusSquare,
    FaRegMinusSquare,
    FaRegCheckSquare,
} from 'react-icons/fa';
import Toggle from '../Inputs/Toggle';
import Button from '../Button';
import { SelectOption } from '../../types/interfaces';

// Sass
import '../../styles/components/Grid/Grid.scss';
import '../../styles/tooltip.scss';

// Enumerations
export enum CellAlignment {
    left = 0,
    center = 1,
    right = 2,
}

export enum CellSize {
    normal = 0,
    xsmall = 1,
    small = 2,
    medium = 3,
    large = 4,
    xlarge = 5,
    xxlarge = 6,
}

export interface ICellSelectOption {
    value: string;
    label: string;
}

const getCellAlignment = (alignment?: CellAlignment): string => {
    if (alignment === CellAlignment.left) return 'cell-left';
    if (alignment === CellAlignment.center) return 'cell-center';
    if (alignment === CellAlignment.right) return 'cell-right';
    return 'cell-left';
};

const getCellSize = (size?: CellSize): string => {
    if (size === CellSize.xsmall) return 'grid-cell-size-xsmall';
    if (size === CellSize.small) return 'grid-cell-size-small';
    if (size === CellSize.medium) return 'grid-cell-size-medium';
    if (size === CellSize.large) return 'grid-cell-size-large';
    if (size === CellSize.xlarge) return 'grid-cell-size-xlarge';
    if (size === CellSize.xxlarge) return 'grid-cell-size-xxlarge';
    return 'grid-cell-size-normal';
};

export interface IColumn {
    caption: string | String;
    alignment?: CellAlignment;
    tooltip?: string;
    width?: string;
}

export const Column: FC<IColumn> = ({
    caption,
    alignment,
    tooltip,
    width,
}: IColumn) => {
    const style: CSSProperties = {};
    if (width) {
        style.width = width;
    }
    if (!tooltip) {
        return (
            <td
                style={style}
                className={`grid-column ${getCellAlignment(alignment)}`}
            >
                <span className="grid-column-text">{caption}</span>
            </td>
        );
    }
    return (
        <td
            style={style}
            className={`grid-column ${getCellAlignment(alignment)}`}
        >
            <span className="label tooltip top wide" data-tooltip={tooltip}>
                <span className="grid-column-text">{caption}</span>
            </span>
        </td>
    );
};

export interface IEmptyColumn {
    width?: string;
}

export const EmptyColumn: FC<IEmptyColumn> = ({ width }) => {
    const style: CSSProperties = {};
    if (width) {
        style.width = width ?? '10px';
    }
    return (
        <td style={style} className="grid-empty-column">
            &nbsp;
        </td>
    );
};

export interface IIconColumn {
    Icon: IconType;
    size?: string;
    tooltip?: string;
    visible?: boolean;
}

export const IconColumn: FC<IIconColumn> = ({
    Icon,
    size,
    tooltip,
    visible,
}: IIconColumn) => {
    const isIconVisible = visible ?? true;
    if (!tooltip) {
        return (
            <td className="grid-icon-column column-center">
                {isIconVisible && <Icon size={size ?? '1em'} />}
            </td>
        );
    }
    return (
        <td className="grid-icon-column column-center">
            <span className="label tooltip left" data-tooltip={tooltip}>
                {isIconVisible && <Icon size={size ?? '1em'} />}
            </span>
        </td>
    );
};

export interface IConfigureColumn {
    visible?: boolean;
    size?: string;
}

export const ConfigureColumn: FC<IConfigureColumn> = ({
    visible,
    size,
}: IConfigureColumn) => {
    const isVisible = visible ?? true;
    return (
        <td
            className={`grid-icon-column ${getCellAlignment(
                CellAlignment.center
            )}`}
        >
            <span className="label tooltip left" data-tooltip="Configure">
                {isVisible && <FaCog size={size ?? '1em'} />}
            </span>
        </td>
    );
};

export interface IDeleteColumn {
    visible?: boolean;
    size?: string;
}

export const DeleteColumn: FC<IDeleteColumn> = ({
    visible,
    size,
}: IDeleteColumn) => {
    const isVisible = visible ?? true;
    return (
        <td
            className={`grid-icon-column ${getCellAlignment(
                CellAlignment.center
            )}`}
        >
            <span className="label tooltip left" data-tooltip="Delete">
                {isVisible && <FaTrash size={size ?? '1em'} />}
            </span>
        </td>
    );
};

export interface ICheckboxColumn {
    size?: string;
    checked?: boolean;
    data?: any;
    onClick?: (checked: boolean, data: any) => void;
}

export const CheckboxColumn: FC<ICheckboxColumn> = ({
    size,
    checked,
    data,
    onClick,
}: ICheckboxColumn) => {
    const handleClick = () => {
        if (onClick) {
            onClick(!checked, data);
        }
    };
    return (
        <td
            className="grid-checkbox-column column-center"
            onClick={handleClick}
        >
            <span className="label tooltip right" data-tooltip="Select All">
                <span className="grid-checkbbox-column-icon">
                    {checked === true ? (
                        <FaRegCheckSquare size={size ?? '1em'} />
                    ) : (
                        <MdCheckBoxOutlineBlank size={size ?? '1em'} />
                    )}
                </span>
            </span>
        </td>
    );
};

export interface IExpandedColumn {
    expanded?: boolean;
    size?: string;
    onToggle?: (expanded: boolean) => void;
}

export const ExpandedColumn: FC<IExpandedColumn> = ({
    expanded,
    size,
    onToggle,
}: IExpandedColumn) => {
    // Events
    const handleToggle = () => {
        if (onToggle) {
            onToggle(!expanded);
        }
    };
    if (expanded === true) {
        return (
            <td className="grid-icon-column cell-center" onClick={handleToggle}>
                <span
                    className="label tooltip right"
                    data-tooltip="Collapse All Rows"
                >
                    <FaRegMinusSquare size={size ?? '1em'} />
                </span>
            </td>
        );
    }
    return (
        <td className="grid-icon-column cell-center" onClick={handleToggle}>
            <span
                className="label tooltip right"
                data-tooltip="Expand All Rows"
            >
                <FaRegPlusSquare size={size ?? '1em'} />
            </span>
        </td>
    );
};

export type HeaderChildren = ReactElement<
    | typeof Column
    | typeof EmptyColumn
    | typeof ExpandedColumn
    | typeof CheckboxColumn
    | typeof DeleteColumn
    | typeof ConfigureColumn
>;

export interface IHeader {
    children?: any | HeaderChildren | HeaderChildren[] | null;
}

export const Header: FC<IHeader> = ({ children }: IHeader) => {
    return (
        <thead className="grid-header">
            <tr className="grid-header">{children}</tr>
        </thead>
    );
};

export interface ICell {
    columnMap?: string;
    columnType?: string;
    columnOptions?: ICellSelectOption[];
    caption: string;
    alignment?: CellAlignment;
    size?: CellSize;
    canEdit?: Boolean;
    data?: any;
    onEditChange?: (
        field: any,
        columnMap: string,
        changedValue: string
    ) => void;
}

export const Cell: FC<ICell> = ({
    columnMap,
    columnType,
    columnOptions,
    caption,
    alignment,
    size,
    canEdit,
    data,
    onEditChange,
}) => {
    const [editValue, setEditValue] = useState<string>(caption);
    const [editing, setEditMode] = useState<boolean>(false);
    const editCellRef = useRef<HTMLInputElement>(null);
    const selectCellRef = useRef<HTMLSelectElement>(null);

    const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            setEditMode(false);
            if (onEditChange) {
                onEditChange(data, columnMap ?? '(not set)', editValue);
            }
        }
    };

    const handlerSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
        if (onEditChange) {
            setEditMode(false);
            onEditChange(data, columnMap ?? '(not set)', event.target.value);
        }
    };

    const handleBlur = () => {
        setEditMode(false);
        if (onEditChange) {
            onEditChange(data, columnMap ?? '(not set)', editValue);
        }
    };

    const handleEditClick = () => {
        setEditMode(true);
        const editColumnType = columnType ?? 'input';
        if (editColumnType === 'select') {
            if (selectCellRef.current) {
                selectCellRef.current.focus();
            }
        }
        if (editCellRef.current) {
            editCellRef.current.focus();
        }
    };

    const classNameArray: string[] = ['grid-cell'];
    if (alignment) {
        classNameArray.push(getCellAlignment(alignment));
    }
    if (size) {
        classNameArray.push(getCellSize(size));
    }
    if (canEdit) {
        classNameArray.push('cell-editable');
    }
    const className: string = classNameArray.join(' ');
    if (!canEdit) {
        return (
            <td className={className}>
                <span className="grid-cell-text">{caption}</span>
            </td>
        );
    }
    if (editing) {
        if (columnType === 'select') {
            if (!columnOptions) {
                return <span>Set column</span>;
            }
            return (
                <td className={className}>
                    <select
                        ref={selectCellRef}
                        className="grid-cell-select-input"
                        value={editValue}
                        onChange={handlerSelectChange}
                        onBlur={handleBlur}
                    >
                        {columnOptions.map((columnOption, index) => {
                            const optionKey = `grid-cell-select-option-${index}`;
                            return (
                                <option
                                    key={optionKey}
                                    value={columnOption.value}
                                >
                                    {columnOption.label}
                                </option>
                            );
                        })}
                    </select>
                </td>
            );
        }
        return (
            <td className={className}>
                <input
                    ref={editCellRef}
                    className="grid-cell-text-input"
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={handleBlur}
                />
            </td>
        );
    }
    return (
        <td className={className}>
            <span className="grid-cell-text" onClick={handleEditClick}>
                {caption}
            </span>
        </td>
    );
};

export interface IEmptyCell {
    width?: string;
}

export const EmptyCell: FC<IEmptyCell> = ({ width }) => {
    const style: CSSProperties = {};
    if (width) {
        style.width = width ?? '5px';
    }
    return (
        <td style={style} className="empty-cell">
            &nbsp;
        </td>
    );
};

export interface IIconCell {
    Icon: IconType;
    size?: string;
    color?: string;
    tooltip?: string;
    data?: any | null;
    visible?: boolean;
    onClick?: (data: any) => void;
}

export const IconCell: FC<IIconCell> = ({
    Icon,
    size,
    color,
    tooltip,
    data,
    visible,
    onClick,
}) => {
    const handleClick = () => {
        if (onClick) {
            onClick(data);
        }
    };

    if (visible === false) {
        return <td className="grid-icon-cell column-center">&nbsp;</td>;
    }

    if (!tooltip) {
        return (
            <td className="grid-icon-cell column-center" onClick={handleClick}>
                <Icon
                    size={size ?? '1em'}
                    style={{ color: color ?? 'white' }}
                />
            </td>
        );
    }
    return (
        <td className="grid-icon-cell column-center" onClick={handleClick}>
            <span className="label tooltip left" data-tooltip={tooltip}>
                <Icon
                    size={size ?? '1em'}
                    style={{ color: color ?? 'white' }}
                />
            </span>
        </td>
    );
};

export interface IConfigureIconCell {
    size?: string;
    color?: string;
    tooltip?: string;
    data?: any | null;
    visible?: boolean;
    onConfigure?: (data: any) => void;
}

export const ConfigureCell: FC<IConfigureIconCell> = ({
    size,
    color,
    tooltip,
    data,
    visible,
    onConfigure,
}) => {
    const handleConfigure = (event: MouseEvent<SVGElement>) => {
        event.stopPropagation();
        if (onConfigure && data) onConfigure(data);
    };
    const isVisible = visible ?? true;
    return (
        <td className="grid-icon-cell column-center">
            <span className="label tooltip left" data-tooltip={tooltip}>
                {isVisible && (
                    <FaCog
                        size={size ?? '1em'}
                        style={{ color: color ?? 'white' }}
                        onClick={handleConfigure}
                    />
                )}
            </span>
        </td>
    );
};

export interface IToggleCell {
    active: boolean;
    disabled?: boolean;
    data?: any | null | undefined;
    onToggle?: (active: boolean, data: any) => void;
}

export const ToggleCell: FC<IToggleCell> = ({
    active,
    disabled,
    data,
    onToggle,
}) => {
    const handleToggleChange = () => {
        if (onToggle && data) {
            onToggle(!active, data);
        }
    };
    return (
        <td className="grid-toggle-cell">
            <Toggle
                value={active}
                toggleOnText="Yes"
                toggleOffText="No"
                disabled={disabled}
                onToggleChange={handleToggleChange}
            />
        </td>
    );
};

export interface IDeleteCell {
    size?: string;
    color?: string;
    data?: any | null;
    visible?: boolean;
    tooltip?: string;
    onDelete?: (data: any) => void;
}

export const DeleteCell: FC<IDeleteCell> = ({
    size,
    color,
    data,
    visible,
    tooltip,
    onDelete,
}) => {
    const handleDelete = (event: MouseEvent<SVGElement>) => {
        event.stopPropagation();
        if (onDelete && data) onDelete(data);
    };
    const isVisible = visible ?? true;
    return (
        <td
            className={`grid-icon-cell ${getCellAlignment(
                CellAlignment.center
            )}`}
        >
            <span
                className="label tooltip left"
                data-tooltip={tooltip ?? 'Delete'}
            >
                {isVisible && (
                    <FaTrash
                        size={size ?? '1em'}
                        style={{ color: color ?? 'white' }}
                        onClick={handleDelete}
                    />
                )}
            </span>
        </td>
    );
};

export interface ISelectCell {
    id: string;
    value?: string | number | readonly string[] | undefined;
    placeholder?: string | undefined;
    options?: SelectOption[] | null;
    onSelectCellChanged?: (data: any) => void;
}

export const SelectCell: FC<ISelectCell> = ({
    id,
    value,
    placeholder,
    options,
    onSelectCellChanged,
}: ISelectCell) => {
    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        if (onSelectCellChanged) {
            onSelectCellChanged(event.target.value);
        }
    };
    let optionIndex = 0;
    return (
        <td className="grid-select-cell column-center">
            <select
                id={id}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
            >
                {options?.map((option: SelectOption) => {
                    optionIndex += 1;
                    return (
                        <option
                            key={`option-${optionIndex}`}
                            value={option.value}
                        >
                            {option.label}
                        </option>
                    );
                })}
            </select>
        </td>
    );
};

export interface IButtonCell {
    id: string;
    label: string;
    onClick?: () => void;
}

export const ButtonCell: FC<IButtonCell> = ({
    id,
    label,
    onClick,
}: IButtonCell) => {
    return (
        <td className="grid-button-cell column-center">
            <Button
                id={id}
                className="btn primary"
                label={label}
                type="button"
                width="auto"
                onClick={onClick}
            />
        </td>
    );
};

export interface ICheckboxCell {
    size?: string;
    checked?: boolean;
    data?: any;
    visible?: boolean;
    onClick?: (checked: boolean, data: any) => void;
}

export const CheckboxCell: FC<ICheckboxCell> = ({
    size,
    checked,
    data,
    visible,
    onClick,
}: ICheckboxCell) => {
    const handleClick = () => {
        if (onClick && data) {
            onClick(!checked, data);
        }
    };
    const isVisible = visible ?? true;
    if (isVisible) {
        return (
            <td
                className="grid-checkbox-cell column-center"
                onClick={handleClick}
            >
                {checked === true ? (
                    <FaRegCheckSquare size={size ?? '1em'} />
                ) : (
                    <MdCheckBoxOutlineBlank size={size ?? '1em'} />
                )}
            </td>
        );
    }
    return null;
};

export interface IInputCell {
    placeholder?: string | undefined;
    defaultValue?: string | number | readonly string[] | undefined;
    value?: string | number | readonly string[] | undefined;
    onChange?: (data: string | number | readonly string[] | undefined) => void;
}

export const InputCell: FC<IInputCell> = ({
    value,
    defaultValue,
    placeholder,
    onChange,
}: IInputCell) => {
    const onHandleChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(event.target.value);
        }
    };
    return (
        <td className="grid-input-cell">
            <input
                type="text"
                placeholder={placeholder}
                value={value ?? defaultValue}
                onChange={onHandleChange}
            />
        </td>
    );
};

export interface IStatusCell {
    device_status: number;
}

export const StatusCell: FC<IStatusCell> = ({ device_status }: IStatusCell) => {
    const onRenderStatus = () => {
        const style: CSSProperties = {};
        let statusText = 'PENDING';
        if (device_status === 0) {
            style.backgroundColor = 'white';
            style.color = 'black';
            statusText = 'PENDING';
        }
        if (device_status === 1) {
            style.backgroundColor = 'green';
            style.color = 'white';
            statusText = 'ONLINE';
        }
        if (device_status === 2) {
            style.backgroundColor = 'yellow';
            style.color = 'black';
            statusText = 'WARNING';
        }
        if (device_status === 3) {
            style.backgroundColor = 'orange';
            style.color = 'white';
            statusText = 'CRITICAL';
        }
        if (device_status === 4) {
            style.backgroundColor = 'red';
            statusText = 'OFFLINE';
        }
        return (
            <span className="grid-status-cell-icon" style={style}>
                <span className="grid-status-cell-text">{statusText}</span>
            </span>
        );
    };
    return <td className="grid-status-cell">{onRenderStatus()}</td>;
};

export type RowChildren = ReactElement<
    | typeof Cell
    | typeof IconCell
    | typeof ToggleCell
    | typeof SelectCell
    | typeof ButtonCell
    | typeof CheckboxCell
    | typeof InputCell
    | typeof StatusCell
>;

export interface IRow {
    filter?: string;
    data?: any;
    children?: string | String | RowChildren | RowChildren[] | null;
}

export const Row: FC<IRow> = ({ filter, data, children }: IRow) => {
    if (!filter || !data) {
        return <tr className="grid-row">{children}</tr>;
    }
    const jsonString = JSON.stringify(data).toLowerCase();
    if (jsonString.includes(filter.toLowerCase()) === true) {
        return <tr className="grid-row">{children}</tr>;
    }
    return null;
};

export interface IExpandableRow {
    filter?: string | null;
    data?: any | null;
    expanded: boolean;
    caption?: string | ReactElement | ReactElement[] | null;
    children?: string | ReactElement | ReactElement[] | null;
    span?: number;
    onToggle?: (expanded: boolean, data: any) => void;
}

export const ExpandableRow: FC<IExpandableRow> = ({
    filter,
    data,
    caption,
    expanded,
    children,
    span,
    onToggle,
}: IExpandableRow) => {
    const handleToggle = () => {
        if (onToggle) {
            onToggle(!expanded, data);
        }
    };
    const colSpan = (span ?? 0) + 1;
    if (!filter && !data) {
        return (
            <>
                <tr className="grid-expandable-row" onClick={handleToggle}>
                    <td
                        className="grid-expandable-toggle"
                        onClick={handleToggle}
                    >
                        {expanded === true ? (
                            <FaRegMinusSquare />
                        ) : (
                            <FaRegPlusSquare />
                        )}
                    </td>
                    {caption}
                </tr>
                <tr
                    className={
                        expanded === true
                            ? 'grid-expandable-row-content-expanded'
                            : 'grid-expandable-row-content'
                    }
                >
                    {expanded === true && <td colSpan={colSpan}>{children}</td>}
                </tr>
            </>
        );
    }
    const jsonString = JSON.stringify(data).toLowerCase();
    if (jsonString.includes(filter?.toLowerCase() ?? '') === true) {
        return (
            <>
                <tr className="grid-expandable-row" onClick={handleToggle}>
                    <td
                        className="grid-expandable-toggle"
                        onClick={handleToggle}
                    >
                        {expanded === true ? (
                            <FaRegMinusSquare />
                        ) : (
                            <FaRegPlusSquare />
                        )}
                    </td>
                    {caption}
                </tr>
                <tr
                    className={
                        expanded === true
                            ? 'grid-expandable-row-content-expanded'
                            : 'grid-expandable-row-content'
                    }
                >
                    {expanded === true && <td colSpan={colSpan}>{children}</td>}
                </tr>
            </>
        );
    }
    return null;
};

export interface INewRow {
    visible?: boolean;
    children?: string | String | RowChildren | RowChildren[] | null;
}

export const NewRow: FC<INewRow> = ({ visible, children }: INewRow) => {
    const isVisible = visible ?? false;
    if (isVisible) {
        return <tr className="grid-new-row">{children}</tr>;
    }
    return null;
};

export type BodyChildren = ReactElement<
    typeof Row | typeof ExpandableRow | typeof NewRow
>;

export interface IBody {
    loading?: boolean;
    visible?: boolean;
    noData?: boolean;
    noDataMessage?: string;
    children?: string | BodyChildren | BodyChildren[] | null | undefined;
}

export const Body: FC<IBody> = ({
    loading,
    visible,
    noData,
    noDataMessage,
    children,
}) => {
    const isVisible = visible ?? true;
    if (loading) {
        return (
            <tbody className="grid-body-loading">
                <tr>
                    <td colSpan={100}>
                        <span>Loading</span>
                        <div className="load-bar">
                            <span className="load-column-1">
                                <i className="load-sphere c1" />
                            </span>
                            <span className="load-column-2">
                                <i className="load-sphere c2" />
                            </span>
                            <span className="load-column-3">
                                <i className="load-sphere c3" />
                            </span>
                            <span className="load-column-4">
                                <i className="load-sphere c4" />
                            </span>
                            <span className="load-column-5">
                                <i className="load-sphere c5" />
                            </span>
                            <span className="load-column-6">
                                <i className="load-sphere c6" />
                            </span>
                        </div>
                    </td>
                </tr>
            </tbody>
        );
    }
    if (isVisible) {
        if (!noData) {
            return <tbody className="grid-body">{children}</tbody>;
        }
        const message =
            noDataMessage === undefined
                ? 'There is no data to display'
                : noDataMessage;
        return (
            <tbody className="grid-body-no-data">
                <tr>
                    <td colSpan={100}>
                        <span>{message}</span>
                    </td>
                </tr>
            </tbody>
        );
    }
    return null;
};

export type GridChildren = ReactElement<typeof Header | typeof Body>;

export interface IGrid {
    children?: string | GridChildren | GridChildren[] | null;
}

const Grid: FC<IGrid> = ({ children }: IGrid) => {
    return <table className="grid">{children}</table>;
};

export default Grid;
