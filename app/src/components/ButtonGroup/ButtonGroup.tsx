import { ReactElement, FC } from 'react';
import '../../styles/components/ButtonGroup/ButtonGroup.scss';

export enum ButtonGroupAlignment {
    topleft = 0,
    topcenter = 1,
    topright = 2,
    middleleft = 3,
    middlecenter = 4,
    middleright = 5,
    bottomleft = 6,
    bottomcenter = 7,
    bottomright = 8,
}

const ButtonGroupAlignmentClasses: string[] = [
    'button-group button-group-top-left',
    'button-group button-group-top-center',
    'button-group button-group-top-right',
    'button-group button-group-middle-left',
    'button-group button-group-middle-center',
    'button-group button-group-middle-right',
    'button-group button-group-bottom-left',
    'button-group button-group-bottom-center',
    'button-group button-group-bottom-right',
];

export interface IButtonGroupProps {
    alignment: ButtonGroupAlignment;
    children?: ReactElement | ReactElement[];
}

const ButtonGroup: FC<IButtonGroupProps> = ({ alignment, children }) => {
    return (
        <div className={ButtonGroupAlignmentClasses[alignment]}>{children}</div>
    );
};

export default ButtonGroup;
