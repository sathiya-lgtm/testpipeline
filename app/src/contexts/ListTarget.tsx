// React
import {
    ReactElement,
    createContext,
    useState,
    useMemo,
    FC,
    useCallback,
    Dispatch,
    SetStateAction,
} from 'react';

// Controller
import {
    ListTarget,
    ListTargetSource,
    RelationToActiveListTarget,
    determineRelationship,
    determineReplacementListTarget,
} from './ListTarget.controller';

// Custom
import { isOnCameraPage } from '../components/CameraList/CameraList.controller';

interface IProps {
    children: ReactElement;
}

interface IListTargetContext {
    listTarget: ListTarget | null;
    setListTarget: Dispatch<SetStateAction<ListTarget | null>>;
    handleListTargetClick: (
        targetedItem: ListTarget,
        isClosing?: boolean
    ) => void;
    clearListTarget: () => void;
    modifyListTargetSource: (src: ListTargetSource) => void;
}

export const ListTargetContext = createContext<IListTargetContext>({
    listTarget: null,
    setListTarget: () => {},
    handleListTargetClick: () => null,
    clearListTarget: () => undefined,
    modifyListTargetSource: () => undefined,
});

/**
 * Context for sharing information about the target of clicking on a CameraList item.
 * Can be used to coordinate view/outlet with CameraList user selection and vice versa.
 * @param {IProps} props - Props that feature child element(s) that need access to ListTargetContext.
 * @returns {ReactElement} Wrapper for elements that needs access to ListTargetContext.
 */
const ListTargetProvider: FC<IProps> = ({ children }: IProps): ReactElement => {
    const [listTarget, setListTarget] = useState<ListTarget | null>(null);

    /**
     * Determines what Camera List item should be referenced in listTarget then replaces
     * active list target if applicable.
     * @param targetedItem - An object representing the most recent Camera List item the user clicked.
     * @param isClosing - Represents whether Camera List item is being closed. Defaults to false.
     * @returns {void}
     */
    const handleListTargetClick = (
        targetedItem: ListTarget,
        isClosing: boolean = false
    ): void => {
        /** targetedItem's relation to currently active list target. */
        const relation: RelationToActiveListTarget = determineRelationship(
            targetedItem,
            listTarget
        );

        if (isOnCameraPage(window.location.href)) {
            // If user is on Camera Page, only change list target if target is a different camera.
            if (targetedItem.type === 'camera' && relation !== 'self') {
                setListTarget(targetedItem);
            }

            return;
        }

        // If user is opening a dropdown that is already active, do nothing to listTarget, just allow dropdown to open.
        if ((relation === 'parent' || relation === 'self') && !isClosing) {
            return;
        }

        // If user is closing a dropdown wherein no member is active...
        if (
            (relation === 'sibling' ||
                relation === 'child' ||
                listTarget === null) &&
            isClosing
        ) {
            // Do nothing, thus allowing dropdown to close without effecting list target.
            return;
        }

        /** List target to replace active target. */
        const replacementTarget: ListTarget | null =
            determineReplacementListTarget(targetedItem, relation);

        setListTarget(replacementTarget);
    };

    /**
     * Sets current list target to null.
     * @returns {void}
     */
    const clearListTarget = useCallback((): void => {
        setListTarget(null);
    }, []);

    /** Changes to "src" value for current list target.
     * @param {ListTargetSource} src - Name of component used to set list target.
     * @returns {void}
     */
    const modifyListTargetSource = useCallback(
        (src: ListTargetSource): void => {
            if (listTarget) {
                const replacementTarget: ListTarget = {
                    ...listTarget,
                    src,
                };

                setListTarget(replacementTarget);
            }
        },
        [listTarget]
    );

    const value = useMemo(
        () => ({
            listTarget,
            setListTarget,
            handleListTargetClick,
            clearListTarget,
            modifyListTargetSource,
        }),
        [
            listTarget,
            setListTarget,
            handleListTargetClick,
            modifyListTargetSource,
        ]
    );

    return (
        <ListTargetContext.Provider value={value}>
            {children}
        </ListTargetContext.Provider>
    );
};

export default ListTargetProvider;
