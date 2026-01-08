/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable no-param-reassign */
/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-explicit-any */

// React
import React, {
    FC,
    useMemo,
    useCallback,
    useRef,
    useEffect,
    useState,
    Dispatch,
    SetStateAction,
} from 'react';

// Slate
import { Editor, Transforms, Range, createEditor, Node } from 'slate';
import { withHistory } from 'slate-history';
import { Slate, Editable, ReactEditor, withReact } from 'slate-react';

// Types
import {
    IAISearchTokens,
    // INLSearchTokens,
} from '../../types/tng-api.interfaces';

export type CustomText = {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    text: string;
};

const initialValue: any[] = [
    {
        type: 'paragraph',
        children: [{ text: '' }],
    },
];

const insertText = (editor: Editor, character: any, isFirstWord: boolean) => {
    if (isFirstWord) {
        Transforms.insertText(editor, character);
    } else {
        Transforms.insertText(editor, ` ${character}`);
    }
};

const MAXIMUM_CHAR_LENGTH = 512;

interface IProps {
    autoFillValues: string[];
    onSubmit: () => void;
    nlSearchInput: string;
    setNlSearchInput: Dispatch<SetStateAction<string>>;
    // setSearchTokens: Dispatch<SetStateAction<INLSearchTokens>>;
    setSearchTokens: Dispatch<SetStateAction<IAISearchTokens>>;
    setEditor: Dispatch<SetStateAction<Editor | null>>;
    clearAISearchInput: () => void;
}

/** Please Note the slate library is a little wonky and doesn't work well with Vite's hot module reloading.
 * When making changes to this component in development, you may need to do a hard reload to get the changes to work.
 * Some parts of the element break when changes are made, saved and react attempts to do a refresh.
 * These are fixed when the app is hard reloaded.
 */
const AutoComplete: FC<IProps> = ({
    autoFillValues,
    onSubmit,
    nlSearchInput,
    setNlSearchInput,
    setSearchTokens,
    setEditor,
    clearAISearchInput,
}) => {
    const ref = useRef<any>();
    const [target, setTarget] = useState<Range | undefined | null>();
    const [index, setIndex] = useState(0);
    const [search, setSearch] = useState('');
    const editor = useMemo(() => withReact(withHistory(createEditor())), []);
    const [isFirstWord, setIsFirstWord] = useState(true);
    const [searchError, setSearchError] = useState('');

    const styles: React.CSSProperties = {
        opacity: searchError ? 1 : 0,
        transition: 'opacity 0.5s ease-in-out',
        color: 'red',
    };

    // const clearInput = () => {
    //     Transforms.delete(editor, {
    //         at: {
    //             anchor: Editor.start(editor, []),
    //             focus: Editor.end(editor, []),
    //         },
    //     });
    //     setNlSearchInput('');
    //     // setSearchTokens({ date_from: '', date_to: '' });
    //     setSearchTokens({ start_date: '', end_date: '' });
    // };

    const chars = autoFillValues
        .filter(
            (c) =>
                c.toLowerCase().startsWith(search.toLowerCase()) &&
                search.length < c.length
        )
        .slice(0, 10);

    const onKeyDown = useCallback(
        (event: any) => {
            if (target && chars.length > 0) {
                switch (event.key) {
                    case 'ArrowDown':
                        event.preventDefault();
                        const prevIndex =
                            index >= chars.length - 1 ? 0 : index + 1;
                        setIndex(prevIndex);
                        break;
                    case 'ArrowUp':
                        event.preventDefault();
                        const nextIndex =
                            index <= 0 ? chars.length - 1 : index - 1;
                        setIndex(nextIndex);
                        break;
                    case 'Tab':
                    case 'Enter':
                        event.preventDefault();
                        Transforms.select(editor, target);
                        insertText(editor, chars[index] + ' ', isFirstWord);
                        setTarget(null);
                        break;
                    case 'Escape':
                        event.preventDefault();
                        setTarget(null);
                        break;
                    default:
                        break;
                }
            } else if (event.key === 'Enter') {
                event.preventDefault();
                onSubmit();
            }
        },
        [chars, editor, index, target, isFirstWord]
    );

    useEffect(() => {
        if (target && chars.length > 0 && ref.current) {
            const parent = document.querySelector('.autoComplete');
            const el = ref.current;
            const domRange = ReactEditor.toDOMRange(editor, target);
            const rect = domRange.getBoundingClientRect();

            if (parent) {
                const parentEl = parent.getBoundingClientRect();
                el.style.top = `${
                    rect.top - parentEl.top + window.scrollY + 24
                }px`;
                el.style.left = `${
                    rect.left - parentEl.left + window.scrollX
                }px`;
            }
        }
    }, [chars.length, editor, index, search, target]);

    useEffect(() => {
        if (editor) {
            setEditor(editor);
        }
    }, [editor]);

    useEffect(() => {
        if (nlSearchInput) {
            Transforms.delete(editor, {
                at: {
                    anchor: Editor.start(editor, []),
                    focus: Editor.end(editor, []),
                },
            });
            setSearchTokens({ start_date: '', end_date: '' });
            // Transforms.insertText(editor, nlSearchInput);
            insertText(editor, nlSearchInput, true);
        }
    }, []);

    const handlePaste = useCallback(
        (event: React.ClipboardEvent<HTMLDivElement>) => {
            event.preventDefault();

            const pastedText = event.clipboardData
                .getData('text/plain')
                .replace(/\r\n|\r/g, '\n');

            // Replace selected text
            // Transforms.insertText(editor, pastedText);
            insertText(editor, pastedText, true);

            // After insertion, get all text content
            const fullText = Node.string(editor);

            if (fullText.length > MAXIMUM_CHAR_LENGTH) {
                setSearchError(
                    `You have reached the maximum limit of ${MAXIMUM_CHAR_LENGTH} characters.`
                );

                // Trim text to maxChars
                const trimmed = fullText.slice(0, MAXIMUM_CHAR_LENGTH);

                // Replace entire editor content with trimmed version
                Transforms.removeNodes(editor, {
                    at: [],
                    match: () => true,
                });

                // Transforms.insertText(editor, trimmed);
                insertText(editor, trimmed, true);

                setTimeout(() => {
                    setSearchError('');
                }, 10000);
            } else {
                setSearchError('');
            }
        },
        [editor]
    );

    const handleBeforeInput = (event: InputEvent) => {
        const inputType = event.inputType;

        // Allow deletion and non-character edits
        if (
            inputType === 'deleteContentBackward' ||
            inputType === 'deleteContentForward' ||
            inputType.startsWith('delete')
        ) {
            return; // allow deletes
        }

        const textChars = Node.string(editor); // Gets all text from the editor

        if (textChars.length >= MAXIMUM_CHAR_LENGTH) {
            event.preventDefault();
            setSearchError(
                `You have reached the maximum limit of ${MAXIMUM_CHAR_LENGTH} characters.`
            );
            setTimeout(() => {
                setSearchError('');
            }, 10000);
        } else {
            setSearchError('');
        }
    };

    return (
        <>
            <Slate
                editor={editor}
                initialValue={initialValue}
                onChange={(value) => {
                    let formattedValue = '';

                    value.forEach((des: any) => {
                        if (des.children && des.children[0].text) {
                            formattedValue = des.children[0].text;
                        }
                    });
                    setNlSearchInput(formattedValue);
                    const { selection } = editor;

                    if (selection && Range.isCollapsed(selection)) {
                        const [start] = Range.edges(selection);

                        const wordBefore = Editor.before(editor, start, {
                            unit: 'word',
                        });
                        const before =
                            wordBefore && Editor.before(editor, wordBefore);
                        let beforeRange =
                            before && Editor.range(editor, before, start);
                        if (!before) {
                            beforeRange = Editor.range(
                                editor,
                                { offset: 0, path: [0, 0] },
                                start
                            );
                            setIsFirstWord(true);
                        } else {
                            setIsFirstWord(false);
                        }

                        const beforeText =
                            beforeRange && Editor.string(editor, beforeRange);
                        // const formattedBeforeText = beforeText?.trim();
                        const beforeMatch =
                            beforeText && beforeText.match(/(\w+)$/);

                        if (beforeMatch) {
                            setTarget(beforeRange);
                            setSearch(beforeMatch[0]);
                            setIndex(0);
                            return;
                        }
                    }

                    setTarget(null);
                }}
            >
                <Editable
                    className="autoComplete"
                    renderPlaceholder={({ children, attributes }) => {
                        attributes.style.top = undefined;
                        return <span {...attributes}>{children}</span>;
                    }}
                    onKeyDown={onKeyDown}
                    placeholder="Ex. Show me all clips from site Alpha today..."
                    onDOMBeforeInput={handleBeforeInput}
                    onPaste={handlePaste}
                />
                {target && chars.length > 0 && (
                    <div
                        ref={ref}
                        style={{
                            top: '-9999px',
                            left: '-9999px',
                            position: 'absolute',
                            zIndex: 1,
                            padding: '3px',
                            background: 'white',
                            borderRadius: '4px',
                            boxShadow: '0 1px 5px rgba(0,0,0,.2)',
                        }}
                        data-cy="mentions-portal"
                    >
                        {chars.map((char, i) => (
                            <div
                                key={char}
                                onClick={() => {
                                    Transforms.select(editor, target);
                                    insertText(editor, char + ' ', isFirstWord);
                                    setTarget(null);
                                }}
                                style={{
                                    padding: '1px 3px',
                                    borderRadius: '3px',
                                    color: 'black',
                                    background:
                                        i === index ? '#B4D5FF' : 'transparent',
                                }}
                            >
                                {char}
                            </div>
                        ))}
                    </div>
                )}
            </Slate>
            {searchError && (
                <p id="autocomplete-error" style={styles}>
                    {searchError}
                </p>
            )}
            <div
                style={{
                    paddingTop: '1rem',
                    display: 'flex',
                }}
            >
                <button
                    className="btn primary"
                    type="submit"
                    style={{ marginRight: '1rem' }}
                    onClick={onSubmit}
                >
                    Search
                </button>
                <button
                    className="btn danger"
                    type="button"
                    // onClick={clearInput}
                    onClick={clearAISearchInput}
                >
                    Clear
                </button>
            </div>
        </>
    );
};

export default AutoComplete;
